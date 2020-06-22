import * as vscode from 'vscode';
import { callHTTPS } from '../utils/externalAPIs';


export class ExampleDecsProvider implements vscode.TreeDataProvider<ExampleDec> {
	dispose() {
		throw new Error("Method not implemented.");
	}

	private _onDidChangeTreeData: vscode.EventEmitter<ExampleDec | undefined> = new vscode.EventEmitter<ExampleDec | undefined>();
	readonly onDidChangeTreeData: vscode.Event<ExampleDec | undefined> = this._onDidChangeTreeData.event;

	constructor() {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

    getTreeItem(element: ExampleDec): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: ExampleDec): Promise<ExampleDec[]> {

		var treeItems = [];
		if(element) {
			// get example dec list for atc service
			if(element.label === 'AS3 Examples - Coming soon!') {
				// const examples = await getAS3examples();
				
				// treeItems = examples.body.map((item: any) => {
				// 	return new ExampleDec(item.name, vscode.TreeItemCollapsibleState.None,
				// 		{command: 'f5.getGitHubExample', title: '', arguments: [item.download_url]});
				// });

			} else if (element.label === 'DO Examples') {
				const examples = await getDOexamples();

				treeItems = examples.body.map((item: any) => {
					return new ExampleDec(item.name, vscode.TreeItemCollapsibleState.None,
						{command: 'f5.getGitHubExample', title: '', arguments: [item.download_url]});
				});

			} else if (element.label === 'TS Examples') {
				const examples = await getTSexamples();

				treeItems = examples.body.map((item: any) => {
					return new ExampleDec(item.name, vscode.TreeItemCollapsibleState.None,
						{command: 'f5.getGitHubExample', title: '', arguments: [item.download_url]});
				});
			}

		} else {
			//top level items
			treeItems.push(new ExampleDec('AS3 Examples - Coming soon!', vscode.TreeItemCollapsibleState.None,
									{command: 'f5.getGitHubExample', title: '', arguments: ['tempAS3']}));

			treeItems.push(new ExampleDec('DO Examples', vscode.TreeItemCollapsibleState.Collapsed));

			treeItems.push(new ExampleDec('TS Examples', vscode.TreeItemCollapsibleState.Collapsed));
		}
        return Promise.resolve(treeItems);
	}
}

async function getAS3examples(){
	return await callHTTPS({
		method: 'GET',
		host: 'api.github.com',
		path: '/repos/F5Networks/f5-telemetry-streaming/contents/examples/declarations',
		headers: {
			'Content-Type': 'application/json',
			'User-Agent': 'F5 VScode FAST extension'
		}
	});
}


async function getDOexamples(){
	return await callHTTPS({
		method: 'GET',
		host: 'api.github.com',
		path: '/repos/F5Networks/f5-declarative-onboarding/contents/examples',
		headers: {
			'Content-Type': 'application/json',
			'User-Agent': 'F5 VScode FAST extension'
		}
	});
}


async function getTSexamples(){
	return await callHTTPS({
		method: 'GET',
		host: 'api.github.com',
		path: '/repos/F5Networks/f5-telemetry-streaming/contents/examples/declarations',
		headers: {
			'Content-Type': 'application/json',
			'User-Agent': 'F5 VScode FAST extension'
		}
	});
}

export class ExampleDec extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		// private version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}
}