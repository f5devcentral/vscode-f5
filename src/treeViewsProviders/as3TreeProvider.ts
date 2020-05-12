import * as vscode from 'vscode';
import { getPassword } from '../utils/utils'
import { ext } from '../extensionVariables';
// import { callHTTPS } from '../utils/externalAPIs'

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

	async getChildren(element?: as3Item): Promise<as3Item[]> {
		

		// const decCall = await callHTTPS({
		//     method: 'GET',
		//     host: 'api.github.com',
		//     path: '/repos/F5Networks/f5-telemetry-streaming/contents/examples/declarations',
		//     headers: {
		//         'Content-Type': 'application/json',
		//         'User-Agent': 'nodejs native HTTPS'
		//     }
		// }).then( resp => {
		// 	return resp
		// })

		var device = ext.hostStatusBar.text

		if (!device) {
			return Promise.reject(' no device to get as3 task info');
		}

		// const device = await vscode.commands.executeCommand('f5.connectDevice');
		console.log(`as3TreeProvider device: ${device}`);
		

		const password = await getPassword(device);

		const decCall = await ext.f5Api.as3Tasks(device, password);
		// const decCall = [ "task1", "task2", "task3"]

		console.log(`as3Tree decCall: ${JSON.stringify(decCall.body.items)}`);
		
		const treeItems = decCall.body.map((item:any): as3Item => {
			return (new as3Item(
				item.name, 
				vscode.TreeItemCollapsibleState.None, 
				{
					command: 'f5-ts.getAs3item',
					title: 'hostTitle',
					arguments: [item.download_url]
			}))
		});

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