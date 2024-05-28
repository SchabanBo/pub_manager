import path = require("path");
import { walkDirectory } from "../helpers/utils";
import { Container } from "../helpers/container";
import * as fs from 'fs';

export class AnalysisService {

    public runAnalyzer(basePath: string): AnalyzerResult {
        const files = walkDirectory(basePath).map((file) => new ProjectFile(file));
        const projectName = Container.getYamlService().getTheProjectName();
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
            if (importPath.startsWith('package:' + projectName)) {
                importPath = importPath.replace('package:' + projectName, '');
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
            if (!file.name.endsWith('.dart')) {continue;}
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
        }

        const unusedFiles = new Set<string>();
        const unusedPackages = new Set<string>();
        const filesToIgnore = [
            'main.dart', 'firebase_options.dart'
        ];

        const usedFiles = files.flatMap((file) => file.usesFiles);
        for (const file of files) {
            if (filesToIgnore.includes(file.name)) {continue;}
            if (!usedFiles.includes(file.path)) {
                unusedFiles.add(file.path);
            }
        }

        /// filter packages that are not used
        const usedPackages = files.flatMap((file) => file.usesPackages);
        const dependencies = Container.getYamlService().getPubspecDependencies();
        for (const dependency of dependencies) {
            if (!usedPackages.includes(dependency.name)) {
                unusedPackages.add(dependency.name);
            }
        }

        return {
            unusedFiles: unusedFiles,
            unusedPackages: unusedPackages,
            filesCount: filesCount,
            totalLinesCount: totalLinesCount
        };
    }
}


class ProjectFile {
    name: string;
    path: string;
    usesFiles: string[];
    usesPackages: string[];

    constructor(file: string) {
        this.name = path.basename(file);
        this.path = file;
        this.usesFiles = [];
        this.usesPackages = [];
    }
}


export interface AnalyzerResult {
    unusedFiles: Set<string>;
    unusedPackages: Set<string>;
    filesCount: number;
    totalLinesCount: number;
}