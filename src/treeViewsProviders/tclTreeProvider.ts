import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import * as path from 'path';


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
                        { command: 'f5.getRule', title: '', arguments: [el] });
                });
				
			} else if (element.label === 'Deployed-Apps'){
				// todo: get iapps stuff
				treeItems = this._apps.map( (el: any) => {
                    return new TCLitem(el.fullPath, '', '', 'iApp', vscode.TreeItemCollapsibleState.None, 
                        { command: 'f5.getApp', title: '', arguments: [el] });
				});
				
			} else if (element.label === 'iApp-Templates'){
				// todo: get iapp templates stuff
				treeItems = this._iAppTemplates.map( (el: any) => {
                    return new TCLitem(el.fullPath, '', '', 'iAppTemplate', vscode.TreeItemCollapsibleState.None, 
                        { command: 'f5.viewTMPL', title: '', arguments: [el] });
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

	private async getIrules() {
        const irules: any = await ext.mgmtClient?.makeRequest(`/mgmt/tm/ltm/rule`);
        
        this._iRules = [];	// clear current irule list
        this._iRules = irules.data.items.map( (el: any) => el);

	}

	private async getApps() {
		/**
		 * todo: fill in deployed iApps stuff
		 */
		const apps: any = await ext.mgmtClient?.makeRequest(`/mgmt/tm/sys/application/service`);
		this._apps = [];	// clear current list
		this._apps = apps.data.items.map( (el: any) => el);
	}

	private async getTemplates() {
		/**
		 * todo: fill in iApp templates stuff
		 */
		const templates: any = await ext.mgmtClient?.makeRequest(`/mgmt/tm/sys/application/template?expandSubcollections=true`);
		this._iAppTemplates = [];	// clear current list
		this._iAppTemplates = templates.data.items.map( (el: any) => el);
	}
	
	async displayRule(item: any) {
		
		// append fullPath tag to irule so we know where to post the updated irule when needed
		const content = `#${item.fullPath}#\r\n` + item.apiAnonymous;

		// open editor and feed it the content
		const doc = await vscode.workspace.openTextDocument({ content: content, language: 'irule-lang' });
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

	async postTemplate(item: any) {

		// if available, get entire text from active editor
		// command should only be called from editor under certain situations
		const text = vscode.window.activeTextEditor?.document.getText();

		/**
		 * 1. parse template pieces
		 * 		a. name from first line: sys application template /Common/A_base_iapp_1
		 * 		b. html help (maybe)
		 * 		c. implementation
		 * 		d. presentation
		 * 		e. requires-bigip-version-min
		 * 		f. required modules
		 * 2. post template
		 */

		// parse editor stuff to iapp template fields
		// capture entire header and fullPath
		//https://stackoverflow.com/questions/12317049/how-to-split-a-long-regular-expression-into-multiple-lines-in-javascript
		const templateName = text?.match(/sys application template (.*?)\s*{/);
		const templateHelp = text?.match(/html-help\s{\s*(.*?)\s*}\s*implementation\s{/s);
		const templateImplementation = text?.match(/implementation\s*{\s(.*?)\s*}\s*macro\s*{/s);
		const templatePresentation = text?.match(/presentation\s*{\s(.*?)\s*}\s*role-acl\s\w+\s*run-as\s\w+/s);
		const templateRequiredVersion = text?.match(/requires-bigip-version-min\s([\.\d]+)/);
		const templateRequiredModules = text?.match(/requires-modules\s?{\s?([\w\s]+)}/);
		console.log('break');

		// console.log(templateImplementation[1]);

		const resp: any = await ext.mgmtClient?.makeRequest('/mgmt/tm/sys/application/template/', {
			method: 'POST',
			body: {
				actions: [
					{
					htmlHelp: '-- insert html help text --',
					implementation: '### insert tmsh script ###',
					name: 'definition',
					presentation: '### insert presentations stuff ###',
					roleAcl: [
						'admin',
						'manager',
						'resource-admin'
					]
					},
				],
				ignoreVerification: 'false',
				name: 'A_test_up1',
				requiresBigipVersionMin: '11.6.0',
				totalSigningStatus: 'not-all-signed'
			}
		});
		

		// return {
		// 	templateName,
		// 	templateHelp,
		// 	templateImplementation,
		// 	templatePresentation,
		// 	templateRequiredVersion,
		// 	templateRequiredModules
		// };
	}

	async getTemplateJSON(tempName: any) {
		/**
		 * get full template details from f5, and display as requested
		 * - expanded = all details in raw json format
		 * - tmpl = should be same expanded details, but in original .tmpl txt format
		 * 		- gonna have to work all the json params back into txt
		 * - implementation = just implementation portion?
		 * - presentation = just presentation portion?
		 * 
		 */
		const output = 'expanded';
		console.log('output', output);
		console.log('tempName', tempName);

		const urlName = tempName?.label.replace(/\//g, '~');

		const url = `/mgmt/tm/sys/application/template/${urlName}/actions/definition?expandSubcollections=true`;
		

		if(output === 'expanded') {
			const resp: any = await ext.mgmtClient?.makeRequest(url);
			console.log('response', resp.data);
			return resp.data;
		}
	}

	async getTMPL(tempName: any) {
		/**
		 * get full template details from f5, and display as requested
		 * - expanded = all details in raw json format
		 * - tmpl = should be same expanded details, but in original .tmpl txt format
		 * 		- gonna have to work all the json params back into txt
		 * - implementation = just implementation portion?
		 * - presentation = just presentation portion?
		 * 
		 */
		const output = 'expanded';
		console.log('output', output);
		console.log('tempName', tempName);

		const urlName = tempName?.label.replace(/\//g, '~');

		const url = `/mgmt/tm/sys/application/template/${urlName}/actions/definition?expandSubcollections=true`;
		

		if(output === 'expanded') {
			const resp: any = await ext.mgmtClient?.makeRequest(url);
			console.log('response', resp.data);
			return resp.data;
		}
	}

	async postTMPL (template: any) {
		console.log('postTMPL: ', template);

		// const fileP = vscode.Uri.parse(template.fsPath);
		const fileName = path.basename(template.fsPath);

		/**
		 * // upload .tmpl file via /mgmt/shared/file-transfer/uploads/
		 * should show up in /var/config/rest/downloads/
		 * K38306494: Importing an iApp template using the CLI
		 * - https://support.f5.com/csp/article/K38306494
		 * 		- tmsh load /sys application template <path/to/iApp/template/file>
		 * 		- tmsh save /sys config
		 * 
		 */

		// upload .tmpl file
		const upload = await ext.mgmtClient?.upload(template.fsPath);
		
		console.log('break');

		const importTMPL: any = await ext.mgmtClient?.makeRequest(`/mgmt/tm/util/bash`, {
			method: 'POST',
			body: {
				command: 'run',
				utilCmdArgs: `-c 'tmsh load sys application template /var/config/rest/downloads/${fileName}'`
			}
		});

		return importTMPL.data.commandResult;
	}

	async deleteTMPL (template: string) {
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