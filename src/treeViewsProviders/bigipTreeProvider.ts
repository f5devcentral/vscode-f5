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

type hostsRefreshType = 'ATC' | 'UCS' | 'QKVIEW';

export class BigipTreeProvider implements TreeDataProvider<IpTreeItem> {
    context: ExtensionContext;
    connected: F5Client | undefined;

    private _onDidChangeTreeData: EventEmitter<IpTreeItem | undefined> = new EventEmitter<IpTreeItem | undefined>();
    readonly onDidChangeTreeData: Event<IpTreeItem | undefined> = this._onDidChangeTreeData.event;

    orangeDot = ext.context.asAbsolutePath(path.join("images", "orangeDot.svg"));
    greenDot = ext.context.asAbsolutePath(path.join("images", "greenDot.svg"));

    fast: AtcVersion | undefined;
    as3: AtcVersion | undefined;
    do: AtcVersion | undefined;
    ts: AtcVersion | undefined;
    cf: AtcVersion | undefined;

    /**
     * list of UCSs from currently connected device
     */
    ucsList = [];
    qkviewList = [];

    constructor(context: ExtensionContext) {
        this.context = context;
        // this.connected = f5Client;
        this.fast = ext.atcVersions.fast;
        this.as3 = ext.atcVersions.as3;
        this.do = ext.atcVersions.do;
        this.ts = ext.atcVersions.ts;
        this.cf = ext.atcVersions.cf;
    }


    async refresh(type?: hostsRefreshType): Promise<void> {
        this._onDidChangeTreeData.fire(undefined);

        this.connected = ext.f5Client;

        if (this.connected && this.connected.ucs && type === 'UCS') {

            await this.connected.ucs.list()
                .then(resp => this.ucsList = resp.data.items);

            // } else if (this.connected && type === 'QKVIEW') {

            // 	await this.connected.qkview.list()
            // 		.then(resp => this.qkviewList = resp.data.items);

        } else if (this.connected && type === 'ATC') {

            await this.connected.discover();

        } else if (this.connected && this.connected.ucs) {

            // start getting ucs/qkview 
            // await this.connected.discover();
            await this.connected.ucs.list()
                .then(resp => this.ucsList = resp.data.items);

            // await this.connected.qkview.list()
            // 	.then(resp => this.qkviewList = resp.data.items);
        }

        this._onDidChangeTreeData.fire(undefined);

    }
    getTreeItem(element: IpTreeItem): TreeItem {
        return element;
    }

    async getChildren(element?: IpTreeItem) {
        let treeItems: IpTreeItem[] = [];

        // if (ext.f5Client?.host?.product === 'BIG-IQ') {
        //     // detect bigiq, else return empty treeItems
        // } else {
        //     return treeItems;
        // }

        if (element) {

            // if the item is the device we are connected to
            if (false) {



            } else if (element.label === 'ATC') {

                const fastIcon
                    = `v${this.connected?.fast?.version.version}` === this.fast?.latest ? this.greenDot
                        : this.connected?.fast ? this.orangeDot
                            : '';
                const as3Icon
                    = `v${this.connected?.as3?.version.version}` === this.as3?.latest ? this.greenDot
                        : this.connected?.as3 ? this.orangeDot
                            : '';
                const doIcon
                    = `v${this.connected?.do?.version.version}` === this.do?.latest ? this.greenDot
                        : this.connected?.do ? this.orangeDot
                            : '';
                const tsIcon
                    = `v${this.connected?.ts?.version.version}` === this.ts?.latest ? this.greenDot
                        : this.connected?.ts ? this.orangeDot
                            : '';
                const cfIcon
                    = `v${this.connected?.cf?.version.version}` === this.cf?.latest ? this.greenDot
                        : this.connected?.cf ? this.orangeDot
                            : '';


                treeItems.push(...[
                    new IpTreeItem('FAST', '', 'f5-appsvcs-templates', fastIcon, 'atcService', TreeItemCollapsibleState.Collapsed),

                    new IpTreeItem('AS3', '', 'f5-appsvcs', as3Icon, 'atcService', TreeItemCollapsibleState.Collapsed),

                    new IpTreeItem('DO', '', 'f5-declarative-onboarding', doIcon, 'atcService', TreeItemCollapsibleState.Collapsed),

                    new IpTreeItem('TS', '', 'f5-telemetry', tsIcon, 'atcService', TreeItemCollapsibleState.Collapsed),

                    new IpTreeItem('CF', '', 'f5-cloud-failover', cfIcon, 'atcService', TreeItemCollapsibleState.Collapsed),
                ]);


            } else if (element.label === 'FAST') {

                this.fast?.releases?.forEach((el: AtcRelease) => {

                    // remove the leading "v" if present
                    const deviceVersion = el.version.replace(/^v/, '');

                    const desc = [
                        el.version === this.fast?.latest ? 'Latest' : '',
                        deviceVersion === this.connected?.fast?.version.version ? 'Installed' : ''
                    ].filter(Boolean);

                    treeItems.push(new IpTreeItem(el.version, desc.join('/'), 'Click to install', '', 'rpm', TreeItemCollapsibleState.None, {
                        command: 'f5.installRPM',
                        title: '',
                        arguments: [el.assets]
                    }));
                });


            } else if (element.label === 'AS3') {

                this.as3?.releases?.forEach((el: AtcRelease) => {

                    // remove the leading "v" if present
                    const deviceVersion = el.version.replace(/^v/, '');

                    const desc = [
                        el.version === this.as3?.latest ? 'Latest' : '',
                        deviceVersion === this.connected?.as3?.version.version ? 'Installed' : ''
                    ].filter(Boolean);

                    treeItems.push(new IpTreeItem(el.version, desc.join('/'), 'Click to install', '', 'rpm', TreeItemCollapsibleState.None, {
                        command: 'f5.installRPM',
                        title: '',
                        arguments: [el.assets]
                    }));
                });


            } else if (element.label === 'DO') {

                this.do?.releases?.forEach((el: AtcRelease) => {

                    // remove the leading "v" if present
                    const deviceVersion = el.version.replace(/^v/, '');

                    const desc = [
                        el.version === this.do?.latest ? 'Latest' : '',
                        deviceVersion === this.connected?.do?.version.version ? 'Installed' : ''
                    ].filter(Boolean);

                    treeItems.push(new IpTreeItem(el.version, desc.join('/'), 'Click to install', '', 'rpm', TreeItemCollapsibleState.None, {
                        command: 'f5.installRPM',
                        title: '',
                        arguments: [el.assets]
                    }));
                });



            } else if (element.label === 'TS') {

                this.ts?.releases?.forEach((el: AtcRelease) => {

                    const desc = [
                        el.version === this.ts?.latest ? 'Latest' : '',
                        el.version.replace(/^v/, '') === this.connected?.ts?.version.version ? 'Installed' : ''
                    ].filter(Boolean);

                    treeItems.push(new IpTreeItem(el.version, desc.join('/'), 'Click to install', '', 'rpm', TreeItemCollapsibleState.None, {
                        command: 'f5.installRPM',
                        title: '',
                        arguments: [el.assets]
                    }));
                });



            } else if (element.label === 'CF') {

                this.cf?.releases?.forEach((el: AtcRelease) => {

                    const desc = [
                        el.version === this.cf?.latest ? 'Latest' : '',
                        el.version.replace(/^v/, '') === this.connected?.cf?.version.version ? 'Installed' : ''
                    ].filter(Boolean);

                    treeItems.push(new IpTreeItem(el.version, desc.join('/'), 'Click to install', '', 'rpm', TreeItemCollapsibleState.None, {
                        command: 'f5.installRPM',
                        title: '',
                        arguments: [el.assets]
                    }));
                });




            } else if (element.label === 'UCS') {

                // get list of ucs, list as items
                treeItems.push(...
                    this.ucsList.map((el: any) => {
                        // const tip = [
                        //     `created: ${el.apiRawValues.file_created_date}`,
                        //     `file size: ${el.apiRawValues.file_size}`,
                        //     `version: ${el.apiRawValues.version}`,
                        //     `encrypted: ${el.apiRawValues.encrypted}`,
                        // ].join('\r\n');

                        const tip = new MarkdownString()
                        .appendCodeblock(jsyaml.dump({
                            created: el.apiRawValues.file_created_date,
                            fileSize: el.apiRawValues.file_size,
                            version: el.apiRawValues.version,
                            encrypted: el.apiRawValues.encrypted,
                            }, { indent: 4 }), 'yaml');

                        const fileName = path.parse(el.apiRawValues.filename).base;

                        return new IpTreeItem(fileName, '', tip, '', 'ucsItem', TreeItemCollapsibleState.None, {
                            command: 'f5.downloadUCS',
                            title: '',
                            arguments: [fileName]
                        });
                    })
                );

                // } else if (element.label === 'QKVIEW') {
                //     // get list of qkviews, list as items
                //     treeItems.push(...
                //         this.qkviewList.map((el: any) => {
                //             const label = path.parse(el.name).name;
                //             return new IpTreeItem(label, '', '', '', 'qkviewItem', TreeItemCollapsibleState.None);
                //         })
                //     );
            }

        } else {

            // build item description indicating which atc services are installed
            const atcDesc = [
                this.connected?.fast ? 'fast' : undefined,
                this.connected?.as3 ? 'as3' : undefined,
                this.connected?.do ? 'do' : undefined,
                this.connected?.ts ? 'ts' : undefined,
                this.connected?.cf ? 'cf' : undefined,
            ].filter(Boolean);



            // to be used when conx has ATC ILX mgmt
            treeItems.push(...[
                new IpTreeItem('ATC', `(${atcDesc.join('/')})`, this.atcToolTip(), '', '', TreeItemCollapsibleState.Collapsed),
                new IpTreeItem('UCS', this.ucsList.length.toString(), '', '', 'ucsHeader', TreeItemCollapsibleState.Collapsed),
                new IpTreeItem('QKVIEW', this.qkviewList.length.toString(), 'in progress', '', 'qkviewHeader', TreeItemCollapsibleState.Collapsed),
            ]);
        }


        return treeItems;
    }

    private atcToolTip() {
        const atcToolTip = new MarkdownString();

        if (this.connected?.fast) {
            atcToolTip.appendMarkdown("## f5-appsvcs-templates (FAST)\n")
            .appendCodeblock(jsyaml.dump({
                latest: this.fast?.latest,
                installed: this.connected?.fast?.version.version
            }, { indent: 4 }), 'yaml');
        }

        if (this.connected?.as3) {
            atcToolTip.appendMarkdown("## f5-appsvcs (AS3)\n")
            .appendCodeblock(jsyaml.dump({
                latest: this.as3?.latest,
                installed: this.connected?.as3?.version.version
            }, { indent: 4 }), 'yaml');
        }

        if (this.connected?.do) {
            atcToolTip.appendMarkdown("## f5-declarative-onboarding (DO)\n")
            .appendCodeblock(jsyaml.dump({
                latest: this.do?.latest,
                installed: this.connected?.do?.version.version
            }, { indent: 4 }), 'yaml');
        }

        if (this.connected?.ts) {
            atcToolTip.appendMarkdown("## f5-telemetry-streaming (TS)\n")
            .appendCodeblock(jsyaml.dump({
                latest: this.ts?.latest,
                installed: this.connected?.ts?.version.version
            }, { indent: 4 }), 'yaml');
        }

        if (this.connected?.cf) {
            atcToolTip.appendMarkdown("## f5-cloud-failover (CF)\n")
            .appendCodeblock(jsyaml.dump({
                latest: this.cf?.latest,
                installed: this.connected?.cf?.version.version
            }, { indent: 4 }), 'yaml');
        }

        return atcToolTip;
    }


    async getUcs() {

        return await this.connected?.ucs.list()
            .then(resp => this.ucsList = resp.data.items)
            .then(() => this.refresh());

    }

    // async getQkview() {

    //     await this.connected?.qkview.list()
    //         .then(resp => this.qkviewList = resp.data.items)
    //         .then(() => this.refresh());

    // }



}


/**
 * sort tree items by label
 */
export function sortTreeItems(treeItems: IpTreeItem[]) {
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

/**
 * bigiq class tree item
 */
class IpTreeItem extends TreeItem {
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

const tmpUcsListResp = {
    "kind": "tm:sys:ucs:ucscollectionstate",
    "selfLink": "https://localhost/mgmt/tm/sys/ucs?ver=14.1.2.6",
    "items": [
        {
            "kind": "tm:sys:ucs:ucsstate",
            "generation": 0,
            "apiRawValues": {
                "base_build": "0.0.2",
                "build": "0.0.2",
                "built": "200605113646",
                "changelist": "3327837",
                "edition": "Point Release 6",
                "encrypted": "no",
                "file_created_date": "2020-08-01T12:57:21Z",
                "file_size": "281800911 (in bytes)",
                "filename": "/var/local/ucs/coreltm01_8.1.2020.ucs",
                "install_date": "Fri Jun  5 11:36:46 PDT 2020",
                "job_id": "1204782",
                "product": "BIG-IP",
                "sequence": "14.1.2.6-0.0.2.0",
                "version": "14.1.2.6"
            }
        }
    ]
};