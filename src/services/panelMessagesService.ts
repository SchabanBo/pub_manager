import * as vscode from 'vscode';
import { runPubGetCommand } from '../helpers/utils';
import { Container } from '../helpers/container';
import { HtmlService } from './htmlService';

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

    private async handleUpdateClick(packageName: string, newVersion: string) {
        console.log('Update clicked for package:', packageName);
        try {
            Container.getYamlService().modifyPubspecContent(packageName, newVersion);
            runPubGetCommand();
            Container.getPanelService().update();
            vscode.window.showInformationMessage(`Updated package: ${packageName} to version ${newVersion}`);
        } catch (error) {
            console.error(`Error updating package: ${packageName}`, error);
        }
    }

    private async handleRemoveClick(packageName: string) {
        console.log('Remove clicked for package:', packageName);
        try {
            Container.getYamlService().removeDependency(packageName);
            runPubGetCommand();
            Container.getPanelService().update();
            vscode.window.showInformationMessage(`Removed package: ${packageName}`);
        } catch (error) {
            console.error(`Error updating package: ${packageName}`, error);
        }
    }

    private runAnalyzer(): void {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Running Project Analyzer',
        }, async () => {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('Please open a flutter project in the workspace');
                return;
            }
            const analyzerResult = Container.getAnalysisService().runAnalyzer(vscode.Uri.joinPath(workspaceFolder.uri, 'lib').fsPath);
            const formattedResults = Container.getHtmlService().formatAnalyzerResults(analyzerResult);
            Container.getPanelService().postMessage({ command: 'displayResults', results: formattedResults });
        });
    }
}