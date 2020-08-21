


# TCL/iRules/iApps

[BACK TO MAIN README](../README.md)

---

The extension can now manage TCL configurations including iRules, iApps

## F5: Settings

Enable TCL functionality under `F5: Tcl`.  This is disabled by default


## Commands

* `F5: Merge TCL/TMOS`: Used to merge editor/highlighted text with running connfig of connected bigip
  - Use this to push a new TMOS config object or after modifing an existing irule (format is a tmos object)
  - Available: right-click in editor
  - Pushes a file with configuration objects, moves them to a temp directory, then attempts to merge with running config
    - source -> dst directory for moving
    - tmsh load sys config merge file /tmp/tmp.tcl
    tmsh load sys config merge file /tmp/${tmpFile}'

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


## Create iRule

## Modify existing iRule

## Delete iRule





## Upload .tmpl from explorer file

## Upload iApp from editor

## Modify existing iApp

## Delete iApp



## Config migration work flow
- get bigip.conf from bigip, disconnect
- extract configuration objects
- connet to new device, merge TCL


