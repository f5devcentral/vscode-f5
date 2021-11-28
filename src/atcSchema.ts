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

import { isValidJson } from "./utils/utils";
import { window } from "vscode";
import { atcMetaData } from 'f5-conx-core';
import { logger } from './logger';


/**
 * detects ATC dec type and injects appropriate schema
 *  - will also remove schema reference
 */
export async function injectSchema (text: string) {
    
    let newText = isValidJson(text);

    if (!newText) {
        logger.info('Not valid JSON object - managing as string');

        const rex = / *"\$schema":.+[\n]*/g;
        const hasSchema = text.match(rex);

        if (hasSchema) {
            // found schema references, so remove them and return
            text = text.replace(rex, '');
            return [ text, false ];
        }

        // no schema found so, get information needed to add it
        const answer = await window.showInformationMessage(`Not able to detect valid JSON or ATC declaration type.  If you want to inject anyway, select type:`, 'AS3', 'DO', 'TS', 'CF', 'Cancel');

        // prepend the appropriate schema to the text
        switch (answer) {
            case 'AS3':
                logger.info('Invalid json, injecting AS3 schema anyway');
                return [ `"$schema": "${atcMetaData.as3.schema}",\n` + text, false ];
            case 'DO':
                logger.info('Invalid json, injecting DO schema anyway');
                return [ `"$schema": "${atcMetaData.do.schema}",\n` + text, false ];
            case 'TS':
                logger.info('Invalid json, injecting TS schema anyway');
                return [ `"$schema": "${atcMetaData.ts.schema}",\n` + text, false ];
            case 'CF':
                logger.info('Invalid json, injecting TS schema anyway');
                return [ `"$schema": "${atcMetaData.cf.schema}",\n` + text, false ];
            case 'Cancel':
                logger.info('User canceled invalid json atc schema inject');
                return [ '', false ];
        }
    }
    
    // got valid json, so parse/inject/remove accorindly
    if(newText.hasOwnProperty('$schema')) {

        logger.info('Removing schema from declaration');
        // if declaration has schema reference -> remove it
        // this only looks at the parent level
        delete newText.$schema;
        return [ newText, true ];

    } else {

        // schema not detected -> adding appropriate schema
        if(newText.hasOwnProperty('class') && newText.class === 'AS3') {

            logger.info('got a regular new as3 declaration with deployment parameters -> adding as3 schema');
            
            // the following add the schema to the beginning of the dec as compared
            //      to the typical dec.$schema param add would put it at the end
            newText = { "$schema": atcMetaData.as3.schema, ...newText };
            
        } else if (newText.hasOwnProperty('class') && newText.class === 'ADC') {
            
            // typically come from getting existing decs from as3 service
            // so, we wrap the declartion with details of the necessary ADC class
            logger.info('got a bare ADC declaration -> wrapping with AS3 object/params/schema');
            
            newText = {
                "$schema": atcMetaData.as3.schema,
                "class": "AS3",
                declaration: newText
            };
            
        } else if (newText.hasOwnProperty('class') && newText.class === 'DO') {
            
            logger.info('Detected DO/BIG-IQ declaration -> adding schema');
            newText = { "$schema": "https://raw.githubusercontent.com/F5Networks/f5-declarative-onboarding/master/src/schema/latest/remote.schema.json", ...newText };

        } else if (newText.hasOwnProperty('class') && newText.class === 'Device') {
            
            logger.info('Detected DO/Device declaration -> adding schema');
            newText = { "$schema": atcMetaData.do.schema, ...newText };
            
        } else if (newText.hasOwnProperty('class') && newText.class === 'Telemetry') {
            
            logger.info('Detected TS declaration -> adding schema');
            newText = { "$schema": atcMetaData.ts.schema, ...newText };

        } else {

            const msg = `Could not find base declaration class for as3/do/ts or ADC`;
            logger.info(msg);
            window.showInformationMessage(msg);
            return [ '', false ];

        }

    }
    return [ newText, true ];
}