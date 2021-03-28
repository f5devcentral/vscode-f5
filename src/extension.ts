/*
* Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
* license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';

import {
	window,
	StatusBarAlignment,
	commands,
	workspace,
	ExtensionContext,
	FileType,
	ProgressLocation,
	Range,
	Position,
} from 'vscode';
import jsYaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';
import * as keyTarType from 'keytar';
import * as os from 'os';

import { AS3TreeProvider } from './treeViewsProviders/as3TreeProvider';
import { ExampleDecsProvider } from './treeViewsProviders/githubDecExamples';
import { FastTemplatesTreeProvider } from './treeViewsProviders/fastTreeProvider';
import * as f5Api from './utils/f5Api';
import * as utils from './utils/utils';
import { ext, initSettings, loadSettings } from './extensionVariables';
import { FastWebView } from './editorViews/fastWebView';
import * as f5FastApi from './utils/f5FastApi';
import * as f5FastUtils from './utils/f5FastUtils';
import { deviceImportOnLoad } from './deviceImport';
import { TextDocumentView } from './editorViews/editorView';
import { injectSchema } from './atcSchema';
import devicesCore from './devicesCore';
// import rpmCore from './rpmCore';
import tclCore from './tclCore';
import { ChangeVersion } from './changeVersion';
import { Hovers } from './hovers';
import logger from './utils/logger';
import { cfgExplore } from './cfgExploreCore';
import { FastCore } from './fastCore';
import { BigiqCore } from './bigiqCore';
import { tokeTimer } from './tokeTimer';

export async function activate(context: ExtensionContext) {

	process.on('unhandledRejection', error => {
		logger.error('unhandledRejection', error);
	});

	logger.debug(`Host details: `, {
        hostOS: os.type(),
        platform: os.platform(),
        release: os.release(),
        userInfo: `${JSON.stringify(os.userInfo())}`
    });


	// initialize extension settings
	await initSettings(context);

	// load ext config to ext.settings.
	await loadSettings();

	ext.connectBar = window.createStatusBarItem(StatusBarAlignment.Left, 9);
	ext.connectBar.command = 'f5.connectDevice';
	ext.connectBar.text = 'F5 -> Connect!';
	ext.connectBar.tooltip = 'Click to connect!';
	ext.connectBar.show();

	ext.panel = new TextDocumentView();
	ext.keyTar = keyTarType;

	tokeTimer();


	// do we prefer the class style of importing core blocks?
	new ChangeVersion(context, ext.extHttp);
	
	new Hovers(context, ext.eventEmitterGlobal);

	new FastCore(context);

	new BigiqCore(context);
	
	
	// or do we prefer the function style of importing core blocks?

	// config explorer
	cfgExplore(context);

	// main devices view commands
	devicesCore(context);

	// rpm commands
	// rpmCore(context);

	// tcl view commands
	tclCore(context);


	context.subscriptions.push(commands.registerCommand('f5.openSettings', () => {
		//	open settings window and bring the user to the F5 section
		return commands.executeCommand("workbench.action.openSettings", "f5");
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
		ext.panel.render(ext.f5Client?.fast?.version);
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
		ext.as3Tree.refresh();
	}));


	context.subscriptions.push(commands.registerCommand('f5-fast.getApp', async (tenApp) => {

		await ext.f5Client?.https(`/mgmt/shared/fast/applications/${tenApp}`)
			.then(resp => ext.panel.render(resp))
			.catch(err => logger.error('get fast app failed:', err));
	}));


	context.subscriptions.push(commands.registerCommand('f5-fast.getTask', async (taskId) => {

		// const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/fast/tasks/${taskId}`);
		// ext.panel.render(resp);

		await ext.f5Client?.https(`/mgmt/shared/fast/tasks/${taskId}`)
			.then(resp => ext.panel.render(resp))
			.catch(err => logger.error('get fast task failed:', err));
	}));


	context.subscriptions.push(commands.registerCommand('f5-fast.getTemplate', async (template) => {

		// const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/fast/templates/${template}`);
		// ext.panel.render(resp);

		await ext.f5Client?.https(`/mgmt/shared/fast/templates/${template}`)
			.then(resp => ext.panel.render(resp))
			.catch(err => logger.error('get fast task failed:', err));
	}));

	context.subscriptions.push(commands.registerCommand('f5-fast.getTemplateSets', async (set) => {

		// const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/fast/templatesets/${set}`);
		// ext.panel.render(resp);

		await ext.f5Client?.https(`/mgmt/shared/fast/templatesets/${set}`)
			.then(resp => ext.panel.render(resp))
			.catch(err => logger.error('get fast task failed:', err));
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

	// context.subscriptions.push(commands.registerCommand('f5-fast.postTemplate', async (sFile) => {

	// 	let text: string | Buffer;

	// 	if (!sFile || sFile.scheme === "untitled") {
	// 		// not right click from explorer view, so gather file details

	// 		// get editor window
	// 		var editor = window.activeTextEditor;
	// 		if (!editor) {
	// 			return; // No open text editor
	// 		}

	// 		// capture selected text or all text in editor
	// 		if (editor.selection.isEmpty) {
	// 			text = editor.document.getText();	// entire editor/doc window
	// 		} else {
	// 			text = editor.document.getText(editor.selection);	// highlighted text
	// 		}
	// 	} else {
	// 		// right click from explorer view, so load file contents
	// 		const fileContents = fs.readFileSync(sFile.fsPath);
	// 		// convert from buffer to string
	// 		text = fileContents.toString('utf8');
	// 	}

	// 	await f5FastUtils.zipPostTemplate(text);

	// 	await new Promise(resolve => { setTimeout(resolve, 1000); });
	// 	fastTreeProvider.refresh();
	// }));

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
		ext.as3Tree.refresh();
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

			const resp = await ext.f5Client?.https(`/mgmt/shared/fast/templates/${item.label}`);

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
	ext.as3Tree = new AS3TreeProvider();
	window.registerTreeDataProvider('as3Tenants', ext.as3Tree);
	commands.registerCommand('f5-as3.refreshTenantsTree', () => ext.as3Tree.refresh());

	context.subscriptions.push(commands.registerCommand('f5-as3.getDecs', async (tenant) => {

		if (typeof tenant === 'object') {

			// just a regular as3 declaration object
			ext.panel.render(tenant);

		} else {

			// got a simple tenant name as string with uri parameter,
			// this is typically for extended information
			// so fetch fresh information with param
			// await ext.f5Client?.as3?.getDecs({ tenant })
			await ext.f5Client?.https(`/mgmt/shared/appsvcs/declare/${tenant}`)
				.then((resp: any) => ext.panel.render(resp.data))
				.catch(err => logger.error('get as3 tenant with param failed:', err));
		}
	}));



	context.subscriptions.push(commands.registerCommand('f5-as3.expandedTenant', async (tenant) => {
		commands.executeCommand('f5-as3.getDecs', `${tenant.label}?show=expanded`);
	}));


	context.subscriptions.push(commands.registerCommand('f5-as3.deleteTenant', async (tenant) => {

		await window.withProgress({
			location: ProgressLocation.Notification,
			// location: { viewId: 'as3Tenants'},
			title: `Deleting ${tenant.label} Tenant`
		}, async (progress) => {

			await ext.f5Client?.https(`/mgmt/shared/appsvcs/declare`, {
				method: 'POST',
				data: {
					class: 'AS3',
					declaration: {
						schemaVersion: tenant.command.arguments[0].schemaVersion,
						class: 'ADC',
						target: tenant.command.arguments[0].target,
						[tenant.label]: {
							class: 'Tenant'
						}
// 			await ext.f5Client?.as3?.deleteTenant({
// 				class: 'AS3',
// 				declaration: {
// 					schemaVersion: tenant.command.arguments[0].schemaVersion,
// 					class: 'ADC',
// 					target: tenant.command.arguments[0].target,
// 					[tenant.label]: {
// 						class: 'Tenant'
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

		ext.as3Tree.refresh();

	}));

	context.subscriptions.push(commands.registerCommand('f5-as3.getTask', (id) => {

		window.withProgress({
			location: ProgressLocation.Window,
			// location: { viewId: 'as3Tenants'},
			title: `Getting AS3 Task`
		}, async () => {

			await ext.f5Client?.as3?.getTasks(id)
				.then(resp => ext.panel.render(resp))
				.catch(err => logger.error('as3 get task failed:', err));

		});

	}));

	context.subscriptions.push(commands.registerCommand('f5-as3.postDec', async () => {

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

		await window.withProgress({
			// location: { viewId: 'as3Tenants'},
			location: ProgressLocation.Notification,
			title: `Posting AS3 Declaration`
		}, async () => {

			await ext.f5Client?.as3?.postDec(JSON.parse(text))
				.then(resp => {
					ext.panel.render(resp);
					ext.as3Tree.refresh();
				})
				.catch(err => logger.error('as3 post dec failed:', err));

		});


	}));


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
		ext.panel.render(ext.f5Client?.ts?.version);
	}));


	context.subscriptions.push(commands.registerCommand('f5-ts.getDec', async () => {
		await window.withProgress({
			location: ProgressLocation.Notification,
			title: `Getting TS Dec`
		}, async () => {

			await ext.f5Client?.https(`/mgmt/shared/telemetry/declare`)
				.then(resp => ext.panel.render(resp))
				.catch(err => logger.error('get ts declaration failed:', err));

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

			await ext.f5Client?.https(`/mgmt/shared/telemetry/declare`, {
				method: 'POST',
				data: JSON.parse(text)
			})
				.then(resp => {
					ext.panel.render(resp);
				})
				.catch(err => {
					ext.panel.render(err);
					logger.error('post ts declaration failed:', err);
				});

		});
	}));

	context.subscriptions.push(commands.registerCommand('f5.getGitHubExample', async (decUrl) => {
		await ext.extHttp.makeRequest({ url: decUrl })
			.then(resp => ext.panel.render(resp))
			.catch(err => logger.error(err));
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
			// const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/declarative-onboarding/`);
			// ext.panel.render(resp);

			await ext.f5Client?.https(`/mgmt/shared/declarative-onboarding`)
				.then(resp => ext.panel.render(resp))
				.catch(err => logger.error('get do declaration failed:', err));
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

			// const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/declarative-onboarding/inspect`);
			// ext.panel.render(resp);

			await ext.f5Client?.https(`/mgmt/shared/declarative-onboarding/inspect`)
				.then(resp => ext.panel.render(resp))
				.catch(err => logger.error('get do inspect failed:', err));

		});

	}));



	context.subscriptions.push(commands.registerCommand('f5-do.getTasks', async () => {

		await window.withProgress({
			location: ProgressLocation.Notification,
			title: `Getting DO Tasks`
		}, async () => {
			// const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/declarative-onboarding/task`);
			// ext.panel.render(resp);

			await ext.f5Client?.https(`/mgmt/shared/declarative-onboarding/task`)
				.then(resp => ext.panel.render(resp))
				.catch(err => logger.error('get do tasks failed:', err));
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
			newText = jsYaml.dump(JSON.parse(text), { indent: 4 });
		} else {
			logger.debug('converting yaml -> json');
			newText = JSON.stringify(jsYaml.load(text), undefined, 4);
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
					text = jsYaml.load(text);

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
					// return await extAPI.makeRequest(text);

					return await ext.extHttp.makeRequest(text);

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
					if (!ext.f5Client) {
						// connect to f5 if not already connected
						await commands.executeCommand('f5.connectDevice');
					}

					logger.debug('generic https f5 call -> ', text);
					return await ext.f5Client?.https(text.url, {
						method: text.method,
						data: text.body
					})
						.then(resp => resp)
						.catch(err => logger.error('Generic rest call to connected device failed:', err));
				});
			}

			if (resp) {
				ext.panel.render(resp);
			}
		}

	}));


	context.subscriptions.push(commands.registerCommand('f5.remoteCommand', async () => {

		await window.showInputBox({ placeHolder: 'Bash Command to Execute?', ignoreFocusOut: true })
		.then ( async cmd => {

			if (cmd) {

				await ext.f5Client?.https(`/mgmt/tm/util/bash`, {
					method: 'POST',
					data: {
						command: 'run',
						utilCmdArgs: `-c '${cmd}'`
					}
				})
				.then(resp => ext.panel.render(resp.data.commandResult))
				.catch(err => logger.error('bash command failed:', err));
			}
		});

	}));



	deviceImportOnLoad(context.extensionPath, ext.hostsTreeProvider);

}


// this method is called when your extension is deactivated
export function deactivate() { }
