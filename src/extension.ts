import * as vscode from 'vscode';

import { request } from 'https';
import { chuckJoke } from './chuckJoke';
import { carTreeDataProvider } from './carTreeView';
import { DepNodeProvider, Dependency } from './nodeDependencies';
import { F5TreeProvider } from './treeProvider';
import { f5Api } from './f5Api'
import { stringify } from 'querystring';
import { setHostStatusBar } from './utils';
import { test } from 'mocha';


export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vscode-f5-fast" is now active!');

	// Create a status bar item
	const hostStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	context.subscriptions.push(hostStatusBar);


	// exploring classes to group all f5 api calls
	const f5API = new f5Api();


	context.subscriptions.push(vscode.commands.registerCommand('testCommand1', () => {
		console.log('befor Chuck func call');
		// chuckJoke();

		const gets = f5API.hi();
		console.log(`-----1-----  ${gets}`)
		
		f5API.low();
		// console.log(`-----1-----  ${gets}`)
		
		const gets2 = f5API.funcSole('func');
		console.log(`-----2-----  ${gets2}`)

	}));


	
	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.connectDevice', async (hostFromTree) => {
		console.log('executing f5-fast.connectDevice2');
		console.log(`Host from tree select: ${hostFromTree}`);

		// thinking about how I want to handle device/username/password creds
		//	either in it's own object, or in the host status bar...
		//		if status bar, can easily clear text(host)/password on disconnect
		// need to figure out how to access status bar contents in other contexts.  

		//  will cache passwords with keytar in the future
		
		const bigipHosts = vscode.workspace.getConfiguration().get('f5-fast.hosts');

		var bigip = {
			host: <string> '',
			password: <string> ''
		};

		if (!hostFromTree) {
			bigip.host = await vscode.window.showQuickPick(bigipHosts, {placeHolder: 'Select Device'});
			// console.log(`Selected device/host/bigip: ${bigip}`);
			vscode.window.showInformationMessage(`Selected device/host/bigip = ${bigip.host}`)
		} else {
			bigip.host = hostFromTree;
		}

		// clean up bigipHosts var, no longer needed...
		
		bigip.password = await vscode.window.showInputBox({password: true});
		// console.log(`Password: ${password}`);
		
		console.log(`bigip-obj: ${JSON.stringify(bigip)}`);
		console.log(`Selected device/host/bigip: ${bigip.host}, password: ${bigip.password}`);


		f5API.getF5FastInfo(hostStatusBar, bigip.host, bigip.password);

		// const fastTemplates = f5API.getFastTemplates(hostStatusBar, bigip.host, bigip.password);
		// console.log(`fastTemplates: ${fastTemplates}`);

	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.disconnect', () => {
		console.log('inside disconnect call');

		// clear status bar 
		// feed it the statusBar object created at top, blank host, blank password)
		setHostStatusBar(hostStatusBar, '', '');

		
		return vscode.window.showInformationMessage('clearing selected bigip and status bar details')
	}));

	context.subscriptions.push(vscode.commands.registerCommand('chuckJoke', () => {
		chuckJoke();
	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.openSettings', () => {
		return vscode.commands.executeCommand("workbench.action.openSettings", "f5-fast");
	}));


	
	//original way the example extension structured the command
	let disposable = vscode.commands.registerCommand('extension.remoteCommand', async () => {
		return vscode.window.showInformationMessage('placeholder to execute command on bigip...')
	});	
	context.subscriptions.push(disposable);


	// trying to setup tree provider to list f5 hosts from config file
	// const hostsTreeProvider = new F5TreeProvider(vscode.workspace.getConfiguration().get('f5-fast.hosts'));
	const hostsTreeProvider = new F5TreeProvider('');
	vscode.window.registerTreeDataProvider('f5Hosts', hostsTreeProvider);
	vscode.commands.registerCommand('f5-fast.refreshEntry', () => hostsTreeProvider.refresh());
	vscode.commands.registerCommand('f5-fast.addEntry', () => vscode.window.showInformationMessage(`Successfully called add entry.`));
	vscode.commands.registerCommand('f5-fast.editEntry', (node: Dependency) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
	vscode.commands.registerCommand('f5-fast.deleteEntry', (node: Dependency) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));

	// Samples of `window.registerTreeDataProvider`
	// all entries for nodeDependeny tree view
	const nodeDependenciesProvider = new DepNodeProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
	vscode.commands.registerCommand('nodeDependencies.refreshEntry', () => nodeDependenciesProvider.refresh());
	vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));
	vscode.commands.registerCommand('nodeDependencies.addEntry', () => vscode.window.showInformationMessage(`Successfully called add entry.`));
	vscode.commands.registerCommand('nodeDependencies.editEntry', (node: Dependency) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
	vscode.commands.registerCommand('nodeDependencies.deleteEntry', (node: Dependency) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));


	vscode.window.registerTreeDataProvider('carTree', new carTreeDataProvider());

}


// this method is called when your extension is deactivated
export function deactivate() {}
