// 'use strict';

// import * as vscode from 'vscode';
// // var https = require('https');
// import { ext } from '../extensionVariables';
// import logger from './logger';




// /**
//  * POST Declarative Onboarding Declaration
//  * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
//  * @param password User Password
//  * @param dec DO declaration object
//  */
// export async function postDoDec(dec: DoDecParent | DoDecDevice) {

//     if(dec.class === 'DO' && (dec.declaration.async === false || dec.declaration.async === undefined)) {
//         vscode.window.showWarningMessage('async DO post highly recommended!!!');
//     } else if (dec.class === 'Device' && (dec.async === false || dec.async === undefined)) {
//         vscode.window.showWarningMessage('async DO post highly recommended!!!');
//     }

//     const progressPost = await vscode.window.withProgress({
//         location: vscode.ProgressLocation.Notification,
//         title: "Posting DO Declaration",
//         cancellable: true
//     }, async (progress, token) => {
//         token.onCancellationRequested(() => {
//             // this logs but doesn't actually cancel...
//             logger.debug("User canceled the async post");
//             return new Error(`User canceled the async post`);
//         });
        
//         // post initial dec
//         let resp: any = await ext.f5Client?.https(`/mgmt/shared/declarative-onboarding/`, {
//             validateStatus: function (status: number) {
//                 // return status >= 200 && status < 300; // default
//                 return true;
//             },
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             data: dec
//         });

//         // if bad dec, return response
//         if(resp.status === 422) {
//             return resp;
//         }

//         progress.report({ message: `${resp.data.result.message}`});
//         await new Promise(resolve => { setTimeout(resolve, 1000); });

//         let taskId: string | undefined;
//         let loopCount: number = 0;
//         if(resp.status === 202) {
//             taskId = resp.data.id;

//             // get got a 202 and a taskId (single dec), check task status till complete
//             while(taskId && loopCount <= 10) {
//                 loopCount++;
//                 resp = await ext.f5Client?.https(`/mgmt/shared/declarative-onboarding/task/${taskId}`);

//                 // if not 'in progress', its done, clear taskId to break loop
//                 if(resp.data.result.status === 'FINISHED' || resp.data.result.status === 'ERROR' || resp.data.result.status === 'OK'){
//                     taskId = undefined;
//                     vscode.window.showInformationMessage(`DO POST: ${resp.data.result.status}`);
//                     return resp;
//                 }
//                 progress.report({ message: `${resp.data.result.message}`});
//                 await new Promise(resolve => { setTimeout(resolve, (ext.settings.asyncInterval * 1000)); });
//             }
//         }

//         // return response from regular post
//         return resp;
//     });
//     return progressPost;
// }

