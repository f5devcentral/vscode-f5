'use strict';

import * as vscode from 'vscode';
import { request } from 'https';
import axios, { AxiosRequestConfig } from 'axios';
import logger from './logger';
var https = require('https');
// import { ext } from './extensionVariables';

/**
 * external API commands
 */

 interface HttpResp {
    status: string,
    statusText: string,
    headers: object,
    data: object,
    request: {
        url: string,
        method: string,
        protocol: string,
        headers: object,
        data?: any
    }

 }


/**
 * calls external HTTP APIs based on axsios.request parameters
 * https://github.com/axios/axios#request-config
 * 
 * @param req AxiosRequestConfig options
 */
export async function makeRequest(req: AxiosRequestConfig) {

    logger.debug('external http pre-Opts', JSON.stringify(req));

    // const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    
    // rewrite req object with defaults
    req = {
        url: req.url,
        method: req['method'] || 'GET',
        data: req['data'] || null,
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        }),
    };

    logger.debug('external http defaults-Opts', JSON.stringify(req));

    const resp = await axios.request(req)
    .then( resp => {
        // logger.debug('buuuug');
        /**
         * only return the things we want/need
         */
        return {
            data: resp.data,
            headers: resp.headers,
            status: resp.status,
            statusText: resp.statusText,
            request: {
                url: resp.config.url,
                method: resp.request.method,
                headers: resp.request._headers,
                protocol: resp.config.httpsAgent.protocol,
                data: resp.data
            }
        };
        // return resp;
    })
    .catch(function (error) {
        // debugger;
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            // console.error(error.response.data);
            // console.error(error.response.status);
            // console.error(error.response.headers);

            const status = error.response.status;
            const message = error.response.data.message;

            vscode.window.showErrorMessage(`HTTP_FAILURE: ${status} - ${message}`);
            console.error(`HTTP_FAILURE: ${status} - ${message} - ${JSON.stringify(error.response.data)}`);
            throw new Error(`HTTP_FAILURE: ${status} - ${message}`);
        // } else if (error.request) {
        //   // The request was made but no response was received
        //   // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        //   // http.ClientRequest in node.js
        //   logger.debug('AuthHttpErrorRequest', error.request);
        } else if (error.code && error.message){
            // console.error('HTTP-response-error:', error);
            console.error(`HTTP_response_error: ${error.code} - ${error.message}`);
            vscode.window.showErrorMessage(`${error.code} - ${error.message}`);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('AuthHttpError', error.message);
        }
        // console.error('AuthHttpConfigError',error.config);
        console.error('AuthHttpFULLError',error);
    });

    return resp;
}


export function callHTTPS(opts: object, payload: object = {}): Promise<any> {


    logger.debug('callHTTPS---OPTS: ' + JSON.stringify(opts));
    // logger.debug('callHTTTS---payload: ' + JSON.stringify(payload));
    
    // logger.debug('Bout to call API token request')
    return new Promise((resolve, reject) => {
        const req = request(opts, (res) => {
            const buffer: any = [];
            res.setEncoding('utf8');
            // logger.debug('Sending::: ' )
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
                logger.debug('callHTTPS***STATUS: ' + res.statusCode);
                logger.debug('callHTTPS***HEADERS: ' + JSON.stringify(res.headers));
                // logger.debug('callHTTPS***BODY: ' + JSON.stringify(body));
                // logger.debug('callHTTPS***BODY: ' + body);

                // if (res.statusCode == 401) {
                //     logger.debug(`GOT 401!!!!!`)
                // }
                
                const goodResp: Array<number> = [200, 201, 202];
                // was trying to check against array above with arr.includes or arr.indexOf
                if (res.statusCode === 200 ) {
                    // logger.debug(`CAUGHT 200: `)
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
        logger.debug(`req in callHTTPS: ${JSON.stringify(req)}`);

        req.on('error', (e) => {
            // might need to stringify combOpts for proper log output
            // reject(new Error(`${opts}:${e.message}`));
            reject(new Error(`${opts}:${e.message}`));
        });

        // if a payload was passed in, post it!
        if (payload) {
            req.write(JSON.stringify(payload));
        }
        req.end();
    });
};

export function callHTTPSsync(opts: object, payload: object = {}) {


    logger.debug('callHTTPS---OPTS: ' + JSON.stringify(opts));
    // logger.debug('callHTTTS---payload: ' + JSON.stringify(payload));
    
    // logger.debug('Bout to call API token request')
    // return new Promise((resolve, reject) => {
        const req = request(opts, (res) => {
            const buffer: any = [];
            res.setEncoding('utf8');
            // logger.debug('Sending::: ' )
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
                logger.debug('callHTTPS***STATUS: ' + res.statusCode);
                logger.debug('callHTTPS***HEADERS: ' + JSON.stringify(res.headers));
                // logger.debug('callHTTPS***BODY: ' + JSON.stringify(body));
                // logger.debug('callHTTPS***BODY: ' + body);

                // if (res.statusCode == 401) {
                //     logger.debug(`GOT 401!!!!!`)
                // }
                
                const goodResp: Array<number> = [200, 201, 202];
                // was trying to check against array above with arr.includes or arr.indexOf
                if (res.statusCode === 200 ) {
                    logger.debug(`CAUGHT 200: `);
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
        // logger.debug(`req in callHTTPS: ${req}`);

        req.on('error', (e) => {
            // might need to stringify combOpts for proper log output
            // reject(new Error(`${opts}:${e.message}`));
            new Error(`${opts}:${e.message}`);
        });

        // if a payload was passed in, post it!
        if (payload) {
            req.write(JSON.stringify(payload));
        }
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
    // logger.debug('response from callHTTP: ' + JSON.stringify(response));
    // Promise.resolve(value.body.token);
    return response;
});


