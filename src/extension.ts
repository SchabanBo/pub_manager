import * as vscode from 'vscode';
import { Container } from './helpers/container';

export function activate(context: vscode.ExtensionContext) {
	let panelCommand = vscode.commands.registerCommand('extension.showPubManagerPanel', () => {
		const panel = vscode.window.createWebviewPanel('pubManagerPanel', 'Pub Manager', vscode.ViewColumn.One);
		panel.iconPath = vscode.Uri.file(context.asAbsolutePath('/assets/icons//list-dark.png'));
		panel.webview.options = { enableScripts: true };
		const container = new Container(context, panel);
		Container.setInstance(container);
		panel.webview.onDidReceiveMessage((m) => Container.getPanelMessagesService().handleMessage(m));
		panel.onDidDispose(container.clear);
		Container.getPanelService().update();
	});

	context.subscriptions.push(panelCommand);
	let statusBarBtn = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	statusBarBtn.text = "$(package) Pub Manager";
	statusBarBtn.command = 'extension.showPubManagerPanel';
	statusBarBtn.tooltip = 'Show pub manager panel';
	statusBarBtn.show();
}

export function deactivate() { }
