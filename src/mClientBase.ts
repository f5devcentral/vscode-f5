/**
 * Copyright 2021 F5 Networks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 'use strict';

import path from 'path';
import https from 'https';
import * as fs from 'fs';
import { EventEmitter } from 'events';

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import timer from '@szmarczak/http-timer/dist/source';

import { Token, F5DownLoad, F5Upload, F5InfoApi } from './bigipModels';
import { HttpResponse, uuidAxiosRequestConfig, AxiosResponseWithTimings } from "../utils/httpModels";
import { F5DownloadPaths, F5UploadPaths } from '../constants';
import { getRandomUUID } from '../utils/misc';
import { injectAtcAgent } from './atcAgent';



/**
 * Used to inject http call timers
 * transport:request: httpsWithTimer
 * @szmarczak/http-timer
 */
const transport = {
    request: function httpsWithTimer(...args: unknown[]): AxiosRequestConfig {
        const request = https.request.apply(null, args)
        timer(request);
        return request;
    }
};



/**
 * F5 connectivity mgmt client
 * 
 * @param host
 * @param user
 * @param password
 * @param options.port (default = 443)
 * @param options.provider (default = tmos)
 * 
 */
export class MClientBase {
    /**
     * hostname or IP address of F5 device
     */
    host: string;
    /**
     * tcp port for mgmt connectivity (default=443)
     */
    port: number;
    /**
     * F5 Device host information api output from
     * 
     * '/mgmt/shared/identified-devices/config/device-info'
     * 
     * Used to understand details of connected device
     */
    hostInfo: F5InfoApi | undefined;
    /**
     * event emitter instance for all events related to this class
     * 
     * typically passed in from parent F5Client class
     */
    events: EventEmitter;
    /**
     * custom axsios instance for making calls to the connect F5 device
     * 
     * managed authentication/token
     */
    axios: AxiosInstance;
    /**
     * username for connected f5 device
     */
    protected _user: string;
    /**
     * password for connected device
     */
    protected _password: string;
    /**
     * authentication provider for connected device
     */
    protected _provider: string;
    /**
     * full auth token details for connected device
     * 
     * **this gets cleared and refreshed as needed**
     * 
     * **check out the auth token events for active otken feedback**
     */
    protected _token: Token | undefined;
    /**
     * token timer value
     * 
     * Starts when a token is refreshed, start value is token time out
     * 
     * An asyncronous timer counts down till zero
     * 
     */
    tokenTimeout: number | undefined;
    /**
     * system interval id for the async token timer
     * 
     * **pre-emptivly clears token at <10 seconds but keeps counting to zero**
     */
    protected _tokenIntervalId: NodeJS.Timeout | undefined;

    /**
     * reject self signed certs
     * 
     * looks for process.env.F5_CONX_CORE_REJECT_UNAUTORIZED = false/true
     */
    rejectUnauthorized = true;

    /**
     * TEEM environment variable definition
     * 
     * ex. process.env.F5_VSCODE_TEEM=true
     */
    teemEnv: string | undefined;

    /**
     * TEEM agent string software/version
     * 
     * ex. vscode-f5/3.2.0
     */
    teemAgent: string | undefined;

    /**
     * ENV name for cookies to be added to outbound http requests, used for connecting to lab environments like UDF
     * 
     * ex. process.env.F5_CONX_CORE_COOKIES = "udf.sid=s:9Wkdfer8CFsoo1VFnOTSKAenbpHJwDMt.lsI+Du9vw2BOBS+afDlSzz5CkC2fAFuL1w31QeEz94w; Domain=.udf.f5.com; Path=/"
     * 
     * pretty sure just the udf.sig cookie is needed for udf, but the example shows how to do multiple cookies if needed
     */
    cookies = 'F5_CONX_CORE_COOKIES';

    /**
     * @param options function options
     */
    constructor(
        host: string,
        user: string,
        password: string,
        options?: {
            port?: number,
            // provider?: string,
        },
        eventEmitter?: EventEmitter,
        teemEnv?: string,
        teemAgent?: string
    ) {
        this.host = host;
        this._user = user;
        this._password = password;
        this.port = options?.port || 443;
        // this._provider = options?.provider || 'tmos';
        this.events = eventEmitter ? eventEmitter : new EventEmitter;
        this.teemEnv = teemEnv;
        this.teemAgent = teemAgent;
        
        if(process.env.F5_CONX_CORE_REJECT_UNAUTORIZED && (process.env.F5_CONX_CORE_REJECT_UNAUTORIZED === 'false')) {
            this.rejectUnauthorized = false;
        }
        
        this.axios = this.createAxiosInstance();
    }

    /**
     * 
     * @return event emitter instance
     */
    getEvenEmitter(): EventEmitter {
        return this.events;
    }


    /**
     * clear auth token and timer
     *  - used for logging out/disconnecting, and testing
     */
    async clearToken(): Promise<number> {
        this.events.emit('log-info', `clearing mbip token/timer with ${this.tokenTimeout} left`);
        const tokenTimeOut = this.tokenTimeout;
        this._token = undefined;
        clearInterval(this._tokenIntervalId);
        return tokenTimeOut;
    }

    /**
     * creates the axios instance that will be used for all f5 calls
     * 
     * includes auth/token management
     */
    private createAxiosInstance(): AxiosInstance {

        const baseInstanceParams: uuidAxiosRequestConfig = {
            baseURL: `https://${this.host}:${this.port}`,
            transport
        }

        // disable self signed certs
        if (this.rejectUnauthorized === false) {
            baseInstanceParams.httpsAgent = new https.Agent({
                rejectUnauthorized: false,
            })

            // disable node rejection of self-signed certs
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        } else {
            baseInstanceParams.httpsAgent = new https.Agent({
                rejectUnauthorized: true,
            })
            // disable node rejection of self-signed certs
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
        }

        // create axsios instance
        const axInstance = axios.create(baseInstanceParams);

        // add default cookies
        if(process.env[this.cookies]){
            axInstance.defaults.headers.common.cookie = process.env[this.cookies]
        }

        // re-assign parent this objects needed within the parent instance objects...
        const events = this.events;
        const clearToken = function () {
            this.clearToken()
        }
        
        const teemEnv = this.teemEnv;
        const teemAgent = this.teemAgent;

        // ---- https://github.com/axios/axios#interceptors
        // Add a request interceptor
        axInstance.interceptors.request.use(function (config: uuidAxiosRequestConfig) {

            // adjust tcp timeout, default=0, which relys on host system
            config.timeout = Number(process.env.F5_CONX_CORE_TCP_TIMEOUT);

            config.uuid = config?.uuid ? config.uuid : getRandomUUID(4, { simple: true })

            // if teem enabled, inject agent
            if(process.env[teemEnv] == 'true') {
                injectAtcAgent(config, teemAgent)
            }

            // events.emit('log-info', `HTTPS-REQU [${config.uuid}]: ${config.method} -> ${config.baseURL}${config.url}`)
            events.emit('log-http-request', config);

            return config;
        }, function (err) {
            // Do something with request error
            // not sure how to test this, but it is probably handled up the chain
            return Promise.reject(err);
        });

        //  response interceptor
        axInstance.interceptors.response.use(function (resp: AxiosResponseWithTimings) {
            // Any status code that lie within the range of 2xx cause this function to trigger
            // Do something with response data

            // events.emit('log-info', `HTTPS-RESP [${resp.config.uuid}]: ${resp.status} - ${resp.statusText}`);
            events.emit('log-http-response', resp);

            return resp;
        }, function (err) {
            // Any status codes that falls outside the range of 2xx cause this function to trigger

            // if we got a failed password response
            if (
                err.response?.status === 401 &&
                err.response?.statusText === 'Unauthorized'
            ) {
                // fire failed password event so upper logic can clear details
                events.emit('failedAuth', err.response.data);
                clearToken();  // clear the token anyway
                // throw err;  // rethrow error since we failed auth?
            }

            // Do something with response error
            return Promise.reject(err);
        });
        return axInstance;
    }




    /**
     * sets/gets/refreshes auth token
     */
    private async getToken(): Promise<void> {

        this.events.emit('log-debug', `getting auth token from: ${this.host}:${this.port}`);

        return await this.axios({
            url: '/api/v1/login',
            method: 'GET',
            auth: {
                username: this._user,
                password: this._password
            }
        })
            .then(resp => {

                // capture entire token
                this._token = resp.data;
                // set token timeout for timer
                this.tokenTimeout = resp.data.expiresIn;

                this.events.emit('log-debug', `mbip auth token aquired, timeout: ${this.tokenTimeout}`);

                this.tokenTimer();  // start token timer

                return;

            })
            .catch(err => {

                this.events.emit('log-error', `mbip token request failed: ${err.message}`);

                // todo: add non http error details to log

                // reThrow the error back up the chain
                return Promise.reject(err)
            })

    }





    /**
     * Make HTTP request
     * 
     * @param uri     request URI
     * @param options axios options
     * 
     * @returns request response
     */
    async makeRequest(uri: string, options?: uuidAxiosRequestConfig): Promise<AxiosResponseWithTimings> {

        // if auth token has expired, it should have been cleared, get new one
        if (!this._token) {
            await this.getToken();
        }

        const requestDefaults = {
            url: uri,
            method: options?.method || undefined,
            headers: Object.assign(options?.headers || {}, {
                Authorization: `Bearer ${this._token.token}`
            }),
            data: options?.data || undefined
        }

        // merge incoming options into requestDefaults object
        options = Object.assign(requestDefaults, options)

        return await this.axios.request(options)
    }





    /**
     * bigip auth token lifetime countdown
     * will clear auth token details when finished
     * prompting the next http call to get a new token
     */
    private async tokenTimer(): Promise<void> {

        this.events.emit('token-timer-start', `Starting token timer: ${this.tokenTimeout}`);

        // clear any timer we are currently tracking
        clearInterval(this._tokenIntervalId);

        this._tokenIntervalId = setInterval(() => {
            this.tokenTimeout--;

            // capture the self timer instance
            const timerId = this._tokenIntervalId;

            this.events.emit('token-timer-count', this.tokenTimeout);

            // kill the token 10 seconds early to give us time to get a new one with all the other calls going on
            if (this.tokenTimeout <= 10) {
                this._token = undefined; // clearing token details should get a new token
            }

            // keep running the timer so everything looks good, but clear the rest when it reaches 0
            if (this.tokenTimeout <= 0) {
                clearInterval(this._tokenIntervalId);

                // just in case this timer got orphaned from the main class, also clear using self reference
                clearInterval(timerId);
                
                this.events.emit('token-timer-expired', 'authToken expired -> will refresh with next HTTPS call');
                // this.clearToken();
            }
        }, 1000);

    }






    async followAsync(url: string): Promise<AxiosResponseWithTimings> {

        // todo: add the ability to add even more time for extra long calls for ucs-create/qkview-create/do
        // todo: potentially make this more generic.  kinda like a generator/iterator contruct
        //  example: input endpoint, success_criteria and failure criteria (long or short cycle)
        //      basically: keep calling this endpoint till you get this or this...

        //  build async wait array -> progressively waits longer
        //  https://stackoverflow.com/questions/12503146/create-an-array-with-same-element-repeated-multiple-times
        // first 4 rounds, wait 5 seconds each (20 seconds total)
        const retryTimerArray = Array.from({ length: 4 }, () => 5)
        // next 6 rounds, wait 10 seconds each (1 minute total)
        retryTimerArray.push(...Array.from({ length: 6 }, () => 10))
        // next 30 rounds, wait 30 seconds each (15 minutes total)
        retryTimerArray.push(...Array.from({ length: 30 }, () => 30))

        const responses: AxiosResponseWithTimings[] = [];
        while (retryTimerArray.length > 0) {

            // set makeRequest to never throw an error, but keep going till a valid response

            const resp = await this.makeRequest(url);

            // get the last response
            responses.push(resp);

            // be thinking about expanding this to accomodate all flows like DO/ILX/... install
            //  where there could be catastrophic responses (network timeouts/tcp rejects/http errors)
            // if the job kicked off right (since we got here), then keep trying till we get some reponse

            // if ILX install follow services restart...
            // if DO follow device restart...

            if (resp.data?.status === 'FAILED') {
                // got an http/200, but the job failed, so reject promise and push the error back up the stack
                return Promise.reject(resp);
            }


            // todo: break out the successful and failed results, only refresh statusBars on successful
            if (resp.data?.status === 'FINISHED') {
                retryTimerArray.length = 0;
            }

            // QKVIEW async job responses
            //  "IN_PROGRESS"
            if (resp.data?.status === 'SUCCEEDED') {
                retryTimerArray.length = 0;
            }

            // DO job done responses
            // RUNNING -> OK/ERROR/FINSHED
            if (resp.data?.result?.status === 'OK' || resp.data?.result?.status === 'ERROR' || resp.data?.result?.status === 'FINISHED') {
                retryTimerArray.length = 0;
            }

            // as3 results array
            if (resp.data?.results && resp.data.results[0].message !== 'in progress') {
                retryTimerArray.length = 0;
            }

            // if atc rpm mgmt -> watch for restnoded service restart
            if (resp.data?.apiRawValues?.apiAnonymous) {
                console.log(resp.data?.apiRawValues.apiAnonymous)
                if (resp.data.apiRawValues.apiAnonymous.includes('run')) {
                    console.log('ending service watch')
                    retryTimerArray.length = 0;
                }
            }

            await new Promise(resolve => {
                // take the first array item off and use it as a delay timer
                setTimeout(resolve, retryTimerArray.shift() * 1000);
            });
        }

        // get last response to return
        const response = responses.pop();
        // inject array of remaining async req/resp
        response.async = responses;

        return response;
    }



    /**
     * download file (multi-part) from f5 (ucs/qkview/iso)
     * - UCS
     *   - uri: /mgmt/shared/file-transfer/ucs-downloads/${fileName}
     *   - path: /var/local/ucs/${fileName}
     * - QKVIEW
     *   - uri: /mgmt/cm/autodeploy/qkview-downloads/${fileName}
     *   - path: /var/tmp/${fileName}
     * - ISO
     *   - uri: /mgmt/cm/autodeploy/software-image-downloads/${fileName}
     *   - path: /shared/images/${fileName}
     * 
     *   **I don't think any of the f5 download paths support non-multipart**
     * 
     * https://support.f5.com/csp/article/K41763344
     * 
     * @param fileName file name on bigip
     * @param localDestPathFile where to put the file (including file name)
     * @param downloadType: type F5DownLoad = "UCS" | "QKVIEW" | "ISO"
     * **expand/update return value**
     */
    async download(fileName: string, localDestPath: string, downloadType: F5DownLoad): Promise<HttpResponse> {

        // also look at possibly moving to this at somepoint?
        // https://www.npmjs.com/package/multipart-download

        // swap out download url as needed (ternary method)
        const url =
            downloadType === 'UCS' ? `${F5DownloadPaths.ucs.uri}/${fileName}`
                : downloadType === 'QKVIEW' ? `${F5DownloadPaths.qkview.uri}/${fileName}`
                    : `${F5DownloadPaths.iso.uri}/${fileName}`;

        //  if we got a dest path with no filename, append the filename
        const fileP
            = path.parse(localDestPath).ext
                ? localDestPath
                : `${localDestPath}/${fileName}`;

        this.events.emit('log-info', {
            message: 'pending download',
            fileName,
            localDestPath,
            downloadType
        })


        return new Promise(async (resolve, reject) => {

            const startTime = process.hrtime.bigint();  // start pack timer
            const downloadResponses: HttpResponse[] = []
            const file = fs.createWriteStream(fileP)

            // https://github.com/andrewstart/axios-streaming/blob/master/axios.js

            const chunkSize = 512 * 1024;
            let totalSize: number = undefined;
            let totalDown = 0;

            do {

                const reqObject: uuidAxiosRequestConfig = {
                    headers: {
                        "content-range": `0-${chunkSize}/0`,
                        "content-type": 'application/octet-stream'
                    },
                    responseType: 'arraybuffer'
                }

                // update content-ranage as needed
                if (totalSize) {
                    if ((totalDown + chunkSize) >= totalSize) {
                        // last chunk, so just get whats needed
                        reqObject.headers["content-range"] = `${totalDown + 1}-${totalSize - 1}/${totalSize}`
                    } else {
                        // not to the end yet, get next chunk
                        reqObject.headers["content-range"] = `${totalDown + 1}-${totalDown + chunkSize}/${totalSize}`
                    }
                }

                // this.events.emit('log-debug', reqObject)

                await this.makeRequest(url, reqObject)
                    .then(respIn => {

                        totalDown += chunkSize  // update chuck size tracking

                        file.write(respIn.data, 'binary')   // write the chunk to file

                        // set total download size if not set yet
                        const contentRange = respIn.headers['content-range'];
                        totalSize = parseInt(contentRange.split('/')[1]);

                        // catch all the responses (simplified)
                        downloadResponses.push({
                            headers: respIn.headers,
                            status: respIn.status,
                            statusText: respIn.statusText,
                            request: {
                                uuid: respIn.config.uuid,
                                baseURL: respIn.config.baseURL,
                                url: respIn.config.url,
                                method: respIn.request.method,
                                headers: respIn.config.headers,
                                protocol: respIn.config.httpsAgent.protocol,
                                timings: respIn.request.timings
                            }
                        })

                    })
                    .catch(err => {
                        return reject(err);
                    })

            }
            while ((totalDown + 1) <= totalSize);

            file.end();

            file
                .on('error', err => {
                    return reject(err);
                })
                .on('finish', async () => {

                    // get the last response, append the file data we want and return
                    const lastResp: HttpResponse = downloadResponses[downloadResponses.length - 1]
                    lastResp.data = {
                        file: file.path,
                        bytes: file.bytesWritten
                    }

                    this.events.emit('log-info', {
                        message: 'download complete',
                        file: file.path,
                        bytes: file.bytesWritten,
                        time: Number(process.hrtime.bigint() - startTime) / 1000000
                    })

                    return resolve(lastResp);
                })
        })
    }



    //  * https://www.devcentral.f5.com/s/articles/Tinkering-with-the-BIGREST-Python-SDK-Part-2
    // Description          Method  URI                                             File Location
    // Upload Image         POST    /mgmt/cm/autodeploy/sotfware-image-uploads/*    /shared/images
    // Upload File          POST    /mgmt/shared/file-transfer/uploads/*            /var/config/rest/downloads
    // Upload UCS           POST    /mgmt/shared/file-transfer/ucs-uploads/*        /var/local/ucs

    // Download UCS         GET     /mgmt/shared/file-transfer/ucs-downloads/*      /var/local/ucs
    // Download Image/File  GET     /mgmt/cm/autodeploy/sotfware-image-downloads/*  /shared/images

    /**
     * upload file to f5 -> used for ucs/ilx-rpms/.conf-merges
     * 
     * types of F5 uploads
     * - FILE
     *  - uri: '/mgmt/shared/file-transfer/uploads'
     *  - path: '/var/config/rest/downloads'
     * - ISO
     *  - uri: '/mgmt/cm/autodeploy/software-image-uploads'
     *  - path: '/shared/images'
     * - UCS
     *  - uri: '/mgmt/shared/file-transfer/ucs-uploads/'
     *  - path: '/var/local/ucs'
     * 
     * https://devcentral.f5.com/s/articles/demystifying-icontrol-rest-part-5-transferring-files
     * https://support.f5.com/csp/article/K41763344
     * https://www.devcentral.f5.com/s/articles/Tinkering-with-the-BIGREST-Python-SDK-Part-2
     * @param localSourcePathFilename 
     * @param uploadType
     */
    async upload(localSourcePathFilename: string, uploadType: F5Upload): Promise<AxiosResponseWithTimings> {

        // array to hold responses
        const responses = [];
        const fileName = path.parse(localSourcePathFilename).base;
        const fileStats = fs.statSync(localSourcePathFilename);
        const chunkSize = 1024 * 1024;
        let start = 0;
        let end = Math.min(chunkSize, fileStats.size - 1);

        const url =
            uploadType === 'FILE' ? `${F5UploadPaths.file.uri}/${fileName}`
                : uploadType === 'ISO' ? `${F5UploadPaths.iso.uri}/${fileName}`
                    : `${F5UploadPaths.ucs.uri}/${fileName}`;

        this.events.emit('log-debug', {
            message: 'pending upload',
            localSourcePathFilename,
            uploadType
        })

        while (end <= fileStats.size - 1 && start < end) {

            const resp = await this.makeRequest(url, {
                method: 'POST',
                headers: {
                    'content-type': 'application/octet-stream',
                    'content-range': `${start}-${end}/${fileStats.size}`,
                    'content-length': end - start + 1
                },
                data: fs.createReadStream(localSourcePathFilename, { start, end }),
            })

            start += chunkSize;
            if (end + chunkSize < fileStats.size - 1) { // more to go
                end += chunkSize;
            } else if (end + chunkSize > fileStats.size - 1) { // last chunk
                end = fileStats.size - 1;
            } else { // done - could use do..while loop instead of this
                end = fileStats.size;
            }
            responses.push(resp);
        }

        // get the last response
        const lastResponse = responses.pop();

        // inject file stream information
        lastResponse.data.fileName = fileName;
        lastResponse.data.bytes = fileStats.size;

        this.events.emit('log-debug', {
            message: 'upload complete',
            data: lastResponse.data
        })

        return lastResponse;
    }



    /**
     * this funciton is used to build a filename for with all necessary host specific details
     *   for files like ucs/qkviews
     * @returns string with `${this.hostname}_${this.host}_${cleanISOdateTime}`
     * @example bigip1_10.200.244.101_20201127T220451142Z
     */
    async getFileName(): Promise<string> {

        if (this.hostInfo) {
            // start with ISO Date and remove ":", ".", and "-"
            const cleanISOdateTime = new Date().toISOString().replace(/(:|\.|-)/g, '')

            // if mgmtIP is IPv6 format - make it filename friendly
            // if (/\[[\w:]+\]/.test(this.hostInfo.managementAddress)) {
            if (/:/.test(this.hostInfo.managementAddress)) {

                const removedBrackets = this.hostInfo.managementAddress.replace(/\[|\]/g, '')
                const flat = removedBrackets.replace(/:/g, '.')
                return `${this.hostInfo.hostname}_${flat}_${cleanISOdateTime}`;

            } else {

                return `${this.hostInfo.hostname}_${this.hostInfo.managementAddress}_${cleanISOdateTime}`;

            }
        } else {
            this.events.emit('log-error', 'getFileName function called, but no hostInfo, discover device first')
            return Promise.reject('getFileName function called, but no hostInfo, discover device first')
        }
    }
}


/**
 * returns simplified http response object
 * 
 * ```ts
 *     return {
 *      data: resp.data,
 *      headers: resp.headers,
 *      status: resp.status,
 *      statusText: resp.statusText,
 *      request: {
 *          uuid: resp.config.uuid,
 *          baseURL: resp.config.baseURL,
 *          url: resp.config.url,
 *          method: resp.request.method,
 *          headers: resp.config.headers,
 *          protocol: resp.config.httpsAgent.protocol,
 *          timings: resp.request.timings
 *      }
 *  }
 * ```
 * @param resp orgininal axios response with timing
 * @returns simplified http response
 */
export async function simplifyHttpResponse(resp: AxiosResponseWithTimings): Promise<HttpResponse> {
    // only return the things we need
    return {
        data: resp.data,
        headers: resp.headers,
        status: resp.status,
        statusText: resp.statusText,
        request: {
            uuid: resp.config.uuid,
            baseURL: resp.config.baseURL,
            url: resp.config.url,
            method: resp.request.method,
            headers: resp.config.headers,
            protocol: resp.config.httpsAgent.protocol,
            timings: resp.request.timings
        }
    }
}


