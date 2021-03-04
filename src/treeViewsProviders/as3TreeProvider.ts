import {
	Command,
	Event,
	EventEmitter,
	TreeDataProvider,
	TreeItem,
	TreeItemCollapsibleState
} from 'vscode';
import * as jsYaml from 'js-yaml';
import { AdcDeclaration, As3AppMap, As3AppMapTargets, As3AppMapTenants, As3Declaration, As3Tenant } from '../utils/as3Models';
import { ext } from '../extensionVariables';
import logger from '../utils/logger';


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
	declare: AdcDeclaration[] = [];

	targets: boolean = false;

	private _tasks: string[] = [];

	constructor() {
	}

	refresh(): void {
		this.as3DeclareMap = undefined;
		this.declare = [];
		this._tasks = [];
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

						if (!this.as3DeclareMap) {
							// this should never happen, but TS needs it...
							return;
						}

						// get appStats and set as tooltip
						const as3DecMap = this.as3DeclareMap[target];
						const as3DecMapStringified = jsYaml.safeDump(as3DecMap, { indent: 4 });

						treeItems.push(new AS3item(target, targetTenCount, as3DecMapStringified, 'as3Target', TreeItemCollapsibleState.Collapsed,
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
						const as3DecMapStringified = jsYaml.safeDump(appStats, { indent: 4 });

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
								const as3DecMapStringified = jsYaml.safeDump(as3DecMap, { indent: 4 });

								// get name of other tenants
								const targetRemoval = Object.keys(this.as3DeclareMap[target]).filter(key => key !== targetKey);
								// clone object to new variable
								const newDec = JSON.parse(JSON.stringify(targetDeclaration));
								// remove other tenant objects from clone
								targetRemoval.forEach(el => {
									delete newDec[el];
								});

								treeItems.push(
									new AS3item(targetKey, appCount, as3DecMapStringified, 'as3Tenant', TreeItemCollapsibleState.Collapsed,
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

						
						apps.map( async app => {
							// bunch of typing magic..
							const appDec = tenantDeclaration[element.label] as As3Tenant;
							const appStats = await as3AppStats(appDec[app[0]] as object);
							const appCount = Object.keys(appStats as object).length.toString();
							treeItems.push(
								new AS3item(app[0], appCount, toolTip, 'as3App', TreeItemCollapsibleState.Collapsed,
								{ command: '', title: '', arguments: [] })
							);
						});
					}

					treeItems = sortTreeItems(treeItems);

				} else if (element.context === 'as3App') {

					if (!this.as3DeclareMap) {
						return; // this should never happen, but TS needs it...
					}

					let as3DecMap: any;
					if (/\//.test(element.tooltip) && this.as3DeclareMap) {
						const [target, tenant] = element.tooltip.split('/');
						as3DecMap = this.as3DeclareMap[target][tenant][element.label];
					} else {
						as3DecMap = this.as3DeclareMap[element.tooltip][element.label];
					}

					Object.entries(as3DecMap).forEach(([key, value]) => {

						// since value is unknown at this point, cast it to a number, then convert to string
						const count = (value as number).toString();
						treeItems.push(
							new AS3item(key, count, '', '', TreeItemCollapsibleState.None,
								{ command: '', title: '', arguments: [] }
							)
						);
					});

					treeItems = sortTreeItems(treeItems);

				} else if (element.label === 'Tasks') {

					treeItems = this._tasks.map((task: any) => {
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

				const taskCount = this._tasks.length !== 0 ? this._tasks.length.toString() : '';

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

				treeItems.push(
					new AS3item('Tasks', taskCount, 'Get All Tasks', '', TreeItemCollapsibleState.Collapsed,
						{ command: 'f5-as3.getTask', title: '', arguments: [this._tasks] })
				);
			}
		} else {
			return Promise.resolve(treeItems);
		}
		return Promise.resolve(treeItems);
	}

	private async getTenants() {

		// await ext.f5Client?.https(`/mgmt/shared/appsvcs/declare/`)
		await ext.f5Client?.as3?.getDecs()
			.then(async (resp: any) => {

				if ( resp.status === 200) {
					// set targets boolens so we know if we are workign with targets or just tenants
					this.targets = await targetDecsBool(resp.data);
					
					// assign the raw /declare output
					this.declare = Array.isArray(resp.data) ? resp.data : [ resp.data ];
	
					// create target/tenant/app map
					this.as3DeclareMap = await mapAs3(resp.data);

				}


			});
	}

	private async getTasks() {
		// await ext.f5Client?.https(`/mgmt/shared/appsvcs/task/`)
		await ext.f5Client?.as3?.getTasks()
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

/**
 * returns true if working with targets
 * @param declare /declare endpoint output
 */
export async function targetDecsBool(declare: AdcDeclaration | AdcDeclaration[]): Promise<boolean> {

	// if array from bigiq/targets, assign, else put in array
	const declareArray: AdcDeclaration[] = Array.isArray(declare) ? declare : [declare];

	if (declareArray[0]?.target as boolean) {
		return true;
	} else {
		return false;
	}
}


/**
 * returns as3 application index of target?/tenant/app/app-stats
 * 
 * ```ts
 * 
 * ```
 * 
 * @param declare /declare endpoint output
 */
export async function mapAs3(declare: AdcDeclaration | AdcDeclaration[]): Promise<As3AppMap> {

	// if array from bigiq/targets, assign, else put in array
	const declareArray: AdcDeclaration[] = Array.isArray(declare) ? declare : [declare];

	const as3Map: As3AppMap = {};

	/**
	 * this map represents what I feel is a more modern approach to building json structures.  The F5 ATC method for building json structures heavily utilizes named objects which can be very difficult to crawl/discover, since one has to constantly loop and check to see what kind of data the key holds.  This method can be very clean and concise
	 * 
	 * The other method, which seems to be the more common method, makes the structure bigger but more predictable without having to inspect each object param to see what kind it is.  !Example, the github api has many nested objects and lists, but rarely any 'named' objects.  This predictable structure of object keys makes it way easier to type objects for typescript and get information from within the structure without having to discover each key/value (just look for the key, not inspect the keys value for another key/value pair).
	 * 
	 * This new map is not returned as part of the function output, but built within this function as a demonstration and excercise to explore both options.  The thought it to move this function to f5-conx-core and utilize across the projects
	 */
	const as3MapNew = [];

	// go through each item in the targets array
	declareArray.map((el: any) => {

		const tenants: As3AppMap = {};
		const tenantsNew: As3AppMapTenants[] = [];

		// get target if defined
		const target
			= el?.target?.address ? el.target.address
				: el?.target?.hostname ? el.target.hostname
					: undefined;

		// loop through declaration (adc) level
		Object.entries(el).forEach(([key, val]) => {

			// named object for each tenant
			if (isObject(val) && key !== 'target' && key !== 'controls') {

				let apps2: any = {};
				let appsNew: { app: string; components: {}; }[] = [];

				// loop through items of the tenant
				Object.entries(val as object).forEach(([tKey, tVal]) => {

					// if we are at an application object
					if (isObject(tVal)) {
						const appProps: any = {};

						// loop through the items of the application
						Object.entries(tVal).forEach(([aKey, aVal]) => {

							// look at the objects (application pieces)
							if (isObject(aVal) && (aVal as { class: string })?.class) {

								const appVal: { class: string } = aVal as { class: string };

								// capture the class of each application piece
								if (appVal?.class in appProps) {
									// already have this key, so add one
									appProps[appVal.class] = appProps[appVal.class] + 1;
								} else {
									// key not detected, so create it
									appProps[appVal.class] = 1;
								}
							}
						});
						apps2[tKey] = appProps;
						appsNew.push({
							app: tKey,
							components: appProps
						});
					}
				});
				tenants[key] = apps2;
				tenantsNew.push({
					tenant: key,
					apps: appsNew
				});
			}
		});

		if (target) {
			as3Map[target] = tenants;
			as3MapNew.push({
				target,
				tenants: tenantsNew
			});
		} else {
			Object.assign(as3Map, tenants);
			as3MapNew.push(...tenantsNew);
		}

	});
	return as3Map;
}


export async function as3AppsInTenant(as3Tenant: object): Promise<string[]> {
	const apps: string[] = [];

	// loop through the items of the tenant
	Object.entries(as3Tenant).forEach(([aKey, aVal]) => {
		// look at the objects (application pieces)
		if (isObject(aVal)) {
			apps.push(aKey);
		}
	});

	return apps;
}

export async function as3AppStats(as3App: object): Promise<object | undefined> {

	const appProps: any = {};

	// loop through the items of the application
	Object.entries(as3App).forEach(([aKey, aVal]) => {

		// look at the objects (application pieces)
		if (isObject(aVal) && (aVal as { class: string })?.class) {

			const appVal: { class: string } = aVal as { class: string };

			// capture the class of each application piece
			if (appVal?.class in appProps) {
				// already have this key, so add one
				appProps[appVal.class] + 1;
			} else {
				// key not detected, so create it
				appProps[appVal.class] = 1;
			}
		}
	});

	return appProps;
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

/**
 * checks if input is object
 * 
 * ***an array is an object!!! ***
 * - use Array.isArray(x) => boolean
 * @param x 
 * @returns boolean
 */
export function isObject(x: any): boolean {
	return ( x !== null && typeof x === 'object' ? true : false);
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