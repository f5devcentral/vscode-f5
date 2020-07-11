'use strict';

import * as vscode from 'vscode';
import { makeReqAXnew, multiPartUploadSDK } from './coreF5HTTPS';

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
    port: number;
    protected _user: string;
    protected _password: string;
    protected _token: string = '1234';
    // set above token to '1234' to get through TS typing
    // at instaniation it will be empty but should get updated
    // via code as calls are made

    /**
     * @param options function options
     */
    constructor(device: string,
        options: {
        // device: string;
        host: string;
        port: number;
        user: string;
        password: string;
    }) {
        this.device = device;
        this.host = options['host'];
        this.port = options['port'];
        this._user = options['user'];
        this._password = options['password'];
    }


    /**
     * Login (using credentials provided during instantiation)
     * sets auth token
     * @returns void
     */
    async token(): Promise<void> {
        const response: any = await makeReqAXnew(
            this.host,
            '/mgmt/shared/authn/login',
            {
                method: 'POST',
                body: {
                    username: this._user,
                    password: this._password,
                    // loginProviderName: 'tmos'
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

            // do stuff
            /**
             * do connect
             *  - make sure user/pass word
             * try to discover logonProvider?
             * do atc discovery
             *  - fast/as3/do/ts
             *  - add cloud failover (cs)
             */
            

        return 'toProgress';
        });
    }

    /**
     * setup multi part upload to f5 function
     * @param file full path/file location
     */
    async upload(file: string) {
        return await multiPartUploadSDK(file, this.host, this._token);
    }


    /**
     * work in progress - not used yet
     * was starting to setup discovering logonProvider, but
     * that requires basic auth and is only enable on bigip 
     * by default.  
     * Leaning toward manually setting it via new hosts tree 
     * dataStucture, where the config is hosted in a json file
     * instead of the default vscode config file
     * This is needed to accomodate multi level json to hold more
     * information about each device
     */
    async provider() {
        const response = await makeReqAXnew(
            this.host,
            '/mgmt/tm/auth/source',
            {
                method: 'POST',
                body: {
                    username: this._user,
                    password: this._password,
                    loginProviderName: 'local'
                }
                // basicAuth: {
                //     user: this._user,
                //     password: this._password
                // }
            }
        )
        .then( resp => {
            console.log('provider-resp', resp);
            return resp;
        })
        .then( undefined, err => {
            console.log('provider-errorrrrrr', err);
            return 'broken';
        });
        // .catch( error => {
        //     console.log('provider-error', error);
        // })
        // this._token = response.data['token']['token'];

        // debugger;
        return response;
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