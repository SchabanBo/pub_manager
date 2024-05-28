import path = require('path');
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as yaml from 'yaml';
import * as semver from 'semver';
import { runCommand } from '../helpers/utils';
import { fetchPackageData } from './apiService';
import { Package } from '../models';
import { Container } from '../helpers/container';

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

    /// Read the lines of the pubspec.yaml file
    private readLines(): string[] {
        if (this._yamlPath === undefined) {return [];}
        const fileContent = fs.readFileSync(this._yamlPath.toString(), 'utf8');
        return fileContent.split('\n');
    }

    /// Write the lines of the pubspec.yaml file
    private writeLines(lines: string[]): void {
        if (this._yamlPath === undefined) {return;}
        fs.writeFileSync(this._yamlPath.toString(), lines.join('\n'), 'utf8');
    }

    /// Get the dependencies from the pubspec.yaml file
    public getPubspecDependencies(): Package[] {
        if (Container.packages.length > 0) {return Container.packages;}
        const lines = this.readLines();
        const pubspec = yaml.parse(lines.join('\n'));
        function parse(dependency: string, version: string, isDevDependency: boolean): Package | null {
            if (typeof version !== 'string') {return null;}

            const currentVersion = version.replace(/[\^~]/, '');
            if (semver.valid(currentVersion) === null) {return null;}

            const line = lines.find((line) => line.includes(dependency) && line.includes(currentVersion));
            if (!line) {return null;}
            return {
                name: dependency,
                currentVersion,
                lineNumber: lines.indexOf(line),
                isDevDependency: isDevDependency,
                data: undefined,
                gitHistory: '',
            };
        }
        const dependencies = Object.keys(pubspec.dependencies).map((d) => parse(d, pubspec.dependencies[d], false));
        const devDependencies = Object.keys(pubspec.dev_dependencies).map((d) => parse(d, pubspec.dev_dependencies[d], true));

        return [...dependencies, ...devDependencies].filter(Boolean) as Package[];
    }


    public async getGitHistory(lineNumber: number): Promise<string> {
        try {
            const cwd = this._yamlPath?.toString().replace('pubspec.yaml', '');
            let result = await runCommand(`git blame -L ${lineNumber},${lineNumber} pubspec.yaml`, { cwd });
            const matches = result.match(/(\w+) \(([^)]+)\)/);
            if (!matches) {return '';}
            return `${matches[2]} (${matches[1]})`;
        } catch (error) {
            console.error(`Error fetching git history for ${path}:`, error);
            return '';
        }

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

    public async updateAllPackages(): Promise<void> {
        const dependencies = this.getPubspecDependencies();
        for (const dependency of dependencies) {
               const packageData = await fetchPackageData(dependency.name);
                const canBeUpdated = semver.gt(packageData.latestVersion,dependency.currentVersion);
        }
    }

}

