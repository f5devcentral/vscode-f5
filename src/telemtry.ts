import os from 'os';
import { randomUUID } from 'crypto';

import vscode from 'vscode';
import { ExtHttp, wait } from 'f5-conx-core';
import {
    ExtensionContext
} from 'vscode';
import { logger } from './logger';
import { ext } from './extensionVariables';

// import { ext } from '../extensionVariables';


export class Telemetry {
    https: ExtHttp;
    ctx: ExtensionContext;

    /**
     * todo:  setup a journal to buffer logs
     */
    journal = [];

    endPoint = "https://us-central1-vscode-f5.cloudfunctions.net/telemetryV1";

    extensionId: string;
    extensionVersion: string;
    vscodeVersion: string;
    osType: string;
    osPlatform: string;
    osRelease: string;
    nodeArch: string;
    product: string;
    remoteName: string;
    uiKind: string;
    vscodeMachineId: string;
    vscodeSessionID: string;
    isNewAppInstall: string;

    constructor(ctx: ExtensionContext, https: ExtHttp) {
        this.ctx = ctx;
        this.https = https;

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
        this.product = vscode.env.appHost;
        this.remoteName = this.cleanRemoteName(vscode.env.remoteName);

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
     * 
     * @returns common vscoded instance details
     */
    getInstanceDetails() {

        return {
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

    async send(data: Record<string, unknown>): Promise<void> {

        if ( process.env[ext.teemEnv] === 'true' ) {

            // shallow merge in instance details
            Object.assign(data, {
                eventTime: Date.now(),
                id: randomUUID(),
                instance: this.getInstanceDetails()
            });
    
            this.https.makeRequest({
                method: "POST",
                url: this.endPoint,
                data
            })
            .then( resp => {
                // logger.debug(`telemtry resp: ${resp.statusText}-${resp.status}`);
            })
            .catch(err => {
                // logger.debug(`telemtry error`, err);
            });
        }

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