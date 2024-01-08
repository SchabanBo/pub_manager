import { Container } from "../helpers/container";
import { fetchPackageData } from "./apiService";
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';
import { PubspecDependencies } from "./yamlService";
import { AnalyzerResult } from "./analysisService";

export class HtmlService {
  private _fontSize: number;

  constructor() {
    this._fontSize = vscode.workspace.getConfiguration().get<number>('editor.fontSize') || 18;;
  }

  public async getPanelHtml(): Promise<string> {
    return `
      <style>${this.getCssContent()}</style>
      ${this.getHeader()}
      <hr/>
      ${await this.getTable()}
      ${this.getAnalyzer()}
      <script>${this.getJsContent()}</script>
      <script src="https://www.kryogenix.org/code/browser/sorttable/sorttable.js"></script>`;
  }

  private getHeader(): string {
    const projectName = Container.getYamlService().getTheProjectName()?.toUpperCase();
    return `
      <div class="refresh-container">
        <h2>${projectName}</h2>
        <div class="spacer"></div>
        <button id="addPackage" class="toolbar-button" onclick="handleAddPackageClick()">Add package</button>
        <button id="refreshButton" class="toolbar-button" style="margin-left: 16px;">Refresh</button>
      </div>`;
  }

  private getAnalyzer(): string {
    return `
      <div class="analytics-container">
          <h2>Static analyzer</h2>
          <div class="spacer"></div>
          <button id="analyzeButton" class="toolbar-button">Analyze Project</button>
      </div>
      <hr/>
      <div id="resultsContainer" class="results-container">
          <p id="loadingMessage" class="hidden">Running analyzer...</p>
          <ul id="unusedFilesList" class="hidden"></ul>
      </div>`;
  }

  private getCssContent(): string {
    let cssContent = fs.readFileSync(path.join(Container.getExtensionContext().extensionPath, 'assets/panel', 'styles.css'), 'utf-8');
    return cssContent.replace('FONT_SIZE', this._fontSize.toString());
  }

  private getJsContent(): string {
    return fs.readFileSync(path.join(Container.getExtensionContext().extensionPath, 'assets/panel', 'scripts.js'), 'utf-8');
  }

  private async getTable(): Promise<String> {
    const dependencies = Container.getYamlService().getPubspecDependencies();
    const packageDataList = await Promise.all(dependencies.map(this.getRow.bind(this)));
    return `
      <table class="package-table sortable">
        <tr>
          <th></th>
          <th>Package</th>
          <th>Version</th>
          <th>Latest Version</th>
          <th></th>
        </tr>
        ${packageDataList.join('')}
      </table>`;
  }

  private async getRow(dependency: PubspecDependencies, index: number): Promise<string> {
    try {
      const data = await this.getRowData(dependency, index);
      return `
        <tr id="row-${index}" onclick="toggleExpandableRow(${index})">
          <td>${data.updateButton}</td>
          <td>${data.dependencyName}</td>
          <td>${data.currentVersion}</td>
          <td>${data.latestVersion}
            <span style="font-size:${this._fontSize - 4}px"> ${data.publishedDate}</span>
          </td>
          <td>${data.removeButton}</td>
        </tr>
        <tr id="expandable-row-${index}" class="expandable-row" style="display: none;">
          <td colspan="5">
            <p>${data.description}</p>
            <div>
             ${data.infos.join('</br>')}
            </div>
          </td>
        </tr>`;
    } catch (error) {
      console.error(error);
      return ``;
    }

  }

  private getIconPath(iconName: string): vscode.Uri {
    return Container.getPanelService().getIconPath(iconName);
  }

  private async getRowData(dependency: PubspecDependencies, index: number): Promise<RowData> {
    const currentVersion = dependency.currentVersion;
    const name = dependency.dependencyName;
    const packageData = await fetchPackageData(name);
    const description = packageData.description;
    const dependencyName = `<a href="https://pub.dev/packages/${name}" target="_blank">${name}</a>`;
    const removeButton = `<button class="remove-button" onclick="handleRemoveClick('${name}')">X</button>`;
    const publishedDate = packageData.publishedDate;
    const platformsTags = '<b>Platforms:</b> ' + packageData.platformTags.join(' | ');
    const isTags = '<b>Supports:</b> ' + packageData.isTags.join(' | ');
    const licenses = '<b>Licenses:</b> ' + packageData.licenses.join(' | ');
    const gitHistoryInfo = await Container.getYamlService().getGitHistory(dependency.lineNumber);
    const gitHistory = gitHistoryInfo ? `<b>Git History:</b> ${gitHistoryInfo}` : '';
    const infos = [platformsTags, isTags, licenses, gitHistory];
    if (packageData.latestVersion === '') {
      return {
        dependencyName,
        currentVersion,
        latestVersion: '-',
        publishedDate,
        updateButton: '-',
        removeButton, description,
        infos,
      };
    }
    const canBeUpdated = semver.gt(packageData.latestVersion, currentVersion);
    const latestVersion = `<a href="https://pub.dev/packages/${name}/changelog" target="_blank">${packageData.latestVersion}</a>`;
    const updateButton = canBeUpdated
      ? `<a><img src="${this.getIconPath('upgrade.svg')}" alt="Upgrade" class="icon" onclick="handleUpdateClick('${name}', '${packageData.latestVersion}')"><p hidden>1</p></a>`
      : `<img src="${this.getIconPath('check.svg')}" alt="latest version" class="icon"><p hidden>0</p></img>`;
    return {
      dependencyName,
      currentVersion,
      latestVersion,
      publishedDate,
      updateButton,
      removeButton,
      description,
      infos,
    };
  }

  public formatAnalyzerResults(result: AnalyzerResult): string {
    let resultsHtml = `<div class="results-columns">`;
    resultsHtml += `<h4>Files count: ${result.filesCount}</h4>`;
    resultsHtml += `<h4>Lines count: ${result.totalLinesCount}</h4>`;
    resultsHtml += `</div>`;
    resultsHtml += '<div class="results-columns">';

    // Display used packages
    if (result.unusedPackages.size > 0) {
      resultsHtml += '<div class="results-column">';
      resultsHtml += '<h2>Unused Packages:</h2>';
      resultsHtml += '<ul>';
      for (const unusedPackage of result.unusedPackages) {
        resultsHtml += `<li>${unusedPackage}</li>`;
      }
      resultsHtml += '</ul>';
      resultsHtml += '</div>';
    } else {
      resultsHtml += '<div class="results-column">';
      resultsHtml += '<h2>No unused packages found</h2>';
      resultsHtml += '</div>';
    }


    // Display unused files
    if (result.unusedFiles.size > 0) {
      resultsHtml += '<div class="results-column">';
      resultsHtml += '<h2>Unused Files:</h2>';
      resultsHtml += '<ul>';
      for (const unusedFile of result.unusedFiles) {
        resultsHtml += `<li>${unusedFile}</li>`;
      }
      resultsHtml += '</ul>';
      resultsHtml += '</div>';
    } else {
      resultsHtml += '<div class="results-column">';
      resultsHtml += '<h2>No unused files found</h2>';
      resultsHtml += '</div>';
    }

    resultsHtml += '</div>';

    return resultsHtml;
  }
}

interface RowData {
  dependencyName: string;
  currentVersion: string;
  latestVersion: string;
  publishedDate: string;
  updateButton: string;
  removeButton: string;
  description: string;
  infos: string[]
}