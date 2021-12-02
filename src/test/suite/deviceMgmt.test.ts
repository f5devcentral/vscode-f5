import * as assert from 'assert';
import fs = require('fs');
import path = require('path');

import { commands } from 'vscode';

suite('device mgmt tasks', () => {

    test('add new device', async () => {

        await commands.executeCommand('f5.addHost', 'tst9843@1.1.1.1');

    }).timeout(10000);

    test('remove new device just added', async () => {

        await commands.executeCommand('f5.removeHost', 'tst9843@1.1.1.1');

	}).timeout(10000);

});
