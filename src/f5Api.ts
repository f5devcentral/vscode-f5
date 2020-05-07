'use strict';

import * as vscode from 'vscode';
import { request } from 'https';
import { setHostStatusBar, getHostStatusBar } from './utils/utils'
import { ext } from './extensionVariables';
import { rejects } from 'assert';

export class f5Api {

    connectF5(device: string, password: string) {
        console.log(`connectF5: ${device} - ${password}`);
        var [username, host] = device.split('@');
        const auth = getAuthToken(host, {username, password})
            .then( hostToken => {
                if (hostToken === undefined) {
                    throw new Error('hostToken blank, auth failed');
                }
                // why is this still showing if auth failed and no token returned?
                console.log(`inside-connectF5-hostToken: ${JSON.stringify(hostToken)}`);
                // if hostToken
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


    listAS3Tasks() {
        var host: string = ext.hostStatusBar.text;
        const password: string = ext.hostStatusBar.password;
        if (host || password) {
            var [username, host] = host.split('@');
            getAuthToken(host, {username, password})
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
            console.error(`getF5HostInfo - NO host or password details: ${host} - ${password}`);
            vscode.window.showInformationMessage(`Connect to device first!!!`);
            // //instead of errors, just call the connect command
        }
    };

    getF5HostInfo() {

        var host: string = ext.hostStatusBar.text;
        const password: string = ext.hostStatusBar.password;

        if (host || password) {
            var [username, host] = host.split('@');
            getAuthToken(host, {username, password})
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

    getF5FastInfo() {
        
        var host: string = ext.hostStatusBar.text;
        const password: string = ext.hostStatusBar.password;

        if (host || password) {
            var [username, host] = host.split('@');
            getAuthToken(host, {username, password})
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

    postAS3(dec: object) {
        var host: string = ext.hostStatusBar.text;
        const password: string = ext.hostStatusBar.password;

        console.log(`text in postAS3: ${JSON.stringify(dec)}`)

        if (host || password) {
            var [username, host] = host.split('@');
            getAuthToken(host, {username, password})
            .then( hostToken => {
                if (hostToken === undefined) {
                    throw new Error('hostToken blank, auth failed');
                }

                callHTTP('POST', hostToken.host, '/mgmt/shared/appsvcs/declare?async=true', hostToken.token, dec)
                .then( postInfo => {

                    vscode.workspace.openTextDocument({ 
                        language: 'json', 
                        content: JSON.stringify(postInfo, undefined, 4) 
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
                
                if (res.statusCode != 200) {
                    console.error(`AuthToken FAILURE: ${res.statusCode} - ${res.statusMessage}`);
                    return reject(new Error(`HTTP - ${res.statusCode} - ${res.statusMessage}`));
                }

                return resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body
                });
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



const getAuthToken = async (host: string, payload: object) => makeRequest({
    host,
    path: '/mgmt/shared/authn/login',
    method: 'POST',
}, payload)
.then( response => {
    // console.log('value in getAuth: ' + JSON.stringify(response));
    if (response.status != 200) {
        return new Error(`error from getAuthTokenNOT200: ${response}`);
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



const callHTTP = (method: string, host: string, path: string, token: string, payload: object = {}) => makeRequest({
    method,
    host,
    path,
    headers: {
        'Content-Type': 'application/json',
        'X-F5-Auth-Token': token
    },
    payload
})
.then( response => {
    console.log('value in getFastInfo: ' + JSON.stringify(response));
    // Promise.resolve(value.body.token);
    return response.body;
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
