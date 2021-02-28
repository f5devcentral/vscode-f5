

# The F5 VSCode Extension

If you consistently use APIs while working with F5s, the F5 VSCode Extension needs to be a permanent addition to your toolkit!

The F5 VSCode Extension will not only supercharge your abilities to write (A)utomated (T)ool(C)hain declarations with snippets, examples and declaration schema validation, but also assist with connecting, deploying, retrieving and updating declarations on F5 devices.

If you are not excited yet, the extension can also:

- GET/POST/DELETE of all ATC services, including FAST/AS3/DO/TS
- links to quickly open related ATC documentation
- Direct access to ATC examples from git repo
- Install/UnInstall of ATC rpms
- Convert JSON <-> YAML
- Encode/Decode base64 strings
- Craft generic HTTP REST calls to connected device or external
- Extract TMOS applications (per virtual server)
- Write, deploy and modify iRules/iApps (with vscode-irule extension for language support)

## Getting the extension

The best path is to install Visual Studio Code from: https://code.visualstudio.com/

### VSCode Marketplace

- https://marketplace.visualstudio.com/items?itemName=F5DevCentral.vscode-f5

### Open Source Marketplace

- https://open-vsx.org/extension/F5DevCentral/vscode-f5

Then install the extension following the steps below:

Select the extensions view 

<img src="./media/vscode_extensions_icon.PNG" alt="drawing" width="5%"/>

Search for `F5`, select the extension "The F5 Extension", then `Install`

<img src="./media/installWithinCode_11.04.2020.gif" alt="drawing" width="80%"/>

## Create a device and connect

Select `Add Host` in the `F5: Hosts` view.  Then type in device details in the \<user\>@x.x.x.x format, hit `Enter` to submit

<img src="./media/addDeviceConnect_11.04.2020.gif" alt="drawing" width="80%"/>

## Deploy example as3 app

Click on the hostname of the connected device at the bottom of the window.

> This is the easiest way to get an editor window for JSON files and it also demontrates how to get device details

Now that we have a json editor, select all text (`control + a`), then `delete`.

Type `as3` to get the example AS3 snippet, press `Enter`.

This should insert a sample AS3 declaration into the editor

> Note the declaration schema reference at the top.  This provides instant feedback and validation for any necssary modifications.  Please see [Schema Validation](schema_validation.md) for more details

Right-click in the editor and select `POST as AS3 Declaration`.  This should post the declaration to the currently connected device

!> Please be sure to have the AS3 service installed prior.  See [ATC RPM Mgmt](atc_rpm_mgmt.md) for assistance with getting a service installed

<img src="./media/as3SnippetDemo_11.04.2020.gif" alt="drawing" width="80%"/>



### To delete deployed AS3 tenant from device

Right-click on the tenant in the AS3 view on the left, then select `Delete Tenant`




<!-- 
### other wiki I was trying out...
https://github.com/f5devcentral/vscode-f5.wiki.git -->