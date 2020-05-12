import * as vscode from 'vscode';
import { callHTTPS } from '../utils/externalAPIs'


export class exampleTsDecsProvider implements vscode.TreeDataProvider<exampleTsDec> {
	dispose() {
		throw new Error("Method not implemented.");
	}

	private _onDidChangeTreeData: vscode.EventEmitter<exampleTsDec | undefined> = new vscode.EventEmitter<exampleTsDec | undefined>();
	readonly onDidChangeTreeData: vscode.Event<exampleTsDec | undefined> = this._onDidChangeTreeData.event;

	constructor(private inCommingData: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

    getTreeItem(element: exampleTsDec): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: exampleTsDec): Promise<exampleTsDec[]> {
        
		const decCall = await callHTTPS({
		    method: 'GET',
		    host: 'api.github.com',
		    path: '/repos/F5Networks/f5-telemetry-streaming/contents/examples/declarations',
		    headers: {
		        'Content-Type': 'application/json',
		        'User-Agent': 'nodejs native HTTPS'
		    }
		}).then( resp => {
			return resp
		})

		console.log(`decCall: ${JSON.stringify(decCall)}`);
		
		const treeItems = decCall.body.map((item:any): exampleTsDec => {
			return (new exampleTsDec(
				item.name, 
				vscode.TreeItemCollapsibleState.None, 
				{
					command: 'f5-ts.getGitHubExampleTs',
					title: 'hostTitle',
					arguments: [item.download_url]
			}))
		});

		// if ( bigipHosts === undefined) {
		// 	throw new Error('No configured hosts - from hostTreeProvider');
		// }
   
        // // takes individual host item and creates a tree item
        // const treeHosts = (name: string): exampleTsDec => {
        //     const treeItem = new exampleTsDec(name, vscode.TreeItemCollapsibleState.None, {
        //         command: 'f5.connectDevice',
        //         title: 'hostTitle',
        //         arguments: [name]
        //     });
        //     console.log(`treeItem: ${JSON.stringify(treeItem)}`);
        //     return treeItem;
        // }
        // const treeItems = decCall.map(host => treeHosts(host));

        console.log(`treeItems full: ${JSON.stringify(treeItems)}`);

        return Promise.resolve(treeItems);

        

	}
    

}

export class exampleTsDec extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		// private version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return `Connect`;
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