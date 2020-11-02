'use strict';

import * as vscode from 'vscode';
var https = require('https');
import { ext } from '../extensionVariables';
import logger from './logger';



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