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
		// make api call here, store data in a memento
	}

	getTreeItem(element: AS3TenantItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: AS3TenantItem): Promise<AS3TenantItem[]> {
		
		var device = ext.hostStatusBar.text;
		var as3 = ext.as3Bar.text;

		if (!device || !as3) {
			console.log('AS3TenantTree: no device or as3 detected');
			return Promise.resolve([]);
		}
		/*
		 * need to hold api call results in a memento, then access the memento as needed
		 * use the refresh button/function above to make refresh api data.
		 * possibly use the refresh as the main data fetch so it only happens when the user wants it...
		 */

		 // get memento data, parse and make tree as needed
		const password = await getPassword(device);
		const tenantsFull = await ext.f5Api.getAS3Decs(device, password);
		// const bodyKeys = Object.keys(tenantsFull.body);

		var treeItems = [];
		if (element) {
			// get children for the provided element/tenant
			//		element comes from selectinga  parent tree member
			for ( const app in tenantsFull.body[element.label]) {
				if(isObject(tenantsFull.body[element.label][app])) {
					console.log(`TENANT-APP!!!!  ${element.label}-${app}`);
					treeItems.push(new AS3TenantItem(app, '', '', vscode.TreeItemCollapsibleState.None, 
						{ command: '', title: '', arguments: ['none'] }));
				}
			}

		} else {
			// no element/item, so returning parent tenants
			// default/empty "All-Tenants" Parent item
			treeItems.push(
				new AS3TenantItem('Get-All-Tenants', '', '', vscode.TreeItemCollapsibleState.None, 
						{ command: 'f5-as3.getDecs', title: '', arguments: [''] })
			);

			for ( const tenant in tenantsFull.body) {
				if(isObject(tenantsFull.body[tenant])) {
					if(tenant !== 'controls') {
						treeItems.push(new AS3TenantItem(tenant, '', '', vscode.TreeItemCollapsibleState.Collapsed, 
						{ command: 'f5-as3.getDecs', title: '', arguments: [tenant] }));
					}
				}
			}
		}

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