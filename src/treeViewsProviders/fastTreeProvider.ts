import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import * as f5FastApi from '../utils/f5FastApi';
// import { getAuthToken, callHTTP } from '../utils/coreF5HTTPS';
import * as utils from '../utils/utils';
// import * as f5FastUtils from './utils/f5FastUtils';

export class FastTemplatesTreeProvider implements vscode.TreeDataProvider<FastTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<FastTreeItem | undefined> = new vscode.EventEmitter<FastTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<FastTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: FastTreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: FastTreeItem): Promise<FastTreeItem[]> {
		//  need to get all this working...
		
		const device = ext.hostStatusBar.text;
		const password = await utils.getPassword(device);
		const fast = ext.fastBar.text;
		const [username, host] = device.split('@');

		if (!device || !fast) {
			// console.log('AS3TenantTree: no device or as3 detected');
			return Promise.resolve([]);
		}
		
		var treeItems = [];

		if(element) {
			// parent element selected, so return necessary children items
			if(element.label === 'Deployed Applications') {
				// const authToken = await getAuthToken(host, username, password);
				// const apps = await callHTTP('GET', host, '/mgmt/shared/fast/applications', authToken);

				await ext.mgmtClient.getToken();
				const apps: any = await ext.mgmtClient.makeRequest('/mgmt/shared/fast/applications');

				apps.data.forEach( (item: { tenant?: string; name?: string; }) => {
					treeItems.push(new FastTreeItem(`${item.tenant}/${item.name}`, '', '', 'fastApp', vscode.TreeItemCollapsibleState.None,
					{ command: 'f5-fast.getApp', title: '', arguments: [`${item.tenant}/${item.name}`] } ));
				});


			} else if (element.label === 'Tasks') {
				// const authToken = await getAuthToken(host, username, password);
				// const tasks = await callHTTP('GET', host, '/mgmt/shared/fast/tasks', authToken);

				await ext.mgmtClient.getToken();
				const tasks: any = await ext.mgmtClient.makeRequest('/mgmt/shared/fast/tasks');

				var subTitle: string;
				tasks.data.slice(0, 5).map( (item: { id: string; code: number; tenant?: any; application?: any; message: string; }) => {
					const shortId = item.id.split('-').pop();

					if(item.code === 200) {
						subTitle = `${item.code} - ${item.tenant}/${item.application}`;
					} else {
						subTitle = `${item.code} - ${item.message}`;
					}

					treeItems.push(new FastTreeItem(`${shortId}`, subTitle, '', '', vscode.TreeItemCollapsibleState.None,
					{ command: 'f5-fast.getTask', title: '', arguments: [item.id] } ));
				});

			} else if (element.label === 'Templates') {
				// const authToken = await getAuthToken(host, username, password);
				// const templates = await callHTTP('GET', host, '/mgmt/shared/fast/templates', authToken);

				await ext.mgmtClient.getToken();
				const templates: any = await ext.mgmtClient.makeRequest('/mgmt/shared/fast/templates');

				templates.data.map( (item: any) => {
					treeItems.push(new FastTreeItem(`${item}`, '', '', 'fastTemplate', vscode.TreeItemCollapsibleState.None,
					{ command: 'f5-fast.getTemplate', title: '', arguments: [item] } ));
				});

			} else if (element.label === 'Template Sets') {
				// const authToken = await getAuthToken(host, username, password);
				// const tSets = await callHTTP('GET', host, '/mgmt/shared/fast/templatesets', authToken);

				await ext.mgmtClient.getToken();
				const tSets: any = await ext.mgmtClient.makeRequest('/mgmt/shared/fast/templatesets');

				tSets.data.map( (item: any) => {
					treeItems.push(new FastTreeItem(`${item.name}`, '', '', 'fastTemplateSet', vscode.TreeItemCollapsibleState.None,
					{ command: 'f5-fast.getTemplateSets', title: '', arguments: [item.name] } ));
				});
			}



		} else {
			
		// no element selected, so return parent items
		treeItems.push(
			new FastTreeItem('Deployed Applications', '', '', '', vscode.TreeItemCollapsibleState.Collapsed, 
				{ command: 'f5-fast.getApps', title: '', arguments: ['none'] })
		);
		treeItems.push(
			new FastTreeItem('Tasks', 'Last 5', '', '', vscode.TreeItemCollapsibleState.Collapsed, 
				{ command: 'f5-fast.listTasks', title: '', arguments: ['none'] })
		);
		treeItems.push(
			new FastTreeItem('Templates', '', '', '', vscode.TreeItemCollapsibleState.Collapsed, 
				{ command: 'f5-fast.listTemplates', title: '', arguments: ['none'] })
		);
		treeItems.push(
			new FastTreeItem('Template Sets', '', '', '', vscode.TreeItemCollapsibleState.Collapsed, 
				{ command: 'f5-fast.listTemplateSets', title: '', arguments: ['none'] })
		);

		}

		// debugger;
        return Promise.resolve(treeItems);
	}
}

export class FastTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public version: string,
		private toolTip: string,
		private context: string,
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

    contextValue = this.context;
    
}