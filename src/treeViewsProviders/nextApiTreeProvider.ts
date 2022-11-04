/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';

import { AtcRelease, AtcVersion, wait } from 'f5-conx-core';
import {
    Command,
    Event,
    EventEmitter,
    ExtensionContext,
    MarkdownString,
    Position,
    Range,
    TextDocument,
    ThemeIcon,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    Uri,
    ViewColumn,
    window,
    workspace
} from 'vscode';
import path from 'path';
import { ext } from '../extensionVariables';
import jsyaml from "js-yaml";
import { F5Client } from '../f5Client';

import { logger } from '../logger';

export class NextApiTreeProvider implements TreeDataProvider<NxtApiTreeItem> {
    context: ExtensionContext;
    connected: F5Client | undefined;

    private _onDidChangeTreeData: EventEmitter<NxtApiTreeItem | undefined> = new EventEmitter<NxtApiTreeItem | undefined>();
    readonly onDidChangeTreeData: Event<NxtApiTreeItem | undefined> = this._onDidChangeTreeData.event;

    swaggerSvg = ext.context.asAbsolutePath(path.join("images", "swagger.svg"));

    constructor(context: ExtensionContext) {
        this.context = context;
        this.connected = ext.f5Client;
    }


    refresh(): void {
        this.connected = ext.f5Client;
        this._onDidChangeTreeData.fire(undefined);

    }

    getTreeItem(element: NxtApiTreeItem): TreeItem {
        return element;
    }

    async getChildren(element?: NxtApiTreeItem) {
        let treeItems: NxtApiTreeItem[] = [];

        if( !this.connected ) {
            return [];
        }

        if (this.connected?.mgmtClient?.hostInfo?.product.includes('NEXT')) {
            
            if (element) {
    
                
            } else {
                
    
                const toolTip = new MarkdownString()
                .appendCodeblock(jsyaml.dump({
                    openApi: this.connected.openApi!.openapi,
                    info: this.connected.openApi!.info,
                    servers: this.connected.openApi!.servers
                }, { indent: 4 }), 'yaml');
    
                treeItems.push(
                    new NxtApiTreeItem(
                        this.connected.openApi!.info.title,
                        this.connected.openApi!.info.version,
                        toolTip, this.swaggerSvg, 'nextApiItem', TreeItemCollapsibleState.None,
                        { command: 'f5.cfgExplore-show', title: '', arguments: [this.connected.openApi] }
                    )
                );
    
                Object.entries(this.connected!.openApi!.paths).forEach(([key, value]) => {
    
                    // 
                    const toolTip = new MarkdownString()
                    .appendCodeblock(jsyaml.dump(value, { indent: 4 }), 'yaml');
    
                    const methods = Object.keys(value).join('/');
    
                    treeItems.push(
                        new NxtApiTreeItem(key, methods, toolTip, '', 'nextApiItem', TreeItemCollapsibleState.None,
                            { command: 'f5.makeRequest', title: '', arguments: [{ url: key }] }
                        )
                    );
                });
    
            }
        }


        return treeItems;
    }




}


/**
 * bigiq class tree item
 */
class NxtApiTreeItem extends TreeItem {
    constructor(
        public readonly label: string,
        public description: string,
        public tooltip: string | MarkdownString,
        public iconPath: string | ThemeIcon,
        public contextValue: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly command?: Command,
    ) {
        super(label, collapsibleState);
    }
}
