import * as vscode from 'vscode';
import { getAuthToken, callHTTP } from './coreF5HTTPS';
import { ext } from '../extensionVariables';


/**
 * Post/Deploy fast app
 * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
 * @param password User Password
 * @param postParam 
 * @param dec Delcaration
 */
export async function deployFastApp(device: string, password: string, postParam: string = '', dec: object) {
    const [username, host] = device.split('@');

    console.log(`fast app declaration`);
    console.log(dec);
    

    const authToken = await getAuthToken(host, username, password);
    const progressPost = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Deploying FAST Application",
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            // this logs but doesn't actually cancel...
            console.log("User canceled the async post");
            return new Error(`User canceled the async post`);
        });

        // post initial dec
        let response = await callHTTP('POST', host, `/mgmt/shared/fast/applications`, authToken, dec);

        // // if bad dec, return response
        // if(response.status === 422) {
        //     return response;
        // }

        // if post has multiple decs it will return with an array of status's for each
        //      so we just stick with "processing"
        // if(response.body.hasOwnProperty('items')){
        //     progress.report({ message: `  processing multiple declarations...`});
        //     await new Promise(resolve => { setTimeout(resolve, 1000); });
        // } else {
        //     // single dec detected...
        //     progress.report({ message: `${response.body.results[0].message}`});
        //     await new Promise(resolve => { setTimeout(resolve, 1000); });
        // }

    
        let taskId: string | undefined;
        if(response.status === 202) {
            taskId = response.body.message[0].id;

            // progress.report({ message: `${response.body.results[0].message}`});

            await new Promise(resolve => { setTimeout(resolve, (ext.settings.asyncInterval * 500)); });
            // response = await callHTTP('GET', host, `/mgmt/shared/fast/tasks/${taskId}`, authToken);
            // console.log(`taskId-follow-up`);
            // console.log(response);
            

            // get got a 202 and a taskId (single dec), check task status till complete
            while(taskId) {
                response = await callHTTP('GET', host, `/mgmt/shared/fast/tasks/${taskId}`, authToken);

                // if not 'in progress', its done, clear taskId to break loop
                if(response.body.message !== 'in progress'){
                    taskId = undefined;
                    return response;
                }

                progress.report({ message: `${response.body.message}`});
                await new Promise(resolve => { setTimeout(resolve, (ext.settings.asyncInterval * 1000)); });

            }
            // return response from successful async
            // return response;

            // progress.report({ message: `Found multiple decs, check tasks view for details`});
            // await new Promise(resolve => { setTimeout(resolve, 3000); });
            
            // progress.report({ message: `refreshing as3 tree views...`});
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
export async function delTenApp(device: string, password: string, tenApp: string) {
    var [username, host] = device.split('@');
    const authToken = await getAuthToken(host, username, password);
    const progressDelete = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Deleting FAST App: ${tenApp}`
    }, async (progress) => {
        let response = await callHTTP('DELETE', host, `/mgmt/shared/fast/applications/${tenApp}`, authToken);
        
        let taskId: string | undefined;
        if(response.status === 202) {
            taskId = response.body.id;
            
            await new Promise(resolve => { setTimeout(resolve, 1000); });
            while(taskId) {
                response = await callHTTP('GET', host, `/mgmt/shared/fast/tasks/${taskId}`, authToken);

                // if not 'in progress', its done, clear taskId to break loop
                if(response.body.message !== 'in progress'){
                    taskId = undefined;
                    return response;
                }

                progress.report({ message: `${response.body.message}`});
                await new Promise(resolve => { setTimeout(resolve, (ext.settings.asyncInterval * 1000)); });

            }
        }

        return response;
    });
    return progressDelete;
}





// export function get


// const fast = require('@f5devcentral/f5-fast-core');


// // https://github.com/zinkem/fast-docker/blob/master/templates/index.yaml

// export function fastTest1(input: string) {

//     console.log(`fast renderHtmlPreview input string below`);
//     console.log(input);
    
// const ymldata = `
//     view:
//       message: Hello!
//     definitions:
//       body:
//         template:
//           <body>
//             <h1>{{message}}</h1>
//           </body>
//     template: |
//       <html>
//         {{> body}}
//       </html>
// `;

// console.log(`fast renderHtmlPreview ymlData string below`);
// console.log(ymldata);

//     // fast.Template.loadYaml(input)
//     //     .then(template => {
//     //         console.log(template.getParametersSchema());
//     //         console.log(template.render({ message: "my message!!!" }));
//     //     });
// }