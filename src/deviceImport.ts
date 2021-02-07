

import * as fs from 'fs';
import * as path from 'path';
import { ConfigurationTarget, window, workspace } from 'vscode';
import { ext } from './extensionVariables';
import { F5TreeProvider } from './treeViewsProviders/hostsTreeProvider';
import logger from './utils/logger';
import { isValidJson } from './utils/utils';


/**
 * Looks for device seed file based on path
 *  if found, prompt user to import
 * @param path of extension core dir
 */
export async function deviceImportOnLoad(extPath: string, hostsTreeProvider: F5TreeProvider) {

    let seedContent: string = '';

    try {
        // try to find/read the seed file
        seedContent = fs.readFileSync(path.join(extPath, '.vscode-f5.json'), 'utf-8');
        logger.debug('device seed file detected');

        /**
         * can also look into searching a workspace if there is one at start up
         */
    } catch (e) {
        // 2.7.2021 -> disabled this log message since it was causing confusion
        // return logger.debug('device seed file not found', e.message);
    }
        
    const q = await window.showInformationMessage('Device seed file detected, would you like to import?', 'Yes', 'Yes-Consume', 'No');
    // const y = await window.showInformationMessage('found device import file', );

    if (q === 'Yes' && seedContent) {

        // read seed file
        // pass to, call deviceImport 
        await deviceImport(seedContent);

    } else if (q === 'Yes-Consume' && seedContent) {

        // read seed file -> import
        await deviceImport(seedContent);

        // user selected consume -> delete file
        setTimeout( () => { 

            logger.debug('Deleting seed file at', path.join(extPath, '.vscode-f5.json'));
            fs.unlinkSync(path.join(extPath, '.vscode-f5.json'));

        }, 2000);

    } else if (q === 'No' || q === undefined) {
        logger.debug('device seed import declined by user');
    }
    
    // Refresh hosts tree to show new devices
    setTimeout( () => { hostsTreeProvider.refresh();}, 1000);
}

type CfgDevice = {
    device: string,
    password?: string,
    provider?: string
};

/**
 * imports device list to user config file
 * 
 *  acceptable inputs as strings:
 *      - 'admin@1.1.1.1'
 *      - ['admin@1.1.1.1', 'usr1@2.2.2.2:8443', ...]
 *      - [{ device: 'admin@4.4.4.4', password: 'pizzaTower', provider: 'tmos' }, ...]
 * 
 * @param seed file as a string
 */
export async function deviceImport(seed: string) {

    // converts the different input structurs to a standard object list
    const seedList2 = await parseDeviceLoad(seed);

    await seedList2.forEach((el: CfgDevice) => {
         addDevice(el);
    });

    // outputKeytar();
    return;
}


/**
 * converts seed file to standard format for importing
 *  acceptable inputs:
 *      - 'admin@1.1.1.1'
 *      - ['admin@1.1.1.1', 'usr1@2.2.2.2:8443', ...]
 *      - [{ device: 'admin@4.4.4.4', password: 'pizzaTower', provider: 'tmos' }, ...]
 * 
 * had to wrap in a function to provde a standard typed output
 * 
 * @param seed file as a string
 */
export async function parseDeviceLoad (seed: string) {

    // trim any leading and trailing spaces
    seed = seed.trim();

    const seedList = isValidJson(seed);

    if (seedList) {
        return seedList.map( (el: string | CfgDevice) => {

            if (typeof el === 'string') {

                // convert single string
                return { device: el };
            } else {
                
                // should be an object in the format we already need
                return el;
            }
        });
    } else {
        logger.info('failed to parse seed as JSON - returning single device as string');
        return [{ device: seed }];
    }
}


/**
 * Adds device to config
 * @param device 
 */
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

        if (password) {
            // inject password to cache
            await importPassword(device.device, password);
            logger.debug(`password added for ${device.device}`);
        }

        logger.debug(`${device.device} added to device configuration`);
        return;

    } else {

        logger.debug('device import failed on', device.device);
        return;
    }
    
}

async function importPassword (device: string, password: string) {
    return await ext.keyTar.setPassword('f5Hosts', device, password);
}


/**
 * following is only used for troubleshooting...
 */
async function outputKeytar () {
    ext.keyTar.findCredentials('f5Hosts').then( list => {
        // map through and delete all
        list.map(item => {
            const psswd = ext.keyTar.getPassword('f5Hosts', item.account);
            console.log('***KEYTAR OUTPUT***', JSON.stringify(item));
        });
    });
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