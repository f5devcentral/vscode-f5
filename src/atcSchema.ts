

import { isValidJson } from "./utils/utils";
import { window } from "vscode";
// import * as fs from 'fs';
import { git } from './extensionVariables';
import { logger } from './logger';


/**
 * detects ATC dec type and injects appropriate schema
 *  - will also remove schema reference
 */
export async function injectSchema (text: string) {
    
    let newText = isValidJson(text);

    if (!newText) {
        logger.debug('Not valid JSON object - managing as string');

        const rex = / *"\$schema":.+[\n]*/g;
        const hasSchema = text.match(rex);

        if (hasSchema) {
            // found schema references, so remove them and return
            text = text.replace(rex, '');
            return [ text, false ];
        }

        // no schema found so, get information needed to add it
        const answer = await window.showInformationMessage(`Not able to detect valid JSON or ATC declaration type.  If you want to inject anyway, select type:`, 'AS3', 'DO', 'TS', 'Cancel');

        // prepend the appropriate schema to the text
        switch (answer) {
            case 'AS3':
                logger.debug('Invalid json, injecting AS3 schema anyway');
                return [ `"$schema": "${git.latestAS3schema}",\n` + text, false ];
            case 'DO':
                logger.debug('Invalid json, injecting DO schema anyway');
                return [ `"$schema": "${git.latestDOschema}",\n` + text, false ];
            case 'TS':
                logger.debug('Invalid json, injecting TS schema anyway');
                return [ `"$schema": "${git.latestTSschema}",\n` + text, false ];
            case 'Cancel':
                logger.debug('User canceled invalid json atc schema inject');
                return [ '', false ];
        }
    }
    
    // got valid json, so parse/inject/remove accorindly
    if(newText.hasOwnProperty('$schema')) {

        logger.debug('Removing schema from declaration');
        // if declaration has schema reference -> remove it
        // this only looks at the parent level
        delete newText.$schema;
        return [ newText, true ];

    } else {

        // schema not detected -> adding appropriate schema
        if(newText.hasOwnProperty('class') && newText.class === 'AS3') {

            logger.debug('got a regular new as3 declaration with deployment parameters -> adding as3 schema');
            
            // the following add the schema to the beginning of the dec as compared
            //      to the typical dec.$schema param add would put it at the end
            newText = { "$schema": git.latestAS3schema, ...newText };
            
        } else if (newText.hasOwnProperty('class') && newText.class === 'ADC') {
            
            // typically come from getting existing decs from as3 service
            // so, we wrap the declartion with details of the necessary ADC class
            logger.debug('got a bare ADC declaration -> wrapping with AS3 object/params/schema');
            
            newText = {
                "$schema": git.latestAS3schema,
                "class": "AS3",
                declaration: newText
            };
            
        } else if (newText.hasOwnProperty('class') && newText.class === 'Device') {
            
            logger.debug('Detected DO declaration -> adding schema');
            newText = { "$schema": git.latestDOschema, ...newText };
            
        } else if (newText.hasOwnProperty('class') && newText.class === 'Telemetry') {
            
            logger.debug('Detected TS declaration -> adding schema');
            newText = { "$schema": git.latestTSschema, ...newText };

        } else {

            const msg = `Could not find base declaration class for as3/do/ts or ADC`;
            logger.debug(msg);
            window.showInformationMessage(msg);
            return [ '', false ];

        }

    }
    return [ newText, true ];
}