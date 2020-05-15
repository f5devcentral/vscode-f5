'use strict';

import * as vscode from 'vscode';

import { chuckJoke } from './chuckJoke';
import { F5TreeProvider, f5Host } from './treeViewsProviders/hostsTreeProvider';
import { AS3TreeProvider } from './treeViewsProviders/as3TreeProvider';
import { AS3TenantTreeProvider } from './treeViewsProviders/as3TenantTreeProvider';
import { exampleTsDecsProvider, exampleTsDec } from './treeViewsProviders/githubTsExamples';
import { FastTemplatesTreeProvider } from './treeViewsProviders/fastTemplatesTreeProvider';
import { F5Api } from './utils/f5Api';
import { callHTTPS } from './utils/externalAPIs';
import { 
	setHostStatusBar,
	setHostnameBar, 
	setMemento, 
	getMemento, 
	setMementoW, 
	getMementoW, 
	isValidJson, 
	getPassword, 
	setAS3Bar, 
	setDOBar, 
	setTSBar, 
	getDevice,
	displayJsonInEditor,
	setFastBar
} from './utils/utils';
import { test } from 'mocha';
import { ext } from './extensionVariables';
import * as keyTarType from 'keytar';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vscode-f5-fast" is now active!');

	// assign context to global
	ext.context = context;

	// Create a status bar item
	ext.hostStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 20);
	context.subscriptions.push(ext.hostStatusBar);
	ext.hostNameBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 19);
	context.subscriptions.push(ext.hostNameBar);
	ext.fastBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 18);
	context.subscriptions.push(ext.fastBar);
	ext.as3Bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 18);
	context.subscriptions.push(ext.as3Bar);
	ext.doBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 17);
	context.subscriptions.push(ext.doBar);
	ext.tsBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 16);
	context.subscriptions.push(ext.tsBar);


	// exploring classes to group all f5 api calls
	// const f5API = new f5Api();
	ext.f5Api = new F5Api;

	// Setup keyTar global var
	// type KeyTar = typeof keyTarType;
	ext.keyTar = keyTarType;

	// keep an eye on this for different user install scenarios, like slim docker containers that don't have the supporting librarys
	// if this error happens, need to find a fallback method of password caching or disable caching without breaking everything
	if (ext.keyTar === undefined) {
		throw new Error('keytar undefined in initiation');
	}



	/**
	 * #########################################################################
	 *	     ########  ######## ##     ## ####  ######  ########  ######  
	 *	     ##     ## ##       ##     ##  ##  ##    ## ##       ##    ## 
	 *	     ##     ## ##       ##     ##  ##  ##       ##       ##       
	 *	     ##     ## ######   ##     ##  ##  ##       ######    ######  
	 *	     ##     ## ##        ##   ##   ##  ##       ##             ## 
	 *	     ##     ## ##         ## ##    ##  ##    ## ##       ##    ## 
	 * 	     ########  ########    ###    ####  ######  ########  ######  
	 * http://patorjk.com/software/taag/#p=display&h=0&f=Banner3&t=Devices
	 * #########################################################################
	 */
	

	const hostsTreeProvider = new F5TreeProvider('');
	vscode.window.registerTreeDataProvider('f5Hosts', hostsTreeProvider);
	vscode.commands.registerCommand('f5.refreshHostsTree', () => hostsTreeProvider.refresh());
	
	context.subscriptions.push(vscode.commands.registerCommand('f5.connectDevice', async (device) => {
		const bigipHosts: vscode.QuickPickItem[] | undefined = await vscode.workspace.getConfiguration().get('f5.hosts');
		
		if (bigipHosts === undefined) {
			throw new Error('no hosts in configuration');
		}

		// clear status bars before new connect
		setHostStatusBar();
		setHostnameBar();
		setFastBar();
		setAS3Bar();
		setDOBar();
		setTSBar();	
		
		if (!device) {
			device = await vscode.window.showQuickPick(bigipHosts, {placeHolder: 'Select Device'});
			if (!device) {
				throw new Error('user exited device input');
			}
			// console.log(`connectDevice, device quick pick answer: ${device}`);
		}
		// console.log(`connectDevice, pre-password device: ${device}`);
		
		const password: string = await getPassword(device);
		// console.log(`connectDevice, device/password: ${device}/${password}`);
		ext.f5Api.connectF5(device, password);
		return device;
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('f5.getF5HostInfo', async () => {
		var device: string | undefined = ext.hostStatusBar.text;
		
		if (!device) {
			device = await vscode.commands.executeCommand('f5.connectDevice');
		}
		
		if (device === undefined) {
			throw new Error('no hosts in configuration');
		}
		const password: string = await getPassword(device);
		const hostInfo  = await ext.f5Api.getF5HostInfo(device, password);
		displayJsonInEditor(hostInfo.body);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5.disconnect', () => {

		// clear status bars
		setHostStatusBar();
		setHostnameBar();
		setFastBar();
		setAS3Bar();
		setDOBar();
		setTSBar();

		// refresh views to clear trees
		// vscode.commands.executeCommand('f5-fast.refreshTemplates');
		vscode.commands.executeCommand('f5-as3.refreshTenantsTree');
		vscode.commands.executeCommand('f5-as3.refreshTasksTree');

		return vscode.window.showInformationMessage('clearing selected bigip and status bar details');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5.clearPasswords', async () => {
		console.log('CLEARING KEYTAR PASSWORD CACHE');

		// clear status bars 
		setHostStatusBar();
		setHostnameBar();
		setFastBar();
		setAS3Bar();
		setDOBar();
		setTSBar();

		// refresh views to clear trees
		vscode.commands.executeCommand('f5-as3.refreshTenantsTree');
		vscode.commands.executeCommand('f5-as3.refreshTasksTree');

		// get list of items in keytar for the 'f5Hosts' service
		await ext.keyTar.findCredentials('f5Hosts').then( list => {
			// map through and delete all
			list.map(item => ext.keyTar.deletePassword('f5Hosts', item.account));
		});

		return vscode.window.showInformationMessage('Disconnecting BIG-IP and clearing password cache');
	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5.removeHost', async (hostID) => {
		console.log(`Remove Host command: ${JSON.stringify(hostID)}`);

		
		const bigipHosts: Array<string> | undefined = vscode.workspace.getConfiguration().get('f5.hosts');
		// console.log(`Current bigipHosts: ${JSON.stringify(bigipHosts)}`)
		
		if ( bigipHosts === undefined ) {
			throw new Error('Add device inputBox cancelled');
		}
		const newBigipHosts = bigipHosts.filter( item => item !== hostID.label);
		// console.log(`less bigipHosts: ${JSON.stringify(newBigipHosts)}`)
		
		vscode.window.showInformationMessage(`${JSON.stringify(hostID.label)} removed!!!`);
		await vscode.workspace.getConfiguration().update('f5.hosts', newBigipHosts, vscode.ConfigurationTarget.Global);
		hostsTreeProvider.refresh();
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('f5.editHost', async (hostID) => {
		
		// TODO: if hostID === undefined => quickSelect device list
		
		// console.log(`Edit Host command: ${JSON.stringify(hostID)}`)
		vscode.window.showInformationMessage(`Editing ${JSON.stringify(hostID.label)} host!!!`);
		
		const bigipHosts: Array<string> | undefined = vscode.workspace.getConfiguration().get('f5.hosts');
		// console.log(`Current bigipHosts: ${JSON.stringify(bigipHosts)}`)
		
		vscode.window.showInputBox({
			prompt: 'Update Device/BIG-IP/Host      ', 
			value: hostID.label
		})
		.then( input => {

			if (input === undefined || bigipHosts === undefined) {
				throw new Error('Update device inputBox cancelled');
			}

			const deviceRex = /^[\w-.]+@[\w-.]+$/;
			if (!bigipHosts.includes(input) && deviceRex.test(input)) {

				const newBigipHosts = bigipHosts.map( item => {
					if (item === hostID.label) {
						return input;
					} else {
						return item;
					}
				});				
				
				vscode.workspace.getConfiguration().update('f5.hosts', newBigipHosts, vscode.ConfigurationTarget.Global);
				vscode.window.showInformationMessage(`Updating ${input} device name.`);

				// need to give the configuration a chance to save before refresing tree
				setTimeout( () => {
					hostsTreeProvider.refresh();
				}, 300);
			} else {
				vscode.window.showErrorMessage('Already exists or invalid format: <user>@<host/ip>');
			}
		});
		
	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5.openSettings', () => {
		// not sure where this would return anything to...
		return vscode.commands.executeCommand("workbench.action.openSettings", "f5-fast");
	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5.addHost', () => {

		vscode.window.showInputBox({prompt: 'Device/BIG-IP/Host      ', placeHolder: '<user>@<host/ip>'})
		.then(newHost => {
			const bigipHosts: Array<string> | undefined = vscode.workspace.getConfiguration().get('f5.hosts');

			if (newHost === undefined || bigipHosts === undefined) {
				throw new Error('Add device inputBox cancelled');
			}

			// const deviceRex = /^[a-zA-Z]+\d*@\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/		// matches only if host is IP
			const deviceRex = /^[\w-.]+@[\w-.]+$/;		// matches any username combo an F5 will accept and host/ip
			// console.log(`Match RegEx? ${deviceRex.test(newHost)}`)	// does it match regex pattern?
			// console.log(`Existing? ${bigipHosts?.includes(newHost)}`)	// it it already in the list?

			if (!bigipHosts.includes(newHost) && deviceRex.test(newHost)){
				bigipHosts.push(newHost);
				vscode.workspace.getConfiguration().update('f5.hosts', bigipHosts, vscode.ConfigurationTarget.Global);
				vscode.window.showInformationMessage(`Adding ${newHost} to list!`);
				hostsTreeProvider.refresh();
			} else {
				vscode.window.showErrorMessage('Already exists or invalid format: <user>@<host/ip>');
			}
		});

	}));


	//original way the example extension structured the command
	let disposable = vscode.commands.registerCommand('f5.remoteCommand', async () => {
	
		const host = ext.hostStatusBar.text;

		if (host) {
			const password = await getPassword(host);
			const cmd = await vscode.window.showInputBox({ placeHolder: 'Bash Command to Execute?' });
			// const cmd = await vscode.window.showInputBox({ content: 'Bash Command to Execute?' })
			
			if ( cmd === undefined ) {
				// maybe just showInformationMessage and exit instead of error?
				throw new Error('Remote Command inputBox cancelled');
			}

			const bashResp = await ext.f5Api.issueBash(host, password, cmd);

			vscode.workspace.openTextDocument({ 
				language: 'text', 
				content: bashResp.body.commandResult
			})
			.then( doc => 
				vscode.window.showTextDocument(
					doc, 
					{ 
						preview: false 
					}
				)
			);
		}
		
		// return vscode.window.showInformationMessage('placeholder to execute command on bigip...')
	});	
	context.subscriptions.push(disposable);





	/**
	 * ###########################################################################
	 * 
	 *  			FFFFFFF   AAA    SSSSS  TTTTTTT 
 	 *  			FF       AAAAA  SS        TTT   
 	 *  			FFFF    AA   AA  SSSSS    TTT   
 	 *  			FF      AAAAAAA      SS   TTT   
 	 *  			FF      AA   AA  SSSSS    TTT   
	  * 
	  * ############################################################################
	 * http://patorjk.com/software/taag/#p=display&h=0&f=Letters&t=FAST
	 */
	
	// setting up hosts tree
	const fastTreeProvider = new FastTemplatesTreeProvider('');
	vscode.window.registerTreeDataProvider('fastTemplates', fastTreeProvider);
	vscode.commands.registerCommand('f5-fast.refreshTemplates', () => fastTreeProvider.refresh());

	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.getFastInfo', async () => {
		var device: string | undefined = ext.hostStatusBar.text;
		
		if (!device) {
			device = await vscode.commands.executeCommand('f5.connectDevice');
		}

		if (device === undefined) {
			throw new Error('no hosts in configuration');
		}

		if(ext.fastBar.text === '') {
			return vscode.window.showErrorMessage('No FAST detected, install or connect to a device with fast');
		}
		

		const password = await getPassword(device);
		const fast = await ext.f5Api.getF5FastInfo(device, password);
		displayJsonInEditor(fast.body);

	}));





	
	
	/**
	 * ############################################################################
	 * 
	 * 				  AAA     SSSSS   333333  
	 * 				 AAAAA   SS          3333 
	 * 				AA   AA   SSSSS     3333  
	 * 				AAAAAAA       SS      333 
	 * 				AA   AA   SSSSS   333333  
	 * 
	 * 
	 * ############################################################################
	 * http://patorjk.com/software/taag/#p=display&h=0&f=Letters&t=AS3
	 */

	
	// setting up as3 tree
	const as3TenantTree = new AS3TenantTreeProvider('');
	vscode.window.registerTreeDataProvider('as3Tenants', as3TenantTree);
	vscode.commands.registerCommand('f5-as3.refreshTenantsTree', () => as3TenantTree.refresh());
	
	// setting up as3 tree
	const as3Tree = new AS3TreeProvider('');
	vscode.window.registerTreeDataProvider('as3Tasks', as3Tree);
	vscode.commands.registerCommand('f5-as3.refreshTasksTree', () => as3Tree.refresh());

	context.subscriptions.push(vscode.commands.registerCommand('f5-as3.getDecs', async (tenant) => {
		// this command is not exposed through the package.json
		// the only way this gets called, is by the as3 tenants tree, 
		//		which means a device has to be selected to populate the tree
		var device: string | undefined = ext.hostStatusBar.text;
		const password = await getPassword(device);
		const response = await ext.f5Api.getAS3Decs(device, password, tenant);
		displayJsonInEditor(response.body);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-as3.getTask', async (id) => {
		
		var device: string | undefined = ext.hostStatusBar.text;
		
		if (!device) {
			device = await vscode.commands.executeCommand('f5.connectDevice');
		}
		
		if (device === undefined) {
			throw new Error('no hosts in configuration');
		}
		
		const password = await getPassword(device);
		const dec = await ext.f5Api.getAS3Task(device, password, id);
		displayJsonInEditor(dec.body);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-as3.postDec', async () => {

		var device: string | undefined = ext.hostStatusBar.text;
		
		if (!device) {
			device = await vscode.commands.executeCommand('f5.connectDevice');
		}
		
		if (device === undefined) {
			throw new Error('no hosts in configuration');
		}
		
		const password = await getPassword(device);
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
			// console.log(`ENTIRE DOC: ${text}`)

			if (!isValidJson(text)) {
				return vscode.window.showErrorMessage('Not valid JSON');
			}

			const response = await ext.f5Api.postAS3Dec(device, password, JSON.parse(text));
			displayJsonInEditor(response);
			
		} else {
			// post selected text/declaration
			// var selection = editor.selection;
			const text = editor.document.getText(editor.selection);
			if (!isValidJson(text)) {
				return vscode.window.showErrorMessage('Not valid JSON');
			}
			
			const response = await ext.f5Api.postAS3Dec(device, password, JSON.parse(text));
			displayJsonInEditor(response);
		} 
		
	}));




	/**
	 * #########################################################################
	 * 
	 *			 TTTTTTT  SSSSS  	
	 *			   TTT   SS      	
	 *			   TTT    SSSSS  	
	 *			   TTT        SS 	
	 *			   TTT    SSSSS  	
	 * 	
	 * http://patorjk.com/software/taag/#p=display&h=0&f=Letters&t=TS
	 * http://patorjk.com/software/taag/#p=display&h=0&f=ANSI%20Regular&t=TS
	 * #########################################################################
	 * 
	 */

	const tsDecTree = new exampleTsDecsProvider('testDataInput');
	context.subscriptions.push(vscode.commands.registerCommand('f5-ts.enableTsExamples', () => {
		// chuckJoke();
		// setting up example TS dec tree
		vscode.window.registerTreeDataProvider('tsExamples', new exampleTsDecsProvider('testDataInput'));
		// no need for refresh since we get a fresh tree every "enable" or window/workspace reload
		vscode.commands.registerCommand('refreshTsExamleTree', () => tsDecTree.refresh());		// never wired up to get called...
	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-ts.disableTsExamples', () => {
		vscode.window.showInformationMessage(`Wire up clearing ts example view!`);
		// I was thinking the following dispose would dispose of the registration and clear the tree, but that doesn't work
		// I figure just leave it for now, at least it only loads when user "enables" it, 
		tsDecTree.dispose();
	}));



	context.subscriptions.push(vscode.commands.registerCommand('f5-ts.info', async () => {
		const host = ext.hostStatusBar.text;
		if (host) {
			const password = await getPassword(host);
			const tsInfo = await ext.f5Api.getTsInfo(host, password);

			if ( tsInfo === undefined ) {
				throw new Error('getTsInfo failed');
			};

			displayJsonInEditor(tsInfo);
		};
	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5-ts.getDec', async () => {
		
		var device: string | undefined = ext.hostStatusBar.text;
		
		if (!device) {
			device = await vscode.commands.executeCommand('f5.connectDevice');
		}
		
		if (device === undefined) {
			throw new Error('no hosts in configuration');
		}

		const password = await getPassword(device);
		const dec = await ext.f5Api.getTSDec(device, password);
		displayJsonInEditor(dec.body.declaration);

	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-ts.postDec', async () => {

		const device = ext.hostStatusBar.text;
		var tsDecResponse = {};

		if (!device) {
			throw new Error('Connect to device first');
		}

		const password = await getPassword(device);

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

			if (!isValidJson(text)) {
				return vscode.window.showErrorMessage('Not valid JSON');
			}

			tsDecResponse = await ext.f5Api.postTSDec(device, password, JSON.parse(text));
			displayJsonInEditor(tsDecResponse);
		} else {
			// post selected text/declaration
			// var selection = editor.selection;
			const text = editor.document.getText(editor.selection);
			if (!isValidJson(text)) {
				return vscode.window.showErrorMessage('Not valid JSON');
			}
			
			tsDecResponse = await ext.f5Api.postTSDec(device, password, JSON.parse(text));
			displayJsonInEditor(tsDecResponse);
		} 

	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-ts.getGitHubExampleTs', async (decUrl) => {
		decUrl = vscode.Uri.parse(decUrl);
		const decCall = await callHTTPS({
		    method: 'GET',
		    host: decUrl.authority,
		    path: decUrl.path,
		    headers: {
		        'Content-Type': 'application/json',
		        'User-Agent': 'nodejs native HTTPS'
		    }
		}).then( resp => {
			return resp;
		});

		displayJsonInEditor(decCall.body);
	}));





/**
 * #########################################################################
 * 			 █████    ██████  
 *			 ██   ██ ██    ██ 
 *			 ██   ██ ██    ██ 
 *			 ██   ██ ██    ██ 
 *			 █████    ██████  
 * 			
 * #########################################################################
 * 	http://patorjk.com/software/taag/#p=display&h=0&f=ANSI%20Regular&t=DO
 */

	context.subscriptions.push(vscode.commands.registerCommand('f5-do.getDec', async () => {
		var device: string | undefined = ext.hostStatusBar.text;

		if (!device) {
			device = await vscode.commands.executeCommand('f5.connectDevice');
		}
		
		if (device === undefined) {
			throw new Error('no hosts in configuration');
		}
		
		const password = await getPassword(device);
		const resp = await ext.f5Api.getDoDec(device, password);

		if (resp.body === []) {
			vscode.window.showInformationMessage(`No declaration detected on device`);
			return;
		} else {
			return displayJsonInEditor(resp.body.declaration);
		}

	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-do.postDec', async () => {

		const device = ext.hostStatusBar.text;
		var doDecResponse = {};

		if (!device) {
			throw new Error('Connect to device first');
		}

		const password = await getPassword(device);

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
			// console.log(`CAPTURING ENTIRE EDITOR DOC: ${text}`)

			if (!isValidJson(text)) {
				return vscode.window.showErrorMessage('Not valid JSON');
			}

			doDecResponse = await ext.f5Api.postDoDec(device, password, JSON.parse(text));
			displayJsonInEditor(doDecResponse);
		} else {
			// post selected text/declaration
			// var selection = editor.selection;
			const text = editor.document.getText(editor.selection);
			if (!isValidJson(text)) {
				return vscode.window.showErrorMessage('Not valid JSON');
			}
			
			// console.log(`SELECTED TEXT: ${text}`)
			doDecResponse = await ext.f5Api.postTSDec(device, password, JSON.parse(text));
			displayJsonInEditor(doDecResponse);
		} 

	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5-do.inspect', async () => {
		var device: string | undefined = ext.hostStatusBar.text;

		if (!device) {
			device = await vscode.commands.executeCommand('f5.connectDevice');
		}
		
		if (device === undefined) {
			throw new Error('no hosts in configuration');
		}
		
		const password = await getPassword(device);
		const resp = await ext.f5Api.doInspect(device, password);

		displayJsonInEditor(resp.body);
	}));



	context.subscriptions.push(vscode.commands.registerCommand('f5-do.getTasks', async () => {
		var device: string | undefined = ext.hostStatusBar.text;

		if (!device) {
			device = await vscode.commands.executeCommand('f5.connectDevice');
		}
		
		if (device === undefined) {
			throw new Error('no hosts in configuration');
		}
		
		const password = await getPassword(device);
		const resp = await ext.f5Api.doTasks(device, password);

		displayJsonInEditor(resp.body);
	}));





/**
 * #########################################################################
 * 
 * 		UU   UU  TTTTTTT  IIIII  LL      
 * 		UU   UU    TTT     III   LL      
 * 		UU   UU    TTT     III   LL      
 * 		UU   UU    TTT     III   LL      
 * 		 UUUUU     TTT    IIIII  LLLLLLL 
 * 
 * #########################################################################
 * http://patorjk.com/software/taag/#p=display&h=0&f=Letters&t=UTIL
 */


	context.subscriptions.push(vscode.commands.registerCommand('writeMemento', () => {
		// console.log('placeholder for testing commands');
		
		vscode.window.showInputBox({
			prompt: 'give me something to store!', 
		})
		.then( value => {

			if (value === undefined) {
				throw new Error('write memeto inputBox cancelled');
			}
			setMementoW('key1', value);
		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('readMemento', async () => {
		// console.log('placeholder for testing commands - 2');
		
		const mento1 = getMementoW('key1');
		vscode.window.showInformationMessage(`Memento! ${mento1}`);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('chuckJoke', () => {
		chuckJoke();
	}));

}


// this method is called when your extension is deactivated
export function deactivate() {}
