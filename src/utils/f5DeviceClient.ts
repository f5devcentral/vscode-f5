/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

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
    protected _token: string | undefined;

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
        const response = await makeReqAXnew(
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

    }

    /**
     * setup multi part upload to f5 function
     * @param file full path/file location
     */
    async upload(file: string) {
        return await multiPartUploadSDK(file, this.host, this._token);
    }

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
                },
                basicAuth: {
                    user: this._user,
                    password: this._password
                }
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
                port: this.port || 443,
                headers: Object.assign(options.headers || {}, {
                    'X-F5-Auth-Token': this._token
                }),
                body: options.body || undefined,
                advancedReturn: options.advancedReturn || false
            }
        );
    }
}