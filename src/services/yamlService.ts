import path = require('path');
import * as vscode from 'vscode';
import * as fs from 'fs';

export class YamlService {
    private _yamlPath: String | undefined;
    constructor() {
    }

    /// Initialize the yamlService
    initialize(): boolean {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('Please open a pubspec.yaml file in a workspace before performing the update.');
            return false;
        }

        /// If the user has a pubspec.yaml file open, use that
        const activeFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
        if (activeFilePath) {
            const fileName = path.basename(activeFilePath);
            if (fileName === 'pubspec.yaml') {
                try {
                    const fileContent = fs.readFileSync(activeFilePath, 'utf8');
                    this._yamlPath = activeFilePath;
                    return true;
                } catch (error) {
                    console.error(`Error updating package: ${error}`);
                }
            }
        }

        /// Otherwise, use the first pubspec.yaml file found in the workspace
        const pubspecPath = vscode.Uri.joinPath(workspaceFolder.uri, 'pubspec.yaml');
        try {
            const fileContent = fs.readFileSync(pubspecPath.fsPath, 'utf8');
            this._yamlPath = pubspecPath.fsPath;
            return true;
        } catch (error) {
            console.error(`Error updating package: ${error}`);
        }
        return false;
    }

    /// Get the name of the project from the pubspec.yaml file
    getTheProjectName() {
        const lines = this.readLines();
        for (const line of lines) {
            if (line.includes('name')) {
                return line.split(':')[1].trim();
            }
        }
        return undefined;
    }

    /// Read the lines of the pubspec.yaml file
    readLines(): string[] {
        if (this._yamlPath === undefined) return [];
        const fileContent = fs.readFileSync(this._yamlPath.toString(), 'utf8');
        return fileContent.split('\n');
    }

    /// Write the lines of the pubspec.yaml file
    writeLines(lines: string[]): void {
        if (this._yamlPath === undefined) return;
        fs.writeFileSync(this._yamlPath.toString(), lines.join('\n'), 'utf8');
    }

    /// remove a dependency from the pubspec.yaml file
    removeDependency(packageName: string): void {
        const lines = this.readLines();
        const updatedLines = lines.filter((line) => {
            const trimmedLine = line.trim();
            return !trimmedLine.startsWith(packageName + ':');
        });
        this.writeLines(updatedLines);
    }

    /// modify a dependency to the pubspec.yaml file
    modifyPubspecContent(packageName: string, newVersion: string): void {
        const lines = this.readLines();
        const updatedLines = lines.map((line) => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith(packageName + ':')) {
                const lineParts = trimmedLine.split(':');
                const currentVersionMatch = lineParts[1].trim().match(/[\d.]+/);
                if (currentVersionMatch) {
                    const currentVersion = currentVersionMatch[0];
                    return line.replace(currentVersion, newVersion);
                }
            }
            return line;
        });
        this.writeLines(updatedLines);
    }

}