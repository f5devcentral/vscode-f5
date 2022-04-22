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
import {
	wait,
} from 'f5-conx-core';
import { BigipHost } from '../models';
import jsyaml from 'js-yaml';
import { F5Client } from '../f5Client';

import { logger } from '../logger';

// icon listing for addin icons to key elements
// https://code.visualstudio.com/api/references/icons-in-labels#icon-listing

type hostsRefreshType = 'ATC' | 'UCS' | 'QKVIEW';

export class F5TreeProvider implements TreeDataProvider<F5Host> {

	private _onDidChangeTreeData: EventEmitter<F5Host | undefined> = new EventEmitter<F5Host | undefined>();
	readonly onDidChangeTreeData: Event<F5Host | undefined> = this._onDidChangeTreeData.event;

	// private greenCheck = ext.context.asAbsolutePath(path.join("images", "greenCheck.svg"));
	private f5Hex = ext.context.asAbsolutePath(path.join("images", "f5_open_dark.svg"));
	private f524 = ext.context.asAbsolutePath(path.join("images", "f5_white_24x24.svg"));
	private bigiqSvg = ext.context.asAbsolutePath(path.join("images", "BIG-IQ-sticker_transparent.png"));
	// other svg recolored to match the mustard yellow of the png
	// private bigiqSvg = ext.context.asAbsolutePath(path.join("images", "big-iq-centralized-mngmnt.svg"));

	/**
	 * regex for confirming host entry <user>@<host/ip>:<port>
	 */
	readonly deviceRex = /^[\w-.]+@[\w-.:]+(:[0-9]+)?$/;

	/**
	 * f5Client object when connected to a device
	 */
	connectedDevice: F5Client | undefined;

	/**
	 * list of hosts from config file
	 */
	bigipHosts: BigipHost[] = [];
	private context: ExtensionContext;

	constructor(context: ExtensionContext) {
		this.context = context;

		this.loadHosts();
	}

	async loadHosts(): Promise<void> {
		this.bigipHosts = (workspace.getConfiguration().get('f5.hosts') || []);
	}

	async saveHosts(): Promise<void> {
		return await workspace.getConfiguration()
			.update('f5.hosts', this.bigipHosts, ConfigurationTarget.Global);
	}


	async refresh(): Promise<void> {
		return await this.loadHosts()
			.then(_ => {
				return this._onDidChangeTreeData.fire(undefined);
			});
	}


	getTreeItem(element: F5Host): TreeItem {
		return element;
	}


	async getChildren(element?: F5Host): Promise<F5Host[]> {
		let treeItems: F5Host[] = [];

		if (element) {

			// map hosts array and return items with matching folder
			this.bigipHosts.map((item: BigipHost) => {
				if (item.folder === element.label) {

					// add default provider=local if not defined
					if (!item.hasOwnProperty('provider')) {
						item['provider'] = 'tmos';
					}

					let itemCollapsibleState = TreeItemCollapsibleState.None;
					if (item.device === this.connectedDevice?.device.device) {
						this.saveConnectedDeviceDetails();
					}

					const icon =
						(item.details?.product === 'BIG-IQ') ? this.bigiqSvg :
							(item.details?.product === 'BIG-IP') ? this.f5Hex : 'file';
					const tooltip
						= item.details
							? new MarkdownString().appendCodeblock(jsyaml.dump(item), 'yaml')
							: '';

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
					treeItems.push(treeItem);
				}
			});

		} else {

			this.bigipHosts.map((item: BigipHost) => {

				// if item has folder, create folder item, else return host item
				if (item.folder) {

					// const x = treeItems.findIndex(x => x.label === item.folder);

					// filter items in folder and return only labels (hostnames)
					// const folderItems = this.bigipHosts.filter(x => x.label === item.folder).map(y => y.label);
					const folderItems = this.bigipHosts.filter(x => x.folder === item.folder).map(y => (y.label || y.device));
					// count the number of hosts in folder
					const folderItemCount = folderItems.length.toString();

					if (treeItems.findIndex(x => x.label === item.folder) === -1) {
						// folder item not found, add to tree
						treeItems.push(new F5Host(
							item.folder,
							folderItemCount,
							new MarkdownString().appendCodeblock(folderItems.join('\n'), 'yaml'),
							new ThemeIcon('file-directory'),
							'f5Host-folder',
							TreeItemCollapsibleState.Collapsed
						));
					}


				} else {

					// add default provider=local if not defined
					if (!item.hasOwnProperty('provider')) {
						item['provider'] = 'tmos';
					}

					let itemCollapsibleState = TreeItemCollapsibleState.None;
					if (item.device === this.connectedDevice?.device.device) {
						this.saveConnectedDeviceDetails();
					}

					const icon =
						(item.details?.product === 'BIG-IQ') ? this.bigiqSvg :
							(item.details?.product === 'BIG-IP') ? this.f5Hex : '$(file)';
					const tooltip
						= item.details
							? new MarkdownString().appendCodeblock(jsyaml.dump(item), 'yaml')
							: '';

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
					treeItems.push(treeItem);
				}



			});

		}
		return treeItems;
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
			await this.saveHosts();
			wait(500, this.refresh());
			return `${newHost} added to device configuration`;
		} else {
			logger.error(`${newHost} exists or invalid format: <user>@<host/ip>:<port>`);
			throw Error('FAILED - Already exists or invalid format: <user>@<host/ip>');
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

	async removeDevice(device: string, label?: string) {
		logger.debug(`Remove Host command:`, device, `(label: ${label})`);

		const newBigipHosts = this.bigipHosts.filter(item => item.device !== device);

		if (this.bigipHosts.length === (newBigipHosts.length + 1)) {
			logger.debug('device removed');
			await this.clearPassword(device);	// clear cached password for device
			this.bigipHosts = newBigipHosts;
			await this.saveHosts();
			wait(500, this.refresh());
			return `successfully removed ${device} (label: ${label}) from devices configuration`;
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

				// map out just the account names
				const devices = list.map(item => item.account);
				// log the accounts pending password removal
				logger.info('removing cached password for following devices;', devices);
				// map through and delete all
				devices.map(device => ext.keyTar.deletePassword('f5Hosts', device));
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
