import { window, workspace } from 'vscode';
import { ext } from '../extensionVariables';
import { logger } from '../logger';


/**
 * display json in new editor window
 * @param item json object to display in new editor
 */
export async function displayJsonInEditor(item: object): Promise<any> {
    return workspace.openTextDocument({ 
        language: 'json', 
        content: JSON.stringify(item, undefined, 4) 
    })
    .then( doc => 
        window.showTextDocument(
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
    workspace.openTextDocument({ 
        language: 'handlebars', 
        content: JSON.stringify(item, undefined, 4) 
    })
    .then( doc => 
        window.showTextDocument(
            doc, 
            { 
                preview: false 
            }
        )
    );
}


/**
 * display text in new editor window
 * @param item string to display in new editor
 */
export async function displayInTextEditor(text: string): Promise<void> {
    workspace.openTextDocument({ 
        content: text 
    })
    .then( doc => 
        window.showTextDocument(
            doc, 
            { 
                preview: false 
            }
        )
    );
}


/**
 * validates json blob
 * @param json
 * @returns parsed json object
 */
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

    // logger.debug(`getPassword Device: ${device}`);
    
    let password = await ext.keyTar.getPassword('f5Hosts', device).then( passwd => passwd );
    
    // logger.debug(`IS PASSWORD IN KEYTAR?: ${password}`);
    if (!password) {
        // logger.debug(`NO PASSWORD IN KEYTAR! - PROMPTING!!! - ${password}`);
        password = await window.showInputBox({
            placeHolder: 'Password',
            prompt: 'Input device password:  ',
            password: true
        })
        .then( password => {
            if (!password) {
                throw new Error('User cancelled password input');
            }
            // logger.debug(`USER INPUT PASSWORD!!! - ${password}`);
            return password;
            });
    }
    // logger.debug(`PASSWORD BOUT TO BE RETURNED!!! - ${password}`);
    return password;
}

/**
 * capture entire active editor text or selected text
 */
export async function getText(): Promise<string> {

    // get editor window
    var editor = window.activeTextEditor;
    if (editor) {	
        // capture selected text or all text in editor
        if (editor.selection.isEmpty) {
            return editor.document.getText();	// entire editor/doc window
        } else {
            return editor.document.getText(editor.selection);	// highlighted text
        } 
    } else {
        logger.warn('getText was called, but no active editor... this should not happen');
        throw new Error('getText was called, but no active editor... this should not happen'); // No open/active text editor
    }
    
}