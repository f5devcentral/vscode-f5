'use strict';

import * as vscode from 'vscode';
import { request } from 'https';

export class f5Api {
    hi() {
        return 'hi';
    }

    low() {
        console.log('inside LOW')
    }
    
    funcSole(func: string) {
        console.log(`inside funcSole: ${func}`)
        console.log(``)
        return func + '-sole-brother';
    }

    getFastTemplates(host: string, password: string) {
        console.log('beginnning NEW chuck func call');
        console.log(`Serial: ${host} - ${password}`);
        
       
        let authToken = getAuthToken(host, password).then(
            function(val) {
                // console.log(`authToken-full: ${JSON.stringify(val)}`)
                console.log(`authToken: ${JSON.stringify(val.body.token.token)}`)

                // now we have an auth token, get fast templates
                listFastTemplates(host, val.body.token.token)
                    .then( fastInfo => vscode.workspace.openTextDocument({ language: 'json', content: JSON.stringify(fastInfo.body, undefined, 4) }))
                    .then( doc => vscode.window.showTextDocument(doc, { preview: false }))
            });

        // trying a sync way
        // const authToken2 = getAuthTokenSync(host, password);
        // console.log(`authToken2: ${JSON.stringify(authToken2)}`)
        // console.log(`authToken: ${JSON.stringify(val.body.token.token)}`)

        return 'fast template!!!';
        
    }
};

function listFastTemplates(host: string, token: string): Promise<any> {
    const newHost:string[] = host.split('@');
    // console.log(`newHost: ${JSON.stringify(newHost)}`);
    // console.log(`getAuthToken details expanded: ${newHost[0]}, ${newHost[1]}, ${password}`);

    const getTemplates = {
        host: newHost[1],
        path: '/mgmt/shared/fast/info',
        method: 'GET',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/json',
            'X-F5-Auth-Token': token
        }
    }

    
    // console.log('Bout to call API token request')
    return new Promise((resolve, reject) => {
        const req = request(getTemplates, (res) => {
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
                    return reject(new Error(`Invalid response object from ${getTemplates.method} to ${getTemplates.path}`));
                };
                
                console.log('templates-STATUS: ' + res.statusCode);
                console.log('templates-HEADERS: ' + JSON.stringify(res.headers));
                console.log('templates-INFO-BODY: ' + JSON.stringify(body));

                return resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body
                });
            });
        });

        req.on('error', (e) => {
            reject(new Error(`${getTemplates.host}:${e.message}`));
        });

        // if (postData) req.write(postData);
        req.end();
    });
}

function getAuthToken(host: string, password: string): Promise<any> {
    // var host = 
    const newHost:string[] = host.split('@');
    // console.log(`newHost: ${JSON.stringify(newHost)}`);
    // console.log(`getAuthToken details expanded: ${newHost[0]}, ${newHost[1]}, ${password}`);

    const postData = JSON.stringify({
        username: newHost[0],
        password: password,
        logonProviderName: "provider"
    });

    const getToken = {
        host: newHost[1],
        path: '/mgmt/shared/authn/login',
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    }

    
    // console.log('Bout to call API token request')
    return new Promise((resolve, reject) => {
        const req = request(getToken, (res) => {
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
                    return reject(new Error(`Invalid response object from ${getToken.method} to ${getToken.path}`));
                };
                
                // console.log('STATUS: ' + res.statusCode);
                // console.log('HEADERS: ' + JSON.stringify(res.headers));
                // console.log('TOKEN: ' + JSON.stringify(body.token.token));

                return resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body
                });
            });
        });

        req.on('error', (e) => {
            reject(new Error(`${getToken.host}:${e.message}`));
        });

        if (postData) req.write(postData);
        req.end();
    });
};


function getAuthTokenSync(host: string, password: string) {
    // var host = 
    const newHost:string[] = host.split('@');
    // console.log(`newHost: ${JSON.stringify(newHost)}`);
    // console.log(`getAuthToken details expanded: ${newHost[0]}, ${newHost[1]}, ${password}`);

    const postData = JSON.stringify({
        username: newHost[0],
        password: password,
        logonProviderName: "provider"
    });

    const getToken = {
        host: newHost[1],
        path: '/mgmt/shared/authn/login',
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    }

    
    // console.log('Bout to call API token request')
    // return new Promise((resolve, reject) => {
        const req = request(getToken, (res) => {
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
                    return new Error(`Invalid response object from ${getToken.method} to ${getToken.path}`);
                };
                
                console.log('STATUS: ' + res.statusCode);
                console.log('HEADERS: ' + JSON.stringify(res.headers));
                console.log('TOKEN: ' + JSON.stringify(body.token.token));

                return {
                    status: res.statusCode,
                    headers: res.headers,
                    body
                };
            });
        });

        req.on('error', (e) => {
            new Error(`${getToken.host}:${e.message}`);
        });

        if (postData) req.write(postData);
        req.end();

        return req;
    // });
};