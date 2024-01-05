// commands.ts
import * as vscode from 'vscode';
import * as yaml from 'yaml';
import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';
import { Container } from './helpers/container';

export function registerCommands(context: vscode.ExtensionContext) {
  async function reloadPanelContent(panel: vscode.WebviewPanel) {
    let pubspecContent = getPubspecContent();
    if (pubspecContent === undefined) {
      panel.webview.html = '<p>No packages found.</p>';
      return;
    }

    try {
      const pubspec = yaml.parse(pubspecContent);
      if (pubspec && pubspec.dependencies) {
        const dependencies = Object.keys(pubspec.dependencies).filter((dependency) => {
          const name = pubspec.dependencies[dependency];
          if (typeof name !== 'string') {
            return false;
          }
          const currentVersion = pubspec.dependencies[dependency].toString().replace(/[\^~]/, '').toString();
          return semver.valid(currentVersion) !== null;
        });

        const packageDataList = await Promise.all(dependencies.map(async (dependency) => {
          const currentVersion = pubspec.dependencies[dependency].toString().replace(/[\^~]/, '').toString();
          const packageData = await fetchPackageData(dependency);
          const dependencyName = `<a href="https://pub.dev/packages/${dependency}" target="_blank">${dependency}</a>`;
          const removeButton = `<button class="remove-button" onclick="handleRemoveClick('${dependency}')">X</button>`;
          if (packageData.latestVersion === '') {
            return {
              dependencyName,
              currentVersion,
              subtitle: '',
              latestVersion: '-',
              publishedDate: '-',
              updateButton: '-',
              removeButton,
            };
          }
          const publishedDate = packageData.publishedDate;
          const canBeUpdated = semver.gt(packageData.latestVersion, currentVersion);
          const latestVersion = `<a href="https://pub.dev/packages/${dependency}/changelog" target="_blank">${packageData.latestVersion}</a>`;
          const updateButton = canBeUpdated
            ? `<a><img src="${panel.webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('/assets/icons/upgrade.svg')))}" alt="Upgrade" class="icon" onclick="handleUpdateClick('${dependency}', '${packageData.latestVersion}')"><p hidden>1</p></a>`
            : `<img src="${panel.webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('/assets/icons/check.svg')))}" alt="latest version" class="icon"><p hidden>0</p></img>`;
          const subtitle = '<b>Platforms:</b> ' + packageData.supposedPlatforms.join('-') + (packageData.dart3Compatible ? ' | Support Dart3' : '');
          return {
            dependencyName,
            currentVersion,
            subtitle,
            latestVersion,
            publishedDate,
            updateButton,
            removeButton,
          };
        }));
        const fontSize = vscode.workspace.getConfiguration().get<number>('editor.fontSize') || 18;
        const smallFontSize = fontSize - 4;
        let cssContent = fs.readFileSync(path.join(context.extensionPath, 'assets/panel', 'styles.css'), 'utf-8');
        cssContent = cssContent.replace('FONT_SIZE', fontSize.toString());
        const jsContent = fs.readFileSync(path.join(context.extensionPath, 'assets/panel', 'scripts.js'), 'utf-8');
        const actionsHTML = `<div class="refresh-container">
            <h2>${getTheProjectName()?.toUpperCase()}</h2>
            <div class="spacer"></div>
            <button id="addPackage" class="toolbar-button" onclick="handleAddPackageClick()">Add package</button>
            <button id="refreshButton" class="toolbar-button" style="margin-left: 16px;">Refresh</button>
          </div>
          <hr/>
          `;

        const tableHtml = `<table class="package-table sortable">
          <tr>
            <th></th>
            <th>Package</th>
            <th>Version</th>
            <th>Latest Version</th>
            <th></th>
          </tr>
          ${packageDataList
            .map((packageData, index) => `
            <tr id="row-${index}" onclick="toggleExpandableRow(${index})">
              <td>${packageData.updateButton}</td>
              <td>${packageData.dependencyName}</td>
              <td>${packageData.currentVersion}</td>
              <td>${packageData.latestVersion}
                <span style="font-size:${fontSize - 4}px"> ${packageData.publishedDate}</span>
              </td>
              <td>${packageData.removeButton}</td>
            </tr>
            <tr id="expandable-row-${index}" class="expandable-row" style="display: none;">
              <td colspan="5">${packageData.subtitle}</td>
            </tr>
          `).join('')}
        </table>`;

        const analyzerHtml = `<div class="analytics-container">
              <h2>Static analyzer</h2>
              <div class="spacer"></div>
              <button id="analyzeButton" class="toolbar-button">Analyze Project</button>
            </div>
            <hr/>
            <div id="resultsContainer" class="results-container">
              <p id="loadingMessage" class="hidden">Running analyzer...</p>
              <ul id="unusedFilesList" class="hidden"></ul>
          </div>`;

        panel.webview.html = `
          <style>${cssContent}</style>
          ${actionsHTML}
          ${tableHtml}
          ${analyzerHtml}
          <script>${jsContent}</script>
          <script src="https://www.kryogenix.org/code/browser/sorttable/sorttable.js"></script>
        `;
        return;
      }
    } catch (error) {
      console.error('Error parsing pubspec.yaml:', error);
    }
  }

  let panelCommand = vscode.commands.registerCommand('extension.showPackagesPanel', () => {
    const panel = vscode.window.createWebviewPanel('packageListPanel', 'Pub Manager', vscode.ViewColumn.One);
    panel.iconPath = vscode.Uri.file(context.asAbsolutePath('/assets/icons//list-dark.png'));
    panel.webview.options = { enableScripts: true };

    const container = new Container();
    Container.setInstance(container);

    panel.webview.onDidReceiveMessage(Container.getPanelMessagesService().handleMessage);
    panel.onDidDispose(container.clear);
  });

  context.subscriptions.push(panelCommand);
}
