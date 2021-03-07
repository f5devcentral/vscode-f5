/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import * as vscode from 'vscode';
import path from 'path';
import { TreeItemCollapsibleState } from 'vscode';
import { ext } from '../extensionVariables';
import logger from '../utils/logger';
import { atcMetaData, AtcRelease, AtcVersion, AtcVersions, AtcVersionsClient, F5Client } from 'f5-conx-core';

// icon listing for addin icons to key elements
// https://code.visualstudio.com/api/references/icons-in-labels#icon-listing

export class F5TreeProvider implements vscode.TreeDataProvider<F5Host> {

	private _onDidChangeTreeData: vscode.EventEmitter<F5Host | undefined> = new vscode.EventEmitter<F5Host | undefined>();
	readonly onDidChangeTreeData: vscode.Event<F5Host | undefined> = this._onDidChangeTreeData.event;

	fast: AtcVersion | undefined;
	as3: AtcVersion | undefined;
	do: AtcVersion | undefined;
	ts: AtcVersion | undefined;
	cf: AtcVersion | undefined;

	f5Client: F5Client | undefined;

	private orangeDot = ext.context.asAbsolutePath(path.join("images", "orangeDot.svg"));
	private greenDot = ext.context.asAbsolutePath(path.join("images", "greenDot.svg"));
	private greenCheck = ext.context.asAbsolutePath(path.join("images", "greenCheck.svg"));


	private ucsList = [];
	private qkviewList = [];

	constructor(private workspaceRoot: string) {
		this.fast = ext.atcVersions.fast;
		this.as3 = ext.atcVersions.as3;
		this.do = ext.atcVersions.do;
		this.ts = ext.atcVersions.ts;
		this.cf = ext.atcVersions.cf;
	}

	async refresh(): Promise<void> {
		this._onDidChangeTreeData.fire(undefined);

		if (ext.f5Client) {
			// start getting ucs/qkview 
			await ext.f5Client.connect();
			await ext.f5Client.ucs.list()
				.then(resp => this.ucsList = resp.data.items);

			await ext.f5Client.qkview.list()
				.then(resp => this.qkviewList = resp.data.items);
		}

		this._onDidChangeTreeData.fire(undefined);

	}

	getTreeItem(element: F5Host): vscode.TreeItem {
		return element;
	}
	async getChildren(element?: F5Host): Promise<F5Host[]> {

		if (element) {
			const treeItems: F5Host[] = [];

			// if the item is the device we are connected to
			if (element.label === ext.f5Client?.device.device) {

				// const atcDesc = Object.keys(this.latest);
				const atcDesc = [
					ext.f5Client.fast ? 'fast' : undefined,
					ext.f5Client.as3 ? 'as3' : undefined,
					ext.f5Client.do ? 'do' : undefined,
					ext.f5Client.ts ? 'ts' : undefined,
					ext.f5Client.cf ? 'cf' : undefined,
				].filter(Boolean);


				// to be used when conx has ATC ILX mgmt
				treeItems.push(...[
					new F5Host('ATC', `(${atcDesc.join('/')})`, '', '', '', TreeItemCollapsibleState.Collapsed),
					new F5Host('UCS', this.ucsList.length.toString(), '', '', 'ucsHeader', TreeItemCollapsibleState.Collapsed),
					new F5Host('QKVIEW', this.qkviewList.length.toString(), '', '', 'qkviewHeader', TreeItemCollapsibleState.Collapsed),
				]);

			} else if (element.label === 'ATC') {

				const fastIcon
					= `v${ext.f5Client?.fast?.version.version}` === this.fast?.latest ? this.greenDot
						: ext.f5Client?.fast ? this.orangeDot
							: '';
				const as3Icon
					= `v${ext.f5Client?.as3?.version.version}` === this.as3?.latest ? this.greenDot
						: ext.f5Client?.as3 ? this.orangeDot
							: '';
				const doIcon
					= `v${ext.f5Client?.do?.version.version}` === this.do?.latest ? this.greenDot
						: ext.f5Client?.do ? this.orangeDot
							: '';
				const tsIcon
					= `v${ext.f5Client?.ts?.version.version}` === this.ts?.latest ? this.greenDot
						: ext.f5Client?.ts ? this.orangeDot
							: '';
				const cfIcon
					= `v${ext.f5Client?.cf?.version.version}` === this.cf?.latest ? this.greenDot
						: ext.f5Client?.cf ? this.orangeDot
							: '';


				treeItems.push(...[
					new F5Host('FAST', '', 'f5-appsvcs-templates', fastIcon, 'atcService', TreeItemCollapsibleState.Collapsed),

					new F5Host('AS3', '', 'f5-appsvcs', as3Icon, 'atcService', TreeItemCollapsibleState.Collapsed),

					new F5Host('DO', '', 'f5-declarative-onboarding', doIcon, 'atcService', TreeItemCollapsibleState.Collapsed),

					new F5Host('TS', '', 'f5-telemetry', tsIcon, 'atcService', TreeItemCollapsibleState.Collapsed),

					new F5Host('CF', '', 'f5-cloud-failover', cfIcon, 'atcService', TreeItemCollapsibleState.Collapsed),
				]);


			} else if (element.label === 'FAST') {

				this.fast?.releases?.forEach((el: AtcRelease) => {

					// remove the leading "v" if present
					const deviceVersion = el.version.replace(/^v/, '');

					const desc = [
						el.version === this.fast?.latest ? 'Latest' : '',
						deviceVersion === ext.f5Client?.fast?.version.version ? 'Installed' : ''
					].filter(Boolean);

					treeItems.push(new F5Host(el.version, desc.join('/'), 'Click to install', '', 'rpm', TreeItemCollapsibleState.None, {
						command: 'f5.installRPM',
						title: '',
						arguments: [el.assets]
					}));
				});


			} else if (element.label === 'AS3') {

				this.as3?.releases?.forEach((el: AtcRelease) => {

					// remove the leading "v" if present
					const deviceVersion = el.version.replace(/^v/, '');

					const desc = [
						el.version === this.as3?.latest ? 'Latest' : '',
						deviceVersion === ext.f5Client?.as3?.version.version ? 'Installed' : ''
					].filter(Boolean);

					treeItems.push(new F5Host(el.version, desc.join('/'), 'Click to install', '', 'rpm', TreeItemCollapsibleState.None, {
						command: 'f5.installRPM',
						title: '',
						arguments: [el.assets]
					}));
				});


			} else if (element.label === 'DO') {

				this.do?.releases?.forEach((el: AtcRelease) => {

					// remove the leading "v" if present
					const deviceVersion = el.version.replace(/^v/, '');

					const desc = [
						el.version === this.do?.latest ? 'Latest' : '',
						deviceVersion === ext.f5Client?.do?.version.version ? 'Installed' : ''
					].filter(Boolean);

					treeItems.push(new F5Host(el.version, desc.join('/'), 'Click to install', '', 'rpm', TreeItemCollapsibleState.None, {
						command: 'f5.installRPM',
						title: '',
						arguments: [el.assets]
					}));
				});



			} else if (element.label === 'TS') {

				this.ts?.releases?.forEach((el: AtcRelease) => {

					const desc = [
						el.version === this.ts?.latest ? 'Latest' : '',
						el.version.replace(/^v/, '') === ext.f5Client?.ts?.version.version ? 'Installed' : ''
					].filter(Boolean);

					treeItems.push(new F5Host(el.version, desc.join('/'), 'Click to install', '', 'rpm', TreeItemCollapsibleState.None, {
						command: 'f5.installRPM',
						title: '',
						arguments: [el.assets]
					}));
				});



			} else if (element.label === 'CF') {

				this.cf?.releases?.forEach((el: AtcRelease) => {

					const desc = [
						el.version === this.cf?.latest ? 'Latest' : '',
						el.version.replace(/^v/, '') === ext.f5Client?.cf?.version.version ? 'Installed' : ''
					].filter(Boolean);

					treeItems.push(new F5Host(el.version, desc.join('/'), 'Click to install', '', 'rpm', TreeItemCollapsibleState.None, {
						command: 'f5.installRPM',
						title: '',
						arguments: [el.assets]
					}));
				});




			} else if (element.label === 'UCS') {

				// get list of ucs, list as items
				treeItems.push(...
					this.ucsList.map((el: any) => {
						const tip = [
							`created: ${el.apiRawValues.file_created_date}`,
							`file size: ${el.apiRawValues.file_size}`,
							`version: ${el.apiRawValues.version}`,
							`encrypted: ${el.apiRawValues.encrypted}`,
						].join('\r\n');
						const fileName = path.parse(el.apiRawValues.filename).base;

						return new F5Host(fileName, '', tip, '', 'ucsItem', TreeItemCollapsibleState.None, {
							command: 'f5.downloadUCS',
							title: '',
							arguments: [fileName]
						});
					})
				);



			} else if (element.label === 'QKVIEW') {
				// get list of qkviews, list as items
				treeItems.push(...
					this.qkviewList.map((el: any) => {
						const label = path.parse(el.name).name;
						return new F5Host(label, '', '', '', 'qkviewItem', TreeItemCollapsibleState.None);
					})
				);
			}


			return treeItems;
		} else {

			var bigipHosts: any | undefined = vscode.workspace.getConfiguration().get('f5.hosts');
			// logger.debug(`bigips: ${JSON.stringify(bigipHosts)}`);

			if (bigipHosts === undefined) {
				throw new Error('No configured hosts - from hostTreeProvider');
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
					itemCollapsibleStat = TreeItemCollapsibleState.Expanded;
				}

				const treeItem = new F5Host(
					item.device,
					item.provider,
					'',
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
		public iconPath: string,
		public contextValue: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		// public rpm?: {
		// 	downloadUrl: string,
		// 	latest: boolean,
		// 	packageName: string
		// },
		public readonly command?: vscode.Command,
	) {
		super(label, collapsibleState);
	}
}

/**
 * compares semver
 * 
 * https://github.com/substack/semver-compare
 * 
 * @param a 
 * @param b 
 */
export function cmp(a: string, b: string) {
	var pa = a.split('.');
	var pb = b.split('.');
	for (var i = 0; i < 3; i++) {
		var na = Number(pa[i]);
		var nb = Number(pb[i]);
		if (na > nb) { return 1; }
		if (nb > na) { return -1; }
		if (!isNaN(na) && isNaN(nb)) { return 1; }
		if (isNaN(na) && !isNaN(nb)) { return -1; }
	}
	return 0;
};

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