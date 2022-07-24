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

import {
    Terminal,
    window,
    ProgressLocation,
    commands,
    StatusBarItem,
    StatusBarAlignment
} from 'vscode';
import { ext } from './extensionVariables';
import { ExtHttp, F5Client as _F5Client } from 'f5-conx-core';
import { BigipHost } from './models';
import EventEmitter from 'events';




export class F5Client extends _F5Client {
    // logger: typeof Logger;
    device: BigipHost;
    events: EventEmitter;
    terminal: Terminal | undefined;

    hostStatusBar: StatusBarItem;
    hostNameBar: StatusBarItem;
    fastBar: StatusBarItem;
    as3Bar: StatusBarItem;
    doBar: StatusBarItem;
    tsBar: StatusBarItem;
    cfBar: StatusBarItem;

    constructor(
        device: BigipHost,
        host: string,
        user: string,
        password: string,
        options: {
            port?: number;
            provider?: string;
        },
        eventEmitter: EventEmitter,
        extHttp: ExtHttp,
        teemEnv: string,
        teemAgent: string
    ) {
        super(host, user, password, options, eventEmitter, extHttp, teemEnv, teemAgent);

        this.events = eventEmitter ? eventEmitter : new EventEmitter();
        this.device = device;
        // this.logger = Logger;
        this.hostStatusBar = window.createStatusBarItem(StatusBarAlignment.Left, 32);
        this.hostNameBar = window.createStatusBarItem(StatusBarAlignment.Left, 31);
        this.fastBar = window.createStatusBarItem(StatusBarAlignment.Left, 30);
        this.as3Bar = window.createStatusBarItem(StatusBarAlignment.Left, 29);
        this.doBar = window.createStatusBarItem(StatusBarAlignment.Left, 28);
        this.tsBar = window.createStatusBarItem(StatusBarAlignment.Left, 27);
        this.cfBar = window.createStatusBarItem(StatusBarAlignment.Left, 26);

    }

    /**
     * connect to f5 and discover ATC services
     * Pulls device/connection details from this. within the class
     */
    async connect() {

        const progress = await window.withProgress({
            location: ProgressLocation.Notification,
            title: `Connecting to ${this.device.device}`,
            cancellable: true
        }, async (progress, token) => {
            token.onCancellationRequested(() => {
                // this logs but doesn't actually cancel...
                this.events.emit('log-info', "User canceled device connect");
                return new Error(`User canceled device connect`);
            });

            const deviceDetails = await this.discover();

            if (this.host) {

                this.hostStatusBar.text = (this.device.label || this.device.device);
                this.hostStatusBar.command = 'f5.disconnect';
                this.hostStatusBar.tooltip = 'Disconnect';
                this.hostStatusBar.show();

                this.hostNameBar.text = this.host.hostname;
                this.hostNameBar.command = 'f5.getF5HostInfo';
                this.hostNameBar.show();

                ext.connectBar.hide();      // hide connect bar


                //********** enable irules view **********/
                if (this.host.product === 'BIG-IP') {

                    commands.executeCommand('setContext', 'f5.tcl', true);
                    commands.executeCommand('setContext', 'f5.device', true);
                    commands.executeCommand('setContext', 'f5.isBigip', true);

                } else if (this.host.product === 'BIG-IQ') {

                    commands.executeCommand('setContext', 'f5.device', true);
                    commands.executeCommand('setContext', 'f5.isBigiq', true);

                } else {

                    commands.executeCommand('setContext', 'f5.device', false);
                    commands.executeCommand('setContext', 'f5.tcl', false);
                    // commands.executeCommand('setContext', 'f5.isBigiq', false);
                }


            }



            //********** FAST info **********/
            if (this.fast) {

                this.fastBar.command = 'f5-fast.getInfo';
                this.fastBar.text = `FAST(${this.fast.version.version})`;
                this.fastBar.show();
                commands.executeCommand('setContext', 'f5.fastInstalled', true);

            }

            //********** AS3 info **********/
            if (this.as3) {

                // this.as3Bar.command = 'f5-as3.getDec';
                this.as3Bar.text = `AS3(${this.as3.version.version})`;
                this.as3Bar.tooltip = `CLICK FOR ALL TENANTS \r\nschemaCurrent: ${this.as3.version.schemaCurrent} `;
                this.as3Bar.show();
                commands.executeCommand('setContext', 'f5.as3Installed', true);

            }

            //********** DO info **********/
            if (this.do) {

                this.doBar.command = 'f5-do.getDec';
                this.doBar.text = `DO(${this.do.version.version})`;
                this.doBar.tooltip = `schemaCurrent: ${this.do.version.version} `;
                this.doBar.show();
                commands.executeCommand('setContext', 'f5.doInstalled', true);

            }

            //********** TS info **********/
            if (this.ts) {

                this.tsBar.command = 'f5-ts.getDec';
                this.tsBar.text = `TS(${this.ts.version.version})`;
                this.tsBar.tooltip = `nodeVersion: ${this.ts.version.version}\r\nschemaCurrent: ${this.ts.version.schemaCurrent} `;
                this.tsBar.show();
                commands.executeCommand('setContext', 'f5.tsInstalled', true);

            }

            //********** CF info **********/
            if (this.cf) {

                this.cfBar.command = 'f5-cf.getDec';
                this.cfBar.text = `CF(${this.cf.version.version})`;
                this.cfBar.tooltip = `nodeVersion: ${this.cf.version.version}\r\nschemaCurrent: ${this.cf.version.schemaCurrent} `;
                this.cfBar.show();
                commands.executeCommand('setContext', 'f5.cfInstalled', true);

            }

            return deviceDetails;
        });
        this.termConnect();
        return progress;
    }

    /**
     * clears auth token, connected status bars, and onDisconnect commands
     */
    async disconnect() {

        // this._tokenTimeout = 0;  // zero/expire authToken
        // this.mgmtClient.clearToken();
        this.clearLogin();

        // clear connected details status bars
        this.hostStatusBar.hide();
        this.hostNameBar.hide();
        this.fastBar.hide();
        this.as3Bar.hide();
        this.doBar.hide();
        this.tsBar.hide();
        this.cfBar.hide();

        /**
         * // hide irules/iapps view
         * this should probably dispose of the view or at least clear it's contents?
         *  - currently, this just hides the view with all data in it
         *  next connect should refresh the data as needed, but there seems to
         *  be a better way to do this.
         */
        commands.executeCommand('setContext', 'f5.tcl', false);
        commands.executeCommand('setContext', 'f5.device', false);
        commands.executeCommand('setContext', 'f5.fastInstalled', false);
        commands.executeCommand('setContext', 'f5.as3Installed', false);
        commands.executeCommand('setContext', 'f5.doInstalled', false);
        commands.executeCommand('setContext', 'f5.tsInstalled', false);
        commands.executeCommand('setContext', 'f5.cfInstalled', false);
        commands.executeCommand('setContext', 'f5.isBigip', false);
        commands.executeCommand('setContext', 'f5.isBigiq', false);
        // ext.iRulesAble = false;

        // show connect status bar
        ext.connectBar.show();

        this.termDisConnect();
    }

    /**
     * clears password for currently connected device
     *  to be called by http since it won't know current
     *  device details
     */
    async clearPassword(device: string) {
        await commands.executeCommand('f5.clearPassword', { label: device || this.device });
    }



    /**
     * issues terminal commands defined for "onConnect"
     */
    private termConnect() {

        // if we have configuration in the onConnect
        if (this.device?.onConnect && this.device?.onConnect.length > 0) {

            // if we don't already have a terminal, create one
            if (!this.terminal) {
                this.terminal = window.createTerminal('f5-cmd');
                this.terminal.show(true);
            }

            // loop through onConnect commands and issue them
            this.device.onConnect.forEach((el: string) => {

                // swap out variable as needed
                el = el.replace(/\${this.device}/, `${this.device}`);
                setTimeout(() => {
                    this.terminal?.sendText(el);
                }, 500);
            });
        };

    }

    /**
     * issue terminal commands defined for "onDisonnect"
     */
    private termDisConnect() {

        // if we have onDisconnect commands
        if (this.device.onDisconnect) {

            // if we don't already have a terminal, create one (very corner cases)
            if (!this.terminal) {
                this.terminal = window.createTerminal('f5-cmd');
                this.terminal.show(true);
            }

            // if _onDisconnect has a value, loop through each as terminal commands
            this.device.onDisconnect?.forEach((el: string) => {
                setTimeout(() => {
                    this.terminal?.sendText(el);
                }, 500);
            });
        }

        // if we have a terminal, and we are disconnecting, delete terminal when done
        if (this.terminal) {
            setTimeout(() => {
                this.terminal?.dispose();
            }, 1000);
        }
    }
}