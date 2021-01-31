import {
	Command,
	Event,
	EventEmitter,
	TreeDataProvider,
	TreeItem,
	TreeItemCollapsibleState
} from 'vscode';
import { AdcDeclaration, As3AppMap, As3Declaration } from '../utils/as3Models';
import { ext } from '../extensionVariables';
import logger from '../utils/logger';
import { debug } from 'console';


// interface apps: string[]
// declare interface target {
// 	tenants: apps[]
// }

export class AS3TreeProvider implements TreeDataProvider<AS3item> {

	private _onDidChangeTreeData: EventEmitter<AS3item | undefined> = new EventEmitter<AS3item | undefined>();
	readonly onDidChangeTreeData: Event<AS3item | undefined> = this._onDidChangeTreeData.event;

	/**
	 * target/tenant/app map from /declare endpoint
	 */
	as3DeclareMap: As3AppMap | undefined;

	/**
	 * original declare output
	 */
	declare = [];

	private _tenants: {
		class: string,
		id: string,
		schemaVersion: string,
		updateMode: string
		[key: string]: unknown
	}[] = [];
	private _bigiqTenants: {
		target: string,
		tensList: []
	}[] = [];
	private _tasks: string[] = [];

	constructor() {
	}

	refresh(): void {
		// this.declarations = [];
		this._bigiqTenants = [];
		this._tenants = [];
		this._tasks = [];
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: AS3item): TreeItem {
		return element;
	}

	async getChildren(element?: AS3item) {
		let treeItems: AS3item[] = [];

		if (ext.as3Bar.text) {

			if (element) {

				if (element.label === 'Targets') {


					treeItems = this._bigiqTenants.map((el: { target: string; tensList: any[]; }) => {
						const targetTenCount = el.tensList.length.toString();

						// const declaration = {
						// 	class: 'ADC',
						// 	target: tenant.target,
						// 	schemaVersion: tenant.schemaVersion,
						// 	id: tenant.id,
						// 	[tenant.label]: tenant.dec
						// }

						return new AS3item(el.target, targetTenCount, '', '', TreeItemCollapsibleState.Collapsed,
							{ command: 'f5-as3.getDecs', title: '', arguments: [el.tensList] });
					});

				} else if (element.label === 'Tenants') {

					let tenant: string;
					let target: string;
					treeItems = this._tenants.map((el) => {

						// loop through the items in the object, find the declaration,
						// 	return the tenant(key) (should only be one)
						Object.entries(el).forEach(([key, val]) => {
							// is the item an object and has a 'class' property?
							if (typeof val === 'object' && val?.hasOwnProperty('class')) {

								// typecast the object class property to be a string
								const tenAntNew = (val as { class: string });

								// is it the 'Tenant' class? -> means its the declaration, so return the key as the tenant name
								if (tenAntNew.class === 'Tenant') {
									tenant = key;
								}
							}

							// if key of this object property is a target
							target = key === 'target'
								// typecast val as an object with address property of string, then return the address string in a templated string
								? `target -> ${(val as { address: string }).address}`
								// else, make it blank
								: '';
						});

						return new AS3item(tenant, target, '', 'as3Tenant', TreeItemCollapsibleState.None,
							{ command: 'f5-as3.getDecs', title: 'Get Tenant Declaration', arguments: [el] });
					});

				} else if (element.label === 'Tasks') {

					treeItems = this._tasks.map((task: any) => {
						return new AS3item(task.iId.split('-').pop(), task.timeStamp, '', '', TreeItemCollapsibleState.None,
							{ command: 'f5-as3.getTask', title: '', arguments: [task.iId] });
					});
				} else {

					// this should happen when a target is selected

					const x = element.command?.arguments?.map(el => {
						return new AS3item(el.label, '', '', 'as3Tenant', TreeItemCollapsibleState.None,
							{ command: 'f5-as3.getDecs', title: 'Get Tenant Declaration', arguments: [el] });
					});
					treeItems = x ? x : [];
				}

			} else {

				/**
				 * todo:  look at moving this to the refresh function, might cut back on how often it gets called
				 */
				await this.getTenants(); // refresh tenant information
				await this.getTasks();	// refresh tasks information


				const targetCount = this._bigiqTenants.length !== 0 ? this._bigiqTenants.length.toString() : '';
				const tenCount = this._tenants.length !== 0 ? this._tenants.length.toString() : '';
				const taskCount = this._tasks.length !== 0 ? this._tasks.length.toString() : '';

				// if we have bigiQ...
				if (this._bigiqTenants.length > 0) {
					treeItems.push(
						new AS3item('Targets', targetCount, '', '', TreeItemCollapsibleState.Collapsed,
							{ command: '', title: '', arguments: [''] })
					);
				}

				// if we have bigip
				if (this._tenants.length > 0) {
					treeItems.push(
						new AS3item('Tenants', tenCount, 'Get All Tenants', '', TreeItemCollapsibleState.Collapsed,
							{ command: 'f5-as3.getDecs', title: '', arguments: [''] })
					);
				}


				treeItems.push(
					new AS3item('Tasks', taskCount, 'Get All Tasks', '', TreeItemCollapsibleState.Collapsed,
						{ command: 'f5-as3.getTask', title: '', arguments: [''] })
				);
			}
		}
		return Promise.resolve(treeItems);
	}



	private async getTenants() {
		this._tenants = [];	// clear current tenant list
		this._bigiqTenants = [];	// clear current bigiq tenant list

		// await ext.f5Client?.as3?.getDecs()
		await ext.mgmtClient?.makeRequest(`/mgmt/shared/appsvcs/declare/`)
			.then(async (resp: any) => {

				this.as3DeclareMap = await mapAs3(resp.data);

				// got an array, so this should be a bigiq list of devices with tenant information
				if (Array.isArray(resp.data)) {

					// loop through targets/devices
					this._bigiqTenants = resp.data.map((el: any) => {

						const target = el.target.address; // get target bigip

						const tensList: any[] = [];
						Object.entries(el).forEach(([key, val]) => {
							if (isObject(val) && key !== 'target' && key !== 'controls') {

								tensList.push({
									label: key,
									dec: val,
									target: el.target,
									id: el.id,
									schemaVersion: el.schemaVersion,
									updateMode: el.updateMode
								});

							}
						});

						// now sort the tenants list
						tensList.sort((a, b) => {
							const x = a.label.toLowerCase();
							const y = b.label.toLowerCase();
							if (x < y) {
								return -1;
							} else {
								return 1;
							}
						});

						return { target, tensList };
					});


					// now sort the targets list
					this._bigiqTenants.sort((a, b) => {
						const x = a.target.toLowerCase();
						const y = b.target.toLowerCase();
						if (x < y) {
							return -1;
						} else {
							return 1;
						}
					});

				} else {

					let target;

					/**
					 * should be a single bigip tenants object
					 * 	loop through, return object keys 
					 */
					for (const [tenant, dec] of Object.entries(resp.data)) {

						if (isObject(dec) && tenant === 'target') {

							// Capture target if defined
							target = dec;

						}

						if (isObject(dec) && tenant !== 'controls' && tenant !== 'target') {

							// rebuild each tenant as3 dec
							const finalDec = {
								class: 'AS3',
								id: resp.data.id,
								schemaVersion: resp.data.schemaVersion,
								updateMode: resp.data.updateMode,
								[tenant]: dec
							};

							if (target) {
								// if we have a target, inject into tenant declaration
								finalDec.target = target;
							}
							this._tenants.push(finalDec);
						}

						// now sort the tenants list - spelled out...
						this._tenants.sort((a, b) => {

							let x, y;
							// find the tenant name of a
							for (const [key, value] of Object.entries(a)) {
								if (isObject(value)) {
									x = key;
								}
							}
							// find the tenant name of b
							for (const [key, value] of Object.entries(b)) {
								if (isObject(value)) {
									y = key;
								}
							}

							if (x && y) {
								// sort tenant
								if (x < y) {
									return -1;
								} else {
									return 1;
								}
							} else {
								// we should always have the appropriate object structure by the time we get here but TS will help keep any unexpected bugs down
								// meaning we should always get x and y, but since we didn't type the a and b, TS wants us to code the the possibility of undefined
								return 0;
							}
						});
					}
				}
			});
	}

	private async getTasks() {
		// await ext.f5Client?.as3?.getTasks()
		await ext.mgmtClient?.makeRequest(`/mgmt/shared/appsvcs/task/`)
			.then((resp: any) => {
				this._tasks = [];	// clear current tenant list
				this._tasks = resp.data.items.map((item: any) => {
					// if no decs in task or none on box, it returns limited details, but the request still gets an ID, so we blank in what's not there - also happens when getting-tasks
					const timeStamp = item.declaration.hasOwnProperty('controls') ? item.declaration.controls.archiveTimestamp : '';
					const iId = item.id;

					return { iId, timeStamp };
				});
			});
	}



}

export async function mapAs3(declare: AdcDeclaration | AdcDeclaration[]): Promise<As3AppMap> {

	// if array from bigiq/targets, assign, else put in array
	const declareArray = Array.isArray(declare) ? declare : [declare];

	let as3Map: {
		[key: string]: {
			[key: string]: string[]
		}
	} = {};


	// go through each item in the array
	declareArray.map((el: any) => {
		let tenants: {
			[key: string]: string[]
		} = {};

		// get target if defined
		const target
			= el?.target?.address ? el.target.address
				: el?.target?.hostname ? el.target.hostname
					: undefined;

		Object.entries(el).forEach(([key, val]) => {
			if (isObject(val) && key !== 'target' && key !== 'controls') {

				const apps: string[] = [];
				Object.entries(val).forEach(([tKey, tVal]) => {
					if (isObject(tVal)) {
						apps.push(tKey);
					}
				});

				tenants[key] = apps;
			}
		});

		if (target) {
			as3Map[target] = tenants;
		} else {
			Object.assign(as3Map, tenants);
		}

	});

	return as3Map;

}

/**
 * checks if input is object
 * 
 * ***an array is an object!!! ***
 * - use Array.isArray(x) => boolean
 * @param x 
 * @returns boolean
 */
const isObject = (x: any): boolean => {
	return (typeof x === 'object' ? true : false);
	// if( typeof x === 'object') {
	// 	return true;
	// } else {
	// 	return false;
	// }
};

class AS3item extends TreeItem {
	constructor(
		public readonly label: string,
		public description: string,
		public tooltip: string,
		public context: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly command: Command,
	) {
		super(label, collapsibleState);
	}
	contextValue = this.context;
}