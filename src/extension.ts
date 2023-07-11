import * as vscode from 'vscode';
import * as yaml from 'yaml';
import * as semver from 'semver';
import axios from 'axios';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { log } from 'console';

interface PackageData {
	latestVersion: string;
	publishedDate: string;
}

let pubspecContent = '';

function getPubspecContent(): string {
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor && activeEditor.document.languageId === 'yaml' && activeEditor.document.fileName.endsWith('pubspec.yaml')) {
		return activeEditor.document.getText();
	}
	return '';
}

function checkActiveEditor() {
	const content = getPubspecContent();
	const isPubspecFile = content.length > 0;
	if (isPubspecFile) {
		pubspecContent = content;
	}
	vscode.commands.executeCommand('setContext', 'isPubspecFile', isPubspecFile);
}

async function fetchPackageData(packageName: string): Promise<PackageData> {
	try {
		const response = await axios.get(`https://pub.dev/api/packages/${packageName}`);
		const latestVersion = response.data.latest.version;
		const versionInfo = await axios.get(`https://pub.dev/api/packages/${packageName}/versions/${latestVersion}`);
		const publishedDate = new Date(versionInfo.data.published).toLocaleDateString();
		return {
			latestVersion,
			publishedDate,
		};
	} catch (error) {
		console.error(`Error fetching package data for ${packageName}:`, error);
		return {
			latestVersion: '',
			publishedDate: '',
		};
	}
}

async function handleUpdateClick(packageName: string, newVersion: string) {
	console.log('Update clicked for package:', packageName);

	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		vscode.window.showErrorMessage('Please open a pubspec.yaml file in a workspace before performing the update.');
		return;
	}

	const pubspecPath = vscode.Uri.joinPath(workspaceFolder.uri, 'pubspec.yaml');
	try {
		const fileContent = fs.readFileSync(pubspecPath.fsPath, 'utf8');
		const updatedContent = modifyPubspecContent(fileContent, packageName, newVersion);
		pubspecContent = updatedContent;
		fs.writeFileSync(pubspecPath.fsPath, updatedContent, 'utf8');
		await runPubGetCommand(workspaceFolder.uri.fsPath);
		vscode.window.showInformationMessage(`Updated package: ${packageName} to version ${newVersion}`);
	} catch (error) {
		console.error(`Error updating package: ${packageName}`, error);
	}
}

function modifyPubspecContent(pubspecContent: string, packageName: string, newVersion: string): string {
	const lines = pubspecContent.split('\n');
	const updatedLines = lines.map((line) => {
		if (line.includes(packageName)) {
			const currentVersion = line.split(':')[1].trim();
			return line.replace(currentVersion, newVersion);
		}
		return line;
	});
	return updatedLines.join('\n');
}

async function runPubGetCommand(cwd: string): Promise<void> {
	try {
		await runCommand('flutter pub get', { cwd });
		console.log('flutter pub get executed successfully');
	} catch (error) {
		console.error('Error executing flutter pub get:', error);
	}
}

function runCommand(command: string, options: childProcess.ExecOptions): Promise<string> {
	return new Promise((resolve, reject) => {
		childProcess.exec(command, options, (error, stdout, stderr) => {
			if (error) {
				reject(error);
			} else if (stderr) {
				reject(new Error(stderr));
			} else {
				resolve(stdout.trim());
			}
		});
	});
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Pub manager is now active');

	let activeEditor = vscode.window.activeTextEditor;
	checkActiveEditor();

	vscode.window.onDidChangeActiveTextEditor((editor) => {
		activeEditor = editor;
		checkActiveEditor();
	});

	async function reloadPanelContent(panel: vscode.WebviewPanel) {
		if (pubspecContent.length === 0) {
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

				panel.webview.html = `
          <style>
            body {
              font-size: 18px;
            }
            a {
              text-decoration: none;
            }
            .icon {
              width: 24px;
              height: 24px;
              cursor: pointer;
            }
            .package-table {
              border-collapse: collapse;
              width: 100%;
            }
            .package-table th,
            .package-table td {
              padding: 8px;
              border-bottom: 1px solid var(--vscode-settings-textInputForeground);
            }
            .package-table th {
              text-align: left;
            }
          </style>
          ${tableHtml}
          <script>
            const vscode = acquireVsCodeApi();
            function handleUpdateClick(package, version) {
              vscode.postMessage({ command: 'updatePackage', package, version });
            }
          </script>
        `;
				return;
			}
		} catch (error) {
			console.error('Error parsing pubspec.yaml:', error);
		}
	}

	let disposable = vscode.commands.registerCommand('extension.showPackagesPanel', () => {
		const panel = vscode.window.createWebviewPanel('packageListPanel', 'Package List', vscode.ViewColumn.Two);
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
			}
		});

		vscode.window.onDidChangeActiveTextEditor(() => {
			checkActiveEditor();
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
