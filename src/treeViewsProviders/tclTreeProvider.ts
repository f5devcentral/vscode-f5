import * as vscode from 'vscode';
import { ext } from '../extensionVariables';


export class TclTreeProvider implements vscode.TreeDataProvider<TCLitem> {

	private _onDidChangeTreeData: vscode.EventEmitter<TCLitem | undefined> = new vscode.EventEmitter<TCLitem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TCLitem | undefined> = this._onDidChangeTreeData.event;

	private _iRules: string[] = [];  
	private _iApps: string[] = [];

	constructor(private workspaceRoot: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: TCLitem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: TCLitem) {
		let treeItems: any[] = [];
		
		if (!ext.mgmtClient) {
			// return nothing if not connected yet
			return Promise.resolve([]);
		}

		if (element) {
			
			if(element.label === 'iRules'){
                
                treeItems = this._iRules.map( el => {
                    return new TCLitem(el.fullPath, '', '', 'rule', vscode.TreeItemCollapsibleState.None, 
                        { command: 'f5.getRule', title: '', arguments: [el] });
                });
				
			} else if (element.label === 'iApps'){
				// todo: get iapps stuff

			}

		} else {

			await this.getIrules(); // refresh tenant information
			await this.getIapps();	// refresh tasks information

			const ruleCount = this._iRules.length !== 0 ? this._iRules.length.toString() : '';
			const appCount = this._iApps.length !== 0 ? this._iApps.length.toString() : '';

			treeItems.push(
				new TCLitem('iRules', ruleCount, '', '', vscode.TreeItemCollapsibleState.Expanded, 
					{ command: '', title: '', arguments: [''] })
			);
			treeItems.push(
				new TCLitem('iApps', appCount, '', '', vscode.TreeItemCollapsibleState.Collapsed,
					{ command: '', title: '', arguments: [''] })
			);
		}
        return Promise.resolve(treeItems);
	}

	private async getIrules() {
        const irules: any = await ext.mgmtClient?.makeRequest(`/mgmt/tm/ltm/rule`);
        
        this._iRules = [];	// clear current irule list
        this._iRules = irules.data.items.map( el => el);

	}

	private async getIapps() {
		// const tasks: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/appsvcs/task/`);

		this._iApps = [];	// clear current tenant list

    }
    
}

class TCLitem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		private version: string,
		private toolTip: string,
		public context: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return this.toolTip;
	}

	get description(): string {
		return this.version;
	}

	contextValue = this.context;
}