/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';

import * as path from 'path';
import * as fs from 'fs';

import { commands, ExtensionContext, window } from 'vscode';
import { getRPMgit, listGitReleases } from './utils/rpmMgmt';
import { ExtHttp } from 'f5-conx-core';

import { logger } from './logger';
import { ext } from './extensionVariables';

/**
 * Provides command to download github releases of this extension so users can easily access beta versions for testing
 */
export class ChangeVersion {
	/**
	 * base repo releases
	 */
	readonly repo = 'https://api.github.com/repos/f5devcentral/vscode-f5/releases';

	constructor(context: ExtensionContext, extHttp: ExtHttp) {

		context.subscriptions.push(commands.registerCommand('f5.changeVersion', async () => {

			ext.telemetry.send({ command: 'f5.changeVersion' });

			//  1. list releases on github repo
			//  2. provide list/selector for version
			//  3. download version
			//  4. install version, reload window?

			// get current extension home folder
			const extDir = path.join(context.extensionPath, '..');

			logger.info('f5.changeVersion, fetching github releases');

			// list available git releases and have the user select one
			const chosenVersion: string | { label: string, asset: string } | undefined = await listGitReleases(this.repo)
				.then(async versions => {
					logger.debug('f5.changeVersion, available version', versions);
					return await window.showQuickPick(versions, { placeHolder: 'Select Version' });
				});

			logger.info('f5.changeVersion, downloading chosen version', chosenVersion);

			// if we have a selection from the previous list
			if (chosenVersion && typeof chosenVersion === 'object' && chosenVersion.asset) {

				const downloadLocation = await extHttp.makeRequest({ url: chosenVersion.asset })
					.then(async resp => {

						// loop through assets get needed information
						const assetSet = resp.data.assets.map((item: { name: string; browser_download_url: string; }) => {
							return { name: item.name, browser_download_url: item.browser_download_url };
						});
						logger.debug('f5.changeVersion assetSet', assetSet[0]);

						const destPath = path.join(extDir, assetSet[0].name);
						// if item already exists
						if (fs.existsSync(destPath)) {
							logger.debug(`${destPath} already cached!`);
							return destPath;
						} else {
							logger.debug(`${assetSet[0].name} NOT found in local cache, downloading...`);
							// await rpmDownload(item.browser_download_url, destPath);
							// return await downloadToFileNew(assetSet[0].browser_download_url, destPath)
							return await extHttp.download(assetSet[0].browser_download_url, undefined, extDir)
								.then(resp => {
									// return path to downloaded file
									return resp.data.file;
								});
						}
					})
					.catch(err => {
						logger.error('f5.changeVersion, choose/download failed', err);
					});

				// 	// this command really doesn't work.  
				// 	// https://github.com/microsoft/vscode-remote-release/issues/385
				// 	// https://github.com/microsoft/vscode-remote-release/issues/2749
				// 	// furthermore, code-server command for web based code would require detecting the environemnt and changing the command accordingly
				// logger.info('f5.changeVersion, the install command will probably NOT work, but at least the new extenion version will be downloaded and easily installable via the UI');

				const cmd2Install = `code --install-extension ${downloadLocation}`;
				logger.info('f5.changeVersion, you can try the following command, or just "install vsix from UI", cmd: \n\n', cmd2Install, '\n\n');

				// try {
				// 	// try to issue the install command via node sub-process
				// 	const installResp = cp.execSync(cmd2Install).toString();
				// 	logger.info('f5.changeVersion, install response', installResp);

				// 	// TODO: this need some work. over remote-ssh file does not download and it doesn't fail appropriately
				// } catch (e) {

				// 	logger.info('f5.changeVersion, failed install', e);
				// }

			} else {
				logger.info('f5.changeVersion, valid selection details not detected, user probably exited quick pick dropdown');
			}

		}));
	}
}