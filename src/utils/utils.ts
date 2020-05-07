import * as vscode from 'vscode';
import { ext } from '../extensionVariables';


export function setHostStatusBar(host: string = '', password: string = '', tip: string = '') {

    // // Create a status bar item
	// const hostStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	// context.subscriptions.push(hostStatusBar);

    ext.hostStatusBar.command = 'f5-fast.disconnect';
    ext.hostStatusBar.text = host ? host || '' : '';
    ext.hostStatusBar.password = password ? password || '' : '';
    ext.hostStatusBar.tooltip = tip ? tip || '' : '';

    if (host && password) {
        ext.hostStatusBar.show();
    } else {
        ext.hostStatusBar.hide();
    }

};

export function getHostStatusBar() {

    // console.log(`hostStatusBar details: ${JSON.stringify(ext.hostStatusBar)}`);

    return { host: ext.hostStatusBar.text, password: ext.hostStatusBar.password }

};

export function isValidJson(json: string) {
    try {
        JSON.parse(json);
        return true;
    } catch (e) {
        return false;
    }
}

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