
'use strict';
import * as vscode from 'vscode';
import { request } from 'https';
var https = require('https');
import * as fs from 'fs';
import { ext } from '../extensionVariables';
import * as path from 'path';
import axios from 'axios';
import logger from './logger';



/**
 * tested working with axios interceptors
 */
// axios.interceptors.request.use(function (config) {
//     // Do something before request is sent
//     logger.debug('HTTP-request-config', request);
//     return config;
// }, function (error) {
//     // Do something with request error
//     logger.debug('HTTP-request-error', error);
//     return Promise.reject(error);
//   });

//   // Axios response interceptor
// axios.interceptors.response.use(function (response) {
//     // // Do something with response data
//     // logger.debug('HTTP-response-data', response);
//     return response;
//   }, function (error) {
//     // Do something with response error
//     // console.error('HTTP-response-error:', error);
//     // vscode.window.showErrorMessage(`${error.code}-${error.message}`);
//     // return Promise.reject(error);
//     return error;
//   });

/**
 * Everything below this is for all the new f5 https calls
 * 
 * 
 * - a function to get auth token - NEED TO MAKE
 * - core https function - currently = makeReqAXnew
 * - wrapper to core https function for big uploads = multiPartUploadSDK
 */

/**
 * Custome axios.request for f5 authToken
 *  mainly to isolate authentication to protect credentials from logging
 *  and simplify the main https request functions
 * @param host ip/hostname of destination f5
 * @param port mgmt port
 * @param data user/pass/provider object
 */
export async function makeAuth(
    hostPort: string,
    data: {
        username: string,
        password: string,
        loginProviderName: string
    }) {

        // logger.debug('AUTH-DETAILS:', hostPort, JSON.stringify(data));
        const resp = await axios.request({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST',
            baseURL: `https://${hostPort}`,
            url: '/mgmt/shared/authn/login',
            data,
            // validateStatus: () => true  // return ALL responses
        })
        .then( resp => {
            return resp;
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

                // if user/pass failed - clear cached password
                if(message === "Authentication failed.") {
                    console.error('401 - auth failed!!!!!!  +++ clearning cached password +++');
                    vscode.window.showErrorMessage('Authentication Failed - clearing password');
                    // clear cached password and disconnect
                    ext.keyTar.deletePassword('f5Hosts', `${data.username}@${hostPort}`);
                    // todo: this should probably call the main extension disconnect command
                    //      and all it's functionality moved to the mgmtClient.disconnect function
                    //      so everything uses the same end to end flow
                    ext.mgmtClient?.disconnect();
                } 

                vscode.window.showErrorMessage(`HTTP Auth FAILURE: ${status} - ${message}`);
                console.error(`HTTP Auth FAILURE: ${status} - ${message} - ${JSON.stringify(error.response.data)}`);
                throw new Error(`HTTP Auth FAILURE: ${status} - ${message}`);
            // } else if (error.request) {
            //   // The request was made but no response was received
            //   // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            //   // http.ClientRequest in node.js
            //   logger.debug('AuthHttpErrorRequest', error.request);
            } else if (error.code && error.message){
                // console.error('HTTP-response-error:', error);
                console.error(`HTTP-response-error: ${error.code} - ${error.message}`);
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


/**
 * Axios HTTPS agent specific for bigip
 * modeled after f5-sdk-js implementation
 * Will probably become the new https method, but will need some refactoring
 * @param host hostname/IP
 * @param uri http uri path
 * @param options http options (method, port, body, headers, basicAuth)
 */
export async function makeReqAXnew(host: string, uri: string, options: {
    method?: any; 
    port?: number;
    body?: object;
    headers?: object;
    auth?: object;
    // basicAuth?: object;
    advancedReturn?: boolean;
}): Promise<object> {
    options = options || {};

    // logger.debug(`Making HTTP request: ${host} ${uri} ${JSON.stringify(options)}`);
    logger.debug(`makeReqAXnew-REQUEST: ${options.method} -> ${host}:${options.port}${uri}`);

    /**
     * todo:  move some of the parameter assignments above so they can be logged before execution
     *  like http/method, base/url
     */ 

    const httpResponse: any = await axios.request({
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        }),
        method: options['method'] || 'GET',
        baseURL: `https://${host}:${options['port'] || 443}`,
        url: uri,
        headers: options['headers'] !== undefined ? options['headers'] : {},
        data: options['body'] || null,
        // auth: options['basicAuth'] !== undefined ? {
        //     username: options['basicAuth']['user'],
        //     password: options['basicAuth']['password']
        // } : undefined,
        // validateStatus: null
        validateStatus: () => true  // return ALL responses
    })
    .then( resp => {
        // the following log may cause some problems, mainly the resp.data,
        //      if it's circular...
        logger.debug(`makeReqAXnew-RESPONSE: ${resp.status} - ${resp.statusText}`);
        // logger.debug(`makeReqAXnew-RESPONSE: ${resp.status} - ${resp.statusText}`);
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
    .catch( error => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            // logger.debug('AX-HTTP-error.response', error.response.data);
            // logger.debug('AX-HTTP-error.status', error.response.status);
            // logger.debug('AX-HTTP-error.headers', error.response.headers);

            const status = error.response.status;
            const message = error.response.data?.message;

            // if user/pass failed - clear cached password
            if(message === "Authentication failed.") {
                console.error('401 - auth failed!!!!!!  +++ clearning cached password +++');
                vscode.window.showErrorMessage('Authentication Failed - clearing password');
                // clear cached password and disconnect
                // ext.keyTar.deletePassword('f5Hosts', `${data.username}@${hostPort}`);
                ext.mgmtClient?.clearPassword();
                // todo: this should probably call the main extension disconnect command
                //      and all it's functionality moved to the mgmtClient.disconnect function
                //      so everything uses the same end to end flow
                ext.mgmtClient?.disconnect();
            } 


            vscode.window.showErrorMessage(`AX-HTTP FAILURE: ${status} - ${message}`);
            console.error(`AX-HTTP FAILURE: ${status} - ${message} - ${JSON.stringify(error.response.data)}`);
            // throw new Error(`AX-HTTP FAILURE: ${status} - ${message}`);

          } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            vscode.window.showErrorMessage(`AX-HTTP-error.request: ${JSON.stringify(error.request)}`);
            console.error(`AX-HTTP-error.request: ${JSON.stringify(error.request)}`);
            // throw new Error(`AX-HTTP-error.request: ${JSON.stringify(error.request)}`);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('AX-HTTP-Setup-Error', error.message);
            }
            console.error(error.config);
            return {
                data: error.resp.data,
                headers: error.resp.headers,
                status: error.resp.status,
                statusText: error.resp.statusText,
                request: {
                    url: error.resp.config.url,
                    method: error.resp.request.method,
                    headers: error.resp.request._headers,
                    protocol: error.resp.config.httpsAgent.protocol,
                    data: error.resp.data
                }
            };
    });
    return httpResponse;
};


/**
 *  just a placeholder
 * @param url to get file
 * @param dest path/file name (./path/test.tar.gz)
 * @param host ip/fqdn where to get file
 * @param port 
 * @param token bigip auth token
 */
export async function download(file: string, dest: string, host: string, port: number, token: string) {
    /**
     * to be used for downloading 
     * https://futurestud.io/tutorials/download-files-images-with-axios-in-node-js
     * 
     */

    const writer = fs.createWriteStream(dest);
    const url = `/mgmt/cm/autodeploy/software-image-downloads/${file}`;

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        baseURL: `https://${host}:${port}`,
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        }),
        headers: {
            'X-F5-Auth-Token': token,
        },
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    /**
     * was trying to get a better understanding of error handling
     * by default, if successful, just resolve the promise with no return data
     *      or fail and provide the failure reason from axios
     *
     * the following fed some of the axios response details back
     *  but I could not get it to return a custom error message
     */
    // return new Promise((resolve, reject) => {
    //     writer.on('finish', x => {
    //         return resolve({
    //             x,
    //             status: response.status,
    //             statusText: response.statusText
    //         });
    //     });
    //     writer.on('error', x => {
    //         return reject('file download failed');
    //     });
    // });
}




/**
 * multi part upload from f5-sdk-js - testing - work in progress
 * modified from:
 * https://github.com/f5devcentral/f5-sdk-js/blob/master/src/bigip/extension/package.ts
 * @param file ?
 * @param host 
 * @param token aut token
 */

export async function multiPartUploadSDK(file: string, host: string, port: number, token: string) {

    logger.debug('MULTI-PART-UPLOAD-SDK', file, host, port, token);

    // TODO:  move the following filename extraction back up one level to f5FastUtils
    //      and pass in as parameter?
    // const fileName = file.split('/')[file.split('/').length - 1];
    const fileName2 = path.parse(file).base;
    // const fileNameS = 'fastTempUpload.zip';
    
    const fileStats = fs.statSync(file);
    const chunkSize = 1024 * 1024;
    let start = 0;
    let end = Math.min(chunkSize, fileStats.size-1);
    let uploadStat;
    while (end <= fileStats.size - 1 && start < end) {

        uploadStat = await makeReqAXnew( host, `/mgmt/shared/file-transfer/uploads/${fileName2}`, 
            {
                method: 'POST',
                port,
                headers: {
                    'X-F5-Auth-Token': token,
                    'Content-Type': 'application/octet-stream',
                    'Content-Range': `${start}-${end}/${fileStats.size}`,
                    'Content-Length': end - start + 1
                },
                body: fs.createReadStream(file, { start, end }),
                // contentType: 'raw'
            }
        );

        start += chunkSize;
        if (end + chunkSize < fileStats.size - 1) { // more to go
            end += chunkSize;
        } else if (end + chunkSize > fileStats.size - 1) { // last chunk
            end = fileStats.size - 1;
        } else { // done - could use do..while loop instead of this
            end = fileStats.size;
        }
        // logger.debug('upload stat in loop', uploadStat);
        
    }
    // logger.debug('upload stat done', uploadStat);
    return uploadStat;
};







/**
 * #######################################################################################################
 * #######################################################################################################
 * #######################################################################################################
 */















/**
 * GOOD/WORKING!!! -- needs to be moved to externalAPIs.ts
 * 
 * Download HTTP payload to file
 *
 * @param url  url
 * @param file local file location where the downloaded contents should go
 *
 * @returns void
 */
export async function downloadToFile(url: string, file: string): Promise<void> {
    await new Promise(((resolve) => {
        axios({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            }),
            method: 'GET',
            url,
            responseType: 'stream'
        })
        .then(function (response) {
            response.data.pipe(fs.createWriteStream(file))
                .on('finish', resolve);
        });
    }));
}