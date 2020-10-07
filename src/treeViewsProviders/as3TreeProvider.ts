import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
// import { isArray } from 'util';


export class AS3TreeProvider implements vscode.TreeDataProvider<AS3item> {

	private _onDidChangeTreeData: vscode.EventEmitter<AS3item | undefined> = new vscode.EventEmitter<AS3item | undefined>();
	readonly onDidChangeTreeData: vscode.Event<AS3item | undefined> = this._onDidChangeTreeData.event;

	private _tenants: string[] = [];  
	private _bigiqTenants: any = [];  
	private _tasks: string[] = [];

	constructor() {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: AS3item): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: AS3item) {
		let treeItems: AS3item[] = [];
		
		if (element) {

			if(element.label === 'Targets'){

				const targetTenCount = this._bigiqTenants.length.toString();

				treeItems = this._bigiqTenants.map( (el: { target: string; tensList: any; }) => {
					return new AS3item(el.target, targetTenCount, '', '', vscode.TreeItemCollapsibleState.Collapsed, 
						{ command: '', title: '', arguments: el.tensList });
				});

			} else if(element.label === 'Tenants'){
				
				treeItems = this._tenants.map( el => {
					return new AS3item(el, '', '', 'as3Tenant', vscode.TreeItemCollapsibleState.None, 
						{ command: 'f5-as3.getDecs', title: 'Get Tenant Declaration', arguments: [el] });
				});
				
			} else if (element.label === 'Tasks'){
				
				treeItems = this._tasks.map( (task: any) => {
					return new AS3item(task.iId.split('-').pop(), task.timeStamp, '', '', vscode.TreeItemCollapsibleState.None,
						{ command: 'f5-as3.getTask', title: '', arguments: [task.iId] });
				});
			} else {
				/**
				 * this should happen when a target is selected
				 */

				const x = element.command?.arguments?.map( el => {
					return new AS3item(el, '', '', '', vscode.TreeItemCollapsibleState.None, 
					{ command: 'f5-as3.getDecs', title: 'Get Tenant Declaration', arguments: [el] });
				});
				treeItems = x ? x : [];
			}

		} else {

			/**
			 * todo:  look at moving this to the refresh function, might cut back on how often it gets called
			 */
			await this.getTenants(); // refresh tenant information
			await this.getTasks();	// refresh tasks information


			const targetCount = this._bigiqTenants.length !== 0 ? this._bigiqTenants.length.toString() : '';
			const tenCount = this._tenants.length !== 0 ? this._tenants.length.toString() : '';
			const taskCount = this._tasks.length !== 0 ? this._tasks.length.toString() : '';

			// if we have bigiq...
			if(this._bigiqTenants.length > 0){
				treeItems.push(
					new AS3item('Targets', targetCount, '', '', vscode.TreeItemCollapsibleState.Collapsed, 
						{ command: '', title: '', arguments: [''] })
				);
			}

			// if we have bigip
			if(this._tenants.length > 0){
				treeItems.push(
					new AS3item('Tenants', tenCount, 'Get All Tenants', '', vscode.TreeItemCollapsibleState.Collapsed, 
						{ command: 'f5-as3.getDecs', title: '', arguments: [''] })
				);
			}


			treeItems.push(
				new AS3item('Tasks', taskCount, 'Get All Tasks', '', vscode.TreeItemCollapsibleState.Collapsed,
					{ command: 'f5-as3.getTask', title: '', arguments: [''] })
			);
		}
        return Promise.resolve(treeItems);
	}

	private async getTenants() {
		this._tenants = [];	// clear current tenant list
		this._bigiqTenants = [];	// clear current bigiq tenant list
		
		const tenCall: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/appsvcs/declare/`);

		/**
		 * got an array, so this should be a bigiq list of devices with tenant information
		 */
		if(Array.isArray(tenCall.data)) {
				this._bigiqTenants = tenCall.data.map( (el: any) => {
				
				const target = el.target.address; // got target bigip

				// now loop through to get all tenants
				const tensList: string[] = [];
				Object.entries(el).forEach(([key, val]) => {
					if (isObject(val) && key !== 'target'){
						tensList.push(key);
					}
				});

				return { target, tensList };
			});


		} else {
			/**
			 * should be a single bigip tenants object
			 * 	loop through, return object keys 
			 */
			for ( const [tenant, dec] of Object.entries(tenCall.data)) {
				if(isObject(dec) && tenant !== 'controls' && tenant !== 'target') {
					this._tenants.push(tenant);
				}
			}
		}
	}

	private async getTasks() {
		const tasks: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/appsvcs/task/`);

		this._tasks = [];	// clear current tenant list
		this._tasks = tasks.data.items.map((item:any) => {
			// if no decs in task or none on box, it returns limited details, but the request still gets an ID, so we blank in what's not there - also happens when getting-tasks
			const timeStamp = item.declaration.hasOwnProperty('controls') ? item.declaration.controls.archiveTimestamp : '';
			const iId = item.id;

			return { iId, timeStamp };
			});
	}

}

function isObject(x: any) {
	// return object(true) if json object
	return x === Object(x);
}

class AS3item extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		private version: string,
		private toolTip: string,
		public context: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command: vscode.Command,
	) {
		super(label, collapsibleState);
	}

	// tooltip = this.toolTip;
	// version = this.version;
	get tooltip(): string {
		return this.toolTip;
	}

	get description(): string {
		return this.version;
	}

	contextValue = this.context;
}