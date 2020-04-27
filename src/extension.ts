import * as vscode from 'vscode';

import { request } from 'https';
import { chuckJoke } from './chuckJoke';
import { carTreeDataProvider } from './carTreeView';
import { DepNodeProvider, Dependency } from './nodeDependencies';
import { F5TreeProvider } from './treeProvider';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vscode-f5-fast" is now active!');

	let runDevices = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	runDevices.command = 'extension.disconnect';
	// runDevices.color = '#42b883';
	runDevices.text = "yay F5!!!";
	runDevices.tooltip = 'Disconnect';
	runDevices.show();

	// functionality: configure tree view
	//	-- https://medium.com/@sanaajani/creating-your-first-vs-code-extension-8dbdef2d6ad9
	//	-- https://github.com/Microsoft/vscode-extension-samples/tree/master/tree-view-sample
	//	-- https://stackoverflow.com/search?q=%5Bvisual-studio-code%5D+TreeDataProvider
	//	-- https://stackoverflow.com/questions/56534723/simple-example-to-implement-vs-code-treedataprovider-with-json-data

	//	-- Example tree view for devices and details 
	// 		https://github.com/microsoft/vscode-cosmosdb
	// 		https://github.com/formulahendry/vscode-docker-explorer

	
	// command: execute bash/tmsh on device
	//	-- use device details from tree view, post api to bash endpoint, show response

	//	1.	move chuck joke to function in other file - DONE
	// 	2.	configure extension config to manage device list 
	//		2a.	settings structure to host devices - DONE
	//		2b.	command to quickly bring up settings - DONE
	//		2c.	quickPick list of hosts - just log what was selected - DONE
	//	3.	inputBox for passwords - DONE
	//	4.	keyring to store passwords
	//			- node-keytar - https://github.com/atom/node-keytar
	//	5.	tree view in F5 container
	//		4a.	F5 tree view contianer with f5 logo - DONE
	//		4b.	display hosts from config file in tree view - DONE
	//		4c. add/edit/delete device from tree view
	//	6.	configure tests?  mocha?
	//	7.	list fast templates under device in tree view
	//		6a.	when selected in tree view, display template in editor
	//	8.	list deployed applications in tree view
	//		7a.	when selected in tree view, display template in editor
	//	9.	configure JSON output highlighting like RestClient


	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.connectDevice', async () => {
		console.log('executing f5-fast.connectDevice');

		// get config and map bigip hosts to items list for quickPick
		const bigipHosts = vscode.workspace.getConfiguration().get('f5-fast.hosts', ['']).map(label => ({ label }));
		// fire quickPick, assign selection
		const bigipHost1 = await vscode.window.showQuickPick(bigipHosts, {placeHolder: 'select device'}).then(
			host => console.log(`Selected host: ${JSON.stringify(host)}`)
			);
			console.log(`Selected bigipHost1: ${bigipHost1}`);
			

		// another way to do this
		const bigipHostsNew = vscode.workspace.getConfiguration().get('f5-fast.hosts');
		vscode.window.showQuickPick(Promise.resolve(bigipHostsNew)).then(picked => console.log(picked));
		console.log(`bigipHostsNew: ${bigipHostsNew}`)

			// let bigipHost = JSON.stringify(bigipHost1.label);
		// bigipHost = bigipHost.label;
		// vscode.window.showInformationMessage(`Selected device: ${bigipHost}`);

		
		debugger;
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.connectDevice2', async () => {
		console.log('executing f5-fast.connectDevice2');
		
		const bigipHosts = vscode.workspace.getConfiguration().get('f5-fast.hosts');

		const bigip = await vscode.window.showQuickPick(bigipHosts);
		console.log(`Selected device/host/bigip: ${bigip}`);
		vscode.window.showInformationMessage(`Selected device/host/bigip = ${bigip}`)

		const password = await vscode.window.showInputBox({password: true});
		console.log(`Password: ${password}`);


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
	const hostsTreeProvider = new F5TreeProvider(vscode.workspace.rootPath);
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
