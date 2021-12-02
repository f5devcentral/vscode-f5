/**
 * Copyright 2021 F5 Networks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 'use strict';

// import { utils } from "mocha";
import { F5Client } from './f5Client';
import {
    window,
    commands,
    workspace,
    ConfigurationTarget,
    ProgressLocation,
    Uri,
    ExtensionContext,
    OutputChannel
} from "vscode";
import { deviceImport } from "./deviceImport";
import { ext } from "./extensionVariables";
import { BigipHost } from "./models";
import { F5TreeProvider } from "./treeViewsProviders/hostsTreeProvider";
import * as utils from './utils/utils';
import { Asset, HttpResponse, isArray, wait } from 'f5-conx-core';
import * as rpmMgmt from './utils/rpmMgmt';
import { BigipTreeProvider } from './treeViewsProviders/bigipTreeProvider';
import { tokenTimer } from './tokenTimer';

import { logger } from './logger';


// /**
//  * #########################################################################
//  *
//  * 	     ########  ######## ##     ## ####  ######  ########  ######  
//  *	     ##     ## ##       ##     ##  ##  ##    ## ##       ##    ## 
//  *	     ##     ## ##       ##     ##  ##  ##       ##       ##       
//  *	     ##     ## ######   ##     ##  ##  ##       ######    ######  
//  *	     ##     ## ##        ##   ##   ##  ##       ##             ## 
//  *	     ##     ## ##         ## ##    ##  ##    ## ##       ##    ## 
//  * 	     ########  ########    ###    ####  ######  ########  ######  
//  * 
//  * http://patorjk.com/software/taag/#p=display&h=0&f=Banner3&t=Devices
//  * #########################################################################
//  */

/**
 * core devices/view functionality
 */
export default function devicesCore(context: ExtensionContext, f5OutputChannel: OutputChannel) {



    ext.hostsTreeProvider = new F5TreeProvider(context);
    // window.registerTreeDataProvider('f5Hosts', ext.hostsTreeProvider);
    const hostsTreeView = window.createTreeView('f5Hosts', {
        treeDataProvider: ext.hostsTreeProvider,
        showCollapseAll: true
    });

    hostsTreeView.onDidChangeVisibility(e => {
        // set this up to respect if onConnect/terminal has been setup
        if (e.visible) {
            f5OutputChannel.show();
        }
    });



    const bigipProvider = new BigipTreeProvider(context);
    const bigipTreeView = window.createTreeView('ipView', {
        treeDataProvider: bigipProvider,
        showCollapseAll: true
    });
    context.subscriptions.push(commands.registerCommand('f5.refreshBigipTree', () => bigipProvider.refresh()));





    context.subscriptions.push(commands.registerCommand('f5.refreshHostsTree', () => ext.hostsTreeProvider.refresh()));

    context.subscriptions.push(commands.registerCommand('f5.connectDevice', async (device) => {

        logger.info('selected device', device);  // preferred at the moment

        ext.f5Client?.disconnect();

        if (!device) {
            const bigipHosts: BigipHost[] | undefined = await workspace.getConfiguration().get('f5.hosts');

            if (bigipHosts === undefined) {
                throw new Error('no hosts in configuration');
            }

            /**
             * loop through config array of objects and build quickPick list appropriate labels
             * [ {label: admin@192.168.1.254:8443, target: { host: 192.168.1.254, user: admin, ...}}, ...]
             */
            const qPickHostList = bigipHosts.map(item => {
                return { label: item.device, target: item };
            });

            device = await window.showQuickPick(qPickHostList, { placeHolder: 'Select Device' });
            if (!device) {
                throw new Error('user exited device input');
            } else {
                // now that we made it through quickPick drop the label/object wrapper for list and just return device object
                device = device.target;
            }
        }

        var [user, host] = device.device.split('@');

        let port;
        if (/:/.test(host)) {
            const hostSplit = host.split(':');
            port = hostSplit.pop();
            host = hostSplit.join(':');

            // if we stil have a ":", then it's an IPv6, so wrap it in brackets "[ipv6]"
            if (/:/.test(host)) {
                host = `[${host}]`;
            }
        }

        const password: string = await utils.getPassword(device.device);


        ext.f5Client = new F5Client(device, host, user, password, {
            port,
            provider: device.provider,
        },
            ext.eventEmitterGlobal,
            ext.extHttp,
            ext.teemEnv,
            ext.teemAgent
        );

        await ext.f5Client.connect()
            .then(connect => {

                // cache password in keytar
                ext.keyTar.setPassword('f5Hosts', device.device, password);

                logger.info('F5 Connect Discovered', connect);

                ext.hostsTreeProvider.connectedDevice = ext.f5Client;
                ext.hostsTreeProvider.refresh();

                bigipProvider.connected = ext.f5Client;
                bigipProvider.refresh();

                ext.as3Tree.refresh();
            })
            .catch(err => {
                logger.error('Connect/Discover failed', err);
            });
    }));

    context.subscriptions.push(commands.registerCommand('f5.getProvider', async () => {
        const x = ext.f5Client;
        ext.f5Client?.https('/mgmt/tm/auth/source')
            .then(resp => ext.panel.render(resp));
    }));


    context.subscriptions.push(commands.registerCommand('f5.getF5HostInfo', async () => {
        ext.panel.render(ext.f5Client?.host);
    }));

    context.subscriptions.push(commands.registerCommand('f5.disconnect', () => {

        if (ext.f5Client) {
            ext.f5Client.disconnect();
            ext.f5Client = undefined;
        }
        // refresh host view to clear any dropdown menus
        ext.hostsTreeProvider.refresh();
        ext.hostsTreeProvider.connectedDevice = undefined;
        tokenTimer(true);
    }));

    context.subscriptions.push(commands.registerCommand('f5.clearPassword', async (item) => {
        return ext.hostsTreeProvider.clearPassword(item.label);
    }));


    context.subscriptions.push(commands.registerCommand('f5.addHost', async (newHost) => {
        return await ext.hostsTreeProvider.addDevice(newHost);
    }));

    context.subscriptions.push(commands.registerCommand('f5.removeHost', async (hostID) => {
        return await ext.hostsTreeProvider.removeDevice(hostID);
    }));

    context.subscriptions.push(commands.registerCommand('f5.editHost', async (hostID) => {
        return await ext.hostsTreeProvider.editDevice(hostID);
    }));



    context.subscriptions.push(commands.registerCommand('f5.editDeviceProvider', async (hostID) => {

        // todo: look at removing all this.
        //  1.  for bigip, it should always be tmos...  even if still local auth and/or remote auth is configured (which we can set)
        //  2.  it clutters the UI
        //  3.  bigiq will always be a custom value that can be set by the user on the config

        let bigipHosts: { device: string }[] | undefined = workspace.getConfiguration().get('f5.hosts');

        const providerOptions: string[] = [
            'local',
            'radius',
            'tacacs',
            'tmos',
            'active-directory',
            'ldap',
            'apm',
            'custom for bigiq'
        ];

        window.showQuickPick(providerOptions, { placeHolder: 'Default BIGIP providers' })
            .then(async input => {

                logger.debug('user input', input);

                if (input === undefined || bigipHosts === undefined) {
                    // throw new Error('Update device inputBox cancelled');
                    logger.warn('Update device inputBox cancelled');
                    return;
                }

                if (input === 'custom for bigiq') {
                    input = await window.showInputBox({
                        prompt: "Input custom bigiq login provider"
                    });
                }

                bigipHosts.forEach((item: { device: string; provider?: string; }) => {
                    if (item.device === hostID.label) {
                        item.provider = input;
                    }
                });

                workspace.getConfiguration().update('f5.hosts', bigipHosts, ConfigurationTarget.Global);

                setTimeout(() => { ext.hostsTreeProvider.refresh(); }, 300);
            });

    }));


    context.subscriptions.push(commands.registerCommand('f5.deviceImport', async (item) => {

        return utils.getText()
            .then(async text => {
                await deviceImport(text);
                setTimeout(() => { ext.hostsTreeProvider.refresh(); }, 1000);
                return;
            });
    }));





    context.subscriptions.push(commands.registerCommand('f5.createUCS', async () => {
        // create ucs on f5

        // https://code.visualstudio.com/api/references/icons-in-labels

        // todo: expand this command to start a series of quickPick/input boxes to provide an interface to the different ucs create options (ie. filename/passphrase/noPrivateKeys/mini_ucs)

        // hostsTreeView.message = '$(sync~spin) Creating UCS...';

        return await window.withProgress({
            // location: ProgressLocation.Window,
            // title: 'Creating UCS...',
            location: { viewId: 'ipView' },
        }, async () => {

            return await ext.f5Client?.ucs.create()
                .then(resp => {

                    setTimeout(() => { bigipProvider.refresh('UCS'); }, 1000);
                    // hostsTreeView.message = '';
                    return resp;
                })
                .catch(err => logger.error('create ucs failed:', err));
        });



    }));


    context.subscriptions.push(commands.registerCommand('f5.deleteUCS', async (item) => {

        return await window.withProgress({
            location: { viewId: 'ipView' },
        }, async () => {

            return await ext.f5Client?.ucs.delete(item.label)
                .then(resp => {

                    wait(1000, bigipProvider.refresh('UCS'));
                    // setTimeout(() => { ext.hostsTreeProvider.refresh(); }, 1000);
                    // return resp;
                })
                .catch(err => logger.error('delete ucs failed:', err));
        });

    }));

    context.subscriptions.push(commands.registerCommand('f5.downloadUCS', async (filename) => {
        // download ucs from f5

        return await window.withProgress({
            location: ProgressLocation.Window,
            title: '$(sync~spin) Downloading UCS...'
        }, async () => {

            const fUri = Uri.parse(filename);
            const fUri2 = Uri.file(filename);

            const folder = await window.showOpenDialog({
                title: 'Select Folder to Save UCS',
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false
            });

            const dest = folder ? folder[0].path : ext.cacheDir;

            return await ext.f5Client?.ucs.download(filename, dest)
                // .then( resp => {
                //     logger.info(resp);
                // })
                .catch(err => logger.error('download ucs failed:', err));
        });
    }));




    /**
     * ###########################################################################
     * 
     * 				RRRRRR     PPPPPP     MM    MM 
     * 				RR   RR    PP   PP    MMM  MMM 
     * 				RRRRRR     PPPPPP     MM MM MM 
     * 				RR  RR     PP         MM    MM 
     * 				RR   RR    PP         MM    MM 
     * 
     * ############################################################################
     * http://patorjk.com/software/taag/#p=display&h=0&f=Letters&t=FAST
     */

    context.subscriptions.push(commands.registerCommand('f5.installRPM', async (selectedRPM) => {

        const downloadResponses = [];
        const upLoadResponses = [];
        let rpm: Asset;
        let signature;
        let installed: HttpResponse;


        if (isArray(selectedRPM)) {

            window.withProgress({
                location: { viewId: 'ipView' }
            }, async () => {

                rpm = selectedRPM.filter((el: Asset) => el.name.endsWith('.rpm'))[0];
                signature = selectedRPM.filter((el: Asset) => el.name.endsWith('.sha256'))[0];

                // setup logic to see what atc service is being installed, and compare that with what might already be installed
                //  work through process for un-installing, then installing new package

                if (rpm) {

                    await ext.f5Client?.atc.download(rpm.browser_download_url)
                        .then(async resp => {

                            // assign rpm name to variable
                            downloadResponses.push(resp);
                            await new Promise(resolve => { setTimeout(resolve, 1000); });

                            await ext.f5Client?.atc.uploadRpm(resp.data.file)
                                .then(async uploadResp => {

                                    await new Promise(resolve => { setTimeout(resolve, 1000); });
                                    upLoadResponses.push(uploadResp);
                                    await ext.f5Client?.atc.install(rpm.name)
                                        .then(resp => installed = resp);
                                });
                        })
                        .catch(err => {

                            // todo: setup error logging
                            debugger;
                        });
                }
                if (signature) {

                    await ext.f5Client?.atc.download(signature.browser_download_url)
                        .then(async resp => {
                            await ext.f5Client?.atc.uploadRpm(resp.data.file);
                        })
                        .catch(err => {
                            // todo: setup error logging
                            debugger;
                        });
                }


                if (installed) {
                    await new Promise(resolve => { setTimeout(resolve, 1000); });
                    await ext.f5Client?.connect(); // refresh connect/status bars
                    await new Promise(resolve => { setTimeout(resolve, 1000); });
                    bigipProvider.refresh();
                }
            });
        }
    }));

    context.subscriptions.push(commands.registerCommand('f5.unInstallRPM', async (rpm) => {

        window.withProgress({
            location: { viewId: 'ipView' }
        }, async () => {
            // if no rpm sent in from update command
            if (!rpm) {
                // get installed packages
                const installedRPMs = await rpmMgmt.installedRPMs();

                // utilize new method with 
                // ext.f5Client.atc.showInstalled();

                // have user select package
                rpm = await window.showQuickPick(installedRPMs, { placeHolder: 'select rpm to remove' });
            } else {
                // rpm came from new rpm hosts view
                if (rpm.label && rpm.tooltip) {


                    await ext.f5Client?.atc.showInstalled()
                        .then(async resp => {
                            // loop through response, find rpm that matches rpm.label, then uninstall
                            const rpmName = resp.data.queryResponse.filter((el: { name: string }) => el.name === rpm.tooltip)[0];
                            return await ext.f5Client?.atc.unInstall(rpmName.packageName);

                        });



                }

            }

            if (!rpm) {	// return error pop-up if quickPick escaped
                // return window.showWarningMessage('user exited - did not select rpm to un-install');
                logger.info('user exited - did not select rpm to un-install');
            }

            // const status = await rpmMgmt.unInstallRpm(rpm);
            // window.showInformationMessage(`rpm ${rpm} removal ${status}`);
            // debugger;

            // used to pause between uninstalling and installing a new version of the same atc
            //		should probably put this somewhere else
            await new Promise(resolve => { setTimeout(resolve, 10000); });
            await ext.f5Client?.connect(); // refresh connect/status bars
            // ext.hostsTreeProvider.refresh();
            await new Promise(resolve => { setTimeout(resolve, 500); });
            bigipProvider.refresh('ATC');

        });
    }));
}
