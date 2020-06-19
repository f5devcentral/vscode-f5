import * as assert from 'assert';
import fs = require('fs');
import path = require('path');


// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../extension';
import * as utils from '../../utils/utils';
// import * as snippets from '../../../snippets.json';
import { ext } from '../../extensionVariables';
// import delay = require('delay');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('Sample test - test time to load extension?', () => {
		console.log('update for loading extension');
		
		assert.equal(-1, [1, 2, 3].indexOf(5));
		assert.equal(-1, [1, 2, 3].indexOf(0));
	});
});


suite('Extension GUI tests', () => {
	vscode.window.showInformationMessage('Starting gui tests.');
	test('open JSON editor -> insert as3 snippet', async () => {

		//	//	clear all open editors
		await vscode.commands.executeCommand('workbench.action.closeAllEditors');
		//	// open a new text editor
		const jsonEditor = await vscode.workspace.openTextDocument({ language: 'json' });
		//	//	show new text editor (make active)
		await vscode.window.showTextDocument(jsonEditor, {preview: false});

		//	//	inject sample as3 snippet
		await vscode.commands.executeCommand('editor.action.insertSnippet', 
			{ name: "example_F5_AS3_declaration"}
		);

		//	check snippet against isolated copy
		assert.deepStrictEqual(as3_sample_01, jsonEditor.getText());
		
	}).timeout(5000);


	test('open test json in editor #1 - tests utils.displayJsonInEditor', async () => {
		await vscode.commands.executeCommand('workbench.action.closeAllEditors');

		//	//	option #1 - use the editor object created by the displayJsonInEditor function
		//			to know which editor has the text we need to test
		const testObj: object = { "key1": "value1", "key2": "value2"};
		const editr = await utils.displayJsonInEditor(testObj);
		assert.deepStrictEqual(testObj, JSON.parse(editr.document.getText()));
	});

	test('open test json in editor #2 - tests utils.displayJsonInEditor', async () => {
		await vscode.commands.executeCommand('workbench.action.closeAllEditors');

		//	//	option #2 - capture the active editor since we don't know what it is
		//			to know which editor has the text we need to test
		const testObj2: object = { "key1": "value1", "key2": "value2"};

		// need to wait for this to complete
		await utils.displayJsonInEditor(testObj2);

		// capture currrent editor
		const editor = vscode.window.activeTextEditor;
		
		if(!editor) {
			return Error("uh..oh...");
		}

		// get text from editor
		const text = editor.document.getText();

		assert.deepStrictEqual(testObj2, JSON.parse(text));

	}).timeout(5000);
});

suite('Utils tests...', () => {
	vscode.window.showInformationMessage('Start utils tests.');
	test('simulate successful connect -> enable status bar', async () => {


		// await new Promise(resolve => { setTimeout(resolve, 10000); });

		// Create a status bar item
		// context: vscode.ExtensionContext
		// ext.context = context;
		// ext.hostStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		// context.subscriptions.push(ext.hostStatusBar);
		// setHostStatusBar('admin@192.168.1.1');
		// assert.deepStrictEqual(ext.hostStatusBar.text, 'admin@192.168.1.1')
		// assert.deepStrictEqual(ext.hostStatusBar.tooltip, '')
		// assert.deepStrictEqual(ext.hostStatusBar.command, 'f5.disconnect')

	});
	test('simulate successful connect -> enable status bar', () => {
		assert.equal(-1, [1, 2, 3].indexOf(5));
		assert.equal(-1, [1, 2, 3].indexOf(0));
		// const paramDef = 
	});
});


const as3_sample_01 = "{\r\n   \"$schema\": \"https://raw.githubusercontent.com/F5Networks/f5-appsvcs-extension/master/schema/latest/as3-schema.json\",\r\n   \"class\": \"AS3\",\r\n   \"action\": \"deploy\",\r\n   \"persist\": true,\r\n   \"declaration\": {\r\n      \"class\": \"ADC\",\r\n      \"schemaVersion\": \"3.0.0\",\r\n      \"id\": \"urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d\",\r\n      \"label\": \"Sample 1\",\r\n      \"remark\": \"Simple HTTP application with RR pool\",\r\n      \"Sample_01\": {\r\n         \"class\": \"Tenant\",\r\n         \"A1\": {\r\n            \"class\": \"Application\",\r\n            \"template\": \"http\",\r\n            \"serviceMain\": {\r\n               \"class\": \"Service_HTTP\",\r\n               \"virtualAddresses\": [\r\n                  \"10.0.1.10\"\r\n               ],\r\n               \"pool\": \"web_pool\"\r\n            },\r\n            \"web_pool\": {\r\n               \"class\": \"Pool\",\r\n               \"monitors\": [\r\n                  \"http\"\r\n               ],\r\n               \"members\": [{\r\n                  \"servicePort\": 80,\r\n                  \"serverAddresses\": [\r\n                     \"192.0.1.10\",\r\n                     \"192.0.1.11\"\r\n                  ]\r\n               }]\r\n            }\r\n         }\r\n      }\r\n   }\r\n}";

// const as3_sample_01b = 
// {
// 	"$schema": "https://raw.githubusercontent.com/F5Networks/f5-appsvcs-extension/master/schema/latest/as3-schema.json",
// 	"class": "AS3",
// 	"action": "deploy",
// 	"persist": true,
// 	"declaration": {
// 	   "class": "ADC",
// 	   "schemaVersion": "3.0.0",
// 	   "id": "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
// 	   "label": "Sample 1",
// 	   "remark": "Simple HTTP application with RR pool",
// 	   "Sample_01": {
// 		  "class": "Tenant",
// 		  "A1": {
// 			 "class": "Application",
// 			 "template": "http",
// 			 "serviceMain": {
// 				"class": "Service_HTTP",
// 				"virtualAddresses": [
// 				   "10.0.1.10"
// 				],
// 				"pool": "web_pool"
// 			 },
// 			 "web_pool": {
// 				"class": "Pool",
// 				"monitors": [
// 				   "http"
// 				],
// 				"members": [{
// 				   "servicePort": 80,
// 				   "serverAddresses": [
// 					  "192.0.1.10",
// 					  "192.0.1.11"
// 				   ]
// 				}]
// 			 }
// 		  }
// 	   }
// 	}
//  };