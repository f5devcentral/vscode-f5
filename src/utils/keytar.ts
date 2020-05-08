/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// tslint:disable-next-line: no-implicit-dependencies
// import * as keytarType from 'keytar';
// import { getCoreNodeModule } from "./getCoreNodeModule";

// export type KeyTar = typeof keytarType;

// /*
// - Need to update this to return memento implementation of what keytar is doing
// - Seems that, from other's code that used keytar,
//     the under laying keytar requirements may not always be there.
// - From my understanding this trys to load the module from two diffent possible locations.
// - my thought is to try to load the modules, if they don't load, 
//     getCoreNodeModules should return undefined, key off the undefined to return 
//     the same named functions but just storing the value in vscode momento.
// - I'm hoping that after implementing keytar, it won't be that troublesome to have to do this
// */

// // may need to install other dependencies:  `sudo apt-get install libsecret-1-dev`
// //      https://atom.github.io/node-keytar/

// export function tryGetKeyTar(): KeyTar | undefined {
//     if (getCoreNodeModule('keytar')) {
//         return getCoreNodeModule('keytar');
//     } else {
//         return;
//     }
    
// }
