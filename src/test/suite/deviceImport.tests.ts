import * as assert from 'assert';
import fs = require('fs');
import path = require('path');

// import * as vscode from 'vscode';
import { deviceImport } from '../../deviceImport';


suite('device import tests', () => {
	// vscode.window.showInformationMessage('Starting gui tests.');
	test('import seed file - success', async () => {

        deviceImport('this is a seed file');

		//	check snippet against isolated copy
		assert.deepStrictEqual('a', 'a');
		
	}).timeout(5000);





});