import * as assert from 'assert';
import fs = require('fs');
import path = require('path');

import { commands } from 'vscode';
import { logger } from '../../logger';

suite('device mgmt tasks', () => {


    test('add new device', async () => {

        await commands.executeCommand('f5.addHost', 'tst9843@1.1.1.1');

    }).timeout(10000);

    test('remove new device just added', async () => {

        await new Promise(r => setTimeout(r, 500));

        try {
            
            await commands.executeCommand('f5.removeHost', 'tst9843@1.1.1.1');
        } catch (e) {
            
            console.log(e, logger.journal.join('\n'));
        }

	}).timeout(10000);

});
