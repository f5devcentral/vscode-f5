import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
// import { F5Api } from './f5Api';

// const f5API = new f5Api();

/**
 * Host Connectivity Status Bar
 * Feed it text, it will show up
 * Feed it nothing, it will disappear!
 * @param host selected host/device from config
 */
export async function setHostStatusBar(host: string = '') {

    
    ext.hostStatusBar.command = 'f5.disconnect';
    ext.hostStatusBar.text = host ? host || '' : '';
    ext.hostStatusBar.tooltip = 'Disconnect';
    
    if (host) {
        ext.hostStatusBar.show();
        vscode.commands.executeCommand('setContext', 'f5.device', true);
    } else {
        ext.hostStatusBar.hide();
        vscode.commands.executeCommand('setContext', 'f5.device', false);
    }
};

/**
 * HostName status bar mgmt.
 * Feed it text, it will show up
 * Feed it nothing, it will disappear!
 * @param text text to display in status bar
 * @param tip text to display when hover
 */
export async function setHostnameBar(text: string = '', tip: string = '') {

    ext.hostNameBar.command = 'f5.getF5HostInfo';
    ext.hostNameBar.text = text ? text || '' : '';
    ext.hostNameBar.tooltip = tip ? tip || '' : '';

    if (text) {
        ext.hostNameBar.show();
    } else {
        ext.hostNameBar.hide();
    }

};


/**
 * Fast status bar mgmt.
 * Feed it text, it will show up
 * Feed it nothing, it will disappear!
 * @param text text to display in status bar
 * @param tip text to display when hover
 */
export async function setFastBar(text: string = '', tip: string = '') {

    ext.fastBar.command = 'f5-fast.getInfo';
    ext.fastBar.text = text ? text || '' : '';
    ext.fastBar.tooltip = tip ? tip || '' : '';

    if (text) {
        ext.fastBar.show();
        vscode.commands.executeCommand('setContext', 'f5.fastInstalled', true);
    } else {
        ext.fastBar.hide();
        vscode.commands.executeCommand('setContext', 'f5.fastInstalled', false);
    }

};



/**
 * AS3 status bar mgmt.
 * Feed it text, it will show up
 * Feed it nothing, it will disappear!
 * @param text text to display in status bar
 * @param tip text to display when hover
 */
export async function setAS3Bar(text: string = '', tip: string = '') {

    ext.as3Bar.command = 'f5-as3.getDecs';
    ext.as3Bar.text = text ? text || '' : '';
    ext.as3Bar.tooltip = tip ? tip || '' : '';

    if (text) {
        ext.as3Bar.show();
        vscode.commands.executeCommand('setContext', 'f5.as3Installed', true);
        
        // refresh trees
        vscode.commands.executeCommand('f5-as3.refreshTenantsTree');
        vscode.commands.executeCommand('f5-as3.refreshTasksTree');
    } else {
        ext.as3Bar.hide();
        vscode.commands.executeCommand('setContext', 'f5.as3Installed', false);
    }



};

/**
 * Declarative Onbaording ILX status bar mgmt.
 * Feed it text, it will show up
 * Feed it nothing, it will disappear!
 * @param text text to display in status bar
 * @param tip text to display when hover
 */
export async function setDOBar(text: string = '', tip: string = '') {

    ext.doBar.command = 'f5-do.getDec';
    ext.doBar.text = text ? text || '' : '';
    ext.doBar.tooltip = tip ? tip || '' : '';

    if (text) {
        ext.doBar.show();
        vscode.commands.executeCommand('setContext', 'f5.doInstalled', true);
    } else {
        ext.doBar.hide();
        vscode.commands.executeCommand('setContext', 'f5.doInstalled', false);
    }

};

/**
 * Telemtry Streaming ILX status bar mgmt.
 * Feed it text, it will show up
 * Feed it nothing, it will disappear!
 * @param text text to display in status bar
 * @param tip text to display when hover
 */
export async function setTSBar(text: string = '', tip: string = '') {

    ext.tsBar.command = 'f5-ts.getDec';
    ext.tsBar.text = text ? text || '' : '';
    ext.tsBar.tooltip = tip ? tip || '' : '';

    if (text) {
        ext.tsBar.show();
        vscode.commands.executeCommand('setContext', 'f5.tsInstalled', true);
    } else {
        ext.tsBar.hide();
        vscode.commands.executeCommand('setContext', 'f5.tsInstalled', false);
    }

};

/**
 * display json in new editor window
 * @param item json object to display in new editor
 */
export async function displayJsonInEditor(item: object): Promise<any> {
    vscode.workspace.openTextDocument({ 
        language: 'json', 
        content: JSON.stringify(item, undefined, 4) 
    })
    .then( doc => 
        vscode.window.showTextDocument(
            doc, 
            { 
                preview: false 
            }
        )
    );
}


/**
 * display mst in new editor window
 * @param item json object to display in new editor for mst
 */
export async function displayMstInEditor(item: object): Promise<any> {
    vscode.workspace.openTextDocument({ 
        language: 'handlebars', 
        content: JSON.stringify(item, undefined, 4) 
    })
    .then( doc => 
        vscode.window.showTextDocument(
            doc, 
            { 
                preview: false 
            }
        )
    );
}

export function isValidJson(json: string) {
    try {
        return JSON.parse(json);
        // return true;
    } catch (e) {
        return false;
    }
}




/**
 * Get password from keytar or prompt
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 */
export async function getPassword(device: string): Promise<any> {

    // console.log(`getPassword Device: ${device}`);
    
    let password = await ext.keyTar.getPassword('f5Hosts', device).then( passwd => passwd );
    
    // console.log(`IS PASSWORD IN KEYTAR?: ${password}`);
    if (!password) {
        // console.log(`NO PASSWORD IN KEYTAR! - PROMPTING!!! - ${password}`);
        password = await vscode.window.showInputBox({
            placeHolder: 'Password',
            prompt: 'Input device password:  ',
            password: true
        })
        .then( password => {
            if (!password) {
                throw new Error('User cancelled password input');
            }
            // console.log(`USER INPUT PASSWORD!!! - ${password}`);
            return password;
            });
    }
    // console.log(`PASSWORD BOUT TO BE RETURNED!!! - ${password}`);
    return password;
}

export function setMemento(key:string, value: string) {
    ext.context.globalState.update(key, value);
}

export function getMemento(key:string) {
    return ext.context.globalState.get(key);
}

export function setMementoW(key:string, value: string) {
    ext.context.workspaceState.update(key, value);
}

export function getMementoW(key:string) {
    return ext.context.workspaceState.get(key);
}
