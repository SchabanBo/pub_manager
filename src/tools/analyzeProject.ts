import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { getPubspecContent, getTheProjectName, walkDirectory } from '../utils';
import { filesCount } from './filesCount';

const PROJECT_NAME = getTheProjectName();

export function runAnalyzer(basePath: string): AnalyzerResult {
    const files = walkDirectory(basePath);
    const usedFiles = new Set<string>();
    const unusedFiles = new Set<string>();
    const usedPackages = new Set<string>();
    const unusedPackages = new Set<string>();

    /// this function will convert the import path to the correct one
    /// there are three cases:
    /// 1- the file is imported from the lib directory directly
    /// 2- the file is imported as relative path
    /// 3- the file is imported as package
    function fixImportPath(currentPath: string, importLine: string): string | undefined {
        const importPath = importLine.split('\'')[1];
        if (importPath.startsWith('package:' + PROJECT_NAME)) {
            return importPath.replace('package:' + PROJECT_NAME, '');
        }

        if (importPath.startsWith('package:')) {
            const packageName = importPath.split('/')[0];
            usedPackages.add(packageName.replace('package:', ''));
            return undefined;
        }

        const possiblePaths = [path.resolve(currentPath, importPath), path.resolve(basePath, importPath)];
        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
                return possiblePath;
            }
        }

        return undefined;
    }

    for (const file of files) {
        if (!file.endsWith('.dart')) continue;
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
            if (line.startsWith('import')) {
                const importedFilePath = fixImportPath(path.dirname(file), line);
                if (importedFilePath) {
                    usedFiles.add(importedFilePath);
                }
            }
        }
    }

    const filesToIgnore = [
        'main.dart', 'firebase_options.dart'
    ];

    for (const file of files) {
        if (!usedFiles.has(file) && !filesToIgnore.includes(path.basename(file))) {
            unusedFiles.add(file);
        }
    }

    console.debug('Used packages:', usedPackages);
    console.debug('Unused files:', unusedFiles);

    /// filter packages that are not used
    let pubspecContent = getPubspecContent();
    if (pubspecContent !== undefined) {
        const pubspec = yaml.parse(pubspecContent);
        const dependencies = Object.keys(pubspec.dependencies);
        for (const dependency of dependencies) {
            if (!usedPackages.has(dependency)) {
                unusedPackages.add(dependency);
            }
        }
    }
    const projectFilesCount = filesCount(basePath);
    return {
        unusedFiles: unusedFiles,
        unusedPackages: unusedPackages,
        filesCount: projectFilesCount
    };
}

export function formatAnalyzerResults(result: AnalyzerResult): string {
    let resultsHtml = `<h4>Files count: ${result.filesCount}</h4>`;
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

export interface AnalyzerResult {
    unusedFiles: Set<string>;
    unusedPackages: Set<string>;
    filesCount: number;
}