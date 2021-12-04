import * as assert from 'assert';
import fs = require('fs');
import path = require('path');


import { commands, TextDocument, window} from 'vscode';
import nock from 'nock';
import * as utils from '../../utils/utils';




/**
 * ###############################################################################
 * ###############################################################################
 * 
 * 
 * 
 * 
 * ###############################################################################
 * ###############################################################################
 */

suite('external raw HTTP API tests', () => {
    
    
    test('simple external get url as string', async () => {

        //	//	clear all open editors
        await commands.executeCommand('workbench.action.closeAllEditors');
        
        const testAPI = 'https://api.chucknorris.io/jokes/random';
        const recvString = { data: { joke: 'awesome' }};

        // example chuck norris joke response
        const example = {
            "categories": [],
            "created_at": "2020-01-05 13:42:28.420821",
            "icon_url": "https://assets.chucknorris.host/img/avatar/chuck-norris.png",
            "id": "dAFN-DNnSRGqDkLJXIKA-g",
            "updated_at": "2020-01-05 13:42:28.420821",
            "url": "https://api.chucknorris.io/jokes/dAFN-DNnSRGqDkLJXIKA-g",
            "value": "Google is named after the number of Kilograms Chuck Norris can benchpress."
        };
        
        // setup nock to respond to api
        nock('https://api.chucknorris.io')
            .get('/jokes/random')
            .reply(200, recvString);

        // open an editor and insert text to test with
        const editr = await utils.displayInTextEditor(testAPI);

        await new Promise(r => setTimeout(r, 100)); // pause to load editor w/text
        await commands.executeCommand("editor.action.selectAll");    // select all text

        await new Promise(r => setTimeout(r, 100)); // let select text settle
        
        /**
         * execute command to start function
         * should make the api call, then open a new editor with response
         */
        await commands.executeCommand('f5.makeRequest');
        
        await new Promise(r => setTimeout(r, 1000)); // let the command finish

        const editor = window.activeTextEditor;  // get active editor
        let text = '';
        if(editor){
            // get all text from editor
            text = editor.document.getText();
        }

        assert.deepStrictEqual(JSON.parse(text), recvString);
	}).timeout(10000);



    test('simple external get url as yaml', async () => {

        //	//	clear all open editors
        await commands.executeCommand('workbench.action.closeAllEditors');

        const testAPI = 'url: https://api.chucknorris.io/jokes/random';
        const recvString = { data: { joke: 'awesome' }};
        
        // setup nock to respond to api
        nock('https://api.chucknorris.io')
            .get('/jokes/random')
            .reply(200, recvString);

        // open an editor and insert text to test with
        const editr = await utils.displayInTextEditor(testAPI);

        await new Promise(r => setTimeout(r, 100)); // pause to load editor w/text
        await commands.executeCommand("editor.action.selectAll");    // select all text

        await new Promise(r => setTimeout(r, 100)); // let select text settle
        
        /**
         * execute command to start function
         * should make the api call, then open a new editor with response
         */
        await commands.executeCommand('f5.makeRequest');
        
        await new Promise(r => setTimeout(r, 1000)); // let the command finish

        const editor = window.activeTextEditor;  // get active editor
        let text = '';
        if(editor){
            // get all text from editor
            text = editor.document.getText();
        }

        assert.deepStrictEqual(JSON.parse(text), recvString);
	}).timeout(10000);



    test('simple external post as yaml', async () => {

        //	//	clear all open editors
        await commands.executeCommand('workbench.action.closeAllEditors');

        const testAPI = "url: https://postman-echo.com/post\r\nmethod: POST\r\ndata:\r\n  hi: yo";
        const recvString = { json: { hi: 'yo' }};

        // example postman post
        const example = {
            "args": {},
            "data": {
                "hi": "yo"
            },
            "files": {},
            "form": {},
            "headers": {
                "x-forwarded-proto": "https",
                "x-forwarded-port": "443",
                "host": "postman-echo.com",
                "x-amzn-trace-id": "Root=1-5f2bf624-cb3ae080860a6404f899659c",
                "content-length": "11",
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json;charset=utf-8",
                "user-agent": "axios/0.19.2"
            },
            "json": {
                "hi": "yo"
            },
            "url": "https://postman-echo.com/post"
        };
        
        // setup nock to respond to api
        nock('https://postman-echo.com')
            .post('/post')
            .reply(200, recvString);

        // open an editor and insert text to test with
        const editr = await utils.displayInTextEditor(testAPI);

        await new Promise(r => setTimeout(r, 100)); // pause to load editor w/text
        await commands.executeCommand("editor.action.selectAll");    // select all text

        await new Promise(r => setTimeout(r, 100)); // let select text settle
        
        /**
         * execute command to start function
         * should make the api call, then open a new editor with response
         */
        await commands.executeCommand('f5.makeRequest');
        
        await new Promise(r => setTimeout(r, 100)); // let the command finish

        const editor = window.activeTextEditor;  // get active editor
        let text = '';
        if(editor){
            // get all text from editor
            text = editor.document.getText();
        }

        assert.deepStrictEqual(JSON.parse(text), recvString);
	}).timeout(10000);


    test('external post as json', async () => {

        //	//	clear all open editors
        await commands.executeCommand('workbench.action.closeAllEditors');

        const testAPI = {
            "url": "https://postman-echo.com/post",
            "method": "POST",
            "data": {
                "hi": "yo"
            }
        };
        const recvString = { json: { hi: 'yo' }};
        
        // setup nock to respond to api
        nock('https://postman-echo.com')
            .post('/post')
            .reply(200, recvString);

        // open an editor and insert text to test with
        const editr = await utils.displayInTextEditor(JSON.stringify(testAPI));

        await new Promise(r => setTimeout(r, 100)); // pause to load editor w/text
        await commands.executeCommand("editor.action.selectAll");    // select all text

        await new Promise(r => setTimeout(r, 100)); // let select text settle
        
        /**
         * execute command to start function
         * should make the api call, then open a new editor with response
         */
        const respEditor: TextDocument | undefined = await commands.executeCommand('f5.makeRequest');

        let respEditorText = '';
        if (respEditor) {
            respEditorText = respEditor.getText();
            respEditorText = JSON.parse(respEditorText);
        }
        
        // await new Promise(r => setTimeout(r, 100)); // let the command finish

        // const editor = window.activeTextEditor;  // get active editor
        // let text = '';
        // if(editor){
        //     // get all text from editor
        //     text = editor.document.getText();
        // }

        assert.deepStrictEqual(respEditorText, recvString);
	}).timeout(10000);

});



