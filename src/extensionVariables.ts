/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExtensionContext, TreeView, StatusBarItem } from "vscode";
// import { KeyTar } from "./utils/keytar";
import * as keyTarType from "keytar";
import { MemFS } from './fileSystemProvider'
// import { f5Api } from './f5Api'
// import * as f5Api from './f5Api'
// import { } from './carTreeView'

type KeyTar = typeof keyTarType;
// type f5ApiClass = typeof Class; 

/**
 * Namespace for common variables used throughout the extension. They must be initialized in the activate() method of extension.ts
 */
export namespace ext {
    export let context: ExtensionContext;
    export let keyTar: KeyTar;
    export let memFs: MemFS;
    export let hostStatusBar: StatusBarItem;
    export let hostNameBar: StatusBarItem;
    export let tsBar: StatusBarItem;
    export let as3Bar: StatusBarItem;
    export let doBar: StatusBarItem;
    // export let f5Api: f5ApiClass;
    export let carTreeData: object | undefined;
    export let tsExampleView: object | undefined;
}


export namespace git {
    export let latestAS3schema: string = 'https://raw.githubusercontent.com/F5Networks/f5-appsvcs-extension/master/schema/latest/as3-schema.json'
    export let examplesAS3: string = 'https://raw.githubusercontent.com/F5Networks/f5-appsvcs-extension/master/schema/latest/as3-schema.json'

    export let latestDOschema: string = 'https://raw.githubusercontent.com/F5Networks/f5-declarative-onboarding/master/src/schema/latest/base.schema.json'
    export let examplesDO: string = 'https://github.com/F5Networks/f5-declarative-onboarding/tree/master/examples'
    
    
    export let latestTSschema: string = 'https://raw.githubusercontent.com/F5Networks/f5-telemetry-streaming/master/src/schema/latest/base_schema.json'
    export let examplesTS: string = 'https://github.com/F5Networks/f5-telemetry-streaming/tree/master/examples/declarations'
}


/*
// external links - for testing and future use
https://raw.githubusercontent.com/F5Networks/f5-appsvcs-extension/master/schema/latest/as3-schema.json
https://raw.githubusercontent.com/F5Networks/f5-declarative-onboarding/master/src/schema/latest/base.schema.json
https://raw.githubusercontent.com/F5Networks/f5-telemetry-streaming/master/src/schema/latest/base_schema.json
*/