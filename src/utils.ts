import * as vscode from 'vscode';
import { ext } from './extVariables';


export function setHostStatusBar(bar: vscode.StatusBarItem, host: string = '', password: string = '', tip: string = '') {

    // // Create a status bar item
	// const hostStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	// context.subscriptions.push(hostStatusBar);

    bar.command = 'f5-fast.disconnect';
    bar.text = host ? host || '' : '';
    bar.password = password ? password || '' : '';
    bar.tooltip = tip ? tip || '' : '';

    if (host && password) {
        bar.show();
    } else {
        bar.hide();
    }

};

export function setMemento(key:string, value: string) {
    ext.context.globalState.update(key, value)
}

export function getMemento(key:string) {
    return ext.context.globalState.get(key)
}

export function setMementoW(key:string, value: string) {
    ext.context.workspaceState.update(key, value)
}

export function getMementoW(key:string) {
    return ext.context.workspaceState.get(key)
}