import * as vscode from 'vscode';
import { ext } from '../extensionVariables';

export class AS3TreeProvider implements vscode.TreeDataProvider<AS3Item> {

	private _onDidChangeTreeData: vscode.EventEmitter<AS3Item | undefined> = new vscode.EventEmitter<AS3Item | undefined>();
	readonly onDidChangeTreeData: vscode.Event<AS3Item | undefined> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: AS3Item): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: AS3Item): Promise<AS3Item[]> {

		var device = ext.hostStatusBar.text;
		var as3 = ext.as3Bar.text;

		if (!device || !as3 ) {
			// console.log('AS3TasksTree: no device or as3 detected');
			return Promise.resolve([]);
		}

		// await ext.mgmtClient.token();
		const rp = await ext.mgmtClient.getToken();
		const resp: any = await ext.mgmtClient.makeRequest(`/mgmt/shared/appsvcs/task/`);

		const taskItems = resp.data.items.map((item:any) => {

			const taskId = item.id;
			const shortId = taskId.split('-').pop();
			var timeStamp;

			// if no decs in task or none on box, it returns limited details, but the request still gets an ID, so we blank in what's not there
			if (item.declaration.hasOwnProperty('controls')){
				timeStamp = item.declaration.controls.archiveTimestamp;
			} else {
				timeStamp = '';
			}


			// TODO: loop through entire dec, add all tenant names, if there are multiple
			const decTenant = item.results[0].tenant;

			return new AS3Item(
				shortId,
				timeStamp,
				decTenant,
				vscode.TreeItemCollapsibleState.None, 
				{
					command: 'f5-as3.getTask',
					title: 'hostTitle',
					arguments: [taskId]
				}
			);
		});

        return Promise.resolve(taskItems);
	}
    

}

export class AS3Item extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		private version: string,
		private toolTip: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	// get toolTip(): string {
	// 	return this.toolTip;
	// }

	get description(): string {
		return this.version;
	}

	// iconPath = {
	// 	light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
	// 	dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	// };

    // contextValue = 'dependency';
    
}