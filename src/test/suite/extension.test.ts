import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../extension';
import { setHostStatusBar, setMemento, getMemento, setMementoW, getMementoW, isValidJson, getPassword } from '../../utils/utils';
import { ext } from '../../extensionVariables';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');
	test('Sample test', () => {
		assert.equal(-1, [1, 2, 3].indexOf(5));
		assert.equal(-1, [1, 2, 3].indexOf(0));
	});
});

suite('Utils tests...', () => {
	vscode.window.showInformationMessage('Start utils tests.');
	test('simulate successful connect -> enable status bar', () => {

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
