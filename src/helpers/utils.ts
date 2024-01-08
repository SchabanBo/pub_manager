import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import path = require('path');

export async function runPubGetCommand(): Promise<void> {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const cwd = workspaceFolder!.uri.fsPath;
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
                console.error(error);
                reject(error);
            } else if (stderr) {
                console.error(stderr);
                reject(new Error(stderr));
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

export function walkDirectory(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((file) => file.isDirectory() ? walkDirectory(path.join(dir, file.name)) : path.join(dir, file.name))
}