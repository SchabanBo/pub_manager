import * as vscode from 'vscode';
import { runPubGetCommand } from '../utils';
import { formatAnalyzerResults, runAnalyzer } from '../tools/analyzeProject';
import { Container } from '../helpers/container';

export class PanelMessagesService {
    constructor() {
    }

    public async handleMessage(message: any): Promise<void> {
        if (message.command === 'updatePackage') {
            const packageName = message.package;
            const version = message.version;
            this.handleUpdateClick(packageName, version);
        } else if (message.command === 'addPackage') {
            await vscode.commands.executeCommand('dart.addDependency');
            Container.getPanelService().update();
        } else if (message.command === 'refreshPanel') {
            Container.getPanelService().update();
        } else if (message.command === 'removePackage') {
            const packageNameToRemove = message.package;
            this.handleRemoveClick(packageNameToRemove);
        } else if (message.command === 'analyzeProject') {
            this.runAnalyzer();
        }
    }

    async handleUpdateClick(packageName: string, newVersion: string) {
        console.log('Update clicked for package:', packageName);
        try {
            Container.getYamlService().modifyPubspecContent(packageName, newVersion);
            await runPubGetCommand();
            Container.getPanelService().update();
            vscode.window.showInformationMessage(`Updated package: ${packageName} to version ${newVersion}`);
        } catch (error) {
            console.error(`Error updating package: ${packageName}`, error);
        }
    }

    async handleRemoveClick(packageName: string) {
        console.log('Remove clicked for package:', packageName);
        try {
            Container.getYamlService().removeDependency(packageName);
            await runPubGetCommand();
            Container.getPanelService().update();
            vscode.window.showInformationMessage(`Removed package: ${packageName}`);
        } catch (error) {
            console.error(`Error updating package: ${packageName}`, error);
        }
    }

    runAnalyzer(): void {
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
            Container.getPanelService().postMessage({ command: 'displayResults', results: formattedResults });
        });
    }
}