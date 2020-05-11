// import * as vscode from 'vscode';
// import { callHTTPS } from '../utils/externalAPIs'

// /**
//  * The idea here is to provide a command to get and list all the examples for a given ILX repo
//  *      this list would be in a tree view that would only appear if/when the user executes the command
//  * the tree view will just list all the different declarations - select will open in editor
//  *      - for now, can add the "schema" reference directly into the declaration to provide validation
//  * 
//  */

// export class exampleTsDecsProvider implements vscode.TreeDataProvider<exampleTsDec> {

// 	private _onDidChangeTreeData: vscode.EventEmitter<exampleTsDec | undefined> = new vscode.EventEmitter<exampleTsDec | undefined>();
// 	readonly onDidChangeTreeData: vscode.Event<exampleTsDec | undefined> = this._onDidChangeTreeData.event;

// 	constructor(private workspaceRoot: string) {
// 	}

// 	refresh(): void {
// 		this._onDidChangeTreeData.fire();
// 	}

//     getTreeItem(element: exampleTsDec): vscode.TreeItem {
// 		return element;
// 	}

// 	getChildren(element?: exampleTsDec) {
        

//         // const url: string = 'https://api.github.com/repos/F5Networks/f5-telemetry-streaming/contents/examples/declarations'

		
// 		// if ( url === undefined) {
// 		// 	throw new Error('No configured hosts - from hostTreeProvider');
//         // }
        
//         const decs = callHTTPS({
//             method: 'GET',
//             host: 'api.github.com',
//             path: '/repos/F5Networks/f5-telemetry-streaming/contents/examples/declarations',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'User-Agent': 'nodejs native HTTPS'
//             }
//         })

//         console.log(`***********EXAMPLE GITHUB TS DECS---: ${JSON.stringify(decs)}`)
        
//         const bigipHosts = [ "host1", "host2", "host3"]
   
//         // // takes individual host item and creates a tree item
//         // const treeExampleTs = (item: object): exampleTsDec => {
//         //     const treeItem = new exampleTsDec(item.name, vscode.TreeItemCollapsibleState.None, {
//         //         command: 'f5-ts.getGitHubExampleTs',
//         //         title: 'hostTitle',
//         //         arguments: [item.download_url]
//         //     });
//         //     // console.log(`treeItem: ${JSON.stringify(treeItem)}`);
//         //     return treeItem;
//         // }

// 		// // takes list of bigip hosts from the workspace config file, in the variable "bigipHosts"
// 		// //		for each item in list assign item to "host", feed "host" to the function treeHosts
// 		// //		treeHosts return a treeItem, that gets returned as a list of treeItems in the promise.resolve
// 		// // basically, vscode api call this function of this class and expects a resolved promise which is a list of objects it can use to make a tree!
//         // const treeItems = decs.map(item => treeExampleTs(item));
//         // const treeItems = bigipHosts.map(host => treeHosts(host));

//         // console.log(`treeItems full: ${JSON.stringify(treeItems)}`);

//         // return Promise.resolve(treeItems);
// 	}
    

// }

// export class exampleTsDec extends vscode.TreeItem {
// 	constructor(
// 		public readonly label: string,
// 		// private version: string,
// 		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
// 		public readonly command?: vscode.Command
// 	) {
// 		super(label, collapsibleState);
// 	}

// 	get tooltip(): string {
// 		return `Connect`;
// 	}

// 	// get description(): string {
// 	// 	return 'descLoc';
// 	// }

// 	// iconPath = {
// 	// 	light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
// 	// 	dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
// 	// };

//     // contextValue = 'dependency';
    
// }