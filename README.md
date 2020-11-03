# vscode-f5

We'ved moved and renamed!!!

Formerly the F5 (A)pplication (S)ervices (T)emplates(FAST), "vscode-f5-fast" extension, now just "The F5 VSCode" Extension (vscode-f5). 

Not only not it fully integrate with the (A)utomated (T)ool (C)hain but also support TCL/iRules/iApps and much more!!!

More to come over the next couple of weeks as we finalize the move and prepare for the next release.  Please stay tuned.

Any comments, questions or feature requests, please open a github repository issue!!!



### New documentation site!!!
> https://f5devcentral.github.io/vscode-f5/#/

---

## Index

### This page

* [Extension Commands](https://github.com/f5devcentral/vscode-f5#extension-commands)
* [Basic device management](https://github.com/f5devcentral/vscode-f5#basic-device-management-addeditdelete-connectdisconnect)
* [Connecting/Disconnecting and password caching](https://github.com/f5devcentral/vscode-f5#connectingdisconnecting-and-password-caching)
* [Extension Commands](https://github.com/f5devcentral/vscode-f5#extension-commands)


### Other Pages

* [CHANGELOG](CHANGELOG.md)
<!-- * [Research](./README_docs/research.md) -->
<!-- * [Schema Validation](./README_docs/schemaValidation.md) -->
<!-- * [Crafting raw API calls](https://github.com/DumpySquare/f5-fasting/blob/master/makeHTTPsTesting.md)
    > hosted in the f5-fasting repo that is used to document and demonstrate fast/extension functionality for demos -->
<!-- * [ATC ILX rpm package management](./README_docs/rpmMgmt.md) -->
<!-- * [TCL/iRules/iApps](./README_docs/tcl.md) -->
<!-- * [FAST information and How-To's](./README_docs/fast.md) -->
<!-- * [Additional Tools](./README_docs/tools.md) -->


Future extension features and enhancements have been moved to the repo issues(enhancements) for better tracking
* [repo issues and enhancements](https://github.com/f5devcentral/vscode-f5/issues)

---




## Known Issues

HTTP/422 responses - Can happen for a handful of reasons:
- Getting DO declaration when device has settings DO can configure but device was not deployed with DO (it can't manage the settings that are already there)
- Improperly formatted/wrong declaration
  - Sometimes this is from the '$schema' reference in the declaration
- Sometimes you can fix a DO HTTP/400 response by overwriting with a clean/updated declaration


### HTTP Auth Failures

When utilizing an external auth provider, occasionally restjavad/restnoded can have some issues, resulting in some occansional HTTP/400 auth errors:

The fix is to restart: restjavad and restnoded

Error from extension
> HTTP Auth FAILURE: 400 - undefined

Error from restjavad log
```log
[SEVERE][6859][24 Jul 2020 13:11:39 UTC][8100/shared/authn/login AuthnWorker] Error as the maximum time to wait exceeded while getting value of loginProviderName
[SEVERE][6860][24 Jul 2020 13:11:39 UTC][8100/shared/authn/login AuthnWorker] Error while setting value to loginProviderName when no loginReference and no loginProviderName were given
[WARNING][6861][24 Jul 2020 13:11:39 UTC][com.f5.rest.common.RestWorker] dispatch to worker http://localhost:8100/shared/authn/login caught following exception: java.lang.NullPointerException
        at com.f5.rest.workers.authn.AuthnWorker.onPost(AuthnWorker.java:394)
        at com.f5.rest.common.RestWorker.callDerivedRestMethod(RestWorker.java:1276)
        at com.f5.rest.common.RestWorker.callRestMethodHandler(RestWorker.java:1190)
        at com.f5.rest.common.RestServer.processQueuedRequests(RestServer.java:1207)
        at com.f5.rest.common.RestServer.access$000(RestServer.java:44)
        at com.f5.rest.common.RestServer$1.run(RestServer.java:285)
        at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:473)
        at java.util.concurrent.FutureTask.run(FutureTask.java:262)
        at java.util.concurrent.ScheduledThreadPoolExecutor$ScheduledFutureTask.access$201(ScheduledThreadPoolExecutor.java:178)
        at java.util.concurrent.ScheduledThreadPoolExecutor$ScheduledFutureTask.run(ScheduledThreadPoolExecutor.java:292)
        at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1152)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:622)
        at java.lang.Thread.run(Thread.java:748)
```

---

## Client side extension debugging

### Developer Debugger

VScode has a built in debugger very much like Chrome.  This can be used to gain insight to what is happening when things don't respond as expected.

If you are having issues, it may be best to start here and capture the output as described below:

- In the main VSCode window, along the top, select **Help**, then **Toggle Developer Tools**, select the **Console** tab.
  - Then, explore the requests and responses to see if there are any areas of concern
    - Expand some of the objects by clicking the little triangle next to the obejct under a request or response to inspect

If needed, **right-click** on an entry, then select **save-as** to save the log including expanded objects to a file.  This can be used for troubleshooting

<!-- ![vscode debugging console](./README_docs/images/vscodeDebugConsole_5.20.2020.PNG) -->
<img src="./README_docs/images/vscodeDebugConsole_5.20.2020.PNG" alt="drawing" width="80%"/>

This mainly catches logs send through the console.log(''), which should typically be for development.


## installing vsix 

The recommended way to get this extension is to install from the Microsoft VScode extension marketplace or from within VSCode directly, under the extensions activity bar view on the left.

If you still need to install from vsix, they can be downloaded under the 'release' tab above: https://github.com/f5devcentral/vscode-f5/releases

Different ways to install vsix:
- https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix
- https://github.com/eamodio/vscode-gitlens/wiki/Installing-Prereleases-(vsix)


## Running the extension for dev

- Clone and install dependencies:
    ```bash
    git clone https://github.com/f5devcentral/vscode-f5.git
    cd cd vscode-f5-fast/
    npm install
    code .
    ```
- Start Debugging environment: Keystroke `F5`
- Navigate to view container by clicking on the f5 icon in the Activity bar (typically on the left)
- Update device list in tree view on the left with a device in your environment
  - ***ADD*** in the ***F5 Hosts*** view
  - or `click` the pencil icon on an item and modify the item
- Connect to device
  - (`click` device in host tree or `Cntrl+shift+P` or `F1`)
