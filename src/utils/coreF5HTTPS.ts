
'use strict';
import * as vscode from 'vscode';
import { request } from 'https';
var https = require('https');
import * as fs from 'fs';
import { ext } from '../extensionVariables';
import * as path from 'path';
import axios from 'axios';



/**
 * tested working with axios interceptors
 */
// axios.interceptors.request.use(function (config) {
//     // Do something before request is sent
//     console.log('HTTP-request-config', request);
//     return config;
// }, function (error) {
//     // Do something with request error
//     console.log('HTTP-request-error', error);
//     return Promise.reject(error);
//   });

//   // Axios response interceptor
// axios.interceptors.response.use(function (response) {
//     // // Do something with response data
//     // console.log('HTTP-response-data', response);
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

        // console.log('AUTH-DETAILS:', hostPort, JSON.stringify(data));
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
                    ext.mgmtClient.disconnect();
                } 

                vscode.window.showErrorMessage(`HTTP Auth FAILURE: ${status} - ${message}`);
                console.error(`HTTP Auth FAILURE: ${status} - ${message} - ${JSON.stringify(error.response.data)}`);
                throw new Error(`HTTP Auth FAILURE: ${status} - ${message}`);
            // } else if (error.request) {
            //   // The request was made but no response was received
            //   // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            //   // http.ClientRequest in node.js
            //   console.log('AuthHttpErrorRequest', error.request);
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
    console.log(`makeReqAXnew-REQUEST: ${options.method} -> ${host}:${options.port}${uri}`);

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
        console.log(`makeReqAXnew-RESPONSE: ${resp.status} - ${resp.statusText}`, resp.data);
        return resp;
    })
    .catch( error => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            // console.log('AX-HTTP-error.response', error.response.data);
            // console.log('AX-HTTP-error.status', error.response.status);
            // console.log('AX-HTTP-error.headers', error.response.headers);

            const status = error.response.status;
            const message = error.response.data?.message;

            // if(status === 401 && message === "Authentication failed.") {
            //     console.error('401 - auth failed!!!!!!  ***setup clear password***');
            //     // ext.keyTar.deletePassword('f5Hosts', `${username}@${host}`);
            // } else if (status === 401 && message === undefined) {
            //     // not sure what other error conditions might be needed
            //     // return 'bigiq-remote-auth-provider-needed';
            //     Promise.resolve('bigiq-remote-auth-provider-needed');
            // }


            vscode.window.showErrorMessage(`AX-HTTP FAILURE: ${status} - ${message}`);
            console.error(`AX-HTTP FAILURE: ${status} - ${message} - ${JSON.stringify(error.response.data)}`);
            throw new Error(`AX-HTTP FAILURE: ${status} - ${message}`);

          } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            vscode.window.showErrorMessage(`AX-HTTP-error.request: ${JSON.stringify(error.request)}`);
            console.error(`AX-HTTP-error.request: ${JSON.stringify(error.request)}`);
            throw new Error(`AX-HTTP-error.request: ${JSON.stringify(error.request)}`);
          } else {
            // Something happened in setting up the request that triggered an Error
            console.error('AX-HTTP-Setup-Error', error.message);
          }
          console.error(error.config);
    });
    return httpResponse;
};




/**
 * multi part upload from f5-sdk-js - testing - work in progress
 * modified from:
 * https://github.com/f5devcentral/f5-sdk-js/blob/master/src/bigip/extension/package.ts
 * @param file ?
 * @param host 
 * @param token aut token
 */

export async function multiPartUploadSDK(file: string, host: string, port: number, token: string) {

    console.log('MULTI-PART-UPLOAD-SDK', file, host, port, token);

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
        // console.log('upload stat in loop', uploadStat);
        
    }
    // console.log('upload stat done', uploadStat);
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