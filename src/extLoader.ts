"use strict";

export type PerfStats = {
    loadStartTime: number;
    loadEndTime?: number;
    activationTime?: number;
    load?: number;
    activate?: number;
};

const perfStats: PerfStats = {
    loadStartTime: Date.now()
};

// Object.defineProperty(exports, "__esModule", { value: true });

import { ExtensionContext } from 'vscode';
import { activateInternal, deactivateInternal } from './extension';

// while this may load the code/references, it will be empty
import { ext } from './extensionVariables';
import { logger } from './logger';

async function activate(ctx: ExtensionContext) {
    
    // we need to await this to complete so we can gather stats and log as needed
    await activateInternal(ctx);
    perfStats.activationTime = Date.now();

    perfStats.activate = (perfStats.activationTime - perfStats.loadStartTime);

    // now that the entire extension has loaded, we can actually call the following telemtry and logging functions and they work
    ext.telemetry.capture({
        command: "extensionActivation",
        stats: perfStats
    });
    logger.info(`load stats:  ${JSON.stringify(perfStats)}`);

    return;
}

async function deactivate(ctx: any) {
    await deactivateInternal(ctx);
    console.log(`de-activation complete in ${Math.floor((Date.now() - perfStats.loadStartTime) / 1000 )}ms`);
    return;
}

exports.activate = activate;
exports.deactivate = deactivate;

perfStats.loadEndTime = Date.now();
perfStats.load = (perfStats.loadEndTime - perfStats.loadStartTime);