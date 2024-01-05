import * as vscode from 'vscode';
import { Container } from '../helpers/container';
import { fetchPackageData } from './apiService';
import { HtmlService } from './htmlService';

export class PanelService {
    private _panel: vscode.WebviewPanel;

    constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
    }

    public postMessage(message: any): void {
        this._panel.webview.postMessage(message);
    }

    public async update(): Promise<void> {
        this._panel.webview.html = await new HtmlService().getPanelHtml();
    }

    public getIconPath(iconName: string): vscode.Uri {
        const file = vscode.Uri.file(Container.getExtensionContext().asAbsolutePath(`/assets/icons/${iconName}`))
        return this._panel.webview.asWebviewUri(file);
    }

}