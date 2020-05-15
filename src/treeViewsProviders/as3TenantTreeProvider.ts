import * as vscode from 'vscode';
import { getPassword } from '../utils/utils';
import { ext } from '../extensionVariables';
// import { callHTTPS } from '../utils/externalAPIs'

export class AS3TenantTreeProvider implements vscode.TreeDataProvider<AS3TenantItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<AS3TenantItem | undefined> = new vscode.EventEmitter<AS3TenantItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<AS3TenantItem | undefined> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: AS3TenantItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: AS3TenantItem): Promise<AS3TenantItem[]> {
		
		var device = ext.hostStatusBar.text;

		if (!device) {
			return Promise.reject('Select device to get as3 tenant info');
		}
		
		const password = await getPassword(device);
		const tenantsFull = await ext.f5Api.as3Tenants(device, password);
		const bodyKeys = Object.keys(tenantsFull.body);

		var newTreeItems: any[] = [];
		for ( const tenant in tenantsFull.body) {
			// var newTenants = [];
			// console.log(`PROP OF BODY!!!!  ${tenant}`);
			if(isObject(tenantsFull.body[tenant])) {
				// console.log(`OBJECT!!!!  ${tenant}`);
				if(tenant !== 'controls') {

					var tenApps = [];
					var tenantDef = new AS3TenantItem(tenant, '', '', vscode.TreeItemCollapsibleState.Collapsed, 
						{ command: '', title: '', arguments: ['none'] });
					// newTenants.push(tenantDef);
					// tenantDef.push("children" = []);
					
					// newTenants.push(tenantDef);
					// newTreeItems"children"] = [];
					

					for ( const app in tenantsFull.body[tenant]) {
						console.log(`TENANT-APP!!!!  ${tenant}-${app}`);
						const appDef = new AS3TenantItem(app, '', '', vscode.TreeItemCollapsibleState.Collapsed, 
							{ command: '', title: '', arguments: ['none'] });
						tenApps.push(appDef);
					}
					// const tenApps.push("children": {})
					// newTreeItems.push(tenantDef.children { tenApps });

					// console.log(`tenantDef:  ${JSON.stringify(tenantDef)}`);
					// console.log(`newTenants:  ${JSON.stringify(newTenants)}`);
					// console.log(`tenApps:  ${JSON.stringify(tenApps)}`);
					
					// newTenants.push();
					// newTreeItems.push('children: {}');
					// Object.defineProperty(tenantDef, 'children', []);		// worked to add children object
					
					
					// tenantDef.push(tenApps);
					// newTreeItems.tenantDef.push(tenApps);
					// newTreeItems.concat(tenantDef, tenApps);
					console.log(`tenApps:  ${JSON.stringify(tenantDef)}`);
					
					console.log(`TENAPPDEF:  ${JSON.stringify(newTreeItems)}`);
					
				}
			}
			
		}


		// const taskItems = tenantsFull.body.items.map((item:any) => {
		const tenantItems = bodyKeys.map((item: string) => {

			const tenant: AS3TenantItem = new AS3TenantItem(
				item,
				'',
				'',
				vscode.TreeItemCollapsibleState.Collapsed, 
				{
					command: '',
					title: '',
					arguments: ['none']
				}
			);

			console.log(`tenantItems item: ${item}`);

			
			// debugger;

			const appKeys = Object.keys(tenantsFull.body[item]);

			//using the key get a list of key on this object item
			const apps = appKeys.map( (appItem: string) => {
				// const app: AS3TenantItem = new AS3TenantItem(
				// 	appItem,
				// 	'',
				// 	'',
				// 	vscode.TreeItemCollapsibleState.Collapsed, 
				// 	{
				// 		command: '',
				// 		title: '',
				// 		arguments: ['none']
				// 	}
				// );
			// console.log(`APP:  ${app}`);
				
			});

			
			const tenantApps = tenant;
			return tenantApps;
		});

		// var treeItems =  [taskHeader: [taskItems]]
		var treeItems =  tenantItems;
		// var treeItems =  tenantHeader;
		// debugger;

		// treeItems = taskItems
        return Promise.resolve(treeItems);
	}
    

}

function isObject(obj: object) {
	return obj === Object(obj);
  }

export class AS3TenantItem extends vscode.TreeItem {
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