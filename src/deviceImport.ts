

import * as fs from 'fs';
import * as path from 'path';
import { isArray, isString } from 'util';
import { ConfigurationTarget, window, workspace } from 'vscode';
import { ext } from './extensionVariables';
import logger from './utils/logger';
import { isValidJson } from './utils/utils';




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
 * @param path
 */
export async function deviceImportOnLoad(extPath: string) {

    // // look for seed file
    // const seedFile = '.vscode-f5';
    // // const seedPath = path.join(path, seedFile);
    // const files = fs.statSync(seedPath);

    let seedContent: string = '';
    try {
        // try to find/read the seed file
        seedContent = fs.readFileSync(path.join(extPath, '.vscode-f52.json'), 'utf-8');
        logger.debug('device seed file detected');
    } catch (e) {
        return logger.debug('device seed file not found', e.message);
    }
    
    
    const q = await window.showInformationMessage('Device seed file detected, would you like to import?', 'Yes', 'No');
    // const y = await window.showInformationMessage('found device import file', );

    if (q === 'Yes' && seedContent) {

        // read seed file
        // pass to, call deviceImport 
        deviceImport(seedContent);

    } else if (q === 'No' || q === undefined) {
        logger.debug('device seed import declined by user');
    }
    
    console.log(q);

    // upon successful import, delete file?

}

type CfgDevice = {
    device: string,
    password?: string,
    provider?: string
};

export async function deviceImport(seed: string) {
    // .vscode-f5_devices
    // update to detect an array or object
        // if array - process each item like its just a device name
        // if object process each object with properties, like password

    // let bigipHosts: {device: string} [] | undefined = await workspace.getConfiguration().get('f5.hosts');
    
    // const deviceRex = /^[\w-.]+@[\w-.]+(:[0-9]+)?$/;
    // const devicesString = JSON.stringify(bigipHosts);

    const seedList2 = parse(seed);

    let seedList: CfgDevice[] = [];
    try {
        // const string = JSON.stringify(seed);
        seedList = isValidJson(seed);
    } catch (e) {
        console.log('failed to JSON parse seed - keeping as string: ', e.message);
        // seed = seed;
        console.log('we got a string: ', seed);
        // add a single device
        addDevice({ device: seed });
    }

    if ( seedList ) {
        // if array, assume it's a list of device names like ["admin@192.168.1.1", "..."]
        // loop through array and add each one to config

        seedList.forEach(async (el: string | CfgDevice) => {
            let password = '';
            if (typeof el === 'string') {
                addDevice({ device: el });
            } else {
                addDevice(el);
            }
        });
        // console.log('we got an array: ', seed);

    } else {
        console.log('we got an object - not supported', seed);
    }

    function parse (seed: string) {

        let seedList;
        try {
            // const string = JSON.stringify(seed);
            seedList = isValidJson(seed);
        } catch (e) {
            console.log('failed to JSON parse seed - keeping as string: ', e.message);
            // seed = seed;
            console.log('we got a string: ', seed);
            // add a single device
            addDevice({ device: seed });
        }
    }

}



async function addDevice (device: {device: string, provider?: string, password?: string}) {

    let bigipHosts: {device: string} [] | undefined = await workspace.getConfiguration().get('f5.hosts');

    if (bigipHosts === undefined) {
        // throw new Error('no devices in config?');
        bigipHosts = [];
    }

    // the following is a quick and dirty way to search the entire 
    //	devices config obj for a match without having to check each piece

    const deviceRex = /^[\w-.]+@[\w-.]+(:[0-9]+)?$/;		// matches any username combo an F5 will accept and host/ip
    const devicesString = JSON.stringify(bigipHosts);
    let password = '';

    if (device.password) {
        // extract password from object
        password = device.password;
        delete device.password;
    }


    if (!devicesString.includes(`\"${device.device}\"`) && deviceRex.test(device.device)){
        bigipHosts.push(device);
        await workspace.getConfiguration().update('f5.hosts', bigipHosts, ConfigurationTarget.Global);

        console.log(`${device.device} added to device configuration`);


        if (password) {
            // extract password from object
            ext.keyTar.setPassword('f5Hosts', device.device, password);
            console.log(`password added for ${device.device}`);
        }

        // Promise.resolve('yes');
        return console.log(`${device.device} added to device configuration`);
    } else {
        console.log('device import failed', device.device);
        // return 'FAILED - Already exists or invalid format: <user>@<host/ip>';
        // Promise.resolve('');
        return;
    }
    
}

async function importPassword (device: string, password: string) {

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