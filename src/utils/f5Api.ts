'use strict';

import * as vscode from 'vscode';
import { request } from 'https';
import { 
    setHostStatusBar, 
    setHostnameBar,
    setAS3Bar, 
    setFastBar,
    setDOBar, 
    setTSBar,
    getPassword
 } from './utils';
import { ext } from '../extensionVariables';
// import { rejects } from 'assert';
// import { KeyTar, tryGetKeyTar } from './utils/keytar';

/**
 * F5 API commands
 */
export class F5Api {


    async connectF5(device: string, password: string) {
        // console.log(`connectF5: ${device} - ${password}`);
        var [username, host] = device.split('@');
        getAuthToken(host, username, password)
            .then( async hostToken => {

                // cache password in keytar
                ext.keyTar.setPassword('f5Hosts', device, password);
                
                setHostStatusBar(device);
                // const now = getHostStatusBar();
                // console.log(`getHostStatusBar from connectF5: ${JSON.stringify(now)}`)
                vscode.window.showInformationMessage(`Successfully connected to ${host}`);
                // return hostToken;

                const hostInfo = await callHTTP(
                    'GET', 
                    hostToken.host, 
                    '/mgmt/shared/identified-devices/config/device-info', 
                    hostToken.token
                );

                if (hostInfo.status === 200) {
                    // console.log(`TS INFO: ${JSON.stringify(tsInfo.body)}`)
                    const text = `${hostInfo.body.hostname}`;
                    const tip = `TMOS: ${hostInfo.body.version}`;
                    setHostnameBar(text, tip);
                }

                const tsInfo = await callHTTP(
                    'GET', 
                    hostToken.host, 
                    '/mgmt/shared/telemetry/info', 
                    hostToken.token
                );

                if (tsInfo.status === 200) {
                    // console.log(`TS INFO: ${JSON.stringify(tsInfo.body)}`)
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
                    // console.log(`AS3 INFO: ${JSON.stringify(as3Info.body)}`)
                    const text = `FAST(${fastInfo.body.version})`;
                    // const tip = `schemaCurrent: ${fastInfo.body.schemaCurrent} `
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
                    // console.log(`AS3 INFO: ${JSON.stringify(as3Info.body)}`)
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
                    // console.log(`DO INFO: ${JSON.stringify(doInfo.body)}`)
                    // for some reason DO responds with a list for version info...
                    const text = `DO(${doInfo.body[0].version})`;
                    const tip = `schemaCurrent: ${doInfo.body[0].schemaCurrent} `;
                    setDOBar(text, tip);
                }
            }
        );
        // return auth;
    }



    /**
     * Used to get F5 Host info
     * @param device BIG-IP/Host/Device in <user>@<host/ip> format
     * @param password User Password
     */
    async getF5HostInfo(device: string, password: string) {
        // console.log(`issueBash: ${device} - ${password}`);
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                // if (hostToken === undefined) {
                //     throw new Error('hostToken blank, auth failed');
                // }
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
        // console.log(`issueBash: ${device} - ${password}`);
        var [username, host] = device.split('@');
        return getAuthToken(host, username, password)
            .then( hostToken => {
                // if (hostToken === undefined) {
                //     throw new Error('hostToken blank, auth failed');
                // }
                // // console.log(`inside-connectF5-hostToken: ${JSON.stringify(hostToken)}`);

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
        // console.log(`issueBash: ${device} - ${password}`);
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
        // console.log(`issueBash: ${device} - ${password}`);
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
        // console.log(`issueBash: ${device} - ${password}`);
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
        // console.log(`issueBash: ${device} - ${password}`);
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
        // console.log(`issueBash: ${device} - ${password}`);
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
        // console.log(`issueBash: ${device} - ${password}`);
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


//     async postAS3(dec: object) {
//         var host: string = ext.hostStatusBar.text;
//         // const password: string = ext.hostStatusBar.password;
//         const password: string = await getPassword(host);

//         console.log(`declartion to postAS3: ${JSON.stringify(dec)}`);
        
//         if (host || password) {
//             var [username, host] = host.split('@');
//             getAuthToken(host, username, password)
//             .then( hostToken => {
//                 if (hostToken === undefined) {
//                     throw new Error('hostToken blank, auth failed');
//                 }
                
//                 callHTTP('POST', hostToken.host, '/mgmt/shared/appsvcs/declare/', hostToken.token, dec)
//                 .then( postInfo => {
                    
//                     console.log(`postAS3 response: ${JSON.stringify(postInfo)}`);
                    
//                     // if postInfo resposecode == 202
//                     //      capture 'id'
//                     //      GET on id will http/200

//                     vscode.workspace.openTextDocument({ 
//                         language: 'json', 
//                         content: JSON.stringify(postInfo, undefined, 4) 
//                     })
//                     .then( doc => {
//                         vscode.window.showTextDocument( doc, { preview: false });

//                         // if (postInfo.status == 202) {
//                         //     // postInfo.body.id
//                         //     console.log(`post STATUS: ${JSON.stringify(postInfo.body.id)}`)
                        
//                         //     vscode.window.showQuickPick(['yes', 'no'], {placeHolder: 'follow post async?'})
//                         //     .then( selection => {
//                         //         if (selection == 'yes'){
//                         //             console.log(`WINDOW SELECTION:  ${selection}`)
//                         //             // callHTTP('GET', hostToken.host, `/mgmt/shared/appsvcs/tasks/${postInfo.body.id}`, hostToken.token)
//                         //             // .then( newPostInfo => {
//                         //             //     // var lastLine = vscode.TextEdit.document.lineAt(textEditor.document.lineCount - 1);
//                         //             //     vscode.TextEdit.insert(-1, newPostInfo)
//                         //             // });
//                         //         } 
//                         //         // else {
//                         //         //     throw new Error('User Cancelled AS3 post follow-up')
//                         //         // }
//                         //     });
//                         // }
                        
//                     });


//                 });
//             });
//         } else {
//             console.error(`postInfo - NO host or password details: ${host} - ${password}`);
//             vscode.window.showInformationMessage(`Connect to device first!!!`);
//             //instead of errors, just call the connect command
//         }
//     }
};




function makeRequest(opts: object, payload: object = {}): Promise<any> {

    const defaultOpts = {
        // host: '',
        // path: '',
        // method: 'GET',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    console.log('makeRequest---opts: ' + JSON.stringify(opts));
    
    // combine defaults with passed in options
    const combOpts = Object.assign({}, defaultOpts, opts);

    // console.log('makeRequest---combOpts: ' + JSON.stringify(combOpts));
    // console.log('makeRequest---defaultOpts: ' + JSON.stringify(defaultOpts));
    // console.log('makeRequest---payload: ' + JSON.stringify(payload));
    
    // console.log('Bout to call API token request')
    return new Promise((resolve, reject) => {
        const req = request(combOpts, (res) => {
            const buffer: any = [];
            res.setEncoding('utf8');
            // console.log('Sending::: ' )
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
                
                 // configure global logging parameters
                // console.log('makeRequest***STATUS: ' + res.statusCode);
                // console.log('makeRequest***HEADERS: ' + JSON.stringify(res.headers));
                // console.log('makeRequest***BODY: ' + JSON.stringify(body));

                // if (res.statusCode == 401) {
                //     console.log(`GOT 401!!!!!`)
                // }
                
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
    
    // if (response.status != 200) {
    //     // clear cached password for this device
    //     ext.keyTar.deletePassword(
    //         'f5Hosts',
    //         `${username}@${host}`
    //         )
    //     throw new Error(`error from getAuthTokenNOT200: ${response}`);
    // }
    // return { 
    //     host: host, 
    //     token: response.body.token.token 
    // };
});



// const getF5Info = (host: string, token: string) => makeRequest({
//     host,
//     path: '/mgmt/shared/identified-devices/config/device-info',
//     method: 'GET',
//     headers: {
//         'Content-Type': 'application/json',
//         'X-F5-Auth-Token': token
//     }
// })
// .then( response => {
//     console.log('value in getF5Info: ' + JSON.stringify(response));
//     // Promise.resolve(value.body.token);
//     return response.body;
// });


// const getAS3Tasks = (host: string, token: string) => makeRequest({
//     host,
//     path: '/mgmt/shared/appsvcs/task/',
//     method: 'GET',
//     headers: {
//         'Content-Type': 'application/json',
//         'X-F5-Auth-Token': token
//     }
// })
// .then( response => {
//     console.log('value in getF5Info: ' + JSON.stringify(response));
//     // Promise.resolve(value.body.token);
//     return response.body;
// });



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
    console.log('response from callHTTP: ' + JSON.stringify(response));
    // Promise.resolve(value.body.token);
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
