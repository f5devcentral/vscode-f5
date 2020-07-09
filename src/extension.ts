'use strict';

import * as vscode from 'vscode';

import { chuckJoke2, chuckJoke1 } from './chuckJoke';
import { F5TreeProvider, F5Host } from './treeViewsProviders/hostsTreeProvider';
import { AS3TreeProvider } from './treeViewsProviders/as3TasksTreeProvider';
import { AS3TenantTreeProvider } from './treeViewsProviders/as3TenantTreeProvider';
import { ExampleDecsProvider, ExampleDec } from './treeViewsProviders/githubDecExamples';
import { FastTemplatesTreeProvider } from './treeViewsProviders/fastTreeProvider';
import * as f5Api from './utils/f5Api';
import { callHTTPS } from './utils/externalAPIs';
import * as utils from './utils/utils';
import { ext, git } from './extensionVariables';
import { displayWebView, WebViewPanel } from './webview';
import { FastWebViewPanel } from './utils/fastHtmlPreveiwWebview';
import * as keyTarType from 'keytar';
import * as f5FastApi from './utils/f5FastApi';
import * as f5FastUtils from './utils/f5FastUtils';
import * as rpmMgmt from './utils/rpmMgmt';
import { MgmtClient } from './utils/f5DeviceClient';
import { getAuthToken, callHTTP, makeRequestAX, makeReqAXnew } from './utils/coreF5HTTPS';
import * as path from 'path';
import * as fs from 'fs';

const fast = require('@f5devcentral/f5-fast-core');

// import { MemFS } from './treeViewsProviders/fileSystemProvider';
// import { HttpResponseWebview } from './responseWebview';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vscode-f5-fast" is now active!');

	// assign context to global
	ext.context = context;

	// Create a status bar item
	ext.hostStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 15);
	context.subscriptions.push(ext.hostStatusBar);
	ext.hostNameBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 14);
	context.subscriptions.push(ext.hostNameBar);
	ext.fastBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 13);
	context.subscriptions.push(ext.fastBar);
	ext.as3Bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 12);
	context.subscriptions.push(ext.as3Bar);
	ext.doBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 11);
	context.subscriptions.push(ext.doBar);
	ext.tsBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
	context.subscriptions.push(ext.tsBar);
	
	// exploring classes to group all f5 api calls
	// const f5API = new f5Api();
	// ext.f5Api = new F5Api;
	// let webview = new HttpResponseWebview(context);

	// const zip = new JSZip();

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
	 *
	 * 	     ########  ######## ##     ## ####  ######  ########  ######  
	 *	     ##     ## ##       ##     ##  ##  ##    ## ##       ##    ## 
	 *	     ##     ## ##       ##     ##  ##  ##       ##       ##       
	 *	     ##     ## ######   ##     ##  ##  ##       ######    ######  
	 *	     ##     ## ##        ##   ##   ##  ##       ##             ## 
	 *	     ##     ## ##         ## ##    ##  ##    ## ##       ##    ## 
	 * 	     ########  ########    ###    ####  ######  ########  ######  
	 * 
	 * http://patorjk.com/software/taag/#p=display&h=0&f=Banner3&t=Devices
	 * #########################################################################
	 */
	

	const hostsTreeProvider = new F5TreeProvider('');
	vscode.window.registerTreeDataProvider('f5Hosts', hostsTreeProvider);
	vscode.commands.registerCommand('f5.refreshHostsTree', () => hostsTreeProvider.refresh());
	
	context.subscriptions.push(vscode.commands.registerCommand('f5.connectDevice', async (device) => {
		


		// clear status bars before new connect
		utils.setHostStatusBar();
		utils.setHostnameBar();
		utils.setFastBar();
		utils.setAS3Bar();
		utils.setDOBar();
		utils.setTSBar();	
		
		if (!device) {
			const bigipHosts: string[] | undefined= await vscode.workspace.getConfiguration().get('f5.hosts');
			if (bigipHosts === undefined) {
				throw new Error('no hosts in configuration');
			}
			device = await vscode.window.showQuickPick(bigipHosts, {placeHolder: 'Select Device'});
			if (!device) {
				throw new Error('user exited device input');
			}
		}
		
		const password: string = await utils.getPassword(device);
		const discovery = await f5Api.connectF5(device, password);
		console.log(`F5 Connect Discovered ${JSON.stringify(discovery)}`);


		/**
		 * following not really being used yet, but it the beginning of using a class
		 * 	to manage host/port/user/password across all calls within the extension
		 * This is taking heavy inspiration from the f5-sdk-js
		 */
		var [user, host] = device.split('@');
		var [host, port] = host.split(':');
		ext.mgmtClient = new MgmtClient(device, {host, port, user, password});
		
		/**
		 * setup the following to replace the f5Api.connectF5
		 * do all the service discovery
		 * 
		 * need to be able to call this after ilx install/un-install
		 */
		// await mgmtClient.login();
		// await ext.mgmtClient.connect();
		

	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('f5.getF5HostInfo', async () => {
		var device: string | undefined = ext.hostStatusBar.text;
		
		if (!device) {
			device = await vscode.commands.executeCommand('f5.connectDevice');
		}
		
		if (device === undefined) {
			throw new Error('no hosts in configuration');
		}

		const password: string = await utils.getPassword(device);
		const hostInfo  = await f5Api.getF5HostInfo(device, password);
		utils.displayJsonInEditor(hostInfo.body);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5.disconnect', () => {

		// clear status bars
		utils.setHostStatusBar();
		utils.setHostnameBar();
		utils.setFastBar();
		utils.setAS3Bar();
		utils.setDOBar();
		utils.setTSBar();

		return vscode.window.showInformationMessage('clearing selected bigip and status bar details');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5.clearPasswords', async () => {
		console.log('CLEARING KEYTAR PASSWORD CACHE');

		// clear status bars 
		utils.setHostStatusBar();
		utils.setHostnameBar();
		utils.setFastBar();
		utils.setAS3Bar();
		utils.setDOBar();
		utils.setTSBar();

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
		// vscode.window.showInformationMessage(`Editing ${JSON.stringify(hostID.label)} host!!!`);
		
		const bigipHosts: Array<string> | undefined = vscode.workspace.getConfiguration().get('f5.hosts');
		// console.log(`Current bigipHosts: ${JSON.stringify(bigipHosts)}`)
		
		vscode.window.showInputBox({
			prompt: 'Update Device/BIG-IP/Host', 
			value: hostID.label
		})
		.then( input => {

			if (input === undefined || bigipHosts === undefined) {
				throw new Error('Update device inputBox cancelled');
			}

			const deviceRex = /^[\w-.]+@[\w-.]+(:[0-9]+)?$/;
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
				setTimeout( () => { hostsTreeProvider.refresh();}, 300);
			} else {
				vscode.window.showErrorMessage('Already exists or invalid format: <user>@<host/ip>');
			}
		});
		
	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5.openSettings', () => {
		// not sure where this would return anything to...
		return vscode.commands.executeCommand("workbench.action.openSettings", "f5");
	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5.addHost', () => {

		vscode.window.showInputBox({prompt: 'Device/BIG-IP/Host', placeHolder: '<user>@<host/ip>'})
		.then(newHost => {
			const bigipHosts: Array<string> | undefined = vscode.workspace.getConfiguration().get('f5.hosts');

			if (newHost === undefined || bigipHosts === undefined) {
				throw new Error('Add device inputBox cancelled');
			}

			// const deviceRex = /^[a-zA-Z]+\d*@\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/		// matches only if host is IP
			const deviceRex = /^[\w-.]+@[\w-.]+(:[0-9]+)?$/;		// matches any username combo an F5 will accept and host/ip
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
			// debugger;
		});

	}));


	//original way the example extension structured the command
	let disposable = vscode.commands.registerCommand('f5.remoteCommand', async () => {
	
		const host = ext.hostStatusBar.text;

		if (host) {
			const password = await utils.getPassword(host);
			const cmd = await vscode.window.showInputBox({ placeHolder: 'Bash Command to Execute?' });
			// const cmd = await vscode.window.showInputBox({ content: 'Bash Command to Execute?' })
			
			if ( cmd === undefined ) {
				// maybe just showInformationMessage and exit instead of error?
				throw new Error('Remote Command inputBox cancelled');
			}

			const bashResp = await f5Api.issueBash(host, password, cmd);

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



	context.subscriptions.push(vscode.commands.registerCommand('f5.installRPM', async (selectedRPM) => {


		if(selectedRPM) {
			// set rpm path/location from oject return in explorer tree
			selectedRPM = selectedRPM.fsPath;
			console.log(`workspace selected rpm`, selectedRPM);
		} else {
			// pick atc/tool/version picker/downloader
			selectedRPM = await rpmMgmt.rpmPicker();
			console.log('downloaded rpm location', selectedRPM);
		}

		if(!selectedRPM) {
			debugger;
		}
		
		const installedRpm = await rpmMgmt.rpmInstaller(selectedRPM);
		console.log('installed rpm', installedRpm);

		/**
		 * if rpmFromExplorer
		 * 	- means user right-clicked an npm from a folder in the workspace
		 * 	- return file location 
		 * else
		 * 	- start atc/tool/version picker/downloader function
		 * 	- return file location once downloaded
		 * 
		 * --- npm picker function (no input)
		 * 1. quickPick to select ATC service [fast, as3, do, ts]
		 * 2. quickPick version [latest, v3.20.0, v3.19.2]
		 * 3. download rpm and sha
		 * 4. return file location
		 * 
		 * --- npm installer function -> input: string = <file_location>
		 * 1. upload rpm
		 * 2. install rpm
		 * 3. reconnect to refresh everything
		 */
	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5.unInstallRPM', async () => {
		// get installed packages
		const installedRPMs = await rpmMgmt.installedRPMs();
		// have user select package
		const rpm = await vscode.window.showQuickPick(installedRPMs, {placeHolder: 'select rpm to remove'});

		if(!rpm) {	// return error pop-up if quickPick escaped
			return vscode.window.showWarningMessage('user exited - did not select rpm to un-install');
		}

		const status = await rpmMgmt.unInstallRpm(rpm);
		vscode.window.showInformationMessage(`rpm ${rpm} removal ${status}`);
		// debugger;

	}));



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
	vscode.window.registerTreeDataProvider('fastView', fastTreeProvider);
	vscode.commands.registerCommand('f5-fast.refreshTemplates', () => fastTreeProvider.refresh());

	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.getInfo', async () => {
		var device: string | undefined = ext.hostStatusBar.text;
		
		if (!device) {
			device = await vscode.commands.executeCommand('f5.connectDevice');
		}

		if (device === undefined) {
			throw new Error('no hosts in configuration');
		}

		const password = await utils.getPassword(device);
		const response = await f5Api.getF5FastInfo(device, password);
		if (ext.settings.previewResponseInUntitledDocument) {
			utils.displayJsonInEditor(response.body);
		} else {
			WebViewPanel.render(context.extensionPath, response.body);
		}

	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.deployApp', async () => {
		const device = ext.hostStatusBar.text;
		const password = await utils.getPassword(device);
		// const fast = ext.fastBar.text;
		const [username, host] = device.split('@');

		// get editor window
		var editor = vscode.window.activeTextEditor;
		if (!editor) {	
			return; // No open text editor
		}

		// capture selected text or all text in editor
		let text: string;
		if (editor.selection.isEmpty) {
			text = editor.document.getText();	// entire editor/doc window
		} else {
			text = editor.document.getText(editor.selection);	// highlighted text
		} 

		// TODO: make this a try sequence to only parse the json once
		let jsonText: object;
		if(utils.isValidJson(text)){
			jsonText = JSON.parse(text);
		} else {
			vscode.window.showWarningMessage(`Not valid json object`);
			return;
		}
		
		const response = await f5FastApi.deployFastApp(device, password, '', jsonText);

		if (ext.settings.previewResponseInUntitledDocument) {
			utils.displayJsonInEditor(response.body);
		} else {
			WebViewPanel.render(context.extensionPath, response.body);
		}

		// give a little time to finish before refreshing trees
		await new Promise(resolve => { setTimeout(resolve, 3000); });
		fastTreeProvider.refresh();
		as3TenantTree.refresh();
	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.getApp', async (tenApp) => {
		const device = ext.hostStatusBar.text;
		const password = await utils.getPassword(device);
		// const fast = ext.fastBar.text;
		const [username, host] = device.split('@');
		
		const authToken = await getAuthToken(host, username, password);
		const task = await callHTTP('GET', host, `/mgmt/shared/fast/applications/${tenApp}`, authToken);

		if (ext.settings.previewResponseInUntitledDocument) {
			utils.displayJsonInEditor(task.body);
		} else {
			WebViewPanel.render(context.extensionPath, task.body);
		}
	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.getTask', async (taskId) => {
		const device = ext.hostStatusBar.text;
		const password = await utils.getPassword(device);
		const [username, host] = device.split('@');
		
		const authToken = await getAuthToken(host, username, password);
		const task = await callHTTP('GET', host, `/mgmt/shared/fast/tasks/${taskId}`, authToken);

		if (ext.settings.previewResponseInUntitledDocument) {
			utils.displayJsonInEditor(task.body);
		} else {
			WebViewPanel.render(context.extensionPath, task.body);
		}
	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.getTemplate', async (template) => {
		const device = ext.hostStatusBar.text;
		const password = await utils.getPassword(device);
		const [username, host] = device.split('@');
		
		const authToken = await getAuthToken(host, username, password);
		const fTemp = await callHTTP('GET', host, `/mgmt/shared/fast/templates/${template}`, authToken);

		if (ext.settings.previewResponseInUntitledDocument) {
			utils.displayJsonInEditor(fTemp.body);
		} else {
			WebViewPanel.render(context.extensionPath, fTemp.body);
		}

	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.getTemplateSets', async (set) => {
		const device = ext.hostStatusBar.text;
		const password = await utils.getPassword(device);
		const [username, host] = device.split('@');
		
		const authToken = await getAuthToken(host, username, password);
		const fTempSet = await callHTTP('GET', host, `/mgmt/shared/fast/templatesets/${set}`, authToken);

		if (ext.settings.previewResponseInUntitledDocument) {
			utils.displayJsonInEditor(fTempSet.body);
		} else {
			WebViewPanel.render(context.extensionPath, fTempSet.body);
		}

	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.convJson2Mst', async () => {

		// get editor window
		var editor = vscode.window.activeTextEditor;
		if (!editor) {	return; // No open text editor
		}

		// capture selected text or all text in editor
		let text: string;
		if (editor.selection.isEmpty) {
			text = editor.document.getText();	// entire editor/doc window
		} else {
			text = editor.document.getText(editor.selection);	// highlighted text
		} 

		console.log(JSON.stringify(text));

		if(utils.isValidJson(text)){

			//TODO:  parse object and find the level for just ADC,
			//		need to remove all the AS3 details since fast will handle that
			// - if it's an object and it contains "class" key and value should be "Tenant"
			utils.displayMstInEditor(JSON.parse(text));
		} else {
			vscode.window.showWarningMessage(`not valid json object`);
		}


	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.postTemplate', async (sFile) => {

		let text: string | Buffer;

		if(!sFile) {
			// not right click from explorer view, so gather file details

			// get editor window
			var editor = vscode.window.activeTextEditor;
			if (!editor) {	
				return; // No open text editor
			}

			// capture selected text or all text in editor
			if (editor.selection.isEmpty) {
				text = editor.document.getText();	// entire editor/doc window
			} else {
				text = editor.document.getText(editor.selection);	// highlighted text
			} 
		} else {
			// right click from explorer view, so load file contents
			const fileContents = fs.readFileSync(sFile.fsPath);
			// convert from buffer to string
			text = fileContents.toString('utf8');
		}

		await f5FastUtils.zipPostTemplate(text);

		await new Promise(resolve => { setTimeout(resolve, 1000); });
		fastTreeProvider.refresh();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.postTemplateSet', async (sPath) => {

		console.log('postTemplateSet selection', sPath);
		let wkspPath;
		let selectedFolder;
		
		if(!sPath) {
			// didn't get a path passed in from right click, so we have to gather necessary details

			// get list of open workspaces
			const workspaces: vscode.WorkspaceFolder[] | undefined= vscode.workspace.workspaceFolders;
			console.log('workspaces', workspaces);
			
			// if no open workspace...
			if(!workspaces) {
				// Show message to select workspace
				await vscode.window.showInformationMessage('See top bar to open a workspace with Fast Templates first');
				// pop up to selecte a workspace
				await vscode.window.showWorkspaceFolderPick();
				// return to begining of function to try again
				return vscode.commands.executeCommand('f5-fast.postTemplateSet');
			}
		
			const folder1 = vscode.workspace.workspaceFolders![0]!.uri;
			wkspPath = folder1.fsPath;
			const folder2 = await vscode.workspace.fs.readDirectory(folder1);
		
			// console.log('workspace', vscode.workspace);
			console.log('workspace name', vscode.workspace.name);
			
			/**
			 * having problems typing the workspaces to a list for quick pick
			 * todo: get the following working
			 */
			// let wkspc;
			// if (workspaces.length > 1) {
			// 	// if more than one workspace open, have user select the workspace
			// 	wkspc = await vscode.window.showQuickPick(workspaces);
			// } else {
			// 	// else select the first workspace
			// 	wkspc = workspaces[0];
			// }
			
			let wFolders = [];
			for (const [name, type] of await vscode.workspace.fs.readDirectory(folder1)) {

				if (type === vscode.FileType.Directory){
					console.log('---directory', name);
					wFolders.push(name);
				}
			};

			// have user select first level folder in workspace
			selectedFolder = await vscode.window.showQuickPick(wFolders);
			
			if(!selectedFolder) {
				// if user "escaped" folder selection window
				return vscode.window.showInformationMessage('Must select a Fast Template Set folder');
			}
			console.log('workspace path', wkspPath);
			console.log('workspace folder', selectedFolder);
			selectedFolder = path.join(wkspPath, selectedFolder);

		} else {
			console.log('caught selected path');
			selectedFolder = sPath.fsPath;
		}

		await f5FastUtils.zipPostTempSet(selectedFolder);

		await new Promise(resolve => { setTimeout(resolve, 3000); });
		fastTreeProvider.refresh();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.deleteFastApp', async (tenApp) => {
		
		var device: string | undefined = ext.hostStatusBar.text;
		const password = await utils.getPassword(device);
		const response = await f5FastApi.delTenApp(device, password, tenApp.label);

		if (ext.settings.previewResponseInUntitledDocument) {
			utils.displayJsonInEditor(response.body);
		} else {
			WebViewPanel.render(context.extensionPath, response.body);
		}
	
		// give a little time to finish
		await new Promise(resolve => { setTimeout(resolve, 2000); });
		fastTreeProvider.refresh();
		as3TenantTree.refresh();
	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.deleteFastTempSet', async (tempSet) => {
		
		var device: string = ext.hostStatusBar.text;
		const password = await utils.getPassword(device);
		const response = await f5FastApi.delTempSet(device, password, tempSet.label);

		vscode.window.showInformationMessage(`Fast Template Set Delete: ${response.body.message}`);

		// give a little time to finish
		await new Promise(resolve => { setTimeout(resolve, 1000); });
		fastTreeProvider.refresh();

	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.renderYmlTemplate', async () => {

		/**
		 * this is working through the f5 fast template creating process
		 * https://clouddocs.f5.com/products/extensions/f5-appsvcs-templates/latest/userguide/template-authoring.html
		 * 
		 * I think I was trying to take in a params.yml file to feed into an .mst file to test the output before
		 * 		being able to upload to fast as a template
		 */

		var editor = vscode.window.activeTextEditor;
		if (!editor) {	return; // No open text editor
		}

		let text: string;
		if (editor.selection.isEmpty) {
			text = editor.document.getText();	// entire editor/doc window
		} else {
			text = editor.document.getText(editor.selection);	// highlighted text
		} 

		// const templateEngine = await fast.Template.loadYaml(text);

		// const schema = templateEngine.getParametersSchema();
		// // const view = {};
		// const htmlData = fast.guiUtils.generateHtmlPreview(schema, {});
		// displayWebView(htmlData);
		// f5FastUtils.templateFromYaml(text);

	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5-fast.renderHtmlPreview', async () => {

		/**
		 * this view is requested by zinke as part of the template authoring process
		 * 	The view should consume/watch the yml file that defines the user inputs for the template
		 * 	Every time a save occurs, it should refresh with the changes to streamline the authoring process
		 */

		var editor = vscode.window.activeTextEditor;
		if (!editor) {	return; // No open text editor
		}

		let text: string;
		if (editor.selection.isEmpty) {
			text = editor.document.getText();	// entire editor/doc window
		} else {
			text = editor.document.getText(editor.selection);	// highlighted text
		} 

		const templateEngine = await fast.Template.loadYaml(text);

		const schema = templateEngine.getParametersSchema();

		const htmlData = fast.guiUtils.generateHtmlPreview(schema, {});
		FastWebViewPanel.render(context.extensionPath, htmlData);
		// f5FastUtils.renderHtmlPreview(text);

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
		const password = await utils.getPassword(device);
		const response = await f5Api.getAS3Decs(device, password, tenant);

		if (ext.settings.previewResponseInUntitledDocument) {
			utils.displayJsonInEditor(response.body);
		} else {
			WebViewPanel.render(context.extensionPath, response.body);
		}
	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5-as3.fullTenant', async (tenant) => {
		vscode.commands.executeCommand('f5-as3.getDecs', `${tenant.label}?show=full`);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('f5-as3.expandedTenant', async (tenant) => {
		vscode.commands.executeCommand('f5-as3.getDecs', `${tenant.label}?show=expanded`);
	}));
	
	
	context.subscriptions.push(vscode.commands.registerCommand('f5-as3.deleteTenant', async (tenant) => {
		
		var device: string | undefined = ext.hostStatusBar.text;
		const password = await utils.getPassword(device);
		const response = await f5Api.delAS3Tenant(device, password, tenant.label);

		// TODO:  change following feedback to a simple pop up
		if (ext.settings.previewResponseInUntitledDocument) {
			utils.displayJsonInEditor(response.body);
		} else {
			WebViewPanel.render(context.extensionPath, response.body);
		}
	
		// give a little time to finish
		await new Promise(resolve => { setTimeout(resolve, 3000); });
		as3TenantTree.refresh();
		as3Tree.refresh();

	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-as3.getTask', async (id) => {
		var device: string | undefined = ext.hostStatusBar.text;
		if (!device) {
			device = await vscode.commands.executeCommand('f5.connectDevice');
		}
		
		if (device === undefined) {
			throw new Error('no hosts in configuration');
		}
		
		const password = await utils.getPassword(device);
		const response = await f5Api.getAS3Task(device, password, id);

		if (ext.settings.previewResponseInUntitledDocument) {
			utils.displayJsonInEditor(response.body);
		} else {
			WebViewPanel.render(context.extensionPath, response.body);
		}

	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-as3.postDec', async () => {

		var device: string | undefined = ext.hostStatusBar.text;
		ext.as3AsyncPost = vscode.workspace.getConfiguration().get('f5.as3Post.async');
		// const postParam: string | undefined = vscode.workspace.getConfiguration().get('f5.as3Post.async');

		if (!device) {
			device = await vscode.commands.executeCommand('f5.connectDevice');
		}
		
		if (device === undefined) {
			throw new Error('no hosts in configuration');
		}
		
		const password = await utils.getPassword(device);
		// if selected text, capture that, if not, capture entire document

		let postParam;
		if(ext.as3AsyncPost) {
			postParam = 'async=true';
		} else {
			postParam = undefined;
		}

		var editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}

		let text: string;
		if (editor.selection.isEmpty) {
			text = editor.document.getText();	// entire editor/doc window
		} else {
			text = editor.document.getText(editor.selection);	// highlighted text
		} 

		if (!utils.isValidJson(text)) {
			return vscode.window.showErrorMessage('Not valid JSON object');
		}

		// use the following logic to implement robust async
		// https://github.com/vinnie357/demo-gcp-tf/blob/add-glb-targetpool/terraform/gcp/templates/as3.sh
		const response = await f5Api.postAS3Dec(device, password, postParam, JSON.parse(text));

		if (ext.settings.previewResponseInUntitledDocument) {
			utils.displayJsonInEditor(response.body);
		} else {
			WebViewPanel.render(context.extensionPath, response.body);
		}
		as3TenantTree.refresh();
		as3Tree.refresh();		
	}));


	/**
	 * experimental - this feature is intented to grab the current json object declaration in the editor,
	 * 		try to figure out if it's as3/do/ts, then apply the appropriate schema reference in the object
	 * 	if it detects the schema already there, it will remove it.
	 */
	context.subscriptions.push(vscode.commands.registerCommand('f5.injectSchemaRef', async () => {

		vscode.window.showWarningMessage('experimental feature in development');
		
		var editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}

		let text: string;
		if (editor.selection.isEmpty) {
			text = editor.document.getText();	// entire editor/doc window
		} else {
			text = editor.document.getText(editor.selection);	// highlighted text
		} 

		if (!utils.isValidJson(text)) {
			return vscode.window.showErrorMessage('Not valid JSON object');
		}
		
		var newText = JSON.parse(text);
		if(!newText.hasOwnProperty('$schema')) {
			//if it has the class property, see what it is
			if(newText.hasOwnProperty('class') && newText.class === 'AS3') {
				newText['$schema'] = git.latestAS3schema;

			} else if (newText.hasOwnProperty('class') && newText.class === 'Device') {
				newText['$schema'] = git.latestDOschema;
				
			} else if (newText.hasOwnProperty('class') && newText.class === 'Telemetry') {
				newText['$schema'] = git.latestTSschema;
			} else {
				vscode.window.showInformationMessage(`Could not find base declaration class for as3/do/ts`);
			}
		} else {
			vscode.window.showInformationMessage(`Removing ${newText.$schema}`);
			delete newText.$schema;

		}

		console.log(`newText below`);
		console.log(newText);

		const {activeTextEditor} = vscode.window;

        if (activeTextEditor && activeTextEditor.document.languageId === 'json') {
            const {document} = activeTextEditor;
			const firstLine = document.lineAt(0);
			const lastLine = document.lineAt(document.lineCount - 1);
			var textRange = new vscode.Range(0,
			firstLine.range.start.character,
			document.lineCount - 1,
			lastLine.range.end.character);
			editor.edit( edit => {
				edit.replace(textRange, newText);
			});
            // if (firstLine.text !== '42') {
            //     const edit = new vscode.WorkspaceEdit();
            //     edit.insert(document.uri, firstLine.range.start, '42\n');
            //     return vscode.workspace.applyEdit(edit)
            // }
        }
		// const { activeTextEditor } = vscode.window;
		// const { document } = activeTextEditor;

		// const fullText = document.getText();
		// const fullRange = new vscode.Range(
		// 	document.positionAt(0),
		// 	document.positionAt(fullText.length - 1)
		// )

		// let invalidRange = new Range(0, 0, textDocument.lineCount /*intentionally missing the '-1' */, 0);
		// let fullRange = textDocument.validateRange(invalidRange);
		// editor.edit(edit => edit.replace(fullRange, newText));
		
		// editor.edit(edit => {
		// 	const startPosition = new Position(0, 0);
		// 	const endPosition = vscode.TextDocument.lineAt(document.lineCount - 1).range.end;
		// 	edit.replace(new Range(startPosition, endPosition), newText);
		// });

		// var firstLine = textEdit.document.lineAt(0);
		// var lastLine = textEditor.document.lineAt(textEditor.document.lineCount - 1);
		// var textRange = new vscode.Range(0,
		// firstLine.range.start.character,
		// textEditor.document.lineCount - 1,
		// lastLine.range.end.character);

		// textEditor.edit(function (editBuilder) {
		// 	editBuilder.replace(textRange, '$1');
		// });


		// editor.edit(builder => builder.replace(textRange, newText));
		// });

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




	context.subscriptions.push(vscode.commands.registerCommand('f5-ts.info', async () => {
		const host = ext.hostStatusBar.text;
		if (host) {
			const password = await utils.getPassword(host);
			const tsInfo = await f5Api.getTsInfo(host, password);

			if ( tsInfo === undefined ) {
				throw new Error('getTsInfo failed');
			};

			utils.displayJsonInEditor(tsInfo);
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

		const password = await utils.getPassword(device);
		const dec = await f5Api.getTSDec(device, password);
		utils.displayJsonInEditor(dec.body.declaration);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-ts.postDec', async () => {

		const device = ext.hostStatusBar.text;
		var tsDecResponse = {};

		if (!device) {
			throw new Error('Connect to device first');
		}

		const password = await utils.getPassword(device);

		// if selected text, capture that, if not, capture entire document
		var editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}

		// TODO clean up following logic to look like other posts
		//		and have it only display body

		let text: string;
		if (editor.selection.isEmpty) {
			text = editor.document.getText();	// entire editor/doc window
		} else {
			text = editor.document.getText(editor.selection);	// highlighted text
		} 

		if (!utils.isValidJson(text)) {
			return vscode.window.showErrorMessage('Not valid JSON object');
		}

		const response = await f5Api.postTSDec(device, password, JSON.parse(text));

		if (ext.settings.previewResponseInUntitledDocument) {
			utils.displayJsonInEditor(response.body);
		} else {
			WebViewPanel.render(context.extensionPath, response.body);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5.getGitHubExample', async (decUrl) => {

		if(decUrl === 'tempAS3') {
			// remove once as3 examples are available
			return vscode.env.openExternal(vscode.Uri.parse('https://github.com/F5Networks/f5-appsvcs-extension/issues/280'));
		}

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

		utils.displayJsonInEditor(decCall.body);
	}));





/**
 * #########################################################################
 * 
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
		
		const password = await utils.getPassword(device);
		const resp = await f5Api.getDoDec(device, password);

		if (resp.body === []) {
			vscode.window.showInformationMessage(`No declaration detected on device`);
			return;
		} else {
			return utils.displayJsonInEditor(resp.body.declaration);
		}

	}));

	context.subscriptions.push(vscode.commands.registerCommand('f5-do.postDec', async () => {

		const device = ext.hostStatusBar.text;
		var doDecResponse = {};

		if (!device) {
			throw new Error('Connect to device first');
		}

		const password = await utils.getPassword(device);

		// if selected text, capture that, if not, capture entire document

		var editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}

		let text: string;
		if (editor.selection.isEmpty) {
			text = editor.document.getText();	// entire editor/doc window
		} else {
			text = editor.document.getText(editor.selection);	// highlighted text
		} 

		if (!utils.isValidJson(text)) {
			return vscode.window.showErrorMessage('Not valid JSON object');
		}

		const response = await f5Api.postDoDec(device, password, JSON.parse(text));
		utils.displayJsonInEditor(response.body);

	}));


	context.subscriptions.push(vscode.commands.registerCommand('f5-do.inspect', async () => {
		var device: string | undefined = ext.hostStatusBar.text;

		if (!device) {
			device = await vscode.commands.executeCommand('f5.connectDevice');
		}
		
		if (device === undefined) {
			throw new Error('no hosts in configuration');
		}
		
		const password = await utils.getPassword(device);
		const resp = await f5Api.doInspect(device, password);

		utils.displayJsonInEditor(resp.body);
	}));



	context.subscriptions.push(vscode.commands.registerCommand('f5-do.getTasks', async () => {
		var device: string | undefined = ext.hostStatusBar.text;

		if (!device) {
			device = await vscode.commands.executeCommand('f5.connectDevice');
		}
		
		if (device === undefined) {
			throw new Error('no hosts in configuration');
		}
		
		const password = await utils.getPassword(device);
		const resp = await f5Api.doTasks(device, password);

		utils.displayJsonInEditor(resp.body);
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


	// register example delarations tree
	vscode.window.registerTreeDataProvider('decExamples', new ExampleDecsProvider());


	context.subscriptions.push(vscode.commands.registerCommand('writeMemento', () => {
		// console.log('placeholder for testing commands');
		
		vscode.window.showInputBox({
			prompt: 'give me something to store!', 
		})
		.then( value => {

			if (value === undefined) {
				throw new Error('write memeto inputBox cancelled');
			}
			utils.setMementoW('key1', value);
		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('readMemento', async () => {
		// console.log('placeholder for testing commands - 2');
		
		const mento1 = utils.getMementoW('key1');
		vscode.window.showInformationMessage(`Memento! ${mento1}`);

	}));

	context.subscriptions.push(vscode.commands.registerCommand('chuckJoke', async () => {
		chuckJoke1();
	}));

}


// this method is called when your extension is deactivated
export function deactivate() {}
