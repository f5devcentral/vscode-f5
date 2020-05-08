'use strict';

import * as vscode from 'vscode';
import { request } from 'https';
import { setHostStatusBar, getPassword } from './utils/utils'
import { ext } from './extensionVariables';
import { rejects } from 'assert';
// import { KeyTar, tryGetKeyTar } from './utils/keytar';

export class f5Api {

    // private _keytar: KeyTar | undefined;

    // constructor() {
    //     this._keytar = tryGetKeyTar();
    // }

    connectF5(device: string, password: string) {
        console.log(`connectF5: ${device} - ${password}`);
        var [username, host] = device.split('@');
        getAuthToken(host, username, password)
            .then( hostToken => {
                if (hostToken === undefined) {
                    throw new Error('hostToken blank, auth failed');
                }
                // why is this still showing if auth failed and no token returned?
                console.log(`inside-connectF5-hostToken: ${JSON.stringify(hostToken)}`);
                // if hostToken


                console.log(`inside-connectF5-hostToken keytar details:${device} - ${password} - ${JSON.stringify(hostToken)}`);
                ext.keyTar.setPassword('f5Hosts', device, password)
                
        
                setHostStatusBar(device, password)
                // const now = getHostStatusBar();
                // console.log(`getHostStatusBar from connectF5: ${JSON.stringify(now)}`)
                vscode.window.showInformationMessage(`Successfully connected to ${host}`);
                // return hostToken;
            }, reason => {
                vscode.window.showInformationMessage(`inside getAuthToken${reason}`);
            })
        // return auth;
    }


    async listAS3Tasks() {
        var host: string = ext.hostStatusBar.text;
        // const password: string = ext.hostStatusBar.password;
        // const password = await ext.keyTar.getPassword('f5Hosts', host).then( passwd => passwd )
        const password: string = await getPassword(host)
        if (host || password) {
            var [username, host] = host.split('@');
            getAuthToken(host, username, password)
            .then( hostToken => {
                
                if (hostToken === undefined) {
                    throw new Error('hostToken blank, auth failed');
                }

                callHTTP('GET', hostToken.host, '/mgmt/shared/appsvcs/task/', hostToken.token)
                .then( response => {

                    // response = JSON.parse(response)
                    debugger;
                    vscode.workspace.openTextDocument({ 
                        language: 'json', 
                        content: JSON.stringify(response, undefined, 4) 
                    })
                    .then( doc => 
                        vscode.window.showTextDocument(
                            doc, 
                            { 
                                preview: false 
                            }
                        )
                    )
                });
            });
        } else {
            console.error(`listAS3Tasks - NO host or password details: ${host} - ${password}`);
            vscode.window.showInformationMessage(`Connect to device first!!!`);
            // //instead of errors, just call the connect command
        }
    };

    async getF5HostInfo() {

        var host: string = ext.hostStatusBar.text;
        // const password: string = ext.hostStatusBar.password;
        const password: string = await getPassword(host)
        


        // const pswd = ext.keytar.getPassword('f5Hosts', host);
        console.log(`getF5HostInfo - host: ${host} - password: ${password}`);
        // console.log(`getF5HostInfo - pswd: ${pswd}`);
        // console.error(`getF5HostInfo - NO host or password details: ${host} - ${pswd}`);

        if (host || password) {
            var [username, host] = host.split('@');
            getAuthToken(host, username, password)
            .then( hostToken => {
                if (hostToken === undefined) {
                    throw new Error('hostToken blank, auth failed');
                }

                getF5Info(hostToken.host, hostToken.token)
                .then( f5Info => {

                    vscode.workspace.openTextDocument({ 
                        language: 'json', 
                        content: JSON.stringify(f5Info, undefined, 4) 
                    })
                    .then( doc => 
                        vscode.window.showTextDocument(
                            doc, 
                            { 
                                preview: false 
                            }
                        )
                    )
                });
            });
        } else {
            console.error(`getF5HostInfo - NO host or password details: ${host} - ${password}`);
            vscode.window.showInformationMessage(`Connect to device first!!!`);
            //instead of errors, just call the connect command
        }
    }

    async getF5FastInfo() {
        
        var host: string = ext.hostStatusBar.text;
        // const password: string = ext.hostStatusBar.password;
        const password: string = await getPassword(host)

        if (host || password) {
            var [username, host] = host.split('@');
            getAuthToken(host, username, password)
            .then( hostToken => {
                if (hostToken === undefined) {
                    throw new Error('hostToken blank, auth failed');
                }

                callHTTP('GET', hostToken.host, '/mgmt/shared/fast/info', hostToken.token)
                .then( f5Info => {

                    vscode.workspace.openTextDocument({ 
                        language: 'json', 
                        content: JSON.stringify(f5Info, undefined, 4) 
                    })
                    .then( doc => 
                        vscode.window.showTextDocument(
                            doc, 
                            { 
                                preview: false 
                            }
                        )
                    )
                });
            });
        } else {
            console.error(`getF5FastInfo - NO host or password details: ${host} - ${password}`);
            vscode.window.showInformationMessage(`Connect to device first!!!`);
            //instead of errors, just call the connect command
        }
    }

    async postAS3(dec: object) {
        var host: string = ext.hostStatusBar.text;
        // const password: string = ext.hostStatusBar.password;
        const password: string = await getPassword(host)

        console.log(`declartion to postAS3: ${JSON.stringify(dec)}`)
        
        if (host || password) {
            var [username, host] = host.split('@');
            getAuthToken(host, username, password)
            .then( hostToken => {
                if (hostToken === undefined) {
                    throw new Error('hostToken blank, auth failed');
                }
                
                callHTTP('POST', hostToken.host, '/mgmt/shared/appsvcs/declare/', hostToken.token, dec)
                .then( postInfo => {
                    
                    console.log(`postAS3 response: ${JSON.stringify(postInfo)}`)
                    
                    // if postInfo resposecode == 202
                    //      capture 'id'
                    //      GET on id will http/200

                    vscode.workspace.openTextDocument({ 
                        language: 'json', 
                        content: JSON.stringify(postInfo, undefined, 4) 
                    })
                    .then( doc => {
                        vscode.window.showTextDocument( doc, { preview: false })

                        // if (postInfo.status == 202) {
                        //     // postInfo.body.id
                        //     console.log(`post STATUS: ${JSON.stringify(postInfo.body.id)}`)
                        
                        //     vscode.window.showQuickPick(['yes', 'no'], {placeHolder: 'follow post async?'})
                        //     .then( selection => {
                        //         if (selection == 'yes'){
                        //             console.log(`WINDOW SELECTION:  ${selection}`)
                        //             // callHTTP('GET', hostToken.host, `/mgmt/shared/appsvcs/tasks/${postInfo.body.id}`, hostToken.token)
                        //             // .then( newPostInfo => {
                        //             //     // var lastLine = vscode.TextEdit.document.lineAt(textEditor.document.lineCount - 1);
                        //             //     vscode.TextEdit.insert(-1, newPostInfo)
                        //             // });
                        //         } 
                        //         // else {
                        //         //     throw new Error('User Cancelled AS3 post follow-up')
                        //         // }
                        //     });
                        // }
                        
                    })


                });
            });
        } else {
            console.error(`postInfo - NO host or password details: ${host} - ${password}`);
            vscode.window.showInformationMessage(`Connect to device first!!!`);
            //instead of errors, just call the connect command
        }
    }
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
    }

    console.log('makeRequest---opts: ' + JSON.stringify(opts));
    
    // combine defaults with passed in options
    const combOpts = Object.assign({}, defaultOpts, opts);

    console.log('makeRequest---combOpts: ' + JSON.stringify(combOpts));
    console.log('makeRequest---defaultOpts: ' + JSON.stringify(defaultOpts));
    console.log('makeRequest---payload: ' + JSON.stringify(payload));
    
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
                console.log('makeRequest***STATUS: ' + res.statusCode);
                console.log('makeRequest***HEADERS: ' + JSON.stringify(res.headers));
                console.log('makeRequest***BODY: ' + JSON.stringify(body));

                if (res.statusCode == 401) {
                    console.log(`GOT 401!!!!!`)
                }
                
                const goodResp: Array<number> = [200, 201, 202]
                // was trying to check against array above with arr.includes or arr.indexOf
                if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 202 ) {
                    return resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body
                    });
                } else {

                    console.error(`AuthToken FAILURE: ${res.statusCode} - ${res.statusMessage}`);
                    return reject(new Error(`HTTP - ${res.statusCode} - ${res.statusMessage}`));
                }

            });
        });

        req.on('error', (e) => {
            // might need to stringify combOpts for proper log output
            reject(new Error(`${combOpts}:${e.message}`));
        });

        // if a payload was passed in, post it!
        if (payload) req.write(JSON.stringify(payload));
        req.end();
    });
};



const getAuthToken = async (host: string, username: string, password: string) => makeRequest({
    host,
    path: '/mgmt/shared/authn/login',
    method: 'POST',
// }, { opt1: 'betsy', opt2: 'johnny' })
}, 
{ 
    username,
    password
})
.then( response => {
    // console.log('value in getAuth: ' + JSON.stringify(response));
    if (response.status != 200) {
        // clear cached password for this device
        ext.keyTar.deletePassword('f5Hosts', `${username}@${host}`)
        throw new Error(`error from getAuthTokenNOT200: ${response}`);
    }
    return { host: host, token: response.body.token.token };
}, reason => {
    vscode.window.showInformationMessage(`failed getAuthToken: ${reason}`);
    // return new Error(`error from getAuthToken: ${reason}`);
});



const getF5Info = (host: string, token: string) => makeRequest({
    host,
    path: '/mgmt/shared/identified-devices/config/device-info',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'X-F5-Auth-Token': token
    }
})
.then( response => {
    console.log('value in getF5Info: ' + JSON.stringify(response));
    // Promise.resolve(value.body.token);
    return response.body;
});


const getAS3Tasks = (host: string, token: string) => makeRequest({
    host,
    path: '/mgmt/shared/appsvcs/task/',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'X-F5-Auth-Token': token
    }
})
.then( response => {
    console.log('value in getF5Info: ' + JSON.stringify(response));
    // Promise.resolve(value.body.token);
    return response.body;
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
    console.log('response from callHTTP: ' + JSON.stringify(response));
    // Promise.resolve(value.body.token);
    return response;
});


const getFastInfo = (host: string, token: string) => makeRequest({
    host,
    path: '/mgmt/shared/fast/info',
    headers: {
        'Content-Type': 'application/json',
        'X-F5-Auth-Token': token
    }
})
.then( response => {
    console.log('value in getFastInfo: ' + JSON.stringify(response));
    // Promise.resolve(value.body.token);
    return response.body;
});
