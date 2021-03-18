/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';

import path from 'path';
import {
	Command,
	ConfigurationTarget,
	Event,
	EventEmitter,
	ExtensionContext,
	MarkdownString,
	ThemeIcon,
	TreeDataProvider,
	TreeItem,
	TreeItemCollapsibleState,
	window,
	workspace
} from 'vscode';
import { ext } from '../extensionVariables';
import logger from '../utils/logger';
import {
	AtcRelease,
	AtcVersion,
	wait,
} from 'f5-conx-core';
import { BigipHost } from '../models';
import jsyaml from 'js-yaml';
import { F5Client } from '../f5Client';

// icon listing for addin icons to key elements
// https://code.visualstudio.com/api/references/icons-in-labels#icon-listing

type hostsRefreshType = 'ATC' | 'UCS' | 'QKVIEW';

export class F5TreeProvider implements TreeDataProvider<F5Host|HostTreeItem> {

	private _onDidChangeTreeData: EventEmitter<F5Host | HostTreeItem | undefined> = new EventEmitter<F5Host | HostTreeItem | undefined>();
	readonly onDidChangeTreeData: Event<F5Host | HostTreeItem | undefined> = this._onDidChangeTreeData.event;

	fast: AtcVersion | undefined;
	as3: AtcVersion | undefined;
	do: AtcVersion | undefined;
	ts: AtcVersion | undefined;
	cf: AtcVersion | undefined;

	private orangeDot = ext.context.asAbsolutePath(path.join("images", "orangeDot.svg"));
	private greenDot = ext.context.asAbsolutePath(path.join("images", "greenDot.svg"));
	// private greenCheck = ext.context.asAbsolutePath(path.join("images", "greenCheck.svg"));
	private f5Hex = ext.context.asAbsolutePath(path.join("images", "f5_open_dark.svg"));
	private f524 = ext.context.asAbsolutePath(path.join("images", "f5_white_24x24.svg"));
	private bigiqSvg = ext.context.asAbsolutePath(path.join("images", "BIG-IQ-sticker_transparent.png"));

	/**
	 * regex for confirming host entry <user>@<host/ip>:<port>
	 */
	readonly deviceRex = /^[\w-.]+@[\w-.:]+(:[0-9]+)?$/;

	/**
	 * f5Client object when connected to a device
	 */
	connectedDevice: F5Client | undefined;
	/**
	 * list of UCSs from currently connected device
	 */
	private ucsList = [];
	private qkviewList = [];
	/**
	 * list of hosts from config file
	 */
	bigipHosts: BigipHost[] = [];
	private context: ExtensionContext;

	constructor(context: ExtensionContext) {
		this.context = context;
		this.fast = ext.atcVersions.fast;
		this.as3 = ext.atcVersions.as3;
		this.do = ext.atcVersions.do;
		this.ts = ext.atcVersions.ts;
		this.cf = ext.atcVersions.cf;
		this.loadHosts();
	}

	async loadHosts(): Promise<void> {
		this.bigipHosts = (workspace.getConfiguration().get('f5.hosts') || []);
	}

	async saveHosts(): Promise<void> {
		await workspace.getConfiguration()
			.update('f5.hosts', this.bigipHosts, ConfigurationTarget.Global);
	}

	async refresh(type?: hostsRefreshType): Promise<void> {
		// this._onDidChangeTreeData.fire(undefined);

		if (this.connectedDevice && type === 'UCS') {

			await this.connectedDevice.ucs.list()
				.then(resp => this.ucsList = resp.data.items);

		} else if (this.connectedDevice && type === 'QKVIEW') {

			await this.connectedDevice.qkview.list()
				.then(resp => this.qkviewList = resp.data.items);

		} else if (this.connectedDevice && type === 'ATC') {

			await this.connectedDevice.discover();

		} else if (this.connectedDevice) {

			// start getting ucs/qkview 
			await this.connectedDevice.discover();
			await this.connectedDevice.ucs.list()
				.then(resp => this.ucsList = resp.data.items);

			await this.connectedDevice.qkview.list()
				.then(resp => this.qkviewList = resp.data.items);
		}

		this._onDidChangeTreeData.fire(undefined);

	}


	getTreeItem(element: F5Host): TreeItem {
		return element;
	}


	async getChildren(element?: F5Host): Promise<F5Host[]> {

		if (element) {
			const treeItems: F5Host[] = [];

			// if the item is the device we are connected to
			if (element.device?.device === this.connectedDevice?.device.device) {

				// build item description indicating which atc services are installed
				const atcDesc = [
					this.connectedDevice?.fast ? 'fast' : undefined,
					this.connectedDevice?.as3 ? 'as3' : undefined,
					this.connectedDevice?.do ? 'do' : undefined,
					this.connectedDevice?.ts ? 'ts' : undefined,
					this.connectedDevice?.cf ? 'cf' : undefined,
				].filter(Boolean);


				// to be used when conx has ATC ILX mgmt
				treeItems.push(...[
					new F5Host('ATC', `(${atcDesc.join('/')})`, '', '', '', TreeItemCollapsibleState.Collapsed),
					new F5Host('UCS', this.ucsList.length.toString(), '', '', 'ucsHeader', TreeItemCollapsibleState.Collapsed),
					new F5Host('QKVIEW', this.qkviewList.length.toString(), '', '', 'qkviewHeader', TreeItemCollapsibleState.Collapsed),
				]);

			} else if (element.label === 'ATC') {

				const fastIcon
					= `v${this.connectedDevice?.fast?.version.version}` === this.fast?.latest ? this.greenDot
						: this.connectedDevice?.fast ? this.orangeDot
							: '';
				const as3Icon
					= `v${this.connectedDevice?.as3?.version.version}` === this.as3?.latest ? this.greenDot
						: this.connectedDevice?.as3 ? this.orangeDot
							: '';
				const doIcon
					= `v${this.connectedDevice?.do?.version.version}` === this.do?.latest ? this.greenDot
						: this.connectedDevice?.do ? this.orangeDot
							: '';
				const tsIcon
					= `v${this.connectedDevice?.ts?.version.version}` === this.ts?.latest ? this.greenDot
						: this.connectedDevice?.ts ? this.orangeDot
							: '';
				const cfIcon
					= `v${this.connectedDevice?.cf?.version.version}` === this.cf?.latest ? this.greenDot
						: this.connectedDevice?.cf ? this.orangeDot
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
						deviceVersion === this.connectedDevice?.fast?.version.version ? 'Installed' : ''
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
						deviceVersion === this.connectedDevice?.as3?.version.version ? 'Installed' : ''
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
						deviceVersion === this.connectedDevice?.do?.version.version ? 'Installed' : ''
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
						el.version.replace(/^v/, '') === this.connectedDevice?.ts?.version.version ? 'Installed' : ''
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
						el.version.replace(/^v/, '') === this.connectedDevice?.cf?.version.version ? 'Installed' : ''
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


			// if (this.bigipHosts === undefined) {
			// 	throw new Error('No configured hosts - from hostTreeProvider');
			// }


			const treeItems = this.bigipHosts.map((item: BigipHost) => {


				// add default provider=local if not defined
				if (!item.hasOwnProperty('provider')) {
					item['provider'] = 'tmos';
				}

				// if device is connected device, make it expandable
				let itemCollapsibleState = TreeItemCollapsibleState.None;
				if (item.device === this.connectedDevice?.device.device) {
					itemCollapsibleState = TreeItemCollapsibleState.Expanded;
					this.saveConnectedDeviceDetails();
				}

				const icon = 
				(item.details?.product === 'BIG-IQ') ? this.bigiqSvg : 
				(item.details?.product === 'BIG-IP') ? this.f5Hex : '';
				const tooltip = item.details ? new MarkdownString().appendCodeblock(jsyaml.dump(item), 'yaml') : '';

				const treeItem = new F5Host(
					(item.label || item.device),
					item.provider,
					tooltip,
					icon,
					'f5Host',
					itemCollapsibleState,
					{
						command: 'f5.connectDevice',
						title: 'hostTitle',
						arguments: [item]
					}
				);

				treeItem.device = item;
				return treeItem;
			});

			return Promise.resolve(treeItems);
		}
	}

	async addDevice(newHost: string) {

		if (!newHost) {
			// attempt to get user to input new device
			newHost = await window.showInputBox({
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

		// quick-n-dirty way, stringify the entire hosts config and search it for the host we are adding
		const devicesString = JSON.stringify(this.bigipHosts);

		if (!devicesString.includes(`\"${newHost}\"`) && this.deviceRex.test(newHost)) {
			this.bigipHosts.push({ device: newHost, provider: 'tmos' });
			this.saveHosts();
			wait(500, this.refresh());
			return `${newHost} added to device configuration`;
		} else {
			logger.error(`${newHost} exists or invalid format: <user>@<host/ip>:<port>`);
			return 'FAILED - Already exists or invalid format: <user>@<host/ip>';
		}
	}

	async editDevice(hostID: F5Host) {
		logger.debug(`Edit Host command:`, hostID);

        window.showInputBox({
            prompt: 'Update Device/BIG-IP/Host',
            value: hostID.label,
            ignoreFocusOut: true
        })
            .then(input => {

                logger.debug('user input', input);

                if (input === undefined || this.bigipHosts === undefined) {
                    // throw new Error('Update device inputBox cancelled');
                    logger.warn('Update device inputBox cancelled');
                    return;
                }

                // const deviceRex = /^[\w-.]+@[\w-.]+(:[0-9]+)?$/;
                const devicesString = JSON.stringify(this.bigipHosts);

                if (!devicesString.includes(`\"${input}\"`) && this.deviceRex.test(input) && this.bigipHosts && hostID.device) {

					// get the array index of the modified device
					const modifiedDeviceIndex = this.bigipHosts.findIndex(x => x.device === hostID.device?.device);

					// update device using index
					this.bigipHosts[modifiedDeviceIndex].device = input;

					this.saveHosts();
					wait(500, this.refresh());

				} else {

                    logger.error(`${input} exists or invalid format: <user>@<host/ip>:<port>`);
                }
            });
	}

	async removeDevice(hostID: F5Host) {
		logger.debug(`Remove Host command:`, hostID);
		
		const newBigipHosts = this.bigipHosts.filter(item => item.device !== hostID.device?.device);
		
		if (this.bigipHosts.length === (newBigipHosts.length + 1)) {
			logger.debug('device removed');
			this.clearPassword(hostID.label);	// clear cached password for device
			this.bigipHosts = newBigipHosts;
			this.saveHosts();
			wait(500, this.refresh());
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
			await ext.keyTar.findCredentials('f5Hosts').then(list => {
				// map through and delete all
				list.map(item => ext.keyTar.deletePassword('f5Hosts', item.account));
			});
			/**
			 * future: setup clear all to return an array of touples to show which
			 *  device passwords got cleared
			 */
		}
	}


	/**
	 * capture connected device details to save in the config for the hosts view
	 */
	async saveConnectedDeviceDetails() {

		// get the index of the current connected device in the devices array
		const connectedDeviceIndex = this.bigipHosts?.findIndex(x => x.device === this.connectedDevice?.device.device);

		// we should have everything we need by now
		if ((connectedDeviceIndex || connectedDeviceIndex === 0) && this.bigipHosts && this.connectedDevice) {
			// inject/refresh details
			this.bigipHosts[connectedDeviceIndex].details = {
				product: this.connectedDevice.host?.product,
				platformMarketingName: this.connectedDevice.host?.platformMarketingName,
				version: this.connectedDevice.host?.version,
				managementAddress: this.connectedDevice.host?.managementAddress,
				platform: this.connectedDevice.host?.platform,
				physicalMemory: this.connectedDevice.host?.physicalMemory
			};
			this.saveHosts();
		}
	}

}


export class F5Host extends TreeItem {
	device: BigipHost | undefined;
	constructor(
		public readonly label: string,
		public description: string,
		public tooltip: string | MarkdownString,
		public iconPath: string | ThemeIcon,
		public contextValue: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly command?: Command,
	) {
		super(label, collapsibleState);
	}
}


export class HostTreeItem extends TreeItem {
	constructor(
		public readonly label: string,
		public description: string,
		public tooltip: string | MarkdownString,
		public iconPath: string | ThemeIcon,
		public contextValue: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly command?: Command,
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