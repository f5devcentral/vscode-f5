import * as vscode from 'vscode';
import { ext } from '../extensionVariables';

export class FastTemplatesTreeProvider implements vscode.TreeDataProvider<FastTemplate> {

	private _onDidChangeTreeData: vscode.EventEmitter<FastTemplate | undefined> = new vscode.EventEmitter<FastTemplate | undefined>();
	readonly onDidChangeTreeData: vscode.Event<FastTemplate | undefined> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: FastTemplate): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: FastTemplate): Promise<FastTemplate[]> {
		
		//  need to get all this working...
		var treeItems = [];
		treeItems.push(
			new FastTemplate(
				'coming soon', 
				vscode.TreeItemCollapsibleState.None, 
				{ 
					command: 'f5-as3.getDecs',
					title: '', 
					arguments: ['none']
				}
			)
		);
        return Promise.resolve(treeItems);
	}
}

export class FastTemplate extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		// private version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return `show!`;
	}

	// get description(): string {
	// 	return 'descLoc';
	// }

	// iconPath = {
	// 	light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
	// 	dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	// };

    // contextValue = 'dependency';
    
}