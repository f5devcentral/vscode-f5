/* eslint-disable @typescript-eslint/semi */
/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';

import path from "path";
import fs from "fs";
import {
    Command,
    Event,
    EventEmitter,
    ExtensionContext,
    MarkdownString,
    ThemeIcon,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
} from 'vscode';
import { ext } from '../extensionVariables';
import jsyaml from "js-yaml";
import { F5Client } from '../f5Client';

import { logger } from '../logger';
import { NextOpenApi } from 'f5-conx-core/dist/bigip/nextModels';

export class NextApiTreeProvider implements TreeDataProvider<NxtApiTreeItem> {
    context: ExtensionContext;
    connected: F5Client | undefined;
    oai: NextOpenApi | undefined;

    private _onDidChangeTreeData: EventEmitter<NxtApiTreeItem | undefined> = new EventEmitter<NxtApiTreeItem | undefined>();
    readonly onDidChangeTreeData: Event<NxtApiTreeItem | undefined> = this._onDidChangeTreeData.event;

    swaggerSvg = ext.context.asAbsolutePath(path.join("images", "swagger.svg"));

    localOaiPath = path.join(ext.context.extensionPath, 'openapi_nextCm.json');
    pathsTreeObj: { [key: string]: { [key: string]: { [key: string]: { [key: string]: {}; }; }; }; } | undefined;

    constructor(context: ExtensionContext) {
        this.context = context;
        this.connected = ext?.f5Client;
    }


    refresh(local?: string): void {
        this.connected = undefined;
        this.oai = undefined;
        this.pathsTreeObj = undefined;

        if (ext?.f5Client) {

            this.connected = ext?.f5Client;
            this.oai = ext.f5Client.openApi;
            this.pathsTreeObj = pathTree(Object.keys(this.oai!.paths));

        } else if (local) {

            this.oai = JSON.parse(fs.readFileSync(this.localOaiPath).toString());
            this.pathsTreeObj = pathTree(Object.keys(this.oai!.paths));
        }


        this._onDidChangeTreeData.fire(undefined);

    }

    getTreeItem(element: NxtApiTreeItem): TreeItem {
        return element;
    }

    async getChildren(element?: NxtApiTreeItem) {
        let treeItems: NxtApiTreeItem[] = [];

        if (this.connected?.mgmtClient?.hostInfo?.product.includes('NEXT') || this.pathsTreeObj) {

            if (element) {

                // get full/base path
                const elPath = element.path?.join('.')
                const path = pathValueFromKey(this.pathsTreeObj, element.path?.join('.') || element.label);
                const pathKey = path?.path ? [path.path, path.key].join('.') : path.key;

                // now get all the keys from that path and create tree items
                const b = this.pathsTreeObj![pathKey];
                Object.keys(this.pathsTreeObj![pathKey]).forEach(key => {

                    const thisPathKey = [pathKey, key]
                    const sub1 = pathValueFromKey(this.pathsTreeObj![pathKey], key);
                    const sub2 = deepGet(this.pathsTreeObj![pathKey], thisPathKey);

                    // no keys, means we have a leaf
                    if(Object.keys(sub1.value).length === 0) {
                        
                        // return a leaf
                        treeItems.push(
                            new NxtApiTreeItem(key, 'leaf', '', '', 'nextApiTreeItem', thisPathKey, TreeItemCollapsibleState.Collapsed)
                        );

                    } else {
                        
                        // return a branch
                        treeItems.push(
                            new NxtApiTreeItem(key, 'branch', '', '', 'nextApiTreeItem', thisPathKey, TreeItemCollapsibleState.Collapsed)
                        );
                    }
                })


            } else {


                const toolTip = new MarkdownString()
                    .appendCodeblock(jsyaml.dump({
                        openApi: this.oai!.openapi,
                        info: this.oai!.info,
                        servers: this.oai!.servers
                    }, { indent: 4 }), 'yaml');

                treeItems.push(
                    new NxtApiTreeItem(
                        this.oai!.info.title,
                        this.oai!.info.version,
                        toolTip, this.swaggerSvg, 'nextApiItem', undefined, TreeItemCollapsibleState.None,
                        { command: 'f5.cfgExplore-show', title: '', arguments: [this.oai] }
                    )
                );

                if(this.pathsTreeObj) {
                    Object.keys(this.pathsTreeObj).forEach(key => {
                        const item = new NxtApiTreeItem(key, '', '', '', 'nextApiTreeItem', [key], TreeItemCollapsibleState.Collapsed)
                        item.path = [key];
                        treeItems.push(
                            item
                        );
                    });
                }


                // const branches: NxtApiTreeItem[] = [];
                //     Object.entries(this.oai!.paths).forEach(([key, value]) => {

                //         // split each path into paths
                //         const paths = key.split('/');
                //         const paths2 = paths.shift();
                //         if (paths.length > 1) {
                //             // this is a path so return a path tree item
                //             branches.push(
                //                 new NxtApiTreeItem(`/${paths[0]}`, '', '', '', 'nextApiTreeItem', TreeItemCollapsibleState.Collapsed)
                //             );
                //         } else {

                //             const toolTip = new MarkdownString()
                //                 .appendCodeblock(jsyaml.dump(value, { indent: 4 }), 'yaml');
                //             const methods = Object.keys(value).join('/');

                //             treeItems.push(
                //                 new NxtApiTreeItem(key, methods, toolTip, '', 'nextApiItem', TreeItemCollapsibleState.None,
                //                     { command: 'f5.makeRequest', title: '', arguments: [{ url: key }] }
                //                 )
                //             );
                //         }


                //     });
                //     const newS = new Set(branches);
                //     treeItems.push(...unique(branches, (a, b) => (a.label === b.label)));
                // }
            }


            return treeItems;
        }




    }
}


function pathTree(paths: string[]) {

    // type the tree we are making.  4 levels seems sufficient for now...
    const pathsTreeObj: {
        [key: string]: {
            [key: string]: {
                [key: string]: {
                    [key: string]: {}
                }
            }
        }
    } = {};

    // https://codereview.stackexchange.com/questions/158134/generate-a-nested-structure-based-on-a-list-of-file-paths
    // https://codereview.stackexchange.com/a/277982

    // loop through all the full paths
    paths.forEach(el => {
        const el2 = el.split('/')
        el2.shift() // shift the first element off '/'
        
        // remove duplicates and nest into an object tree
        el2.reduce((o, k) => (o[k] = o[k] || {}), pathsTreeObj);
    });

    return pathsTreeObj;
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
        public path: string[] | undefined,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly command?: Command,
    ) {
        super(label, collapsibleState);
    }
}


function unique(a: NxtApiTreeItem[], fn: (arg0: NxtApiTreeItem, arg1: NxtApiTreeItem) => any) {
    if (a.length === 0 || a.length === 1) {
        return a;
    }
    if (!fn) {
        return a;
    }

    for (let i = 0; i < a.length; i++) {
        for (let j = i + 1; j < a.length; j++) {
            if (fn(a[i], a[j])) {
                a.splice(i, 1);
            }
        }
    }
    return a;
}





/**
 * searches object for key
 * 
 * *** todo: update path to be array, not dot(.) notation
 *  - pretty sure this is complete...
 * 
 * @param obj to search
 * @param key to find
 * @param return [{ path: string, key: string, value: string }]
 */
 export function pathValueFromKey(obj: unknown, key: string, path?: string): any {

    console.log('inbound pathValueFromKey', key, path)
    const results: any[] = [];

    // const objType = typeof obj;
    // if (objType !== "object") {
    //     logger.error(`findValueFromKey function expected object, got: ${objType}`);
    //     return;
    // }

    /**
     * iterate through json tree looking for key match
     */
    function findKey(obj: any, key: string, path?: string) {

        /**
         * if the current object we are on has the key we are looking for,
         * push result details
         * 
         */
        if (obj.hasOwnProperty(key)) {
            return {
                path,
                key,
                value: obj[key]
            }
        }

        /**
         * append path as we iterate
         */
        path = `${path ? path + "." : ""}`;
        console.log(path)

        for (const k in obj) {
            if (obj.hasOwnProperty(k)) {
                if (obj[k] && typeof obj[k] === "object") {
                    findKey(obj[k], key, `${path}${k}`);
                }
            }
        }
    }

    // call functoin to start iteration
    return findKey(obj, key)

    // if (results.length = 1) {
    //     // return array of results
    //     return results[0];
    // } else {
    //     logger.error(`pathValueFromKey found more than one match, returning first, full list: ${results}`)
    //     return results[0];
    // }

}



/**
 * gets value by deep path in array form
 *  (ex. ['ltm','monitor','http'])
 * 
 * *** paths have to be in array form since names can have '.' in them ***
 * 
 * @param path to fetch value
 * @param obj containing path/value to get
 */
 export function deepGet(obj: unknown, path: string[]): unknown {

    const xxx = index(obj, path);
    return xxx;

    function index(obj: unknown, is: string | (string | number)[], value?: undefined): unknown {
        if (typeof is === 'string') {
            return index(obj, is.split('.'), value);
        } else if (is.length === 1 && value !== undefined) {
            return obj[is[0]] = value;
        } else if (is.length === 0) {
            return obj;
        } else {
            return index(obj[is[0]], is.slice(1), value);
        }
    }
}