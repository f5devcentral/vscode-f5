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
import {
    DoDecParent,
    DoDecDevice,
    cfDeclaration
} from 'f5-conx-core';
import { logger } from './logger';

/**
 * ```
 * #########################################################################
 *
 *      
 *       ██████ ███████ 
 *      ██      ██      
 *      ██      █████   
 *      ██      ██      
 *       ██████ ██      
 *                      
 *                      
 * #########################################################################
 * http://patorjk.com/software/taag/#p=display&h=0&f=ANSI%20Regular&t=CF
 * 
 * registers CF commands in vscode
 * 
 * ```
 */
export class CfCore {

    constructor(context: ExtensionContext) {

        context.subscriptions.push(commands.registerCommand('f5-cf.inspect', async () => {

            await window.withProgress({
                location: ProgressLocation.Notification,
                title: `Getting CF inspect`
            }, async () => {

                await ext.f5Client?.cf?.inspect()
                    .then(resp => ext.panel.render(resp));

            });


        }));

        context.subscriptions.push(commands.registerCommand('f5-cf.getDec', async () => {

            await window.withProgress({
                location: ProgressLocation.Notification,
                title: `Getting CF Dec`
            }, async () => {

                await ext.f5Client?.cf?.getDeclare()
                    .then(resp => ext.panel.render(resp));

            });


        }));

        context.subscriptions.push(commands.registerCommand('f5-cf.postDec', async () => {

            await window.withProgress({
                location: ProgressLocation.Notification,
                title: `Posting CF Dec`
            }, async () => {

                await utils.getText()
                    .then(async text => {

                        // convert text into json
                        let dec: cfDeclaration = utils.isValidJson(text);

                        if (!dec) {
                            // if not valid json, return error message
                            return window.showErrorMessage('Not valid JSON object');
                        }

                        await ext.f5Client?.cf?.postDeclare(dec)
                            .then(resp => ext.panel.render(resp) );
                    });


            });

        }));


        context.subscriptions.push(commands.registerCommand('f5-cf.getTrigger', async () => {

            await window.withProgress({
                location: ProgressLocation.Notification,
                title: `Getting CF Trigger details`
            }, async () => {

                await ext.f5Client?.cf?.getTrigger()
                    .then(resp => ext.panel.render(resp));

            });

        }));



        context.subscriptions.push(commands.registerCommand('f5-cf.triggerDryRun', async () => {

            await window.withProgress({
                location: ProgressLocation.Notification,
                title: `Posting CF Trigger as Dry-Run`
            }, async () => {

                await ext.f5Client?.cf?.trigger('dry-run')
                    .then(resp => ext.panel.render(resp));

            });
        }));

        context.subscriptions.push(commands.registerCommand('f5-cf.trigger', async () => {

            await window.withProgress({
                location: ProgressLocation.Notification,
                title: `Posting CF Trigger as Execute`
            }, async () => {

                await ext.f5Client?.cf?.trigger()
                    .then(resp => ext.panel.render(resp));

            });
        }));

        context.subscriptions.push(commands.registerCommand('f5-cf.reset', async () => {

            await window.withProgress({
                location: ProgressLocation.Notification,
                title: `Posting CF RESET`
            }, async () => {

                await ext.f5Client?.cf?.reset()
                    .then(resp => ext.panel.render(resp));

            });
        }));
    }

}

