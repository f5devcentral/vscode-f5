/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';

import {
    commands,
    ExtensionContext,
    ProgressLocation,
    window
} from 'vscode';

import { ext } from './extensionVariables';
import * as utils from './utils/utils';
// import {
//     DoDeclartion,
//     DeviceDeclartion
// } from 'f5-conx-core';
import { logger } from './logger';

/**
 * ```
 * #########################################################################
 *
 *           █████    ██████  
 *			 ██   ██ ██    ██ 
 *			 ██   ██ ██    ██ 
 *			 ██   ██ ██    ██ 
 *			 █████    ██████  
 * 			
 * #########################################################################
 * http://patorjk.com/software/taag/#p=display&h=0&f=ANSI%20Regular&t=DO
 * 
 * registers DO commands in vscode
 * 
 * ```
 */
export class DoCore {

    constructor(context: ExtensionContext) {

        context.subscriptions.push(commands.registerCommand('f5-do.getDec', async () => {

            await window.withProgress({
                location: ProgressLocation.Notification,
                title: `Getting DO Dec`
            }, async () => {

                await ext.f5Client?.do?.get()
                    .then(resp => ext.panel.render(resp));

            });


        }));

        context.subscriptions.push(commands.registerCommand('f5-do.postDec', async () => {

            await window.withProgress({
                location: ProgressLocation.Notification,
                title: `Posting DO Dec`
            }, async () => {

                await utils.getText()
                    .then(async text => {

                        // convert text into json
                        let dec = utils.isValidJson(text);

                        if (!dec) {
                            // if not valid json, return error message
                            return window.showErrorMessage('Not valid JSON object');
                        }

                        // testing this new function provided by f5-conx-core
                        logger.info('is DO declaration async? =>', ext.f5Client?.do?.isAsync(dec));

                        // inspect json dec for async param
                        if (!ext.f5Client?.do?.isAsync(dec)) {
                            window.showWarningMessage('async DO post highly recommended!!!');
                        }

                        // old way I was checking DO declaration for async post (now using above)
                        // if (dec.class === 'DO' && (dec.declaration.async === false || dec.declaration.async === undefined)) {
                        //     window.showWarningMessage('async DO post highly recommended!!!');
                        // } else if (dec.class === 'Device' && (dec.async === false || dec.async === undefined)) {
                        //     window.showWarningMessage('async DO post highly recommended!!!');
                        // }

                        await ext.f5Client?.do?.post(dec)
                            .then(resp => ext.panel.render(resp) );
                    });


            });

        }));


        context.subscriptions.push(commands.registerCommand('f5-do.inspect', async () => {

            await window.withProgress({
                location: ProgressLocation.Notification,
                title: `Getting DO Inspect`
            }, async () => {

                await ext.f5Client?.do?.inpsect()
                    .then(resp => ext.panel.render(resp));

            });

        }));



        context.subscriptions.push(commands.registerCommand('f5-do.getTasks', async () => {

            await window.withProgress({
                location: ProgressLocation.Notification,
                title: `Getting DO Tasks`
            }, async () => {

                await ext.f5Client?.do?.task()
                    .then(resp => ext.panel.render(resp));

            });
        }));
    }

}

