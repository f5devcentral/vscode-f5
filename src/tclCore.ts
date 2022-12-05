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
    commands,
    ExtensionContext
} from "vscode";
import { ext } from "./extensionVariables";
import { TclTreeProvider } from "./treeViewsProviders/tclTreeProvider";

import { logger } from './logger';

/**
 * core tcl commands functionality
 */
export default function tclCore(context: ExtensionContext) {




    /**
     * ###########################################################################
     * 
     * 				TTTTTTT    CCCCC    LL      
     * 				  TTT     CC    C   LL      
     * 				  TTT     CC        LL      
     * 				  TTT     CC    C   LL      
     * 				  TTT      CCCCC    LLLLLLL 
     * 
     * ############################################################################
     * http://patorjk.com/software/taag/#p=display&h=0&f=Letters&t=FAST
     */


    const tclTreeProvider = new TclTreeProvider();
    const tctTreeView = window.createTreeView('as3Tasks', {
        treeDataProvider: tclTreeProvider,
        showCollapseAll: true
    });
    commands.registerCommand('f5.refreshTclTree', () => tclTreeProvider.refresh());


    // --- IRULE COMMANDS ---
    context.subscriptions.push(commands.registerCommand('f5-tcl.getRule', async (rule) => {
        return tclTreeProvider.displayRule(rule);
    }));

    context.subscriptions.push(commands.registerCommand('f5-tcl.deleteRule', async (rule) => {
        return tclTreeProvider.deleteRule(rule);
    }));

    // --- ICALL COMMANDS ---
    context.subscriptions.push(commands.registerCommand('f5-tcl.getIcallscript', async (icallscript) => {
        return tclTreeProvider.displayIcallscript(icallscript);
    }));

    context.subscriptions.push(commands.registerCommand('f5-tcl.deleteIcallscript', async (icallscript) => {
        return tclTreeProvider.deleteIcallscript(icallscript);
    }));




    // --- IAPP COMMANDS ---
    context.subscriptions.push(commands.registerCommand('f5-tcl.getApp', async (item) => {
        logger.debug('f5-tcl.getApp command: ', item);
        return ext.panel.render(item);
    }));


    context.subscriptions.push(commands.registerCommand('f5-tcl.getTemplate', async (item) => {
        // returns json view of iApp Template
        return ext.panel.render(item);
    }));


    context.subscriptions.push(commands.registerCommand('f5-tcl.getTMPL', async (item) => {
        // gets the original .tmpl output
        const temp = await tclTreeProvider.getTMPL(item);
        tclTreeProvider.displayTMPL(temp);
    }));

    context.subscriptions.push(commands.registerCommand('f5-tcl.iAppRedeploy', async (item) => {
        const temp = await tclTreeProvider.iAppRedeploy(item);
        /**
         * setup appropriate response
         * - if no error - nothing
         * - if error, editor/pop-up to show error
         */
        // return utils.displayJsonInEditor(item);
    }));

    context.subscriptions.push(commands.registerCommand('f5-tcl.iAppDelete', async (item) => {
        const temp = await tclTreeProvider.iAppDelete(item);
        tclTreeProvider.refresh();
    }));

    context.subscriptions.push(commands.registerCommand('f5-tcl.postTMPL', async (item) => {
        const resp: any = await tclTreeProvider.postTMPL(item);
        window.showInformationMessage(resp);
        return resp;
    }));

    context.subscriptions.push(commands.registerCommand('f5-tcl.deleteTMPL', async (item) => {
        const resp: any = await tclTreeProvider.deleteTMPL(item);
        return resp;
    }));

    context.subscriptions.push(commands.registerCommand('f5-tcl.mergeTCL', async (item) => {
        await tclTreeProvider.mergeTCL(item);
    }));

    context.subscriptions.push(commands.registerCommand('f5-tcl.replaceTCL', async (item) => {
        await tclTreeProvider.mergeTCL(item, true);
    }));


}