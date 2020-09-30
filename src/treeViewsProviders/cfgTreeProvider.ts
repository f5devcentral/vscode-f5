// import { bigipConfig } from 'project-corkscrew';
import { TreeDataProvider, TreeItem, TreeItemCollapsibleState, Event, commands, EventEmitter, Uri, Command, window, ViewColumn, Position, workspace, TextDocument, Range }  from 'vscode';
import { BigipConfig } from 'project-corkscrew/dist/ltm';
import { ext } from '../extensionVariables';
// import { bigipConfig } from '../../node_modules/project-corkscrew/dist/index';


export class CfgProvider implements TreeDataProvider<CfgApp> {

	private _onDidChangeTreeData: EventEmitter<CfgApp | undefined> = new EventEmitter<CfgApp | undefined>();
    readonly onDidChangeTreeData: Event<CfgApp | undefined> = this._onDidChangeTreeData.event;
    
    private bigipConf: string | undefined;
    private tmosApps: {name: string, config: string}[] = [];
    private expLogs: string | undefined;
    private confObj: any;
    private confArray: string[] = [];
    private confArraySingleObjs: string[] = [];

	constructor() {
    }
    
    async explodeConfig(config: string){
        // set context to make view visible
        commands.executeCommand('setContext', 'f5.cfgTreeContxt', true);
        const bigipConf = new BigipConfig(config);
        this.bigipConf = bigipConf.bigipConf;
        //looking to return the multi-level object so we can see what it looks like in the view
        this.confObj = bigipConf.configMultiLevelObjects;
        this.tmosApps = bigipConf.apps();
        this.confArray = bigipConf.configAsSingleLevelArray;
        this.confArraySingleObjs = bigipConf.configArrayOfSingleLevelObjects;
        this.expLogs = bigipConf.logs();
    }

	refresh(): void {
		this._onDidChangeTreeData.fire();
    }
    
    clear(): void {
        // hide view from being visible
        commands.executeCommand('setContext', 'f5.cfgTreeContxt', false);
        this.bigipConf = undefined;
        this.tmosApps = [];
        this.expLogs = undefined;
        this.confObj = {};
        this.confArray = [];
        this.confArraySingleObjs = [];
    }

    getTreeItem(element: CfgApp): TreeItem {
		return element;
	}

	async getChildren(element?: CfgApp): Promise<CfgApp[]> {

		var treeItems: CfgApp[] = [];
		if(element) {
            
            if (element.label === 'Apps') {
                
				treeItems = this.tmosApps.map((el: {name: string, config: string}) => {
					return new CfgApp(el.name, '', TreeItemCollapsibleState.None,
						{command: 'f5.cfgExplore-show', title: '', arguments: [{ item: el.config, type: 'app'}]});
				});

			}

		} else {

			treeItems.push(new CfgApp('bigip.conf', '', TreeItemCollapsibleState.None,
                {command: 'f5.cfgExplore-show', title: '', arguments: [{item: this.bigipConf, type: 'conf'}]}));

            // treeItems.push(new CfgApp('bigip_base.conf', 'just idea to add...', TreeItemCollapsibleState.None,
            //     {command: 'f5.cfgExplore-show', title: '', arguments: [{item: this.bigipConf, type: 'conf'}]}));
                
            const allApps = this.tmosApps.map((el: {name: string, config: string}) => el.config);
            const allAppsFlat = allApps.join('\n\n##################################################\n\n');
                
            treeItems.push(new CfgApp('Apps', 'All apps', TreeItemCollapsibleState.Collapsed,
                {command: 'f5.cfgExplore-show', title: '', arguments: [{item: allAppsFlat, type: 'log'}]}));
                
            treeItems.push(new CfgApp('Logs', '', TreeItemCollapsibleState.None,
                {command: 'f5.cfgExplore-show', title: '', arguments: [{item: this.expLogs, type: 'log'}]}));

            treeItems.push(new CfgApp('Config Object', '', TreeItemCollapsibleState.None,
                {command: 'f5.cfgExplore-show', title: '', arguments: [{item: this.confObj, type: 'obj'}]}));
            
            treeItems.push(new CfgApp('Config Array', "ex. [ltm node /Common/192.168.1.20 { address 192.168.1.20 }, ...]", TreeItemCollapsibleState.None,
                {command: 'f5.cfgExplore-show', title: '', arguments: [{item: this.confArray, type: 'array'}]}));

            treeItems.push(new CfgApp('Config Array Objects', "ex. [{name: 'parent object name', config: 'parent config obj body'}]", TreeItemCollapsibleState.None,
                {command: 'f5.cfgExplore-show', title: '', arguments: [{item: this.confArraySingleObjs, type: 'array'}]}));

            // treeItems.push(new CkApp('Config Object', '', TreeItemCollapsibleState.None,
            //     {command: 'f5.cfgExplore-show', title: '', arguments: [{item: this.confObj, type: 'array'}]}));

		}
        return Promise.resolve(treeItems);
    }
    

    async render(x: {item: string, type: string}) {

        const newEditorColumn = ext.settings.previewColumn;
        const editors = window.visibleTextEditors;
        let viewColumn: ViewColumn | undefined;

        let docName = 'app.conf';
        let docContent: string;
        if(x.type === 'app' || x.type === 'conf' || x.type === 'log'){
            // render as app.conf
            docContent = x.item;
        } else {
            // should be a obj - make it readable
            docContent = JSON.stringify(x.item, undefined, 2);
            docName = 'app.json';
        }
        
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


export class CfgApp extends TreeItem {
	constructor(
		public readonly label: string,
		// private version: string,
		private toolTip: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly command?: Command
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return this.toolTip;
	}
}