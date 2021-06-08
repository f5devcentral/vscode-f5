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
import * as keyTarType from "keytar";
import { logger } from "./logger";
import { TextDocumentView } from './editorViews/editorView';
import { EventEmitter } from "events";

import { F5Client } from "./f5Client";
import { AtcVersions, AtcVersionsClient, ExtHttp } from 'f5-conx-core';
import { AS3TreeProvider } from './treeViewsProviders/as3TreeProvider';
import { F5TreeProvider } from './treeViewsProviders/hostsTreeProvider';

type KeyTar = typeof keyTarType;

/**
 * Namespace for common variables used throughout the extension. 
 * They must be initialized in the activate() method of extension.ts
 */
export namespace ext {
    export let context: ExtensionContext;
    export let f5Client: F5Client | undefined;
    export let extHttp: ExtHttp;
    export let keyTar: KeyTar;
    export let hostsTreeProvider: F5TreeProvider;
    export let as3Tree: AS3TreeProvider;
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
        export let proxy: ProxyCfg | undefined;
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

    ext.cacheDir = path.join(ext.context.extensionPath, 'cache');
    process.env.F5_CONX_CORE_EXT_HTTP_AGENT = 'The F5 VScode Extension';
    process.env.F5_CONX_CORE_CACHE = ext.cacheDir;

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    ext.extHttp = new ExtHttp({ rejectUnauthorized: false, eventEmitter: ext.eventEmitterGlobal });
    ext.extHttp.cacheDir = ext.cacheDir;

    ext.eventEmitterGlobal
        .on('log-http-request', msg => logger.httpRequest(msg))
        .on('log-http-response', msg => logger.httpResponse(msg))
        .on('log-debug', msg => logger.debug(msg))
        .on('log-info', msg => logger.info(msg))
        .on('log-warn', msg => logger.warn(msg))
        .on('log-error', msg => logger.error(msg))
        .on('failedAuth', msg => {
            window.showErrorMessage('Failed Authentication - Please check password');
            logger.error('Failed Authentication Event!', ext.f5Client?.device, msg);
            ext.f5Client?.clearPassword();
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

    // get atc release information
    await atcVersionClient.getAtcReleasesInfo()
        .then(versions => {
            ext.atcVersions = versions;
        });
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

/**
 * load/reload vscode extension settings
 */
export async function loadSettings() {
    logger.debug('loading configuration');
    ext.settings.timeoutInMilliseconds = workspace.getConfiguration().get('f5.timeoutinmilliseconds', 0);

    ext.settings.previewColumn = parseColumn(workspace.getConfiguration().get<string>('f5.newEditorColumn', 'two'));
    ext.settings.httpResponseDetails = workspace.getConfiguration().get<string>("f5.httpResponseDetails", "full");
    ext.settings.preserveEditorFocus = workspace.getConfiguration().get<boolean>('f5.preserveEditorFocus', true);
    ext.settings.newEditorTabForAll = workspace.getConfiguration().get('f5.newEditorTabForAll', false);

    process.env[logger.logEnv] = workspace.getConfiguration().get<string>('f5.logLevel', 'INFO');

    process.env[ext.teemEnv] = workspace.getConfiguration().get<boolean>('f5.TEEM', true).toString();

    logger.info('------ Environment Variables ------');
    // log envs
    Object.entries(process.env)
        .filter(el => el[0].startsWith('F5_CONX_'))
        .forEach(el => logger.info(`${el[0]}=${el[1]}`));

    // move to this env format, remove above when conx supports dynamic env assignment at instantiation
    Object.entries(process.env)
        .filter(el => el[0].startsWith('F5_VSCODE_'))
        .forEach(el => logger.info(`${el[0]}=${el[1]}`));

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




/*
// external links - for testing and future use
https://raw.githubusercontent.com/F5Networks/f5-appsvcs-extension/master/schema/latest/as3-schema.json
https://raw.githubusercontent.com/F5Networks/f5-declarative-onboarding/master/src/schema/latest/base.schema.json
https://raw.githubusercontent.com/F5Networks/f5-telemetry-streaming/master/src/schema/latest/base_schema.json
https://raw.githubusercontent.com/F5Networks/f5-cloud-failover-extension/master/src/nodejs/schema/base_schema.json
*/