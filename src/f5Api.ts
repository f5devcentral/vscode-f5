'use strict';

import * as vscode from 'vscode';
import { request } from 'https';
import { setHostStatusBar } from './utils'

export class f5Api {
    hi() {
        return 'hi';
    }

    low() {
        console.log('inside LOW')
    }
    
    funcSole(func: string) {
        console.log(`inside funcSole: ${func}`)
        return func + '-sole-brother';
    }

    getF5FastInfo(hostStatusBar: vscode.StatusBarItem, device: string, password: string) {
        console.log(`getFastInfo: ${device} - ${password}`);
        
       // start promise
        // let authToken = getAuthToken(host, password);
        
        // // when promise is resolved (successful)
        // authToken.then(
        //     function(val) {
        //         // console.log(`authToken-full: ${JSON.stringify(val)}`)
        //         console.log(`authToken: ${JSON.stringify(val.body.token.token)}`)

        //         // now we have an auth token, get fast templates
        //         listFastInfo(host, val.body.token.token)
        //             .then( fastInfo => vscode.workspace.openTextDocument({ 
        //                 language: 'json', 
        //                 content: JSON.stringify(fastInfo.body, undefined, 4) 
        //             }))
        //             .then( doc => vscode.window.showTextDocument(doc, { preview: false }))

        //         setHostStatusBar(hostStatusBar, host, password)
        //         // return val.body.token.token;
        //     });
        
            var [username, host] = device.split('@');

            setHostStatusBar(hostStatusBar, host, password)

            getAuthToken(host, {username, password})
                .then( hostToken => {
                    // why is this still showing if auth failed and no token returned?
                    console.log(`inside-getAuth-hostToken: ${JSON.stringify(hostToken)}`);
                    
                    // interface hostToken {
                    //     host: string,
                    //     token: string
                    // }

                    // var [host, token] = hostToken;
                    const host = hostToken.host;
                    const token = hostToken.token;

                    console.log(`inside-getAuth-host_token: ${host} - ${token}`);
                    
                    getF5Info(host, token)
                    .then( f5Info => {
                        console.log(`inside-getAuth-fastInfo: ${f5Info}`);
                        vscode.workspace.openTextDocument({ 
                            language: 'json', 
                            content: JSON.stringify(f5Info, undefined, 4) 
                        })
                        .then( doc => vscode.window.showTextDocument(doc, { preview: false })
                    )};

                    getFastInfo(host, token)
                    .then( fastInfo => {
                        console.log(`inside-getAuth-fastInfo: ${fastInfo}`);
                        vscode.workspace.openTextDocument({ 
                            language: 'json', 
                            content: JSON.stringify(fastInfo, undefined, 4) 
                        })
                        .then( doc => vscode.window.showTextDocument(doc, { preview: false })
                    )};
                })

            // const benRequest: object = {
            //     host,
            //     path: '/mgmt/shared/authn/login',
            //     method: 'POST'
            // }

            // let benAuthToken = makeRequest(benRequest, { username, password });

            // console.log(`benAuthToken: ${benAuthToken}`)
            
            // const tokenToken = benAuthToken.then(value => {
            //     console.log(`inside-tokenToken-value: ${JSON.stringify(value)}`)
            //     Promise.resolve(value);
            // });
            
            // console.log(`tokenToken: ${tokenToken}`)

        // trying a sync way
        // const authToken2 = getAuthTokenSync(host, password);
        // console.log(`authToken: ${JSON.stringify(authToken)}`)
        // debugger;
        // return 'fast information!!!';
        
    }

    // getFastTemplates(hostStatusBar: vscode.StatusBarItem, host: string, password: string) {
    //     console.log(`getFastTemplates: ${host} - ${password}`);
        
    //    // start promise
    //     let authToken = getAuthToken(host, password);
        
    //     // when promise is resolved (successful)
    //     authToken.then(
    //         function(val) {
    //             // console.log(`authToken-full: ${JSON.stringify(val)}`)
    //             console.log(`authToken: ${JSON.stringify(val.body.token.token)}`)

    //             // now we have an auth token, get fast templates
    //             listFastTemplates(host, val.body.token.token)
    //                 .then( fastInfo => vscode.workspace.openTextDocument({ language: 'json', content: JSON.stringify(fastInfo.body, undefined, 4) }))
    //                 .then( doc => vscode.window.showTextDocument(doc, { preview: false }))

    //             setHostStatusBar(hostStatusBar, host, password)
    //             return val.body.token.token;
    //         });

    //     // trying a sync way
    //     // const authToken2 = getAuthTokenSync(host, password);
    //     // console.log(`authToken2: ${JSON.stringify(authToken2)}`)
    //     // console.log(`authToken: ${JSON.stringify(authToken)}`)
    //     debugger;
    //     return 'fast template!!!';
        
    // }
};



// function listFastInfo(host: string, token: string): Promise<any> {
//     const newHost:string[] = host.split('@');
//     // console.log(`newHost: ${JSON.stringify(newHost)}`);
//     // console.log(`getAuthToken details expanded: ${newHost[0]}, ${newHost[1]}, ${password}`);

//     const getTemplates = {
//         host: newHost[1],
//         path: '/mgmt/shared/fast/info',
//         method: 'GET',
//         rejectUnauthorized: false,
//         headers: {
//             'Content-Type': 'application/json',
//             'X-F5-Auth-Token': token
//         }
//     }

    
//     // console.log('Bout to call API token request')
//     return new Promise((resolve, reject) => {
//         const req = request(getTemplates, (res) => {
//             const buffer: any = [];
//             res.setEncoding('utf8');
//             // console.log('Sending::: ' )
//             res.on('data', (data) => {
//                 buffer.push(data);
//             });
//             res.on('end', () => {
//                 let body = buffer.join('');
//                 body = body || '{}';

//                 try {
//                     body = JSON.parse(body);
//                 } catch (e) {
//                     return reject(new Error(`Invalid response object from ${getTemplates.method} to ${getTemplates.path}`));
//                 };
                
//                 console.log('templates-STATUS: ' + res.statusCode);
//                 console.log('templates-HEADERS: ' + JSON.stringify(res.headers));
//                 console.log('templates-INFO-BODY: ' + JSON.stringify(body));

//                 return resolve({
//                     status: res.statusCode,
//                     headers: res.headers,
//                     body
//                 });
//             });
//         });

//         req.on('error', (e) => {
//             reject(new Error(`${getTemplates.host}:${e.message}`));
//         });

//         // if (postData) req.write(postData);
//         req.end();
//     });
// }

// function listFastTemplates(host: string, token: string): Promise<any> {
//     const newHost:string[] = host.split('@');
//     // console.log(`newHost: ${JSON.stringify(newHost)}`);
//     // console.log(`getAuthToken details expanded: ${newHost[0]}, ${newHost[1]}, ${password}`);

//     const getTemplates = {
//         host: newHost[1],
//         path: '/mgmt/shared/fast/templates',
//         method: 'GET',
//         rejectUnauthorized: false,
//         headers: {
//             'Content-Type': 'application/json',
//             'X-F5-Auth-Token': token
//         }
//     }

    
//     // console.log('Bout to call API token request')
//     return new Promise((resolve, reject) => {
//         const req = request(getTemplates, (res) => {
//             const buffer: any = [];
//             res.setEncoding('utf8');
//             // console.log('Sending::: ' )
//             res.on('data', (data) => {
//                 buffer.push(data);
//             });
//             res.on('end', () => {
//                 let body = buffer.join('');
//                 body = body || '{}';

//                 try {
//                     body = JSON.parse(body);
//                 } catch (e) {
//                     return reject(new Error(`Invalid response object from ${getTemplates.method} to ${getTemplates.path}`));
//                 };
                
//                 console.log('templates-STATUS: ' + res.statusCode);
//                 console.log('templates-HEADERS: ' + JSON.stringify(res.headers));
//                 console.log('templates-INFO-BODY: ' + JSON.stringify(body));

//                 return resolve({
//                     status: res.statusCode,
//                     headers: res.headers,
//                     body
//                 });
//             });
//         });

//         req.on('error', (e) => {
//             reject(new Error(`${getTemplates.host}:${e.message}`));
//         });

//         // if (postData) req.write(postData);
//         req.end();
//     });
// }

// function getAuthToken(host: string, password: string): Promise<any> {
//     // var host = 
//     const newHost:string[] = host.split('@');
//     // console.log(`newHost: ${JSON.stringify(newHost)}`);
//     // console.log(`getAuthToken details expanded: ${newHost[0]}, ${newHost[1]}, ${password}`);

//     const postData = JSON.stringify({
//         username: newHost[0],
//         password: password,
//         logonProviderName: "provider"
//     });

//     const getToken = {
//         host: newHost[1],
//         path: '/mgmt/shared/authn/login',
//         method: 'POST',
//         rejectUnauthorized: false,
//         headers: {
//             'Content-Type': 'application/json'
//         }
//     }

//     console.log('getAuthToken---getToken: ' + JSON.stringify(getToken));
    
//     // console.log('Bout to call API token request')
//     return new Promise((resolve, reject) => {
//         const req = request(getToken, (res) => {
//             const buffer: any = [];
//             res.setEncoding('utf8');
//             // console.log('Sending::: ' )
//             res.on('data', (data) => {
//                 buffer.push(data);
//             });
//             res.on('end', () => {
//                 let body = buffer.join('');
//                 body = body || '{}';

//                 try {
//                     body = JSON.parse(body);
//                 } catch (e) {
//                     return reject(new Error(`Invalid response object from ${getToken.method} to ${getToken.path}`));
//                 };
                
//                 // console.log('STATUS: ' + res.statusCode);
//                 // console.log('HEADERS: ' + JSON.stringify(res.headers));
//                 // console.log('TOKEN: ' + JSON.stringify(body.token.token));

//                 return resolve({
//                     status: res.statusCode,
//                     headers: res.headers,
//                     body
//                 });
//             });
//         });

//         req.on('error', (e) => {
//             reject(new Error(`${getToken.host}:${e.message}`));
//         });

//         if (postData) req.write(postData);
//         req.end();
//     });
// };

function makeRequest(opts: object, payload: object = {}): Promise<any> {
    // var host = 
    // const newHost:string[] = host.split('@');
    // console.log(`newHost: ${JSON.stringify(newHost)}`);
    // console.log(`getAuthToken details expanded: ${newHost[0]}, ${newHost[1]}, ${password}`);

    // const postData = JSON.stringify({
    //     username: newHost[0],
    //     password: password,
    //     logonProviderName: "provider"
    // });

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
                
                if (res.statusCode != 200) {
                    // console.error(`AuthToken FAILURE: ${res.statusCode} - ${res.statusMessage}`);
                    return reject(new Error(`HTTP FAILURE: ${res.statusCode} - ${res.statusMessage}`));
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

// const makeGet = (options: object) => makeRequest({
//     method: 'GET'
// });

// const makePost = (path: object, payload: object) => makeRequest({
//     method: 'POST'
// }, payload);

const getAuthToken = (host: string, payload: object) => makeRequest({
    host,
    path: '/mgmt/shared/authn/login',
    method: 'POST',
}, payload)
.then( response => {
    // console.log('value in getAuth: ' + JSON.stringify(response));
    return {host: host, token: response.body.token.token};
}, reason => {
    vscode.window.showInformationMessage(`${reason}`);
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

// const makePatch = (path: string, payload: object) => makeRequest({
//     path,
//     method: 'PATCH'
// }, payload);