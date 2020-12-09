

'use strict';

import { Terminal, window, workspace, ProgressLocation, StatusBarAlignment, commands } from 'vscode';
import { ext, loadConfig } from './extensionVariables';
import * as utils from './utils/utils';
import { F5Client as _F5Client } from 'f5-conx-core';
import { Device } from './models';




export class F5Client extends _F5Client {
    device: Device;
    private terminal: Terminal | undefined;

    constructor(
        device: Device,
        host: string,
        user: string,
        password: string,
        options?: {
            port?: number;
            provider?: string;
            logger?: any;
        }
    ) {
        super(host, user, password, options);
        this.device = device;
        // this._password = password;
        // this.getConfig();

    }

    /**
     * connect to f5 and discover ATC services
     * Pulls device/connection details from this. within the class
     */
    async connect() {
        loadConfig();

        const progress = await window.withProgress({
            location: ProgressLocation.Notification,
            title: `Connecting to ${this.device.device}`,
            cancellable: true
        }, async (progress, token) => {
            token.onCancellationRequested(() => {
                // this logs but doesn't actually cancel...
                this.logger.debug("User canceled device connect");
                return new Error(`User canceled device connect`);
            });
            let returnInfo: string[] = [];

            await this.discover();



            if (this.host) {
                // this should always be here if we got to this point, but just to be safe for now
                utils.setHostStatusBar(this.device.device);    // show device bar
                ext.connectBar.hide();      // hide connect bar
                returnInfo.push(
                    this.host.hostname, 
                    this.host.version, 
                    this.host.product
                    );
            }

            // //********** enable irules view **********/
            // const iRules: any = await this.makeRequest('/mgmt/tm/ltm/rule/');

            // if(iRules.status === 200) {
            //     // if irules detected, device is iRulesAble, so set that flag, 
            //     //  then reload the config to make the view show
            //     ext.iRulesAble = true;
            //     loadConfig();
            // }

            //********** FAST info **********/
            if (this.fast) {
                const text = `FAST(${this.fast.version.version})`;
                utils.setFastBar(text);
                returnInfo.push(text);
            }

            //********** AS3 info **********/
            if (this.as3) {
                const text = `AS3(${this.as3.version.version})`;
                const tip = `CLICK FOR ALL TENANTS \r\nschemaCurrent: ${this.as3.version.schemaCurrent} `;
                utils.setAS3Bar(text, tip);
                returnInfo.push(text);
            }

            //********** DO info **********/
            if (this.do) {
                // for some reason DO responds with a list for version info...
                const text = `DO(${this.do.version.version})`;
                const tip = `schemaCurrent: ${this.do.version.version} `;
                utils.setDOBar(text, tip);
                returnInfo.push(text);
            }

            //********** TS info **********/
            if (this.ts) {
                const text = `TS(${this.ts.version.version})`;
                const tip = `nodeVersion: ${this.ts.version.version}\r\nschemaCurrent: ${this.ts.version.schemaCurrent} `;
                utils.setTSBar(text, tip);
                returnInfo.push(text);
            }

            //********** CF info **********/
            if (this.cf) {
                const text = `CF(${this.cf.version.version})`;
                const tip = `nodeVersion: ${this.cf.version.version}\r\nschemaCurrent: ${this.cf.version.schemaCurrent} `;
                // utils.setCFBar(text, tip);
                // returnInfo.push(text);
            }
            return returnInfo;
        }); 
        this.termConnect();
        return progress;
    }

    /**
     * clears auth token, connected status bars, and onDisconnect commands
     */
    async disconnect() {

        // this._tokenTimeout = 0;  // zero/expire authToken
        this._mgmtClient.clearToken();

        // clear connected details status bars
        utils.setHostStatusBar();
        utils.setHostnameBar();
        utils.setFastBar();
        utils.setAS3Bar();
        utils.setDOBar();
        utils.setTSBar();

        /**
         * // hide irules/iapps view
         * this should probably dispose of the view or at least clear it's contents?
         *  - currently, this just hides the view with all data in it
         *  next connect should refresh the data as needed, but there seems to
         *  be a better way to do this.
         */
        commands.executeCommand('setContext', 'f5.tcl', false);
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
    async clearPassword() {
        await commands.executeCommand('f5.clearPassword', { label: this.device });
    }



    /**
     * issues terminal commands defined for "onConnect"
     */
    private termConnect() {

        // if we have configuration in the onConnect
        if (this.device.onConnect.length > 0) {

            // if we don't already have a terminal, create one
            if (!this.terminal) {
                this.terminal = window.createTerminal('f5-cmd');
                this.terminal.show(true);
            }

            // loop through onConnect commands and issue them
            this.device.onConnect?.forEach((el: string) => {

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