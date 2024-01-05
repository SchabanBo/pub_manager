import * as vscode from 'vscode';
import { registerCommands } from './commands';

export function activate(context: vscode.ExtensionContext) {
	console.log('Pub manager is now active');
	registerCommands(context);
	let statusBarBtn = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	statusBarBtn.text = "$(package) Pub Manager";
	statusBarBtn.command = 'extension.showPackagesPanel';
	statusBarBtn.tooltip = 'Show pub manager panel';
	statusBarBtn.show();
}

export function deactivate() { }
