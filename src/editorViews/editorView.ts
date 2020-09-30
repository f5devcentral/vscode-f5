import { EOL } from 'os';
// import * as path from 'path';
import { languages, Position, Range, TextDocument, ViewColumn, window, workspace } from 'vscode';
// import { RequestHeaders, ResponseHeaders } from '../models/base';
// import { RestClientSettings } from '../models/configurationSettings';
// import { HttpResponse } from '../models/httpResponse';
// import { PreviewOption } from './previewOption';
// import { MimeUtility } from './mimeUtility';
// import { ResponseFormatUtility } from './responseFormatUtility';
import { ext } from '../extensionVariables';
import logger from '../utils/logger';
// import * as utils from '../utils/utils';

export class TextDocumentView {

    /**
     * so i think the plan is to completely remove webviews, except for the fast template rendering
     *  - a couple things about webviews;
     *    -'s
     *      - the restclient implementation utilizes a couple different packages to parse and highilhgt the content
     *          - looking to impulate that setup to these would be required here
     *          - may cause uneccessary bloat
     *      - webviews can be resource intensive - only recommended when all other options won't work
     *    +'s
     *      - pretty...
     * 
     * Tasks:
     * - finish settings
     *  - responseOptions; used to set what http response information is displayed 
     *      - exchange -> is both request and response headers with body
     *      - headers -> *remove*
     *      - full -> response headers with body
     *      - body(default) => only response body
     *  - possibly remove "previewResponseInUntitledDocument" since it is used to enable webviews
     *      - looking to remove since it doesn't really provide any value, but promotes bloat
     * - add logic for non http response diplays, like displaying items from views
     *  - detect if http response by looking for response.status/response.statusText/response.headers
     *  - add logic (or at least text functionality) to open a single window if no editors are open
     *  - move column detection/setting application into this class
     *      - want the class to just consume information to display, it should figure everything out after that
     *  - check out the need for other formats, like regular text, yaml?, .mst?
     *  - is the "ResponseFormatUtility" really needed if we are mainly working with json?
     * 
     */

    protected readonly documents: TextDocument[] = [];

    public constructor() {
        // clear doc from list
        workspace.onDidCloseTextDocument(e => {
            // logger.debug('txtDocClose', e);
            const index = this.documents.indexOf(e);
            if (index !== -1) {
                this.documents.splice(index, 1);
            }
        });
    }

    /**
     * Display any text in an editor.
     * Depending on settings, will manage existing tabs and/or re-use them
     * Currently takes axios http response
     * - plain json (no http axios response)
     * - text (for remote command execute)
     * - yml/mst for fast templates?
     * - tcl/irule/iapp? -> NO, handled by that class
     * @param response any data to be displayed in an editor
     */
    public async render(response: any) {

        /**
         * Where new editor should be opened
         * Options: current/beside
         */
        const newEditorColumn = ext.settings.previewColumn; 


        // /**
        //  * bool, default = false
        //  */
        // const enableWebViews = ext.settings.enableWebViews;

        /**
         * Should the new/updated editor take focus?
         * bool, default = true
         * 
         * --- new name:  editorTakeFocus
         *      preserveFocus is the setting this is getting applied to
         */
        const preserveEditorFocus = ext.settings.preserveEditorFocus;

        /**
         * shows all responses in a new tab
         * bool, default = disabled
         * --- new name: newEditorForAll
         */
        const newEditorTabForAll = ext.settings.newEditorTabForAll;

        /**
         * code window containing all open editors
         */
        const wndw = window.visibleTextEditors;
        const wkspcDocs = workspace.textDocuments;


        /**
         * viewColumn variable
         */
        let viewColumn: ViewColumn | undefined;

        /**
         * search through ALL open editors for an editor this class opened,
         *  if one is found, return the view column
         */
		wndw.forEach(el => {
            this.documents.forEach(doc => {
                if(el.document.fileName === doc.fileName) {
                    viewColumn = el.viewColumn;
                }
            });
        });

        /**
         * the previous function only works on visible text editors, so it 
         *  won't detect a non-visible tab in the same column, meaning it will
         *  open a another tab in the configured colum.  The following,
         *  will show all documents open, but doesn't contain what column they
         *   are in, so, I can't key off that to show the editor in the same 
         *  place.  This is probably a corner case to revisit as needed
         */
        // wkspcDocs.forEach(el => {
        //     logger.debug('wkspc path/file', el.fileName);
        //     logger.debug('wkspc file', path.basename(el.fileName));
        //     this.documents.forEach(doc => {
        //         // const fileName = el.fileName
        //         if(path.basename(el.fileName) === doc.fileName) {
        //             // viewColumn = el.viewColumn;
        //             window.showTextDocument(doc);
        //             logger.debug('wahh');
        //         }
        //     });
        // });
        
        // if viewColumn has a value assign it, else use newEditorColumn setting
		viewColumn = viewColumn ? viewColumn : newEditorColumn;

        const { language, content } = this.parseContent(response);

        // if no open editor
        if (this.documents.length < 1 || newEditorTabForAll) {
             // create the document with language and content
            await workspace.openTextDocument({ language, content })
            .then( async (doc) => {
                await window.showTextDocument(doc, { 
                    viewColumn: viewColumn,
                    preserveFocus: preserveEditorFocus, 
                    // preview: true
                    // preview: false // not sure if this is actually needed
                });
                this.documents.push(doc);  // add the document to this class doc list
                // return doc;
            });
        } else {
            // docs in list, re-use last one
            const document = this.documents[this.documents.length - 1];
            languages.setTextDocumentLanguage(document, language);
            const editor = await window.showTextDocument(document, { 
                viewColumn: viewColumn,
                preserveFocus: preserveEditorFocus, 
                // preview: true
                // preview: false // not sure if this is actually needed
            });
            
            editor.edit(edit => {
                const startPosition = new Position(0, 0);
                const endPosition = document.lineAt(document.lineCount - 1).range.end;
                edit.replace(new Range(startPosition, endPosition), content);
            });
        }
    }

    private parseContent(response: any): {language: string, content: string} {
        /**
         * parse incoming content for:
         *      - http response
         *      - plain json
         *      - tcl/irule/iapp - not needed
         *      - regular text
         */

        let content: string = ''; 
        let language: string = 'json';  // set default language

        if(typeof(response) === 'object') {

            if(
                response.hasOwnProperty('status') &&
                response.hasOwnProperty('statusText') &&
                response.hasOwnProperty('headers') &&
                response.hasOwnProperty('request')
            ) {
                // detected http response json object, return parsed details
                content = this.parseRespContent(response);
            } else {
                // detected regular json
                content = JSON.stringify(response, undefined, 4);
                // return JSON.stringify(response.data, undefined, 4);
            }

        } else if (false) {
            // catch tcl/irule/iapp - not needed a this time...
        } else {
            // not json content -> assume plain string text
            content = response;
            language = 'plaintext';
        }


        return { language, content };
    }

    private parseRespContent(response: any): string {
        /**
         * What level of http response detail will be shown in editor;
         * exchange - full request and response headers/details and body
         * full - Response headers and body
         * body - body only
         * 
         */
        const httpResponseDetails = ext.settings.httpResponseDetails;

        let content = '';
        // const previewOption = prevOpt;
        if (httpResponseDetails === 'exchange') {

            const url = response.request.url;
            const method = response.request.method.toString().toUpperCase();
            
            content += `${method} ${url}${EOL}`;
            content += this.formatHeaders(response.request.headers) + EOL;
        }

        // add request response headers
        if (httpResponseDetails === 'exchange' || httpResponseDetails === 'full' || httpResponseDetails === 'headers') {
            content += `HTTP ${response.status} ${response.statusText}${EOL}`;
            content += this.formatHeaders(response.headers) + EOL;
        }

        // add body
        content += JSON.stringify(response.data, undefined, 4);

        return content;
    }

    private formatHeaders(headers: any): string {
        let headerString = '';
        for (const header in headers) {
            const value = headers[header] as string;
            headerString += `${header}: ${value}${EOL}`;
        }
        // remove ", */*" at end of "Accept" header -> causes problems with json syntax (thinks it's a comment)
        headerString = headerString.replace(/,\s\*\/\*/, "");
        //  // another option is to change it
        // headerString = headerString.replace(/,\s\*\/\*/, ", *any*");
        return headerString;
    }
}