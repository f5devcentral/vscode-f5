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

import * as path from 'path';
import * as fs from 'fs';
import {
    ExtensionContext,
    StatusBarItem,
    workspace,
    ViewColumn,
    commands,
    window
} from "vscode";
import { logger } from "./logger";
import { TextDocumentView } from './editorViews/editorView';
import { EventEmitter } from "events";

import { F5Client } from "./f5Client";
import { AtcVersions, AtcVersionsClient, ExtHttp } from 'f5-conx-core';
import { AS3TreeProvider } from './treeViewsProviders/as3TreeProvider';
import { F5TreeProvider } from './treeViewsProviders/hostsTreeProvider';
import { Telemetry } from './telemetry';
import { XcDiag } from './tmosXcDiag';
import { CfgProvider } from './treeViewsProviders/cfgTreeProvider';


/**
 * Namespace for common variables used throughout the extension. 
 * They must be initialized in the activate() method of extension.ts
 */
export namespace ext {
    export let context: ExtensionContext;
    export let f5Client: F5Client | undefined;
    export let extHttp: ExtHttp;
    export let hostsTreeProvider: F5TreeProvider;
    export let telemetry: Telemetry;
    export let as3Tree: AS3TreeProvider;
    export let xcDiag: XcDiag;
    export let cfgProvider: CfgProvider;
    export let eventEmitterGlobal: EventEmitter;
    export let atcVersions: AtcVersions;
    export let connectBar: StatusBarItem;
    export let panel: TextDocumentView;
    export let cacheDir: string;
    export let teemEnv = 'F5_VSCODE_TEEM';
    export let teemAgent: string;

    export namespace settings {
        export let as3PostAsync: boolean;
        export let asyncInterval: number;
        export let timeoutInMilliseconds: number;
        export let previewColumn: ViewColumn;
        export let httpResponseDetails: string;
        export let preserveEditorFocus: boolean;
        export let newEditorTabForAll: boolean;
        export let logLevel: string;
        export let preview: boolean;
        export let proxy: ProxyCfg | undefined;
        export let prompts: boolean;
    }
}

workspace.onDidChangeConfiguration(() => {
    // logger.debug('EXTENSION CONFIGURATION CHANGED!!!');
    loadSettings();
});

/**
 * initialize extension/settings
 * @param context extension context
 */
export async function initSettings(context: ExtensionContext) {

    // assign context to global name space
    ext.context = context;

    // todo: setup settings for external http proxy - should probably set environment vars
    ext.eventEmitterGlobal = new EventEmitter();

    // ext.tele Telemetry

    ext.teemAgent = `${context.extension.packageJSON.name}/${context.extension.packageJSON.version}`;

    ext.cacheDir = path.join(ext.context.extensionPath, 'cache');
    process.env.F5_CONX_CORE_EXT_HTTP_AGENT = ext.teemAgent;
    process.env.F5_CONX_CORE_CACHE = ext.cacheDir;

    // process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    ext.extHttp = new ExtHttp({ rejectUnauthorized: false, eventEmitter: ext.eventEmitterGlobal });
    ext.extHttp.cacheDir = ext.cacheDir;

    ext.eventEmitterGlobal
        .on('log-http-request', msg => logger.httpRequest(msg))
        .on('log-http-response', msg => logger.httpResponse(msg))
        .on('log-debug', msg => logger.debug(msg))
        .on('log-info', msg => logger.info(msg))
        .on('log-warn', msg => logger.warn(msg))
        .on('log-error', msg => logger.error(msg))
        .on('failedAuth', async msg => {
            window.showErrorMessage('Failed Authentication - Please check password');
            logger.error('Failed Authentication Event!', ext.f5Client?.device, msg);
            await ext.f5Client?.clearPassword(ext.f5Client?.device.device);
            commands.executeCommand('f5.disconnect');
        });


    // create the atc versions client with external connectivity and event emittier
    const atcVersionClient = new AtcVersionsClient({
        extHttp: ext.extHttp,
        cachePath: ext.cacheDir,
        eventEmitter: ext.eventEmitterGlobal
    });



    if (!fs.existsSync(ext.cacheDir)) {
        logger.debug('CREATING CACHE DIRECTORY');
        // ext.cacheDir = cacheDir;
        fs.mkdirSync(ext.cacheDir);
    } else {
        logger.debug(`existing cache directory detected: ${ext.cacheDir}`);
    };

    // get atc release information -> this can happen async
    atcVersionClient.getAtcReleasesInfo()
        .then(versions => {
            ext.atcVersions = versions;
        })
        .catch(err => {
            logger.error('failed to get atc versions (vscode-f5)', err);
        });
}


/**
 * load/reload vscode extension settings
 */
export async function loadSettings() {
    logger.debug('loading configuration');

    const f5Cfg = workspace.getConfiguration('f5');
    
    ext.settings.timeoutInMilliseconds = f5Cfg.get('f5.timeoutinmilliseconds')!;
    ext.settings.previewColumn = parseColumn(f5Cfg.get('newEditorColumn')!);
    ext.settings.httpResponseDetails = f5Cfg.get('httpResponseDetails')!;
    ext.settings.preserveEditorFocus = f5Cfg.get('preserveEditorFocus')!;
    ext.settings.newEditorTabForAll = f5Cfg.get('newEditorTabForAll', false);
    ext.settings.prompts = f5Cfg.get('enablePrompts', false);
    
    ext.settings.preview = f5Cfg.get('preview')!;
    // plugin preview setting to view context
    commands.executeCommand('setContext', 'f5.preview', ext.settings.preview);

    process.env.F5_VSCODE_LOG_LEVEL = f5Cfg.get('logLevel');

    process.env[ext.teemEnv] = f5Cfg.get('TEEM');

    process.env.F5_CONX_CORE_REJECT_UNAUTORIZED = f5Cfg.get('rejectUnauthorizedBIGIP')!.toString();
    
    // get cookie config from vscode and place in env
    const cookie = f5Cfg.get('cookie')!.toString();
    if (cookie) {
        process.env.F5_CONX_CORE_COOKIES = cookie;
    } else {
        // clear if not found
        delete process.env.F5_CONX_CORE_COOKIES;
    }
    
    logger.info('------ Environment Variables ------');
    // log envs
    Object.entries(process.env)
        .filter(el => el[0].startsWith('F5_'))
        .forEach(el => logger.info(`${el[0]}=${el[1]}`));

    // // move to this env format, remove above when conx supports dynamic env assignment at instantiation
    // Object.entries(process.env)
    //     .filter(el => el[0].startsWith('F5_VSCODE_'))
    //     .forEach(el => logger.info(`${el[0]}=${el[1]}`));

    if(process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
        logger.info(`NODE_TLS_REJECT_UNAUTHORIZED=${process.env.NODE_TLS_REJECT_UNAUTHORIZED}`);
    }

    // reload device hosts view
    if(ext.hostsTreeProvider) {
        // we have to make sure this has been populated after initial extension loading
        ext.hostsTreeProvider.refresh();
    }

}


function parseColumn(value: string): ViewColumn {
    value = value.toLowerCase();
    switch (value) {
        case 'current':
            return ViewColumn.Active;
        case 'beside':
        default:
            return ViewColumn.Beside;
    }
}



type ProxyCfg = {
    host?: string,
    port?: number,
    protocol?: string,
    auth?: {
        username?: string,
        password?: string
    }
};


/*
// external links - for testing and future use
https://raw.githubusercontent.com/F5Networks/f5-appsvcs-extension/master/schema/latest/as3-schema.json
https://raw.githubusercontent.com/F5Networks/f5-declarative-onboarding/master/src/schema/latest/base.schema.json
https://raw.githubusercontent.com/F5Networks/f5-telemetry-streaming/master/src/schema/latest/base_schema.json
https://raw.githubusercontent.com/F5Networks/f5-cloud-failover-extension/master/src/nodejs/schema/base_schema.json
*/