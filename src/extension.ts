'use strict';

import { window, StatusBarAlignment, commands, workspace, ExtensionContext, ConfigurationTarget, FileType, ProgressLocation, Range, ViewColumn, Uri, TextDocument, Position } from 'vscode';
import * as jsYaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';
import * as keyTarType from 'keytar';

import { F5TreeProvider } from './treeViewsProviders/hostsTreeProvider';
import { TclTreeProvider } from './treeViewsProviders/tclTreeProvider';
import { AS3TreeProvider } from './treeViewsProviders/as3TreeProvider';
import { ExampleDecsProvider } from './treeViewsProviders/githubDecExamples';
import { FastTemplatesTreeProvider } from './treeViewsProviders/fastTreeProvider';
import { CfgProvider } from './treeViewsProviders/cfgTreeProvider';
import * as f5Api from './utils/f5Api';
import * as extAPI from './utils/externalAPIs';
import * as utils from './utils/utils';
import { ext, loadConfig } from './extensionVariables';
import { FastWebView } from './editorViews/fastWebView';
import * as f5FastApi from './utils/f5FastApi';
import * as f5FastUtils from './utils/f5FastUtils';
import * as rpmMgmt from './utils/rpmMgmt';
import { MgmtClient } from './utils/f5DeviceClient';
import logger from './utils/logger';
import { deviceImport, deviceImportOnLoad } from './deviceImport';
import { TextDocumentView } from './editorViews/editorView';
import { getMiniUcs, makeExplosion } from './cfgExplorer';
import { unInstallOldExtension } from './extMigration';
import { injectSchema } from './atcSchema';


export async function activate(context: ExtensionContext) {

	await unInstallOldExtension();

	// assign context to global name space
	ext.context = context;

	// Create a status bar items - // todo: move this to f5DeviceClient.ts
	ext.hostStatusBar = window.createStatusBarItem(StatusBarAlignment.Left, 15);
	context.subscriptions.push(ext.hostStatusBar);
	ext.hostNameBar = window.createStatusBarItem(StatusBarAlignment.Left, 14);
	context.subscriptions.push(ext.hostNameBar);
	ext.fastBar = window.createStatusBarItem(StatusBarAlignment.Left, 13);
	context.subscriptions.push(ext.fastBar);
	ext.as3Bar = window.createStatusBarItem(StatusBarAlignment.Left, 12);
	context.subscriptions.push(ext.as3Bar);
	ext.doBar = window.createStatusBarItem(StatusBarAlignment.Left, 11);
	context.subscriptions.push(ext.doBar);
	ext.tsBar = window.createStatusBarItem(StatusBarAlignment.Left, 10);
	context.subscriptions.push(ext.tsBar);


	ext.connectBar = window.createStatusBarItem(StatusBarAlignment.Left, 9);
	context.subscriptions.push(ext.connectBar);
	ext.connectBar.command = 'f5.connectDevice';
	ext.connectBar.text = 'F5 -> Connect!';
	ext.connectBar.tooltip = 'Click to connect!';
	ext.connectBar.show();

	// const webview = new HttpResponseWebview(context);
	ext.panel = new TextDocumentView();
	ext.keyTar = keyTarType;

	// load ext config to ext.settings.
	loadConfig();

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
	window.registerTreeDataProvider('f5Hosts', hostsTreeProvider);
	commands.registerCommand('f5.refreshHostsTree', () => hostsTreeProvider.refresh());

	context.subscriptions.push(commands.registerCommand('f5.connectDevice', async (device) => {

		logger.info('selected device', device);  // preferred at the moment

		if (ext.mgmtClient) {
			ext.mgmtClient.disconnect();
		}

		type devObj = {
			device: string,
			provider: string
		};

		if (!device) {
			const bigipHosts: Array<devObj> | undefined = await workspace.getConfiguration().get('f5.hosts');

			if (bigipHosts === undefined) {
				throw new Error('no hosts in configuration');
			}

			/**
			 * loop through config array of objects and build quickPick list appropriate labels
			 * [ {label: admin@192.168.1.254:8443, target: { host: 192.168.1.254, user: admin, ...}}, ...]
			 */
			const qPickHostList = bigipHosts.map(item => {
				return { label: item.device, target: item };
			});

			device = await window.showQuickPick(qPickHostList, { placeHolder: 'Select Device' });
			if (!device) {
				throw new Error('user exited device input');
			} else {
				// now that we made it through quickPick drop the label/object wrapper for list and just return device object
				device = device.target;
			}
		}

		var [user, host] = device.device.split('@');
		var [host, port] = host.split(':');

		const password: string = await utils.getPassword(device.device);

		ext.mgmtClient = new MgmtClient(device.device, {
			host,
			port,
			user,
			provider: device.provider,
			password
		});

		const connect = await ext.mgmtClient.connect();
		logger.debug(`F5 Connect Discovered ${JSON.stringify(connect)}`);
		setTimeout(() => { tclTreeProvider.refresh(); }, 300);

	}));

	context.subscriptions.push(commands.registerCommand('f5.getProvider', async () => {
		const resp: any = await ext.mgmtClient?.makeRequest('/mgmt/tm/auth/source');
		ext.panel.render(resp);
	}));


	context.subscriptions.push(commands.registerCommand('f5.getF5HostInfo', async () => {
		var device: string | undefined = ext.hostStatusBar.text;

		if (!device) {
			device = await commands.executeCommand('f5.connectDevice');
		}

		if (device === undefined) {
			throw new Error('no hosts in configuration');
		}

		const resp: any = await ext.mgmtClient?.makeRequest('/mgmt/shared/identified-devices/config/device-info');
		ext.panel.render(resp);
	}));

	context.subscriptions.push(commands.registerCommand('f5.disconnect', () => {

		if (ext.mgmtClient) {
			ext.mgmtClient.disconnect();
			ext.mgmtClient = undefined;
			// cfgProvider.clear();
		}
	}));

	context.subscriptions.push(commands.registerCommand('f5.clearPassword', async (item) => {
		return hostsTreeProvider.clearPassword(item?.label);
	}));


	context.subscriptions.push(commands.registerCommand('f5.addHost', async (newHost) => {
		return await hostsTreeProvider.addDevice(newHost);
	}));

	context.subscriptions.push(commands.registerCommand('f5.removeHost', async (hostID) => {
		return await hostsTreeProvider.removeDevice(hostID);
	}));

	context.subscriptions.push(commands.registerCommand('f5.editHost', async (hostID) => {

		logger.debug(`Edit Host command: ${JSON.stringify(hostID)}`);

		let bigipHosts: { device: string }[] | undefined = workspace.getConfiguration().get('f5.hosts');
		logger.debug(`Current bigipHosts: ${JSON.stringify(bigipHosts)}`);

		window.showInputBox({
			prompt: 'Update Device/BIG-IP/Host',
			value: hostID.label,
			ignoreFocusOut: true
		})
			.then(input => {

				logger.debug('user input', input);

				if (input === undefined || bigipHosts === undefined) {
					// throw new Error('Update device inputBox cancelled');
					logger.warn('Update device inputBox cancelled');
					return;
				}

				const deviceRex = /^[\w-.]+@[\w-.]+(:[0-9]+)?$/;
				const devicesString = JSON.stringify(bigipHosts);

				if (!devicesString.includes(`\"${input}\"`) && deviceRex.test(input)) {

					bigipHosts.forEach((item: { device: string; }) => {
						if (item.device === hostID.label) {
							item.device = input;
						}
					});

					workspace.getConfiguration().update('f5.hosts', bigipHosts, ConfigurationTarget.Global);
					setTimeout(() => { hostsTreeProvider.refresh(); }, 300);
				} else {

					window.showErrorMessage('Already exists or invalid format: <user>@<host/ip>:<port>');
				}
			});

	}));



	context.subscriptions.push(commands.registerCommand('f5.editDeviceProvider', async (hostID) => {

		let bigipHosts: { device: string }[] | undefined = workspace.getConfiguration().get('f5.hosts');

		const providerOptions: string[] = [
			'local',
			'radius',
			'tacacs',
			'tmos',
			'active-dirctory',
			'ldap',
			'apm',
			'custom for bigiq'
		];

		window.showQuickPick(providerOptions, { placeHolder: 'Default BIGIP providers' })
			.then(async input => {

				logger.debug('user input', input);

				if (input === undefined || bigipHosts === undefined) {
					// throw new Error('Update device inputBox cancelled');
					logger.warn('Update device inputBox cancelled');
					return;
				}

				if (input === 'custom for bigiq') {
					input = await window.showInputBox({
						prompt: "Input custom bigiq login provider"
					});
				}

				bigipHosts.forEach((item: { device: string; provider?: string; }) => {
					if (item.device === hostID.label) {
						item.provider = input;
					}
				});

				workspace.getConfiguration().update('f5.hosts', bigipHosts, ConfigurationTarget.Global);

				setTimeout(() => { hostsTreeProvider.refresh(); }, 300);
			});

	}));


	context.subscriptions.push(commands.registerCommand('f5.deviceImport', async (item) => {

		// get editor window
		var editor = window.activeTextEditor;
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

		await deviceImport(text);

		setTimeout(() => { hostsTreeProvider.refresh(); }, 1000);

	}));



	context.subscriptions.push(commands.registerCommand('f5.openSettings', () => {
		//	open settings window and bring the user to the F5 section
		return commands.executeCommand("workbench.action.openSettings", "f5");
	}));



	/**
	 * ###########################################################################
	 * 
	 * 				RRRRRR     PPPPPP     MM    MM 
	 * 				RR   RR    PP   PP    MMM  MMM 
	 * 				RRRRRR     PPPPPP     MM MM MM 
	 * 				RR  RR     PP         MM    MM 
	 * 				RR   RR    PP         MM    MM 
	 * 
	 * ############################################################################
	 * http://patorjk.com/software/taag/#p=display&h=0&f=Letters&t=FAST
	 */

	context.subscriptions.push(commands.registerCommand('f5.installRPM', async (selectedRPM) => {


		if (selectedRPM) {
			// set rpm path/location from oject return in explorer tree
			selectedRPM = selectedRPM.fsPath;
			logger.debug(`workspace selected rpm`, selectedRPM);
		} else {
			// pick atc/tool/version picker/downloader
			selectedRPM = await rpmMgmt.rpmPicker();
			logger.debug('downloaded rpm location', selectedRPM);
		}

		// const iRpms = await rpmMgmt.installedRPMs();
		logger.debug('selected rpm', selectedRPM);

		if (!selectedRPM) {
			debugger;
			// probably need to setup error handling for this situation
		}

		const installedRpm = await rpmMgmt.rpmInstaller(selectedRPM);
		logger.debug('installed rpm', installedRpm);
		ext.mgmtClient?.connect(); // refresh connect/status bars

	}));

	context.subscriptions.push(commands.registerCommand('f5.unInstallRPM', async (rpm) => {

		// if no rpm sent in from update command
		if (!rpm) {
			// get installed packages
			const installedRPMs = await rpmMgmt.installedRPMs();
			// have user select package
			rpm = await window.showQuickPick(installedRPMs, { placeHolder: 'select rpm to remove' });
		} else {
			// rpm came from rpm update call...
		}

		if (!rpm) {	// return error pop-up if quickPick escaped
			return window.showWarningMessage('user exited - did not select rpm to un-install');
		}

		const status = await rpmMgmt.unInstallRpm(rpm);
		window.showInformationMessage(`rpm ${rpm} removal ${status}`);
		// debugger;

		// used to pause between uninstalling and installing a new version of the same atc
		//		should probably put this somewhere else
		await new Promise(resolve => { setTimeout(resolve, 2000); });
		ext.mgmtClient?.connect(); // refresh connect/status bars

	}));



	/**
	 * ###########################################################################
	 * 
	 * 				TTTTTTT    CCCCC    LL      
		 * 				  TTT     CC    C   LL      
		 * 				  TTT     CC        LL      
		 * 				  TTT     CC    C   LL      
	 * 				  TTT      CCCCC    LLLLLLL 
	 * 
	 * ############################################################################
	 * http://patorjk.com/software/taag/#p=display&h=0&f=Letters&t=FAST
	 */


	const tclTreeProvider = new TclTreeProvider();
	window.registerTreeDataProvider('as3Tasks', tclTreeProvider);
	commands.registerCommand('f5.refreshTclTree', () => tclTreeProvider.refresh());


	// --- IRULE COMMANDS ---
	context.subscriptions.push(commands.registerCommand('f5-tcl.getRule', async (rule) => {
		return tclTreeProvider.displayRule(rule);
	}));

	context.subscriptions.push(commands.registerCommand('f5-tcl.deleteRule', async (rule) => {
		return tclTreeProvider.deleteRule(rule);
	}));





	// --- IAPP COMMANDS ---
	context.subscriptions.push(commands.registerCommand('f5-tcl.getApp', async (item) => {
		logger.debug('f5-tcl.getApp command: ', item);
		return ext.panel.render(item);
	}));


	context.subscriptions.push(commands.registerCommand('f5-tcl.getTemplate', async (item) => {
		// returns json view of iApp Template
		return ext.panel.render(item);
	}));


	context.subscriptions.push(commands.registerCommand('f5-tcl.getTMPL', async (item) => {
		// gets the original .tmpl output
		const temp = await tclTreeProvider.getTMPL(item);
		tclTreeProvider.displayTMPL(temp);
	}));

	context.subscriptions.push(commands.registerCommand('f5-tcl.iAppRedeploy', async (item) => {
		const temp = await tclTreeProvider.iAppRedeploy(item);
		/**
		 * setup appropriate response
		 * - if no error - nothing
		 * - if error, editor/pop-up to show error
		 */
		// return utils.displayJsonInEditor(item);
	}));

	context.subscriptions.push(commands.registerCommand('f5-tcl.iAppDelete', async (item) => {
		const temp = await tclTreeProvider.iAppDelete(item);
		tclTreeProvider.refresh();
	}));

	context.subscriptions.push(commands.registerCommand('f5-tcl.postTMPL', async (item) => {
		const resp: any = await tclTreeProvider.postTMPL(item);
		window.showInformationMessage(resp);
		return resp;
	}));

	context.subscriptions.push(commands.registerCommand('f5-tcl.deleteTMPL', async (item) => {
		const resp: any = await tclTreeProvider.deleteTMPL(item);
		return resp;
	}));

	context.subscriptions.push(commands.registerCommand('f5-tcl.mergeTCL', async (item) => {
		await tclTreeProvider.mergeTCL(item);
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
	const fastTreeProvider = new FastTemplatesTreeProvider();
	window.registerTreeDataProvider('fastView', fastTreeProvider);
	commands.registerCommand('f5-fast.refreshTemplates', () => fastTreeProvider.refresh());

	context.subscriptions.push(commands.registerCommand('f5-fast.getInfo', async () => {

		const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/fast/info`);
		ext.panel.render(resp);
	}));

	context.subscriptions.push(commands.registerCommand('f5-fast.deployApp', async () => {

		// get editor window
		var editor = window.activeTextEditor;
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
		if (utils.isValidJson(text)) {
			jsonText = JSON.parse(text);
		} else {
			window.showWarningMessage(`Not valid json object`);
			return;
		}

		const resp = await f5FastApi.deployFastApp(jsonText);

		ext.panel.render(resp);

		// give a little time to finish before refreshing trees
		await new Promise(resolve => { setTimeout(resolve, 3000); });
		fastTreeProvider.refresh();
		as3Tree.refresh();
	}));


	context.subscriptions.push(commands.registerCommand('f5-fast.getApp', async (tenApp) => {

		const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/fast/applications/${tenApp}`);
		ext.panel.render(resp);
	}));


	context.subscriptions.push(commands.registerCommand('f5-fast.getTask', async (taskId) => {

		const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/fast/tasks/${taskId}`);
		ext.panel.render(resp);
	}));


	context.subscriptions.push(commands.registerCommand('f5-fast.getTemplate', async (template) => {

		const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/fast/templates/${template}`);
		ext.panel.render(resp);
	}));

	context.subscriptions.push(commands.registerCommand('f5-fast.getTemplateSets', async (set) => {

		const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/fast/templatesets/${set}`);
		ext.panel.render(resp);
	}));


	context.subscriptions.push(commands.registerCommand('f5-fast.convJson2Mst', async () => {

		// get editor window
		var editor = window.activeTextEditor;
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

		logger.debug(JSON.stringify(text));

		if (utils.isValidJson(text)) {

			//TODO:  parse object and find the level for just ADC,
			//		need to remove all the AS3 details since fast will handle that
			// - if it's an object and it contains "class" key and value should be "Tenant"
			utils.displayMstInEditor(JSON.parse(text));
		} else {
			window.showWarningMessage(`not valid json object`);
		}


	}));

	context.subscriptions.push(commands.registerCommand('f5-fast.postTemplate', async (sFile) => {

		let text: string | Buffer;

		if (!sFile) {
			// not right click from explorer view, so gather file details

			// get editor window
			var editor = window.activeTextEditor;
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

	context.subscriptions.push(commands.registerCommand('f5-fast.postTemplateSet', async (sPath) => {

		logger.debug('postTemplateSet selection', sPath);
		let wkspPath;
		let selectedFolder;

		if (!sPath) {
			// didn't get a path passed in from right click, so we have to gather necessary details

			// get list of open workspaces
			const workspaces = workspace.workspaceFolders;
			logger.debug('workspaces', workspaces);

			// if no open workspace...
			if (!workspaces) {
				// Show message to select workspace
				await window.showInformationMessage('See top bar to open a workspace with Fast Templates first');
				// pop up to selecte a workspace
				await window.showWorkspaceFolderPick();
				// return to begining of function to try again
				return commands.executeCommand('f5-fast.postTemplateSet');
			}

			const folder1 = workspace.workspaceFolders![0]!.uri;
			wkspPath = folder1.fsPath;
			const folder2 = await workspace.fs.readDirectory(folder1);

			logger.debug('workspace name', workspace.name);

			/**
			 * having problems typing the workspaces to a list for quick pick
			 * todo: get the following working
			 */
			// let wkspc;
			// if (workspaces.length > 1) {
			// 	// if more than one workspace open, have user select the workspace
			// 	wkspc = await window.showQuickPick(workspaces);
			// } else {
			// 	// else select the first workspace
			// 	wkspc = workspaces[0];
			// }

			let wFolders = [];
			for (const [name, type] of await workspace.fs.readDirectory(folder1)) {

				if (type === FileType.Directory) {
					logger.debug('---directory', name);
					wFolders.push(name);
				}
			};

			// have user select first level folder in workspace
			selectedFolder = await window.showQuickPick(wFolders);

			if (!selectedFolder) {
				// if user "escaped" folder selection window
				return window.showInformationMessage('Must select a Fast Template Set folder');
			}
			logger.debug('workspace path', wkspPath);
			logger.debug('workspace folder', selectedFolder);
			selectedFolder = path.join(wkspPath, selectedFolder);

		} else {
			logger.debug('caught selected path');
			selectedFolder = sPath.fsPath;
		}

		await f5FastUtils.zipPostTempSet(selectedFolder);

		await new Promise(resolve => { setTimeout(resolve, 3000); });
		fastTreeProvider.refresh();
	}));

	context.subscriptions.push(commands.registerCommand('f5-fast.deleteFastApp', async (tenApp) => {

		// var device: string | undefined = ext.hostStatusBar.text;
		// const password = await utils.getPassword(device);
		const resp = await f5FastApi.delTenApp(tenApp.label);
		ext.panel.render(resp);

		// give a little time to finish
		await new Promise(resolve => { setTimeout(resolve, 2000); });
		fastTreeProvider.refresh();
		as3Tree.refresh();
	}));


	context.subscriptions.push(commands.registerCommand('f5-fast.deleteFastTempSet', async (tempSet) => {

		const resp = await f5FastApi.delTempSet(tempSet.label);

		window.showInformationMessage(`Fast Template Set Delete: ${resp.data.message}`);

		// give a little time to finish
		await new Promise(resolve => { setTimeout(resolve, 1000); });
		fastTreeProvider.refresh();
	}));



	const fastPanel = new FastWebView();
	context.subscriptions.push(commands.registerCommand('f5-fast.renderHtmlPreview', async (item) => {

		let text: string = 'empty';
		let title: string = 'Fast Template';

		if (item?.hasOwnProperty('scheme') && item?.scheme === 'file') {
			// right click from explorer view initiation, so load file contents
			const fileContents = fs.readFileSync(item.fsPath);
			// convert from buffer to string
			text = fileContents.toString('utf8');
			// set webPanel name to filename
			title = path.parse(item.fsPath).name;

		} else if (item?.hasOwnProperty('label')) {
			// right click on template from fast view when connected to device
			// - ex.  label: 'goodFastTemplates/app4'

			const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/fast/templates/${item.label}`);

			if (resp?.data?.sourceText) {
				text = resp?.data?.sourceText;
			} else {
				// alert that we didn't get the response we were looking for
				logger.error('f5-fast.renderHtmlPreview command tried to get template details from connected device, but did not get the source text we were looking for');
			}


		} else {
			// right-click or commandpalette initiation, so get editor text
			var editor = window.activeTextEditor;
			if (editor) {
				if (editor?.selection?.isEmpty) {
					text = editor.document.getText();	// entire editor/doc window
				} else {
					text = editor.document.getText(editor.selection);	// highlighted text
				}
			}
		}
		fastPanel.render(text);

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
	const as3Tree = new AS3TreeProvider();
	window.registerTreeDataProvider('as3Tenants', as3Tree);
	commands.registerCommand('f5-as3.refreshTenantsTree', () => as3Tree.refresh());

	context.subscriptions.push(commands.registerCommand('f5-as3.getDecs', async (tenant) => {

		// set blank value if not defined -> get all tenants dec
		// tenant = tenant ? tenant : '';

		// console.log(tenant.test('?'));

		// bigiq target single tenant 
		if (tenant?.dec && tenant?.label && tenant.id) {

			// rebuild the target tenant declaration so it can be resent if needed
			ext.panel.render({
				class: 'ADC',
				target: tenant.target,
				schemaVersion: tenant.schemaVersion,
				id: tenant.id,
				[tenant.label]: tenant.dec
			});

		} else if (typeof tenant === 'object') {

			// just a regular as3 declaration object
			ext.panel.render(tenant);

		} else {

			// got a simple tenant name as string with uri parameter,
			// this is typically for extended information
			// so fetch fresh information with param
			// await ext.f5Client?.as3?.getDecs({ tenant })
			await ext.mgmtClient?.makeRequest(`/mgmt/shared/appsvcs/declare/${tenant}`)
				.then((resp: any) => ext.panel.render(resp.data))
				.catch(err => logger.error('get as3 tenant with param failed:', err));
		}
	}));


	// context.subscriptions.push(commands.registerCommand('f5-as3.fullTenant', async (tenant) => {
	// 	commands.executeCommand('f5-as3.getDecs', `${tenant.label}?show=full`);
	// }));
	context.subscriptions.push(commands.registerCommand('f5-as3.expandedTenant', async (tenant) => {
		commands.executeCommand('f5-as3.getDecs', `${tenant.label}?show=expanded`);
	}));


	context.subscriptions.push(commands.registerCommand('f5-as3.deleteTenant', async (tenant) => {

		await window.withProgress({
			location: ProgressLocation.Notification,
			// location: { viewId: 'as3Tenants'},
			title: `Deleting ${tenant.label} Tenant`
		}, async (progress) => {

			await ext.mgmtClient?.makeRequest(`/mgmt/shared/appsvcs/declare`, {
				method: 'POST',
				body: {
					class: 'AS3',
					declaration: {
						schemaVersion: tenant.command.arguments[0].schemaVersion,
						class: 'ADC',
						target: tenant.command.arguments[0].target,
						[tenant.label]: {
							class: 'Tenant'
						}
					}
				}
			})
				// await ext.f5Client?.https(`/mgmt/shared/appsvcs/declare`, {
				// 	method: 'POST',
				// 	data: {
				// 		class: 'AS3',
				// 		declaration: {
				// 			schemaVersion: tenant.command.arguments[0].schemaVersion,
				// 			class: 'ADC',
				// 			target: tenant.command.arguments[0].target,
				// 			[tenant.label]: {
				// 				class: 'Tenant'
				// 			}
				// 		}
				// 	}
				// })
				.then((resp: any) => {
					const resp2 = resp.data.results[0];
					progress.report({ message: `${resp2.code} - ${resp2.message}` });

				})
				.catch(err => {
					progress.report({ message: `${err.message}` });
					// might need to adjust logging depending on the error, but this works for now, or at least the main HTTP responses...
					logger.error('as3 delete tenant failed with:', {
						respStatus: err.response.status,
						respText: err.response.statusText,
						errMessage: err.message,
						errRespData: err.response.data
					});
				});

			// hold the status box for user and let things finish before refresh
			await new Promise(resolve => { setTimeout(resolve, 5000); });
		});

		as3Tree.refresh();
	}));

	context.subscriptions.push(commands.registerCommand('f5-as3.getTask', (id) => {

		return window.withProgress({
			location: ProgressLocation.Notification,
			title: `Getting AS3 Task`
		}, async () => {

			return await ext.mgmtClient?.makeRequest(`/mgmt/shared/appsvcs/task/${id}`)
			// await ext.f5Client?.as3?.getTasks(id)
			.then(resp => ext.panel.render(resp))
			.catch(err => logger.error('as3 get task failed:', err));
		});

	}));

	context.subscriptions.push(commands.registerCommand('f5-as3.postDec', async () => {

		ext.as3AsyncPost = workspace.getConfiguration().get('f5.as3Post.async');

		let postParam;
		if (ext.as3AsyncPost) {
			postParam = 'async=true';
		} else {
			postParam = undefined;
		}

		var editor = window.activeTextEditor;
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
			return window.showErrorMessage('Not valid JSON object');
		}

		const resp = await f5Api.postAS3Dec(postParam, JSON.parse(text));
		ext.panel.render(resp);
		as3Tree.refresh();
	}));


	/**
	 * experimental - this feature is intented to grab the current json object declaration in the editor,
	 * 		try to figure out if it's as3/do/ts, then apply the appropriate schema reference in the object
	 * 	if it detects the schema already there, it will remove it.
	 */
	context.subscriptions.push(commands.registerCommand('f5.injectSchemaRef', async () => {

		// Get the active text editor
		const editor = window.activeTextEditor;

		if (editor) {
			let text: string;
			const document = editor.document;

			// capture selected text or all text in editor
			if (editor.selection.isEmpty) {
				text = editor.document.getText();	// entire editor/doc window
			} else {
				text = editor.document.getText(editor.selection);	// highlighted text
			}

			const [newText, validDec] = await injectSchema(text);

			// check if modification worked
			if (newText && validDec) {
				editor.edit(edit => {
					const startPosition = new Position(0, 0);
					const endPosition = document.lineAt(document.lineCount - 1).range.end;
					edit.replace(new Range(startPosition, endPosition), JSON.stringify(newText, undefined, 4));
				});
			} else if (newText) {
				editor.edit(edit => {
					const startPosition = new Position(0, 0);
					const endPosition = document.lineAt(document.lineCount - 1).range.end;
					edit.replace(new Range(startPosition, endPosition), newText);
				});
			} else {
				logger.warn('ATC schema inject failed');
			}
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




	context.subscriptions.push(commands.registerCommand('f5-ts.info', async () => {
		const resp: any = await ext.mgmtClient?.makeRequest('/mgmt/shared/telemetry/info');
		ext.panel.render(resp);
	}));


	context.subscriptions.push(commands.registerCommand('f5-ts.getDec', async () => {
		await window.withProgress({
			location: ProgressLocation.Notification,
			title: `Getting TS Dec`
		}, async () => {
			const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/telemetry/declare`);
			ext.panel.render(resp);
		});
	}));

	context.subscriptions.push(commands.registerCommand('f5-ts.postDec', async () => {

		// if selected text, capture that, if not, capture entire document
		var editor = window.activeTextEditor;
		let text: string;
		if (editor) {
			if (editor.selection.isEmpty) {
				text = editor.document.getText();	// entire editor/doc window
			} else {
				text = editor.document.getText(editor.selection);	// highlighted text
			}

			if (!utils.isValidJson(text)) {
				return window.showErrorMessage('Not valid JSON object');
			}
		}

		const progress = await window.withProgress({
			location: ProgressLocation.Notification,
			title: `Posting TS Dec`
		}, async () => {
			const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/telemetry/declare`, {
				method: 'POST',
				body: JSON.parse(text)
			});
			ext.panel.render(resp);
		});
	}));

	context.subscriptions.push(commands.registerCommand('f5.getGitHubExample', async (decUrl) => {

		const resp = await extAPI.makeRequest({ url: decUrl });
		return ext.panel.render(resp);
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

	context.subscriptions.push(commands.registerCommand('f5-do.getDec', async () => {

		await window.withProgress({
			location: ProgressLocation.Notification,
			title: `Getting DO Dec`
		}, async () => {
			const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/declarative-onboarding/`);
			ext.panel.render(resp);
		});


	}));

	context.subscriptions.push(commands.registerCommand('f5-do.postDec', async () => {

		var editor = window.activeTextEditor;
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
			return window.showErrorMessage('Not valid JSON object');
		}

		const resp = await f5Api.postDoDec(JSON.parse(text));
		ext.panel.render(resp);
	}));


	context.subscriptions.push(commands.registerCommand('f5-do.inspect', async () => {

		await window.withProgress({
			location: ProgressLocation.Notification,
			title: `Getting DO Inspect`
		}, async () => {
			const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/declarative-onboarding/inspect`);
			ext.panel.render(resp);
		});

	}));



	context.subscriptions.push(commands.registerCommand('f5-do.getTasks', async () => {

		await window.withProgress({
			location: ProgressLocation.Notification,
			title: `Getting DO Tasks`
		}, async () => {
			const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/declarative-onboarding/task`);
			ext.panel.render(resp);
		});
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
	window.registerTreeDataProvider('decExamples', new ExampleDecsProvider());


	// /**
	//  * 
	//  * 
	//  * ###################################################################
	//  * ###################################################################
	//  * ###################################################################
	//  * ###################################################################
	//  * ###################################################################
	//  * 
	//  * 
	//  */

	const cfgProvider = new CfgProvider();
	// const cfgView = window.registerTreeDataProvider('cfgTree', cfgProvider);
	const cfgView = window.createTreeView('cfgTree', { treeDataProvider: cfgProvider, showCollapseAll: true, canSelectMany: true });

	context.subscriptions.push(commands.registerCommand('f5.cfgExploreOnConnect', async (item) => {

		/**
		 * now to ready the archive contents and feed to corkscrew...
		 * 
		 * https://stackoverflow.com/questions/39705209/node-js-read-a-file-in-a-zip-without-unzipping-it
		 * 
		 * Thinking this is all best to handle in corkscrew so it can handle
		 * 	any file type we specify, bigip.conf as string, bigip.conf as single file,
		 * 	UCS arcive, qkview, or our special little archive from above
		 * 
		 */

		if (!ext.mgmtClient) {
			/**
			 * loop this back into the connect flow, since we have the device, automatically connect
			 *  - this should probably happen in the main extension.ts
			 */
			// await commands.executeCommand('f5.connectDevice', item.label);
			return window.showWarningMessage('Connect to BIGIP Device first');
		}

		const file = await getMiniUcs();
		let expl: any = undefined;

		if (file) {
			logger.debug('Got mini_ucs -> extracting config with corkscrew');

			expl = await makeExplosion(file);

			if (expl) {
				await cfgProvider.explodeConfig(expl.config, expl.obj, expl.explosion);
			}

			logger.debug('Deleting mini_ucs file at', file);

			try {
				// wait  couple seconds before we try to delete the mini_ucs
				setTimeout(() => { fs.unlinkSync(file); }, 2000);
			} catch (e) {
				logger.error('Not able to delete mini_ucs at:', file);
			}
		} else {
			logger.error('Failed to retrieve mini_ucs for configuration exploration');
		}




	}));

	/**
	 * this command is exposed via right click in editor so user does not have to connect to F5
	 */
	context.subscriptions.push(commands.registerCommand('f5.cfgExplore', async (item) => {

		let expl;
		if (item._fsPath) {
			// I think this is the better way for windows?
			logger.debug('f5.cfgExplore got _fsPath:', item._fsPath);
			expl = await makeExplosion(item._fsPath);
		} else if (item.path) {
			// only path is seen when working in wsl2
			logger.debug('f5.cfgExplore got path:', item.path);
			expl = await makeExplosion(item.path);
		} else {
			return logger.error('f5.cfgExplore -> Neither path supplied was valid', JSON.stringify(item));
		}

		if (expl) {
			cfgProvider.explodeConfig(expl.config, expl.obj, expl.explosion);
			// starting to setup the ability to have the view come into focus when excuted
			// I believe this will require enabling experimental features, so I'm tabling
			// 	for now
			// cfgView.reveal('Apps', { focus: true, select: false, expand: true } );

			// // cfgView.title = 'yay!!!';
			// cfgView.description = 'descrrrrr';
			// cfgView.message = 'messsg';
			// cfgView.selection;
			// cfgView.visible
		}

	}));

	context.subscriptions.push(commands.registerCommand('f5.cfgExploreClear', async (text) => {
		cfgProvider.clear();
	}));

	context.subscriptions.push(commands.registerCommand('f5.cfgExploreRefresh', async (text) => {
		cfgProvider.refresh();
	}));

	context.subscriptions.push(commands.registerCommand('f5.cfgExplore-show', async (text) => {
		const x = cfgView.selection;
		let full: string[] = [];
		// let text2;
		if (Array.isArray(x) && x.length > 1) {
			// got multi-select array, push all necessary details to a single object

			x.forEach((el) => {
				const y = el.command?.arguments;
				if (y) {
					full.push(y[0].join('\n'));
					full.push('\n\n#############################################\n\n');
				}
			});
			text = full;

			// } else if (Array.isArray(x) && x.length === 1) {
			// 	return window.showWarningMessage('Select multiple apps with "Control" key');
		} else if (typeof text === 'string') {
			// just text, convert to single array with render
			text = [text];
		}

		// todo: add logic to catch single right click

		cfgProvider.render(text);
	}));


	// /**
	//  * 
	//  * 
	//  * ###################################################################
	//  * ###################################################################
	//  * ###################################################################
	//  * ###################################################################
	//  * ###################################################################
	//  * 
	//  * 
	//  */

	context.subscriptions.push(commands.registerCommand('f5.jsonYmlConvert', async () => {
		const editor = window.activeTextEditor;
		if (!editor) {
			return;
		}
		const selection = editor.selection;
		const text = editor.document.getText(editor.selection);	// highlighted text


		let newText: string;
		if (utils.isValidJson(text)) {
			logger.debug('converting json -> yaml');
			// since it was valid json -> dump it to yaml
			newText = jsYaml.safeDump(JSON.parse(text), { indent: 4 });
		} else {
			logger.debug('converting yaml -> json');
			newText = JSON.stringify(jsYaml.safeLoad(text), undefined, 4);
		}

		editor.edit(editBuilder => {
			editBuilder.replace(selection, newText);
		});
	}));

	/**
	 * refactor the json<->yaml/base64-encode/decode stuff to follow the following logic
	 * based off of the vscode-extension-examples document-editing-sample
	 */
	// let disposable = commands.registerCommand('extension.reverseWord', function () {
	// 	// Get the active text editor
	// 	let editor = window.activeTextEditor;

	// 	if (editor) {
	// 		let document = editor.document;
	// 		let selection = editor.selection;

	// 		// Get the word within the selection
	// 		let word = document.getText(selection);
	// 		let reversed = word.split('').reverse().join('');
	// 		editor.edit(editBuilder => {
	// 			editBuilder.replace(selection, reversed);
	// 		});
	// 	}
	// });

	context.subscriptions.push(commands.registerCommand('f5.b64Encode', () => {
		const editor = window.activeTextEditor;
		if (!editor) {
			return;
		}
		const text = editor.document.getText(editor.selection);	// highlighted text
		const encoded = Buffer.from(text).toString('base64');
		editor.edit(editBuilder => {
			editBuilder.replace(editor.selection, encoded);
		});
	}));


	context.subscriptions.push(commands.registerCommand('f5.b64Decode', () => {
		const editor = window.activeTextEditor;
		if (!editor) {
			return;
		}
		const text = editor.document.getText(editor.selection);	// highlighted text
		const decoded = Buffer.from(text, 'base64').toString('ascii');
		editor.edit(editBuilder => {
			editBuilder.replace(editor.selection, decoded);
		});
	}));


	context.subscriptions.push(commands.registerCommand('f5.makeRequest', async () => {
		/**
		 * make open/raw https call
		 * 
		 */

		logger.debug('executing f5.makeRequest');
		const editor = window.activeTextEditor;
		let resp;

		if (editor) {
			var text: any = editor.document.getText(editor.selection);	// highlighted text

			// see if it's json or yaml or string
			if (utils.isValidJson(text)) {

				logger.debug('JSON detected -> parsing');
				text = JSON.parse(text);

			} else {

				logger.debug('NOT JSON');

				if (text.includes('url:')) {
					// if yaml should have url: param
					logger.debug('yaml with url: param -> parsing raw to JSON', JSON.stringify(text));
					text = jsYaml.safeLoad(text);

				} else {
					// not yaml
					logger.debug('http with OUT url param -> converting to json');
					// trim line breaks
					text = text.replace(/(\r\n|\n|\r)/gm, "");
					text = { url: text };
				}
			}

			/**
			 * At this point we should have a json object with parameters
			 * 	depending on the parameters, it's an F5 call, or an external call
			 */

			if (text.url.includes('http')) {

				resp = await window.withProgress({
					location: ProgressLocation.Notification,
					title: `Making External API Request`,
					cancellable: true
				}, async (progress, token) => {
					token.onCancellationRequested(() => {
						// this logs but doesn't actually cancel...
						logger.debug("User canceled External API Request");
						return new Error(`User canceled External API Request`);
					});

					//external call
					logger.debug('external call -> ', JSON.stringify(text));
					return await extAPI.makeRequest(text);
				});

			} else {

				resp = await window.withProgress({
					location: ProgressLocation.Notification,
					title: `Making API Request`,
					cancellable: true
				}, async (progress, token) => {
					token.onCancellationRequested(() => {
						// this logs but doesn't actually cancel...
						logger.debug("User canceled API Request");
						return new Error(`User canceled API Request`);
					});

					// f5 device call
					if (!ext.mgmtClient) {
						// connect to f5 if not already connected
						await commands.executeCommand('f5.connectDevice');
					}

					logger.debug('device call -> ', JSON.stringify(text));
					return await ext.mgmtClient?.makeRequest(text.url, {
						method: text.method,
						body: text.body
					});
				});
			}

			if (resp) {
				ext.panel.render(resp);
			}
		}

	}));


	context.subscriptions.push(commands.registerCommand('f5.remoteCommand', async () => {

		const cmd = await window.showInputBox({ placeHolder: 'Bash Command to Execute?', ignoreFocusOut: true });

		if (cmd === undefined) {
			// maybe just showInformationMessage and exit instead of error?
			throw new Error('Remote Command inputBox cancelled');
		}

		const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/tm/util/bash`, {
			method: 'POST',
			body: {
				command: 'run',
				utilCmdArgs: `-c '${cmd}'`
			}
		});

		ext.panel.render(resp.data.commandResult);
	}));



	context.subscriptions.push(commands.registerCommand('chuckJoke', async () => {


		const newEditorColumn = ext.settings.previewColumn;
		const wndw = window.visibleTextEditors;
		let viewColumn: ViewColumn | undefined;

		wndw.forEach(el => {
			// const el1 = element;
			if (el.document.fileName === 'chuck-joke.json') {
				//logger.debug('f5-fast.json editor column', el1.viewColumn);
				viewColumn = el.viewColumn;
			}
		});


		const resp: any = await extAPI.makeRequest({ url: 'https://api.chucknorris.io/jokes/random' });
		// let activeColumn = window.activeTextEditor?.viewColumn;

		logger.debug('chuck-joke->resp.data', resp.data);

		const content = JSON.stringify(resp.data, undefined, 4);

		// if vClm has a value assign it, else set column 1
		viewColumn = viewColumn ? viewColumn : newEditorColumn;

		var vDoc: Uri = Uri.parse("untitled:" + "chuck-Joke.json");
		workspace.openTextDocument(vDoc)
			.then((a: TextDocument) => {
				window.showTextDocument(a, viewColumn, false).then(e => {
					e.edit(edit => {
						const startPosition = new Position(0, 0);
						const endPosition = a.lineAt(a.lineCount - 1).range.end;
						edit.replace(new Range(startPosition, endPosition), content);
					});
				});
			});


		// chuckJoke1();

	}));

	deviceImportOnLoad(context.extensionPath, hostsTreeProvider);
	// setTimeout( () => { hostsTreeProvider.refresh();}, 1000);

}


// this method is called when your extension is deactivated
export function deactivate() { }
