import { 
    TreeDataProvider, 
    TreeItem, 
    TreeItemCollapsibleState, 
    Event, 
    commands, 
    EventEmitter, 
    Uri, 
    Command, 
    window, 
    ViewColumn, 
    Position,
    workspace, 
    TextDocument, 
    Range
 }  from 'vscode';
import { ext } from '../extensionVariables';

import { BigipConfObj, ConfigFiles, Explosion, TmosApp } from 'f5-corkscrew';

/**
 * Tree view provider class that hosts and present the data for the Config Explorer view
 */
export class CfgProvider implements TreeDataProvider<CfgApp> {

	private _onDidChangeTreeData: EventEmitter<CfgApp | undefined> = new EventEmitter<CfgApp | undefined>();
    readonly onDidChangeTreeData: Event<CfgApp | undefined> = this._onDidChangeTreeData.event;
    
    private explosion: Explosion | undefined;
    // bigipConfs: ConfigFiles = [];
    confObj: BigipConfObj | undefined;
    viewElement: CfgApp | undefined;

    constructor() {
    }

    async explodeConfig(explosion: Explosion){
        // set context to make view visible
        // commands.executeCommand('setContext', 'f5.cfgTreeContxt', true);
        // this.clear();
        // this.bigipConfs = explosion.config.sources;
        // this.confObj = cfgObj;
        this.explosion = explosion;
        // await this.refresh();
    }

	async refresh(): Promise<void> {
        this._onDidChangeTreeData.fire(undefined);
    }
    
    clear(): void {
        // hide view from being visible
        // commands.executeCommand('setContext', 'f5.cfgTreeContxt', false);
        // clear all the data
        // this.bigipConfs = [];
        this.confObj = undefined;
        this.explosion = undefined;
        this.refresh();
    }
    
 
    getParent(element: CfgApp): CfgApp {
		return element;
    }
    getTreeItem(element: CfgApp): TreeItem {
		return element;
    }

	async getChildren(element?: CfgApp): Promise<CfgApp[]> {

        if(!this.explosion) {
            return Promise.resolve([]);
        }

		var treeItems: CfgApp[] = [];
		if(element) {
            
            if (element.label === 'Apps') {

                if (this.explosion) {
                    treeItems = this.explosion.config.apps.map((el: TmosApp) => {
                        const count = el.configs.length.toString();
                        return new CfgApp(el.name, '', count, 'cfgAppItem', TreeItemCollapsibleState.None,
                            {command: 'f5.cfgExplore-show', title: '---newCmd', arguments: [el.configs]});
                    });
                }
                                
			} else if (element.label === 'Sources') {
                
                treeItems = this.explosion.config.sources.map((el: any) => {
                    return new CfgApp(el.fileName, '', '', '', TreeItemCollapsibleState.None,
                        {command: 'f5.cfgExplore-show', title: '', arguments: [el.content]});
                });
            }

		} else {

            const title = 
                // if hostname is available, assign
                this.explosion?.hostname ? this.explosion.hostname

                // if not, this should be a single file input, grab it's name
                : this.explosion?.config.sources[0].fileName ? this.explosion.config.sources[0].fileName

                // default value - this should never happen, but TS needed it...
                : '';

            const version = this.explosion?.stats.sourceTmosVersion;
            const inputFileType = this.explosion?.inputFileType;
            const desc = `${inputFileType} - ${version}`;

            this.viewElement = new CfgApp(title, 'Source Device Details', desc, '', TreeItemCollapsibleState.None);
			treeItems.push(this.viewElement);

            const allSources = this.explosion.config.sources.map((el) => el.content);

			treeItems.push(new CfgApp('Sources', '', this.explosion.config.sources.length.toString(), '', TreeItemCollapsibleState.Collapsed,
                {command: 'f5.cfgExplore-show', title: '', arguments: [allSources]}));

            // treeItems.push(new CfgApp('bigip_base.conf', 'just idea to add...', TreeItemCollapsibleState.None,
            //     {command: 'f5.cfgExplore-show', title: '', arguments: [{item: this.bigipConf, type: 'conf'}]}));
                
            // get all the apps configs
            const brkr = '\n\n##################################################\n\n';
            const allApps = this.explosion?.config.apps.map((el: TmosApp) => el.configs.join('\n').concat(brkr));

            // allApps?.forEach( el => {

            // })
            // const allAppsFlat = allApps.join('\n\n##################################################\n\n');
            const appsTotal = this.explosion?.config.apps ? this.explosion.config.apps.length.toString() : '';
            const baseTotal = this.explosion?.config.base ? this.explosion.config.base.length.toString() : '';
            const logTotal = this.explosion?.logs ? this.explosion.logs.length.toString() : '';
            // const taskCount = this._tasks.length !== 0 ? this._tasks.length.toString() : '';
                
            treeItems.push(new CfgApp('Apps', 'All apps', appsTotal, '', TreeItemCollapsibleState.Collapsed,
                {command: 'f5.cfgExplore-show', title: '', arguments: [allApps]}));
                
            treeItems.push(new CfgApp('Base', '', baseTotal, '', TreeItemCollapsibleState.None,
                {command: 'f5.cfgExplore-show', title: '', arguments: [this.explosion?.config.base]}));

            treeItems.push(new CfgApp('Logs', '', logTotal, '', TreeItemCollapsibleState.None,
                {command: 'f5.cfgExplore-show', title: '', arguments: [this.explosion?.logs]}));

            if(this.confObj) {
                treeItems.push(new CfgApp('Config Object', '', '', '', TreeItemCollapsibleState.None,
                    {command: 'f5.cfgExplore-show', title: '', arguments: [this.confObj]}));
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

        // if (isObject(items)) {
            
        //     // if object = config object -> stringify as needed
        //     // if () {
        //         docContent = JSON.stringify(items, undefined, 4);
        //     // }

        // } else
        // if (Array.isArray(items) && items.length === 1 && false) {
        
        if (Array.isArray(items)) {

            docContent = items.join('\n');
        
        } else if (isObject(items)) {
            // if array -> single selection, just join internal array normally -> display contents
            docContent = JSON.stringify(items, undefined, 4);

        // } else {
        //     // just string return
        //     docContent = items;
        //     // this shouo
        }


        // if(x.type === 'app' || x.type === 'conf' || x.type === 'log'){
        //     // render as app.conf
        //     docContent = x.item.join('\n');
            
        // } else if ( x.type === 'all-apps') {
            
        //     // feed single conf file
        //     // docContent = x.item[0];
        //     const brkr = '\n\n##################################################\n\n';
        //     docContent = x.item.join(brkr);

        // } else {
        //     // should be a obj - make it readable
        //     docContent = JSON.stringify(x.item, undefined, 2);
        //     docName = 'app.json';
        // }
        
        editors.forEach(el => {
            if (el.document.fileName === 'app.conf' || el.document.fileName === 'app.json') {
                viewColumn = el.viewColumn;
            }
        });
        
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

function isObject(x: any) {
	// return object(true) if json object
	return x === Object(x);
}

// const flatten = (ary) => ary.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [])

// function flatDeep(arr: any[], d = 1) {
//     return d > 0 ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatDeep(val, d - 1) : val), []) : arr.slice();
//  };


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