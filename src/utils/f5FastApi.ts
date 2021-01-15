import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import logger from './logger';


/**
 * Post/Deploy fast app
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 * @param postParam 
 * @param dec Delcaration
 */
export async function deployFastApp(dec: object) {

    // logger.debug(`fast app declaration`, dec);

    const progressPost = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Deploying FAST Application",
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            // this logs but doesn't actually cancel...
            logger.debug("User canceled the async post");
            return new Error(`User canceled the async post`);
        });

        // post initial dec
        let response: any = await ext.f5Client?.https(`/mgmt/shared/fast/applications`, {
            method: 'POST',
            data: dec
        });
    
        progress.report({ message: `${response.statusText}`});
        
        let taskId: string | undefined;
        if(response.status === 202) {
            taskId = response.data.message[0].id;
            
            await new Promise(resolve => { setTimeout(resolve, (ext.settings.asyncInterval * 1000)); });
            

            // get got a 202 and a taskId (single dec), check task status till complete
            while(taskId) {
                response = await ext.f5Client?.https(`/mgmt/shared/fast/tasks/${taskId}`);

                // if not 'in progress', its done, clear taskId to break loop
                if(response.data.message !== 'in progress'){
                    taskId = undefined;
                    vscode.window.showInformationMessage(`Deploying FAST Application: ${response.data.message}`);
                    return response;
                }

                progress.report({ message: `${response.data.message}`});
                await new Promise(resolve => { setTimeout(resolve, (ext.settings.asyncInterval * 1000)); });
            }
            
            // progress.report({ message: `${response.data.message}`});
            // await new Promise(resolve => { setTimeout(resolve, 3000); });
        }
        // return response from regular post

        return response;
    });
    return progressPost;
}



/**
 * Delete FAST app
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 * @param tenApp tenant/app
 */
export async function delTenApp(tenApp: string) {

    const progressDelete = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Deleting FAST App: ${tenApp}`
    }, async (progress) => {

        let response: any = await ext.f5Client?.https(`/mgmt/shared/fast/applications/${tenApp}`, {
            method: 'DELETE'
        });

        let taskId: string | undefined;
        if(response.status === 202) {
            taskId = response.data.id;
            
            await new Promise(resolve => { setTimeout(resolve, 1000); });
            while(taskId) {

                response = await ext.f5Client?.https(`/mgmt/shared/fast/tasks/${taskId}`);

                // if not 'in progress', its done, clear taskId to break loop
                if(response.data.message !== 'in progress'){
                    taskId = undefined;
                    return response;
                }

                progress.report({ message: `${response.data.message}`});
                await new Promise(resolve => { setTimeout(resolve, (ext.settings.asyncInterval * 1000)); });
            }
        }

        return response;
    });
    return progressDelete;
}



/**
 * Delete FAST template set
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 * @param tempSet templateSet anme
 */
export async function delTempSet(tempSet: string) {

    const progressDelete = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Deleting FAST Template Set: ${tempSet}`
    }, async (progress) => {

        let response: any = await ext.f5Client?.https(`/mgmt/shared/fast/templatesets/${tempSet}`, {
            method: 'DELETE'
        });
        
        let taskId: string | undefined;
        if(response.status === 202) {
            taskId = response.data.id;
            
            await new Promise(resolve => { setTimeout(resolve, 1000); });
            while(taskId) {
                response = await ext.f5Client?.https(`/mgmt/shared/fast/tasks/${taskId}`);

                // if not 'in progress', its done, clear taskId to break loop
                if(response.data.message !== 'in progress'){
                    taskId = undefined;
                    return response;
                }

                progress.report({ message: `${response.data.message}`});
                await new Promise(resolve => { setTimeout(resolve, (ext.settings.asyncInterval * 1000)); });

            }
        }

        return response;
    });
    return progressDelete;
}