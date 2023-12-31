import path = require('path');
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as yaml from 'yaml';
import * as semver from 'semver';

export class YamlService {
    private _yamlPath: String | undefined;
    constructor() {
        if (this.initialize()) {
            console.log('pubspec.yaml file found ' + this._yamlPath);
        }
    }

    /// Initialize the yamlService
    private initialize(): boolean {
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
                this._yamlPath = activeFilePath;
                return true;
            }
        }

        /// Otherwise, use the first pubspec.yaml file found in the workspace
        const pubspecPath = vscode.Uri.joinPath(workspaceFolder.uri, 'pubspec.yaml');
        this._yamlPath = pubspecPath.fsPath;
        return true;
    }

    /// Get the name of the project from the pubspec.yaml file
    public getTheProjectName() {
        const lines = this.readLines();
        for (const line of lines) {
            if (line.includes('name')) {
                return line.split(':')[1].trim();
            }
        }
        return undefined;
    }

    /// read the pubspec.yaml file content
    private readString(): string {
        if (this._yamlPath === undefined) return '';
        return fs.readFileSync(this._yamlPath.toString(), 'utf8');
    }

    /// Read the lines of the pubspec.yaml file
    private readLines(): string[] {
        if (this._yamlPath === undefined) return [];
        const fileContent = fs.readFileSync(this._yamlPath.toString(), 'utf8');
        return fileContent.split('\n');
    }

    /// Write the lines of the pubspec.yaml file
    private writeLines(lines: string[]): void {
        if (this._yamlPath === undefined) return;
        fs.writeFileSync(this._yamlPath.toString(), lines.join('\n'), 'utf8');
    }

    /// Get the dependencies from the pubspec.yaml file
    public getPubspecDependencies(): PubspecDependencies[] {
        const pubspecContent = this.readString();
        const pubspec = yaml.parse(pubspecContent);
        return Object.keys(pubspec.dependencies)
            .map((dependency) => {
                const name = pubspec.dependencies[dependency];
                if (typeof name !== 'string') return null;
                const currentVersion = pubspec.dependencies[dependency].toString().replace(/[\^~]/, '').toString();
                if (semver.valid(currentVersion) === null) return null;
                return {
                    dependencyName: dependency,
                    currentVersion,
                };
            })
            .filter((dependency) => dependency !== null) as PubspecDependencies[];
    }

    /// remove a dependency from the pubspec.yaml file
    public removeDependency(packageName: string): void {
        const lines = this.readLines();
        const updatedLines = lines.filter((line) => {
            const trimmedLine = line.trim();
            return !trimmedLine.startsWith(packageName + ':');
        });
        this.writeLines(updatedLines);
    }

    /// modify a dependency to the pubspec.yaml file
    public modifyPubspecContent(packageName: string, newVersion: string): void {
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

export interface PubspecDependencies {
    dependencyName: string;
    currentVersion: string;
}