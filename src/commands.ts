// commands.ts
import * as vscode from 'vscode';
import * as yaml from 'yaml';
import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';
import { fetchPackageData } from './packageData';
import { getPubspecContent, handleUpdateClick, getTheProjectName } from './utils';
import { formatAnalyzerResults, runAnalyzer } from './tools/analyzeProject';
import { filesCount } from './tools/filesCount';

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
          const publishedDate = packageData.publishedDate;
          const canBeUpdated = semver.gt(packageData.latestVersion, currentVersion);
          const dependencyName = `<a href="https://pub.dev/packages/${dependency}" target="_blank">${dependency}</a>`;
          const latestVersion = `<a href="https://pub.dev/packages/${dependency}/changelog" target="_blank">${packageData.latestVersion}</a>`;
          const updateButton = canBeUpdated
            ? `<a><img src="${panel.webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('/assets/icons/upgrade.svg')))}" alt="Upgrade" class="icon" onclick="handleUpdateClick('${dependency}', '${packageData.latestVersion}')"></a>`
            : `<img src="${panel.webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('/assets/icons/check.svg')))}" alt="latest version" class="icon">`;
          return {
            dependencyName,
            currentVersion,
            latestVersion,
            publishedDate,
            updateButton,
          };
        }));
        const cssContent = fs.readFileSync(path.join(context.extensionPath, 'assets/panel', 'styles.css'), 'utf-8');
        const jsContent = fs.readFileSync(path.join(context.extensionPath, 'assets/panel', 'scripts.js'), 'utf-8');
        const actionsHTML = `<div class="refresh-container">
            <h2>${getTheProjectName()?.toUpperCase()}</h2>
            <div class="spacer"></div>
        
            <button id="refreshButton" class="toolbar-button" style="margin-left: 16px;">Refresh</button>
          </div>
          `;

        const tableHtml = `<table class="package-table">
          <tr>
            <th></th>
            <th>Package</th>
            <th>Version</th>
            <th>Latest Version</th>
            <th>Published Date</th>
          </tr>
          ${packageDataList
            .map(
              (packageData) => `<tr>
              <td>${packageData.updateButton}</td>
              <td>${packageData.dependencyName}</td>
              <td>${packageData.currentVersion}</td>
              <td>${packageData.latestVersion}</td>
              <td>${packageData.publishedDate}</td>
              </tr>`
            )
            .join('')}
        </table>`;

        const analyzerHtml = `<div class="analytics-container">
              <h2>Static analyzer</h2>
              <div class="spacer"></div>
              <button id="analyzeButton" class="toolbar-button">Analyze Project</button>
            </div>
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
    reloadPanelContent(panel);

    panel.webview.options = {
      enableScripts: true,
    };

    panel.webview.onDidReceiveMessage((message) => {
      if (message.command === 'updatePackage') {
        const packageName = message.package;
        const version = message.version;
        handleUpdateClick(packageName, version).then(() => {
          reloadPanelContent(panel);
        });
      } else if (message.command === 'refreshPanel') {
        reloadPanelContent(panel);
      } else if (message.command === 'analyzeProject') {
        vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: 'Running Project Analyzer',
        }, async () => {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          if (!workspaceFolder) {
            vscode.window.showErrorMessage('Please open a flutter project in the workspace');
            return;
          }
          const analyzerResult = runAnalyzer(vscode.Uri.joinPath(workspaceFolder.uri, 'lib').fsPath);
          const formattedResults = formatAnalyzerResults(analyzerResult);
          panel.webview.postMessage({ command: 'displayResults', results: formattedResults });
        });
      }
    });

  });

  context.subscriptions.push(panelCommand);
}
