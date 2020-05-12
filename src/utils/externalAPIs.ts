'use strict';

import * as vscode from 'vscode';
import { request } from 'https';
// import { ext } from './extensionVariables';

/**
 * external API commands
 */


export function callHTTPS(opts: object, payload: object = {}): Promise<any> {


    console.log('callHTTPS---OPTS: ' + JSON.stringify(opts));
    console.log('callHTTTS---payload: ' + JSON.stringify(payload));
    
    // console.log('Bout to call API token request')
    return new Promise((resolve, reject) => {
        const req = request(opts, (res) => {
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
                    return reject(new Error(`Invalid response object ${opts}`));
                };
                
                 // configure global logging parameters
                console.log('callHTTPS***STATUS: ' + res.statusCode);
                console.log('callHTTPS***HEADERS: ' + JSON.stringify(res.headers));
                console.log('callHTTPS***BODY: ' + JSON.stringify(body));
                // console.log('callHTTPS***BODY: ' + body);

                // if (res.statusCode == 401) {
                //     console.log(`GOT 401!!!!!`)
                // }
                
                const goodResp: Array<number> = [200, 201, 202]
                // was trying to check against array above with arr.includes or arr.indexOf
                if (res.statusCode === 200 ) {
                    // console.log(`CAUGHT 200: `)
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
        console.log(`req in callHTTPS: ${JSON.stringify(req)}`)

        req.on('error', (e) => {
            // might need to stringify combOpts for proper log output
            // reject(new Error(`${opts}:${e.message}`));
            reject(new Error(`${opts}:${e.message}`))
        });

        // if a payload was passed in, post it!
        if (payload) req.write(JSON.stringify(payload));
        req.end();
    });
};

export function callHTTPSsync(opts: object, payload: object = {}) {


    console.log('callHTTPS---OPTS: ' + JSON.stringify(opts));
    console.log('callHTTTS---payload: ' + JSON.stringify(payload));
    
    // console.log('Bout to call API token request')
    // return new Promise((resolve, reject) => {
        const req = request(opts, (res) => {
            const buffer: any = [];
            res.setEncoding('utf8');
            // console.log('Sending::: ' )
            res.on('data', (data) => {
                buffer.push(data);
            });
            res.on('end', () => {
                let body = buffer.join('');
                body = body || '{}';

                // try {
                //     body = JSON.parse(body);
                // } catch (e) {
                //     return reject(new Error(`Invalid response object ${opts}`));
                // };
                
                 // configure global logging parameters
                console.log('callHTTPS***STATUS: ' + res.statusCode);
                console.log('callHTTPS***HEADERS: ' + JSON.stringify(res.headers));
                // console.log('callHTTPS***BODY: ' + JSON.stringify(body));
                console.log('callHTTPS***BODY: ' + body);

                // if (res.statusCode == 401) {
                //     console.log(`GOT 401!!!!!`)
                // }
                
                const goodResp: Array<number> = [200, 201, 202]
                // was trying to check against array above with arr.includes or arr.indexOf
                if (res.statusCode === 200 ) {
                    console.log(`CAUGHT 200: `)
                    return {
                        status: res.statusCode,
                        headers: res.headers,
                        body
                    };
                } else {

                    console.error(`HTTP FAILURE: ${res.statusCode} - ${res.statusMessage}`);
                    new Error(`HTTP - ${res.statusCode} - ${res.statusMessage}`);
                }
            });
        });
        console.log(`req in callHTTPS: ${req}`)

        req.on('error', (e) => {
            // might need to stringify combOpts for proper log output
            // reject(new Error(`${opts}:${e.message}`));
            new Error(`${opts}:${e.message}`)
        });

        // if a payload was passed in, post it!
        if (payload) req.write(JSON.stringify(payload));
        req.end();
    // });
};



// const getAuthToken = async (host: string, username: string, password: string) => callHTTPS({
//     host,
//     path: '/mgmt/shared/authn/login',
//     method: 'POST',
// }, 
// { 
//     username,
//     password
// })
// .then( response => {
//     if (response.status === 200) {
//         return { 
//             host: host, 
//             token: response.body.token.token 
//         }
//     } else {
//         // clear cached password for this device
//         // ext.keyTar.deletePassword(
//         //     'f5Hosts',
//         //     `${username}@${host}`
//         //     )
//         //     throw new Error(`error from getAuthTokenNOT200: ${response}`);
//     }
    
//     // if (response.status != 200) {
//     //     // clear cached password for this device
//     //     ext.keyTar.deletePassword(
//     //         'f5Hosts',
//     //         `${username}@${host}`
//     //         )
//     //     throw new Error(`error from getAuthTokenNOT200: ${response}`);
//     // }
//     // return { 
//     //     host: host, 
//     //     token: response.body.token.token 
//     // };
// });


const callHTTP = (method: string, host: string, path: string, token: string, payload: object = {}) => callHTTPS(
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


