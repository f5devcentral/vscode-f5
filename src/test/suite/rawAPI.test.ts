import * as assert from 'assert';
import fs = require('fs');
import path = require('path');


import * as vscode from 'vscode';
import nock from 'nock';
import * as utils from '../../utils/utils';
import { ext } from '../../extensionVariables';
import * as extApi from '../../utils/externalAPIs';
import { MgmtClient } from '../../utils/f5DeviceClient';






suite('device raw HTTP API tests', () => {
    console.log('need to setup tests for device mgmt and connecting first');
	// // vscode.window.showInformationMessage('Starting gui tests.');
	// test('simple external get -> chuck joke', async () => {

    //     nock('https://api.chucknorris.io')
    //         .get('/jokes/random')
    //         .reply(200, { key: 'value' });
    //     const resp: any = await extApi.makeRequest({url: "https://api.chucknorris.io/jokes/random"});
    //     assert.deepStrictEqual(resp.data, { key: 'value' });
    // }).timeout(1000);
    
    
    
    // test('setup mgmtClient', async () => {

    //     const token = { token: { 
    //         'token': '1234',
    //         'timeout': '1200'
    //     }};

    //     // setup mgmt/login calls
    //     nock('https://192.168.254.31:8443')
    //         .post('/mgmt/shared/authn/login')
    //         .reply(200, token);


    //     nock('https://192.168.254.31:8443')
    //         .get('/mgmt/shared/identified-devices/config/device-info')
    //         .reply(200, 'device-information');
        
    //     //  setup mgmtClient
    //     const device = {"device":"admin@192.168.254.31:8443","provider":"local"};
    
    //     var [user, host] = device.device.split('@');
    //     var [host, port] = host.split(':');
    
    //     // const password: string = await utils.getPassword(device.device);
    //     const password = 'testPassDoor';
    
    //     ext.mgmtClient = new MgmtClient( device.device, {
    //         host,
    //         port,
    //         user,
    //         provider: device.provider,
    //         password
    //     });
        
    //     debugger;
    //     const connect = await ext.mgmtClient.connect();

    //     // assert.deepStrictEqual(JSON.parse(text), recvString);
    // }).timeout(10000);
    


    // test('simple url as string', async () => {

    //     //	//	clear all open editors
    //     await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        
    //     const testAPI = '/mgmt/tm/sys/clock';
    //     const recvString = { data: { joke: 'awesome' }};
        
    //     // setup nock to respond to api
    //     nock('https://api.chucknorris.io')
    //         .get('/jokes/random')
    //         .reply(200, recvString);

    //     // open an editor and insert text to test with
    //     const editr = await utils.displayInTextEditor(testAPI);

    //     await new Promise(r => setTimeout(r, 100)); // pause to load editor w/text
    //     await vscode.commands.executeCommand("editor.action.selectAll");    // select all text

    //     await new Promise(r => setTimeout(r, 100)); // let select text settle
        
    //     /**
    //      * execute command to start function
    //      * should make the api call, then open a new editor with response
    //      */
    //     await vscode.commands.executeCommand('f5.makeRequest');
        
    //     await new Promise(r => setTimeout(r, 100)); // let the command finish

    //     const editor = vscode.window.activeTextEditor;  // get active editor
    //     let text = '';
    //     if(editor){
    //         // get all text from editor
    //         text = editor.document.getText();
    //     }

    //     assert.deepStrictEqual(JSON.parse(text), recvString);
	// }).timeout(10000);




});


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
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        
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
        await vscode.commands.executeCommand("editor.action.selectAll");    // select all text

        await new Promise(r => setTimeout(r, 100)); // let select text settle
        
        /**
         * execute command to start function
         * should make the api call, then open a new editor with response
         */
        await vscode.commands.executeCommand('f5.makeRequest');
        
        await new Promise(r => setTimeout(r, 100)); // let the command finish

        const editor = vscode.window.activeTextEditor;  // get active editor
        let text = '';
        if(editor){
            // get all text from editor
            text = editor.document.getText();
        }

        assert.deepStrictEqual(JSON.parse(text), recvString);
	}).timeout(10000);



    test('simple external get url as yaml', async () => {

        //	//	clear all open editors
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');

        const testAPI = 'url: https://api.chucknorris.io/jokes/random';
        const recvString = { data: { joke: 'awesome' }};
        
        // setup nock to respond to api
        nock('https://api.chucknorris.io')
            .get('/jokes/random')
            .reply(200, recvString);

        // open an editor and insert text to test with
        const editr = await utils.displayInTextEditor(testAPI);

        await new Promise(r => setTimeout(r, 100)); // pause to load editor w/text
        await vscode.commands.executeCommand("editor.action.selectAll");    // select all text

        await new Promise(r => setTimeout(r, 100)); // let select text settle
        
        /**
         * execute command to start function
         * should make the api call, then open a new editor with response
         */
        await vscode.commands.executeCommand('f5.makeRequest');
        
        await new Promise(r => setTimeout(r, 100)); // let the command finish

        const editor = vscode.window.activeTextEditor;  // get active editor
        let text = '';
        if(editor){
            // get all text from editor
            text = editor.document.getText();
        }

        assert.deepStrictEqual(JSON.parse(text), recvString);
	}).timeout(10000);



    test('simple external post as yaml', async () => {

        //	//	clear all open editors
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');

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
        await vscode.commands.executeCommand("editor.action.selectAll");    // select all text

        await new Promise(r => setTimeout(r, 100)); // let select text settle
        
        /**
         * execute command to start function
         * should make the api call, then open a new editor with response
         */
        await vscode.commands.executeCommand('f5.makeRequest');
        
        await new Promise(r => setTimeout(r, 100)); // let the command finish

        const editor = vscode.window.activeTextEditor;  // get active editor
        let text = '';
        if(editor){
            // get all text from editor
            text = editor.document.getText();
        }

        assert.deepStrictEqual(JSON.parse(text), recvString);
	}).timeout(10000);


    test('external post as json', async () => {

        //	//	clear all open editors
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');

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
        await vscode.commands.executeCommand("editor.action.selectAll");    // select all text

        await new Promise(r => setTimeout(r, 100)); // let select text settle
        
        /**
         * execute command to start function
         * should make the api call, then open a new editor with response
         */
        await vscode.commands.executeCommand('f5.makeRequest');
        
        await new Promise(r => setTimeout(r, 100)); // let the command finish

        const editor = vscode.window.activeTextEditor;  // get active editor
        let text = '';
        if(editor){
            // get all text from editor
            text = editor.document.getText();
        }

        assert.deepStrictEqual(JSON.parse(text), recvString);
	}).timeout(10000);

});



