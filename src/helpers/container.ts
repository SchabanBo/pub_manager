import * as vscode from 'vscode';
import { PanelMessagesService } from '../services/panelMessagesService';
import { YamlService } from '../services/yamlService';
import { PanelService } from '../services/panelService';
import { Package } from '../models';
import { AnalysisService } from '../services/analysisService';
import { HtmlService } from '../services/htmlService';


export class Container {
    public static packages : Package[] = [] ;
    private static instance: Container;
    private _container: { [key: string]: any } = {};

    public constructor(context: vscode.ExtensionContext, panel: vscode.WebviewPanel) {
        this.set(Container.extensionContext, context);
        this.set(Container.panelService, new PanelService(panel));
        this.set(Container.panelMessagesService, new PanelMessagesService());
        this.set(Container.yamlService, new YamlService());
        this.set(Container.htmlService, new HtmlService());
        this.set(Container.analysisService, new AnalysisService());
    }

    public static setInstance(instance: Container): void {
        Container.instance = instance;
    }

    private static panelMessagesService = 'panelMessagesService';
    private static yamlService = 'yamlService';
    private static panelService = 'panelService';
    private static extensionContext = 'extensionContext';
    private static analysisService = 'analysisService';
    private static htmlService = 'htmlService';

    public static getHtmlService(): HtmlService {
        return Container.instance.get<any>(Container.htmlService);
    }

    public static getAnalysisService(): AnalysisService {
        return Container.instance.get<any>(Container.analysisService);
    }

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
        Container.packages = [];
    }

    private get<T>(key: string): T {
        return this._container[key];
    }

    public set(key: string, value: any): void {
        this._container[key] = value;
    }

}