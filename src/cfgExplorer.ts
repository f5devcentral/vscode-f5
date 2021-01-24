

import { window, ProgressLocation } from 'vscode';
import * as path from 'path';

import { ext } from "./extensionVariables";
import BigipConfig from 'f5-corkscrew/dist/ltm';
import logger from './utils/logger';





export async function getMiniUcs(): Promise<string | undefined> {

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

        progress.report({ message: `Saving config on device` });
        logger.debug('Saving config on F5 using bash api, "tmsh save sys config"');

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

        progress.report({ message: `Collecting -> Downloading configs` });

        // build mini ucs
        const ucsCmd = 'tar -czf /shared/images/${tempFile} /config/bigip.conf /config/bigip_base.conf /config/partitions';
        logger.debug(`building mini_ucs on device with following command over bash api: ${ucsCmd}`);
        await ext.mgmtClient?.makeRequest(`/mgmt/tm/util/bash`, {
            method: 'POST',
            body: {
                command: 'run',
                utilCmdArgs: `-c '${ucsCmd}'`
            }
        });

        const coreDir = ext.context.extensionPath;
        const zipDown = path.join(coreDir, tempFile);

        try {
            const resp = await ext.mgmtClient?.download(tempFile, zipDown);
            logger.debug(`Should have downloaded new mini_ucs: ${zipDown}`);
            return zipDown;
        } catch (e) {
            logger.error('mini_ucs download error', e.message);
            return undefined;
        }
    });

}

export async function makeExplosion(file: string) {


    return await window.withProgress({
        location: ProgressLocation.Notification,
        title: `BIG-IP Config Explorer -> Processing`,
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            // this logs but doesn't actually cancel...
            logger.debug("User canceled External API Request");
            return new Error(`User canceled External API Request`);
        });

        progress.report({ message: `Unpacking Archive` });

        // look at moving this to the cfgExplorer view so further functions can be called after inintial explode (ie. add-defaults/add-file and possibly only extract the app details when clicked by user)  This would make troubleshooting easier by isolating app extractions
        const bigipConf = new BigipConfig();

        const parsedFileEvents = [];
        const parsedObjEvents = [];
        const extractAppEvents = [];
        let currentFile = '';
        bigipConf.on('parseFile', async x => {
            parsedFileEvents.push(x);
            currentFile = `file: ${x.num} of ${x.of}`;

            // progress.report({ message: `Processing Config`});
        });
        bigipConf.on('parseObject', async x => {
            parsedObjEvents.push(x);
            progress.report({ message: `${currentFile}\n object: ${x.num} of ${x.of}` });
            logger.debug(`Corkscrew parsing ${currentFile}, object: ${x.num} of ${x.of}`);
        });

        bigipConf.on('extractApp', async x => {
            extractAppEvents.push(x);
            logger.debug(`Corkscrew extracting app: ${x.app}, took: ${x.time}`);
        });

        logger.debug(`Corkscrew -> Loading files`);

        // load the .conf/ucs/qkview
        return await bigipConf.load(file)
            .then(async _ => {

                logger.debug(`Corkscrew -> Parsing files`);
                progress.report({ message: `Parsing Configs` });

                // then parse the configs
                return await bigipConf.parse()
                    .then(async () => {

                        // then extract apps
                        const explosion = await bigipConf.explode()
                            .then(exp => {
                                logger.debug(`Corkscrew -> explosion stats:`, JSON.stringify(exp.stats, undefined, 4));
                                return exp;
                            })
                            .catch(err => {
                                logger.error(err);
                            });

                        return { obj: bigipConf.configObject, explosion };
                    });
            });
    });
}