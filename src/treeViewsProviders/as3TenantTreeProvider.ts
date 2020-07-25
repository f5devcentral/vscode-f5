import * as vscode from 'vscode';
import { ext } from '../extensionVariables';


export class AS3TenantTreeProvider implements vscode.TreeDataProvider<AS3item> {

	private _onDidChangeTreeData: vscode.EventEmitter<AS3item | undefined> = new vscode.EventEmitter<AS3item | undefined>();
	readonly onDidChangeTreeData: vscode.Event<AS3item | undefined> = this._onDidChangeTreeData.event;

	private _tenants: string[] = [];  
	private _tasks: string[] = [];

	constructor(private workspaceRoot: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: AS3item): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: AS3item) {
		let treeItems: any[] = [];
		


		if (element) {
			
			if(element.label === 'Tenants'){
				
				treeItems = this._tenants.map( tenant => {
					return new AS3item(tenant, '', '', 'as3Tenant', vscode.TreeItemCollapsibleState.None, 
						{ command: 'f5-as3.getDecs', title: 'Get Tenant Declaration', arguments: [tenant] });
				});
				
			} else if (element.label === 'Tasks'){
				
				treeItems = this._tasks.map( (task: any) => {
					return new AS3item(task.iId.split('-').pop(), task.timeStamp, '', '', vscode.TreeItemCollapsibleState.None,
						{ command: 'f5-as3.getTask', title: '', arguments: [task.iId] });
				});
			}

		} else {

			/**
			 * todo:  look at moving this to the refresh function, might cut back on how often it gets called
			 */
			await this.getTenants(); // refresh tenant information
			await this.getTasks();	// refresh tasks information

			const tenCount = this._tenants.length !== 0 ? this._tenants.length.toString() : '';
			const taskCount = this._tasks.length !== 0 ? this._tasks.length.toString() : '';

			treeItems.push(
				new AS3item('Tenants', tenCount, 'Get All Tenants', '', vscode.TreeItemCollapsibleState.Collapsed, 
					{ command: 'f5-as3.getDecs', title: '', arguments: [''] })
			);
			treeItems.push(
				new AS3item('Tasks', taskCount, 'Get All Tasks', '', vscode.TreeItemCollapsibleState.Collapsed,
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

	private async getTasks() {
		const tasks: any = await ext.mgmtClient.makeRequest(`/mgmt/shared/appsvcs/task/`);

		this._tasks = [];	// clear current tenant list
		this._tasks = tasks.data.items.map((item:any) => {
			// if no decs in task or none on box, it returns limited details, but the request still gets an ID, so we blank in what's not there - also happens when getting-tasks
			const timeStamp = item.declaration.hasOwnProperty('controls') ? item.declaration.controls.archiveTimestamp : '';
			const iId = item.id;

			return { iId, timeStamp };
			});
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