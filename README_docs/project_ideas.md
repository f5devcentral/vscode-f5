# Project details

[BACK TO MAIN README](../README.md)

Name: f5-Fast
Desc:  


## functionality: display pretty json with colors
- this got it somewhat formatted
https://github.com/Microsoft/vscode/issues/53697
> Yeah, use a formatter (as library) when creating the file. The most simple would be using JSON.stringify(stats, undefined, 4)
- Want it formated like the vscode-rest-client
- more information about formating data in editor window
https://stackoverflow.com/questions/29973357/how-do-you-format-code-in-visual-studio-code-vscode

## functionality:  capture logs of remote device
- pretty sure this only works over Remote SSH
https://marketplace.visualstudio.com/items?itemName=tiansin.logtail


## functionality:  log all outbount https.request details
- looks like this will need a wrapper like this:
https://chatbotsmagazine.com/track-outgoing-http-s-requests-in-nodejs-48608553f03c
- or an npm module to facilitate global logging of http.requests 
https://www.npmjs.com/package/global-request-logger
- intercept and mock?
https://github.com/moll/node-mitm



## functionality: configure tree view
- tree view to list devices/bigips/hosts
- tree view to list available templates
- tree view to show deployed templates

-- https://medium.com/@sanaajani/creating-your-first-vs-code-extension-8dbdef2d6ad9
-- https://github.com/Microsoft/vscode-extension-samples/tree/master/tree-view-sample
-- https://stackoverflow.com/search?q=%5Bvisual-studio-code%5D+TreeDataProvider
-- https://stackoverflow.com/questions/56534723/simple-example-to-implement-vs-code-treedataprovider-with-json-data

-- Example tree view for devices and details 
		https://github.com/microsoft/vscode-cosmosdb
		https://github.com/formulahendry/vscode-docker-explorer





## functionality: status bar

looking to use the status bar to show what device we are interacting with.

Once a device is selected, and a password is received, the status bar should appear

Status bar should show device details like "admin@192.168.1.1", but can also include details like installed ilx extensions and or version information

I was also able to append the password to the status bar object, so, this could be used to store and access the password/device/creds for all API calls, till the user calls "disconnect", which should hide the status bar and clear the current working credentials.

### example status bar repos

 - best status bar example seems to be the basic-multi-root-sample in the vscode-extension-samples

 - seems to be a git like extension that shows file status
https://github.com/vsls-contrib/gitdoc/blob/fbadc302bf94d64b2e448b22ee366259d760c6e7/src/watcher.ts

 - extension someone wrote to interface/play a game?  status bar is used to start/stop/pause
https://github.com/hozuki/snaky/blob/38b599b31032a40ba654d7bed131f97d5e0fa0e8/src/editor/StatusBarItems.ts

 - terminal use of creating and updating status bar item
https://github.com/spectra-one/terminalis/blob/8797bdba05038bb61cf01b879831a3ab985524ed/src/extension.ts

 - very simple status bar for quick task - seems to be an npm task monitor
https://github.com/lkytal/quickTask/blob/ad5efc17bb414e759126065fe885de93c1de771a/src/statusBar.ts

 - another simple example of using the status bar to show the total number of lines in current editor
https://github.com/praveenp30/total-lines/blob/eeb5a93707b1ec89c4f423ff6833c13000120275/extension.js




## unit testing
- need to setup testing/unit/mock/mocha...
https://stackoverflow.com/questions/47906194/unit-test-functions-that-use-vscode-extension-api-functions/58827442#58827442
