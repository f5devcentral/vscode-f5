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

export function isValidJson(json: string) {
    try {
        return JSON.parse(json);
        // return true;
    } catch (e) {
        return false;
    }
}

/**
 * Return currently selected device, or prompts to select one
 */
// export async function getDevice(): Promise<any> {

//     // if device in statusBar, return that
//     const device: string = ext.hostStatusBar.text;
//     // console.log(`getDevice from hostStatusBar: ${device}`);
    
//     // if not, get device list from config and prompt to select device
//     //  select device and connect
//     if (!device) {
//         const bigipHosts: vscode.QuickPickItem[] | undefined = await vscode.workspace.getConfiguration().get('f5.hosts');
		
//         if (bigipHosts === undefined) {
//             // should kick off "add device"
//             throw new Error('no hosts in configuration');
//         }
//         // console.log(`getDevice devices from config: ${JSON.stringify(bigipHosts)}`);

//         const device = await vscode.window.showQuickPick(bigipHosts, {placeHolder: 'Select Device'});

//         if (device === undefined) {
//                 // should kick off "add device"
//                 throw new Error('no hosts in configuration');
//             }

//         // console.log(`getDevice from quickPick: ${device}`);

//         if (!device) {
//             throw new Error('user exited device input');
//         }

//         // fire connectF5 to establish all the other details:
//         // const host: string = device;
//         // const password = await getPassword(device);
//         // f5API.connectF5(host, password);
//         return device;
//     }
//     // console.log(`getDevice returning: ${device}`);
//     return device;
// }




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





/**
 * Checks to see if DO dec contains ("async": false)
 * if not async, pop up warning message
 * @param dec posting DO dec
 */
// export function isDoDecAsync(dec: Dec) {
//     // if dec object contains "async": false,
//     //  then show erro message



//     if((dec.hasOwnProperty('async') && dec.async === false) || !dec.hasOwnProperty('async')) {
//         vscode.window.showWarningMessage('async DO post highly recommended!!!')
//     }

    // console.log(dec.hasOwnProperty('async'));
    

    // if('async' in dec) {
    //     if(dec.async = false) {
            
    //     }
    // }


// }