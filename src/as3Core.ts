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
    QuickPickItem,
    window
} from 'vscode';

import { ext } from './extensionVariables';
import * as utils from './utils/utils';
import { logger } from './logger';
import { AS3TreeProvider } from './treeViewsProviders/as3TreeProvider';

/**
 * ############################################################################
 * 
 * 				  AAA     SSSSS   333333  
 * 				 AAAAA   SS          3333 
 * 				AA   AA   SSSSS     3333  
 * 				AAAAAAA       SS      333 
 * 				AA   AA   SSSSS   333333  
 * 
 * ############################################################################
 * http://patorjk.com/software/taag/#p=display&h=0&f=Letters&t=AS3
 */
export class As3Core {

    constructor(context: ExtensionContext) {


        // setting up as3 tree
        ext.as3Tree = new AS3TreeProvider();
        window.registerTreeDataProvider('as3Tenants', ext.as3Tree);
        commands.registerCommand('f5-as3.refreshTenantsTree', () => ext.as3Tree.refresh());

        context.subscriptions.push(commands.registerCommand('f5-as3.getDecs', async (item) => {

            ext.telemetry.capture({ command: 'f5-as3.getDecs' });
            
            if (item.tenant && item.expanded) {
                // const dd = await tenantFromDec(item.command.arguments[0]);
                await ext.f5Client?.as3?.getDecs({ tenant: item.tenant, expanded: item.expanded })
                    .then((resp: any) => ext.panel.render(resp.data))
                    .catch(err => logger.error('get as3 tenant with param failed:', err));
            } else if (item.tenant) {
                // just a regular as3 declaration object
                ext.panel.render(item.tenant);
            } else {
                // just a regular as3 declaration object
                ext.panel.render(item);
            }
        }));


        context.subscriptions.push(commands.registerCommand('f5-as3.expandedTenant', async (tenant) => {
            commands.executeCommand('f5-as3.getDecs', { tenant: tenant.label, expanded: true });
            ext.telemetry.capture({ command: 'f5-as3.expandedTenant' });
        }));


        context.subscriptions.push(commands.registerCommand('f5-as3.deleteTenant', async (tenant) => {
            let prompt: boolean = true;

            ext.telemetry.capture({ command: 'f5-as3.deleteTenant' });

            if (ext.settings.prompts) {
                const qpOptions: QuickPickItem[] = [
                    {
                        label: "$(thumbsup) Yes",
                        description: `Delete AS3 Tenant: ${tenant.label}`,
                    },
                    {
                        label: "$(thumbsdown) No",
                        description: " Cancel Operation"
                    }
                ];

                // await window.showWarningMessage('Are you sure?', 'Yes', 'Cancel')
                await window.showQuickPick(qpOptions, { title: 'Are you sure?' })
                    .then(resp => {
                        if (resp === undefined || JSON.stringify(resp).includes('Cancel' || 'No')) {
                            prompt = false;
                        } else {
                            prompt = true;
                        }
                    });

                logger.info('prompts enabled, f5-as3.deleteTenant called, user chose:', prompt);
            }

            if (prompt) {
                await window.withProgress({
                    location: ProgressLocation.Notification,
                    // location: { viewId: 'as3Tenants'},
                    title: `Deleting ${tenant.label} Tenant`
                }, async (progress) => {

                    await ext.f5Client?.as3?.deleteTenant(tenant.command.arguments[0])
                        .then((resp: any) => {
                            const resp2 = resp.data.results[0];
                            progress.report({ message: `${resp2.code} - ${resp2.message}` });
                        })
                        .catch(err => {
                            progress.report({ message: `${err.message}` });
                            // might need to adjust logging depending on the error, but this works for now, or at least the main HTTP responses...
                            logger.error('as3 delete tenant failed with:', {
                                respStatus: err.response.status,
                                respText: err.response.statusText,
                                errMessage: err.message,
                                errRespData: err.response.data
                            });
                        });

                    // hold the status box for user and let things finish before refresh
                    await new Promise(resolve => { setTimeout(resolve, 5000); });
                });

                ext.as3Tree.refresh();
            }

        }));

        context.subscriptions.push(commands.registerCommand('f5-as3.getTask', (id) => {

            ext.telemetry.capture({ command: 'f5-as3.getTask' });

            window.withProgress({
                location: ProgressLocation.Window,
                // location: { viewId: 'as3Tenants'},
                title: `Getting AS3 Task`
            }, async () => {

                await ext.f5Client?.as3?.getTasks(id)
                    .then(resp => ext.panel.render(resp))
                    .catch(err => logger.error('as3 get task failed:', err));

            });

        }));

        context.subscriptions.push(commands.registerCommand('f5-as3.postDec', async () => {

            let prompt: boolean = true;

            if (ext.settings.prompts) {
                const qpOptions: QuickPickItem[] = [
                    {
                        label: "$(thumbsup) Yes",
                        description: 'Post Declaration',
                    },
                    {
                        label: "$(thumbsdown) No",
                        description: " Cancel Operation"
                    }
                ];

                // await window.showWarningMessage('Are you sure?', 'Yes', 'Cancel')
                await window.showQuickPick(qpOptions, { title: 'Are you sure?' })
                    .then(resp => {
                        if (resp === undefined || JSON.stringify(resp).includes('Cancel' || 'No')) {
                            prompt = false;
                        } else {
                            prompt = true;
                        }
                    });

                logger.info('prompts enabled, f5-as3.postDec called, user chose:', prompt);
            }

            if (prompt) {
                await utils.getText()
                    .then(async text => {

                        if (!utils.isValidJson(text)) {
                            return window.showErrorMessage('Not valid JSON object');
                        }

                        // const dec: As3Declaration | AdcDeclaration = JSON.parse(text);
                        const dec = JSON.parse(text);

                        await window.withProgress({
                            // location: { viewId: 'as3Tenants'},
                            location: ProgressLocation.Notification,
                            title: `Posting AS3 Declaration`
                        }, async () => {

                            // todo: build as3 stats
                            // const stats = await as3AppStats(dec);  
                            ext.telemetry.capture({ command: 'f5-as3.expandedTenant' });

                            await ext.f5Client?.as3?.postDec(dec)
                                .then(resp => {
                                    ext.panel.render(resp);
                                    ext.as3Tree.refresh();
                                })
                                .catch(err => logger.error('as3 post dec failed:', err));

                        });
                    });
            }
        }));
    }
}


function as3Stats(dec: any) {

}
