import { Container } from "../helpers/container";
import { fetchOutdatedData, fetchPackageData } from "./apiService";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as semver from "semver";
import { AnalyzerResult } from "./analysisService";
import { Package } from "../models";
import { runCommandInCurrentDire } from "../helpers/utils";

export class HtmlService {
  private _fontSize: number;

  constructor() {
    this._fontSize =
      vscode.workspace.getConfiguration().get<number>("editor.fontSize") || 18;
  }

  public async getPanelHtml(): Promise<string> {
    return `
      <style>${this.getCssContent()}</style>
      ${this.getHeader()}
      <hr/>
      ${await this.getTable()}
      <h2>Flutter</h2>
      <hr/>
      <ul id="flutterVersion"></ul>
      ${this.getAnalyzer()}
      <script>${this.getJsContent()}</script>
      <script src="https://www.kryogenix.org/code/browser/sorttable/sorttable.js"></script>`;
  }

  private getHeader(): string {
    const projectName = Container.getYamlService()
      .getTheProjectName()
      ?.toUpperCase();
    this.getFlutterInfo();
    return `
      <div class="refresh-container">
        <h2>${projectName}</h2>
        <div class="spacer"></div>
        <button id="addPackage" class="toolbar-button" onclick="handleAddPackageClick()">Add package</button>
        <button id="updateAll" class="toolbar-button" onclick="handleUpdateAllClick()" style="margin-left: 16px;">Update all</button>
        <button id="refreshButton" class="toolbar-button" onclick="handleRefreshClick()" style="margin-left: 16px;">Refresh</button>        
      </div>`;
  }

  private async getFlutterInfo(): Promise<void> {
    if (!Container.cache.flutterVersion) {
      const result = await runCommandInCurrentDire("flutter --version");
      if (result === "") {
        return;
      }
      Container.cache.flutterVersion = result;
    }

    Container.getPanelService().postMessage({
      command: "displayFlutterVersion",
      results: Container.cache.flutterVersion.split("\n"),
    });
  }

  private getAnalyzer(): string {
    return `
      <div class="analytics-container">
          <h2>Static analyzer</h2>
          <div class="spacer"></div>
          <button id="analyzeButton" class="toolbar-button" onclick="handleAnalyzeClick()">Analyze Project</button>
      </div>
      <hr/>
      <div id="resultsContainer" class="results-container">
          <p id="analyzerLoadingMessage" class="hidden">Running analyzer...</p>
          <ul id="unusedFilesList" class="hidden"></ul>
      </div>
      <div class="licenses-container" id="licensesContainer"></div>`;
  }

  private getCssContent(): string {
    let cssContent = fs.readFileSync(
      path.join(
        Container.getExtensionContext().extensionPath,
        "assets/panel",
        "styles.css"
      ),
      "utf-8"
    );
    return cssContent.replace("FONT_SIZE", this._fontSize.toString());
  }

  private getJsContent(): string {
    return fs.readFileSync(
      path.join(
        Container.getExtensionContext().extensionPath,
        "assets/panel",
        "scripts.js"
      ),
      "utf-8"
    );
  }

  private async getTable(): Promise<String> {
    this.prepareTable();
    return `
        <p id="packagesLoadingMessage">Analyzing packages...</p>
        <table id="packagesTable" class="hidden package-table sortable"></table>
      `;
  }

  private async prepareTable(): Promise<void> {
    const dependencies = Container.getYamlService().getPubspecDependencies();
    const packages = await Promise.all(
      dependencies.map(this.getRow.bind(this))
    );
    Container.cache.packages = dependencies;
    const needUpdate = packages.filter((d) => d.includes("upgrade.svg")).length;
    const table = `
    <tr>
    <th>${needUpdate}/${packages.length}</th>
    <th>Package</th>
    <th>Current</th>
    <th>Update to</th>
    <th></th>
        </tr>
        ${packages.join("")}
        `;
    const licensesGroups: { [name: string]: string[] } = {};

    for (const dependency of dependencies) {
      const license = dependency.data?.licenses[0] || "Unknown";
      if (licensesGroups[license]) {
        licensesGroups[license].push(dependency.name);
      } else {
        licensesGroups[license] = [dependency.name];
      }
    }
    let licenses = `<h2>Licenses summery</h2><hr/>`;
    for (const name in licensesGroups) {
      licenses += `<h4>${name.toUpperCase()}:</h4> ${licensesGroups[name].join(
        " | "
      )}`;
    }
    licenses += `</div>`;
    const ready = Container.cache.ready;
    Container.getPanelService().postMessage({
      command: "displayPackagesResults",
      results: { table, licenses, ready },
    });
    if (!ready) {
      fetchOutdatedData();
    }
  }

  private async getRow(dependency: Package, index: number): Promise<string> {
    try {
      const data = await this.getRowData(dependency);
      return `
        <tr id="row-${index}" onclick="toggleExpandableRow(${index})">
          <td>${data.updateButton}</td>
          <td style="font-size:${this._fontSize + 2}px">${
        data.dependencyName
      }</td>
          <td>${data.currentVersion}</td>
          <td>${data.nextVersion}
            <span style="font-size:${this._fontSize - 4}px"> ${
        data.publishedDate
      }</span>
          </td>
          <td>${data.removeButton}</td>
        </tr>
        <tr id="expandable-row-${index}" class="expandable-row" style="display: none;">
          <td colspan="5">
            <p>${data.description}</p>
            <div>
             ${data.infos.join("</br>")}
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

  private async getRowData(dependency: Package): Promise<RowData> {
    const currentVersion = dependency.currentVersion;
    const name = dependency.name;
    if (!dependency.data) {
      dependency.data = await fetchPackageData(name);
    }
    const packageData = dependency.data;
    const description = packageData.description;
    const devTag = dependency.isDevDependency
      ? `<span class="dev-tag">dev</span>`
      : "";
    const dependencyName = `${devTag} <a href="https://pub.dev/packages/${name}" target="_blank">${name}</a>`;
    const removeButton = `<button class="remove-button" onclick="event.stopPropagation();handleRemoveClick('${name}')">X</button>`;
    const publishedDate = packageData.publishedDate;
    const platformsTags =
      "<b>Platforms:</b> " + packageData.platformTags.join(" | ");
    const isTags = "<b>Supports:</b> " + packageData.isTags.join(" | ");
    const licenses = "<b>Licenses:</b> " + packageData.licenses.join(" | ");
    if (dependency.gitHistory === "") {
      dependency.gitHistory = await Container.getYamlService().getGitHistory(
        dependency.lineNumber
      );
    }
    const gitHistory = dependency.gitHistory
      ? `<b>Git History:</b> ${dependency.gitHistory}`
      : "";
    const infos = [platformsTags, isTags, licenses, gitHistory];
    if (packageData.latestVersion === "") {
      return {
        dependencyName,
        currentVersion,
        nextVersion: "-",
        publishedDate,
        updateButton: "-",
        removeButton,
        description,
        infos,
      };
    }
    const canBeUpdated = semver.gt(
      packageData.resolvable ?? packageData.latestVersion,
      currentVersion
    );
    const nextVersionText = packageData.resolvable
      ? `${packageData.resolvable} (resolvable) - ${packageData.latestVersion} (latest)`
      : packageData.latestVersion;
    const nextVersion = `<a href="https://pub.dev/packages/${name}/changelog" target="_blank">${nextVersionText}</a>`;
    const updateButton = canBeUpdated
      ? `<a><img src="${this.getIconPath(
          "upgrade.svg"
        )}" alt="Upgrade" class="icon" onclick="event.stopPropagation();handleUpdateClick('${name}')"><p hidden>1</p></a>`
      : `<img src="${this.getIconPath(
          "check.svg"
        )}" alt="latest version" class="icon"><p hidden>0</p></img>`;
    return {
      dependencyName,
      currentVersion,
      nextVersion: nextVersion,
      publishedDate,
      updateButton,
      removeButton,
      description,
      infos,
    };
  }

  private _addPackageToLicenses(
    name: string,
    license: string | undefined
  ): void {}

  public formatAnalyzerResults(result: AnalyzerResult): string {
    let resultsHtml = `<div class="results-columns">`;
    resultsHtml += `<h4>Files count: ${result.filesCount}</h4>`;
    resultsHtml += `<h4>Lines count: ${result.totalLinesCount}</h4>`;
    resultsHtml += `</div>`;
    resultsHtml += '<div class="results-columns">';

    // Display used packages
    if (result.unusedPackages.size > 0) {
      resultsHtml += '<div class="results-column">';
      resultsHtml += "<h2>Unused Packages:</h2>";
      resultsHtml += "<ul>";
      for (const unusedPackage of result.unusedPackages) {
        resultsHtml += `<li>${unusedPackage}</li>`;
      }
      resultsHtml += "</ul>";
      resultsHtml += "</div>";
    } else {
      resultsHtml += '<div class="results-column">';
      resultsHtml += "<h2>No unused packages found</h2>";
      resultsHtml += "</div>";
    }

    // Display unused files
    if (result.unusedFiles.size > 0) {
      resultsHtml += '<div class="results-column">';
      resultsHtml += "<h2>Unused Files:</h2>";
      resultsHtml += "<ul>";
      for (const unusedFile of result.unusedFiles) {
        resultsHtml += `<li>${unusedFile}</li>`;
      }
      resultsHtml += "</ul>";
      resultsHtml += "</div>";
    } else {
      resultsHtml += '<div class="results-column">';
      resultsHtml += "<h2>No unused files found</h2>";
      resultsHtml += "</div>";
    }

    resultsHtml += "</div>";

    return resultsHtml;
  }
}

interface RowData {
  dependencyName: string;
  currentVersion: string;
  nextVersion: string;
  publishedDate: string;
  updateButton: string;
  removeButton: string;
  description: string;
  infos: string[];
}
