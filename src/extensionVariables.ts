/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as fs from 'fs';
import { ExtensionContext, StatusBarItem, workspace, ViewColumn, commands, TextDocument, window } from "vscode";
import * as keyTarType from "keytar";
// import { MgmtClient } from './utils/f5DeviceClient.ts.old';
import logger from "./utils/logger";
import { TextDocumentView } from './editorViews/editorView';
import { EventEmitter } from "events";

import { F5Client } from "./f5Client";
import { AtcVersions, AtcVersionsClient, ExtHttp } from 'f5-conx-core';
import { AS3TreeProvider } from './treeViewsProviders/as3TreeProvider';
import { F5TreeProvider } from './treeViewsProviders/hostsTreeProvider';

type KeyTar = typeof keyTarType;

// path.join(ext.context.extensionPath, 'cache');

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

    export namespace settings {
        export let as3PostAsync: boolean;
        export let asyncInterval: number;
        export let timeoutInMilliseconds: number;
        export let previewColumn: ViewColumn;
        export let httpResponseDetails: string;
        export let preserveEditorFocus: boolean;
        export let newEditorTabForAll: boolean;
        export let logLevel: string;
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


    ext.extHttp = new ExtHttp({ rejectUnauthorized: false, eventEmitter: ext.eventEmitterGlobal });
    ext.extHttp.cacheDir = ext.cacheDir;

    ext.eventEmitterGlobal
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

    ext.settings.logLevel = workspace.getConfiguration().get('f5.logLevel', 'error');



}



export namespace git {
    export let latestAS3schema: string = 'https://raw.githubusercontent.com/F5Networks/f5-appsvcs-extension/master/schema/latest/as3-schema.json';
    export let examplesAS3: string = 'https://raw.githubusercontent.com/F5Networks/f5-appsvcs-extension/master/schema/latest/as3-schema.json';

    export let latestDOschema: string = 'https://raw.githubusercontent.com/F5Networks/f5-declarative-onboarding/master/src/schema/latest/base.schema.json';
    export let examplesDO: string = 'https://github.com/F5Networks/f5-declarative-onboarding/tree/master/examples';

    export let latestTSschema: string = 'https://raw.githubusercontent.com/F5Networks/f5-telemetry-streaming/master/src/schema/latest/base_schema.json';
    export let examplesTS: string = 'https://github.com/F5Networks/f5-telemetry-streaming/tree/master/examples/declarations';
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
*/