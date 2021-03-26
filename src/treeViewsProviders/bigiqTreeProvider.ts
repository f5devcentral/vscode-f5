/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';

import { wait } from 'f5-conx-core';
import {
    Command,
    Event,
    EventEmitter,
    ExtensionContext,
    MarkdownString,
    Position,
    Range,
    TextDocument,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    Uri,
    ViewColumn,
    window,
    workspace
} from 'vscode';
import { ext } from '../extensionVariables';
import logger from '../utils/logger';
import jsyaml from "js-yaml";


// https://clouddocs.f5.com/products/big-iq/mgmt-api/v6.1.0/ApiReferences/bigiq_public_api_ref/r_as3_template.html

// https://clouddocs.f5.com/products/big-iq/mgmt-api/v0.0/HowToSamples/bigiq_public_api_wf/t_bigiq_public_api_workflows.html

// https://github.com/microsoft/vscode-extension-samples/blob/main/tree-view-sample/src/extension.ts
// https://github.com/microsoft/vscode-extension-samples/blob/main/tree-view-sample/src/nodeDependencies.ts
// https://github.com/microsoft/vscode-extension-samples/blob/main/tree-view-sample/src/testView.ts

// implement this:  https://github.com/ChaunceyKiwi/json-tree-view

// /mgmt/cm/global/appsvcs-templates

type IqDataRefresh = 'TEMPLATES' | 'GLOBAL-APPS' | 'DEVICES' | 'SCRIPTS' | 'SCRIPT-EXEC';

export class BigiqTreeProvider implements TreeDataProvider<IqTreeItem> {
    // treeView: TreeView;
    context: ExtensionContext;
    devices: IqDevice[] = [];
    appsGlobal: IqGlobalApp[] = [];
    templates: IqTemplate[] = [];
    scripts: IqScript[] = [];
    scriptsExecuted: IqExecutedScript[] = [];

    //https://clouddocs.f5.com/products/big-iq/mgmt-api/v0.0/
    readonly endPoints = {
        info: '/info/system',
        scripts: '/mgmt/shared/user-scripts',
        scriptExecute: '/mgmt/shared/user-script-execution',
        devices: '/mgmt/cm/system/machineid-resolver',
        apps: {
            all: '/mgmt/cm/global/config-sets',
            global: '/mgmt/cm/global/global-apps',
            move: '/mgmt/cm/global/global-apps-merge-move',
            summary: '/mgmt/ap/query/v1/tenants/default/reports/ApplicationsSummary',
        },
        templates: '/mgmt/cm/global/appsvcs-templates',
        files: '/mgmt/cm/adc-core/working-config/file-objects',
        certTasks: '/mgmt/cm/adc-core/tasks/certificate-management'
    };

    private _onDidChangeTreeData: EventEmitter<IqTreeItem | undefined> = new EventEmitter<IqTreeItem | undefined>();
    readonly onDidChangeTreeData: Event<IqTreeItem | undefined> = this._onDidChangeTreeData.event;


    constructor(context: ExtensionContext) {
        this.context = context;
    }


    /**
     * refresh tree view
     */
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: IqTreeItem): TreeItem {
        return element;
    }

    async getChildren(element?: IqTreeItem) {
        let treeItems: IqTreeItem[] = [];

        // if (ext.f5Client?.host?.product === 'BIG-IQ') {
        //     // detect bigiq, else return empty treeItems
        // } else {
        //     return treeItems;
        // }

        if (element) {

            if (element.label === 'Global Applications') {

                const iqTemps = this.appsGlobal.map((el: IqGlobalApp) => {
                    return new IqTreeItem(el.name, '', '', 'iQglobalApp', '', TreeItemCollapsibleState.Collapsed,
                        { command: 'f5.iqViewShow', title: '', arguments: [el] });
                });

                treeItems.push(...sortTreeItems(iqTemps));

            } else if (element.contextValue === 'iQglobalApp') {

                const apps = this.appsGlobal.filter((el: IqGlobalApp) => el.name === element.label)[0];

                if (apps.componentCount > 0) {
                    apps.appComponents.map((app: IqGlobalAppComponent) => {
                        treeItems.push(new IqTreeItem(app.configSetName, '', '', 'iQapp', app.selfLink, TreeItemCollapsibleState.None,
                            { command: 'f5.iqViewShow', title: '', arguments: [{ selfLink: app.selfLink, type: app }] }));
                    });
                }

                treeItems = sortTreeItems(treeItems);  // is there a better way to sort this?


            } else if (element.label === 'Templates') {

                const iqTemps = this.templates.map((el: IqTemplate) => {
                    const published = el.published ? 'published' : 'not-published';
                    return new IqTreeItem(el.name, published, '', 'iqTemplate', '', TreeItemCollapsibleState.None,
                        { command: 'f5.iqViewShow', title: '', arguments: [el] });
                });

                treeItems.push(...sortTreeItems(iqTemps));

            } else if (element.label === 'Devices') {

                const iqTemps = this.devices.map((el: IqDevice) => {
                    return new IqTreeItem(el.hostname, el.address, '', '', '', TreeItemCollapsibleState.None,
                        { command: 'f5.iqViewShow', title: '', arguments: [el] });
                });

                treeItems.push(...sortTreeItems(iqTemps));

            } else if (element.label === 'Scripts') {

                const iqTemps = this.scripts.map((el: IqScript) => {
                    return new IqTreeItem(el.name, el.description, '', 'iqScript', '', TreeItemCollapsibleState.None,
                        { command: 'f5.iqViewShow', title: '', arguments: [el] });
                });

                treeItems.push(...sortTreeItems(iqTemps));

                const scriptExecCount = this.scriptsExecuted.length.toString() || '';
                treeItems.unshift(new IqTreeItem('Executed-Scripts', scriptExecCount, 'Executed scripts tasks', '', '', TreeItemCollapsibleState.Collapsed));

            } else if (element.label === 'Executed-Scripts') {

                const execScripts = this.scriptsExecuted.map(el => {
                    const desc = el.status || '';

                    const output = el.userScriptTaskStatuses?.[0]?.output || '';

                    const tooltip = output
                        ? new MarkdownString()
                            .appendCodeblock(`startTime: ${el.startDateTime}\nendTime: ${el.endDateTime}\n`, 'yaml')
                            .appendMarkdown(`---\n## output`)
                            .appendCodeblock(output, 'yaml') :
                        el.errorMessage ? new MarkdownString(`# error\n${el.errorMessage}\n`)
                            : '';

                    return new IqTreeItem(el.name, desc, tooltip, 'iqExecScript', '', TreeItemCollapsibleState.None,
                        { command: 'f5.iqViewShow', title: '', arguments: [el] });
                });

                treeItems.push(...sortTreeItems(execScripts));

            }


        } else {

            // this.refreshData();
            await Promise.all([
                this.getGlobalApps(),
                this.getTemplates(),
                this.getDevices(),
                this.getScripts(),
                this.getExecutedScripts()
            ]);

            // todo: build count and hover details
            treeItems.push(
                new IqTreeItem('Global Applications', '', '', '', '', TreeItemCollapsibleState.Collapsed),
                new IqTreeItem('Templates', '', '', '', '', TreeItemCollapsibleState.Collapsed),
                new IqTreeItem('Devices', '', '', '', '', TreeItemCollapsibleState.Collapsed),
                new IqTreeItem('Scripts', '', '', '', '', TreeItemCollapsibleState.Collapsed),
            );
        }
        return treeItems;
    }

    /**
     * fetch bigiq managed device information
     */
    private async getDevices() {
        this.devices.length = 0;
        await ext.f5Client?.https(this.endPoints.devices)
            .then(resp => {
                this.devices = resp.data.items;
                // this.refresh();
            })
            .catch(err => logger.error(err));
    }

    /**
     * fetch bigiq global apps
     */
    private async getGlobalApps() {
        this.appsGlobal.length = 0;
        await ext.f5Client?.https(this.endPoints.apps.global)
            .then(resp => {
                this.appsGlobal = resp.data.items;
                // this.refresh();
            })
            .catch(err => logger.error(err));

    }

    /**
     * fetch bigiq as3 templates
     */
    private async getTemplates() {
        this.templates.length = 0;
        await ext.f5Client?.https(this.endPoints.templates)
            .then(resp => {
                this.templates = resp.data.items;
                // this.refresh();
            })
            .catch(err => logger.error(err));
    }



    /**
     * festch app details
     * @param selfLink 
     * @returns 
     */
    async getApp(selfLink: string) {
        const id = (selfLink.split('/').pop() || selfLink);
        return await ext.f5Client?.https(`${this.endPoints.templates}/${id}`)
            .then(resp => resp.data);
    }

    /**
     * delete app
     */
    async deleteApp(app: IqTreeItem) {
        // DELETE /mgmt/cm/global/global-apps/912ec803-b2ce-39e4-a541-068d495ab570
        // delete -> https://10.200.244.15:443/mgmt/cm/global/config-sets/912ec803-b2ce-39e4-a541-068d495ab570
        const selfLink = app?.command?.arguments?.[0].selfLink;
        const id = (selfLink.split('/').pop() || selfLink);
        return await ext.f5Client?.https(`${this.endPoints.apps.global}/${id}`, { method: 'DELETE' })
            .then(() => wait(500, this.getGlobalApps()))
            .then(() => wait(500, this.refresh()));
    }

    async moveApp(selfLink: IqTreeItem) {
        // we should recieve the selfLink of the app to move
        // As the user if they want to create a new app group to move to exisitng

        const dest = await window.showQuickPick(['Create new Application Group', 'Move to existing Application Group'])
            .then(dest => {
                if (dest === 'Create new Application Group') {

                    return window.showInputBox({
                        ignoreFocusOut: true,
                        prompt: 'New Application Group Name?'
                    });

                } else if (dest === 'Move to existing Application Group') {

                    const existingGroups = this.appsGlobal.map((el: IqGlobalApp) => el.name);
                    return window.showQuickPick(existingGroups);
                }
            });

        if (dest) {
            await ext.f5Client?.https(this.endPoints.apps.move, {
                method: 'POST',
                data: {
                    componentAppReferencesToMove: [{
                        link: selfLink?.command?.arguments?.[0].selfLink
                    }],
                    targetGlobalAppName: dest,
                    deleteEmptyGlobalAppsWhenDone: false,
                    requireNewGlobalApp: false
                }
            })
                .then(resp => wait(500, this.getGlobalApps()))
                .then(resp => wait(500, this.refresh()));
        }
    }




    // ########################################################
    // Template functions


    /**
     * post/upload bigiq as3 template
     * @param text template text
     * @returns <void>
     */
    async postTemplate(text: string) {
        return await ext.f5Client?.https(this.endPoints.templates, {
            method: 'POST',
            data: text
        })
            .then(resp => wait(500, this.getTemplates()))
            .then(resp => wait(500, this.refresh()));
    }

    /**
     * changes bigiq as3 template publish status
     *  if published -> un-published, if un-published -> published
     * @param template 
     */
    async publishTemplate(template: IqTreeItem): Promise<void> {

        // if (template.description === 'not-published') => true, then it will publish the template, else, it will un-publish the template

        const selfLink = template?.command?.arguments?.[0].selfLink;
        const id = (selfLink.split('/').pop() || selfLink);
        return await ext.f5Client?.https(`${this.endPoints.templates}/${id}`, {
            method: 'PATCH',
            data: {
                published: (template.description === 'not-published')
            }
        })
            .then(() => wait(500, this.getTemplates()))
            .then(resp => wait(500, this.refresh()));
    }

    /**
     * delete bigiq as3 template
     * ### template must be "un-published" first
     * 
     * @param template extracts template id from tree class item (IqTreeItem)
     */
    async deleteTemplate(template: IqTreeItem): Promise<void> {

        const selfLink = template?.command?.arguments?.[0].selfLink;
        const id = (selfLink.split('/').pop() || selfLink);
        return await ext.f5Client?.https(`${this.endPoints.templates}/${id}`, { method: 'DELETE' })
            .then(() => wait(500, this.getTemplates()))
            .then(resp => wait(500, this.refresh()));
    }






    // ########################################################
    // script functions

    /**
     * fetch bigiq scripts
     */
    private async getScripts() {
        this.scripts.length = 0;
        await ext.f5Client?.https(this.endPoints.scripts)
            .then(resp => {
                this.scripts = resp.data.items;
            })
            .catch(err => logger.error(err));
    }


    /**
     * fetch executed bigiq scripts
     */
    private async getExecutedScripts() {
        this.scriptsExecuted.length = 0;
        await ext.f5Client?.https(this.endPoints.scriptExecute)
            .then(resp => {
                this.scriptsExecuted = resp.data.items;
                // this.refresh();
            })
            .catch(err => logger.error(err));
    }

    /**
     * 
     * @param item tree item script reference to delete
     * @returns 
     */
    async deleteScript(item: IqTreeItem) {
        const selfLink = item?.command?.arguments?.[0].selfLink;
        const id = (selfLink.split('/').pop() || selfLink);
        return await ext.f5Client?.https(`${this.endPoints.scripts}/${id}`, { method: 'DELETE' })
            .then(() => wait(500, this.getScripts()))
            .then(resp => wait(500, this.refresh()));
    }


    /**
     * processes script text, extracts script header information (name/id), posts new or updates existing script
     * @param text raw text script from editor
     * @returns 
     */
    async postScript(text: string) {

        const postableScript = await this.prePostScript(text);

        if (postableScript.id) {
            return await ext.f5Client?.https(`${this.endPoints.scripts}/${postableScript.id}`, {
                method: 'PATCH',
                data: postableScript
            })
                .then(() => wait(1000, this.getScripts()));
        } else {
            return await ext.f5Client?.https(this.endPoints.scripts, {
                method: 'POST',
                data: postableScript
            })
                .then(() => wait(1000, this.getScripts()))
                .then(resp => wait(500, this.refresh()));
        }

    }

    /**
     * discovers script header information used for managing the script in bigiq api
     * 
     * This is so we can track the name/description/id of the script in the editor and reference those details back to the REST API
     * @param script bigiq script body
     * @returns 
     */
    async prePostScript(script: string) {
        // get the first five lines and extract script meta-data (name/desc/id)
        const firstThreeLines = script.split('\n').slice(0, 5).join('\n');
        const name = firstThreeLines.match(/# ?name: ?([\w -]+)/)?.[1];
        const description = firstThreeLines.match(/# ?description: ?([\w -]+)/)?.[1];
        const id = firstThreeLines.match(/# ?id: ?([\w -]+)/)?.[1];

        // return extracted details with original script string
        return { name, description, id, script };
    }


    /**
     * Executes script on selected device
     * 
     * input is selected script, function will prompt user to select device, then execute
     * 
     * @param item script tree item
     */
    async executeScript(item: IqTreeItem) {

        const scriptRef = item.command?.arguments?.[0].selfLink;

        // "uuid": "ae8742ff-efca-4f44-82a1-16fe5a61bfbc",
        // "deviceUri": "https://10.200.244.5:443",
        // "machineId": "ae8742ff-efca-4f44-82a1-16fe5a61bfbc",
        // "state": "ACTIVE",
        // "address": "10.200.244.5",
        // "httpsPort": 443,
        // "hostname": "coreltm01.benlab.io",

        // "address": "192.168.200.131",
        // "hostname": "bigip-tparty05.benlab.io",
        // "selfLink": "https://localhost/mgmt/shared/resolver/device-groups/cm-bigip-allBigIpDevices/devices/1932275d-7c55-4fb4-b981-8857d20ac220",
        // "machineId": "1932275d-7c55-4fb4-b981-8857d20ac220",
        const devices = this.devices.map((el: IqDevice) => {
            return {
                uuid: el.uuid,
                machineId: el.machineId,
                address: el.address,
                label: el.hostname
            };
        });

        const deviceRef = await window.showQuickPick(devices, { ignoreFocusOut: true });

        const scriptName = item.command?.arguments?.[0].name;
        const jobLabel = `${scriptName}->${deviceRef?.label}`;

        return await ext.f5Client?.https(this.endPoints.scriptExecute, {
            method: 'POST',
            data: {
                name: jobLabel,
                deviceReferences: [{
                    "link": `https://localhost/mgmt/shared/resolver/device-groups/cm-bigip-allBigIpDevices/devices/${deviceRef?.machineId}`
                }],
                timeoutInSeconds: 600,
                scriptReference: {
                    "link": scriptRef
                }
            }
        })
            .then(async resp => {
                return await ext.f5Client?.mgmtClient.followAsync(`${this.endPoints.scriptExecute}/${resp.data.id}`);
            })
            .then(resp => wait(500, this.getExecutedScripts()))
            .then(resp => wait(500, this.refresh()));
    }




    /**
     * render output
     * 
     * manages new/editors and displays information in them
     */
    async render(items: unknown[], script?: IqScript) {

        const newEditorColumn = ext.settings.previewColumn;
        const editors = window.visibleTextEditors;
        let viewColumn: ViewColumn | undefined;

        let docName = 'BIG-IQ.json';
        let docContent: string;

        if (script) {
            docName = 'BIG-IQ.sh';

            // discover bigiq script header details
            const { name, description, id } = await this.prePostScript(script.script);

            // if we got existing bigiq script details
            if (name && description && id) {
                // details already there
                docContent = script.script;
            } else {
                // add existing bigiq script details
                docContent = [
                    `# name: ${script.name}`,
                    `# description: ${script.description}`,
                    `# id: ${script.id}`,
                    ` `,
                    script.script,
                ].join('\n');
            }
        } else {

            if (Array.isArray(items)) {

                docContent = items.join('\n');

            } else if (Object(items)) {
                // if array -> single selection, just join internal array normally -> display contents
                docContent = JSON.stringify(items, undefined, 4);
            }
        }



        for (const el of editors) {
            if (el.document.fileName === 'BIG-IQ.sh' || el.document.fileName === 'BIG-IQ.json') {
                viewColumn = el.viewColumn;
            }
        };

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
export function sortTreeItems(treeItems: IqTreeItem[]) {
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
class IqTreeItem extends TreeItem {
    constructor(
        public readonly label: string,
        public description: string,
        public tooltip: string | MarkdownString,
        public contextValue: string,
        id: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly command?: Command
    ) {
        super(label, collapsibleState);
    }
}


type IqExecutedScript = {
    id: string;
    kind: string;
    name: string;
    status: string;
    selfLink: string;
    username: string;
    generation: number;
    currentStep: string;
    deviceCount: number;
    endDateTime: string;
    startDateTime: string;
    errorMessage: string;
    userReference: {
        link: string;
    }
    ownerMachineId: string;
    scriptReference: {
        link: string;
    }
    deviceReferences: [
        {
            link: string;
        }
    ]
    userScriptTaskStatuses: [{
        output: string;
        status: string;
        address: string;
        exitCode: string;
        hostname: string;
        httpsPort: number;
        machineId: string;
        startTime: number;
        deviceReference: {
            link: string;
        }
    }]
};

const exmpExecutedScript = {
    "id": "0dbde32c-d287-426b-a3e1-401b616d9d5a",
    "kind": "shared:user-script-execution:userscripttaskstate",
    "name": "vscoode-f5-script-execution",
    "status": "FINISHED",
    "selfLink": "https://localhost/mgmt/shared/user-script-execution/0dbde32c-d287-426b-a3e1-401b616d9d5a",
    "username": "admin",
    "generation": 7,
    "currentStep": "CLEAN_UP",
    "deviceCount": 1,
    "endDateTime": "2021-03-18T01:32:02.407-0700",
    "startDateTime": "2021-03-18T01:31:41.971-0700",
    "userReference": {
        "link": "https://localhost/mgmt/shared/authz/users/admin"
    },
    "ownerMachineId": "b8f3869d-d554-4ff9-8be3-0dd5e40c21bb",
    "scriptReference": {
        "link": "https://localhost/mgmt/shared/user-scripts/3e912016-d564-4457-9ed1-998f26ac4de5"
    },
    "deviceReferences": [
        {
            "link": "https://localhost/mgmt/shared/resolver/device-groups/cm-bigip-allBigIpDevices/devices/1932275d-7c55-4fb4-b981-8857d20ac220"
        }
    ],
    "lastUpdateMicros": 1616056322458023,
    "timeoutInSeconds": 600,
    "identityReferences": [
        {
            "link": "https://localhost/mgmt/shared/authz/users/admin"
        }
    ],
    "userScriptTaskStatuses": [
        {
            "output": "/var/tmp/0dbde32c-d287-426b-a3e1-401b616d9d5a-script.sh: line 12: syntax error near unexpected token `<'\n/var/tmp/0dbde32c-d287-426b-a3e1-401b616d9d5a-script.sh: line 12: `CREDS=<username><password>'\n",
            "status": "FINISHED",
            "address": "192.168.200.131",
            "message": "Finished executing script.",
            "exitCode": "2",
            "hostname": "bigip-tparty05.benlab.io",
            "httpsPort": 443,
            "machineId": "1932275d-7c55-4fb4-b981-8857d20ac220",
            "startTime": 1272239427833470,
            "deviceReference": {
                "link": "https://localhost/mgmt/shared/resolver/device-groups/cm-bigip-allBigIpDevices/devices/1932275d-7c55-4fb4-b981-8857d20ac220"
            }
        }
    ]
};

type IqScript = {
    id: string;
    kind: string;
    name: string;
    script: string;
    selfLink: string;
    generation: number;
    description: string;
    lastUpdateMicros: number;
};

const exmpScript = {
    id: "ba3c8907-2ae6-4ffe-b961-9771f67ca1c3",
    kind: "shared:user-scripts:userscriptstate",
    name: "qwer",
    script: "qwer",
    selfLink: "https://localhost/mgmt/shared/user-scripts/ba3c8907-2ae6-4ffe-b961-9771f67ca1c3",
    generation: 1,
    description: "",
    lastUpdateMicros: 1615772924231630,
};


type IqGlobalApp = {
    name: string;
    description: string;
    componentCount: number;
    appComponents: IqGlobalAppComponent[];
    id: string;
    generation: number;
    lastUpdateMicros: number;
    kind: string;
    selfLink: string;
};

type IqGlobalAppComponent = {
    configSetName: string;
    selfLink: string;
};

const exmpGlobalApp = {
    "name": "Unknown Applications",
    "description": "Unknown Application",
    "componentCount": 1,
    "appComponents": [
        {
            "configSetName": "core1_pizza_02_pizza",
            "selfLink": "https://localhost/mgmt/cm/global/config-sets/da40d8e5-cec1-3d4d-93eb-c808cb5fc4b0"
        }
    ],
    "id": "69cf49ad-de27-3540-b38f-9773d06ca1c4",
    "generation": 1,
    "lastUpdateMicros": 1568892437538198,
    "kind": "cm:global:global-apps:globalapplicationstate",
    "selfLink": "https://localhost/mgmt/cm/global/global-apps/69cf49ad-de27-3540-b38f-9773d06ca1c4"
};

type IqApp = {
    id: string;
    kind: string;
    status: string;
    selfLink: string;
    generation: number;
    alertRuleName: string;
    configSetName: string;
    lastConfigTime: string;
    protectionMode: string;
    deviceReference: unknown;
};

const exmpApp = {
    "id": "da40d8e5-cec1-3d4d-93eb-c808cb5fc4b0",
    "kind": "cm:global:config-sets:configsetstate",
    "status": "DEPLOYED",
    "selfLink": "https://localhost/mgmt/cm/global/config-sets/da40d8e5-cec1-3d4d-93eb-c808cb5fc4b0",
    "generation": 4,
    "alertRuleName": "core1_pizza_02_pizza-health",
    "configSetName": "core1_pizza_02_pizza",
    "lastConfigTime": "2021-02-08T23:19:30.447Z",
    "protectionMode": "Not Protected",
    "deviceReference": {
        "link": "https://localhost/mgmt/shared/resolver/device-groups/cm-bigip-allBigIpDevices/devices/ae8742ff-efca-4f44-82a1-16fe5a61bfbc"
    },
    "tenantReference": {
        "link": "https://localhost/mgmt/cm/global/tenants/289b7be7-5082-3d1d-b305-4999c46afe67"
    },
    "lastUpdateMicros": 1614784287054811,
    "lastDeploymentTime": "2021-02-08T23:19:30.447Z",
    "applicationReference": {
        "link": "https://localhost/mgmt/cm/global/global-apps/69cf49ad-de27-3540-b38f-9773d06ca1c4"
    },
    "applicationServiceType": "HTTP",
    "appSvcsTemplateReference": {
        "link": "https://localhost/mgmt/cm/global/appsvcs-templates/c21f969b-5f03-333d-83e0-4f8f136e7682"
    }
};

type IqTemplate = {
    id: string;
    kind: string;
    name: string;
    tenant: {
        name: string;
        editable: boolean;
        override: boolean;
    };
    selfLink: string;
    published: boolean;
    generation: number;
    description: string;
    schemaOverlay: unknown;
    isUICompatible: boolean;
    lastUpdateMicros: number;
};

const exmpTemplate = {
    id: "7ab244f7-bc73-3617-b97d-b914811f3d15",
    kind: "cm:global:appsvcs-templates:appsvcstemplatestate",
    name: "infraNTP",
    tenant: {
        name: "infra",
        editable: false,
        override: true,
    },
    selfLink: "https://localhost/mgmt/cm/global/appsvcs-templates/7ab244f7-bc73-3617-b97d-b914811f3d15",
    published: true,
    generation: 9,
    description: "",
    schemaOverlay: {
        type: "object",
        required: [
            "class",
        ],
        properties: {
            class: {
                type: "string",
                const: "Application",
            },
            label: {
            },
            remark: {
            },
            template: {
            },
            schemaOverlay: {
            },
        },
        definitions: {
            Pool: {
                type: "object",
                properties: {
                    class: {
                    },
                    label: {
                        type: "string",
                        const: "ntp_u123_pool",
                        default: "ntp_u123_pool",
                    },
                    members: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                servicePort: {
                                    type: "number",
                                    const: 123,
                                    default: 123,
                                },
                                serverAddresses: {
                                    type: "array",
                                },
                            },
                        },
                    },
                    monitors: {
                        type: "array",
                        const: [
                            "icmp",
                        ],
                        default: [
                            "icmp",
                        ],
                    },
                },
                additionalProperties: false,
            },
            Service_UDP: {
                type: "object",
                properties: {
                    pool: {
                        type: "string",
                        const: "ntp_u123_pool",
                        default: "ntp_u123_pool",
                    },
                    class: {
                    },
                    label: {
                        type: "string",
                        const: "ntp_vs",
                        default: "ntp_vs",
                    },
                    virtualPort: {
                        type: "number",
                        const: 123,
                        default: 123,
                    },
                    virtualAddresses: {
                        type: "array",
                    },
                },
                additionalProperties: false,
            },
        },
        additionalProperties: {
            allOf: [
                {
                    anyOf: [
                        {
                            properties: {
                                class: {
                                    const: "Pool",
                                },
                            },
                        },
                        {
                            properties: {
                                class: {
                                    const: "Service_UDP",
                                },
                            },
                        },
                    ],
                },
                {
                    if: {
                        properties: {
                            class: {
                                const: "Pool",
                            },
                        },
                    },
                    then: {
                        $ref: "#/definitions/Pool",
                    },
                },
                {
                    if: {
                        properties: {
                            class: {
                                const: "Service_UDP",
                            },
                        },
                    },
                    then: {
                        $ref: "#/definitions/Service_UDP",
                    },
                },
            ],
        },
    },
    isUICompatible: true,
    lastUpdateMicros: 1582156909211941,
};


type IqDevice = {
    uuid: string;
    deviceUri: string;
    machineId: string;
    state: string;
    address: string;
    httpsPort: number;
    hostname: string;
    version: string;
    product: string;
    edition: string;
    build: string;
    restFrameworkVersion: string;
    managementAddress: string;
    mcpDeviceName: string;
    isClustered: boolean;
    isVirtual: boolean;
    isLicenseExpired: boolean;
};

const exmpDevice = {
    "uuid": "ae8742ff-efca-4f44-82a1-16fe5a61bfbc",
    "deviceUri": "https://10.200.244.5:443",
    "machineId": "ae8742ff-efca-4f44-82a1-16fe5a61bfbc",
    "state": "ACTIVE",
    "address": "10.200.244.5",
    "httpsPort": 443,
    "hostname": "coreltm01.benlab.io",
    "version": "14.1.2.6",
    "product": "BIG-IP",
    "edition": "Point Release 6",
    "build": "0.0.2",
    "restFrameworkVersion": "14.1.2.6-0.0.2",
    "managementAddress": "10.200.244.5",
    "mcpDeviceName": "/Common/coreltm01.benlab.io",
    "properties": {
        "cm:gui:module": [
            "asmsecurity",
            "adc",
            "dns",
            "BigIPDevice",
            "sharedsecurity"
        ],
        "modules": [
            "Web Application Security Group",
            "Security"
        ],
        "cm-bigip-allBigIpDevices": {
            "cm:gui:module": [
                "asmsecurity",
                "adc",
                "dns",
                "BigIPDevice",
                "sharedsecurity"
            ],
            "shared:resolver:device-groups:discoverer": "b8f3869d-d554-4ff9-8be3-0dd5e40c21bb",
            "modules": [
                "Web Application Security Group",
                "Security"
            ],
            "clusterName": "coreltms"
        },
        "cm-security-shared-allSharedDevices": {
            "imported": true,
            "discovered": true,
            "clusterName": "coreltms",
            "supportsAfm": true,
            "supportsCpb": true,
            "importStatus": "FINISHED",
            "supportsFqdn": true,
            "discoveryStatus": "FINISHED",
            "importedDateTime": "2021-01-17T03:03:42.272Z",
            "supportsCsrfUrls": true,
            "supportsDatasafe": true,
            "supportsFwPolicy": true,
            "supportsNatPolicy": true,
            "supportUdpPortList": true,
            "supportsAlpineEnhs": true,
            "supportsBadgerEnhs": true,
            "supportsBotDefense": true,
            "supportsLoginPages": true,
            "supportsSshProfile": true,
            "supports_13_0_Enhs": true,
            "supports_13_1_Enhs": true,
            "supports_14_0_Enhs": true,
            "supports_14_1_Enhs": true,
            "supports_15_0_Enhs": false,
            "supports_15_1_Enhs": false,
            "supportsCascadeEnhs": true,
            "supportsExtractions": true,
            "supportsGeoLocation": true,
            "supportsGwtProfiles": true,
            "supportsIruleAction": true,
            "supportsRuleLogging": true,
            "supportsWebScraping": false,
            "supportsXmlProfiles": true,
            "supportsAddressRange": true,
            "supportsJsonProfiles": true,
            "supportsPacketTester": true,
            "supportsUserIdentity": true,
            "supports_12_1_2_Enhs": true,
            "supportsFlowInspector": true,
            "supportsSendToVirtual": true,
            "supportsServicePolicy": true,
            "lastDiscoveredDateTime": "2021-01-17T03:01:46.088Z",
            "supportsAfmSubscribers": true,
            "supportsClassification": true,
            "supportsCsrfProtection": true,
            "supportsDataProtection": true,
            "supportsFlowIdleTimers": true,
            "supportsHopoptProtocol": true,
            "supportsIpIntelligence": true,
            "supportsIruleSampleRate": true,
            "supportsNestedPortLists": true,
            "supportsSessionTracking": true,
            "supportsThreatCampaigns": true,
            "supportsLoginEnforcement": true,
            "supportsPlainTextProfile": true,
            "supportsPortMisusePolicy": true,
            "supportsDualStackMgmtPort": true,
            "supportsWebSocketSecurity": true,
            "lastUserDiscoveredDateTime": "2021-01-17T03:01:46.088Z",
            "supportsCompatibilityLevel": true,
            "supportsNestedAddressLists": true,
            "supportsServerTechnologies": true,
            "supportsUrlCascadeFeatures": true,
            "botSignatureAutoUpdateState": true,
            "suppportsXmlValidationFiles": true,
            "restrictsFirewallInlineRules": true,
            "supportsAlpineDosProfileEnhs": true,
            "supportsAlpineLogProfileEnhs": true,
            "supportsIncrementalDiscovery": true,
            "supportsAlpineDosDeviceConfig": true,
            "supportsLoginPagesHeaderOmits": true,
            "supportsRedirectionProtection": true,
            "supportsUrlSignaturesOverride": true,
            "supportsFirewallRuleIdentifiers": true,
            "supportsHostNameEnforcementMode": true,
            "supportsAsmDisallowedGeolocation": true,
            "supportsHeaderSignaturesOverride": true,
            "supportsLoginPagesCascadeFeatures": true,
            "supportsBruteForceAttackPreventions": true,
            "supportsWhitelistIpBlockRequestAlways": true,
            "requiresDhcpProfileInDhcpVirtualServer": true,
            "supportsLoginEnforcementCascadeFeatures": true,
            "restrictsPortTranslationStatelessVirtual": true,
            "supportsSessionTrackingDeviceIdThresholds": true,
            "supportsAlpineDosDeviceWhitelistIpProcotol": true,
            "supportsVirtualServerDestinationAddressList": true,
            "supportsBruteForceAttackPreventionsBadgerFeatures": true,
            "supportsSessionTrackingSessionHijackingByDeviceId": true,
            "supportsBruteForceAttackPreventionsCascadeFeatures": true,
            "supportsSessionTrackingAllLoginPagesUsernameSource": true,
            "cm:gui:module": [
                "sharedsecurity"
            ],
            "modules": [
                "Security"
            ]
        },
        "cm-adccore-adccluster_coreltms": {
            "clusterName": "coreltms",
            "supportsAfm": true,
            "supportsCpb": true,
            "supportsFqdn": true,
            "supportsCsrfUrls": true,
            "supportsDatasafe": true,
            "supportsFwPolicy": true,
            "supportsNatPolicy": true,
            "supportUdpPortList": true,
            "supportsAlpineEnhs": true,
            "supportsBadgerEnhs": true,
            "supportsLoginPages": true,
            "supportsSshProfile": true,
            "supports_13_0_Enhs": true,
            "supports_13_1_Enhs": true,
            "supports_14_0_Enhs": true,
            "supportsCascadeEnhs": true,
            "supportsExtractions": true,
            "supportsGeoLocation": true,
            "supportsGwtProfiles": true,
            "supportsIruleAction": true,
            "supportsRuleLogging": true,
            "supportsWebScraping": false,
            "supportsXmlProfiles": true,
            "supportsAddressRange": true,
            "supportsJsonProfiles": true,
            "supportsPacketTester": true,
            "supportsUserIdentity": true,
            "supports_12_1_2_Enhs": true,
            "supportsFlowInspector": true,
            "supportsSendToVirtual": true,
            "supportsServicePolicy": true,
            "supportsAfmSubscribers": true,
            "supportsClassification": true,
            "supportsCsrfProtection": true,
            "supportsDataProtection": true,
            "supportsFlowIdleTimers": true,
            "supportsHopoptProtocol": true,
            "supportsIpIntelligence": true,
            "supportsIruleSampleRate": true,
            "supportsNestedPortLists": true,
            "supportsSessionTracking": true,
            "supportsThreatCampaigns": true,
            "supportsLoginEnforcement": true,
            "supportsPlainTextProfile": true,
            "supportsPortMisusePolicy": true,
            "supportsDualStackMgmtPort": true,
            "supportsWebSocketSecurity": true,
            "supportsCompatibilityLevel": true,
            "supportsNestedAddressLists": true,
            "supportsServerTechnologies": true,
            "supportsUrlCascadeFeatures": true,
            "suppportsXmlValidationFiles": true,
            "restrictsFirewallInlineRules": true,
            "supportsAlpineDosProfileEnhs": true,
            "supportsAlpineLogProfileEnhs": true,
            "supportsIncrementalDiscovery": true,
            "supportsAlpineDosDeviceConfig": true,
            "supportsLoginPagesHeaderOmits": true,
            "supportsRedirectionProtection": true,
            "supportsUrlSignaturesOverride": true,
            "supportsFirewallRuleIdentifiers": true,
            "supportsHostNameEnforcementMode": true,
            "supportsAsmDisallowedGeolocation": true,
            "supportsHeaderSignaturesOverride": true,
            "supportsLoginPagesCascadeFeatures": true,
            "supportsBruteForceAttackPreventions": true,
            "supportsWhitelistIpBlockRequestAlways": true,
            "requiresDhcpProfileInDhcpVirtualServer": true,
            "supportsLoginEnforcementCascadeFeatures": true,
            "restrictsPortTranslationStatelessVirtual": true,
            "supportsSessionTrackingDeviceIdThresholds": true,
            "supportsAlpineDosDeviceWhitelistIpProcotol": true,
            "supportsBruteForceAttackPreventionsBadgerFeatures": true,
            "supportsSessionTrackingSessionHijackingByDeviceId": true,
            "supportsBruteForceAttackPreventionsCascadeFeatures": true,
            "supportsSessionTrackingAllLoginPagesUsernameSource": true,
            "cm:gui:module": [
                "adc"
            ],
            "modules": []
        },
        "cm-asm-allAsmDevices": {
            "imported": true,
            "discovered": true,
            "clusterName": "coreltms",
            "supportsAfm": true,
            "supportsCpb": true,
            "importStatus": "FINISHED",
            "supportsFqdn": true,
            "discoveryStatus": "FINISHED",
            "importedDateTime": "2021-01-17T03:04:04.953Z",
            "supportsCsrfUrls": true,
            "supportsDatasafe": true,
            "supportsFwPolicy": true,
            "signatureFilename": "ASM-AttackSignatures_20210217_134528.im",
            "supportsNatPolicy": true,
            "supportUdpPortList": true,
            "supportsAlpineEnhs": true,
            "supportsBadgerEnhs": true,
            "supportsBotDefense": true,
            "supportsLoginPages": true,
            "supportsSshProfile": true,
            "supports_13_0_Enhs": true,
            "supports_13_1_Enhs": true,
            "supports_14_0_Enhs": true,
            "supports_14_1_Enhs": true,
            "supports_15_0_Enhs": false,
            "supports_15_1_Enhs": false,
            "supportsCascadeEnhs": true,
            "supportsExtractions": true,
            "supportsGeoLocation": true,
            "supportsGwtProfiles": true,
            "supportsIruleAction": true,
            "supportsRuleLogging": true,
            "supportsWebScraping": false,
            "supportsXmlProfiles": true,
            "signatureFileVersion": 1613569528000,
            "supportsAddressRange": true,
            "supportsJsonProfiles": true,
            "supportsPacketTester": true,
            "supportsUserIdentity": true,
            "supports_12_1_2_Enhs": true,
            "supportsFlowInspector": true,
            "supportsSendToVirtual": true,
            "supportsServicePolicy": true,
            "lastDiscoveredDateTime": "2021-01-17T03:02:38.661Z",
            "supportsAfmSubscribers": true,
            "supportsClassification": true,
            "supportsCsrfProtection": true,
            "supportsDataProtection": true,
            "supportsFlowIdleTimers": true,
            "supportsHopoptProtocol": true,
            "supportsIpIntelligence": true,
            "supportsIruleSampleRate": true,
            "supportsNestedPortLists": true,
            "supportsSessionTracking": true,
            "supportsThreatCampaigns": true,
            "signatureAutoUpdateState": true,
            "supportsLoginEnforcement": true,
            "supportsPlainTextProfile": true,
            "supportsPortMisusePolicy": true,
            "supportsDualStackMgmtPort": true,
            "supportsWebSocketSecurity": true,
            "lastUserDiscoveredDateTime": "2021-01-17T03:02:38.661Z",
            "supportsCompatibilityLevel": true,
            "supportsNestedAddressLists": true,
            "supportsServerTechnologies": true,
            "supportsUrlCascadeFeatures": true,
            "suppportsXmlValidationFiles": true,
            "restrictsFirewallInlineRules": true,
            "supportsAlpineDosProfileEnhs": true,
            "supportsAlpineLogProfileEnhs": true,
            "supportsIncrementalDiscovery": true,
            "supportsAlpineDosDeviceConfig": true,
            "supportsLoginPagesHeaderOmits": true,
            "supportsRedirectionProtection": true,
            "supportsUrlSignaturesOverride": true,
            "threatCampaignAutoUpdateState": true,
            "browserChallengeAutoUpdateState": true,
            "serverTechnologyAutoUpdateState": true,
            "supportsFirewallRuleIdentifiers": true,
            "supportsHostNameEnforcementMode": true,
            "supportsAsmDisallowedGeolocation": true,
            "supportsHeaderSignaturesOverride": true,
            "supportsLoginPagesCascadeFeatures": true,
            "supportsBruteForceAttackPreventions": true,
            "supportsWhitelistIpBlockRequestAlways": true,
            "requiresDhcpProfileInDhcpVirtualServer": true,
            "supportsLoginEnforcementCascadeFeatures": true,
            "restrictsPortTranslationStatelessVirtual": true,
            "supportsSessionTrackingDeviceIdThresholds": true,
            "supportsAlpineDosDeviceWhitelistIpProcotol": true,
            "supportsVirtualServerDestinationAddressList": true,
            "supportsBruteForceAttackPreventionsBadgerFeatures": true,
            "supportsSessionTrackingSessionHijackingByDeviceId": true,
            "supportsBruteForceAttackPreventionsCascadeFeatures": true,
            "supportsSessionTrackingAllLoginPagesUsernameSource": true,
            "cm:gui:module": [
                "asmsecurity"
            ],
            "modules": [
                "Web Application Security Group"
            ]
        },
        "cm-dns-dnsCluster_coreltms": {
            "clusterName": "coreltms",
            "supportsAfm": true,
            "supportsCpb": true,
            "supportsFqdn": true,
            "supportsCsrfUrls": true,
            "supportsDatasafe": true,
            "supportsFwPolicy": true,
            "supportsNatPolicy": true,
            "supportUdpPortList": true,
            "supportsAlpineEnhs": true,
            "supportsBadgerEnhs": true,
            "supportsLoginPages": true,
            "supportsSshProfile": true,
            "supports_13_0_Enhs": true,
            "supports_13_1_Enhs": true,
            "supports_14_0_Enhs": true,
            "supportsCascadeEnhs": true,
            "supportsExtractions": true,
            "supportsGeoLocation": true,
            "supportsGwtProfiles": true,
            "supportsIruleAction": true,
            "supportsRuleLogging": true,
            "supportsWebScraping": false,
            "supportsXmlProfiles": true,
            "supportsAddressRange": true,
            "supportsJsonProfiles": true,
            "supportsPacketTester": true,
            "supportsUserIdentity": true,
            "supports_12_1_2_Enhs": true,
            "supportsFlowInspector": true,
            "supportsSendToVirtual": true,
            "supportsServicePolicy": true,
            "supportsAfmSubscribers": true,
            "supportsClassification": true,
            "supportsCsrfProtection": true,
            "supportsDataProtection": true,
            "supportsFlowIdleTimers": true,
            "supportsHopoptProtocol": true,
            "supportsIpIntelligence": true,
            "supportsIruleSampleRate": true,
            "supportsNestedPortLists": true,
            "supportsSessionTracking": true,
            "supportsThreatCampaigns": true,
            "supportsLoginEnforcement": true,
            "supportsPlainTextProfile": true,
            "supportsPortMisusePolicy": true,
            "supportsDualStackMgmtPort": true,
            "supportsWebSocketSecurity": true,
            "supportsCompatibilityLevel": true,
            "supportsNestedAddressLists": true,
            "supportsServerTechnologies": true,
            "supportsUrlCascadeFeatures": true,
            "suppportsXmlValidationFiles": true,
            "restrictsFirewallInlineRules": true,
            "supportsAlpineDosProfileEnhs": true,
            "supportsAlpineLogProfileEnhs": true,
            "supportsIncrementalDiscovery": true,
            "supportsAlpineDosDeviceConfig": true,
            "supportsLoginPagesHeaderOmits": true,
            "supportsRedirectionProtection": true,
            "supportsUrlSignaturesOverride": true,
            "supportsFirewallRuleIdentifiers": true,
            "supportsHostNameEnforcementMode": true,
            "supportsAsmDisallowedGeolocation": true,
            "supportsHeaderSignaturesOverride": true,
            "supportsLoginPagesCascadeFeatures": true,
            "supportsBruteForceAttackPreventions": true,
            "supportsWhitelistIpBlockRequestAlways": true,
            "requiresDhcpProfileInDhcpVirtualServer": true,
            "supportsLoginEnforcementCascadeFeatures": true,
            "restrictsPortTranslationStatelessVirtual": true,
            "supportsSessionTrackingDeviceIdThresholds": true,
            "supportsAlpineDosDeviceWhitelistIpProcotol": true,
            "supportsBruteForceAttackPreventionsBadgerFeatures": true,
            "supportsSessionTrackingSessionHijackingByDeviceId": true,
            "supportsBruteForceAttackPreventionsCascadeFeatures": true,
            "supportsSessionTrackingAllLoginPagesUsernameSource": true,
            "cm:gui:module": [
                "dns"
            ],
            "modules": []
        },
        "cm-dns-allBigIpDevices": {
            "imported": true,
            "discovered": true,
            "clusterName": "coreltms",
            "supportsAfm": true,
            "supportsCpb": true,
            "importStatus": "FINISHED",
            "supportsFqdn": true,
            "clusterSynced": true,
            "discoveryStatus": "FINISHED",
            "importedDateTime": "2019-09-19T12:56:08.336Z",
            "supportsCsrfUrls": true,
            "supportsDatasafe": true,
            "supportsFwPolicy": true,
            "clusterSyncStatus": "FINISHED",
            "supportsNatPolicy": true,
            "supportUdpPortList": true,
            "supportsAlpineEnhs": true,
            "supportsBadgerEnhs": true,
            "supportsBotDefense": true,
            "supportsLoginPages": true,
            "supportsSshProfile": true,
            "supports_13_0_Enhs": true,
            "supports_13_1_Enhs": true,
            "supports_14_0_Enhs": true,
            "supports_14_1_Enhs": true,
            "supports_15_0_Enhs": false,
            "supports_15_1_Enhs": false,
            "supportsCascadeEnhs": true,
            "supportsExtractions": true,
            "supportsGeoLocation": true,
            "supportsGwtProfiles": true,
            "supportsIruleAction": true,
            "supportsRuleLogging": true,
            "supportsWebScraping": false,
            "supportsXmlProfiles": true,
            "supportsAddressRange": true,
            "supportsJsonProfiles": true,
            "supportsPacketTester": true,
            "supportsUserIdentity": true,
            "supports_12_1_2_Enhs": true,
            "clusterSyncedDateTime": "2019-09-19T19:24:44.634Z",
            "supportsFlowInspector": true,
            "supportsSendToVirtual": true,
            "supportsServicePolicy": true,
            "lastDiscoveredDateTime": "2019-09-19T11:53:10.919Z",
            "supportsAfmSubscribers": true,
            "supportsClassification": true,
            "supportsCsrfProtection": true,
            "supportsDataProtection": true,
            "supportsFlowIdleTimers": true,
            "supportsHopoptProtocol": true,
            "supportsIpIntelligence": true,
            "supportsIruleSampleRate": true,
            "supportsNestedPortLists": true,
            "supportsSessionTracking": true,
            "supportsThreatCampaigns": true,
            "supportsLoginEnforcement": true,
            "supportsPlainTextProfile": true,
            "supportsPortMisusePolicy": true,
            "supportsDualStackMgmtPort": true,
            "supportsWebSocketSecurity": true,
            "lastUserDiscoveredDateTime": "2019-09-19T11:53:10.919Z",
            "supportsCompatibilityLevel": true,
            "supportsNestedAddressLists": true,
            "supportsServerTechnologies": true,
            "supportsUrlCascadeFeatures": true,
            "suppportsXmlValidationFiles": true,
            "restrictsFirewallInlineRules": true,
            "supportsAlpineDosProfileEnhs": true,
            "supportsAlpineLogProfileEnhs": true,
            "supportsIncrementalDiscovery": true,
            "supportsAlpineDosDeviceConfig": true,
            "supportsLoginPagesHeaderOmits": true,
            "supportsRedirectionProtection": true,
            "supportsUrlSignaturesOverride": true,
            "supportsFirewallRuleIdentifiers": true,
            "supportsHostNameEnforcementMode": true,
            "supportsAsmDisallowedGeolocation": true,
            "supportsHeaderSignaturesOverride": true,
            "supportsLoginPagesCascadeFeatures": true,
            "supportsBruteForceAttackPreventions": true,
            "supportsWhitelistIpBlockRequestAlways": true,
            "requiresDhcpProfileInDhcpVirtualServer": true,
            "supportsLoginEnforcementCascadeFeatures": true,
            "restrictsPortTranslationStatelessVirtual": true,
            "supportsSessionTrackingDeviceIdThresholds": true,
            "supportsAlpineDosDeviceWhitelistIpProcotol": true,
            "supportsVirtualServerDestinationAddressList": true,
            "supportsBruteForceAttackPreventionsBadgerFeatures": true,
            "supportsSessionTrackingSessionHijackingByDeviceId": true,
            "supportsBruteForceAttackPreventionsCascadeFeatures": true,
            "supportsSessionTrackingAllLoginPagesUsernameSource": true,
            "cm:gui:module": [
                "dns"
            ],
            "modules": []
        },
        "cm-adccore-allbigipDevices": {
            "imported": true,
            "discovered": true,
            "clusterName": "coreltms",
            "supportsAfm": true,
            "supportsCpb": true,
            "importStatus": "FINISHED",
            "supportsFqdn": true,
            "clusterSynced": true,
            "discoveryStatus": "FINISHED",
            "importedDateTime": "2019-09-19T12:55:22.011Z",
            "supportsCsrfUrls": true,
            "supportsDatasafe": true,
            "supportsFwPolicy": true,
            "clusterSyncStatus": "FINISHED",
            "supportsNatPolicy": true,
            "supportUdpPortList": true,
            "supportsAlpineEnhs": true,
            "supportsBadgerEnhs": true,
            "supportsBotDefense": true,
            "supportsLoginPages": true,
            "supportsSshProfile": true,
            "supports_13_0_Enhs": true,
            "supports_13_1_Enhs": true,
            "supports_14_0_Enhs": true,
            "supports_14_1_Enhs": true,
            "supports_15_0_Enhs": false,
            "supports_15_1_Enhs": false,
            "supportsCascadeEnhs": true,
            "supportsExtractions": true,
            "supportsGeoLocation": true,
            "supportsGwtProfiles": true,
            "supportsIruleAction": true,
            "supportsRuleLogging": true,
            "supportsWebScraping": false,
            "supportsXmlProfiles": true,
            "supportsAddressRange": true,
            "supportsJsonProfiles": true,
            "supportsPacketTester": true,
            "supportsUserIdentity": true,
            "supports_12_1_2_Enhs": true,
            "clusterSyncedDateTime": "2019-09-19T19:24:09.983Z",
            "supportsFlowInspector": true,
            "supportsSendToVirtual": true,
            "supportsServicePolicy": true,
            "lastDiscoveredDateTime": "2020-08-25T15:33:02.139Z",
            "supportsAfmSubscribers": true,
            "supportsClassification": true,
            "supportsCsrfProtection": true,
            "supportsDataProtection": true,
            "supportsFlowIdleTimers": true,
            "supportsHopoptProtocol": true,
            "supportsIpIntelligence": true,
            "supportsIruleSampleRate": true,
            "supportsNestedPortLists": true,
            "supportsSessionTracking": true,
            "supportsThreatCampaigns": true,
            "supportsLoginEnforcement": true,
            "supportsPlainTextProfile": true,
            "supportsPortMisusePolicy": true,
            "supportsDualStackMgmtPort": true,
            "supportsWebSocketSecurity": true,
            "lastUserDiscoveredDateTime": "2019-09-19T11:52:55.957Z",
            "supportsCompatibilityLevel": true,
            "supportsNestedAddressLists": true,
            "supportsServerTechnologies": true,
            "supportsUrlCascadeFeatures": true,
            "suppportsXmlValidationFiles": true,
            "restrictsFirewallInlineRules": true,
            "supportsAlpineDosProfileEnhs": true,
            "supportsAlpineLogProfileEnhs": true,
            "supportsIncrementalDiscovery": true,
            "supportsAlpineDosDeviceConfig": true,
            "supportsLoginPagesHeaderOmits": true,
            "supportsRedirectionProtection": true,
            "supportsUrlSignaturesOverride": true,
            "currentConfigInconsistencyLink": "https://localhost/mgmt/cm/global/tasks/current-config-consistency-check/5767fe9e-51e6-4dd5-b90d-2f7a3315d484",
            "supportsFirewallRuleIdentifiers": true,
            "supportsHostNameEnforcementMode": true,
            "supportsAsmDisallowedGeolocation": true,
            "supportsHeaderSignaturesOverride": true,
            "supportsLoginPagesCascadeFeatures": true,
            "supportsBruteForceAttackPreventions": true,
            "supportsWhitelistIpBlockRequestAlways": true,
            "requiresDhcpProfileInDhcpVirtualServer": true,
            "supportsLoginEnforcementCascadeFeatures": true,
            "restrictsPortTranslationStatelessVirtual": true,
            "supportsSessionTrackingDeviceIdThresholds": true,
            "supportsAlpineDosDeviceWhitelistIpProcotol": true,
            "supportsVirtualServerDestinationAddressList": true,
            "supportsBruteForceAttackPreventionsBadgerFeatures": true,
            "supportsSessionTrackingSessionHijackingByDeviceId": true,
            "supportsBruteForceAttackPreventionsCascadeFeatures": true,
            "supportsSessionTrackingAllLoginPagesUsernameSource": true,
            "cm:gui:module": [
                "adc"
            ],
            "modules": []
        },
        "cm-asm-asmCluster_coreltms": {
            "clusterName": "coreltms",
            "supportsAfm": true,
            "supportsCpb": true,
            "supportsFqdn": true,
            "supportsCsrfUrls": true,
            "supportsDatasafe": true,
            "supportsFwPolicy": true,
            "signatureFilename": "Attack Signature Database packaged with version 14.1.2.6",
            "supportsNatPolicy": true,
            "supportUdpPortList": true,
            "supportsAlpineEnhs": true,
            "supportsBadgerEnhs": true,
            "supportsBotDefense": true,
            "supportsLoginPages": true,
            "supportsSshProfile": true,
            "supports_13_0_Enhs": true,
            "supports_13_1_Enhs": true,
            "supports_14_0_Enhs": true,
            "supports_14_1_Enhs": true,
            "supports_15_0_Enhs": false,
            "supports_15_1_Enhs": false,
            "supportsCascadeEnhs": true,
            "supportsExtractions": true,
            "supportsGeoLocation": true,
            "supportsGwtProfiles": true,
            "supportsIruleAction": true,
            "supportsRuleLogging": true,
            "supportsWebScraping": false,
            "supportsXmlProfiles": true,
            "signatureFileVersion": 1561148362000,
            "supportsAddressRange": true,
            "supportsJsonProfiles": true,
            "supportsPacketTester": true,
            "supportsUserIdentity": true,
            "supports_12_1_2_Enhs": true,
            "supportsFlowInspector": true,
            "supportsSendToVirtual": true,
            "supportsServicePolicy": true,
            "supportsAfmSubscribers": true,
            "supportsClassification": true,
            "supportsCsrfProtection": true,
            "supportsDataProtection": true,
            "supportsFlowIdleTimers": true,
            "supportsHopoptProtocol": true,
            "supportsIpIntelligence": true,
            "supportsIruleSampleRate": true,
            "supportsNestedPortLists": true,
            "supportsSessionTracking": true,
            "supportsThreatCampaigns": true,
            "signatureAutoUpdateState": true,
            "supportsLoginEnforcement": true,
            "supportsPlainTextProfile": true,
            "supportsPortMisusePolicy": true,
            "supportsDualStackMgmtPort": true,
            "supportsWebSocketSecurity": true,
            "supportsCompatibilityLevel": true,
            "supportsNestedAddressLists": true,
            "supportsServerTechnologies": true,
            "supportsUrlCascadeFeatures": true,
            "suppportsXmlValidationFiles": true,
            "restrictsFirewallInlineRules": true,
            "supportsAlpineDosProfileEnhs": true,
            "supportsAlpineLogProfileEnhs": true,
            "supportsIncrementalDiscovery": true,
            "supportsAlpineDosDeviceConfig": true,
            "supportsLoginPagesHeaderOmits": true,
            "supportsRedirectionProtection": true,
            "supportsUrlSignaturesOverride": true,
            "threatCampaignAutoUpdateState": true,
            "browserChallengeAutoUpdateState": true,
            "serverTechnologyAutoUpdateState": true,
            "supportsFirewallRuleIdentifiers": true,
            "supportsHostNameEnforcementMode": true,
            "supportsAsmDisallowedGeolocation": true,
            "supportsHeaderSignaturesOverride": true,
            "supportsLoginPagesCascadeFeatures": true,
            "supportsBruteForceAttackPreventions": true,
            "supportsWhitelistIpBlockRequestAlways": true,
            "requiresDhcpProfileInDhcpVirtualServer": true,
            "supportsLoginEnforcementCascadeFeatures": true,
            "restrictsPortTranslationStatelessVirtual": true,
            "supportsSessionTrackingDeviceIdThresholds": true,
            "supportsAlpineDosDeviceWhitelistIpProcotol": true,
            "supportsVirtualServerDestinationAddressList": true,
            "supportsBruteForceAttackPreventionsBadgerFeatures": true,
            "supportsSessionTrackingSessionHijackingByDeviceId": true,
            "supportsBruteForceAttackPreventionsCascadeFeatures": true,
            "supportsSessionTrackingAllLoginPagesUsernameSource": true,
            "cm:gui:module": [
                "asmsecurity"
            ],
            "modules": [
                "Web Application Security Group"
            ]
        },
        "cm-security-shared-sharedCluster_coreltms": {
            "clusterName": "coreltms",
            "supportsAfm": true,
            "supportsCpb": true,
            "supportsFqdn": true,
            "supportsCsrfUrls": true,
            "supportsDatasafe": true,
            "supportsFwPolicy": true,
            "supportsNatPolicy": true,
            "supportUdpPortList": true,
            "supportsAlpineEnhs": true,
            "supportsBadgerEnhs": true,
            "supportsBotDefense": true,
            "supportsLoginPages": true,
            "supportsSshProfile": true,
            "supports_13_0_Enhs": true,
            "supports_13_1_Enhs": true,
            "supports_14_0_Enhs": true,
            "supports_14_1_Enhs": true,
            "supports_15_0_Enhs": false,
            "supports_15_1_Enhs": false,
            "supportsCascadeEnhs": true,
            "supportsExtractions": true,
            "supportsGeoLocation": true,
            "supportsGwtProfiles": true,
            "supportsIruleAction": true,
            "supportsRuleLogging": true,
            "supportsWebScraping": false,
            "supportsXmlProfiles": true,
            "supportsAddressRange": true,
            "supportsJsonProfiles": true,
            "supportsPacketTester": true,
            "supportsUserIdentity": true,
            "supports_12_1_2_Enhs": true,
            "supportsFlowInspector": true,
            "supportsSendToVirtual": true,
            "supportsServicePolicy": true,
            "supportsAfmSubscribers": true,
            "supportsClassification": true,
            "supportsCsrfProtection": true,
            "supportsDataProtection": true,
            "supportsFlowIdleTimers": true,
            "supportsHopoptProtocol": true,
            "supportsIpIntelligence": true,
            "supportsIruleSampleRate": true,
            "supportsNestedPortLists": true,
            "supportsSessionTracking": true,
            "supportsThreatCampaigns": true,
            "supportsLoginEnforcement": true,
            "supportsPlainTextProfile": true,
            "supportsPortMisusePolicy": true,
            "supportsDualStackMgmtPort": true,
            "supportsWebSocketSecurity": true,
            "supportsCompatibilityLevel": true,
            "supportsNestedAddressLists": true,
            "supportsServerTechnologies": true,
            "supportsUrlCascadeFeatures": true,
            "suppportsXmlValidationFiles": true,
            "restrictsFirewallInlineRules": true,
            "supportsAlpineDosProfileEnhs": true,
            "supportsAlpineLogProfileEnhs": true,
            "supportsIncrementalDiscovery": true,
            "supportsAlpineDosDeviceConfig": true,
            "supportsLoginPagesHeaderOmits": true,
            "supportsRedirectionProtection": true,
            "supportsUrlSignaturesOverride": true,
            "supportsFirewallRuleIdentifiers": true,
            "supportsHostNameEnforcementMode": true,
            "supportsAsmDisallowedGeolocation": true,
            "supportsHeaderSignaturesOverride": true,
            "supportsLoginPagesCascadeFeatures": true,
            "supportsBruteForceAttackPreventions": true,
            "supportsWhitelistIpBlockRequestAlways": true,
            "requiresDhcpProfileInDhcpVirtualServer": true,
            "supportsLoginEnforcementCascadeFeatures": true,
            "restrictsPortTranslationStatelessVirtual": true,
            "supportsSessionTrackingDeviceIdThresholds": true,
            "supportsAlpineDosDeviceWhitelistIpProcotol": true,
            "supportsVirtualServerDestinationAddressList": true,
            "supportsBruteForceAttackPreventionsBadgerFeatures": true,
            "supportsSessionTrackingSessionHijackingByDeviceId": true,
            "supportsBruteForceAttackPreventionsCascadeFeatures": true,
            "supportsSessionTrackingAllLoginPagesUsernameSource": true,
            "cm:gui:module": [
                "sharedsecurity"
            ],
            "modules": [
                "Security"
            ]
        },
        "cm-security-shared-allDevices": {
            "cm:gui:module": [],
            "modules": []
        },
        "cm-asm-allDevices": {
            "cm:gui:module": [],
            "modules": []
        },
        "cm-bigip-allDevices": {
            "shared:resolver:device-groups:discoverer": "b8f3869d-d554-4ff9-8be3-0dd5e40c21bb",
            "cm:gui:module": [],
            "modules": []
        },
        "cm-adccore-allDevices": {
            "cm:gui:module": [],
            "modules": []
        },
        "cm-bigip-cluster_coreltms": {
            "clusterName": "coreltms",
            "useBigiqSync": false,
            "deployWhenDscChangesPending": false,
            "cm:gui:module": [],
            "modules": []
        },
        "cm-dns-allDevices": {
            "cm:gui:module": [],
            "modules": []
        },
        "cm-dns-syncgroup-benlab_gtm_sync_group": {
            "cm:gui:module": [
                "dns"
            ],
            "modules": []
        }
    },
    "isClustered": false,
    "isVirtual": true,
    "isLicenseExpired": false,
    "slots": [
        {
            "volume": "HD1.1",
            "product": "BIG-IP",
            "version": "14.1.0.6",
            "build": "0.0.9",
            "isActive": false
        },
        {
            "volume": "HD1.2",
            "product": "BIG-IP",
            "version": "14.1.2.6",
            "build": "0.0.2",
            "isActive": true
        }
    ],
    "generation": 20420,
    "lastUpdateMicros": 1614784271468459,
    "kind": "shared:resolver:device-groups:restdeviceresolverdevicestate",
    "selfLink": "https://localhost/mgmt/cm/system/machineid-resolver/ae8742ff-efca-4f44-82a1-16fe5a61bfbc"
};