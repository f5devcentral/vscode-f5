import * as vscode from 'vscode';
// import { f5API } from './f5Api'
import { ext } from './extensionVariables';

export class as3TreeProvider implements vscode.TreeDataProvider<as3Item> {

	private _onDidChangeTreeData: vscode.EventEmitter<as3Item | undefined> = new vscode.EventEmitter<as3Item | undefined>();
	readonly onDidChangeTreeData: vscode.Event<as3Item | undefined> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: as3Item): vscode.TreeItem {
		return element;
	}

	getChildren(element?: as3Item): Thenable<as3Item[]> {
		
		// list of tasks in tree by 'id'
		// command to produce as3 example snip-it
		// command to post declaration to connected device

		// if ( ext.hostStatusBar.text && ext.hostStatusBar.password ) {
		// 	// const as3Tasks = f5API.listAS3Tasks();
		// 	// console.log(`AS3 Tasks: ${JSON.stringify(as3Tasks)}`);
		// }


        const bigipHosts: Array<string> | undefined = vscode.workspace.getConfiguration().get('f5.hosts');
		console.log(`bigips: ${JSON.stringify(bigipHosts)}`);
		
		if ( bigipHosts === undefined) {
			throw new Error('No configured hosts - from as3TreeProvider');
		}
   
        // takes individual host item and creates a tree item
        const treeHosts = (name: string): as3Item => {
            const treeItem = new as3Item(name, vscode.TreeItemCollapsibleState.None, {
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

        console.log(`as3 Tree Full: ${JSON.stringify(treeItems)}`);

        return Promise.resolve(treeItems);
	}
    

}

export class as3Item extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		// private version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	// get tooltip(): string {
	// 	return `Connect`;
	// }

	// get description(): string {
	// 	return 'descLoc';
	// }

	// iconPath = {
	// 	light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
	// 	dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	// };

    // contextValue = 'dependency';
    
}