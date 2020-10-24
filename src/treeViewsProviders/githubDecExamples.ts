import { TreeDataProvider, TreeItem, TreeItemCollapsibleState, Event, EventEmitter, Uri, Command }  from 'vscode';
import { callHTTPS } from '../utils/externalAPIs';


export class ExampleDecsProvider implements TreeDataProvider<ExampleDec> {

	private _onDidChangeTreeData: EventEmitter<ExampleDec | undefined> = new EventEmitter<ExampleDec | undefined>();
	readonly onDidChangeTreeData: Event<ExampleDec | undefined> = this._onDidChangeTreeData.event;

	constructor() {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

    getTreeItem(element: ExampleDec): TreeItem {
		return element;
	}

	async getChildren(element?: ExampleDec): Promise<ExampleDec[]> {

		var treeItems = [];
		if(element) {
			// get example dec list for atc service
			if(element.label === 'AS3 Examples - Coming soon!') {
				// const examples = await getAS3examples();
				
				// treeItems = examples.body.map((item: any) => {
				// 	return new ExampleDec(item.name, TreeItemCollapsibleState.None,
				// 		{command: 'f5.getGitHubExample', title: '', arguments: [item.download_url]});
				// });

			} else if (element.label === 'DO Examples') {
				const examples = await getDOexamples();

				treeItems = examples.body.map((item: any) => {
					return new ExampleDec(item.name, '', TreeItemCollapsibleState.None,
						{command: 'f5.getGitHubExample', title: '', arguments: [item.download_url]});
				});

			} else if (element.label === 'TS Examples') {
				const examples = await getTSexamples();

				treeItems = examples.body.map((item: any) => {
					return new ExampleDec(item.name, '', TreeItemCollapsibleState.None,
						{command: 'f5.getGitHubExample', title: '', arguments: [item.download_url]});
				});
			}

		} else {
			//top level items
			let link: Uri;
			let comment: string;

			link = Uri.parse('https://github.com/f5devcentral/vscode-f5');
			comment = 'Main vscode-f5-fast repo for documentation and issues';
			treeItems.push(new ExampleDec('vscode-f5-fast repo', comment, TreeItemCollapsibleState.None,
				{command: 'vscode.open', title: '', arguments: [link]}));

			link = Uri.parse('https://github.com/DumpySquare/f5-fasting');
			comment = 'Repo used to document usage and examples used in the extension';
			treeItems.push(new ExampleDec('f5-fasting repo', comment, TreeItemCollapsibleState.None,
				{command: 'vscode.open', title: '', arguments: [link]}));
			
			link = Uri.parse('https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/userguide/');
			comment = 'Best way to get to all documentation official F5 CloudDocs documenation for as3, including: installing, using, HTTP methods, example declarations...';
			treeItems.push(new ExampleDec('AS3 User Guide', comment, TreeItemCollapsibleState.None,
				{command: 'vscode.open', title: '', arguments: [link]}));

			link = Uri.parse('https://github.com/F5Networks/f5-appsvcs-extension/issues/280');
			comment = 'Please comment in git repo if you want all AS3 example declarations to show up like DO/TS below';
			treeItems.push(new ExampleDec('AS3 Examples - Coming soon!', comment, TreeItemCollapsibleState.None,
				{command: 'vscode.open', title: '', arguments: [link]}));

			link = Uri.parse('https://github.com/F5Networks/f5-declarative-onboarding/tree/master/examples');
			comment = 'DO examples direct from /F5Networks/f5-declarative-onboarding repo';
			treeItems.push(new ExampleDec('DO Examples', comment, TreeItemCollapsibleState.Collapsed,
			{command: 'vscode.open', title: '', arguments: [link]}));
			
			link = Uri.parse('https://github.com/F5Networks/f5-telemetry-streaming/tree/master/examples');
			comment = 'TS examples direct from /F5Networks/f5-telemetry-streaming repo';
			treeItems.push(new ExampleDec('TS Examples', comment, TreeItemCollapsibleState.Collapsed,
				{command: 'vscode.open', title: '', arguments: [link]}));
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

export class ExampleDec extends TreeItem {
	constructor(
		public readonly label: string,
		public tooltip: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly command?: Command
	) {
		super(label, collapsibleState);
	}
}