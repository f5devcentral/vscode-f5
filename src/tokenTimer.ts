/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';

import {
    window,
    StatusBarItem,
    StatusBarAlignment
} from 'vscode';
import { ext } from './extensionVariables';
import { logger } from './logger';

export function tokenTimer(hide?: boolean) {

    const tokenTimerBar: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 50);

    tokenTimerBar.tooltip = 'F5 AuthToken Timer';

    if (hide) {
        tokenTimerBar.hide();
    }

    ext.eventEmitterGlobal
        .on('token-timer-start', msg => {

            tokenTimerBar.show();
            logger.info(msg);

        })
        .on('token-timer-expired', msg => {

            tokenTimerBar.hide();
            logger.info(msg);

        })
        .on('token-timer-count', second => {

            if (second <= 30) {
                // turn text color reddish/pink to indicate expiring token
                tokenTimerBar.color = '#ED5A75';
            } else {
                tokenTimerBar.color = 'silver';
            }

            tokenTimerBar.text = `${second}`;
        });
}