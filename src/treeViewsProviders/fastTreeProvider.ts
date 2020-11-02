import * as vscode from 'vscode';
import { ext } from '../extensionVariables';

export class FastTemplatesTreeProvider implements vscode.TreeDataProvider<FastTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<FastTreeItem | undefined> = new vscode.EventEmitter<FastTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<FastTreeItem | undefined> = this._onDidChangeTreeData.event;

	private _apps: string[] = [];
	private _tasks: string[] = [];
	private _templates: string[] = [];
	private _templateSets: string[] = [];

	constructor() {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: FastTreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: FastTreeItem): Promise<FastTreeItem[]> {
		
		var treeItems = [];

		if(element) {
			// parent element selected, so return necessary children items
			if(element.label === 'Deployed Applications') {

				this._apps.map( (item: any) => {
					treeItems.push(
						new FastTreeItem(
							`${item.tenant}/${item.app}`,
							'',
							'',
							'fastApp',
							vscode.TreeItemCollapsibleState.None, { 
								command: 'f5-fast.getApp',
								title: '',
								arguments: [
									`${item.tenant}/${item.app}`
								]
							}
						));
				});

			} else if (element.label === 'Tasks') {

				this._tasks.map( (item: any) => {
					const shortId = item.id.split('-').pop();

					treeItems.push(
						new FastTreeItem(
							`${shortId}`,
							item.subTitle,
							`operation: ${item.operation}`,
							'',
							vscode.TreeItemCollapsibleState.None, {
								command: 'f5-fast.getTask',
								title: '',
								arguments: [
									item.id
								]
							}
						)
					);
				});

			} else if (element.label === 'Templates') {

				this._templates.map( (item: string) => {
					treeItems.push(
						new FastTreeItem(
							`${item}`,
							'',
							'',
							'fastTemplate',
							vscode.TreeItemCollapsibleState.None, {
								command: 'f5-fast.getTemplate',
								title: '',
								arguments: [
									item
								]
							}
						)
					);
				});

			} else if (element.label === 'Template Sets') {

				this._templateSets.map( (item: string ) => {
					treeItems.push(
						new FastTreeItem(
							`${item}`,
							'',
							'',
							'fastTemplateSet',
							vscode.TreeItemCollapsibleState.None, {
								command: 'f5-fast.getTemplateSets',
								title: '',
								arguments: [
									item
								]
							}
						)
					);
				});
			}



		} else {

		// gather all necessary details
		// looking for ways to do this async
		await this.getApps();
		await this.getTasks();
		await this.getTemplates();
		await this.getTemplateSets();

		const appCount = this._apps.length !== 0 ? this._apps.length.toString() : '';
		const taskCount = this._tasks.length !== 0 ? this._tasks.length.toString() : '';
		const tempCount = this._templates.length !== 0 ? this._templates.length.toString() : '';
		const tempSetCount = this._templateSets.length !== 0 ? this._templateSets.length.toString() : '';
			
		// no element selected, so return parent items
		treeItems.push(
			new FastTreeItem('Deployed Applications', appCount, '', '', vscode.TreeItemCollapsibleState.Collapsed, 
				{ command: 'f5-fast.getApp', title: '', arguments: [''] })
		);
		treeItems.push(
			new FastTreeItem('Tasks', taskCount, '', '', vscode.TreeItemCollapsibleState.Collapsed, 
				{ command: 'f5-fast.getTask', title: '', arguments: [''] })
		);
		treeItems.push(
			new FastTreeItem('Templates', tempCount, '', '', vscode.TreeItemCollapsibleState.Collapsed, 
				{ command: 'f5-fast.getTemplate', title: '', arguments: [''] })
		);
		treeItems.push(
			new FastTreeItem('Template Sets', tempSetCount, '', '', vscode.TreeItemCollapsibleState.Collapsed, 
				{ command: 'f5-fast.getTemplateSets', title: '', arguments: [''] })
		);

		}
        return Promise.resolve(treeItems);
	}

	private async getApps() {
		const apps: any = await ext.mgmtClient?.makeRequest('/mgmt/shared/fast/applications');

		this._apps = apps.data.map( (item: { tenant: string; name: string; }) => { 
			const tenant = item.tenant;
			const app = item.name;
			return { tenant, app }; 
		});
	}

	private async getTasks() {
		const tasks: any = await ext.mgmtClient?.makeRequest('/mgmt/shared/fast/tasks');

		this._tasks = tasks.data.map( (item: { 
			id: string;
			code: number;
			tenant?: any;
			application?: any;
			message: string;
			operation: string;
		 }
		 ) => {
			var subTitle: string;
			if(item.code === 200) {
				subTitle = `${item.operation} - ${item.code} - ${item.tenant}/${item.application}`;
			} else {
				subTitle = `${item.operation} - ${item.code} - ${item.message}`;
			}
			
			// for some reason TS was complaing, so broke this out
			let id: string = item.id;
			let operation: string = item.operation;
			return { id, subTitle, operation };
		});
	}

	private async getTemplates() {
		const templates: any = await ext.mgmtClient?.makeRequest('/mgmt/shared/fast/templates');

		this._templates = templates.data.map( (item: string) => item);
	}

	private async getTemplateSets() {
		const tSets: any = await ext.mgmtClient?.makeRequest('/mgmt/shared/fast/templatesets');
		this._templateSets = tSets.data.map( (item: { name:string }) => item.name );
	}
}

export class FastTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public description: string,
		public tooltip: string,
		public context: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}
    contextValue = this.context;
}