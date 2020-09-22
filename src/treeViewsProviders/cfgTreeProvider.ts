import { bigipConfig } from 'project-corkscrew';
import { TreeDataProvider, TreeItem, TreeItemCollapsibleState, Event, EventEmitter, Uri, Command, window, ViewColumn, Position, workspace, TextDocument, Range }  from 'vscode';
import { BigipConfig } from 'project-corkscrew/dist/ltm';
import { ext } from '../extensionVariables';
// import { bigipConfig } from '../../node_modules/project-corkscrew/dist/index';


export class CfgProvider implements TreeDataProvider<cfgApp> {

	private _onDidChangeTreeData: EventEmitter<cfgApp | undefined> = new EventEmitter<cfgApp | undefined>();
    readonly onDidChangeTreeData: Event<cfgApp | undefined> = this._onDidChangeTreeData.event;
    
    private bigipConf: string = '';
    private tmosApps: {name: string, config: string}[] = [];
    private expLogs: string = '';
    private confObj: any;
    private confArray: string[] = [];
    private confArraySingleObjs: string[] = [];

	constructor() {
    }
    
    async explodeConfig(config: string){
        const bigipConf = new BigipConfig(config);
        this.bigipConf = bigipConf.bigipConf;
        //looking to return the multi-level object so we can see what it looks like in the view
        this.confObj = bigipConf.configMultiLevelObjects;
        this.tmosApps = bigipConf.apps();
        this.confArray = bigipConf.configAsSingleLevelArray;
        this.confArraySingleObjs = bigipConf.configArrayOfSingleLevelObjects;
        // setTimeout( () => { }, 500);
        this.expLogs = bigipConf.logs();
        // setTimeout( () => { }, 500);
    }

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

    getTreeItem(element: cfgApp): TreeItem {
		return element;
	}

	async getChildren(element?: cfgApp): Promise<cfgApp[]> {

		var treeItems: cfgApp[] = [];
		if(element) {
            
            if (element.label === 'Apps') {
                
				treeItems = this.tmosApps.map((el: {name: string, config: string}) => {
					return new cfgApp(el.name, '', TreeItemCollapsibleState.None,
						{command: 'f5.cfgExplore-show', title: '', arguments: [{ item: el.config, type: 'app'}]});
				});

			}

		} else {

			treeItems.push(new cfgApp('bigip.conf', '', TreeItemCollapsibleState.None,
				{command: 'f5.cfgExplore-show', title: '', arguments: [{item: this.bigipConf, type: 'conf'}]}));
                
            treeItems.push(new cfgApp('Apps', '', TreeItemCollapsibleState.Collapsed,
                {command: '', title: '', arguments: ['']}));
                
            treeItems.push(new cfgApp('Logs', '', TreeItemCollapsibleState.None,
                {command: 'f5.cfgExplore-show', title: '', arguments: [{item: this.expLogs, type: 'log'}]}));

            treeItems.push(new cfgApp('Config Object', '', TreeItemCollapsibleState.None,
                {command: 'f5.cfgExplore-show', title: '', arguments: [{item: this.confObj, type: 'obj'}]}));
            
            treeItems.push(new cfgApp('Config Array', "ex. [ltm node /Common/192.168.1.20 { address 192.168.1.20 }, ...]", TreeItemCollapsibleState.None,
                {command: 'f5.cfgExplore-show', title: '', arguments: [{item: this.confArray, type: 'array'}]}));

            treeItems.push(new cfgApp('Config Array Objects', "ex. [{name: 'parent object name', config: 'parent config obj body'}]", TreeItemCollapsibleState.None,
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


export class cfgApp extends TreeItem {
	constructor(
		public readonly label: string,
		// private version: string,
		private toolTip: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly command?: Command
	) {
		super(label, collapsibleState);
	}

	// get tooltip(): string {
	// 	return this.toolTip;
	// }
}