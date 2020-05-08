import * as vscode from 'vscode';
import { ext } from './extensionVariables'


// setting up tree view stuff
// define the class, treeData, and functions, then register at the end
  
export class carTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {

    onDidChangeTreeData?: vscode.Event<TreeItem|null|undefined>|undefined;

    data: TreeItem[];

    // const cars = { 
    //     vehicles: 'cars'
    // }

    // constructor(private workspaceRoot: string) {
    // }

    constructor() {
        this.data = [new TreeItem('cars', [
        new TreeItem(
            'Ford', [new TreeItem('Fiesta'), new TreeItem('Focus'), new TreeItem('Mustang')]),
        new TreeItem(
            'BMW', [new TreeItem('320'), new TreeItem('X3'), new TreeItem('X5')])
        ])];
    }


    getTreeItem(element: TreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
        console.log(`CARS element in getTreeItem ~~~~~ ${JSON.stringify(element)}`);
        return element;
    };

    getChildren(element?: TreeItem|undefined): vscode.ProviderResult<TreeItem[]> {
        
        const data = ext.carTreeData;

        if (element === undefined) {
            console.log(`CARS this.data in getChildren ----- ${JSON.stringify(this.data)}`);
            return this.data;
        }
        console.log(`CARS element.children in getChildren ***** ${JSON.stringify(element.children)}`);
        return element.children;
    }
};

class TreeItem extends vscode.TreeItem {
    children: TreeItem[]|undefined;

    constructor(label: string, children?: TreeItem[]) {
        super(
            label,
            children === undefined ? vscode.TreeItemCollapsibleState.None :
                                    vscode.TreeItemCollapsibleState.Expanded);
        this.children = children;
    }
};