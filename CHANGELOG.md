# Change Log

[BACK TO MAIN README](README.md)

All notable changes to the "vscode-f5-fast" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.


## [1.0.0] - (6-5-2020) - pending

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
- AS3 visibility with app deploy,inspect/delete
- DO view/modify/post device declartion
- code snippets to provide basic as3/do/ts examples
- automatic schema validation with (*.as3.json/*.do.json/*.ts.json) files
- example DO/TS declarations straight from official F5 github repos
  - DO - Pending
  - AS3 - PENDING


## [0.1.11] - (6-4-2020)

- Fixed the following 
```
CVE-2020-7598
moderate severity
Vulnerable versions: < 0.2.1
Patched version: 0.2.1
minimist before 1.2.2 could be tricked into adding or modifying properties of Object.prototype using a "constructor" or "proto" payload.
```

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


## [0.1.9] - (5-31-2020)

### Added
- Added warning when posting syncronous DO dec that async is highly recommended
- Defined file types for the different ATC services (as3/do/ts) to provide auto schema validation
  - This happend with files from a defined workspace, like opening a folder
  - *.as3.json - will auto reference the latest online as3 schema
  - *.do.json - will auto reference the latest online do schema
  - *.ts.json - will auto reference the latest online ts schema

- Added following right click on as3 tenant options
  - https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/refguide/as3-api.html
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

## [0.1.8] - (5-25-2020)

### Modified
- Now allowing all http responses so it would show more information about failing declarations
  - Was only allowing 200/201/202/404/422
  - This was to allow for more robust error handling for async post operations
- Updated password prompt to provide more clarity of what is expected
- Refined conditions that clear cached passwords
  - [issue #19]https://github.com/DumpySquare/vscode-f5-fast/issues/19

### Added
- Auto-refresh AS3 trees after tenant delete or declaration post
  - includes a slight pause to let processing complete before refresh
- AS3 async post
  - Settings boolean enabled by default, to default all as3 posts to async
  - Provides "progress bar" with details about dec post status
- DO async post

## [0.1.7] - (5-20-2020)

### Modified
- More work to allow port specification on device item: user@device.domain.net:8443
- Added more feedback (warning pop up) for failed api calls
- Documentation on client side logging and BIG-IQ usage

## [0.1.6] - (5-19-2020)

### Modified
- Device add/modify
  - Relaxed regex to allow :port for single nic ve
  - [issue #5] https://github.com/DumpySquare/vscode-f5-fast/issues/5

## [0.1.5] - (5-18-2020)

### Added
- AS3 Delete Tenant command - Right click tenant item in tree
- auto refresh AS3 trees when AS3 service detected
- Documentation in README, including demo gifs of workflows

## [0.1.4] - (5-15-2020)

### Added
- AS3 tenants tree
  - two level tree hiarchy representing deployed tenant and apps for each tenant
  - click to get 'Get-All-Tenants' to get ALL declarations
  - click tenant to get declaration for that tenant

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

## [0.1.2] - (5-10-2020)

### Added
- AS3/DO/TS service checking - display in tool bar with version if installed
- GET/POST TS declaration
- Execute BASH command on device

## [0.1.1] - (5-8-2020)

### Added
- password caching with keytar

## [0.1.0] - (5-7-2020)

### Added
- load sample as3 declaration
- post as3 declaration to connected F5


## [0.0.4] - (5-4-2020)

### Added
- Device Tree features
  - Modify entry
  - Remove entry
  - Add entry

## [0.0.3] - (4-26-2020)

### Added
- BIG-IP authentication via auth token
- Device tree refresh button

## [0.0.2] - (4-26-2020)

### Added
- Tree View container with F5 icon
    - list configured devices from config file
    - testing with carTreeView and depenencyTreeView
- Status bar information about connected device

## [0.0.1] - (4-24-2020)

- Initial release!
    - Make api to get Chuck Norris joke, display in new editor window for testing, learning and laughs...
    - Started extension settings to host devices
    - Command skeleton for next call to be coded