import * as vscode from 'vscode';
import { PanelMessagesService } from '../services/panelMessagesService';
import { YamlService } from '../services/yamlService';
import { PanelService } from '../services/panelService';


export class Container {
    private static instance: Container;
    private _container: { [key: string]: any } = {};

    public constructor() { }

    public static setInstance(instance: Container): void {
        Container.instance = instance;
    }

    private static panelMessagesService = 'panelMessagesService';
    private static yamlService = 'yamlService';
    private static panelService = 'panelService';

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
        Container.instance._container = {};
    }

    private get<T>(key: string): T {
        return this._container[key];
    }

    public set(key: string, value: any): void {
        this._container[key] = value;
    }

}