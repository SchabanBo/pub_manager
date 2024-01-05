import * as vscode from 'vscode';
import { PanelMessagesService } from '../services/panelMessagesService';
import { YamlService } from '../services/yamlService';
import { PanelService } from '../services/panelService';
import { Console } from 'console';


export class Container {
    private static instance: Container;
    private _container: { [key: string]: any } = {};

    public constructor(context: vscode.ExtensionContext, panel: vscode.WebviewPanel) {
        this.set(Container.extensionContext, context);
        this.set(Container.panelService, new PanelService(panel));
        this.set(Container.panelMessagesService, new PanelMessagesService());
        this.set(Container.yamlService, new YamlService());
    }

    public static setInstance(instance: Container): void {
        Container.instance = instance;
    }

    private static panelMessagesService = 'panelMessagesService';
    private static yamlService = 'yamlService';
    private static panelService = 'panelService';
    private static extensionContext = 'extensionContext';

    public static getExtensionContext(): vscode.ExtensionContext {
        return Container.instance.get<vscode.ExtensionContext>(Container.extensionContext);
    }

    public static getPanelService(): PanelService {
        return Container.instance.get<PanelService>(Container.panelService);
    }

    public static getPanelMessagesService(): PanelMessagesService {
        return Container.instance.get<PanelMessagesService>(Container.panelMessagesService);
    }

    public static getYamlService(): YamlService {
        return Container.instance.get<YamlService>(Container.yamlService);
    }

    public clear(): void {
        console.log('clearing pub manager container');
        Container.instance._container = {};
    }

    private get<T>(key: string): T {
        return this._container[key];
    }

    public set(key: string, value: any): void {
        this._container[key] = value;
    }

}