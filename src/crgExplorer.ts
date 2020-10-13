

import { window, ProgressLocation } from 'vscode';
import * as path from 'path';

import { ext } from "./extensionVariables";
import BigipConfig from 'project-corkscrew/dist/ltm';
import { CfgProvider } from './treeViewsProviders/cfgTreeProvider';
import logger from './utils/logger';

// import BigipConfig from 'project-corkscrew/dist/ltm';



export async function makeExplosion (item: any, cfgProvider: CfgProvider) {


    await window.withProgress({
        location: ProgressLocation.Notification,
        title: `Making explosion!!!`,
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
        
        
        if (!ext.mgmtClient) {
            /**
             * loop this back into the connect flow, since we have the device, automatically connect
             */
            // await vscode.commands.executeCommand('f5.connectDevice', item.label);
            return window.showWarningMessage('Connect to BIGIP Device first');
        }
        
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
        // let dst;
        try {
            await ext.mgmtClient.download(tempFile, zipDown);
            
        } catch (e) {
            console.log('mini_ucs download error', e.message);
        }
        
        progress.report({ message: `Processing Config`});
        
        const bigipConf = new BigipConfig();

        const parsedFileEvents = [];
        const parsedObjEvents = [];
        bigipConf.on('parseFile', x => parsedFileEvents.push(x) );
        bigipConf.on('parseObject', x => parsedObjEvents.push(x) );

        const loadTime = await bigipConf.load(zipDown);

        const parseTime = bigipConf.parse();

        const explosion = bigipConf.explode();

        cfgProvider.explodeConfig(bigipConf.configFiles, bigipConf.configObject, explosion);
        });
}