# vscode-f5-fast README

This is the README for the F5 Automation Services Templates(FAST), "vscode-f5-fast". 

This extension is intented to help interface with the FAST service to manage templates and deploy applications.

In it's current state it can help create/get/post declarations for F5 ILX extensions, including AS3/DO/TS.

---

## Index

* [CHANGELOG](CHANGELOG.md)
* [VS Code Exension Dev Quickstart](./README_docs/vsc-extension-quickstart.md)
* [Project Ideas](./README_docs/project_details.md)
* [Extension Interface](./README_docs/extensionInterface.md)
* [Detailed work flow ideas](./README_docs/workflows.md)
* [Research](./README_docs/research.md)

---

## Extension Commands

Extension commands are access through the command palette by pressing `F1` or `cntrl+shift+p`

This extension provides the following commands and are active on workspace load (if extension is installed and enabled).

* `F5: Connect to Device`: Used to select a device from list to connect to
* `F5: Disconnect`: Disconnect from current device
* `F5: Disconnect and Clear All Passwords`: Disconnect from current device and clear ALL cached passwords
* `F5: Show Device Info`: Displays json output of F5 Host information, including platform/licensing/software/macAddresses/vlans
* `F5: Add Host`: Prompts to add a new host to the configured list
* `F5: Remote Command Execute`: Prompts for command to execute on device via BASH API (account must have advanced shell enabled)
* `F5: Settings`: Opens VS Code settings window focused on F5-Fast settings (currently only device list)

* `F5-Fast: Show Info`: Displays json output of F5-Fast service info

* `F5-AS3: Post Declaration`: Post entire active editor contents as AS3 declaration to selected device (can also select/highlight text)

* `F5-DO: Inspect`: Displays json output of the DO 'inspect' endpoint
* `F5-DO: Get Current Declaration`: Displays json output of the current declaration, if there is one
* `F5-DO: Get Tasks`: Displays json output of the task history
* `F5-DO: Post Declaration`: Post entire active editor contents as DO declaration to selected device (can also select/highlight text to be sent)

* `F5-TS: Show Info`: Displays json output of TS service info
* `F5-TS: Get Current Declaration`: Displays json output of the current declaration, if there is one
* `F5-TS: Post Declaration`: Post entire active editor contents as TS declaration to selected device (can also select/highlight text to be send)


* `ChuckJoke`: When you need some inspiration...

---

# How To's

## Basic device management (add/edit/delete, connect/disconnect)

- To add a device
  - Add under the vscode extension settings
    - Press `F1`, type `f5`, select "F5: Settings", click add item button
        -- or --
  - Add device from the F5 HOSTS view
    - Click `F5: Add HOST` button in top right of the extension view for "F5 HOSTS"

- To Modify a device:
  - Modify under the vscode extension settings
    - Press `F1`, type `f5`, select "F5: Settings", click pencil icon next to item to modify
        -- or --
  - Modify device from the F5 HOSTS view
    - Click the pencil icon on the right of the host entry in the "F5 HOSTS" view

- To Delete a device:
  - Delete under the vscode extension settings
    - Press `F1`, type `f5`, select "F5: Settings", click "X" icon next to item to delete
        -- or --
  - Delete device from the F5 HOSTS view
    - 'Right-Click`, select "DELETE" from the menu that appears next to the host entry in the "F5 HOSTS" view

## Device Mgmt (add, modify, delete devices)
![Device Management](./README_docs/images/deviceMgmt_5.18.2020.gif)

---

## Connecting/Disconnecting and password caching

Connect means to select a device to work with.  When connected, commands/api calls will be executed on that device.

Passwords are cached automatically.  They can be cleared with the "F5: Disconnect and Clear ALL Passwords"

No need to disconnect when switching devices

If authentication to a device ever failes (401 response), password cache for that device will be cleared and prompt for a new one

*** passwords are cached using system encryption with KeyTar ***

- To connect to a device
  - Select the device in the 'F5 Hosts' view on the left
      -- or --
  - Press `F1`, type `f5`, select "F5: Connect to Device", select device from prompt

- To Disconnect from a device
  - Click on the <user>@<device> object in the status bar at the bottom
      -- or --
  - Press `F1`, type `f5`, select "F5: Disconnect from Device"

![Device Connecting](./README_docs/images/connectDisPassCache_5.18.2020.gif)

--- 

## AS3 Management (get/post/delete/tenants/tasks)

Once a device is connected, and the extension detects that AS3 is installed, a status bar will show up on the bottom indicating the running AS3 service verson.  

The AS3 Tenant TreeView on the left shows AS3 tenants and apps for each tenant.  Select a tenant to see all the app configuration details for that tenant.  You cannot select individual apps from the tree, they are just there for visibility

The AS3 Tasks TreeVew on the left is just to provide some visibility into the tasks/jobs that the AS3 service has run. 

To post an AS3 declaration, select the command from the palette by pressing `F1`.  You may need to search for 'as3' or 'f5'.

Select the declaration text to send or it will capture the entire editor window

To delete a tenant, right click the tenant in the AS3 Tenant TreeView on the left and select "Delete"

![AS3 Management](./README_docs/images/as3GetPostDeleteTask_5.18.2020.gif)

---

## DO Management (get/post)

If the extension detects the DO is running, a status bar will show up on the bottom showing the running service software version

Select the status bar item to see the current DO declaration 

Select the command from the palette drop down to post a declaration

![DO Mgmt](./README_docs/images/getModifyDO_5.18.2020.gif)

---

## TS Management (get/post/clear)

If the extension detects the TS is running, a status bar will show up on the bottom showing the running service software version

Select the status bar item to see the current TS declaration 

Select the command from the palette drop down to post a declaration

![DO Mgmt](./README_docs/images/getModifyTS_5.18.2020.gif)

---

## Remote Command Execute

Command to issue on the remote device.  Good for quickly getting information while building declarations!

![DO Mgmt](./README_docs/images/remoteCMD_5.18.2020.gif)



---




---

## Extension Settings

This extension contributes the following settings:

* `f5.hosts`: a list of f5 devices to connect to


## Known Issues

HTTP/422 responses - Can happen for a handful of reasons:
- Getting DO declaration when device has settings DO can configure but device was not deployed with DO (it can't manage the settings that are already there)
- Improperly formatted/wrong declaration
  - Sometimes this is from the '$schema' reference in the declaration
- Sometimes you can fix a DO HTTP/400 response by overwriting with a clean/updated declaration

You cannot select a tenant application in the tree view.  It is only for visibility.  Select the tenant for configuration



---

## installing vsix 

The plan is to publish this to the Microsoft Marketplace so it can be installed like every other extension, but for these early stages manual installation is necessary

Different ways to install vsix:
- https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix
- https://github.com/eamodio/vscode-gitlens/wiki/Installing-Prereleases-(vsix)


## Running the extension for dev

- Clone and install dependencies:
    ```bash
    git clone https://github.com/DumpySquare/vscode-f5-fast.git
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
