'use strict';

import * as vscode from 'vscode';
import { makeReqAXnew, multiPartUploadSDK } from './coreF5HTTPS';
import { ext } from '../extensionVariables';
import * as utils from './utils';

/**
 *
 * Basic Example:
 * 
 * ```
 * const mgmtClient = new ManagementClient({
 *      host: '192.0.2.1',
 *      port: 443,
 *      user: 'admin',
 *      password: 'admin'
 * });
 * await mgmtClient.login();
 * await mgmtClient.makeRequest('/mgmt/tm/sys/version');
 * ```
 */
export class MgmtClient {
    device: string;
    host: string;
    port: number | 443;
    provider: string;
    protected _user: string;
    protected _password: string;
    protected _token!: string | '1234';
    // set above token to '1234' to get through TS typing
    // at instaniation it will be empty but should get updated
    // via code as calls are made

    /**
     * @param options function options
     */
    constructor(
        device: string,
        options: {
        host: string;
        port: number;
        user: string;
        provider: string;
        password: string;
    }) {
        this.device = device;
        this.host = options['host'];
        this.port = options['port'] | 443;
        this.provider = options['provider'];
        this._user = options['user'];
        this._password = options['password'];
    }


    /**
     * Login (using credentials provided during instantiation)
     * sets auth token
     * @returns void
     */
    async getToken(): Promise<void> {
        const response: any = await makeReqAXnew(
            this.host,
            '/mgmt/shared/authn/login',
            {
                port: this.port,
                method: 'POST',
                body: {
                    username: this._user,
                    password: this._password,
                    logonProviderName: this.provider
                },
                // basicAuth: {
                //     user: this._user,
                //     password: this._password
                // }
            }
        );
        this._token = response.data['token']['token'];
    }

    /**
     * setup connect function
     * this could make other sub calls
     *  - discover provider?
     *  - service discovery
     *  - set status bar stuff
     */
    async connect() {
        const progress = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Connecting to ${this.host}`,
            cancellable: true
        }, async (progress, token) => {
            token.onCancellationRequested(() => {
                // this logs but doesn't actually cancel...
                console.log("User canceled device connect");
                return new Error(`User canceled device connect`);
            });
            
            
            // await ext.mgmtClient.getToken();
            
            let returnInfo: string[] = [];
            /**
             * clear "connect" status bar
             * set "connected" status bar
             * 
             */

            // cache password in keytar
            ext.keyTar.setPassword('f5Hosts', this.device, this._password);

            utils.setHostStatusBar(this.device);
            
            //********** Host info **********/
            const hostInfo: any = await this.makeRequest('/mgmt/shared/identified-devices/config/device-info');
            if (hostInfo.status === 200) {
                const text = `${hostInfo.data.hostname}`;
                const tip = `TMOS: ${hostInfo.data.version}`;
                utils.setHostnameBar(text, tip);
                returnInfo.push(text);
            }

            progress.report({ message: `CONNECTED, checking installed ATC services...`});


            //********** FAST info **********/
            const fastInfo: any = await this.makeRequest('/mgmt/shared/fast/info');
            if (fastInfo.status === 200) {
                const text = `FAST(${fastInfo.data.version})`;
                utils.setFastBar(text);
                returnInfo.push(text);
            }

            //********** AS3 info **********/
            const as3Info: any = await this.makeRequest('/mgmt/shared/appsvcs/info');

            if (as3Info.status === 200) {
                const text = `AS3(${as3Info.data.version})`;
                const tip = `schemaCurrent: ${as3Info.data.schemaCurrent} `;
                utils.setAS3Bar(text, tip);
                returnInfo.push(text);
            }
            
            //********** DO info **********/
            const doInfo: any = await this.makeRequest('/mgmt/shared/declarative-onboarding/info');

            if (doInfo.status === 200) {
                // for some reason DO responds with a list for version info...
                const text = `DO(${doInfo.data[0].version})`;
                const tip = `schemaCurrent: ${doInfo.data[0].schemaCurrent} `;
                utils.setDOBar(text, tip);
                returnInfo.push(text);
            }

            //********** TS info **********/
            const tsInfo: any = await this.makeRequest('/mgmt/shared/telemetry/info');
            if (tsInfo.status === 200) {
                const text = `TS(${tsInfo.data.version})`;
                const tip = `nodeVersion: ${tsInfo.data.nodeVersion}\r\nschemaCurrent: ${tsInfo.data.schemaCurrent} `;
                utils.setTSBar(text, tip);
                returnInfo.push(text);
            }
            return returnInfo;
        });
        return progress;
    }

    /**
     * setup multi part upload to f5 function
     * @param file full path/file location
     */
    async upload(file: string) {
        return await multiPartUploadSDK(file, this.host, this.port, this._token);
    }





    /**
     * Make HTTP request
     * - utilizes device details/user/pass/token
     * set within the class
     * 
     * @param uri     request URI
     * @param options function options
     * 
     * @returns request response
     */
    async makeRequest(uri: string, options?: {
        method?: string;
        headers?: object;
        body?: object;
        contentType?: string;
        advancedReturn?: boolean;
    }): Promise<object>  {
        options = options || {};

        return await makeReqAXnew(
            this.host,
            uri,
            {
                method: options.method || 'GET',
                port: this.port,
                headers: Object.assign(options.headers || {}, {
                    'X-F5-Auth-Token': this._token
                }),
                body: options.body || undefined,
                advancedReturn: options.advancedReturn || false
            }
        );
    }
}