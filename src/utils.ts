import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { modifyPubspecContent, removeDependency } from './packageData';
import path = require('path');

export async function handleUpdateClick(packageName: string, newVersion: string) {
    console.log('Update clicked for package:', packageName);

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No pubspec.yaml file found in the workspace.');
        return;
    }

    const pubspecPath = vscode.Uri.joinPath(workspaceFolder.uri, 'pubspec.yaml');
    try {
        const fileContent = fs.readFileSync(pubspecPath.fsPath, 'utf8');
        const updatedContent = modifyPubspecContent(fileContent, packageName, newVersion);
        fs.writeFileSync(pubspecPath.fsPath, updatedContent, 'utf8');
        await runPubGetCommand(workspaceFolder.uri.fsPath);
        vscode.window.showInformationMessage(`Updated package: ${packageName} to version ${newVersion}`);
    } catch (error) {
        console.error(`Error updating package: ${packageName}`, error);
    }
}

export async function handleRemoveClick(packageName: string) {
    console.log('Remove clicked for package:', packageName);
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No pubspec.yaml file found in the workspace.');
        return;
    }

    const pubspecPath = vscode.Uri.joinPath(workspaceFolder.uri, 'pubspec.yaml');
    try {
        const fileContent = fs.readFileSync(pubspecPath.fsPath, 'utf8');
        const updatedContent = removeDependency(fileContent, packageName);
        fs.writeFileSync(pubspecPath.fsPath, updatedContent, 'utf8');
        await runPubGetCommand(workspaceFolder.uri.fsPath);
        vscode.window.showInformationMessage(`Removed package: ${packageName}`);
    } catch (error) {
        console.error(`Error updating package: ${packageName}`, error);
    }
}

export function getPubspecContent() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('Please open a pubspec.yaml file in a workspace before performing the update.');
        return;
    }
    const pubspecPath = vscode.Uri.joinPath(workspaceFolder.uri, 'pubspec.yaml');
    try {
        const fileContent = fs.readFileSync(pubspecPath.fsPath, 'utf8');
        return fileContent;
    } catch (error) {
        console.error(`Error updating package: ${error}`);
    }
}

export async function runPubGetCommand(cwd: string): Promise<void> {
    try {
        await runCommand('flutter pub get', { cwd });
        console.log('flutter pub get executed successfully');
    } catch (error) {
        console.error('Error executing flutter pub get:', error);
    }
}

export function runCommand(command: string, options: childProcess.ExecOptions): Promise<string> {
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

export function getTheProjectName() {
    const content = getPubspecContent();
    if (!content) return undefined;
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.includes('name')) {
            return line.split(':')[1].trim();
        }
    }
    return undefined;
}

export function walkDirectory(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((file) => file.isDirectory() ? walkDirectory(path.join(dir, file.name)) : path.join(dir, file.name))
}