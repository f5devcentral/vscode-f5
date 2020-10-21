import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import * as utils from '../utils/utils';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import logger from '../utils/logger';


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
        this._iRules = [];	// clear current irule list
		const iRules: any = await ext.mgmtClient?.makeRequest(`/mgmt/tm/ltm/rule`);
		const miRules = iRules.data.items.map( (el: any) => el);
        this._iRules = miRules ? miRules : [];
	}

	/**
	 * Get all deployed iApp-Apps to hold in "this" view class
	 */
	private async getApps() {
		this._apps = [];	// clear current list
		const apps: any = await ext.mgmtClient?.makeRequest(`/mgmt/tm/sys/application/service`);
		const mApps = apps.data?.items?.map( (el: any) => el);
		this._apps = mApps ? mApps : [];
	}

	/**
	 * Get all iApp Templates (expanded details) to hold in "this" view class
	 */
	private async getTemplates() {
		this._iAppTemplates = [];	// clear current list
		const templates: any = await ext.mgmtClient?.makeRequest(`/mgmt/tm/sys/application/template?expandSubcollections=true`);
		const mTemplates = templates.data.items.map( (el: any) => el);
		this._iAppTemplates = mTemplates ? mTemplates : [];
	}

	/**
	 * changes fullName to urlName to use in API
	 * 	Ex:   /Common/A_test -> \~Common\~A_test
	 * @param name as string
	 */
	private name2uri(name: string) {
		return name.replace(/\//g, '~');
	}


	/**
	 * crafts irule tcl object and displays in editor with irule language
	 * @param item iRule item passed from view click
	 */
	async displayRule(item: any) {
		
		// make it look like a tcl irule object so it can be merged back with changes
		const content = `ltm rule ${item.fullPath} {\r\n` + item.apiAnonymous + '\r\n}';

		// open editor and feed it the content
		const doc = await vscode.workspace.openTextDocument({ content: content, language: 'irule-lang' });
		// make the editor appear
		await vscode.window.showTextDocument( doc, { preview: false });
		return doc;	// return something for automated testing
	}

	async deleteRule(item: any) {
		logger.debug('deleteRule: ', item);

		const name = this.name2uri(item.label);

		const resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/tm/ltm/rule/${name}`, {
			method: 'DELETE'
		});

		// logger.debug('deteleRule response: ', resp.data);
		setTimeout( () => { this.refresh();}, 500);	// refresh after update
		return `${resp.status}-${resp.statusText}`;
	}

	/**
	 * display .tmpl from f5 in editor
	 * @param item from tree view click
	 */
	async displayTMPL(item: any) {
		
		// open editor and feed it the content
		const doc = await vscode.workspace.openTextDocument({ content: item, language: 'irule-lang' });
		// make the editor appear
		await vscode.window.showTextDocument( doc, { preview: false });
		return doc;	// return something for automated testing
	}



	/**
	 * Gets the 'tmsh list sys application template <template_name>' output
	 * 	This seems to be the best way to get the original .tmpl format
	 * @param tempName 
	 */
	async getTMPL(tempName: any) {
		logger.debug('tempName', tempName);

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


	/**
	 * upload/import tmos/tcl config
	 * 
	 * supports entire editor or highlight code pieces
	 * 
	 * 	*Example:
	 * 		net vlan interal {
	 * 			tag 4094
	 * 		}
	 * 
	 * @param config tmos config as a string 
	 */
	async mergeTCL (config: string) {
		logger.debug('mergeTCL', config);

		const text = await utils.getText();	// get text from editor
		const tmpFile = 'tempTmosConfigMerge.tcl';	// temp file name
		const tmpDir = os.tmpdir();	//os temp directory
		const dstFilePath = path.join(tmpDir, tmpFile);	// -> /tmpDirectory/tmpFile.tcl

		// write temp iapp .tmpl file to extension core directory
		fs.writeFileSync(dstFilePath, text);

		// upload .tmpl file
		if(ext.mgmtClient) {
			const upload: any = await ext.mgmtClient.upload(dstFilePath);
			logger.debug('tcl upload complete -> moving to /tmp/ location', upload);

			await new Promise(r => setTimeout(r, 100)); // pause to finish upload
			
			// move file to temp location - required for tmsh merge command
			const move: any = await ext.mgmtClient.makeRequest(`/mgmt/tm/util/unix-mv`, {
				method: 'POST',
				body: {
					command: 'run',
					utilCmdArgs: `/var/config/rest/downloads/${tmpFile} /tmp/${tmpFile}`
				}
			});
			
			await new Promise(r => setTimeout(r, 100)); // pause to finish move
			logger.debug('tcl upload complete -> merging with running config', move.data);
	
			const resp: any = await ext.mgmtClient.makeRequest(`/mgmt/tm/util/bash`, {
				method: 'POST',
				body: {
					command: 'run',
					utilCmdArgs: `-c 'tmsh load sys config merge file /tmp/${tmpFile}'`
				}
			});

			const final = resp.data.commandResult;

			if(final.match(/(error|fail)/gi)) {
				//  merge failed -> display error in editor tab
				utils.displayInTextEditor(final);

				Promise.reject(new Error(`tmsh merge failed with error: ${final}`));
			} else {
				vscode.window.showInformationMessage('mergeTCL -> SUCCESSFUL!!!', );
				setTimeout( () => { this.refresh();}, 500);	// refresh after update
				return 'success';
			}

		} else {
			console.error('tcl upload/import: no connected device, connect to a device to issue command');
		}
	}

	/**
	 * Upload/Import iApp template
	 * @param template 
	 */
	async postTMPL (template: any) {
		logger.debug('postTMPL: ', template);

		// assign details if coming from explorer right-click
		var filePath = template.fsPath;
		var fileName = path.basename(template.fsPath);
		var cleanUp: string | undefined;


		if(template.scheme === 'untitled') {

			// get editor text (should be iapp .tmpl)
			const text = vscode.window.activeTextEditor?.document.getText();
			const coreDir = ext.context.extensionPath;	// extension core directory
			logger.debug('POST iApp .tmpl via editor detected');

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
					logger.debug('iapp file name has partition -> converting to uri', fileName);
				}
				logger.debug('found iApp name from editor text: ', fileName);
			} else {
				// regex failed to find iapp name -> fail with messaging
				const erTxt = 'Could not find iApp template name in text - use output from "tmsh list" command or original .tmpl format';
				console.error(erTxt);
				return vscode.window.showErrorMessage(erTxt);
			}

			const dstFilePath = path.join(coreDir, fileName);

			// todo: move temp file location to os.tempdir like below

			// const tmpDir = os.tmpdir();		// look at moving temp files to this...

			// write temp iapp .tmpl file to extension core directory
			fs.writeFileSync(dstFilePath, text);
			
			// set fsPath to tempFilePath for upload
			filePath = dstFilePath;
			// set cleanUp var to delete templ file when done
			cleanUp = dstFilePath;
			logger.debug('write temp iapp file complete:', dstFilePath);
		 } else {
			 logger.debug('iApp upload from explorer view detected -> filePath:', filePath);
		 }

		// upload .tmpl file
		if(ext.mgmtClient) {
			const upload = await ext.mgmtClient.upload(filePath);
			logger.debug('iApp upload complete -> importing iApp via tmsh bash api', upload);
	
			const importTMPL: any = await ext.mgmtClient.makeRequest(`/mgmt/tm/util/bash`, {
				method: 'POST',
				body: {
					command: 'run',
					utilCmdArgs: `-c 'tmsh load sys application template /var/config/rest/downloads/${fileName}'`
				}
			});

			if(cleanUp) {
				logger.debug('deleting iApp temp file at:', cleanUp);
				fs.unlinkSync(cleanUp);
			}
			setTimeout( () => { this.refresh();}, 500);	// refresh after update
			return importTMPL.data.commandResult;
		} else {
			console.error('iApp .tmpl upload: no connected device, connect to issue command');
		}
	}

	/**
	 * redeploy iapp with current params
	 * @param item tree view item from click
	 */
	async iAppRedeploy (item: {label: string}) {
		logger.debug('iAppRedeploy: ', item);
		// const urlName = item.label.replace(/\//g, '~');
		const urlName = this.name2uri(item.label);
		const resp = await ext.mgmtClient?.makeRequest(`/mgmt/tm/sys/application/service/${urlName}`, {
			method: 'PATCH',
			body: {
				'execute-action': 'definition'
			}
		});
		logger.debug('iAppReDeploy: resp-> ', resp);
	}

	/**
	 * deletes selected iApp-App
	 * @param item tree view item from click
	 */
	async iAppDelete (item: {label: string}) {
		logger.debug('iAppDelete: ', item);
		// const urlName = item.label.replace(/\//g, '~');
		const urlName = this.name2uri(item.label);
		const resp = await ext.mgmtClient?.makeRequest(`/mgmt/tm/sys/application/service/${urlName}`, {
			method: 'DELETE'
		});
		logger.debug('iAppDelete: resp-> ', resp);
		setTimeout( () => { this.refresh();}, 500);	// refresh after update
	}

	/**
	 * deletes iapp template
	 * @param template tree veiw item from click
	 */
	async deleteTMPL (item: {label: string}) {
		logger.debug('deleteTMPL: ', item);
		// const urlName = template.label.replace(/\//g, '~');
		const urlName = this.name2uri(item.label);
		const resp = await ext.mgmtClient?.makeRequest(`/mgmt/tm/sys/application/template/${urlName}`, {
			method: 'DELETE'
		});
		logger.debug('deleteTMPL: resp-> ', resp);
		setTimeout( () => { this.refresh();}, 500);	// refresh after update
	}
}


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