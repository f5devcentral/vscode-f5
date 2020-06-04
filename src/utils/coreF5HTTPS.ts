
'use strict';
import * as vscode from 'vscode';
import { request } from 'https';
import { ext } from '../extensionVariables';









/**
 * Get tmos auth token
 * @param host fqdn or IP address of destination
 * @param username 
 * @param password 
 */
export const getAuthToken = async (host: string, username: string, password: string) => makeRequest(
    {
        host,
        path: '/mgmt/shared/authn/login',
        method: 'POST',
    }, 
    { 
        username,
        password
    })
    .then( async res => {
        if (res.status === 200) {
            return res.body.token.token;
        } else if (res.status === 401 && res.body.message === "Authentication failed.") {
            // clear cached password for this device
            ext.keyTar.deletePassword('f5Hosts', `${username}@${host}`);
    
            vscode.window.showErrorMessage(`HTTP FAILURE: ${res.status} - ${res.body.message}`);
            console.error(`HTTP FAILURE: ${res.status} - ${res.body.message}`);
            throw new Error(`HTTP FAILURE: ${res.status} - ${res.body.message}`);
        } else {
            // await new Promise(resolve => { setTimeout(resolve, 3000); });
            throw new Error(`HTTP FAILURE: ${res.status} - ${res.body.message}`);
            
        }
});
    
export const callHTTP = (method: string, host: string, path: string, token: string, payload: object = {}) => makeRequest(
    {
        method,
        host,
        path,
        headers: {
            'Content-Type': 'application/json',
            'X-F5-Auth-Token': token
        }
    },
    payload
)
.then( response => {
    return response;
});




interface OptsObject {
    host: string,
    port?: number,
    path: string,
    method?: string,
    headers?: object,
}

/**
 * Core HTTPs request
 * @param opts https call options
 * @param payload http call payload
 */
function makeRequest(opts: OptsObject, payload: object = {}): Promise<any> {

    const defaultOpts = {
        port: 443,
        method: 'GET',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if(opts.host.includes(':')) {
        var [host, port] = opts.host.split(':');
        opts.host = host;
        opts.port = parseInt(port);
    }

    // combine defaults with passed in options
    const combOpts = Object.assign({}, defaultOpts, opts);

    console.log(`HTTP-REQUEST: ${combOpts.host} - ${combOpts.method} - ${combOpts.path}`);
    console.log(combOpts);

    return new Promise((resolve, reject) => {
        const req = request(combOpts, (res) => {
            const buffer: any = [];
            res.setEncoding('utf8');
            res.on('data', (data) => {
                buffer.push(data);
            });
            res.on('end', () => {
                let body = buffer.join('');
                body = body || '{}';

                try {
                    body = JSON.parse(body);
                } catch (e) {
                    console.log(combOpts);
                    console.log(e);
                    return reject(new Error(`Invalid response object ${combOpts}`));
                };
                
                // // TODO: configure global logging system
                // console.log('makeRequest***STATUS: ' + res.statusCode);
                // console.log('makeRequest***HEADERS: ' + JSON.stringify(res.headers));
                // console.log('makeRequest***BODY: ' + JSON.stringify(body));

                console.log(`HTTP-RESPONSE: ${res.statusCode}`);
                console.log({
                    status: res.statusCode,
                    headers: res.headers,
                    body
                });

                
                const goodResp: Array<number> = [200, 201, 202];
                // was trying to check against array above with arr.includes or arr.indexOf
                /**
                 * Opening this up to any response code, to handle errors higher in logic
                 * might need to key off 500s and more 400s when waitng for DO
                 */
                // if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 202 || res.statusCode === 404 || res.statusCode === 422) {
                    if (res.statusCode) {
                    return resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body
                    });
                } else {
                    vscode.window.showErrorMessage(`HTTP FAILURE: ${res.statusCode} - ${res.statusMessage}`);
                    console.error(`HTTP FAILURE: ${res.statusCode} - ${res.statusMessage}`);
                    return reject(new Error(`HTTP - ${res.statusCode} - ${res.statusMessage}`));
                }

            });
        });

        req.on('error', (e) => {
            // might need to stringify combOpts for proper log output
            reject(new Error(`${combOpts}:${e.message}`));
        });

        // if a payload was passed in, post it!
        if (payload) {
            req.write(JSON.stringify(payload));
        }
        req.end();
    });
};


