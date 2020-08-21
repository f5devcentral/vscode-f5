


# TCL/iRules/iApps

[BACK TO MAIN README](../README.md)

---

&nbsp;

The extension can now manage TCL configurations including iRules and iApps!

&nbsp;

## F5: Settings

&nbsp;

Enable TCL functionality under `F5: Tcl`.  This is disabled by default

![TCL setting](./images/tcl_setting_8.21.2020.PNG)

&nbsp; &nbsp; 

--- 

&nbsp; &nbsp; 

## Install F5 Networks iRules extension by bitwisecook

https://marketplace.visualstudio.com/items?itemName=bitwisecook.irule

Also check out the iApp version:
https://marketplace.visualstudio.com/items?itemName=bitwisecook.iapp

&nbsp;

---

&nbsp;


## Commands

&nbsp;

* `F5: Merge TCL/TMOS`: Used to merge editor/highlighted text with running connfig of connected bigip
  - Use this to push a new TMOS config object or after modifing an existing irule (format is a tmos object)
  - Available: right-click in editor
  - Uploads a file with configuration objects, moves them to a temp directory, then attempts to merge with running config
    - /var/config/rest/downloads/tempTmosConfigMerge.tcl -> /tmp/tempTmosConfigMerge.tcl
    - `tmsh load sys config merge file /tmp/tempTmosConfigMerge.tcl`
    - If no error|fail detected -> pop-up success message
      - else display editor with full error message


* `F5: DELETE iRule`: Used to delete irule
  - Available: right-click irule item in TCL view tree
  - Deletes irule object from device, refreshes TCL tree view to show changes

* `F5: Get iApp Template Origin .tmpl`: Displays the original .tmpl iApp template format
  - Available: regular click on iApp item in IRULE/IAPPS view
  - Primary recommended method for modifying an iApp

* `F5: Get iApp Template JSON`: Displays the JSON format of selected iApp template
  - Available: right-click on iApp item in IRULE/IAPPS view
  - Don't really see any use for this, but it's there for show

* `F5: RE-DEPLOY iApp-App`: Redeploys iApp-App using current paramters
  - Available: right-click on Deployed-Apps item in IRULE/IAPPS view
  - Like issuing command:  modify sys application service my_app.app/my_app execute-action definition
  - This is used for redeploying an app after making changes to the source iapp template

* `F5: DELETE iApp-App`: Deletes iApp-App
  - Available: right-click on Deployed-Apps item in IRULE/IAPPS view tree

* `F5: DELETE iApp Template`: Deletes iApp Template
  - Available: right-click on iApp-Templates item in IRULES/IAPPS view tree

* `F5: POST iApp Template .tmpl`: Uploads and imports iApp template
  - Available: right-click in editor and right-click on explorer file with .tmpl extension

&nbsp;

---

&nbsp;

## Create/Modify/Delete iRule

&nbsp;

![create/modify/delete iRule](./images/tcl_createModifyDelete_rule_8.21.2020.gif)

&nbsp;

---

&nbsp;

## iApp Template Management

* Upload .tmpl from explorer file
* Upload iApp from editor
* Modify existing iApp
* Delete iApp

&nbsp;

![create/modify/delete iRule](./images/tcl_createModifyDelete_rule_8.21.2020.gif)

&nbsp;

---

&nbsp;

## Config migration work flow?
- get bigip.conf from bigip
  - `Remote Command Execute` -> 'cat /config/bigip.con'
  - disconnect from bigip
- extract configuration objects to new editor as needed
- connet to new device, merge TCL from new editors with extracted/modified configurations


