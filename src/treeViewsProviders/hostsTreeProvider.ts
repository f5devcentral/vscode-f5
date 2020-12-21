import * as vscode from 'vscode';
import path from 'path';
import { TreeItemCollapsibleState } from 'vscode';
import { ext } from '../extensionVariables';
import logger from '../utils/logger';

export class F5TreeProvider implements vscode.TreeDataProvider<F5Host> {

	private _onDidChangeTreeData: vscode.EventEmitter<F5Host | undefined> = new vscode.EventEmitter<F5Host | undefined>();
	readonly onDidChangeTreeData: vscode.Event<F5Host | undefined> = this._onDidChangeTreeData.event;

	private ucsList = [];

	constructor(private workspaceRoot: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: F5Host): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: F5Host): Promise<F5Host[]> {

		if (element) {
			// if tree item is expandible (should only be one)
			// then return items for extended details
			// - ATC
			// - UCS
			// - QKVIEW
			const treeItems: F5Host[] = [];

			// if the item is the device we are connected to
			if (element.label === ext.f5Client?.device.device) {

				// to be used when conx has ATC ILX mgmt
				treeItems.push(...[
					new F5Host('ATC', 'services', '', '', TreeItemCollapsibleState.Collapsed),
					new F5Host('UCS', 'num', '', '', TreeItemCollapsibleState.Collapsed),
					new F5Host('QKVIEW', 'num', '', '', TreeItemCollapsibleState.Collapsed),
				]);

			} else if (element.label === 'ATC') {

				treeItems.push(...[
					new F5Host('FAST', 'v', '', '', TreeItemCollapsibleState.Collapsed),
					new F5Host('AS3', 'v', '', '', TreeItemCollapsibleState.Collapsed),
					new F5Host('DO', 'v', '', '', TreeItemCollapsibleState.Collapsed),
					new F5Host('TS', 'v', '', '', TreeItemCollapsibleState.Collapsed),
					new F5Host('CF', 'v', '', '', TreeItemCollapsibleState.Collapsed),
				]);

			} else if (element.label === 'UCS') {

				// if(this.ucsList.length === 0)

				// get list of ucs, list as items
				treeItems.push(...
					this.ucsList.map((el: any) => {
						const tip = [
							`created: ${el.apiRawValues.file_created_date}`,
							`file size: ${el.apiRawValues.file_size}`,
							`version: ${el.apiRawValues.version}`,
							`encrypted: ${el.apiRawValues.encrypted}`,
						].join('\r\n');
						// const tipString = tip.join('\r\n');
						const fileName = path.parse(el.apiRawValues.filename).base;

						return new F5Host(fileName, '', tip, 'ucsItem', TreeItemCollapsibleState.None);
					})
				);

				const tmpUcsListResp = {
					"kind": "tm:sys:ucs:ucscollectionstate",
					"selfLink": "https://localhost/mgmt/tm/sys/ucs?ver=14.1.2.6",
					"items": [
						{
							"kind": "tm:sys:ucs:ucsstate",
							"generation": 0,
							"apiRawValues": {
								"base_build": "0.0.2",
								"build": "0.0.2",
								"built": "200605113646",
								"changelist": "3327837",
								"edition": "Point Release 6",
								"encrypted": "no",
								"file_created_date": "2020-08-01T12:57:21Z",
								"file_size": "281800911 (in bytes)",
								"filename": "/var/local/ucs/coreltm01_8.1.2020.ucs",
								"install_date": "Fri Jun  5 11:36:46 PDT 2020",
								"job_id": "1204782",
								"product": "BIG-IP",
								"sequence": "14.1.2.6-0.0.2.0",
								"version": "14.1.2.6"
							}
						}
					]
				};

			} else if (element.label === 'QKVIEW') {
				// get list of qkviews, list as items

			}


			return treeItems;
		} else {

			var bigipHosts: any | undefined = vscode.workspace.getConfiguration().get('f5.hosts');
			// logger.debug(`bigips: ${JSON.stringify(bigipHosts)}`);

			if (bigipHosts === undefined) {
				throw new Error('No configured hosts - from hostTreeProvider');
			}

			logger.debug('checking for legacy hosts config');


			/**
			 * 7.27.2020
			 * the following code bloc detects the legacy device configuration structure of an array of strings
			 * 	then converts it to the new structure for the new devices view, which is an array of objects.  
			 * 
			 * Should only run once when it detects the legacy config the first time.
			 * 
			 * Should be able remove this down the road
			 */

			// if devices in list and first list item is a string, not an object
			if (bigipHosts.length > 0 && typeof (bigipHosts[0]) === 'string') {

				logger.debug('devices are type of:', typeof (bigipHosts[0]));
				bigipHosts = bigipHosts.map((el: any) => {
					let newObj: { device: string } = { device: el };
					logger.debug(`device coverted from: ${el} -> ${JSON.stringify(newObj)}`);
					return newObj;
				});

				logger.debug('conversion complete, saving new devices list:', bigipHosts);
				// save config
				vscode.workspace.getConfiguration().update('f5.hosts', bigipHosts, vscode.ConfigurationTarget.Global);
				vscode.window.showWarningMessage('Legacy device config list converted!!!');
			} else {
				logger.debug('New device configuration list detected -> no conversion');
			}

			const treeItems = bigipHosts.map((item: {
				device: string;
				provider: string;
			}) => {



				// add default provider=local if not defined
				if (!item.hasOwnProperty('provider')) {
					item['provider'] = 'local';
				}

				// if device is connected device, make it expandable

				let itemCollapsibleStat = TreeItemCollapsibleState.None;
				if (item.device === ext.f5Client?.device.device) {
					logger.debug('hostsTreeProvider, These devices are equal!');
					itemCollapsibleStat = TreeItemCollapsibleState.Expanded;
					// start getting ucs/qkview details

					ext.f5Client.ucs?.list()
						.then(resp => this.ucsList = resp.data.items);

				}

				const treeItem = new F5Host(
					item.device,
					item.provider,
					'',
					'f5Host',
					itemCollapsibleStat,
					{
						command: 'f5.connectDevice',
						title: 'hostTitle',
						arguments: [item]
					}
				);
				return treeItem;
			});

			return Promise.resolve(treeItems);
		}
	}

	async addDevice(newHost: string) {

		let bigipHosts: { device: string }[] | undefined = await vscode.workspace.getConfiguration().get('f5.hosts');

		if (!newHost) {
			// attempt to get user to input new device
			newHost = await vscode.window.showInputBox({
				prompt: 'Device/BIG-IP/Host',
				placeHolder: '<user>@<host/ip>',
				ignoreFocusOut: true
			})
				.then(el => {
					if (el) {
						return el;
					} else {
						throw new Error('user escapted new device input');
					}
				});
		}

		if (bigipHosts === undefined) {
			// throw new Error('no devices in config?');
			bigipHosts = [];
		}

		// the following is a quick and dirty way to search the entire 
		//	devices config obj for a match without having to check each piece

		const deviceRex = /^[\w-.]+@[\w-.]+(:[0-9]+)?$/;		// matches any username combo an F5 will accept and host/ip
		const devicesString = JSON.stringify(bigipHosts);

		if (!devicesString.includes(`\"${newHost}\"`) && deviceRex.test(newHost)) {
			bigipHosts.push({ device: newHost });
			await vscode.workspace.getConfiguration().update('f5.hosts', bigipHosts, vscode.ConfigurationTarget.Global);
			// vscode.window.showInformationMessage(`Adding ${newHost} to list!`);
			this.refresh();
			return `${newHost} added to device configuration`;
		} else {
			vscode.window.showErrorMessage('Already exists or invalid format: <user>@<host/ip>');
			return 'FAILED - Already exists or invalid format: <user>@<host/ip>';
			// Promise.reject('Already exists or invalid format: <user>@<host/ip>');
			// throw new Error('Already exists or invalid format: <user>@<host/ip>');
		}
	}

	async removeDevice(hostID: any) {
		logger.debug(`Remove Host command: ${JSON.stringify(hostID)}`);

		this.clearPassword(hostID.label);	// clear cached password for device

		let bigipHosts: { device: string }[] | undefined = vscode.workspace.getConfiguration().get('f5.hosts');

		if (!bigipHosts || !hostID) {
			throw new Error('device delete, no devices in config or no selected host to delete');
		}

		const newBigipHosts = bigipHosts.filter(item => item.device !== hostID.label);

		if (bigipHosts.length === (newBigipHosts.length + 1)) {
			logger.debug('successfully removed device!!!');
			await vscode.workspace.getConfiguration().update('f5.hosts', newBigipHosts, vscode.ConfigurationTarget.Global);
			setTimeout(() => { this.refresh(); }, 300);
			return `successfully removed ${hostID.label} from devices configuration`;
		} else {
			logger.debug('something with remove device FAILED!!!');
			throw new Error('something with remove device FAILED!!!');
		}

	}

	/**
 * clears password
 */
	async clearPassword(device?: string) {

		if (device) {

			// passed in from view click or deviceClient
			logger.debug('CLEARING KEYTAR PASSWORD CACHE for', device);
			return await ext.keyTar.deletePassword('f5Hosts', device);

		} else {

			// get list of items in keytar for the 'f5Hosts' service
			logger.debug('CLEARING KEYTAR PASSWORD CACHE');
			const one1 = await ext.keyTar.findCredentials('f5Hosts').then(list => {
				// map through and delete all
				list.map(item => ext.keyTar.deletePassword('f5Hosts', item.account));
			});
			/**
			 * future: setup clear all to return an array of touples to show which
			 *  device passwords got cleared
			 */
		}
	}
}

export class F5Host extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public description: string,
		public tooltip: string,
		public contextValue: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}
}