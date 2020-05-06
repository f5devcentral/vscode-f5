import * as vscode from 'vscode';
import { ext } from './extensionVariables'

export class fastTemplatesTreeProvider implements vscode.TreeDataProvider<fastTemplate> {

	private _onDidChangeTreeData: vscode.EventEmitter<fastTemplate | undefined> = new vscode.EventEmitter<fastTemplate | undefined>();
	readonly onDidChangeTreeData: vscode.Event<fastTemplate | undefined> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: fastTemplate): vscode.TreeItem {
		return element;
	}

	getChildren(element?: fastTemplate): Thenable<fastTemplate[]> {
        // console.log(`statusBar: ${JSON.stringify(stat)}`);
        
        const bigipHosts = vscode.workspace.getConfiguration().get('f5-fast.hosts');
		console.log(`bigips: ${JSON.stringify(bigipHosts)}`);
		
		console.log(`hostStatusBar in fastTree: ${ext.hostStatusBar}`)
   
        // takes individual host item and creates a tree item
        const treeHosts = (name: string): fastTemplate => {
            const treeItem = new fastTemplate(name, vscode.TreeItemCollapsibleState.None, {
                command: 'f5-fast.connectDevice',
                title: 'hostTitle',
                arguments: [name]
            });
            console.log(`treeItem: ${JSON.stringify(treeItem)}`);
            return treeItem;
        }

		// takes list of bigip hosts from the workspace config file, in the variable "bigipHosts"
		//		for each item in list assign item to "host", feed "host" to the function treeHosts
		//		treeHosts return a treeItem, that gets returned as a list of treeItems in the promise.resolve
		// basically, vscode api call this function of this class and expects a resolved promise which is a list of objects it can use to make a tree!
        const treeItems = bigipHosts.map(host => treeHosts(host));

        console.log(`treeItems full: ${JSON.stringify(treeItems)}`);

        return Promise.resolve(treeItems);
	}

	private getTemplateList(): string[] {

	}
    

}

export class fastTemplate extends vscode.TreeItem {
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