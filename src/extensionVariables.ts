/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExtensionContext, StatusBarItem, workspace, ViewColumn, commands, TextDocument } from "vscode";
import * as keyTarType from "keytar";
import { MgmtClient } from './utils/f5DeviceClient';
import logger from "./utils/logger";
import { TextDocumentView } from './editorViews/editorView';
import { F5Client } from "./f5Client";

type KeyTar = typeof keyTarType;

/**
 * Namespace for common variables used throughout the extension. 
 * They must be initialized in the activate() method of extension.ts
 */
export namespace ext {
    export let context: ExtensionContext;
    export let mgmtClient: MgmtClient | undefined;
    export let f5Client: F5Client | undefined;
    export let keyTar: KeyTar;
    export let hostStatusBar: StatusBarItem;
    export let hostNameBar: StatusBarItem;
    export let as3Bar: StatusBarItem;
    export let fastBar: StatusBarItem;
    export let doBar: StatusBarItem;
    export let tsBar: StatusBarItem;
    export let connectBar: StatusBarItem;
    export let iRulesAble: boolean = false;
    export let as3AsyncPost: boolean | undefined;
    export let panel: TextDocumentView;
    export let tsExampleView: object | undefined;
    
    export namespace settings {
        export let as3PostAsync: boolean;
        export let asyncInterval: number;
        export let irulesEnabled: boolean;
        export let timeoutInMilliseconds: number;

        export let previewColumn: ViewColumn;
        export let httpResponseDetails: string;
        export let enableWebViews: boolean;
        export let preserveEditorFocus: boolean;
        export let newEditorTabForAll: boolean;

        export let logLevel: string;
    }
}

workspace.onDidChangeConfiguration( () => {
    logger.debug('EXTENSION CONFIGURATION CHANGED!!!');
    loadConfig();
});

export async function loadConfig() {
    logger.debug('loading configuration for ext.settings!!!');
    ext.settings.as3PostAsync = workspace.getConfiguration().get<boolean>('f5.as3Post.async', true);
    ext.settings.asyncInterval = workspace.getConfiguration().get<number>('f5.asyncInterval', 5);
    // ext.settings.irulesEnabled= workspace.getConfiguration().get<boolean>('f5.tcl', false);
    ext.settings.timeoutInMilliseconds = workspace.getConfiguration().get('f5.timeoutinmilliseconds', 0);


    ext.settings.previewColumn = parseColumn(workspace.getConfiguration().get<string>('f5.newEditorColumn', 'two'));
    ext.settings.httpResponseDetails = workspace.getConfiguration().get<string>("f5.httpResponseDetails", "full");
    ext.settings.enableWebViews = workspace.getConfiguration().get('f5.enableWebViews', false);
    ext.settings.preserveEditorFocus = workspace.getConfiguration().get<boolean>('f5.preserveEditorFocus', true);
    ext.settings.newEditorTabForAll = workspace.getConfiguration().get('f5.newEditorTabForAll', false);
    
    ext.settings.logLevel = workspace.getConfiguration().get('f5.logLevel', 'error');


    // irule view stuff - in progress
    ext.settings.irulesEnabled = workspace.getConfiguration().get<boolean>('f5.tcl', true);
    if(ext.settings.irulesEnabled && ext.iRulesAble){
        commands.executeCommand('setContext', 'f5.tcl', true);
    } else {
        commands.executeCommand('setContext', 'f5.tcl', false);
    }
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