// commands.ts
import * as vscode from 'vscode';
import { Container } from './helpers/container';

export function registerCommands(context: vscode.ExtensionContext) {
  let panelCommand = vscode.commands.registerCommand('extension.showPackagesPanel', () => {
    const panel = vscode.window.createWebviewPanel('packageListPanel', 'Pub Manager', vscode.ViewColumn.One);
    panel.iconPath = vscode.Uri.file(context.asAbsolutePath('/assets/icons//list-dark.png'));
    panel.webview.options = { enableScripts: true };
    const container = new Container(context, panel);
    Container.setInstance(container);
    panel.webview.onDidReceiveMessage((m) => Container.getPanelMessagesService().handleMessage(m));
    panel.onDidDispose(container.clear);
    Container.getPanelService().update();
  });

  context.subscriptions.push(panelCommand);
}
