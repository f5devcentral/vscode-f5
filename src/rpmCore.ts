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
    ProgressLocation,
    ExtensionContext
} from "vscode";
import { ext } from "./extensionVariables";
import * as rpmMgmt from './utils/rpmMgmt';
import logger from "./utils/logger";
import { Asset, HttpResponse, isArray } from 'f5-conx-core';


/**
 * core rpm install/unInstall functionality
 */
export default function rpmCore(context: ExtensionContext) {


    
	/**
	 * ###########################################################################
	 * 
	 * 				RRRRRR     PPPPPP     MM    MM 
	 * 				RR   RR    PP   PP    MMM  MMM 
	 * 				RRRRRR     PPPPPP     MM MM MM 
	 * 				RR  RR     PP         MM    MM 
	 * 				RR   RR    PP         MM    MM 
	 * 
	 * ############################################################################
	 * http://patorjk.com/software/taag/#p=display&h=0&f=Letters&t=FAST
	 */

	context.subscriptions.push(commands.registerCommand('f5.installRPM', async (selectedRPM) => {

		const downloadResponses = [];
		const upLoadResponses = [];
		let rpm: Asset;
		let signature;
		let installed: HttpResponse;


		if (isArray(selectedRPM)) {

			window.withProgress({
				location: ProgressLocation.SourceControl
			}, async () => {

				rpm = selectedRPM.filter((el: Asset) => el.name.endsWith('.rpm'))[0];
				signature = selectedRPM.filter((el: Asset) => el.name.endsWith('.sha256'))[0];

				// setup logic to see what atc service is being installed, and compare that with what might already be installed
				//  work through process for un-installing, then installing new package

				if (rpm) {

					await ext.f5Client?.atc.download(rpm.browser_download_url)
						.then(async resp => {

							// assign rpm name to variable
							downloadResponses.push(resp);
							await new Promise(resolve => { setTimeout(resolve, 1000); });

							await ext.f5Client?.atc.uploadRpm(resp.data.file)
								.then(async uploadResp => {

									await new Promise(resolve => { setTimeout(resolve, 1000); });
									upLoadResponses.push(uploadResp);
									await ext.f5Client?.atc.install(rpm.name)
										.then(resp => installed = resp);
								});
						})
						.catch(err => {

							// todo: setup error logging
							debugger;
						});
				}
				if (signature) {

					await ext.f5Client?.atc.download(rpm.browser_download_url)
						.then(async resp => {
							await ext.f5Client?.atc.uploadRpm(resp.data.file);
						})
						.catch(err => {
							// todo: setup error logging
							debugger;
						});
				}


				if (installed) {
					await new Promise(resolve => { setTimeout(resolve, 500); });
					await ext.f5Client?.connect(); // refresh connect/status bars
					await new Promise(resolve => { setTimeout(resolve, 500); });
					ext.hostsTreeProvider.refresh();
				}
			});
		}
	}));

	context.subscriptions.push(commands.registerCommand('f5.unInstallRPM', async (rpm) => {

		window.withProgress({
			location: ProgressLocation.SourceControl,
		}, async () => {
			// if no rpm sent in from update command
			if (!rpm) {
				// get installed packages
				const installedRPMs = await rpmMgmt.installedRPMs();
				// have user select package
				rpm = await window.showQuickPick(installedRPMs, { placeHolder: 'select rpm to remove' });
			} else {
				// rpm came from new rpm hosts view
				if (rpm.label && rpm.tooltip) {


					await ext.f5Client?.atc.showInstalled()
						.then(async resp => {
							// loop through response, find rpm that matches rpm.label, then uninstall
							const rpmName = resp.data.queryResponse.filter((el: { name: string }) => el.name === rpm.tooltip)[0];
							return await ext.f5Client?.atc.unInstall(rpmName.packageName);

						});



				}

			}

			if (!rpm) {	// return error pop-up if quickPick escaped
				// return window.showWarningMessage('user exited - did not select rpm to un-install');
				logger.info('user exited - did not select rpm to un-install');
			}

			// const status = await rpmMgmt.unInstallRpm(rpm);
			// window.showInformationMessage(`rpm ${rpm} removal ${status}`);
			// debugger;

			// used to pause between uninstalling and installing a new version of the same atc
			//		should probably put this somewhere else
			await new Promise(resolve => { setTimeout(resolve, 10000); });
			await ext.f5Client?.connect(); // refresh connect/status bars
			ext.hostsTreeProvider.refresh();
		});
	}));
    

}