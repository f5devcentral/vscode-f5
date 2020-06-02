'use strict';

import * as vscode from 'vscode';
import { request } from 'https';
import * as utils from './utils';
import { ext } from '../extensionVariables';


/**
 * F5 API commands
 */
// export class F5Api {


export async function connectF5(device: string, password: string) {
        var [username, host] = device.split('@');
        getAuthToken(host, username, password)
            .then( async token => {

                // cache password in keytar
                ext.keyTar.setPassword('f5Hosts', device, password);
                
                utils.setHostStatusBar(device);
                // vscode.window.showInformationMessage(`Successfully connected to ${host}`);

                //********** Host info **********/
                const hostInfo = await callHTTP(
                    'GET', 
                    host, 
                    '/mgmt/shared/identified-devices/config/device-info', 
                    token
                );

                if (hostInfo.status === 200) {
                    const text = `${hostInfo.body.hostname}`;
                    const tip = `TMOS: ${hostInfo.body.version}`;
                    utils.setHostnameBar(text, tip);
                }

                //********** TS info **********/
                const tsInfo = await callHTTP(
                    'GET', 
                    host, 
                    '/mgmt/shared/telemetry/info', 
                    token
                );

                if (tsInfo.status === 200) {
                    const text = `TS(${tsInfo.body.version})`;
                    const tip = `nodeVersion: ${tsInfo.body.nodeVersion}\r\nschemaCurrent: ${tsInfo.body.schemaCurrent} `;
                    utils.setTSBar(text, tip);
                }

                //********** FAST info **********/
                const fastInfo = await callHTTP(
                    'GET', 
                    host, 
                    '/mgmt/shared/fast/info', 
                    token
                );
                    
                if (fastInfo.status === 200) {
                    const text = `FAST(${fastInfo.body.version})`;
                    utils.setFastBar(text);
                }
                    
                //********** AS3 info **********/
                const as3Info = await callHTTP(
                    'GET', 
                    host, 
                    '/mgmt/shared/appsvcs/info', 
                    token
                );

                if (as3Info.status === 200) {
                    const text = `AS3(${as3Info.body.version})`;
                    const tip = `schemaCurrent: ${as3Info.body.schemaCurrent} `;
                    utils.setAS3Bar(text, tip);
                }

                const doInfo = await callHTTP(
                    'GET', 
                    host, 
                    '/mgmt/shared/declarative-onboarding/info', 
                    token
                );

                if (doInfo.status === 200) {
                    // for some reason DO responds with a list for version info...
                    const text = `DO(${doInfo.body[0].version})`;
                    const tip = `schemaCurrent: ${doInfo.body[0].schemaCurrent} `;
                    utils.setDOBar(text, tip);
                }
            }
        );
    }



/**
 * Used to get F5 Host info
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 */
export async function getF5HostInfo(device: string, password: string) {
    var [username, host] = device.split('@');
    return getAuthToken(host, username, password)
        .then( token=> {
            return callHTTP(
                'GET', 
                host, 
                '/mgmt/shared/identified-devices/config/device-info', 
                token
            );
        }
    );
}



/**
 * Used to issue bash commands to device over API
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 * @param cmd Bash command to execute, or tmsh + <tmsh command>
 */
export async function issueBash(device: string, password: string, cmd: string) {
    var [username, host] = device.split('@');
    const authToken = await getAuthToken(host, username, password);
    const responseA = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Issuing base command over API`
    }, async () => {
        let responseB = await callHTTP('POST', host, `/mgmt/tm/util/bash`, authToken,
            {
                command: 'run',
                utilCmdArgs: `-c '${cmd}'`
            }
        );
        return responseB;
    });
    return responseA;

    // var [username, host] = device.split('@');
    // return getAuthToken(host, username, password)
    //     .then( token=> {
    //         return callHTTP(
    //             'POST', 
    //             host,
    //             '/mgmt/tm/util/bash', 
    //             token,
    //             {
    //                 command: 'run',
    //                 utilCmdArgs: `-c '${cmd}'`
    //             }
    //         );
    //     }
    // );
}


/**
 * Get Telemetry Streaming Service info
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 */
export async function getTsInfo(device: string, password: string) {
    var [username, host] = device.split('@');
    return getAuthToken(host, username, password)
        .then( token=> {
            return callHTTP(
                'GET', 
                host,
                '/mgmt/shared/telemetry/info', 
                token
            );
        }
    );
}



/**
 * Get current Telemetry Streaming Declaration
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 */
export async function getTSDec(device: string, password: string) {
    var [username, host] = device.split('@');
    const authToken = await getAuthToken(host, username, password);
    const responseA = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Getting TS Dec`
    }, async () => {
        let responseB = await callHTTP('GET', host, `/mgmt/shared/telemetry/declare`, authToken);
        return responseB;
    });
    return responseA;

    // var [username, host] = device.split('@');
    // return getAuthToken(host, username, password)
    //     .then( token=> {
    //         return callHTTP(
    //             'GET', 
    //             host,
    //             '/mgmt/shared/telemetry/declare', 
    //             token
    //         );
    //     }
    // );
}


/**
 * Get current Telemetry Streaming Declaration
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 */
export async function postTSDec(device: string, password: string, dec: object) {
    var [username, host] = device.split('@');
    const authToken = await getAuthToken(host, username, password);
    const responseA = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Posting TS Dec`
    }, async () => {
        let responseB = await callHTTP('POST', host, `/mgmt/shared/telemetry/declare`, authToken, dec);
        return responseB;
    });
    return responseA;

    // var [username, host] = device.split('@');
    // return getAuthToken(host, username, password)
    //     .then( token=> {
    //         return callHTTP(
    //             'POST', 
    //             host,
    //             '/mgmt/shared/telemetry/declare', 
    //             token,
    //             dec
    //         );
    //     }
    // );
}


/**
 * Get current Declarative Onboarding Declaration
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 */
export async function getDoDec(device: string, password: string) {
    var [username, host] = device.split('@');
    const authToken = await getAuthToken(host, username, password);
    const responseA = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Getting DO Dec`
    }, async () => {
        let responseB = await callHTTP('GET', host, `/mgmt/shared/declarative-onboarding/`, authToken);
        return responseB;
    });
    return responseA;

    // var [username, host] = device.split('@');
    // return getAuthToken(host, username, password)
    //     .then( token=> {
    //         return callHTTP(
    //             'GET', 
    //             host,
    //             '/mgmt/shared/declarative-onboarding/', 
    //             token
    //         );
    //     }
    // );
}


interface Dec {
    async?: string
}

/**
 * POST Declarative Onboarding Declaration
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 * @param dec DO declaration object
 */
export async function postDoDec(device: string, password: string, dec: Dec) {
    var [username, host] = device.split('@');

    if((dec.hasOwnProperty('async') && dec.async === 'false' ) || !dec.hasOwnProperty('async')) {
        vscode.window.showWarningMessage('async DO post highly recommended!!!');
    }

    const authToken = await getAuthToken(host, username, password);
    const progressPost = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Posting DO Declaration",
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            // this logs but doesn't actually cancel...
            console.log("User canceled the async post");
            return new Error(`User canceled the async post`);
        });

        // post initial dec
        let response = await callHTTP('POST', host, `/mgmt/shared/declarative-onboarding/`, authToken, dec);

        // if bad dec, return response
        if(response.status === 422) {
            return response;
        }

        progress.report({ message: `${response.body.result.message}`});
        await new Promise(resolve => { setTimeout(resolve, 1000); });

        let taskId: string | undefined;
        if(response.status === 202) {
            taskId = response.body.id;

            // get got a 202 and a taskId (single dec), check task status till complete
            while(taskId) {
                response = await callHTTP('GET', host, `/mgmt/shared/declarative-onboarding/task/${taskId}`, authToken);

                // if not 'in progress', its done, clear taskId to break loop
                if(response.body.result.status === 'FINISHED' || response.body.result.status === 'ERROR' || response.body.result.status === 'OK'){
                    taskId = undefined;
                    return response;
                }
                progress.report({ message: `${response.body.result.message}`});
                await new Promise(resolve => { setTimeout(resolve, (ext.settings.asyncInterval * 1000)); });
            }
        }
        // return response from regular post
        return response;
    });
    return progressPost;
}



/**
 * DO Inspect - returns potential DO configuration items
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 */
export async function doInspect(device: string, password: string) {
    var [username, host] = device.split('@');
    const authToken = await getAuthToken(host, username, password);
    const responseA = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Getting DO Inspect`
    }, async () => {
        let responseB = await callHTTP('GET', host, `/mgmt/shared/declarative-onboarding/inspect`, authToken);
        return responseB;
    });
    return responseA;

    // var [username, host] = device.split('@');
    // return getAuthToken(host, username, password)
    //     .then( token=> {
    //         return callHTTP(
    //             'GET', 
    //             host,
    //             '/mgmt/shared/declarative-onboarding/inspect', 
    //             token,
    //         );
    //     }
    // );
}



/**
 * DO tasks - returns executed tasks
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 */
export async function doTasks(device: string, password: string) {
    var [username, host] = device.split('@');
    const authToken = await getAuthToken(host, username, password);
    const responseA = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Getting DO Tasks`
    }, async () => {
        let responseB = await callHTTP('GET', host, `/mgmt/shared/declarative-onboarding/task`, authToken);
        return responseB;
    });
    return responseA;

    // var [username, host] = device.split('@');
    // return getAuthToken(host, username, password)
    //     .then( token=> {
    //         return callHTTP(
    //             'GET', 
    //             host,
    //             '/mgmt/shared/declarative-onboarding/task', 
    //             token,
    //         );
    //     }
    // );
}



/**
 * AS3 declarations
 * no tenant, returns ALL AS3 decs
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 * @param tenant tenant(optional)
 */
export async function getAS3Decs(device: string, password: string, tenant: string = '') {
    var [username, host] = device.split('@');
    return getAuthToken(host, username, password)
        .then( token=> {
            return callHTTP(
                'GET', 
                host,
                `/mgmt/shared/appsvcs/declare/${tenant}`, 
                token,
            );
        }
    );
}



/**
 * Delete AS3 Tenant
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 * @param tenant tenant
 */
export async function delAS3Tenant(device: string, password: string, tenant: string) {
    var [username, host] = device.split('@');
    const authToken = await getAuthToken(host, username, password);
    const progressDelete = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Deleting ${tenant} Tenant`
    }, async () => {
        let response = await callHTTP('DELETE', host, `/mgmt/shared/appsvcs/declare/${tenant}`, authToken);
        return response;
    });
    return progressDelete;
}



/**
 * AS3 tasks - returns executed tasks
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 */
export async function getAS3Tasks(device: string, password: string) {
    var [username, host] = device.split('@');
    return getAuthToken(host, username, password)
        .then( token=> {
            return callHTTP(
                'GET', 
                host,
                '/mgmt/shared/appsvcs/task/', 
                token,
            );
        }
    );
}


/**
 * AS3 tasks - returns executed tasks
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 */
export async function getAS3Task(device: string, password: string, id: string) {
    var [username, host] = device.split('@');
    const authToken = await getAuthToken(host, username, password);
    const responseA = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Getting AS3 Task`
    }, async () => {
        let responseB = await callHTTP('GET', host, `/mgmt/shared/appsvcs/task/${id}`, authToken);
        return responseB;
    });
    return responseA;

    // var [username, host] = device.split('@');
    // return getAuthToken(host, username, password)
    //     .then( token=> {
    //         return callHTTP(
    //             'GET', 
    //             host,
    //             `/mgmt/shared/appsvcs/task/${id}`, 
    //             token,
    //         );
    //     }
    // );
}



/**
 * Get Fast Info - fast service version/details
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 */
export async function getF5FastInfo(device: string, password: string) {
    var [username, host] = device.split('@');
    return getAuthToken(host, username, password)
        .then( token => {
            return callHTTP(
                'GET', 
                host, 
                `/mgmt/shared/fast/info`, 
                token,
            );
        }
    );
};



/**
 * Post AS3 Dec
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 * @param postParam 
 * @param dec Delcaration
 */
export async function postAS3Dec(device: string, password: string, postParam: string = '', dec: object) {
        const [username, host] = device.split('@');

        const authToken = await getAuthToken(host, username, password);
        const progressPost = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Posting Declaration",
            cancellable: true
        }, async (progress, token) => {
            token.onCancellationRequested(() => {
                // this logs but doesn't actually cancel...
                console.log("User canceled the async post");
                return new Error(`User canceled the async post`);
            });

            // post initial dec
            let response = await callHTTP('POST', host, `/mgmt/shared/appsvcs/declare?${postParam}`, authToken, dec);

            // if bad dec, return response
            if(response.status === 422) {
                return response;
            }

            // if post has multiple decs it will return with an array of status's for each
            //      so we just stick with "processing"
            if(response.body.hasOwnProperty('items')){
                progress.report({ message: `  processing multiple declarations...`});
                await new Promise(resolve => { setTimeout(resolve, 1000); });
            } else {
                // single dec detected...
                progress.report({ message: `${response.body.results[0].message}`});
                await new Promise(resolve => { setTimeout(resolve, 1000); });
            }

        
            let taskId: string | undefined;
            if(response.status === 202) {
                taskId = response.body.id;

                // get got a 202 and a taskId (single dec), check task status till complete
                while(taskId) {
                    response = await callHTTP('GET', host, `/mgmt/shared/appsvcs/task/${taskId}`, authToken);

                    // if not 'in progress', its done, clear taskId to break loop
                    if(response.body.results[0].message !== 'in progress'){
                        taskId = undefined;
                        return response;
                    }

                    progress.report({ message: `${response.body.results[0].message}`});
                    await new Promise(resolve => { setTimeout(resolve, (ext.settings.asyncInterval * 1000)); });

                }
                // return response from successful async
                // return response;

                progress.report({ message: `Found multiple decs, check tasks view for details`});
                await new Promise(resolve => { setTimeout(resolve, 3000); });
                
                progress.report({ message: `refreshing as3 tree views...`});
                await new Promise(resolve => { setTimeout(resolve, 3000); });
            }
            // return response from regular post
            return response;
        });
        return progressPost;
    }
// };


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


/**
 * Get tmos auth token
 * @param host fqdn or IP address of destination
 * @param username 
 * @param password 
 */
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