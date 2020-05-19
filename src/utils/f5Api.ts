'use strict';

import * as vscode from 'vscode';
import { request } from 'https';
import { 
    setHostStatusBar, 
    setHostnameBar,
    setAS3Bar, 
    setFastBar,
    setDOBar, 
    setTSBar
 } from './utils';
import { ext } from '../extensionVariables';


/**
 * F5 API commands
 */
export class F5Api {


    async connectF5(device: string, password: string) {
        var [username, host] = device.split('@');
        getAuthToken(host, username, password)
            .then( async hostToken => {

                // cache password in keytar
                ext.keyTar.setPassword('f5Hosts', device, password);
                
                setHostStatusBar(device);
                vscode.window.showInformationMessage(`Successfully connected to ${host}`);

                //********** Host info **********/
                const hostInfo = await callHTTP(
                    'GET', 
                    hostToken.host, 
                    '/mgmt/shared/identified-devices/config/device-info', 
                    hostToken.token
                );

                if (hostInfo.status === 200) {
                    const text = `${hostInfo.body.hostname}`;
                    const tip = `TMOS: ${hostInfo.body.version}`;
                    setHostnameBar(text, tip);
                }

                //********** TS info **********/
                const tsInfo = await callHTTP(
                    'GET', 
                    hostToken.host, 
                    '/mgmt/shared/telemetry/info', 
                    hostToken.token
                );

                if (tsInfo.status === 200) {
                    const text = `TS(${tsInfo.body.version})`;
                    const tip = `nodeVersion: ${tsInfo.body.nodeVersion}\r\nschemaCurrent: ${tsInfo.body.schemaCurrent} `;
                    setTSBar(text, tip);
                }

                //********** FAST info **********/
                const fastInfo = await callHTTP(
                    'GET', 
                    hostToken.host, 
                    '/mgmt/shared/fast/info', 
                    hostToken.token
                );
                    
                if (fastInfo.status === 200) {
                    const text = `FAST(${fastInfo.body.version})`;
                    setFastBar(text);
                }
                    
                //********** AS3 info **********/
                const as3Info = await callHTTP(
                    'GET', 
                    hostToken.host, 
                    '/mgmt/shared/appsvcs/info', 
                    hostToken.token
                );

                if (as3Info.status === 200) {
                    const text = `AS3(${as3Info.body.version})`;
                    const tip = `schemaCurrent: ${as3Info.body.schemaCurrent} `;
                    setAS3Bar(text, tip);
                }

                const doInfo = await callHTTP(
                    'GET', 
                    hostToken.host, 
                    '/mgmt/shared/declarative-onboarding/info', 
                    hostToken.token
                );

                if (doInfo.status === 200) {
                    // for some reason DO responds with a list for version info...
                    const text = `DO(${doInfo.body[0].version})`;
                    const tip = `schemaCurrent: ${doInfo.body[0].schemaCurrent} `;
                    setDOBar(text, tip);
                }
            }
        );
    }



    /**
     * Used to get F5 Host info
     * @param device BIG-IP/Host/Device in <user>@<host/ip> format
     * @param password User Password
     */
    async getF5HostInfo(device: string, password: string) {
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                return callHTTP(
                    'GET', 
                    hostToken.host, 
                    '/mgmt/shared/identified-devices/config/device-info', 
                    hostToken.token
                );
            }
        );
    }



    /**
     * Used to issue bash commands to device over API
     * @param device BIG-IP/Host/Device in <user>@<host/ip> format
     * @param password User Password
     * @param cmd Bash command to execute, or tmsh + <tmsh command>
     */
    async issueBash(device: string, password: string, cmd: string) {
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                return callHTTP(
                    'POST', 
                    hostToken.host, 
                    '/mgmt/tm/util/bash', 
                    hostToken.token,
                    {
                        command: 'run',
                        utilCmdArgs: `-c '${cmd}'`
                    }
                );
            }
        );
    }


    /*
    * Used to issue bash commands to device over API
    */
    async getTsInfo(device: string, password: string) {
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                return callHTTP(
                    'GET', 
                    hostToken.host, 
                    '/mgmt/shared/telemetry/info', 
                    hostToken.token
                );
            }
        );
    }



    /**
     * Get current Telemetry Streaming Declaration
     * @param device BIG-IP/Host/Device in <user>@<host/ip> format
     * @param password User Password
     */
    async getTSDec(device: string, password: string) {
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                return callHTTP(
                    'GET', 
                    hostToken.host, 
                    '/mgmt/shared/telemetry/declare', 
                    hostToken.token
                );
            }
        );
    }


    /**
     * Get current Telemetry Streaming Declaration
     * @param device BIG-IP/Host/Device in <user>@<host/ip> format
     * @param password User Password
     */
    async postTSDec(device: string, password: string, dec: object) {
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                return callHTTP(
                    'POST', 
                    hostToken.host, 
                    '/mgmt/shared/telemetry/declare', 
                    hostToken.token,
                    dec
                );
            }
        );
    }


    /**
     * Get current Declarative Onboarding Declaration
     * @param device BIG-IP/Host/Device in <user>@<host/ip> format
     * @param password User Password
     */
    async getDoDec(device: string, password: string) {
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                return callHTTP(
                    'GET', 
                    hostToken.host, 
                    '/mgmt/shared/declarative-onboarding/', 
                    hostToken.token
                );
            }
        );
    }


    /**
     * POST Declarative Onboarding Declaration
     * @param device BIG-IP/Host/Device in <user>@<host/ip> format
     * @param password User Password
     */
    async postDoDec(device: string, password: string, dec: object) {
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                return callHTTP(
                    'POST', 
                    hostToken.host, 
                    '/mgmt/shared/declarative-onboarding/', 
                    hostToken.token,
                    dec
                );
            }
        );
    }



    /**
     * DO Inspect - returns potential DO configuration items
     * @param device BIG-IP/Host/Device in <user>@<host/ip> format
     * @param password User Password
     */
    async doInspect(device: string, password: string) {
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                return callHTTP(
                    'GET', 
                    hostToken.host, 
                    '/mgmt/shared/declarative-onboarding/inspect', 
                    hostToken.token,
                );
            }
        );
    }



    /**
     * DO tasks - returns executed tasks
     * @param device BIG-IP/Host/Device in <user>@<host/ip> format
     * @param password User Password
     */
    async doTasks(device: string, password: string) {
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                return callHTTP(
                    'GET', 
                    hostToken.host, 
                    '/mgmt/shared/declarative-onboarding/task', 
                    hostToken.token,
                );
            }
        );
    }



    /**
     * AS3 declarations
     * no tenant, returns ALL AS3 decs
     * @param device BIG-IP/Host/Device in <user>@<host/ip> format
     * @param password User Password
     * @param tenant tenant(optional)
     */
    async getAS3Decs(device: string, password: string, tenant: string = '') {
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                return callHTTP(
                    'GET', 
                    hostToken.host, 
                    `/mgmt/shared/appsvcs/declare/${tenant}`, 
                    hostToken.token,
                );
            }
        );
    }



    /**
     * Delete AS3 Tenant
     * @param device BIG-IP/Host/Device in <user>@<host/ip> format
     * @param password User Password
     * @param tenant tenant
     */
    async delAS3Tenant(device: string, password: string, tenant: string) {
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                return callHTTP(
                    'DELETE', 
                    hostToken.host, 
                    `/mgmt/shared/appsvcs/declare/${tenant}`, 
                    hostToken.token,
                );
            }
        );
    }



    /**
     * AS3 tasks - returns executed tasks
     * @param device BIG-IP/Host/Device in <user>@<host/ip> format
     * @param password User Password
     */
    async getAS3Tasks(device: string, password: string) {
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                return callHTTP(
                    'GET', 
                    hostToken.host, 
                    '/mgmt/shared/appsvcs/task/', 
                    hostToken.token,
                );
            }
        );
    }


    /**
     * AS3 tasks - returns executed tasks
     * @param device BIG-IP/Host/Device in <user>@<host/ip> format
     * @param password User Password
     */
    async getAS3Task(device: string, password: string, id: string) {
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                return callHTTP(
                    'GET', 
                    hostToken.host, 
                    `/mgmt/shared/appsvcs/task/${id}`, 
                    hostToken.token,
                );
            }
        );
    }



    /**
     * Get Fast Info - fast service version/details
     * @param device BIG-IP/Host/Device in <user>@<host/ip> format
     * @param password User Password
     */
    async getF5FastInfo(device: string, password: string) {
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                return callHTTP(
                    'GET', 
                    hostToken.host, 
                    `/mgmt/shared/fast/info`, 
                    hostToken.token,
                );
            }
        );
    }



    /**
     * Post AS3 Dec
     * @param device BIG-IP/Host/Device in <user>@<host/ip> format
     * @param password User Password
     * @param dec Delcaration
     */
    async postAS3Dec(device: string, password: string, dec: object) {
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                return callHTTP(
                    'POST', 
                    hostToken.host, 
                    `/mgmt/shared/appsvcs/declare/`, 
                    hostToken.token,
                    dec
                );
            }
        );
    }
};




function makeRequest(opts: object, payload: object = {}): Promise<any> {

    const defaultOpts = {
        host: <string> '',
        path: <string> '',
        method: <string> 'GET',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/json'
        }
    };

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
                if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 202 || res.statusCode === 404) {
                    return resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body
                    });
                } else {

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



const getAuthToken = async (host: string, username: string, password: string) => makeRequest(
{
    host,
    path: '/mgmt/shared/authn/login',
    method: 'POST',
}, 
{ 
    username,
    password
})
.then( response => {
    if (response.status === 200) {
        return { 
            host: host, 
            token: response.body.token.token 
        };
    } else {
        // clear cached password for this device
        ext.keyTar.deletePassword(
            'f5Hosts',
            `${username}@${host}`
            );
        throw new Error(`error from getAuthTokenNOT200: ${response}`);
    }
});

const callHTTP = (method: string, host: string, path: string, token: string, payload: object = {}) => makeRequest(
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


// const getFastInfo = (host: string, token: string) => makeRequest({
//     host,
//     path: '/mgmt/shared/fast/info',
//     headers: {
//         'Content-Type': 'application/json',
//         'X-F5-Auth-Token': token
//     }
// })
// .then( response => {
//     console.log('value in getFastInfo: ' + JSON.stringify(response));
//     // Promise.resolve(value.body.token);
//     return response.body;
// });
