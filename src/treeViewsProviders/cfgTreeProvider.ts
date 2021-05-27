/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';

import {
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    Event,
    EventEmitter,
    Uri,
    Command,
    window,
    ViewColumn,
    Position,
    workspace,
    TextDocument,
    Range,
} from 'vscode';
import { ext } from '../extensionVariables';

import { ConfigFile, Explosion, TmosApp, xmlStats } from 'f5-corkscrew';
import logger from '../utils/logger';
import BigipConfig from 'f5-corkscrew/dist/ltm';

// remodel everything here like this example:  https://github.com/microsoft/vscode-extension-samples/blob/master/tree-view-sample/src/testView.ts
// it will provide a working 'reveal' function and a browsable tmos config tree in the view

/**
 * Tree view provider class that hosts and present the data for the Config Explorer view
 */
export class CfgProvider implements TreeDataProvider<CfgApp> {

    private _onDidChangeTreeData: EventEmitter<CfgApp | undefined> = new EventEmitter<CfgApp | undefined>();
    readonly onDidChangeTreeData: Event<CfgApp | undefined> = this._onDidChangeTreeData.event;

    explosion: Explosion | undefined;
    // confObj: BigipConfObj | undefined;
    /**
     * trying to use this to make the view in focus after initialization
     */
    viewElement: CfgApp | undefined;
    bigipConfig: BigipConfig | undefined;
    parsedFileEvents: any = [];
    parsedObjEvents: any = [];

    constructor() {
    }

    async makeExplosion(file: string) {

        window.withProgress({
            location: {
                viewId: 'cfgTree'
            },
            title: `Extracting TMOS Configs`,
        }, async () => {
            this.bigipConfig = new BigipConfig();

            this.bigipConfig.on('parseFile', x => {
                this.parsedFileEvents.push(x);
                ext.eventEmitterGlobal.emit('log-info', `f5.cfgExplore, parsing file -> ${x}`);
            });
            this.bigipConfig.on('parseObject', x => this.parsedObjEvents.push(x));

            ext.eventEmitterGlobal.emit('log-info', `f5.cfgExplore, opening archive`);

            await this.bigipConfig.loadParseAsync(file)
                .catch(err => logger.error('makeExplosion', err));


            ext.eventEmitterGlobal.emit('log-info', `f5.cfgExplore, extracting apps`);
            await this.bigipConfig.explode()
                .then(exp => {
                    this.explosion = exp;
                    ext.eventEmitterGlobal.emit('log-info', `f5.cfgExplore, extraction complete`);
                    this.refresh();
                })
                .catch(err => logger.error('makeExplosion', err));

        });
    }


    async importExplosion(exp: Explosion) {
        this.explosion = exp;
    }

    async refresh(): Promise<void> {
        this._onDidChangeTreeData.fire(undefined);
    }

    clear(): void {
        this.bigipConfig = undefined;
        this.explosion = undefined;
        this.parsedFileEvents.length = 0;
        this.parsedObjEvents.length = 0;
        this.refresh();
    }


    getParent(element: CfgApp): CfgApp {
        return element;
    }
    getTreeItem(element: CfgApp): TreeItem {
        return element;
    }

    async getChildren(element?: CfgApp): Promise<CfgApp[]> {

        if (!this.explosion) {
            return Promise.resolve([]);
        }

        var treeItems: CfgApp[] = [];

        if (element) {

            if (element.label === 'Apps' && this.explosion) {

                treeItems = sortTreeItems(this.explosion.config.apps.map((el: TmosApp) => {
                    const count = el.configs.length.toString();
                    return new CfgApp(el.name, '', count, 'cfgAppItem', TreeItemCollapsibleState.None,
                        { command: 'f5.cfgExplore-show', title: '---newCmd', arguments: [el.configs] });
                }));

                // treeItems = sortTreeItems(treeItems);

            } else if (element.label === 'Sources' && this.explosion) {

                treeItems = sortTreeItems(this.explosion.config.sources.map((el: ConfigFile) => {
                    return new CfgApp(el.fileName, '', '', '', TreeItemCollapsibleState.None,
                        { command: 'f5.cfgExplore-show', title: '', arguments: [el.content] });
                }));
            }

        } else {

            const title =
                // if hostname is available, assign
                this.explosion.hostname ? this.explosion.hostname

                    // if not, this should be a single file input, grab it's name
                    : this.explosion.config.sources[0].fileName ? this.explosion.config.sources[0].fileName

                        // default value - this should never happen, but TS needed it...
                        : 'hostname';

            const version = this.explosion.stats.sourceTmosVersion;
            const inputFileType = this.explosion.inputFileType;
            const desc = `${inputFileType} - ${version}`;

            this.viewElement = new CfgApp(title, 'Source Config Details', desc, '', TreeItemCollapsibleState.None);
            treeItems.push(this.viewElement);

            const allSources = this.explosion.config.sources.map((el) => el.content);

            treeItems.push(new CfgApp(
                'Sources',
                '',
                this.explosion.config.sources.length.toString(),
                '',
                TreeItemCollapsibleState.Collapsed, {
                command: 'f5.cfgExplore-show',
                title: '',
                arguments: [allSources]
            }
            ));

            // get all the apps configs
            const brkr = '\n\n##################################################\n\n';
            const allApps = this.explosion?.config.apps.map((el: TmosApp) => el.configs.join('\n').concat(brkr));

            const appsTotal = this.explosion?.config.apps ? this.explosion.config.apps.length.toString() : '';
            const baseTotal = this.explosion?.config.base ? this.explosion.config.base.length.toString() : '';
            const logTotal = this.explosion?.logs ? this.explosion.logs.length.toString() : '';

            treeItems.push(new CfgApp('Apps', 'All apps', appsTotal, '', TreeItemCollapsibleState.Collapsed,
                { command: 'f5.cfgExplore-show', title: '', arguments: [allApps] }));

            if (this.explosion?.config?.base) {
                treeItems.push(new CfgApp('Base', '', baseTotal, '', TreeItemCollapsibleState.None,
                    { command: 'f5.cfgExplore-show', title: '', arguments: [this.explosion.config.base] }));
            }

            if (this.bigipConfig?.fileStore && this.bigipConfig?.fileStore.length > 0) {
                const allFileStore = this.bigipConfig.fileStore.filter((el: ConfigFile) => {
                    // only return the certs and keys for now
                    if (el.fileName.includes('/certificate_d/') || el.fileName.includes('/certificate_key_d/')) {
                        return true;
                    }
                })
                    .map((el: ConfigFile) => `\n###  ${el.fileName}\n${el.content}\n\n`);

                treeItems.push(new CfgApp('FileStore', '', this.bigipConfig.fileStore.length.toString(), '', TreeItemCollapsibleState.None,
                    { command: 'f5.cfgExplore-show', title: '', arguments: [allFileStore.join('\n')] }));
            }

            if (this.explosion?.logs) {
                treeItems.push(new CfgApp('Logs', '', logTotal, '', TreeItemCollapsibleState.None,
                    { command: 'f5.cfgExplore-show', title: '', arguments: [this.explosion.logs] }));
            }

            if (this.bigipConfig?.configObject) {
                treeItems.push(new CfgApp('Config Object', '', '', '', TreeItemCollapsibleState.None,
                    { command: 'f5.cfgExplore-show', title: '', arguments: [this.bigipConfig.configObject] }));
            }

            if (this.bigipConfig?.deviceXmlStats?.['mcp_module.xml']?.Qkproc) {

                const statObj: {
                    [key: string]: unknown
                } = {};

                const mcpTree = this.bigipConfig?.deviceXmlStats?.['mcp_module.xml'].Qkproc;

                Object.entries(mcpTree).filter(([key, value]) => {
                    // if (['admin_ip', 'system_information', 'cert_status_object', 'system_module', 'tmm_stat', 'traffic_group',
                    //     'virtual_address', 'virtual_address_stat', 'virtual_server', 'virtual_server_stat',
                    //     'interface', 'interface_stat', 'pool', 'pool_member', 'pool_member_metadata', 'pool_member_stat', 'pool_stat',
                    //     'profile_dns_stat', 'profile_http_stat', 'profile_tcp_stat',
                    //     'rule_stat'].includes(key)) {
                    //     statObj[key] = value;
                    // }
                    if (['virtual_server', 'virtual_server_stat', 'rule_stat'].includes(key)) {
                        statObj[key] = value;
                    }
                });
                treeItems.push(new CfgApp('Stats Object', '', '', '', TreeItemCollapsibleState.None,
                    { command: 'f5.cfgExplore-show', title: '', arguments: [statObj] }));
            }

            if (this.bigipConfig?.defaultProfileBase) {
                treeItems.push(new CfgApp('Default Profile Base', '', '', '', TreeItemCollapsibleState.None,
                    { command: 'f5.cfgExplore-show', title: '', arguments: [this.bigipConfig.defaultProfileBase.content] }));
            }

            if (this.bigipConfig?.license) {
                treeItems.push(new CfgApp('License', '', '', '', TreeItemCollapsibleState.None,
                    { command: 'f5.cfgExplore-show', title: '', arguments: [this.bigipConfig.license.content] }));
            }

        }
        return Promise.resolve(treeItems);
    }


    async render(items: string[]) {

        const newEditorColumn = ext.settings.previewColumn;
        const editors = window.visibleTextEditors;
        let viewColumn: ViewColumn | undefined;

        let docName = 'app.conf';
        let docContent: string;

        if (Array.isArray(items)) {

            docContent = items.join('\n');

        } else if (Object(items)) {
            // if array -> single selection, just join internal array normally -> display contents
            docContent = JSON.stringify(items, undefined, 4);
        }

        // this loop is syncronous
        for (const el of editors) {
            if (el.document.fileName === 'app.conf' || el.document.fileName === 'app.json') {
                viewColumn = el.viewColumn;
            }
        };
        // old way, not syncronous
        // editors.forEach(el => {
        //     if (el.document.fileName === 'app.conf' || el.document.fileName === 'app.json') {
        //         viewColumn = el.viewColumn;
        //     }
        // });

        // if vClm has a value assign it, else set column 1
        viewColumn = viewColumn ? viewColumn : newEditorColumn;

        var vDoc: Uri = Uri.parse("untitled:" + docName);
        workspace.openTextDocument(vDoc)
            .then((a: TextDocument) => {
                window.showTextDocument(a, viewColumn, false).then(e => {
                    e.edit(edit => {
                        const startPosition = new Position(0, 0);
                        const endPosition = a.lineAt(a.lineCount - 1).range.end;
                        edit.replace(new Range(startPosition, endPosition), docContent);
                    });
                });
            });
    }
}



/**
 * sort tree items by label
 */
function sortTreeItems(treeItems: CfgApp[]) {
    return treeItems.sort((a, b) => {
        const x = a.label.toLowerCase();
        const y = b.label.toLowerCase();
        if (x < y) {
            return -1;
        } else {
            return 1;
        }
    });
}

export class CfgApp extends TreeItem {
    constructor(
        public readonly label: string,
        public tooltip: string,
        public description: string,
        public contextValue: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly command?: Command
    ) {
        super(label, collapsibleState);
    }
}