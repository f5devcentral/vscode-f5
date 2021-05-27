/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';

import { AxiosError } from "axios";
import {
    commands,
    ExtensionContext,
    window
} from "vscode";
import { ext } from "./extensionVariables";
import { BigiqTreeProvider } from "./treeViewsProviders/bigiqTreeProvider";
import logger from "./utils/logger";
import { getText } from "./utils/utils";


export class BigiqCore {

    constructor(context: ExtensionContext) {

        const iqProvider = new BigiqTreeProvider(context);
        const iqTreeView = window.createTreeView('iqView', {
            treeDataProvider: iqProvider,
            showCollapseAll: true,
            canSelectMany: false
        });

        context.subscriptions.push(commands.registerCommand('f5.iqViewShow', async (el) => {

            if (el.selfLink && el.type === 'app') {

                // overwrite the id with the full app details from response
                el = await iqProvider.getApp(el.selfLink)
                    .catch(err => logger.error('f5.iqViewShow:', err));


            } else if (el.script) {
                iqProvider.render([], el);
            } else {
                iqProvider.render(el);
            }
        }));

        context.subscriptions.push(commands.registerCommand('f5.iqPostTemplate', async () => {
            await getText()
                .then(async text => {
                    await iqProvider.postTemplate(text);
                })
                .catch(err => logger.error('f5.iqPostTemplate failed with', err));
        }));

        context.subscriptions.push(commands.registerCommand('f5.iqTemplatePublish', async (item) => {
            await iqProvider.publishTemplate(item)
                .catch(err => logger.error('f5.iqTemplatePublish failed with', err));
        }));

        context.subscriptions.push(commands.registerCommand('f5.iqTemplateDelete', async (item) => {
            await iqProvider.deleteTemplate(item)
                .catch(err => logger.error('f5.iqTemplateDelete failed with', err));
        }));

        context.subscriptions.push(commands.registerCommand('f5.iqAppMoveApp', async (item) => {
            await iqProvider.moveApp(item)
                .catch(err => logger.error('f5.iqAppMoveApp failed with', err));
        }));

        context.subscriptions.push(commands.registerCommand('f5.iqAppDelete', async (item) => {
            await iqProvider.deleteApp(item)
                .catch(err => logger.error('f5.iqAppDelete failed with', err));
        }));

        context.subscriptions.push(commands.registerCommand('f5.iqViewRefresh', async () => {
            iqProvider.refresh();
        }));



        context.subscriptions.push(commands.registerCommand('f5.iqScriptDelete', async (item) => {
            await iqProvider.deleteScript(item)
                .catch(err => logger.error('f5.iqScriptDelete failed with', err));
        }));

        context.subscriptions.push(commands.registerCommand('f5.iqScriptPost', async (item) => {
            getText().then(async text => {
                await iqProvider.postScript(text)
                    .catch(err => logger.error('f5.iqScriptPost failed with', err));
            });
        }));

        context.subscriptions.push(commands.registerCommand('f5.iqScriptExecute', async (item) => {
            await iqProvider.executeScript(item)
                .catch(err => {

                    logger.error('f5.iqScriptExecute failed with', err);
                });
        }));
    }

}


/**
 * function to try to slim down an axios error a bit...
 * @param err 
 */
export function slimAxiosError(err: AxiosError) {
    delete err.config.httpsAgent;
    delete err.request.agent;
    delete err.request.socket;
    delete err.request.res;
    delete err.request.connection;
}