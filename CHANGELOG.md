# Change Log

[BACK TO MAIN README](README.md)

All notable changes to the "vscode-f5-fast" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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