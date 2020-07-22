import * as vscode from 'vscode';
import { ext } from '../extensionVariables';


export class AS3TenantTreeProvider implements vscode.TreeDataProvider<AS3item> {

	private _onDidChangeTreeData: vscode.EventEmitter<AS3item | undefined> = new vscode.EventEmitter<AS3item | undefined>();
	readonly onDidChangeTreeData: vscode.Event<AS3item | undefined> = this._onDidChangeTreeData.event;

	// private _as3TenCount: number = 0;  
	private _tenants: string[] = [];  

	constructor(private workspaceRoot: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: AS3item): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: AS3item): Promise<AS3item[]> {
		let treeItems = [];
		
		await ext.mgmtClient.getToken();
		await this.getTenants(); // refresh tenant information

		if (element) {
			
			if(element.label === 'Tenants'){
				
				treeItems = this._tenants.map( tenant => {
					return new AS3item(tenant, '', '', vscode.TreeItemCollapsibleState.None, 
						{ command: 'f5-as3.getDecs', title: 'Get Tenant Declaration', arguments: [tenant] });
				});
				
			} else if (element.label === 'Tasks'){
				const tasks: any = await ext.mgmtClient.makeRequest(`/mgmt/shared/appsvcs/task/`);

				treeItems = tasks.data.items.map((item:any) => {
					// if no decs in task or none on box, it returns limited details, but the request still gets an ID, so we blank in what's not there - also happens when getting-tasks

					const timeStamp = item.declaration.hasOwnProperty('controls') ? item.declaration.controls.archiveTimestamp : '';
					
					return new AS3item(item.id.split('-').pop(), timeStamp, '', vscode.TreeItemCollapsibleState.None,
						{ command: 'f5-as3.getTask', title: '', arguments: [item.id] });
				});

			}

		} else {

			const count = this._tenants.length !== 0 ? this._tenants.length.toString() : '';

			treeItems.push(
				new AS3item('Tenants', count, 'Get All Tenants', vscode.TreeItemCollapsibleState.Collapsed, 
					{ command: 'f5-as3.getDecs', title: '', arguments: [''] })
			);
			treeItems.push(
				new AS3item('Tasks', '', 'Get All Tasks', vscode.TreeItemCollapsibleState.Collapsed,
					{ command: 'f5-as3.getTask', title: '', arguments: [''] })
			);
		}
        return Promise.resolve(treeItems);
	}

	private async getTenants() {
		const tenCall: any = await ext.mgmtClient.makeRequest(`/mgmt/shared/appsvcs/declare/`);

		this._tenants = [];	// clear current tenant list
		for ( const tenant in tenCall.data) {
			if(isObject(tenCall.data[tenant]) && tenant !== 'controls') {
				// console.log(`TENANT-APP!!!!  ${element.label}-${tenant}`);
				this._tenants.push(tenant);
			}
		}
	}
}

function isObject(obj: object) {
	// return object(true) if json object
	return obj === Object(obj);
}

class AS3item extends vscode.TreeItem {
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
}