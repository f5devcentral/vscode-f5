'use strict';

import * as vscode from 'vscode';
var https = require('https');
import * as utils from './utils';
import { ext } from '../extensionVariables';
import logger from './logger';
// import { getAuthToken, callHTTP } from './coreF5HTTPS';
// import { memoryUsage } from 'process';


/**
 * F5 API commands
 */
// export class F5Api {


// export async function connectF5(device: string, password: string) {
//     var [username, host] = device.split('@');


//     const progressPost = await vscode.window.withProgress({
//         location: vscode.ProgressLocation.Notification,
//         title: `Connecting to ${host}`,
//         cancellable: true
//     }, async (progress, token) => {
//         token.onCancellationRequested(() => {
//             // this logs but doesn't actually cancel...
//             logger.debug("User canceled device connect");
//             return new Error(`User canceled device connect`);
//         });
//         /**
//          * setup logonProvider discovery
//          * discover what logonProvider is configured, default=tmos
//          * https://github.com/DumpySquare/vscode-f5-fast/issues/38
//          * https://github.com/DumpySquare/vscode-f5-fast/issues/34
//          */

//         // progress.report({ message: `${host}`});
//         // const resp = await axios.request({
//         //     httpsAgent: new https.Agent({ rejectUnauthorized: false }),
//         //     method: 'GET',
//         //     baseURL: `https://${host}`,
//         //     url: '/mgmt/tm/auth/source',
//         //     auth: { username, password },
//         //     timeout: 3000
//         //     // connectTimeout: 1000,
//         //     })
//         //     // .then( resp => {
//         //     //     logger.debug('AXIOS auth source response', resp);
//         //     //     Promise.resolve(resp);
//         //     //     return resp;
//         //     // })
//         //     .catch( err => {
//         //         logger.debug('AXIOS auth source err', err);
//         //         logger.debug('AXIOS auth source err', err.response);
//         //         // Promise.reject(err);
//         //         return err;
//         //     });

//         // logger.debug('=======  axResp', resp);

//         // if(!resp) {
//         //     vscode.window.showErrorMessage(`Could not connect to ${host}`);
//         //     return;
//         // }
        

//         // // if req/resp successful
//         // if (resp.status === 200) {
//         //     // if not default, update the logonProviderName value
//         //     if(resp.data.type !== 'local'){
//         //         logger.debug(`TMOS remote auth provider detected --> ${resp.data.type}`);
//         //         progress.report({ message: ` ${resp.data.type} auth provider detected`});
//         //         // change default 'tmos' value to what is configured
//         //         ext.logonProviderName = resp.data.type;
//         //     } else {
//         //         logger.debug(`TMOS local auth detected`);
//         //     }
//         // } else if (resp.status === 401 && resp.data.message === "Authentication failed.") {
//         //     // clear cached password for this device
//         //     ext.keyTar.deletePassword('f5Hosts', `${username}@${host}`);
    
//         //     vscode.window.showErrorMessage(`---HTTP FAILURE--- ${resp.status} - ${resp.data.message}`);
//         //     console.error(`---HTTP FAILURE--- ${resp.status} - ${resp.data.message}`);
//         //     throw new Error(`---HTTP FAILURE--- ${resp.status} - ${resp.data.message}`);
//         // } else {
//         //     // await new Promise(resolve => { setTimeout(resolve, 3000); });
//         //     vscode.window.showErrorMessage(`---HTTP FAILURE--- ${resp.status} - ${resp.data.message}`);
//         //     console.error(`---HTTP FAILURE--- ${resp.status} - ${resp.data.message}`);
//         //     throw new Error(`---UNKNOWN HTTP FAILURE--- ${resp.status} - ${resp.data.message}`);
            
//         // }

//         // debugger;

//         // get auth token and discover ATC services
//         const discovery = await getAuthToken(host, username, password)
//             .then( async token => {

//                 // cache password in keytar
//                 ext.keyTar.setPassword('f5Hosts', device, password);
                
//                 utils.setHostStatusBar(device);
//                 // vscode.window.showInformationMessage(`Successfully connected to ${host}`);

//                 let returnInfo: string[] = [];

//                 //********** Host info **********/
//                 const hostInfo = await callHTTP(
//                     'GET', 
//                     host, 
//                     '/mgmt/shared/identified-devices/config/device-info', 
//                     token
//                 );

//                 if (hostInfo.status === 200) {
//                     const text = `${hostInfo.body.hostname}`;
//                     const tip = `TMOS: ${hostInfo.body.version}`;
//                     utils.setHostnameBar(text, tip);
//                     returnInfo.push(text);
//                 }

//                 progress.report({ message: ` CONNECTED, checking installed ATC services...`});

//                 //********** FAST info **********/
//                 const fastInfo = await callHTTP(
//                     'GET', 
//                     host, 
//                     '/mgmt/shared/fast/info', 
//                     token
//                 );
                    
//                 if (fastInfo.status === 200) {
//                     const text = `FAST(${fastInfo.body.version})`;
//                     utils.setFastBar(text);
//                     returnInfo.push(text);
//                 }
                    
//                 //********** AS3 info **********/
//                 const as3Info = await callHTTP(
//                     'GET', 
//                     host, 
//                     '/mgmt/shared/appsvcs/info', 
//                     token
//                 );

//                 if (as3Info.status === 200) {
//                     const text = `AS3(${as3Info.body.version})`;
//                     const tip = `schemaCurrent: ${as3Info.body.schemaCurrent} `;
//                     utils.setAS3Bar(text, tip);
//                     returnInfo.push(text);
//                 }
                
//                 //********** DO info **********/
//                 const doInfo = await callHTTP(
//                     'GET', 
//                     host, 
//                     '/mgmt/shared/declarative-onboarding/info', 
//                     token
//                 );

//                 if (doInfo.status === 200) {
//                     // for some reason DO responds with a list for version info...
//                     const text = `DO(${doInfo.body[0].version})`;
//                     const tip = `schemaCurrent: ${doInfo.body[0].schemaCurrent} `;
//                     utils.setDOBar(text, tip);
//                     returnInfo.push(text);
//                 }

//                 //********** TS info **********/
//                 const tsInfo = await callHTTP(
//                     'GET', 
//                     host, 
//                     '/mgmt/shared/telemetry/info', 
//                     token
//                 );

//                 if (tsInfo.status === 200) {
//                     const text = `TS(${tsInfo.body.version})`;
//                     const tip = `nodeVersion: ${tsInfo.body.nodeVersion}\r\nschemaCurrent: ${tsInfo.body.schemaCurrent} `;
//                     utils.setTSBar(text, tip);
//                     returnInfo.push(text);
//                 }
//                 // Promise.resolve(returnInfo);
//                 return returnInfo;
//             }
//         );
//         return discovery;
//     });
//     return progressPost;
// }



// /**
//  * Used to get F5 Host info
//  * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
//  * @param password User Password
//  */
// export async function getF5HostInfo(device: string, password: string) {
//     var [username, host] = device.split('@');
//     return getAuthToken(host, username, password)
//         .then( token=> {
//             return callHTTP(
//                 'GET', 
//                 host, 
//                 '/mgmt/shared/identified-devices/config/device-info', 
//                 token
//             );
//         }
//     );
// }



// /**
//  * Used to issue bash commands to device over API
//  * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
//  * @param password User Password
//  * @param cmd Bash command to execute, or tmsh + <tmsh command>
//  */
// export async function issueBash(device: string, password: string, cmd: string) {
//     var [username, host] = device.split('@');
//     const authToken = await getAuthToken(host, username, password);
//     const responseA = await vscode.window.withProgress({
//         location: vscode.ProgressLocation.Notification,
//         title: `Issuing base command over API`
//     }, async () => {
//         let responseB = await callHTTP('POST', host, `/mgmt/tm/util/bash`, authToken,
//             {
//                 command: 'run',
//                 utilCmdArgs: `-c '${cmd}'`
//             }
//         );
//         return responseB;
//     });
//     return responseA;
// }


// /**
//  * Get Telemetry Streaming Service info
//  * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
//  * @param password User Password
//  */
// export async function getTsInfo(device: string, password: string) {
//     var [username, host] = device.split('@');
//     return getAuthToken(host, username, password)
//         .then( token=> {
//             return callHTTP(
//                 'GET', 
//                 host,
//                 '/mgmt/shared/telemetry/info', 
//                 token
//             );
//         }
//     );
// }



// /**
//  * Get current Telemetry Streaming Declaration
//  * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
//  * @param password User Password
//  */
// export async function getTSDec(device: string, password: string) {
//     var [username, host] = device.split('@');
//     const authToken = await getAuthToken(host, username, password);
//     const responseA = await vscode.window.withProgress({
//         location: vscode.ProgressLocation.Notification,
//         title: `Getting TS Dec`
//     }, async () => {
//         let responseB = await callHTTP('GET', host, `/mgmt/shared/telemetry/declare`, authToken);
//         return responseB;
//     });
//     return responseA;

//     // var [username, host] = device.split('@');
//     // return getAuthToken(host, username, password)
//     //     .then( token=> {
//     //         return callHTTP(
//     //             'GET', 
//     //             host,
//     //             '/mgmt/shared/telemetry/declare', 
//     //             token
//     //         );
//     //     }
//     // );
// }


// /**
//  * Get current Telemetry Streaming Declaration
//  * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
//  * @param password User Password
//  */
// export async function postTSDec(device: string, password: string, dec: object) {
//     var [username, host] = device.split('@');
//     const authToken = await getAuthToken(host, username, password);
//     const responseA = await vscode.window.withProgress({
//         location: vscode.ProgressLocation.Notification,
//         title: `Posting TS Dec`
//     }, async () => {
//         let responseB = await callHTTP('POST', host, `/mgmt/shared/telemetry/declare`, authToken, dec);
//         return responseB;
//     });
//     return responseA;

//     // var [username, host] = device.split('@');
//     // return getAuthToken(host, username, password)
//     //     .then( token=> {
//     //         return callHTTP(
//     //             'POST', 
//     //             host,
//     //             '/mgmt/shared/telemetry/declare', 
//     //             token,
//     //             dec
//     //         );
//     //     }
//     // );
// }


// /**
//  * Get current Declarative Onboarding Declaration
//  * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
//  * @param password User Password
//  */
// export async function getDoDec(device: string, password: string) {
//     var [username, host] = device.split('@');
//     const authToken = await getAuthToken(host, username, password);
//     const responseA = await vscode.window.withProgress({
//         location: vscode.ProgressLocation.Notification,
//         title: `Getting DO Dec`
//     }, async () => {
//         let responseB = await callHTTP('GET', host, `/mgmt/shared/declarative-onboarding/`, authToken);
//         return responseB;
//     });
//     return responseA;

//     // var [username, host] = device.split('@');
//     // return getAuthToken(host, username, password)
//     //     .then( token=> {
//     //         return callHTTP(
//     //             'GET', 
//     //             host,
//     //             '/mgmt/shared/declarative-onboarding/', 
//     //             token
//     //         );
//     //     }
//     // );
// }


interface Dec {
    async?: string
}

/**
 * POST Declarative Onboarding Declaration
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 * @param dec DO declaration object
 */
export async function postDoDec(dec: Dec) {
    // var [username, host] = device.split('@');

    if((dec.hasOwnProperty('async') && dec.async === 'false' ) || !dec.hasOwnProperty('async')) {
        vscode.window.showWarningMessage('async DO post highly recommended!!!');
    }

    const progressPost = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Posting DO Declaration",
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            // this logs but doesn't actually cancel...
            logger.debug("User canceled the async post");
            return new Error(`User canceled the async post`);
        });
        
        // post initial dec
        let resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/declarative-onboarding/`, {
            method: 'POST',
            body: dec
        });

        // if bad dec, return response
        if(resp.status === 422) {
            return resp;
        }

        progress.report({ message: `${resp.data.result.message}`});
        await new Promise(resolve => { setTimeout(resolve, 1000); });

        let taskId: string | undefined;
        let loopCount: number = 0;
        if(resp.status === 202) {
            taskId = resp.data.id;

            // get got a 202 and a taskId (single dec), check task status till complete
            while(taskId && loopCount <= 10) {
                loopCount++;
                resp = await ext.mgmtClient?.makeRequest(`/mgmt/shared/declarative-onboarding/task/${taskId}`);

                // if not 'in progress', its done, clear taskId to break loop
                if(resp.data.result.status === 'FINISHED' || resp.data.result.status === 'ERROR' || resp.data.result.status === 'OK'){
                    taskId = undefined;
                    vscode.window.showInformationMessage(`DO POST: ${resp.data.result.status}`);
                    return resp;
                }
                progress.report({ message: `${resp.data.result.message}`});
                await new Promise(resolve => { setTimeout(resolve, (ext.settings.asyncInterval * 1000)); });
            }
        }

        // return response from regular post
        return resp;
    });
    return progressPost;
}



// /**
//  * DO Inspect - returns potential DO configuration items
//  * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
//  * @param password User Password
//  */
// export async function doInspect(device: string, password: string) {
//     var [username, host] = device.split('@');
//     const authToken = await getAuthToken(host, username, password);
//     const responseA = await vscode.window.withProgress({
//         location: vscode.ProgressLocation.Notification,
//         title: `Getting DO Inspect`
//     }, async () => {
//         let responseB = await callHTTP('GET', host, `/mgmt/shared/declarative-onboarding/inspect`, authToken);
//         return responseB;
//     });
//     return responseA;
// }



// /**
//  * DO tasks - returns executed tasks
//  * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
//  * @param password User Password
//  */
// export async function doTasks(device: string, password: string) {
//     var [username, host] = device.split('@');
//     const authToken = await getAuthToken(host, username, password);
//     const responseA = await vscode.window.withProgress({
//         location: vscode.ProgressLocation.Notification,
//         title: `Getting DO Tasks`
//     }, async () => {
//         let responseB = await callHTTP('GET', host, `/mgmt/shared/declarative-onboarding/task`, authToken);
//         return responseB;
//     });
//     return responseA;
// }



// /**
//  * AS3 declarations
//  * no tenant, returns ALL AS3 decs
//  * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
//  * @param password User Password
//  * @param tenant tenant(optional)
//  */
// export async function getAS3Decs(device: string, password: string, tenant: string = '') {
//     var [username, host] = device.split('@');
//     return getAuthToken(host, username, password)
//         .then( token=> {
//             return callHTTP(
//                 'GET', 
//                 host,
//                 `/mgmt/shared/appsvcs/declare/${tenant}`, 
//                 token,
//             );
//         }
//     );
// }



// /**
//  * Delete AS3 Tenant
//  * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
//  * @param password User Password
//  * @param tenant tenant
//  */
// export async function delAS3Tenant(tenant: string) {
//     // var [username, host] = device.split('@');
//     // const authToken = await getAuthToken(host, username, password);
    
//     const progress = await vscode.window.withProgress({
//         location: vscode.ProgressLocation.Notification,
//         title: `Deleting ${tenant} Tenant`
//     }, async () => {
//         await ext.mgmtClient.getToken();
//         const resp: any = await ext.mgmtClient.makeRequest(`/mgmt/shared/appsvcs/declare/${tenant}`, {
//             method: 'DELETE'
//         });
//         return resp;
//     });
//     return progress;
// }



// /**
//  * AS3 tasks - returns executed tasks
//  * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
//  * @param password User Password
//  */
// export async function getAS3Tasks(device: string, password: string) {
//     var [username, host] = device.split('@');
//     return getAuthToken(host, username, password)
//         .then( token=> {
//             return callHTTP(
//                 'GET', 
//                 host,
//                 '/mgmt/shared/appsvcs/task/', 
//                 token,
//             );
//         }
//     );
// }


// /**
//  * AS3 tasks - returns executed tasks
//  * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
//  * @param password User Password
//  */
// export async function getAS3Task(id: string) {

//     const progress = await vscode.window.withProgress({
//         location: vscode.ProgressLocation.Notification,
//         title: `Getting AS3 Task`
//     }, async () => {
//         await ext.mgmtClient.getToken();
//         const resp = ext.mgmtClient.makeRequest(`/mgmt/shared/appsvcs/task/${id}`);
//         // const responseB = await callHTTP('GET', host, `/mgmt/shared/appsvcs/task/${id}`, authToken);
//         return resp;
//     });
//     return progress;
// }


/**
 * Post AS3 Dec
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 * @param postParam 
 * @param dec Delcaration
 */
export async function postAS3Dec(postParam: string = '', dec: object) {

    const progressPost = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Posting AS3 Declaration",
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            // this logs but doesn't actually cancel...
            logger.debug("User canceled the async post");
            return new Error(`User canceled the async post`);
        });

        // post initial dec
        let resp: any = await ext.mgmtClient?.makeRequest(`/mgmt/shared/appsvcs/declare?${postParam}`, {
            method: 'POST',
            body: dec
        });

        // if bad dec, return response
        if(resp.status === 422) {
            return resp;
        }

        // if post has multiple decs it will return with an array of status's for each
        //      so we just stick with "processing"
        if(resp.data.hasOwnProperty('items')){
            progress.report({ message: `  processing multiple declarations...`});
            await new Promise(resolve => { setTimeout(resolve, 1000); });
        } else {
            // single dec detected...
            progress.report({ message: `${resp.data.results[0].message}`});
            await new Promise(resolve => { setTimeout(resolve, 1000); });
        }

    
        let taskId: string | undefined;
        if(resp.status === 202) {
            taskId = resp.data.id;

            // get got a 202 and a taskId (single dec), check task status till complete
            while(taskId) {
                // resp = await callHTTP('GET', host, `/mgmt/shared/appsvcs/task/${taskId}`, authToken);
                resp = await ext.mgmtClient?.makeRequest(`/mgmt/shared/appsvcs/task/${taskId}`);

                // if not 'in progress', its done, clear taskId to break loop
                if(resp.data.results[0].message !== 'in progress'){
                    taskId = undefined;
                    return resp;
                }

                progress.report({ message: `${resp.data.results[0].message}`});
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
        return resp;
    });
    return progressPost;
}