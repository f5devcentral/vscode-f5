import * as vscode from 'vscode';
import { ext } from '../extensionVariables';


export function setHostStatusBar(host: string = '', tip: string = '') {

    // // Create a status bar item
    // had ideas of passing in host details at connect, like tmos version and running ilx packages/versions

    ext.hostStatusBar.command = 'f5-fast.disconnect';
    ext.hostStatusBar.text = host ? host || '' : '';
    // ext.hostStatusBar.password = password ? password || '' : '';
    ext.hostStatusBar.tooltip = tip ? tip || '' : '';

    if (host) {
        ext.hostStatusBar.show();
    } else {
        ext.hostStatusBar.hide();
    }

};

// export function getHostStatusBar() {
//     // console.log(`hostStatusBar details: ${JSON.stringify(ext.hostStatusBar)}`);
//     return { host: ext.hostStatusBar.text, password: ext.hostStatusBar.password }
// };

export function isValidJson(json: string) {
    try {
        JSON.parse(json);
        return true;
    } catch (e) {
        return false;
    }
}

export async function getPassword(device: string): Promise<any> {

    // console.log(`getPassword Device: ${device}`);
    
    let password = await ext.keyTar.getPassword('f5Hosts', device).then( passwd => passwd )
    
    // console.log(`IS PASSWORD IN KEYTAR?: ${password}`);
    if (!password) {
        // console.log(`NO PASSWORD IN KEYTAR! - PROMPTING!!! - ${password}`);
        password = await vscode.window.showInputBox({ password: true})
        .then( password => {
            if (!password) {
                throw new Error('User cancelled password input')
            }
            // console.log(`USER INPUT PASSWORD!!! - ${password}`);
            return password;
            })
    }
    // console.log(`PASSWORD BOUT TO BE RETURNED!!! - ${password}`);
    return password;
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