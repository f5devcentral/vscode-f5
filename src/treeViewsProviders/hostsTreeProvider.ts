import * as vscode from 'vscode';

export class F5TreeProvider implements vscode.TreeDataProvider<F5Host> {

	private _onDidChangeTreeData: vscode.EventEmitter<F5Host | undefined> = new vscode.EventEmitter<F5Host | undefined>();
	readonly onDidChangeTreeData: vscode.Event<F5Host | undefined> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: F5Host): vscode.TreeItem {
		return element;
	}

	getChildren(element?: F5Host): Thenable<F5Host[]> {
        
        const bigipHosts: any | undefined = vscode.workspace.getConfiguration().get('f5.hosts');
		console.log(`bigips: ${JSON.stringify(bigipHosts)}`);
		
		if ( bigipHosts === undefined) {
			throw new Error('No configured hosts - from hostTreeProvider');
		}

		const treeItems = bigipHosts.map( (item: { 
			device: string;
			provider: string;
		}) => {

			// build device string to display
			// let device = `${item.user}@${item.host}`;

			// add port if it's defined - non default 443
			// if(item.hasOwnProperty('port')) {
			// 	device = `${device}:${item.port}`;
			// }

			// add default provider=local if not defined
			if(!item.hasOwnProperty('provider')){
				item['provider'] = 'local';
			}

			// console.log('built item', device);
			const treeItem = new F5Host(item.device, item.provider, vscode.TreeItemCollapsibleState.None, {
				        command: 'f5.connectDevice',
				        title: 'hostTitle',
				        arguments: [item]
			});
			return treeItem;
		});
   
        // // takes individual host item and creates a tree item
        // const treeHosts = (name: string): F5Host => {
        //     const treeItem = new F5Host(name, vscode.TreeItemCollapsibleState.None, {
        //         command: 'f5.connectDevice',
        //         title: 'hostTitle',
        //         arguments: [name]
        //     });
        //     // console.log(`treeItem: ${JSON.stringify(treeItem)}`);
        //     return treeItem;
        // };

		// // takes list of bigip hosts from the workspace config file, in the variable "bigipHosts"
		// //		for each item in list assign item to "host", feed "host" to the function treeHosts
		// //		treeHosts return a treeItem, that gets returned as a list of treeItems in the promise.resolve
		// // basically, vscode api call this function of this class and expects a resolved promise which is a list of objects it can use to make a tree!
        // const treeItems = bigipHosts.map(host => treeHosts(host));

        console.log(`treeItems full: ${JSON.stringify(treeItems)}`);

        return Promise.resolve(treeItems);
	}
    

}

export class F5Host extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		private version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return `Connect`;
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