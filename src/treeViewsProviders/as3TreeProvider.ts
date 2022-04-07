/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';

import {
	Command,
	Event,
	EventEmitter,
	MarkdownString,
	TreeDataProvider,
	TreeItem,
	TreeItemCollapsibleState
} from 'vscode';
import jsYaml from 'js-yaml';
import { 
	AdcDeclaration,
	As3AppMap,
	as3AppStats,
	As3Tenant,
	isObject,
	mapAs3,
	targetDecsBool
} from 'f5-conx-core';
import { ext } from '../extensionVariables';

export class AS3TreeProvider implements TreeDataProvider<AS3item> {

	private _onDidChangeTreeData: EventEmitter<AS3item | undefined> = new EventEmitter<AS3item | undefined>();
	readonly onDidChangeTreeData: Event<AS3item | undefined> = this._onDidChangeTreeData.event;

	/**
	 * target/tenant/app map derived from /declare endpoint
	 */
	as3DeclareMap: As3AppMap | undefined;

	/**
	 * original /declare api output
	 */
	declare: AdcDeclaration[] = [];

	/**
	 * did we detect any targets in the declaration(s)?
	 */
	targets: boolean = false;

	/**
	 * raw as3 /tasks endpoint output
	 */
	tasks: string[] = [];

	constructor() {
	}

	refresh(): void {
		this.as3DeclareMap = undefined;
		this.declare = [];
		this.tasks = [];
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: AS3item): TreeItem {
		return element;
	}

	async getChildren(element?: AS3item) {
		let treeItems: AS3item[] = [];

		if (ext.f5Client?.as3) {

			if (element) {

				if (element.label === 'Targets') {

					this.declare.map((el: AdcDeclaration) => {

						// get target details, at this point we should know for certain that we are dealing with targets...
						const target
							= el?.target?.address ? el.target.address
								: el?.target?.hostname ? el.target.hostname
									: 'missing target - should not be here';

						const targetTenCount = Object.entries(el).filter(([tKey, tVal]) => {
							return (isObject(tVal) && tKey !== 'target' && tKey !== 'controls');
						}).length.toString();

						// if (!this.as3DeclareMap) {
						// 	// this should never happen, but TS needs it...
						// 	return;
						// }

						// get appStats and set as tooltip
						const as3DecMap = this.as3DeclareMap?.[target];
						const as3DecMapStringified = jsYaml.dump(as3DecMap, { indent: 4 });
						const as3DecMdYaml = new MarkdownString().appendCodeblock(as3DecMapStringified, 'yaml');

						treeItems.push(new AS3item(target, targetTenCount, as3DecMdYaml, 'as3Target', TreeItemCollapsibleState.Collapsed,
							{ command: 'f5-as3.getDecs', title: '', arguments: [el] })
						);
					});

					treeItems = sortTreeItems(treeItems);

				} else if (element.label === 'Tenants') {

					Object.entries(this.as3DeclareMap as object).forEach(([key, value]) => {

						if (!this.as3DeclareMap) {
							return;
						}

						const appStats = this.as3DeclareMap[key];
						const appCount = Object.keys(appStats).length.toString();
						const as3DecMapStringified = new MarkdownString()
						.appendCodeblock(jsYaml.dump(appStats, { indent: 4 }), 'yaml');

						// get name of other tenants
						const targetRemoval = Object.keys(this.as3DeclareMap).filter(x => x !== key);
						// clone object to new variable
						const newDec = JSON.parse(JSON.stringify(this.declare[0]));
						// remove other tenant objects from clone
						targetRemoval.forEach(el => {
							delete newDec[el];
						});

						treeItems.push(
							new AS3item(key, appCount, as3DecMapStringified, 'as3Tenant', TreeItemCollapsibleState.Collapsed,
								{ command: 'f5-as3.getDecs', title: '', arguments: [newDec] })
						);
					});

					treeItems = sortTreeItems(treeItems);

				} else if (element.context === 'as3Target') {

					// now use item label to find/return list items for target - should only get one
					const targetDeclaration = this.declare.filter((el: AdcDeclaration) => {
						if (el.target?.address && el.target.address === element.label) {
							return el;
						} else if (el.target?.hostname && el.target.hostname === element.label) {
							return el;
						}
					})[0];

					if (targetDeclaration) {
						Object.entries(targetDeclaration).map(([targetKey, targetVal]) => {
							if (isObject(targetVal) && targetKey !== 'target' && targetKey !== 'controls') {

								const appCount = Object.entries(targetVal as object).filter(([tenantKey, tenantValue]) => {
									return (isObject(tenantValue));
								}).length.toString();


								if (!this.as3DeclareMap) {
									// this should never happen, but TS needs it...
									return;
								}

								// get appStats and set as tooltip
								const target = element.label as string;
								const tenant = targetKey as string;
								const as3DecMap = this.as3DeclareMap[target][tenant];
								const as3DecMapStringified = jsYaml.dump(as3DecMap, { indent: 4 });
								const as3DecMdYaml = new MarkdownString().appendCodeblock(as3DecMapStringified, 'yaml');

								// get name of other tenants
								const targetRemoval = Object.keys(this.as3DeclareMap[target]).filter(key => key !== targetKey);
								// clone object to new variable
								const newDec = JSON.parse(JSON.stringify(targetDeclaration));
								// remove other tenant objects from clone
								targetRemoval.forEach(el => {
									delete newDec[el];
								});

								treeItems.push(
									new AS3item(targetKey, appCount, as3DecMdYaml, 'as3Tenant', TreeItemCollapsibleState.Collapsed,
										{ command: 'f5-as3.getDecs', title: '', arguments: [newDec] })
								);
							}
						});
					}

					treeItems = sortTreeItems(treeItems);



				} else if (element.context === 'as3Tenant') {

					let tenantDeclaration: AdcDeclaration;
					if (this.targets) {
						// now use item label to find/return list items for target - should only get one
						tenantDeclaration = this.declare.filter((el: AdcDeclaration) => {
							return Object.entries(el).find(([key, value]) => ((key as unknown) as string === element.label));
						})[0];
					} else {
						// no targets so get the one device declaration with multiple tenants
						tenantDeclaration = this.declare[0];
					}



					if (tenantDeclaration) {

						// get target details, at this point we should know for certain that we are dealing with targets...
						const toolTip
							= tenantDeclaration?.target?.address ? `${tenantDeclaration.target.address}/${element.label}`
								: tenantDeclaration?.target?.hostname ? `${tenantDeclaration.target.hostname}/${element.label}`
									: `${element.label}`;


						// get the device declaration with tenants						
						const apps = Object.entries(tenantDeclaration[element.label] as object).filter(([tenantKey, tenantValue]) => {
							return (isObject(tenantValue));
						});


						apps.map(async app => {
							// bunch of typing magic..
							const appDec = tenantDeclaration[element.label] as As3Tenant;
							const appStats = await as3AppStats(appDec[app[0]] as object);
							const appCount = Object.keys(appStats as unknown as object).length.toString();
							treeItems.push(
								new AS3item(app[0], appCount, toolTip, 'as3App', TreeItemCollapsibleState.None,
									{ command: '', title: '', arguments: [] })
							);
						});
					}

					treeItems = sortTreeItems(treeItems);

				// } else if (element.context === 'as3App') {

				// 	if (!this.as3DeclareMap) {
				// 		return; // this should never happen, but TS needs it...
				// 	}

				// 	let as3DecMap: any;
				// 	if (/\//.test(element.tooltip as string) && this.as3DeclareMap) {
				// 		if (typeof element.tooltip === 'string') {
				// 			const [target, tenant] = element.tooltip.split('/');
				// 			as3DecMap = this.as3DeclareMap[target][tenant][element.label];
				// 		}
				// 	} else {
				// 		if (typeof element.tooltip === 'string') {
				// 			as3DecMap = this.as3DeclareMap[element.tooltip][element.label];
				// 		}
				// 	}

				// 	Object.entries(as3DecMap).forEach(([key, value]) => {

				// 		// since value is unknown at this point, cast it to a number, then convert to string
				// 		const count = (value as number).toString();
				// 		treeItems.push(
				// 			new AS3item(key, count, '', '', TreeItemCollapsibleState.None,
				// 				{ command: '', title: '', arguments: [] }
				// 			)
				// 		);
				// 	});

				// 	treeItems = sortTreeItems(treeItems);

				} else if (element.label === 'Tasks') {

					treeItems = this.tasks.map((task: any) => {
						return new AS3item(task.iId.split('-').pop(), task.timeStamp, '', '', TreeItemCollapsibleState.None,
							{ command: 'f5-as3.getTask', title: '', arguments: [task.iId] });
					});

				}

			} else {

				/**
				 * todo:  look at moving this to the refresh function, might cut back on how often it gets called
				 */
				await this.getTenants(); // refresh tenant information
				await this.getTasks();	// refresh tasks information

				const taskCount = this.tasks.length !== 0 ? this.tasks.length.toString() : '';

				// only try to parse declarations if we have an as3 dec map
				// sometimes AS3 is installed but has no apps
				if (this.as3DeclareMap) {

					// if we have bigiQ/targets
					if (this.targets) {

						const targetCount = Object.keys(this.as3DeclareMap as object).length.toString();
						treeItems.push(
							new AS3item('Targets', targetCount, '', '', TreeItemCollapsibleState.Collapsed,
								{ command: '', title: '', arguments: [''] })
						);

					} else {

						const tenCount = Object.keys(this.as3DeclareMap as object).length.toString();
						treeItems.push(
							new AS3item('Tenants', tenCount, 'Get All Tenants', '', TreeItemCollapsibleState.Collapsed,
								{ command: 'f5-as3.getDecs', title: '', arguments: [this.declare] })
						);

					}
				}

				treeItems.push(
					new AS3item('Tasks', taskCount, 'Get All Tasks', '', TreeItemCollapsibleState.Collapsed,
						{ command: 'f5-as3.getTask', title: '', arguments: [this.tasks] })
				);
			}
		} else {
			return Promise.resolve(treeItems);
		}
		return Promise.resolve(treeItems);
	}

	private async getTenants() {

		await ext.f5Client?.as3?.getDecs()
			.then(async (resp: any) => {

				if (resp.status === 200) {
					// set targets boolens so we know if we are workign with targets or just tenants
					this.targets = await targetDecsBool(resp.data);

					// assign the raw /declare output
					this.declare = Array.isArray(resp.data) ? resp.data : [resp.data];

					// create target/tenant/app map
					this.as3DeclareMap = await mapAs3(resp.data);

				}
			});
	}

	private async getTasks() {

		await ext.f5Client?.as3?.getTasks()
			.then((resp: any) => {
				this.tasks = [];	// clear current tenant list
				this.tasks = resp.data.items.map((item: any) => {
					// if no decs in task or none on box, it returns limited details, but the request still gets an ID, so we blank in what's not there - also happens when getting-tasks
					const timeStamp = item.declaration.hasOwnProperty('controls') ? item.declaration.controls.archiveTimestamp : '';
					const iId = item.id;

					return { iId, timeStamp };
				});
			});
	}

	as3Stats(dec: any) {
		// return as3AppStats(dec);

		const stats = {};

		Object.entries(dec).forEach(([aKey, aVal]) => {

			if(aKey === 'class') {
				// stats[akey] = 1;
				
			}
		});
	}
}

/**
 * sort tree items by label
 */
export function sortTreeItems(treeItems: AS3item[]) {
	return treeItems.sort((a, b) => {
		const x = a.label.toLowerCase();
		const y = b.label.toLowerCase();
		if (x < y) {
			return -1;
		} else {
			return 1;
		}
	});
}

class AS3item extends TreeItem {
	constructor(
		public readonly label: string,
		public description: string,
		public tooltip: string | MarkdownString,
		public context: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly command: Command,
	) {
		super(label, collapsibleState);
	}
	contextValue = this.context;
}

