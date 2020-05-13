import * as vscode from 'vscode';
import { getPassword } from '../utils/utils'
import { ext } from '../extensionVariables';
// import { callHTTPS } from '../utils/externalAPIs'

export class as3TenantTreeProvider implements vscode.TreeDataProvider<as3TenantItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<as3TenantItem | undefined> = new vscode.EventEmitter<as3TenantItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<as3TenantItem | undefined> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: as3TenantItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: as3TenantItem): Promise<as3TenantItem[]> {
		
		var device = ext.hostStatusBar.text

		if (!device) {
			return Promise.reject('Select device to get as3 tenant info');
		}
		
		const password = await getPassword(device);

		const tenants = await ext.f5Api.as3Tenants(device, password);
		// const decCall = [ "task1", "task2", "task3"]

		// console.log(`as3Tree tenantCall: ${JSON.stringify(tenants.body.items)}`);

		const taskHeader: as3TenantItem = new as3TenantItem(
			'AS3 Tasks',
			'',
			'',
			vscode.TreeItemCollapsibleState.Collapsed,
			{
				command: '',
				title: '',
				arguments: ['none']
			}
		);
		
		const taskItems = tenants.body.items.map((item:any) => {

			const taskId = item.id
			const shortId = taskId.split('-').pop();
			const timeStamp = item.declaration.controls.archiveTimestamp
			// TODO: loop through entire dec, add all tenant names, if there are multiple
			const decTenant = item.results[0].tenant

			return new as3TenantItem(
				shortId,
				timeStamp,
				decTenant,
				vscode.TreeItemCollapsibleState.None, 
				{
					command: 'f5-as3.getTenant',
					title: 'hostTitle',
					arguments: [taskId]
				}
			)
		});

		// var treeItems =  [taskHeader: [taskItems]]
		var treeItems =  taskItems
		// treeItems = taskItems
        return Promise.resolve(treeItems);
	}
    

}

export class as3TenantItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		private version: string,
		private toolTip: string,
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

	// iconPath = {
	// 	light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
	// 	dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	// };

    // contextValue = 'dependency';
    
}