

import { window, ProgressLocation } from 'vscode';
import * as path from 'path';

import { ext } from "./extensionVariables";
import BigipConfig from 'project-corkscrew/dist/ltm';
import { CfgProvider } from './treeViewsProviders/cfgTreeProvider';
import logger from './utils/logger';

// import BigipConfig from 'project-corkscrew/dist/ltm';




export async function getMiniUcs (): Promise<string|undefined> {

    return await window.withProgress({
        location: ProgressLocation.Notification,
        title: `Getting Configuration from BIG-IP`,
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            // this logs but doesn't actually cancel...
            logger.debug("User canceled External API Request");
            return new Error(`User canceled External API Request`);
        });

        progress.report({ message: `Saving config on box`});
        
        //external call
        // logger.debug('external call -> ');
        // return await extAPI.makeRequest(text);
        
        
        // /**
        //  * save config before capturing mini_ucs!!!
        //  *  over bash api: tmsh save sys config
        //  * 	or POST /mgmt/tm/sys/config { "command":"save" }
        //  */
        await ext.mgmtClient?.makeRequest('/mgmt/tm/sys/config', {
            method: 'POST',
            body: {
                command: 'save'
            }
        });
        
        
        const tempFile = `mini_ucs.tar.gz`;
        
        progress.report({ message: `Downloading config`});
        
        // build mini ucs
        await ext.mgmtClient?.makeRequest(`/mgmt/tm/util/bash`, {
            method: 'POST',
            body: {
                command: 'run',
                utilCmdArgs: `-c 'tar -czf /shared/images/${tempFile} /config/bigip.conf /config/bigip_base.conf /config/partitions'`
            }
        });
        
        const coreDir = ext.context.extensionPath;
        const zipDown = path.join(coreDir, tempFile);

        try {
            await ext.mgmtClient?.download(tempFile, zipDown);
            return zipDown;
        } catch (e) {
            logger.error('mini_ucs download error', e.message);
            return undefined;
        }
    });

} 

export async function makeExplosion (file: string) {


    return await window.withProgress({
        location: ProgressLocation.Notification,
        title: `BIG-IP Config Explorer - Processing`,
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            // this logs but doesn't actually cancel...
            logger.debug("User canceled External API Request");
            return new Error(`User canceled External API Request`);
        });
        
        progress.report({ message: `Unpacking Archive`});
        
        const bigipConf = new BigipConfig();

        const parsedFileEvents = [];
        const parsedObjEvents = [];
        let currentFile = '';
        bigipConf.on('parseFile', async x => { 
            parsedFileEvents.push(x);
            currentFile = `file: ${x.num} of ${x.of}`;

            // progress.report({ message: `Processing Config`});
        });
        bigipConf.on('parseObject', async x => { 
            parsedObjEvents.push(x);
            progress.report({ message: `${currentFile}\n object: ${x.num} of ${x.of}`});
        });

        const loadTime = await bigipConf.load(file);

        const parseTime = bigipConf.parse();

        const explosion = bigipConf.explode();

        return { config: bigipConf.configFiles, obj: bigipConf.configObject, explosion };
    });
    // });
}