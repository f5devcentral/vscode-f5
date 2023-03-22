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
    commands,
    MarkdownString,
    ThemeIcon,
    Diagnostic,
    DiagnosticSeverity,
    ExtensionContext,
} from 'vscode';
import jsYaml from 'js-yaml';

import { ext } from '../extensionVariables';

import { ConfigFile, Explosion, Stats, TmosApp, xmlStats } from 'f5-corkscrew';
import { logger } from '../logger';
import BigipConfig from 'f5-corkscrew/dist/ltm';
import path from 'path';
import { CfgExploreReport, TmosAppReport } from '../models';

// remodel everything here like this example:  https://github.com/microsoft/vscode-extension-samples/blob/master/tree-view-sample/src/testView.ts
// it will provide a working 'reveal' function and a browsable tmos config tree in the view

/**
 * Tree view provider class that hosts and present the data for the Config Explorer view
 */
export class CfgProvider implements TreeDataProvider<CfgApp> {

    private _onDidChangeTreeData: EventEmitter<CfgApp | undefined> = new EventEmitter<CfgApp | undefined>();
    readonly onDidChangeTreeData: Event<CfgApp | undefined> = this._onDidChangeTreeData.event;

    redDot = ext.context.asAbsolutePath(path.join("images", "redDot.svg"));
    orangeDot = ext.context.asAbsolutePath(path.join("images", "orangeDot.svg"));
    yellowDot = ext.context.asAbsolutePath(path.join("images", "yellowDot.svg"));
    greenDot = ext.context.asAbsolutePath(path.join("images", "greenDot.svg"));
    greenCheck = ext.context.asAbsolutePath(path.join("images", "greenCheck.svg"));

    explosion: Explosion | undefined;
    // confObj: BigipConfObj | undefined;
    /**
     * trying to use this to make the view in focus after initialization
     */
    viewElement: CfgApp | undefined;
    bigipConfig: BigipConfig | undefined;
    parsedFileEvents: any = [];
    parsedObjEvents: any = [];
    partitions: string[] = [];
    // partCounts: {} | undefined;
    readonly brkr = '\n\n##################################################\n\n';

    xcDiag: boolean = false;
    ctx: ExtensionContext;

    constructor(ctx: ExtensionContext) {
        this.ctx = ctx;
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
                    ext.eventEmitterGlobal.emit('log-info', exp.stats);
                    
                    // ts-todo: add key to telemetry
                    ext.telemetry.capture({ command: 'corkscrew-explosion', stats: exp.stats });
                    this.refresh();
                })
                .catch(err => logger.error('makeExplosion', err));

        });
    }

    buildReport(): CfgExploreReport {

        // base report explosion details
        const report: CfgExploreReport = {
            Greeting: 'Welcome to the vscode-f5 TMOS Config Explorer Report!',
            documentation: 'https://f5devcentral.github.io/vscode-f5/#/',
            repo: this.ctx.extension.packageJSON.repository.url,
            issues: this.ctx.extension.packageJSON.bugs.url,
            extensionVersion: this.ctx.extension.packageJSON.version,
            id: this.explosion!.id,
            dateTime: this.explosion!.dateTime,
            hostname: this.explosion!.hostname,
            inputFileType: this.explosion!.inputFileType,
            sourceFileCount: this.explosion!.config.sources.length,
            appCount: this.explosion!.config.apps?.length,
            cfgExploreStats: this.explosion!.stats,
            cfgExploreParsedFiles: this.parsedFileEvents,
            xcDiagStats: {
                defaultRedirects: 0,
                Green: undefined,
                Information: undefined,
                Warning: undefined,
                Error: undefined,
            },
            xcDiags: {
                defaultRedirects: [],
                Green: [],
                Information: [],
                Warning: [],
                Error: [],
            },
            apps: [],
        };
        
        // add xc diagnostics if enabled
        if(this.xcDiag) {
            this.explosion?.config?.apps?.map((app: TmosApp) => {
                
                // get xc diags for app
                const diags = ext.xcDiag.getDiagnostic(app.configs);
                const stats = ext.xcDiag.getDiagStats(diags);

                // does this app have the '_sys_https_redirect' irule?
                const defaultRedirect = diags.find(a => a.code === '2671');
                if(defaultRedirect) {

                    report.xcDiagStats!.defaultRedirects++;
                    report.xcDiags?.defaultRedirects.push(app.name);
                    
                }
                
                // copy app config to local var
                const appD = JSON.parse(JSON.stringify(app)) as TmosAppReport;
                
                // append xc diags to app in report (if any)
                if (diags.length > 0) {

                    // slim and sort diags
                    appD.xcDiagnostics = slimDiags(diags);
                    appD.xcDiagStats = stats;
                }

                // figure out app diag status green/yellow/orange/red
                appD.xcDiagStatus = stats?.Error ? 'Error'
                : stats?.Warning ? 'Warning'
                    : stats?.Information ? 'Information' : 'Green';

                // push app diags to high level report
                if(appD.xcDiagStatus === 'Error') {

                    // start or increment high level stats
                    typeof report.xcDiagStats?.Error === 'number' ?
                    report.xcDiagStats.Error = report.xcDiagStats.Error + 1 :
                    report.xcDiagStats!.Error = 1;

                    // add appName/diags 
                    report.xcDiags!.Error!.push({
                        appName: appD.name,
                        diagnostics: appD.xcDiagnostics
                    });

                } else if (appD.xcDiagStatus === 'Warning') {

                    typeof report.xcDiagStats?.Warning === 'number' ?
                    report.xcDiagStats.Warning = report.xcDiagStats.Warning + 1 :
                    report.xcDiagStats!.Warning = 1;

                    report.xcDiags!.Warning!.push({
                        appName: appD.name,
                        diagnostics: appD.xcDiagnostics
                    });

                } else if (appD.xcDiagStatus === 'Information') {

                    typeof report.xcDiagStats?.Information === 'number' ?
                    report.xcDiagStats.Information = report.xcDiagStats.Information + 1 :
                    report.xcDiagStats!.Information = 1;

                    report.xcDiags!.Information!.push({
                        appName: appD.name,
                        diagnostics: appD.xcDiagnostics
                    });

                } else if (appD.xcDiagStatus === 'Green') {

                    typeof report.xcDiagStats?.Green === 'number' ?
                    report.xcDiagStats.Green = report.xcDiagStats.Green + 1 :
                    report.xcDiagStats!.Green = 1;

                    report.xcDiags!.Green!.push(appD.name);

                }
                

                // add app status to report
                report.apps.push(appD);

                // gather xc app diag stats "appCounts"

            });
        } else {

            // xc diagnostics not enabled so clean report of those objects and append app details
            delete report.xcDiagStats;
            delete report.xcDiags;

            report.apps = this.explosion?.config?.apps as TmosAppReport[];
        }

        return report;
    }


    async importExplosion(exp: Explosion) {
        this.explosion = exp;
    }

    async refresh(): Promise<void> {
        if(ext.xcDiag?.loadRules()) {
            ext.xcDiag.loadRules();
        }
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

            // if parent "partitions" item, then get paritions and details to list 
            if (element.label === 'Partitions' && this.explosion.config.apps) {

                // re-assign the apps so TS knows we have a value here
                const apps = this.explosion.config.apps;

                treeItems = sortTreeItems(this.partitions.map((el) => {

                    // get all the apps for the given partition
                    const partitionApps = apps.filter(item => item.name.startsWith(`/${el}`));

                    // collapse all the configs from the apps in the partition
                    const appConfigs = partitionApps.map(item => item.configs.join('\n'));

                    let diagStatsYmlToolTip: string | MarkdownString = '';
                    let icon = '';

                    let diags, stats;

                    // if xc diag enabled
                    if (this.xcDiag) {
                        diags = ext.xcDiag.getDiagnostic(appConfigs.join('\n'));
                        stats = ext.xcDiag.getDiagStats(diags);

                        const diagStatsYml = jsYaml.dump(stats, { indent: 4 });
                        diagStatsYmlToolTip = new MarkdownString().appendCodeblock(diagStatsYml, 'yaml');
                        icon = stats?.Error ? this.redDot
                            : stats?.Warning ? this.orangeDot
                                : stats?.Information ? this.yellowDot : this.greenDot;
                    }

                    return new CfgApp(el, diagStatsYmlToolTip, partitionApps.length.toString(), 'cfgPartition', icon, TreeItemCollapsibleState.Collapsed,
                        { command: 'f5.cfgExplore-show', title: '---newCmd', arguments: [appConfigs] });
                }));


            // selected app partition
            } else if (element.contextValue === 'cfgPartition' && this.explosion.config.apps) {

                // filter the apps that are in this partition
                const partitionApps = this.explosion.config.apps.filter(item => item.name.startsWith(`/${element.label}`));

                treeItems = sortTreeItems(partitionApps.map((el) => {

                    // split the app/vs from the partition name
                    const appName = el.name.split('/').splice(2);

                    let diagStatsYmlToolTip: string | MarkdownString = '';
                    let icon: string | ThemeIcon = '';

                    // if xc diag enabled
                    if (this.xcDiag) {

                        // loop through apps and get exclusions
                        const exclusions: { vs: string, reasons: string[] }[] = [];
                        // el.configs.forEach(elin => {
                        //     const excluded = ext.xcDiag.getDiagnosticExlusion(elin);
                        //     if(excluded.reasons.length > 0) {
                        //         exclusions.push(excluded);
                        //     }
                        // });
                        const diags = ext.xcDiag.getDiagnostic(el.configs);
                        const stats = ext.xcDiag.getDiagStats(diags);

                        const diagStatsYml = jsYaml.dump({ stats, exclusions}, { indent: 4 });
                        diagStatsYmlToolTip = new MarkdownString().appendCodeblock(diagStatsYml, 'yaml');
                        icon = exclusions.length > 0 ? new ThemeIcon('debug-step-over', '#D3D3D3')
                            : stats?.Error ? this.redDot
                            : stats?.Warning ? this.orangeDot
                                : stats?.Information ? this.yellowDot : this.greenDot;
                    }

                    // build/return the tree item
                    return new CfgApp(appName.join('/'), diagStatsYmlToolTip, el.configs.length.toString(), 'cfgAppItem', icon, TreeItemCollapsibleState.None,
                        { command: 'f5.cfgExplore-show', title: '', arguments: [el.configs] });
                }));


            } else if (element.label === 'Sources' && this.explosion) {

                treeItems = sortTreeItems(this.explosion.config.sources.map((el: ConfigFile) => {
                    return new CfgApp(el.fileName, '', '', '', '', TreeItemCollapsibleState.None,
                        { command: 'f5.cfgExplore-show', title: '', arguments: [el.content] });
                }));
            }

        } else {


            // header element describing source details and explosion stats
            const title = this.explosion.hostname || this.explosion.config.sources[0].fileName;
            const desc = `${this.explosion.inputFileType} - ${this.explosion.stats.sourceTmosVersion}`;
            const expStatsYml = jsYaml.dump(this.explosion.stats, { indent: 4 });
            const expStatsYmlToolTip = new MarkdownString().appendCodeblock(expStatsYml, 'yaml');
            this.viewElement = new CfgApp(title, expStatsYmlToolTip, desc, 'cfgHeader', '', TreeItemCollapsibleState.None);
            treeItems.push(this.viewElement);

            // tmos to xc diangostics header/switch
            const xcDiagStatus = this.xcDiag ? "Enabled" : "Disabled";
            const icon = xcDiagStatus === "Enabled" ? this.greenCheck : '';

            let xcTooltip: string | MarkdownString = '';
            // let icon
            
            // if xc diag enabled
            if (this.xcDiag) {
                    const appsList = this.explosion?.config.apps?.map((el: TmosApp) => el.configs.join('\n')) || [];
                    // const excluded = ext.xcDiag.getDiagnosticExlusion(appsList);
                    // const defaultRedirect = new RegExp('\/Common\/_sys_https_redirect', 'gm');
                    // const nnn = defaultRedirect.exec(appsList.join('\n'));

                    const mmm = appsList.join('\n').match(/\/Common\/_sys_https_redirect/g) || [];

                    const diags = ext.xcDiag.getDiagnostic(appsList);

                    const stats = { 
                        totalApps: appsList.length,
                        '_sys_https_redirect': mmm.length, 
                        stats: ext.xcDiag.getDiagStats(diags) };

                    const diagStatsYml = jsYaml.dump(stats, { indent: 4 });
                    xcTooltip = new MarkdownString().appendCodeblock(diagStatsYml, 'yaml');
                }
            
            treeItems.push(new CfgApp(
                'XC Diagnostics',
                xcTooltip,
                xcDiagStatus,
                'xcDiag', icon,
                TreeItemCollapsibleState.None, {
                command: 'f5.cfgExplore-xcDiagSwitch',
                title: '',
                arguments: []
            }
            ));


            // sources parent folder
            const allSources = this.explosion.config.sources.map((el) => el.content);
            treeItems.push(new CfgApp(
                'Sources',
                '',
                this.explosion.config.sources.length.toString(),
                '', '',
                TreeItemCollapsibleState.Collapsed, {
                command: 'f5.cfgExplore-show',
                title: '',
                arguments: [allSources]
            }
            ));

            // // split off the partition names and count the number of unique occurances
            // this.partCounts = this.explosion?.config?.apps?.map(item => item.name.split('/')[1])
            //     // @ts-expect-error
            //     .reduce((acc, curr) => (acc[curr] = (acc[curr] || 0) + 1, acc), {});

            this.partitions = [...new Set(this.explosion?.config?.apps?.map(item => item.name.split('/')[1]))];

            // get all the apps configs
            const allApps = this.explosion?.config.apps?.map((el: TmosApp) => el.configs.join('\n').concat(this.brkr));

            // const appsTotal = this.explosion?.config.apps ? this.explosion.config.apps.length.toString() : '';
            // const baseTotal = this.explosion?.config.base ? this.explosion.config.base.length.toString() : '';
            const doTotal = this.explosion?.config.doClasses ? this.explosion.config.doClasses.length.toString() : '';
            const logTotal = this.explosion?.logs ? this.explosion.logs.length.toString() : '';

            treeItems.push(new CfgApp('Partitions', 'Click for All apps', this.partitions.length.toString(), '', '', TreeItemCollapsibleState.Collapsed,
                { command: 'f5.cfgExplore-show', title: '', arguments: [allApps] }));

            // if (this.explosion?.config?.base) {
            //     treeItems.push(new CfgApp('Base', '', baseTotal, '', TreeItemCollapsibleState.None,
            //         { command: 'f5.cfgExplore-show', title: '', arguments: [this.explosion.config.base] }));
            // }

            if (this.explosion?.config?.doClasses) {
                treeItems.push(new CfgApp('DO', '', doTotal, '', '', TreeItemCollapsibleState.None,
                    { command: 'f5.cfgExplore-show', title: '', arguments: [this.explosion.config.doClasses] }));
            }

            if (this.bigipConfig?.fileStore && this.bigipConfig?.fileStore.length > 0) {
                const allFileStore = this.bigipConfig.fileStore.filter((el: ConfigFile) => {
                    // only return the certs and keys for now
                    if (el.fileName.includes('/certificate_d/') || el.fileName.includes('/certificate_key_d/')) {
                        return true;
                    }
                })
                    .map((el: ConfigFile) => `\n###  ${el.fileName}\n${el.content}\n\n`);

                treeItems.push(new CfgApp('FileStore', '', this.bigipConfig.fileStore.length.toString(), '', '', TreeItemCollapsibleState.None,
                    { command: 'f5.cfgExplore-show', title: '', arguments: [allFileStore.join('\n')] }));
            }

            if (this.explosion?.logs) {
                treeItems.push(new CfgApp('Logs', '', logTotal, '', '', TreeItemCollapsibleState.None,
                    { command: 'f5.cfgExplore-show', title: '', arguments: [this.explosion.logs] }));
            }

            if (this.bigipConfig?.configObject) {
                treeItems.push(new CfgApp('Config Object', '', '', '', '', TreeItemCollapsibleState.None,
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
                treeItems.push(new CfgApp('Stats Object', '', '', '', '', TreeItemCollapsibleState.None,
                    { command: 'f5.cfgExplore-show', title: '', arguments: [statObj] }));
            }

            if (this.bigipConfig?.defaultProfileBase) {
                treeItems.push(new CfgApp('Default Profile Base', '', '', '', '', TreeItemCollapsibleState.None,
                    { command: 'f5.cfgExplore-show', title: '', arguments: [this.bigipConfig.defaultProfileBase.content] }));
            }

            if (this.bigipConfig?.license) {
                treeItems.push(new CfgApp('License', '', '', '', '', TreeItemCollapsibleState.None,
                    { command: 'f5.cfgExplore-show', title: '', arguments: [this.bigipConfig.license.content] }));
            }

        }
        return Promise.resolve(treeItems);
    }


    async render(items: string[] | Object, diagTag?: boolean) {

        const newEditorColumn = ext.settings.previewColumn;
        const editors = window.visibleTextEditors;
        let viewColumn: ViewColumn | undefined;

        let docName = 'app.conf';
        let docContent: string;

        
        if (Array.isArray(items)) {
            
            docContent = items.join('\n');
            
        } else if (Object(items)) {
            if( items.hasOwnProperty('id') && items.hasOwnProperty('description') && items.hasOwnProperty('label')) {
                
                docName = 'cfgExploreReport.json';
                docContent = JSON.stringify(items, undefined, 4);
                const a = '';
            } else {
                
                // if array -> single selection, just join internal array normally -> display contents
                docContent = JSON.stringify(items, undefined, 4);
            }
        }

        // this loop is syncronous
        for (const el of editors) {
            if (el.document.fileName === 'app.conf' || el.document.fileName === 'app.json') {
                viewColumn = el.viewColumn;
            }
        };


        // if vClm has a value assign it, else set column 1
        viewColumn = viewColumn ? viewColumn : newEditorColumn;



        var vDoc: Uri = Uri.parse("untitled:" + docName);
        workspace.openTextDocument(vDoc)
            .then((a: TextDocument) => {
                window.showTextDocument(a, viewColumn, false).then(async e => {
                    await e.edit(edit => {
                        const startPosition = new Position(0, 0);
                        const endPosition = a.lineAt(a.lineCount - 1).range.end;
                        edit.replace(new Range(startPosition, endPosition), docContent);
                        commands.executeCommand("cursorTop");
                    });
                    if(diagTag && this.xcDiag) {
                        // if we got a text block with diagnostic tag AND xc diagnostics are enabled, then update the document with diagnosics
                        ext.xcDiag.updateDiagnostic(a);
                    }
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
        public tooltip: string | MarkdownString,
        public description: string,
        public contextValue: string,
        public iconPath: string | ThemeIcon,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly command?: Command
    ) {
        super(label, collapsibleState);
    }
}



/**
 * Slim down and sort diags array for report
 * Error > Warning > Information
 * 
 * example: ["Warning-094d: NATs are supported, but not statics", "Information-1360: Virtual Server references iRule(s), review iRules for compatibility"]

 * 
 * @param d VSCode Diagnostics array
 * @returns 
 */
export function slimDiags(d: Diagnostic[]): string[]{

    // slim down the diagnostics to a single line
    const slimDiags = d.map(d => {
        const sev = DiagnosticSeverity[d.severity];
        return `${sev}-${d.code}: ${d.message}`;
    });

    // sort the lines by severity
    return slimDiags.sort((a, b) => {

        // the order of these sevs will set the order of the diagnostics lines
        const sevs = ['Error','Warning','Information'];
        
        const aVerb = a.split('-')[0];
        const bVerb = b.split('-')[0];
        const aIndex = sevs.indexOf(aVerb);
        const bIndex = sevs.indexOf(bVerb);

        return aIndex - bIndex;
    });
}