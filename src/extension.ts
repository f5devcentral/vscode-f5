'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';

import * as sample_as3Dec from './test/sample_as3Dec.json';

// import { request } from 'https';
import { chuckJoke } from './chuckJoke';
import { carTreeDataProvider } from './carTreeView';
import { DepNodeProvider, Dependency } from './nodeDependencies';
import { MemFS } from './fileSystemProvider';
import { F5TreeProvider, f5Host } from './hostsTreeProvider';
import { as3TreeProvider } from './as3TreeProvider';
import { fastTemplatesTreeProvider } from './fastTemplatesTreeProvider';
import { f5Api } from './f5Api'
// import { stringify } from 'querystring';
import { setHostStatusBar, setMemento, getMemento, setMementoW, getMementoW } from './utils/utils';
import { test } from 'mocha';
import { ext } from './extensionVariables';


export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vscode-f5-fast" is now active!');

	ext.context = context;

	// Create a status bar item
	ext.hostStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	context.subscriptions.push(ext.hostStatusBar);

	// create virtual file store
	ext.memFs = new MemFS();
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider('memfs', ext.memFs, { isCaseSensitive: true }));
    let initialized = false;


	// exploring classes to group all f5 api calls
	const f5API = new f5Api();


	context.subscriptions.push(vscode.commands.registerCommand('writeMemento', () => {
		console.log('placeholder for testing commands');
		
		vscode.window.showInputBox({
			prompt: 'give me something to store!', 
			// placeHolder: hostID.label,
		})
		.then( value => {

			if (value === undefined) {
				throw new Error('testCommand1 inputBox cancelled');
			}
			setMementoW('key1', value);
			// ext.context.globalState.update('key1', value);
		})

		// const benG = getMemento('key1', value);
		// const benG = ext.context.globalState.get('key1');
		// console.log(benG);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('readMemento', () => {
		console.log('placeholder for testing commands - 2');
		
		const benG = getMementoW('key1');
		// const benG = ext.context.globalState.get('key1');
		// console.log(benG);
		vscode.window.showInformationMessage(`Memento! ${benG}`)
	}));


	
	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.connectDevice', async (host) => {
		console.log('executing f5-fast.connectDevice');
		console.log(`Host from tree select: ${host}`);

		// thinking about how I want to handle device/username/password creds
		//	either in it's own object, or in the host status bar...
		//		if status bar, can easily clear text(host)/password on disconnect
		// need to figure out how to access status bar contents in other contexts.  

		//  will cache passwords with keytar in the future
		
		const bigipHosts: vscode.QuickPickItem[] = await vscode.workspace.getConfiguration().get('f5-fast.hosts');
		
		if (bigipHosts === undefined) {
			throw new Error('no hosts in configuration')
		}
		// initialize virtual file store: memfs
		initialized = true;

		if (!host) {
			host = await vscode.window.showQuickPick(bigipHosts, {placeHolder: 'Select Device'});
			// console.log(`Selected device/host/bigip: ${bigip}`);
			vscode.window.showInformationMessage(`Selected device/host/bigip = ${host}`)
		}

		// clean up bigipHosts var, no longer needed...
		
		// const password: string = await vscode.window.showInputBox({password: true});

		vscode.window.showInputBox({ password: true})
		.then( password => {
			if (!password) {
				throw new Error('User cancelled password input')
			}
			f5API.connectF5(host, password);
			// console.log(`connection token: ${connect}`)
		})

		// var connection = await f5API.connectF5(hostStatusBar, bigip.host, bigip.password);
		//here

	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.disconnect', () => {
		console.log('inside disconnect call');

		// clear status bar 
		// feed it the statusBar object created at top, blank host, blank password)
		setHostStatusBar();

		// for (const [name] of memFs.readDirectory(vscode.Uri.parse('memfs:/'))) {
        //     memFs.delete(vscode.Uri.parse(`memfs:/${name}`));
        // }
        // initialized = false;

		return vscode.window.showInformationMessage('clearing selected bigip and status bar details')
	}));


	context.subscriptions.push(vscode.commands.registerCommand('getF5HostInfo', () => {
		f5API.getF5HostInfo();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('getF5FastInfo', () => {
		f5API.getF5FastInfo();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('listAS3Tasks', () => {
		f5API.listAS3Tasks();
	}));


	context.subscriptions.push(vscode.commands.registerCommand('chuckJoke', () => {
		chuckJoke();
	}));


	context.subscriptions.push(vscode.commands.registerCommand('loadAS3Sample1', () => {
		// can probably set this up to read files from a directory and provide a pick list
		//		or enable it as a tree on the left
		//	setup a command to download a git with all the sample declarations, then enable a tree to show them???
		vscode.workspace.openTextDocument({ 
			language: 'json', 
			content: JSON.stringify(JSON.parse(JSON.stringify(sample_as3Dec)), undefined, 4) 
		})
		.then( doc => 
			vscode.window.showTextDocument(
				doc, 
				{ 
					preview: false 
				}
			)
		)
	}));

	context.subscriptions.push(vscode.commands.registerCommand('postAS3Dec', () => {

		// if selected text, capture that, if not, capture entire document

		var editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}

		// if text is selected in editor
		if (editor.selection.isEmpty) {
			// post entire page
			// validate json structure before send?  something like: try => JSON.parse?

			const text = editor.document.getText();
			console.log(`ENTIRE DOC: ${text}`)

			
			f5API.postAS3(JSON.parse(text));
		} else {
			// post selected text/declaration
			// var selection = editor.selection;
			const text = editor.document.getText(editor.selection);
			
		} 
		console.log(`SELECTED TEXT: ${text}`)
		
	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.openSettings', () => {
		// not sure where this would return anything to...
		return vscode.commands.executeCommand("workbench.action.openSettings", "f5-fast");
	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.addHost', () => {

		vscode.window.showInputBox({prompt: 'Device/BIG-IP/Host      ', placeHolder: '<user>@<host/ip>'})
		.then(newHost => {
			const bigipHosts: Array<string> | undefined = vscode.workspace.getConfiguration().get('f5-fast.hosts');

			if (newHost === undefined) {
				throw new Error('Add device inputBox cancelled');
			}

			// const deviceRex = /^[a-zA-Z]+\d*@\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/		// matches only if host is IP
			const deviceRex = /^[\w-.]+@[\w-.]+$/		// matches any username combo an F5 will accept and host/ip
			// console.log(`Match RegEx? ${deviceRex.test(newHost)}`)	// does it match regex pattern?
			// console.log(`Existing? ${bigipHosts?.includes(newHost)}`)	// it it already in the list?

			if (!bigipHosts?.includes(newHost) && deviceRex.test(newHost)){
				bigipHosts?.push(newHost);
				vscode.workspace.getConfiguration().update('f5-fast.hosts', bigipHosts, vscode.ConfigurationTarget.Global);
				vscode.window.showInformationMessage(`Adding ${newHost} to list!`);
				hostsTreeProvider.refresh();
			} else {
				vscode.window.showErrorMessage('Already exists or invalid format: <user>@<host/ip>');
			}
		});

	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.removeHost', async (hostID) => {
		console.log(`Remove Host command: ${JSON.stringify(hostID)}`)
		
		const bigipHosts: Array<string> | undefined = vscode.workspace.getConfiguration().get('f5-fast.hosts');
		console.log(`Current bigipHosts: ${JSON.stringify(bigipHosts)}`)
		
		const newBigipHosts = bigipHosts?.filter( item => item != hostID.label)
		console.log(`less bigipHosts: ${JSON.stringify(newBigipHosts)}`)
		
		vscode.window.showInformationMessage(`${JSON.stringify(hostID.label)} removed!!!`);
		await vscode.workspace.getConfiguration().update('f5-fast.hosts', newBigipHosts, vscode.ConfigurationTarget.Global);
		hostsTreeProvider.refresh();
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.editHost', async (hostID) => {
		
		// TODO: if hostID === undefined => quickSelect device list
		
		console.log(`Edit Host command: ${JSON.stringify(hostID)}`)
		vscode.window.showInformationMessage(`Editing ${JSON.stringify(hostID.label)} host!!!`);
		
		const bigipHosts: Array<string> | undefined = vscode.workspace.getConfiguration().get('f5-fast.hosts');
		console.log(`Current bigipHosts: ${JSON.stringify(bigipHosts)}`)
		
		//find item position in array, then modify		**** ditching in favor of filter method
		// const location = bigipHosts?.indexOf(hostID)
		// const newHosts: Array<string> = bigipHosts[location]

		vscode.window.showInputBox({
			prompt: 'Update Device/BIG-IP/Host      ', 
			// placeHolder: hostID.label,
			value: hostID.label
		})
		.then( input => {

			if (input === undefined) {
				throw new Error('Update device inputBox cancelled');
			}

			const deviceRex = /^[\w-.]+@[\w-.]+$/
			if (!bigipHosts?.includes(input) && deviceRex.test(input)) {

				const newBigipHosts = bigipHosts?.map( item => {
					if (item === hostID.label) {
						return input;
					} else {
						return item;
					}
				})				
				
				// console.log(`bigipHosts: ${JSON.stringify(bigipHosts)}`)
				// console.log(`newbigipHosts: ${JSON.stringify(newBigipHosts)}`)
				vscode.workspace.getConfiguration().update('f5-fast.hosts', newBigipHosts, vscode.ConfigurationTarget.Global);
				vscode.window.showInformationMessage(`Updating ${input} device name.`);

				// need to give the configuration a chance to save before refresh
				setTimeout( () => {
					hostsTreeProvider.refresh();
				}, 500);
			} else {
				vscode.window.showErrorMessage('Already exists or invalid format: <user>@<host/ip>');
			}
		})
		
	}));


	
	//original way the example extension structured the command
	let disposable = vscode.commands.registerCommand('extension.remoteCommand', async () => {
		return vscode.window.showInformationMessage('placeholder to execute command on bigip...')
	});	
	context.subscriptions.push(disposable);


	// setting up templates tree
	const templatesTreeProvider = new F5TreeProvider('');
	vscode.window.registerTreeDataProvider('fastTemplates', templatesTreeProvider);
	vscode.commands.registerCommand('f5-fast.refreshTemplates', () => templatesTreeProvider.refresh());


	// setting up as3 tree
	const as3Tree = new as3TreeProvider('');
	vscode.window.registerTreeDataProvider('as3', as3Tree);
	vscode.commands.registerCommand('refreshAS3Tree', () => as3Tree.refresh());



	// trying to setup tree provider to list f5 hosts from config file
	// const hostsTreeProvider = new F5TreeProvider(vscode.workspace.getConfiguration().get('f5-fast.hosts'));
	const hostsTreeProvider = new F5TreeProvider('');
	vscode.window.registerTreeDataProvider('f5Hosts', hostsTreeProvider);
	vscode.commands.registerCommand('f5-fast.refreshHostsTree', () => hostsTreeProvider.refresh());
	// vscode.commands.registerCommand('f5-fast.addEntry', () => vscode.window.showInformationMessage(`Successfully called add entry.`));
	// vscode.commands.registerCommand('f5-fast.editEntry', (host: f5Host) => vscode.window.showInformationMessage(`Successfully called edit entry on ${host.label}.`));
	// vscode.commands.registerCommand('f5-fast.deleteEntry', (host: f5Host) => vscode.window.showInformationMessage(`Successfully called delete entry on ${host.label}.`));

	// Samples of `window.registerTreeDataProvider`
	// all entries for nodeDependeny tree view
	const nodeDependenciesProvider = new DepNodeProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
	vscode.commands.registerCommand('nodeDependencies.refreshEntry', () => nodeDependenciesProvider.refresh());
	vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));
	vscode.commands.registerCommand('nodeDependencies.addEntry', () => vscode.window.showInformationMessage(`Successfully called add entry.`));
	vscode.commands.registerCommand('nodeDependencies.editEntry', (node: Dependency) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
	vscode.commands.registerCommand('nodeDependencies.deleteEntry', (node: Dependency) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));


	ext.carTreeData = {
		"cars1": [
			{ "name":"Ford2", "models":[ "Fiesta3", "Focus3", "Mustang3" ] },
			{ "name":"BMW2", "models":[ "3203", "X33", "X53" ] }
		  ]
	}

	vscode.window.registerTreeDataProvider('carTree', new carTreeDataProvider());

}


// this method is called when your extension is deactivated
export function deactivate() {}
