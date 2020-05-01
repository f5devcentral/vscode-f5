import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class F5TreeProvider implements vscode.TreeDataProvider<f5Host> {

	private _onDidChangeTreeData: vscode.EventEmitter<f5Host | undefined> = new vscode.EventEmitter<f5Host | undefined>();
	readonly onDidChangeTreeData: vscode.Event<f5Host | undefined> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: f5Host): vscode.TreeItem {
		return element;
	}

	getChildren(element?: f5Host): Thenable<f5Host[]> {
		// if (!this.workspaceRoot) {
        //     vscode.window.showInformationMessage('No dependency in empty workspace');
        //     console.log(`!this.workspaceRoot: ${this.workspaceRoot}`)
        //     console.log(`!this.workspaceRoot-element: ${element}`)
		// 	return Promise.resolve([]);
		// }
        
        const bigipHosts = vscode.workspace.getConfiguration().get('f5-fast.hosts');
        console.log(`bigips: ${JSON.stringify(bigipHosts)}`);
        
        // const data = fs.readFileSync(path.resolve(__dirname, '../src/hosts.json'), 'utf8');
        // console.log(`fileData: ${data}`);
        // const data2 = JSON.parse(data);
        // console.log(`fileDataAsJSON: ${data2}`);
        // const data3 = JSON.stringify(data2);
        // console.log(`fileDataAsJSON: ${data3}`);
        

        
        const toDep = (name: string): f5Host => {
            // const createHost = 
            const newDep = new f5Host(name, vscode.TreeItemCollapsibleState.None, {
                command: 'f5-fast.connectDevice',
                title: 'DepTitle',
                arguments: [name]
            });
            console.log(`newDep host1: ${JSON.stringify(newDep)}`);
            return newDep;
        }

        const depsAgain = bigipHosts.map(host => toDep(host));

        console.log(`depsAgain full: ${JSON.stringify(depsAgain)}`);

        // return Promise.resolve(data2);
        return Promise.resolve(depsAgain);

        // const hostDep = new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed);

		// if (element) {
        //     console.log(`element in getChildren: ${element}`)
		// 	return Promise.resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')));
		// } else {
        //     const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
        //     console.log(`packageJsonPath: ${packageJsonPath}`)
            
		// 	if (this.pathExists(packageJsonPath)) {
        //         const packageStuff = this.getDepsInPackageJson(packageJsonPath);
        //         console.log(`\r\npackageStuff: ${JSON.stringify(packageStuff)}`)
		// 		// return Promise.resolve(packageStuff);
		// 		return Promise.resolve(data2);
		// 	} else {
		// 		vscode.window.showInformationMessage('Workspace has no package.json');
		// 		return Promise.resolve([]);
		// 	}
		// }

	}
    

	/**
	 * Given the path to package.json, read all its dependencies and devDependencies.
	 */
	// private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
	// 	if (this.pathExists(packageJsonPath)) {
    //         const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));



	// 		const toDep = (moduleName: string, version: string): Dependency => {
	// 			if (this.pathExists(path.join(this.workspaceRoot, 'node_modules', moduleName))) {
    //                 const firstDep = new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed);
    //                 console.log(`firstDep: ${JSON.stringify(firstDep)}`)
    //                 return firstDep;
	// 			} else {
    //                 const secondDep = new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.None, {
	// 					command: 'extension.openPackageOnNpm',
	// 					title: '',
	// 					arguments: [moduleName]
    //                 });
    //                 console.log(`secondDep: ${JSON.stringify(secondDep)}`)
    //                 return secondDep; 
	// 			}
	// 		};
            
	// 		const deps = packageJson.dependencies
    //         ? Object.keys(packageJson.dependencies).map(dep => toDep(dep, packageJson.dependencies[dep]))
    //         : [];
	// 		const devDeps = packageJson.devDependencies
    //         ? Object.keys(packageJson.devDependencies).map(dep => toDep(dep, packageJson.devDependencies[dep]))
    //         : [];
    //         const fullDeps = deps.concat(devDeps);
    //         console.log(`\r\nfullDep List: ${JSON.stringify(fullDeps)}`)
    //         return fullDeps;
	// 	} else {
	// 		return [];
	// 	}
	// }

	// private pathExists(p: string): boolean {
	// 	try {
	// 		fs.accessSync(p);
	// 	} catch (err) {
	// 		return false;
	// 	}
	// 	return true;
	// }
}

export class f5Host extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		// private version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return `Connect`;
	}

	// get description(): string {
	// 	return 'descLoc';
	// }

	// iconPath = {
	// 	light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
	// 	dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	// };

    // contextValue = 'dependency';
    
}

// export class Dependency extends vscode.TreeItem {

// 	constructor(
// 		public readonly label: string,
// 		private version: string,
// 		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
// 		public readonly command?: vscode.Command
// 	) {
// 		super(label, collapsibleState);
// 	}

// 	// get tooltip(): string {
// 	// 	return `tooltip-version`;
// 	// }

// 	// get description(): string {
// 	// 	return 'descLoc';
// 	// }

// 	// iconPath = {
// 	// 	light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
// 	// 	dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
// 	// };

// 	// contextValue = 'dependency';

// }
