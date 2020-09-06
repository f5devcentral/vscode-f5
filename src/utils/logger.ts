


import { window, OutputChannel } from 'vscode';
// import * as vscode from 'vscode';


/**
 * logger class to display logs in 'OUTPUT' tab near terminal window
 */
export class Logger {
     channel: OutputChannel;

	constructor(name: string) {
        this.channel = window.createOutputChannel(name);
        this.channel.show();
    }
    
    /**
     * 
     * @param log log string
     */
    log(log: string) {

        /**
         * add time stamp to each log
         */
        this.channel.appendLine(log);
    }

    /**
     * break out logging into error/warning/debug
     *  setup different color for each?
     */
    
}