


# Change Log

[BACK TO MAIN README](README.md)

All notable changes to the "vscode-f5" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file

---

## [3.0.0] - (04-01-2021)

[v3.0 enhancements/refactor](https://github.com/f5devcentral/vscode-f5/milestone/6)

### Added/Modified/Removed

- [#106](https://github.com/f5devcentral/vscode-f5/issues/106) - Documented how to search Config Explorer view

- [#99](https://github.com/f5devcentral/vscode-f5/issues/99) - [RFE] ability to 'label' host entries

- [#92](https://github.com/f5devcentral/vscode-f5/issues/92) - [RFE] F5 Hosts view v2
  - Extended Hosts view details that include ATC service management and UCS/QKVIEWS

- [#87](https://github.com/f5devcentral/vscode-f5/issues/87) - [RFE] ipv6 support (**PENDING**)

- [#60](https://github.com/f5devcentral/vscode-f5/issues/60) - [RFE] view x509 certificate details
  - This enabled hovers to show details about certificates but also got expanded to show nexted details in json structures, like cert/iRules/config-objects

- [#88](https://github.com/f5devcentral/vscode-f5/issues/88) - [RFE] Examples Requests with web proxy support (**PENDING**)
  - Provides configuration options for external proxy support
  - This would be for all calls not destined for an F5

- [#118](https://github.com/f5devcentral/vscode-f5/issues/118) - [RFE] corkscrew v0.8.0 updates
  - cert/key extraction (different depending on mini_ucs/ucs/qkview)
  - stats extraction from qkview
  - asyncrounous extraction

- [#109](https://github.com/f5devcentral/vscode-f5/issues/109) - [BUG] Fail to explore config on connected BIG-IP
  - The new f5-conx-core fixed a bug that failed to download the mini_ucs if it was over a certain size

- [#110](https://github.com/f5devcentral/vscode-f5/issues/110) - [RFE] Sort alphabetically Sources files in config explorer enhancement
  - Fixed a bug that was causing an error when as3 was installed but had no tenants to display

- [#117](https://github.com/f5devcentral/vscode-f5/issues/117) - [BUG] "Cannot convert undefined or null to object" with as3 (no tenants)

- [#111](https://github.com/f5devcentral/vscode-f5/issues/111) - [RFE] enable post fast template command in editor
  - Feature actually got removed to provide a clear path to template sets

---

## [2.10.7] - (02-09-2021)

### Modified

- re-apply latest corkscrew update
  - data-group from irule extraction was missing
- documentation updates
  - AS3->FAST YAML
- change extension version command enhancements

---

## [2.10.6] - (02-02-2021)

### Added

- as3 to fast yaml conversion command
  - takes an as3 declaration and converts it to a FAST YAML template
  - detects ADC vs AS3 declaration parent level
  - includes the first step of changing the tenant definition to a template parameter
- command to list and download other extension versions on github

### Modified

- fixed cfgExplore/App sorting
- corkscrew v0.8
  - will now error on application parsing, but continue with next application
    - error does not stop entire process
  - converts \r\n line returns to \n
  - loosened file checking for parent tmos objects
  - Added data-group extraction from irules
- fixed app component counts in as3 view

### Removed

- removed log that indicated seed file was not found on extension load
  - this seemed to cause unnecessary confusion
  
---

## [2.10.5] - (02-02-2021)

### Modified

- fixed single target render problem (again)

---

## [2.10.4] - (02-02-2021)

### Modified

- AS3 view enhanced to show targets/tenants/apps/app-components
  - including app component counts
  - hover/tooltip includes tenant/app/app-component information when possible
- AS3 targets/tenants/apps are now alphabetically ordered
- Config Explorer apps are now alphabetically ordered
- Get all tenants declarations for a target

---

## [2.10.3] - (01-27-2021)

### Added

- command to select and download github releases of the extension to allow users easy access to future beta versions
  - Like RPM mgmt, it will query github for all the releases (including betas) and provide a list for the user to select the desired version.  It will then attempt to install the version.  Success on the install command is very subjective, but at least it will provide the user with the path to the file so it can be installed through the UI

### Modified

- fixed cfgExploreRawCorkscrew command input path bug

---

## [2.10.2] - (01-25-2021)

### Modified

- updated f5-corkscrew to v0.7.0
  - fixed a bug where extracted irules were missing a closing bracket
  - fixed a bug that was causing application extractions to fail
    - removed logic that attempted to discover pools reference via variables in irules
  - improved speed by removing some unecessary JSON.stringify/parsing
  - converted most functions to async
    - this allows errors to bubble up from deep within the code
  - added extractApp events
    - This was feed back into the OUTPUT for better understanding where processing is and possibly where it failed

---

## [2.10.1] - (01-20-2021)

### Modified

- fixed problem where single bigiq as3 target did not track target details and looked like local as3 declaration
  - this included adding an object description noting it's target

---

## [2.10.0] - (01-19-2021)

### Modified

- corkscrew updates
  - corkscrew returns source config files in explosion output to more easily import into extension view
- Config Explorer
  - Clearing config explorer no longer makes it inoperable
  - Config explorer view is now always visible and has welcome options for accesing documentation and importing local files
  - Now supports browsing and importing files through local file system
- fixed a bug where TS command enablement was tied to DO installed
- bigiq/as3 integration
  - displays targets/tenants appropriately
  - get/modify/repost declaration for target tenant
- Updated docs:
  - Added "Edit in Github" and modified date header to each page
  - fixed changelog reference

---

## [2.9.0] - (11-12-2020)

** toying with the idea of completeing the f5-conx-core rewrite and re-integrate all changes with all enhancements
- full qkview/ucs create/download/delete


### Added
- iHealth view
  - collect/save creds
  - list/upload/download
  - 

- setup full 'cache' directory
  - this would be the catch-all for everything
  - possibly add functions to open folder as workspace or even clearing cache

- extraction and collection of connection timing stats
  - would like to provide some analytics or flame charts with them
  - alert user if timing for a particular device/call slows down so much over a given timeframe


- extended device view details
  - icon for bigip vs bigip vs nginx?
  - adding hostname/tmos version to hover?
    - cache details in configuration device details, to be refreshed at every connect
  - When connected, the connected device in the device view, gains the ability to expand menus for managing things like:
    - UCS create/download/delete (includes mini_ucs)
    - QKVIEW create/download/delete
    - ATC module list
      - versions list for each modules
      - install/un-install

### Modified
- rebase with new f5-conx-core
  - extracts connectivity functions for use in other projects
    - and external testing
- config explorer update (wasn't processing some ucs/qkviews)
- Clearing Config Explorer breaks it
- single tenant from bigiq as3 target
- Updated docs:
  - Added "Edit in Github" and modified date header to each page
  - fixed changelog reference

---

## [2.8.2] - (11-05-2020)

### Added

- Refresh command for Config Explerer view

### Modified

- Major documentation updates for new doc site and features
- Tweaked some error handling for exiting mid device mgmt workflows
- Updated Documentation view with latest changes

---

## [2.8.1] - (11-02-2020)

### Modified

- Fixed where clearing of password was not happening in all scenarios
- Fixed fast template uploading from non-windows based file systems
- Fixed config explore tree refresh when new config is 'explored'

---

## [2.8.0] - (10-30-2020)

### Added

- function to attempt to remove old extension if detected
  - the functions/settings it provides will conflict with new/reBranded extension
- Finished function to inject/remove schema reference from declaration
  - Accessable via right-click in editor
  - if a schema reference is present, it will remove it
  - if no schema is present, it will attempt to discover the declaration type (as3/do/ts) and inject the appropriate schema reference
  - If the declaration is not a valid json object or it is not able to figure out what kind of ATC declaration it is, then it will prompt a given selection to inject anyway
  - <https://f5devcentral.github.io/vscode-f5/#/schema_validation?id=injectremove-schema-reference-command>

---

## [2.7.0] - (10-21-2020)

### Added

- Device import function
  - Detect seed file, prompt for import at startup
    - `Yes` to just import, or `Yes-Consume` will delete the file after contents have been read (devices imported)
  - Command to import seed/device details
  - Seed file supports object with properties or array or string (see documentation)

### Modified

- Changed TCL visibility setting to default on
  - way past the initial beta of this feature set and haven't seen any bugs since
- Updated config device regex to match the device add function
- Opened editor actions to allow declaration post without highligh (FAST/AS3/DO/TS)
  - When no highlighted text to capture, it will capture the entire editor text
- Updated corkscrew integration (v0.4.0) including:
  - latest corkscrew ouput
  - More view device details
  - Object counts for many view items
- Delete mini_ucs after mini_ucs is collected and exploded by corkscrew
- Updated logging OUTPUT to be visible when launching
- Fixed f5 terminal creation from happening every connect and taking focus
  - This should only happen if configuration for the feature is present

---

## [2.6.0] - (10-21-2020)

### Modified

- Updated corkscrew to new project name (f5-corkscrew) and version 0.3.0 which includes support for extracting pool configs when reference by a local traffic policy

---

## [2.5.1] - (10-7-2020)

### Modified

- TMOS Config Explorer
  - Updates for corkscrew v2
    - Includes faster processing, mini_ucs fetch of connected device, Base config (vlans/Selfs), all partitions configs
    - Add right click to process local ucs/qkview
  - Added "Clear" button to clear config explorer results and remove from view.  

---

## [2.5.0] - (10-5-2020)

### Added

- TMOS config explorer functionality (beta)
  - Currently parses bigip.conf for individual applications and supporting configuration
  - Supports most common configuration items refeneced by virtual server, ie: pool, monitors, nodes, primary/fallback persistense, local traffic policies, snat pools, irules, and profiles (http, tcp, udp, client/server-ssl, ... everything referenced under the "profiles" section of the virtual server)
  - tested to be working on v14/v15
  - Can get bigip.conf from connected device or parse a local file
  - Includes different structures for viewing the tmos config
  - Includes a parsing log for feedback on the extraction process

---

## [2.4.0] - (9-30-2020)

### Modified

- FAST Template Render HTML preview
  - now respects tab settings like other windows
  - Re-renders appropriately when sending new content (like changing template params)
    - this required a complete rework of the class object
  - Re-scoped fast templates to yaml files only (it's really just the best way to go)
  - added right click options in explorer view to render template html preview
  - added right click option in editor view to render template html preview
  - added right click option in Fast view for connected device
  - added `Submit` button to bottom of html preview which produces a rendered template output in new json editor

- onConnect/onDisconnect terminal settings
  - updated to only execute if settings are actaully present to be executed
  - added logic to track created terminals, use existing terminals (created by extension), and dispose terminals onDisconnect

---

## [2.3.0] - (9-8-2020)

### Added

- OUTPUT Logging
  - Moved most console.log() information to the OUTPUT window at the bottom of the editor
  - Channnel name is `f5-fast`
  - Also reduced the amount of details for things like HTTP calls since much of that stuff can be seen with the expanded details of the editor details
- Clear password for single device
- onConnect/onDisconnect terminal command execution
  - This provides the flexibility to have commands executed in the terminal at device connect/disconnect
  - Examples shows terminal connecting to ssh and tailing ltm logs
    - then disconnecting ssh when extension disconnects

### Modified

- Editor tab mgmt/re-use
  - This includes displaying json and HTTP responses with json
  - Tabs are now managed and re-used as configured
  - Removed webviews and supporting packages
  - Added the following settings:
    - `Http Response Details` provides http request/response header information (if any)
      - `exchange` returns entire HTTP exchange including both request/response headers + body
      - `full` returns response headers + body
      - `body` returns response body only
    - `New Editor Column` defines what column a new editor should be opened
      - `current` use column of current active editor (focused)
      - `beside` open editor in column beside currently active editor
    - `New Editor Tab For All` provides a way for users to get a new tab for every response (how it originally worked)
    - `Preserve Editor Focus` provides a way to keep the new editor tab from taking focus
- Updated axios agent to only return necessary information
  - this also allowing for standardizing how responses are used across the entire extension
- Updated Device delete function to clear keytar password
- Fix for BIG-IQ AS3 declaration list
  - Regular as3 returns an object for the device, AS3 with multi-device tenants (bigiq) returns a list of objects, one for each devcie declaration it has
- Fix for tcl class view to refresh information accordingly when changing devices
- Added more documentation links to Examples view
  - Vscode-f5-fast repo link to provide a quick way to access documentation, examples, and issues
  - Fasting repo link to provide a quick way to clone repo for demo's
  - AS3 User Guide link to provide a quick way to get users to ALL AS3 documentation
    - This seemed better than providing a link for each of the necessary subsections
  - Updated comment tags when hovering over each item
  - Provided links to repos online for DO/TS at the parent level

---

## [2.2.0] - (8-21-2020)

### Added

- tcl/iRule/iApp functionality
  - create/modify/delete irules
  - upload/import/create/modify/delete iApp templates
    - Also shows deployed iApp-Apps
      - included options for redeploying iApp-App with current paramters and deleting an iApp-App
  - `Merge TCL/TMOS` can be used to merge ANY TMOS config item

Documentation: <https://github.com/f5devcentral/vscode-f5/blob/master/README_docs/tcl.md>

### Modified

- extension now has dynamic config-settings changes, meaning, when an extension setting is changed, it is applied to extension without reload of workspace

---

## [2.1.0] - (8-5-2020)

### Added

- Make HTTP/S Requests function provides the necessary flexbility to make any API call to ANYthing (mostly...)
  - Highlight text, right-click, select: `Make HTTPS Request`
  - support raw URL, json and yaml structures
  - Added the ability to make any api call to connected f5 (will utilized other known device details like: host/port/user/password/token/headers)
  - Also accepts enough parameters to craft an external API for any destination
  - Includes connection status pop up and error handling like other api calls in the extension
  - Documented usage and examples:
    - [Crafting raw API calls](./README_docs/rawApiCalls.md)

### Modified

- Added nodejs nock for api tests
- Started refactoring device mgmt functions for automated testing
  - Device Add/Remove
  - allowing entry/command functions to take parameters that would normally be collected from the user by some sort of input, like a click or input/select box

---

## [2.0.1] - (7-28-2020)

### Added

- Function to migration legacy devices config to new devices config

---

## [2.0.0] - (7-28-2020)

### Added

- ATC rpm install/un-install/upgrade
  - will download and cache rpm from official github repo
  - cache is located in %USERPROFILE%\.vscode\extensions\%extensionInstall%\atc_ilx_rpm_cache
  - Also right click rpm in folder to install
- json <-> yaml conversion (highlight -> right-click)
- base64 encode/decode (highlight -> right-click)
- right-click template/folder in explorer view to upload FAST template/template Set
- Added 'F5-FAST -> Connect!' status bar to provide another way to connect
  - This is especially useful when working in a repo, which is outside the main F5-Fast extension view
- Added options for posting AS3/DO/TS declarations (highlight declaration in editor -> right-click)
- support for remote authentication via logonProvider
  - Updated config structure (what stores devices details)
  - Includes right-click option on device to update logonProvider
    - This provides a list of default options for BIGIP and an option to provide a custom provider for BIGIQ
    - Also added function to show configured logon provider (right-click device in list)

### Modified

- Combined AS3 Tenant and Tasks views
  - This should provider a cleaner and more efficient interface
  - Now showing number of configured tenants and tasks
- Updated FAST view
  - Now includes item counts
  - This also resulted in more efficient data storage and retrieval
- Provided feedback and cancellation when connecting to devices
  - including better feedback of auth errors and network timeout/errors
- Updated examples to include DO github examples
  - Added placeholder for AS3 and linked to AS3 repo issue with pending "examples" folder
- Auth token now utilized for entire token lifetime
  - Drastically cut down on network traffic constantly refreshing token for major different functions throughout extension
  - Added configuration option to show token life countdown in status bar (disabled by default)
  - If token does expire, next http call will refresh it as needed

Created a git repo for documenting the building of fast templates and a bunch of other things for demo'ing the extension

> <https://github.com/DumpySquare/f5-fasting>

---

## [1.0.1-2] - (6-23-2020)

### Changed

- Documentation tweaks

---

## [1.0.0] - (6-23-2020)

INITIAL FULL RELEASE!!!

Should cover most prominent F5 (A)utomated (T)ool(C)hain workflows (FAST/AS3/DO/TS)

- Host/F5/Device mgmt including add/modify/delete
  - service discovery for installed ATC services
  - password caching
  - execute bash/tmsh command on device
- FAST functionality and visibility
  - single template upload
  - template set upload
  - deploy fast app
  - fast tree view
    - view/delete deployed apps
    - view tasks
    - view/delete template
    - view/delete template set
  - fast snippet of example template
- AS3 visibility with app deploy, inspect/delete
- DO view/modify/post device declartion
- code snippets to provide basic as3/do/ts examples
- automatic schema validation with (*.as3.json/*.do.json/*.ts.json) files
- example DO/TS declarations straight from official F5 github repos
  - DO
  - AS3 - PENDING AS3 examples release

---

## [0.1.11] - (6-4-2020)

- Fixed the following

  ```text
  CVE-2020-7598
  moderate severity
  Vulnerable versions: < 0.2.1
  Patched version: 0.2.1
  minimist before 1.2.2 could be tricked into adding or modifying properties of Object.prototype using a "constructor" or "proto" payload.
  ```

---

## [0.1.10] - (6-4-2020)

### Added

- Populated fast view on left
  - list deployed fast apps
    - click to view individual app configurations and deployment constants
    - right click to delete app in tenant
  - list fast tasks (only last 5)
    - click to see task details
  - list fast templates
    - click to see full template details
  - list fast template sets
    - click to see templates in each template set

- FAST: "Deploy FAST App" command
  - takes in json object of template parameters
- FAST: "Convert json as3 to mst for templating" command
  - used to take as3 json and change it to .mst file for templating
- FAST: "Render HTML View" command
  - takes selected template view yml and presents rendered HTML view the user will see

---

## [0.1.9] - (5-31-2020)

### Added

- Added warning when posting syncronous DO dec that async is highly recommended
- Defined file types for the different ATC services (as3/do/ts) to provide auto schema validation
  - This happend with files from a defined workspace, like opening a folder
  - *.as3.json - will auto reference the latest online as3 schema
  - *.do.json - will auto reference the latest online do schema
  - *.ts.json - will auto reference the latest online ts schema

- Added following right click on as3 tenant options
  - <https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/refguide/as3-api.html>
  - show=full
  - show=expanded
  
- Setup progress bar for issueBase, getTSDec, postTSDec, getDoDec, doInspect, doTasks, deleteAS3Tenant, getAS3Task

- Created webview output for re-usable window
  - *in developement* - enable in settings under, 'previewResponseInUntitledDocument'
  - The webview is easily re-usable, to keep opening a new tab for every call, but they don't allow the user to modify and repost like the regular json output

- Settings key for seconds between async Task status updates
  - f5.asyncInterval - default = 5 (seconds)

- Cleaned up .vsix package by removing unnecessary documentation and images

- Added warning when posting syncronous DO declaration, that recommends "async" posting

---

## [0.1.8] - (5-25-2020)

### Modified

- Now allowing all http responses so it would show more information about failing declarations
  - Was only allowing 200/201/202/404/422
  - This was to allow for more robust error handling for async post operations
- Updated password prompt to provide more clarity of what is expected
- Refined conditions that clear cached passwords
  - [issue #19]<https://github.com/f5devcentral/vscode-f5/issues/19>

### Added

- Auto-refresh AS3 trees after tenant delete or declaration post
  - includes a slight pause to let processing complete before refresh
- AS3 async post
  - Settings boolean enabled by default, to default all as3 posts to async
  - Provides "progress bar" with details about dec post status
- DO async post

---

## [0.1.7] - (5-20-2020)

### Modified

- More work to allow port specification on device item: user@device.domain.net:8443
- Added more feedback (warning pop up) for failed api calls
- Documentation on client side logging and BIG-IQ usage

---

## [0.1.6] - (5-19-2020)

### Modified

- Device add/modify
  - Relaxed regex to allow :port for single nic ve
  - [issue #5] <https://github.com/f5devcentral/vscode-f5/issues/5>

---

## [0.1.5] - (5-18-2020)

### Added

- AS3 Delete Tenant command - Right click tenant item in tree
- auto refresh AS3 trees when AS3 service detected
- Documentation in README, including demo gifs of workflows

---

## [0.1.4] - (5-15-2020)

### Added

- AS3 tenants tree
  - two level tree hiarchy representing deployed tenant and apps for each tenant
  - click to get 'Get-All-Tenants' to get ALL declarations
  - click tenant to get declaration for that tenant

---

## [0.1.3] - (5-13-2020)

### Added

- Tree view to display TS examples from github
- get/post Delcaratinve Onboarding (DO) declarations
- base example snippets for as3/do/ts
  - in a json file, start typing (as3, do, ts, example, f5)
- hostname/tmos version status bar
  - click to get device info
- Fast/version status bar
- AS3 Tasks view

---

## [0.1.2] - (5-10-2020)

### Added

- AS3/DO/TS service checking - display in tool bar with version if installed
- GET/POST TS declaration
- Execute BASH command on device

---

## [0.1.1] - (5-8-2020)

### Added

- password caching with keytar

## [0.1.0] - (5-7-2020)

### Added

- load sample as3 declaration
- post as3 declaration to connected F5

---

## [0.0.4] - (5-4-2020)

### Added

- Device Tree features
  - Modify entry
  - Remove entry
  - Add entry

---

## [0.0.3] - (4-26-2020)

### Added

- BIG-IP authentication via auth token
- Device tree refresh button

---

## [0.0.2] - (4-26-2020)

### Added

- Tree View container with F5 icon
  - list configured devices from config file
  - testing with carTreeView and depenencyTreeView
- Status bar information about connected device

---

## [0.0.1] - (4-24-2020)

- Initial release!
  - Make api to get Chuck Norris joke, display in new editor window for testing, learning and laughs...
  - Started extension settings to host devices
  - Command skeleton for next call to be coded
