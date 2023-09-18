import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { getPubspecContent, getTheProjectName, walkDirectory } from '../utils';

const PROJECT_NAME = getTheProjectName();

export function runAnalyzer(basePath: string): AnalyzerResult {
    const files = walkDirectory(basePath).map((file) => new ProjectFile(file));
    let filesCount = 0;
    let totalLinesCount = 0;

    /// this function will convert the import path to the correct one
    /// there are three cases:
    /// 1- the file is imported from the lib directory directly
    /// 2- the file is imported as relative path
    /// 3- the file is imported as package
    function fixImportPath(file: ProjectFile, importLine: string): string | undefined {
        const currentPath = path.dirname(file.path);
        let importPath = importLine.split('\'')[1];
        if (importPath.startsWith('package:' + PROJECT_NAME)) {
            importPath = importPath.replace('package:' + PROJECT_NAME, '');
        }

        if (importPath.startsWith('package:')) {
            const packageName = importPath.split('/')[0];
            file.usesPackages.push(packageName.replace('package:', ''));
            return undefined;
        }

        const possiblePaths = [path.join(currentPath, importPath), path.join(basePath, importPath)];
        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
                return possiblePath;
            }
        }

        return undefined;
    }

    for (const file of files) {
        if (!file.name.endsWith('.dart')) continue;
        filesCount++;
        const content = fs.readFileSync(file.path, 'utf8');
        const lines = content.split('\n');
        totalLinesCount += lines.length;
        for (const line of lines) {
            if (line.startsWith('import') || line.startsWith('part')) {
                const importedFilePath = fixImportPath(file, line);
                if (importedFilePath) {
                    file.usesFiles.push(importedFilePath);
                }
            }
        }
        /// find all classes in the file
        const classRegex = /class\s+(\w+)\s*(?:extends\s+(\w+))?\s*(?:implements\s+(\w+(?:,\s*\w+)*))?\s*{/g;
        let match;
        while ((match = classRegex.exec(content)) !== null) {
            const className = match[1];
            const classPath = `${file.path}:${match.index}`;
            const extendsClass = match[2] || null;
            const implementsClasses = match[3] || null;
            const usesClasses: ProjectUsedClass[] = [];

            // Find all used classes in the class
            const classText = content.substring(match.index, match.index + match[0].length);
            const usedClassRegex = /new\s+(\w+)\s*\(/g;
            let usedClassMatch;
            while ((usedClassMatch = usedClassRegex.exec(classText)) !== null) {
                const usedClassName = usedClassMatch[1];
                const usedClassPath = `${file.path}:${match.index + usedClassMatch.index}`;
                const usedClassLines = usedClassMatch[0].split('\n').length;

                usesClasses.push({
                    name: usedClassName,
                    path: usedClassPath,
                    lines: usedClassLines
                });
            }

            file.classes.push({
                name: className,
                path: classPath,
                extends: extendsClass,
                implements: implementsClasses,
                usesClasses: usesClasses
            });
        }
    }

    console.log(JSON.stringify(files));

    const unusedFiles = new Set<string>();
    const unusedPackages = new Set<string>();
    const filesToIgnore = [
        'main.dart', 'firebase_options.dart'
    ];

    const usedFiles = files.flatMap((file) => file.usesFiles);
    for (const file of files) {
        if (filesToIgnore.includes(file.name)) continue;
        if (!usedFiles.includes(file.path)) {
            unusedFiles.add(file.path);
        }
    }

    /// filter packages that are not used
    const usedPackages = files.flatMap((file) => file.usesPackages);
    let pubspecContent = getPubspecContent();
    if (pubspecContent !== undefined) {
        const pubspec = yaml.parse(pubspecContent);
        const dependencies = Object.keys(pubspec.dependencies);
        for (const dependency of dependencies) {
            if (!usedPackages.includes(dependency)) {
                unusedPackages.add(dependency);
            }
        }
    }
    return {
        unusedFiles: unusedFiles,
        unusedPackages: unusedPackages,
        filesCount: filesCount,
        totalLinesCount: totalLinesCount
    };
}

export function formatAnalyzerResults(result: AnalyzerResult): string {
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


class ProjectFile {
    name: string;
    path: string;
    usesFiles: string[];
    usesPackages: string[];
    classes: ProjectClass[];

    constructor(file: string) {
        this.name = path.basename(file);
        this.path = file;
        this.usesFiles = [];
        this.usesPackages = [];
        this.classes = [];
    }
}

interface ProjectClass {
    name: string;
    path: string;
    extends: String | null;
    implements: String | null;
    usesClasses: ProjectUsedClass[];
}

interface ProjectUsedClass {
    name: string;
    path: string;
    lines: number;
}

interface AnalyzerResult {
    unusedFiles: Set<string>;
    unusedPackages: Set<string>;
    filesCount: number;
    totalLinesCount: number;
}