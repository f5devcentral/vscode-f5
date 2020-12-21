import * as assert from 'assert';
import fs = require('fs');
import path = require('path');


import * as vscode from 'vscode';
import * as nock from 'nock';
import * as utils from '../../utils/utils';
import { ext } from '../../extensionVariables';
import * as extApi from '../../utils/externalAPIs';
// import { MgmtClient } from '../../utils/f5DeviceClient.ts.old';






suite('device mgmt tasks', () => {
	// // vscode.window.showInformationMessage('Starting gui tests.');
	// test('simple external get -> chuck joke', async () => {

    //     nock('https://api.chucknorris.io')
    //         .get('/jokes/random')
    //         .reply(200, { key: 'value' });
    //     const resp: any = await extApi.makeRequest({url: "https://api.chucknorris.io/jokes/random"});
    //     assert.deepStrictEqual(resp.data, { key: 'value' });
    // }).timeout(1000);
    
    // type devObj = {
    //     device: string,
    //     provider: string
    // };
    
    
    // test('get devices', async () => {

    //     const bigipHosts: Array<devObj> | undefined = await vscode.workspace.getConfiguration().get('f5.hosts');

    //     // console.log('debug');
    //     // assert.deepStrictEqual(JSON.parse(text), recvString);
	// }).timeout(10000);

    const newHost = 'tst9843@1.1.1.1';

    test('add new device -> successful', async () => {

        // const bigipHosts: Array<devObj> | undefined = await vscode.workspace.getConfiguration().get('f5.hosts');

        // console.log('debug');
        const resp = await vscode.commands.executeCommand('f5.addHost', newHost);

        console.log('added device: ', resp);

        // assert.deepStrictEqual(JSON.parse(text), resp);
    }).timeout(10000);
    
    test('remove new device just added -> successful', async () => {

        const deviceID = {
            "collapsibleState":0,
            "label":newHost,
            "version":"local",
            "command":{
                "command":"f5.connectDevice",
                "title":"hostTitle",
                "arguments":[{
                    "device":newHost,
                    "provider":"local"
                }]
            }
        };

        const resp = await vscode.commands.executeCommand('f5.removeHost', deviceID);

        console.log(`${newHost} added to device configuration`, resp);

        // assert.deepStrictEqual(JSON.parse(text), recvString);
	}).timeout(10000);





});
