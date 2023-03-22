'use-strict';

import os from 'os';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

import vscode from 'vscode';
import { ExtHttp, uuidAxiosRequestConfig } from 'f5-conx-core';
import { ExtensionContext } from 'vscode';
import { ext } from './extensionVariables';


export type EventType = {
    command?: string;
    unhandledRejection?: any;
    [key: string]: any;
};

export class Telemetry {
    https: ExtHttp;
    ctx: ExtensionContext;

    apiKey: string | undefined;

    /**
     * standard vscode f5 document type param
     */
    documentType = "F5 VSCode Telemetry Data";
    /**
     * f5 vscode teem standard doc version (initial)
     */
    documentVersion = "1";

    /**
     * todo:  setup a journal to buffer logs
     */
    journal: EventType[] = [];

    // endPoint = "https://us-central1-vscode-f5.cloudfunctions.net/telemetryV1";
    endPoint = "https://product.apis.f5.com/ee/v1/telemetry";

    /**
     * teem agent ex vscode-f5/3.7.1
     */
    teemAgent: string;
    /**
     * Microsoft Extension marketplace id, ex: F5DevCentral.vscode-f5
     */
    extensionId: string;
    /**
     * extension version, ex: 3.7.1
     */
    extensionVersion: string;
    /**
     * vscode code version, ex: "1.66.2"
     */
    vscodeVersion: string;
    osType: string;
    osPlatform: string;
    osRelease: string;
    nodeArch: string;
    product: string;
    remoteName: string;
    /**
     * ui kind, desktop application or web browser
     */
    uiKind: string;
    /**
     * unique identifier for the vscode instance/computer
     */
    vscodeMachineId: string;
    /**
     * unique id for the current session.  changes with every new window/editor
     */
    vscodeSessionID: string;
    /**
     * Indicates that this is a fresh install of the application. true if within the first day of installation otherwise false.
     * https://code.visualstudio.com/api/references/vscode-api#env
     */
    isNewAppInstall: string;
    /**
     * is vscode telemetry enabled/disabled
     * 
     * --**this is for vscode itself not any of the extensions**--
     */
    isTelemetryEnabled: string;
    /**
     * vscodeMachineId in uuid format (truncated)
     */
    instanceGUID: string;

    constructor(ctx: ExtensionContext) {
        this.ctx = ctx;

        // uncomment to enable telemetry console logging for debugging
        process.env.F5_TELEMETRY_DEBUG = 'yes';

        // create external https service just for telemetry
        this.https = this.createExtHttps();

        this.teemAgent = ext.teemAgent;

        this.vscodeVersion = vscode.version;
        this.extensionId = ctx.extension.id;
        this.extensionVersion = ctx.extension.packageJSON.version;
        this.osType = os.type();
        this.osPlatform = os.platform();
        this.osRelease = (os.release() || "").replace(/^(\d+)(\.\d+)?(\.\d+)?(.*)/, "$1$2$3");
        this.nodeArch = os.arch();
        this.vscodeMachineId = vscode.env.machineId;
        this.vscodeSessionID = vscode.env.sessionId;
        this.isNewAppInstall = vscode.env.isNewAppInstall ? vscode.env.isNewAppInstall.toString() : "false";
        this.isTelemetryEnabled = vscode.env.isTelemetryEnabled ? vscode.env.isTelemetryEnabled.toString() : "false";
        this.product = vscode.env.appHost;
        this.remoteName = this.cleanRemoteName(vscode.env.remoteName);
        // mutate vscodeMachineId into digitalAssetId
        this.instanceGUID = [
            this.vscodeMachineId.substring(0, 8),
            this.vscodeMachineId.substring(8, 12),
            this.vscodeMachineId.substring(12, 16),
            this.vscodeMachineId.substring(16, 20),
            this.vscodeMachineId.substring(20, 32)
        ].join('-');

        switch (vscode.env.uiKind) {
            case vscode.UIKind.Web:
                this.uiKind = "web";
                break;
            case vscode.UIKind.Desktop:
                this.uiKind = "desktop";
                break;
            default:
                this.uiKind = "unknown";
        }
    }


    /**
     * loads api key from file or secret
     */
    async init() {

        const keyFileName = 'F5_TEEM';
        const keyFileNamePath = path.join(this.ctx.extensionPath, keyFileName);

        // console.log(`Looking for ${keyFileName} file at`, keyFileNamePath);

        await fs.promises.readFile(keyFileNamePath)
            .then(key => {
                this.ctx.secrets.store(keyFileName, key.toString());
                // console.log(`${keyFileName} FILE FOUND AND KEY STORED AS SECRET:`, key.toString());
            })
            .then(() => {
                // console.log(`Deleting ${keyFileName} FILE`);
                fs.unlinkSync(keyFileNamePath);
            })
            .catch( async e => {
                // console.log(`${keyFileName} FILE NOT FOUND`, e.message);
                const str = [
                    'bW1oSlUyc0Nk',
                    'NjNCem5YQVh',
                    'EaDRreExJ',
                    'eWZJTW0zQXI='
                ].join('');
                await this.ctx.secrets.store(keyFileName, Buffer.from(str, 'base64').toString());
            });

        // set the api key
        this.apiKey = await this.ctx.secrets.get(keyFileName);

        // console.log(`---${this.apiKey}---`);

        return;
    }

    private createExtHttps() {

        // create external https service just for telemetry
        const eHttps = new ExtHttp();

        // listen and log the requests/responses
        eHttps
            .events
            .on('log-http-request', config => {
                if (process.env.F5_TELEMETRY_DEBUG) {

                    const headers = Object.entries(config.headers).filter(([key, val]) => typeof val === 'string' );
                    console.log(`f5-telemetry-request`, {
                        method: config.method,
                        url: config.url,
                        uuid: config.uuid,
                        headers,
                        body: config.data
                    });
                }
            })
            .on('log-http-response', resp => {
                if (process.env.F5_TELEMETRY_DEBUG) {
                    console.log(`f5-telemetry-response`, {
                        status: resp.status,
                        statusText: resp.statusText,
                        uuid: resp.config.uuid,
                        headers: resp.headers,
                        request: {
                            baseURL: resp.config.baseURL,
                            url: resp.config.url,
                            method: resp.request.method,
                            headers: resp.config.headers,
                            timings: resp.request.timings
                        },
                        data: resp.data
                    });
                }
            });

        return eHttps;
    }


    telemetryBase() {
        return {
            documentType: this.documentType,
            documentVersion: this.documentVersion,
            digitalAssetId: this.instanceGUID,
            digitalAssetName: this.extensionId,
            digitalAssetVersion: this.extensionVersion,
            vscodeVersion: this.vscodeVersion,
            extensionId: this.extensionId,
            extensionVersion: this.extensionVersion,
            osType: this.osType,
            osPlatform: this.osPlatform,
            osRelease: this.osRelease,
            nodeArch: this.nodeArch,
            vscodeMachineId: this.vscodeMachineId,
            vscodeSessionID: this.vscodeSessionID,
            isNewAppInstall: this.isNewAppInstall,
            product: this.product,
            remoteName: this.remoteName,
        };
    }

    /**
     * 
     * Capture vscode telemetry event
     * 
     * @param event 
     * @returns 
     */
    async capture(event: EventType): Promise<void> {

        if (!this.apiKey) {
            return;
        }

        // append event to journal with unique id and timestamp
        this.journal.push(Object.assign(event, {
            id: randomUUID(),
            eventTime: Date.now()
        }));
        // kick off send process with every new event
        this.send();
        // return to continue processing
        return;
    }

    /**
     * 
     * attempt to send captured telemetry events in journal
     * 
     * @returns 
     */
    private async send(): Promise<void> {

        if (process.env[ext.teemEnv] === 'false' || !this.apiKey) {
            return;
        }

        // combine base telemetry details with 
        const reqOpts = {
            method: 'POST',
            url: this.endPoint,
            headers: {
                "F5-ApiKey": this.apiKey,
                "F5-DigitalAssetId": this.instanceGUID,
                "F5-TraceId": randomUUID(),
            },
            data: Object.assign(
                this.telemetryBase(),
                {
                    observationStartTime: new Date().toISOString(),
                    observationEndTime: new Date().toISOString(),
                    epochTime: Date.now(),
                    telemtryId: randomUUID(),
                    telemetryRecords: this.journal
                }
            )
        };

        // console.log(JSON.stringify(reqOpts));

        return this.https.makeRequest(reqOpts as uuidAxiosRequestConfig)
            .then(resp => {
                console.debug(`telemtry resp: ${resp.statusText}-${resp.status}`);

                // clear journal on successful send
                this.journal.length = 0;
            })
            .catch(err => {
                console.debug(`telemtry error`, err);
            });


    }



    // https://github.com/microsoft/vscode-extension-telemetry/blob/4408adad49f6da5816c28467d90aec15773773a9/src/common/baseTelemetryReporter.ts#L139
    // __GDPR__COMMON__ "common.os" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
    // __GDPR__COMMON__ "common.nodeArch" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
    // __GDPR__COMMON__ "common.platformversion" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
    // __GDPR__COMMON__ "common.extname" : { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
    // __GDPR__COMMON__ "common.extversion" : { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
    // __GDPR__COMMON__ "common.vscodemachineid" : { "endPoint": "MacAddressHash", "classification": "EndUserPseudonymizedInformation", "purpose": "FeatureInsight" }
    // __GDPR__COMMON__ "common.vscodesessionid" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
    // __GDPR__COMMON__ "common.vscodeversion" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
    // __GDPR__COMMON__ "common.uikind" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
    // __GDPR__COMMON__ "common.remotename" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
    // __GDPR__COMMON__ "common.isnewappinstall" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
    // __GDPR__COMMON__ "common.product" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }


    /**
     * Given a remoteName ensures it is in the list of valid ones
     * @param remoteName The remotename
     * @returns The "cleaned" one
     */
    private cleanRemoteName(remoteName?: string): string {
        if (!remoteName) {
            return "none";
        }

        let ret = "other";
        // Allowed remote authorities
        ["ssh-remote", "dev-container", "attached-container", "wsl", "codespaces"].forEach((res: string) => {
            if (remoteName!.indexOf(`${res}`) === 0) {
                ret = res;
            }
        });

        return ret;
    }

}