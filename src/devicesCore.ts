/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';

// import { utils } from "mocha";
import { F5Client } from './f5Client';
import { window, commands, workspace, ConfigurationTarget, ProgressLocation, Uri, ExtensionContext } from "vscode";
import { deviceImport } from "./deviceImport";
import { ext } from "./extensionVariables";
import { Device } from "./models";
import { F5TreeProvider } from "./treeViewsProviders/hostsTreeProvider";
import logger from "./utils/logger";
import * as utils from './utils/utils';

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
export default function devicesCore(context: ExtensionContext) {



    ext.hostsTreeProvider = new F5TreeProvider(context);
    // window.registerTreeDataProvider('f5Hosts', ext.hostsTreeProvider);
    window.createTreeView('f5Hosts', {
        treeDataProvider: ext.hostsTreeProvider,
        showCollapseAll: true
    });
    commands.registerCommand('f5.refreshHostsTree', () => ext.hostsTreeProvider.refresh());

    context.subscriptions.push(commands.registerCommand('f5.connectDevice', async (device) => {

        logger.info('selected device', device);  // preferred at the moment

        if (ext.f5Client) {
            ext.f5Client.disconnect();
        }

        if (!device) {
            const bigipHosts: Device[] | undefined = await workspace.getConfiguration().get('f5.hosts');

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
        var [host, port] = host.split(':');

        const password: string = await utils.getPassword(device.device);


        ext.f5Client = new F5Client(device, host, user, password, {
            port,
            provider: device.provider,
        },
            ext.eventEmitterGlobal,
            ext.extHttp);

        await ext.f5Client.connect()
            .then(connect => {

                // cache password in keytar
                ext.keyTar.setPassword('f5Hosts', device.device, password);

                logger.debug('F5 Connect Discovered', connect);
                ext.hostsTreeProvider.refresh();
                ext.as3Tree.refresh();
            })
            .catch(err => {
                logger.error('Connect/Discover failed');
            });
    }));

    context.subscriptions.push(commands.registerCommand('f5.getProvider', async () => {
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

        logger.debug(`Edit Host command: ${JSON.stringify(hostID)}`);

        let bigipHosts: { device: string }[] | undefined = workspace.getConfiguration().get('f5.hosts');
        logger.debug(`Current bigipHosts: ${JSON.stringify(bigipHosts)}`);

        window.showInputBox({
            prompt: 'Update Device/BIG-IP/Host',
            value: hostID.label,
            ignoreFocusOut: true
        })
            .then(input => {

                logger.debug('user input', input);

                if (input === undefined || bigipHosts === undefined) {
                    // throw new Error('Update device inputBox cancelled');
                    logger.warn('Update device inputBox cancelled');
                    return;
                }

                const deviceRex = /^[\w-.]+@[\w-.]+(:[0-9]+)?$/;
                const devicesString = JSON.stringify(bigipHosts);

                if (!devicesString.includes(`\"${input}\"`) && deviceRex.test(input)) {

                    bigipHosts.forEach((item: { device: string; }) => {
                        if (item.device === hostID.label) {
                            item.device = input;
                        }
                    });

                    workspace.getConfiguration().update('f5.hosts', bigipHosts, ConfigurationTarget.Global);
                    setTimeout(() => { ext.hostsTreeProvider.refresh(); }, 300);
                } else {

                    window.showErrorMessage('Already exists or invalid format: <user>@<host/ip>:<port>');
                }
            });

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

        return await window.withProgress({
            location: ProgressLocation.SourceControl,
        }, async () => {

            return await ext.f5Client?.ucs.create()
                .then(resp => {

                    setTimeout(() => { ext.hostsTreeProvider.refresh(); }, 1000);
                    return resp;
                })
                .catch(err => logger.error('create ucs failed:', err));
        });

    }));

    context.subscriptions.push(commands.registerCommand('f5.downloadUCS', async (filename) => {
        // download ucs from f5

        return await window.withProgress({
            location: ProgressLocation.Window,
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
}