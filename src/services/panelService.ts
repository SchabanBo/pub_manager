import * as vscode from 'vscode';

export class PanelService {
    private _panel: vscode.WebviewPanel;

    constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
    }

    public postMessage(message: any): void {
        this._panel.webview.postMessage(message);
    }

    public update(): void { }
}