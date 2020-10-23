

import { window } from 'vscode'




/**
 * 
 * 1. have import command, that can be executed as needed
 *  - prompt to browse to file location or just right click in explerer?
 * 
 * 2. have import that will happen on launch
 *  - if file detected, prompt for import
 *  - have a setting that:
 *      - will auto import if file detected at launch?
 *      - or disable the auto import detection process?
 * 
 */


/**
 * 
 * @param params 
 */
export async function deviceImportOnLoad() {
    
}



export async function deviceImport() {
    //do we have a workspace opened?

    // .vscode-f5_devices

    const q = await window.showInformationMessage('Device seed file detected, would you like to import?', 'Yes', 'No');
    // const y = await window.showInformationMessage('found device import file', );

    if (q === 'Yes') {

    }

    console.log(x);

    // update to detect an array or object
        // if array - process each item like its just a device name
        // if object process each object with properties, like password


}

const exampleImport = {
    devices: [
        {
            device: 'admin@192.168.1.1:8443'
        },
        {
            device: 'admin@192.168.6.5',
            password: 'giraffie'
        },
        {
            device: 'dude@10.1.3.4',
            password: 'coolness',
            provider: 'tmos'
        }
    ]
};