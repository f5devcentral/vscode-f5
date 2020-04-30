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

//	// status bar global definition
//	// looking to use this for what device we are working with
//	//		and access needed credentials from there
// let hostStatusBar: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vscode-f5-fast" is now active!');

	// exploring classes to group all f5 api calls
	const f5API = new f5Api();

	context.subscriptions.push(vscode.commands.registerCommand('testCommand1', () => {
		console.log('befor Chuck func call');
		// chuckJoke();

		const gets = f5API.hi();
		console.log(`-----1-----  ${gets}`)
		
		f5API.low();
		// console.log(`-----1-----  ${gets}`)
		
		const gets2 = f5API.funcSole(testTable);
		console.log(`-----2-----  ${gets2}`)

	}));


	


	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.connectDevice', async () => {
		console.log('executing f5-fast.connectDevice');

		// // get config and map bigip hosts to items list for quickPick
		// const bigipHosts = vscode.workspace.getConfiguration().get('f5-fast.hosts', ['']).map(label => ({ label }));
		// // fire quickPick, assign selection
		// const bigipHost1 = await vscode.window.showQuickPick(bigipHosts, {placeHolder: 'select device'}).then(
		// 	host => {
		// 		console.log(`Selected host: ${JSON.stringify(host)}`);

		// 		let hostStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		// 		hostStatusBar.command = 'extension.disconnect';
		// 		// runDevices.color = '#42b883';
		// 		hostStatusBar.text = host;
		// 		hostStatusBar.tooltip = 'Disconnect';
		// 		hostStatusBar.show();

		// 	});
		// 	console.log(`Selected bigipHost1: ${bigipHost1}`);
			

		// another way to do this
		const bigipHostsNew = vscode.workspace.getConfiguration().get('f5-fast.hosts');
		const selectedHost = await vscode.window.showQuickPick(bigipHostsNew, {placeHolder: 'Select Device'}).then(host => {
			console.log(`inside picked: ${host}`);

			// const psswrd = await vscode.window.showInputBox({password: true});
			// console.log(`Password: ${psswrd}`);

			
			
			return host;
		});
		let hostStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		hostStatusBar.command = 'extension.disconnect';
		// runDevices.color = '#42b883';
		hostStatusBar.text = selectedHost;
		hostStatusBar.tooltip = 'Disconnect';
		hostStatusBar.show();
		console.log(`Selected host: ${selectedHost}`)

			// let bigipHost = JSON.stringify(bigipHost1.label);
		// bigipHost = bigipHost.label;
		// vscode.window.showInformationMessage(`Selected device: ${bigipHost}`);


		
		// debugger;
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.connectDevice2', async (hostFromTree, hostStatusBar) => {
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

		var statusBar = setHostStatusBar(bigip.host, bigip.password);

		// testTable[bigip.host] = bigip;
		// const myBigip = testTable['admin@192.168.2.2'];

		console.log(`prefastTemp-statusBar: ${JSON.stringify(statusBar)}`);

		// cont newHost: []
		const fastTemplates = f5API.getFastTemplates(bigip.host, bigip.password);
		// const token = getChuckAuth();
		// console.log('token in main extension: ' + token)

		console.log(`fastTemplates: ${fastTemplates}`);
		// return hostStatusBar;
		// debugger;
	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.disconnect', (hostStatusBar) => {
		console.log('inside disconnect call');
		// trying to access hostStatusBar to clear host information
		//  need to find a way to define/access in a global way
		console.log(`hostStatusBar: ${hostStatusBar}`);
		return vscode.window.showInformationMessage('will disconnect from bigip and clear status bar')

		// hostStatusBar.dispose();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('chuckJoke', () => {
		// console.log('befor Chuck func call');
		chuckJoke();
	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.openSettings', () => {
		// console.log('befor Chuck func call');
		//chuckJoke();
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
