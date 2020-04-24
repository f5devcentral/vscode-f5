import * as vscode from 'vscode';
import { chuckJoke } from './chuckJoke';
import { request } from 'https';


export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vscode-f5-fast" is now active!');

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
	//		2c.	quickPick list of hosts - just log what was selected
	//	3.	inputBox for passwords, keyring to store them
	//	4.	tree view in F5 container
	//		4a.	F5 tree view contianer with f5 logo
	//		4b.	display hosts from config file in tree view
	//		4c. add/edit/delete device from tree view
	//	5.	configure tests?  mocha?
	//	6.	list fast templates under device in tree view
	//		6a.	when selected in tree view, display template in editor
	//	7.	list deployed applications in tree view
	//		7a.	when selected in tree view, display template in editor
	//	8.	configure JSON output highlighting like RestClient


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
		vscode.window.showInformationMessage('placeholder to execute command on bigip...')
	});	
	context.subscriptions.push(disposable);
}


// this method is called when your extension is deactivated
export function deactivate() {}
