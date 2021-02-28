// 'use strict';

// import * as vscode from 'vscode';
// import { request } from 'https';
// import axios, { AxiosRequestConfig } from 'axios';
// import logger from './logger';
// var https = require('https');
// import { ext } from '../extensionVariables';

// /**
//  * external API commands
//  */

//  interface HttpResp {
//     status: string,
//     statusText: string,
//     headers: object,
//     data?: object,
//     request: {
//         url: string,
//         method: string,
//         protocol: string,
//         headers: object,
//         data?: any
//     }

//  }

// /**
//  * wraps/expands AxiosRequestConfig
//  *  - used to easily set the http agent setting for allowing self-signed certs
//  */
// export interface HttpRequest extends AxiosRequestConfig {
//     rejectUnauthorized?: boolean,
// }


// /**
//  * calls external HTTP APIs based on axsios.request parameters
//  * https://github.com/axios/axios#request-config
//  * 
//  * @param req AxiosRequestConfig options
//  */
// export async function makeRequest(req: HttpRequest) {

//     logger.debug('external http pre-Opts', JSON.stringify(req));

//     // add option to allow self-signed cert
//     if (req.rejectUnauthorized) {
//         req.httpsAgent = new https.Agent({ rejectUnauthorized: false });
//     }

//     // get port from URL
    
//     // rewrite req object with defaults
//     // req = {
//     //     url: req.url,
//     //     method: req['method'] || 'GET',
//     //     data: req['data'] || null,
//     //     httpsAgent: new https.Agent({
//     //         rejectUnauthorized: false
//     //     }),
//     //     validateStatus: () => true
//     // };

//     logger.debug('external http defaults-Opts', JSON.stringify(req));

//     const resp = await axios.request(req)
//     .then( resp => {

//         // only return the stuff we want
//         return {
//             data: resp.data,
//             headers: resp.headers,
//             status: resp.status,
//             statusText: resp.statusText,
//             request: {
//                 url: resp.config.url,
//                 method: resp.request.method,
//                 headers: resp.request._headers,
//                 protocol: resp.config.httpsAgent.protocol,
//                 // data: resp.data
//             }
//         };
//     })
//     .catch( err => {
        
//         // return all error information also
//         return {
//             data: err.response.data,
//             headers: err.response.headers,
//             status: err.response.status,
//             statusText: err.response.statusText,
//             request: {
//                 url: err.config.url,
//                 method: err.request.method,
//                 headers: err.request._headers,
//                 protocol: err.config.httpsAgent.protocol,
//             }
//         };
//     });

//     return resp;
// }


// export function callHTTPS(opts: object, payload: object = {}): Promise<any> {


//     logger.debug('callHTTPS---OPTS: ' + JSON.stringify(opts));
//     // logger.debug('callHTTTS---payload: ' + JSON.stringify(payload));
    
//     // logger.debug('Bout to call API token request')
//     return new Promise((resolve, reject) => {
//         const req = request(opts, (res) => {
//             const buffer: any = [];
//             res.setEncoding('utf8');
//             // logger.debug('Sending::: ' )
//             res.on('data', (data) => {
//                 buffer.push(data);
//             });
//             res.on('end', () => {
//                 let body = buffer.join('');
//                 body = body || '{}';

//                 try {
//                     body = JSON.parse(body);
//                 } catch (e) {
//                     return reject(new Error(`Invalid response object ${opts}`));
//                 };
                
//                  // configure global logging parameters
//                 logger.debug('callHTTPS***STATUS: ' + res.statusCode);
//                 logger.debug('callHTTPS***HEADERS: ' + JSON.stringify(res.headers));
//                 // logger.debug('callHTTPS***BODY: ' + JSON.stringify(body));
//                 // logger.debug('callHTTPS***BODY: ' + body);

//                 // if (res.statusCode == 401) {
//                 //     logger.debug(`GOT 401!!!!!`)
//                 // }
                
//                 const goodResp: Array<number> = [200, 201, 202];
//                 // was trying to check against array above with arr.includes or arr.indexOf
//                 if (res.statusCode === 200 ) {
//                     // logger.debug(`CAUGHT 200: `)
//                     return resolve({
//                         status: res.statusCode,
//                         headers: res.headers,
//                         body
//                     });
//                 } else {

//                     console.error(`HTTP FAILURE: ${res.statusCode} - ${res.statusMessage}`);
//                     return reject(new Error(`HTTP - ${res.statusCode} - ${res.statusMessage}`));
//                 }
//             });
//         });
//         logger.debug(`req in callHTTPS: ${JSON.stringify(req)}`);

//         req.on('error', (e) => {
//             // might need to stringify combOpts for proper log output
//             // reject(new Error(`${opts}:${e.message}`));
//             reject(new Error(`${opts}:${e.message}`));
//         });

//         // if a payload was passed in, post it!
//         if (payload) {
//             req.write(JSON.stringify(payload));
//         }
//         req.end();
//     });
// };

// // export function callHTTPSsync(opts: object, payload: object = {}) {


// //     logger.debug('callHTTPS---OPTS: ' + JSON.stringify(opts));
// //     // logger.debug('callHTTTS---payload: ' + JSON.stringify(payload));
    
// //     // logger.debug('Bout to call API token request')
// //     // return new Promise((resolve, reject) => {
// //         const req = request(opts, (res) => {
// //             const buffer: any = [];
// //             res.setEncoding('utf8');
// //             // logger.debug('Sending::: ' )
// //             res.on('data', (data) => {
// //                 buffer.push(data);
// //             });
// //             res.on('end', () => {
// //                 let body = buffer.join('');
// //                 body = body || '{}';

// //                 // try {
// //                 //     body = JSON.parse(body);
// //                 // } catch (e) {
// //                 //     return reject(new Error(`Invalid response object ${opts}`));
// //                 // };
                
// //                  // configure global logging parameters
// //                 logger.debug('callHTTPS***STATUS: ' + res.statusCode);
// //                 logger.debug('callHTTPS***HEADERS: ' + JSON.stringify(res.headers));
// //                 // logger.debug('callHTTPS***BODY: ' + JSON.stringify(body));
// //                 // logger.debug('callHTTPS***BODY: ' + body);

// //                 // if (res.statusCode == 401) {
// //                 //     logger.debug(`GOT 401!!!!!`)
// //                 // }
                
// //                 const goodResp: Array<number> = [200, 201, 202];
// //                 // was trying to check against array above with arr.includes or arr.indexOf
// //                 if (res.statusCode === 200 ) {
// //                     logger.debug(`CAUGHT 200: `);
// //                     return {
// //                         status: res.statusCode,
// //                         headers: res.headers,
// //                         body
// //                     };
// //                 } else {

// //                     console.error(`HTTP FAILURE: ${res.statusCode} - ${res.statusMessage}`);
// //                     new Error(`HTTP - ${res.statusCode} - ${res.statusMessage}`);
// //                 }
// //             });
// //         });
// //         // logger.debug(`req in callHTTPS: ${req}`);

// //         req.on('error', (e) => {
// //             // might need to stringify combOpts for proper log output
// //             // reject(new Error(`${opts}:${e.message}`));
// //             new Error(`${opts}:${e.message}`);
// //         });

// //         // if a payload was passed in, post it!
// //         if (payload) {
// //             req.write(JSON.stringify(payload));
// //         }
// //         req.end();
// //     // });
// // };





// // const callHTTP = (method: string, host: string, path: string, token: string, payload: object = {}) => callHTTPS(
// //     {
// //         method,
// //         host,
// //         path,
// //         headers: {
// //             'Content-Type': 'application/json',
// //             'X-F5-Auth-Token': token
// //         }
// //     },
// //     payload
// // )
// // .then( response => {
// //     // logger.debug('response from callHTTP: ' + JSON.stringify(response));
// //     // Promise.resolve(value.body.token);
// //     return response;
// // });


