import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * The following has an example/explaination of using onWillSaveTextDocument event
 * https://vscode.rocks/decorations/
 * 
 * This can be used to catch when the user tries to save the file 
 * 	and possiby get find the information needed to post the change back to device
 * 
 * 
 * in order to get all the functionality needed, like create and better update, gonna need a way to associate the
 * 	details in the open editor with the details on how/where the editor contents came from, like fullPath to patch
 * 	back to the same irule on the f5
 * 
 * Right now, we instert a tag into the begging on of the irule in the editor, then remove the tag as part of the patch to f5.
 * This works, but it hackey and error prone.  There are some ways I'm seeing stuff like this handled.
 * 
 * Something from a simple virtual document provider; but it seems like the content if more for static hosting
 * https://github.com/microsoft/vscode-extension-samples/blob/master/virtual-document-sample/README.md
 * 
 * to maybe a content provider:
 * https://github.com/microsoft/vscode-extension-samples/blob/master/contentprovider-sample/README.md
 * 
 * or a full blown virtual file system:
 * https://github.com/microsoft/vscode-extension-samples/blob/master/tree-view-sample/src/fileExplorer.ts
 * 
 * K11799414: Managing iRules using the iControl REST API
 * https://support.f5.com/csp/article/K11799414
 * 
 */


export class TclTreeProvider implements vscode.TreeDataProvider<TCLitem> {

	private _onDidChangeTreeData: vscode.EventEmitter<TCLitem | undefined> = new vscode.EventEmitter<TCLitem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TCLitem | undefined> = this._onDidChangeTreeData.event;

	private _iRules: string[] = [];  
	private _apps: string[] = [];  
	private _iAppTemplates: string[] = [];

	constructor() {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: TCLitem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: TCLitem) {
		let treeItems: any[] = [];
		
		// if(!this.irulesEnabled) {
		// 	return;	// should be here since this should be disabled
		// }

		if (!ext.mgmtClient) {
			// return nothing if not connected yet
			return Promise.resolve([]);
		}


		if (element) {
			
			if(element.label === 'iRules'){
                
                treeItems = this._iRules.map( (el: any) => {
                    return new TCLitem(el.fullPath, '', '', 'rule', vscode.TreeItemCollapsibleState.None, 
                        { command: 'f5-tcl.getRule', title: '', arguments: [el] });
                });
				
			} else if (element.label === 'Deployed-Apps'){
				// todo: get iapps stuff
				treeItems = this._apps.map( (el: any) => {
                    return new TCLitem(el.fullPath, '', '', 'iApp', vscode.TreeItemCollapsibleState.None, 
                        { command: 'f5-tcl.getApp', title: '', arguments: [el] });
				});
				
			} else if (element.label === 'iApp-Templates'){
				// todo: get iapp templates stuff
				treeItems = this._iAppTemplates.map( (el: any) => {
                    return new TCLitem(el.fullPath, '', '', 'iAppTemplate', vscode.TreeItemCollapsibleState.None, 
                        { command: 'f5-tcl.getTMPL', title: '', arguments: [el] });
                });
			}

		} else {

			await this.getIrules(); // refresh tenant information
			await this.getApps();	// refresh tasks information
			await this.getTemplates();	// refresh tasks information

			const ruleCount = this._iRules.length !== 0 ? this._iRules.length.toString() : '';
			const appCount = this._apps.length !== 0 ? this._apps.length.toString() : '';
			const tempCount = this._iAppTemplates.length !== 0 ? this._iAppTemplates.length.toString() : '';

			treeItems.push(
				new TCLitem('iRules', ruleCount, '', '', vscode.TreeItemCollapsibleState.Collapsed, 
					{ command: '', title: '', arguments: [''] })
			);
			treeItems.push(
				new TCLitem('Deployed-Apps', appCount, '', '', vscode.TreeItemCollapsibleState.Collapsed,
					{ command: '', title: '', arguments: [''] })
			);
			treeItems.push(
				new TCLitem('iApp-Templates', tempCount, '', '', vscode.TreeItemCollapsibleState.Collapsed,
					{ command: '', title: '', arguments: [''] })
			);
		}
        return Promise.resolve(treeItems);
	}

	/**
	 * Get all iRules to hole in "this" view class
	 */
	private async getIrules() {
        const irules: any = await ext.mgmtClient?.makeRequest(`/mgmt/tm/ltm/rule`);
        this._iRules = [];	// clear current irule list
        this._iRules = irules.data.items.map( (el: any) => el);
	}

	/**
	 * Get all deployed iApp-Apps to hold in "this" view class
	 */
	private async getApps() {
		const apps: any = await ext.mgmtClient?.makeRequest(`/mgmt/tm/sys/application/service`);
		this._apps = [];	// clear current list
		this._apps = apps.data.items.map( (el: any) => el);
	}

	/**
	 * Get all iApp Templates (expanded details) to hold in "this" view class
	 */
	private async getTemplates() {
		const templates: any = await ext.mgmtClient?.makeRequest(`/mgmt/tm/sys/application/template?expandSubcollections=true`);
		this._iAppTemplates = [];	// clear current list
		this._iAppTemplates = templates.data.items.map( (el: any) => el);
	}
	
	/**
	 * 
	 * @param item iRule item passed from view click
	 */
	async displayRule(item: any) {
		
		// append fullPath tag to irule so we know where to post the updated irule when needed
		const content = `#${item.fullPath}#\r\n` + item.apiAnonymous;

		// open editor and feed it the content
		const doc = await vscode.workspace.openTextDocument({ content: content, language: 'irule-lang' });
		// make the editor appear
		await vscode.window.showTextDocument( doc, { preview: false });
		return doc;	// return something for automated testing
	}

	async displayTMPL(item: any) {
		
		// append fullPath tag to irule so we know where to post the updated irule when needed
		// const content = `#${item.fullPath}#\r\n` + item.apiAnonymous;

		// open editor and feed it the content
		const doc = await vscode.workspace.openTextDocument({ content: item, language: 'irule-lang' });
		// make the editor appear
		await vscode.window.showTextDocument( doc, { preview: false });
		return doc;	// return something for automated testing
	}
	
	async postUpdate(item: any) {

		// get current active editor - should be the irule we just edited and are posting updates for
		if (!vscode.window.activeTextEditor) {
			return; // no editor
		}

		/**
		 * need to confirm inbound item fullPath from right click on view item
		 * matches up with the fullPath in the editor window where we are getting
		 * 	the irule guts
		 * This is provide some bumpers on this hackey solution so users shouldn't be able
		 * 	to modify the fullPath header on the irule and/or try to send the wrong irule
		 * 	back to the wrong destination
		 */

		// get document information from the active editor
		let editor = vscode.window.activeTextEditor;

		const text = editor.document.getText();	// entire editor/doc window

		// capture entire header and fullPath
		const found = text.match(/#(.*?)#/);
		let postUrl: string = '';
		let newText: string = '';
		if(found) {
			// swap out / for ~ in fullPath to not conflict with URLs
			postUrl = found[1].replace(/\//g, '~');
			// remove entire header with what was found
			newText = text.replace(found[0], '');
		}

		// make sure something didn't happen to the header and skew what we expect
		if(!postUrl || !newText) {
			console.error('no postUrl header or text for iRule update');
			return vscode.window.showErrorMessage('no postUrl header or text for iRule update');
		}

		/**
		 * now that we confirmed we have the appropriate irule header to understand where to post updates to
		 * Need to confirm the header matches the inbound item fullPath from right click on view item
		 * matches up with the fullPath in the editor window where we are getting
		 * 	the irule guts from
		 * This is provide some bumpers on this hackey solution so users shouldn't be able
		 * 	to modify the fullPath header on the irule and/or try to send the wrong irule
		 * 	back to the wrong destination
		 */

		// if(postUrl != item.fullPath?) => return with error 'irule fullPath url doesn't match view item destination'


		// patch irule to f5
		const resp: any = await ext.mgmtClient?.makeRequest('/mgmt/tm/ltm/rule/' + postUrl, {
			method: 'PATCH',
			body: {
				apiAnonymous: newText
			}
		});

		// feedback to user of what happened
		if(resp.status === 200) {
			vscode.window.showInformationMessage('iRule Post Update Successfull');
		} else {
			vscode.window.showErrorMessage(`iRule Post Update: ${resp.status}-${resp.statusText}`);
		}
		
		// return something for automated tests
		return resp.status;
	}

	// async postTemplate(item: any) {

	// 	// if available, get entire text from active editor
	// 	// command should only be called from editor under certain situations
	// 	const text = vscode.window.activeTextEditor?.document.getText();

	// 	/**
	// 	 * 1. parse template pieces
	// 	 * 		a. name from first line: sys application template /Common/A_base_iapp_1
	// 	 * 		b. html help (maybe)
	// 	 * 		c. implementation
	// 	 * 		d. presentation
	// 	 * 		e. requires-bigip-version-min
	// 	 * 		f. required modules
	// 	 * 2. post template
	// 	 */

	// 	// parse editor stuff to iapp template fields
	// 	// capture entire header and fullPath
	// 	//https://stackoverflow.com/questions/12317049/how-to-split-a-long-regular-expression-into-multiple-lines-in-javascript
	// 	const templateName = text?.match(/sys application template (.*?)\s*{/);
	// 	const templateHelp = text?.match(/html-help\s{\s*(.*?)\s*}\s*implementation\s{/s);
	// 	const templateImplementation = text?.match(/implementation\s*{\s(.*?)\s*}\s*macro\s*{/s);
	// 	const templatePresentation = text?.match(/presentation\s*{\s(.*?)\s*}\s*role-acl\s\w+\s*run-as\s\w+/s);
	// 	const templateRequiredVersion = text?.match(/requires-bigip-version-min\s([\.\d]+)/);
	// 	const templateRequiredModules = text?.match(/requires-modules\s?{\s?([\w\s]+)}/);
	// 	console.log('break');

	// 	// console.log(templateImplementation[1]);

	// 	const resp: any = await ext.mgmtClient?.makeRequest('/mgmt/tm/sys/application/template/', {
	// 		method: 'POST',
	// 		body: {
	// 			actions: [
	// 				{
	// 				htmlHelp: '-- insert html help text --',
	// 				implementation: '### insert tmsh script ###',
	// 				name: 'definition',
	// 				presentation: '### insert presentations stuff ###',
	// 				roleAcl: [
	// 					'admin',
	// 					'manager',
	// 					'resource-admin'
	// 				]
	// 				},
	// 			],
	// 			ignoreVerification: 'false',
	// 			name: 'A_test_up1',
	// 			requiresBigipVersionMin: '11.6.0',
	// 			totalSigningStatus: 'not-all-signed'
	// 		}
	// 	});
		

	// 	// return {
	// 	// 	templateName,
	// 	// 	templateHelp,
	// 	// 	templateImplementation,
	// 	// 	templatePresentation,
	// 	// 	templateRequiredVersion,
	// 	// 	templateRequiredModules
	// 	// };
	// }

	/**
	 * Gets the 'tmsh list sys application template <template_name>' output
	 * 	This seems to be the best way to get the original .tmpl format
	 * @param tempName 
	 */
	async getTMPL(tempName: any) {
		console.log('tempName', tempName);

		/**
		 * todo: clean the following lines from the tmpl so it can be uploaded
		 * 
		 *  # signing-key none
    	 *  # tmpl-checksum none
    	 *  # tmpl-signature none
    	 *  # total-signing-status not-all-signed
    	 *  # verification-status none
		 * 
		 */

		const getTMPL: any = await ext.mgmtClient?.makeRequest(`/mgmt/tm/util/bash`, {
			method: 'POST',
			body: {
				command: 'run',
				utilCmdArgs: `-c 'tmsh list sys application template ${tempName.fullPath}'`
			}
		});

		let text;
		if(getTMPL.data.commandResult) {
			// got a response, removing necessary fields for re-import
			text = getTMPL.data.commandResult;

			/**
			 * The section below removes the necessary iapp fields to allow for import
			 * 	** this option was hidden in favor of the next option (comment out)
			 */
			// text = text.replace(/partition\s(.*?)\s/, '');
			// text = text.replace(/signing-key\s(.*?)\s/, '');
			// text = text.replace(/tmpl-checksum\s(.*?)\s/, '');
			// text = text.replace(/tmpl-signature\s(.*?)\s/, '');
			// text = text.replace(/total-signing-status\s(.*?)\s/, '');
			// // fix extra whitespace at end
			// text = text.replace(/\s+}/, '}');
			
			/**
			 * Comment out meta-data to allow for re/import
			 */
			text = text.replace(/(partition\s.*?\s)/, '#$1');
			text = text.replace(/(signing-key\s.+?\s)/, '#$1');
			text = text.replace(/(tmpl-checksum\s.+?\s)/, '#$1');
			text = text.replace(/(tmpl-signature\s.+?\s)/, '#$1');
			text = text.replace(/(total-signing-status\s.+?\s)/, '#$1');
			text = text.replace(/(verification-status\s.+?\s)/, '#$1');

			return text;
		};

	}

	// async getTemplate(tempName: any) {
	// 	/**
	// 	 * get full template details from f5, and display as requested
	// 	 * - expanded = all details in raw json format
	// 	 * - tmpl = should be same expanded details, but in original .tmpl txt format
	// 	 * 		- gonna have to work all the json params back into txt
	// 	 * - implementation = just implementation portion?
	// 	 * - presentation = just presentation portion?
	// 	 * 
	// 	 */
	// 	const output = 'expanded';
	// 	console.log('output', output);
	// 	console.log('tempName', tempName);

	// 	const urlName = tempName?.label.replace(/\//g, '~');

	// 	const url = `/mgmt/tm/sys/application/template/${urlName}/actions/definition?expandSubcollections=true`;
		

	// 	if(output === 'expanded') {
	// 		const resp: any = await ext.mgmtClient?.makeRequest(url);
	// 		console.log('response', resp.data);
	// 		return resp.data;
	// 	}
	// }

	async postTMPL (template: any) {
		console.log('postTMPL: ', template);

		// assign details if coming from explorer right-click
		var filePath = template.fsPath;
		var fileName = path.basename(template.fsPath);
		var cleanUp: string | undefined;

		/**
		 * // upload .tmpl file via /mgmt/shared/file-transfer/uploads/
		 * should show up in /var/config/rest/downloads/
		 * K38306494: Importing an iApp template using the CLI
		 * - https://support.f5.com/csp/article/K38306494
		 * 		- tmsh load /sys application template <path/to/iApp/template/file>
		 * 		- tmsh save /sys config
		 * 
		 * explorering two routes to push .tmpl
		 * 1. from explorer view
		 * 		- these are templates from a file system that a user has saved (like f5 provided)
		 * 		- this just passes the filePath to upload and import the template
		 * 2. from editor view
		 * 		- this is a template that came from an F5 since it would fetched from the IRULE/IAPPS view
		 * 		- this method has to extract the template name for temp file
		 * 		- create temp file, then upload file, import template, and delete temp file
		 * template.scheme === 'file' -> came from right-click explorer
		 * 	- user needs to save any changes for them to get uploaded...
		 * template.scheme === 'untitled' -> came from right-click editor (untitled document)
		 * 
		 */


		 if(template.scheme === 'untitled') {

			// get editor text (should be iapp .tmpl)
			const text = vscode.window.activeTextEditor?.document.getText();
			const coreDir = ext.context.extensionPath;	// extension core directory
			console.log('POST iApp .tmpl via editor detected');

			if(!text) {
				console.error('no text and/or editor');
				return vscode.window.showErrorMessage('no text and/or editor');;
			}
			
			const templateName = text.match(/sys\sapplication\stemplate\s(.*?)\s*{/);
			if(templateName) {
				// regex worked, got template name from text, assigne capture group, not entire regex match
				fileName = `${templateName[1]}.tmpl`;

				if(fileName.includes('/')) {
					fileName = fileName.replace(/\//g, '~');
					console.log('iapp file name has partition -> converting to uri', fileName);
				}
				console.log('found iApp name from editor text: ', fileName);
			} else {
				// regex failed to find iapp name -> fail with messaging
				const erTxt = 'Could not find iApp template name in text - use output from "tmsh list" command or original .tmpl format';
				console.error(erTxt);
				return vscode.window.showErrorMessage(erTxt);
			}

			const dstFilePath = path.join(coreDir, fileName);

			// const tmpDir = os.tmpdir();		// look at moving temp files to this...

			// write temp iapp .tmpl file to extension core directory
			fs.writeFileSync(dstFilePath, text);
			
			// set fsPath to tempFilePath for upload
			filePath = dstFilePath;
			// set cleanUp var to delete templ file when done
			cleanUp = dstFilePath;
			console.log('write temp iapp file complete:', dstFilePath);
		 } else {
			 console.log('iApp upload from explorer view detected -> filePath:', filePath);
		 }

		// upload .tmpl file
		if(ext.mgmtClient) {
			const upload = await ext.mgmtClient.upload(filePath);
			console.log('iApp upload complete -> importing iApp via tmsh bash api', upload);
	
			const importTMPL: any = await ext.mgmtClient.makeRequest(`/mgmt/tm/util/bash`, {
				method: 'POST',
				body: {
					command: 'run',
					utilCmdArgs: `-c 'tmsh load sys application template /var/config/rest/downloads/${fileName}'`
				}
			});

			if(cleanUp) {
				console.log('deleting iApp temp file at:', cleanUp);
				fs.unlinkSync(cleanUp);
			}
			return importTMPL.data.commandResult;
		} else {
			console.error('iApp .tmpl upload: no connected device, connect to issue command');
		}
	}

	async iAppRedeploy (item: {label: string}) {
		console.log('iAppRedeploy: ', item);
		const urlName = item.label.replace(/\//g, '~');
		const resp = await ext.mgmtClient?.makeRequest(`/mgmt/tm/sys/application/service/${urlName}`, {
			method: 'PATCH',
			body: {
				'execute-action': 'definition'
			}
		});
		console.log('iAppReDeploy: resp-> ', resp);
	}

	async iAppDelete (item: {label: string}) {
		console.log('iAppDelete: ', item);
		const urlName = item.label.replace(/\//g, '~');
		const resp = await ext.mgmtClient?.makeRequest(`/mgmt/tm/sys/application/service/${urlName}`, {
			method: 'DELETE'
		});
		console.log('iAppDelete: resp-> ', resp);
	}

	async deleteTMPL (template: {label: string}) {
		console.log('deleteTMPL: ', template);
		const urlName = template.label.replace(/\//g, '~');
		const resp = await ext.mgmtClient?.makeRequest(`/mgmt/tm/sys/application/template/${urlName}`, {
			method: 'DELETE'
		});
		console.log('deleteTMPL: resp-> ', resp);
	}
}

/**
 * to save 
 */

class TCLitem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		private version: string,
		private toolTip: string,
		public context: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return this.toolTip;
	}

	get description(): string {
		return this.version;
	}

	contextValue = this.context;
}