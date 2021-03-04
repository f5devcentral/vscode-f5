
/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import { ExtensionContext, Hover, languages, window } from "vscode";
import { EventEmitter } from 'events';
import { parseX509 } from "./x509";


export class Hovers  {

    constructor (context: ExtensionContext, events: EventEmitter) {
        //
        
            //https://github.com/legatoproject/VsCodePlugin/blob/f106b0a56a29d3d8fc871b2b12914e39dd7e7c59/src/commons/hover.ts#L37
            context.subscriptions.push(languages.registerHoverProvider({scheme: '*', language: '*'}, {
                provideHover(document, position, token) {
        
                    // document.
                    // Textline.text();
                    const range = document.getWordRangeAtPosition(position, /-{3,}BEGIN CERTIFICATE-{3,}/);
                    const certText = window.activeTextEditor?.selection;
                    // const word = document.getText(range);
                    const word = document.getText(certText);
        
                    const reg = /-{3,}BEGIN CERTIFICATE-{3,}[\s\S]+?-{3,}END CERTIFICATE-{3,}/;
                    const cert = new RegExp(reg, "g");
                    // logger.debug(cert.test(word), word);
        
                    if (cert.test(word)) return new Hover(parseX509(word));
        
                    if (word === "-----BEGIN CERTIFICATE-----") {
                        return new Hover('hiiiii');
                        // } else {
                        // // if (/-{3,}BEGIN CERTIFICATE-{3,}/.test(word)) {
                        //     return new Hover('stringy');
                    }
                }
            }));
        
            // // https://github.com/microsoft/vscode-docs-archive/blob/778fa93e48cc378fc3b9755207c57a0e03ed225c/api/references/document-selector.md
            // languages.registerHoverProvider(
            //     { scheme: 'untitled', language: 'json' },
            //     {
            //       provideHover(doc, pos, token) {
        
            //         const hoveredWord = doc.getText(doc.getWordRangeAtPosition(pos));
            //         const cert = new RegExp(/(?m)^-{3,}BEGIN CERTIFICATE-{3,}$(?s).*?^-{3,}END CERTIFICATE-{3,}$/, "g");
            //         if (cert.test(hoveredWord)) {
            //             const asdf = '';
            //         }
            //         return new Hover('For new, unsaved TypeScript documents only');
            //       }
            //     }
            //   );
        
            // context.subscriptions.push(languages.registerHoverProvider({scheme: '*', language: '*'}, { 
            //     provideHover(document, position, token) {
            //         const hoveredWord = document.getText(document.getWordRangeAtPosition(position));
            //         const cert = new RegExp(/(?m)^-{3,}BEGIN CERTIFICATE-{3,}$(?s).*?^-{3,}END CERTIFICATE-{3,}$/, "g");
            //         if (cert.test(hoveredWord)) {
            //             // const x = parseInt(hoveredWord, 16);
            //             return new Hover('awesomeness');
            //         }
        
            //     }
            // }));
    }

}







