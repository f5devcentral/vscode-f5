


# Research

[BACK TO MAIN README](../README.md)

---
## Examples/Guides

Good guide about Typscript, making/recieving api calls, and developing Typscript apps [https://wanago.io/2019/03/18/node-js-typescript-6-sending-http-requests-understanding-multipart-form-data/]

Node.JS native https.get module [https://nodejs.org/api/https.html#https_https_get_options_callback]


## Features and workflows (revise)

* Connect to FAST service/engine (via API)
  * Manage multiple FAST services
    * select which one to work with
  * Authenticate
    * Basic Auth
    * Token Auth
  * List templates
  * Modify template
  * Upload template
  * Clone template?
  * Create template
  * Deploy template
* Highlight suggested variable placement
  * take a raw as3 declaration with no variables, just unique names like posting directly to as3, with a hot-key-combo, highlight all the typical areas that would need to be replaced with variables to make the declaration a template
* Intelligent posting:
  * utilize async functions
  * key off 202 of original post till job completes
  * Settings like job check delay 3 or 5 seconds
* Autocomplete
  * Provide suggestions for autocomplete of words
* CodeSnippets
  * Provide code snippets to complete parts of the declaration
  * start typing a class object name, it can provide the remaining brackets/commas to comlete the object, including required class definition
  * Once class definition is complete provide options for snippits/autocomplete of options only available to that class
* Provide easy links to public github repos, schemas, and documentation


## Markdown information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

---

## Visual Studio Code History

Details about VS Code, what it is, how it compares to other tools and popularity:

* [WikiPedia: Visual Studio Code](https://en.wikipedia.org/wiki/Visual_Studio_Code)
* [What is the difference between an IDE and an editor?](https://discuss.atom.io/t/what-is-the-difference-between-an-ide-and-an-editor/32629)
* [StackOverFlow: Developer Survey Results](https://insights.stackoverflow.com/survey/2019#development-environments-and-tools)

---

## Requirements

Currently utilizing built in node modules, no external dependencies yet...

### Imports:

* http/https

### Future dependency predictions:
* some sort of json/yaml linter(intellisense) (what is the difference?)
* json parser?
* authentication
  * basic
  * auth token
* timestamp/uuid generator
* CodeLens to provide inline links to do things like post highlighted json...[https://github.com/microsoft/vscode-extension-samples/tree/master/codelens-sample]

---

## Ideas!!!

### creating gifs for repo documenation
[https://gifs-as-documentation.readthedocs.io/en/latest/]

### Use extension custom data types to assist with declaration building (AS3/DO/TS/FAST):
[https://github.com/microsoft/vscode-custom-data]

Maybe even iRules/iApps...?

![one](https://github.com/microsoft/vscode-custom-data/raw/master/media/css-completion.png)

![](https://github.com/microsoft/vscode-custom-data/raw/master/samples/webcomponents/demo.gif)


### Deploy/push template from VS Code like Ansible plugin below

Again, probably something better for an AS3/DO/TS plugin.  Build, send directly to device.

[https://marketplace.visualstudio.com/items?itemName=vscoss.vscode-ansible#run-ansible-playbook]

![VS Code Ansible Plugin - Deploy playbook in...](https://github.com/VSChina/vscode-ansible/raw/master/images/menu.png)

### Use CodeLens API to provide inline editor options, like post highlighted json to device

![codelens](https://github.com/microsoft/vscode-extension-samples/raw/master/codelens-sample/demo.gif)


### Provide a sudo terminal to F5 BIGIP

This would utilize bash endpoint api
Send it a bash/tmsh command, provide the output.
Would allow for quick access to devices without having to acces ssh/gui


---

## VS Code Extension links

---

VS Code Extension examples
[https://github.com/microsoft/vscode-extension-samples]

### Extension capabilities interested in using

[Declarative Language Features](https://code.visualstudio.com/api/extension-capabilities/overview#declarative-language-features)

Declarative Language Features adds basic text editing support for a programming language such as bracket matching, auto-indentation and syntax highlighting. This is done declaratively, without writing any code. For more advanced language features, like IntelliSense or debugging, see Programmatic Language Features.

Extension Ideas

* Bundle common JavaScript snippets into an extension.
* Tell VS Code about a new programming language.
* Add or replace the grammar for a programming language.
* Extend an existing grammar with grammar injections.
* Port an existing TextMate grammar to VS Code.

VS Code Extensions getting started
[https://code.visualstudio.com/api/get-started/your-first-extension]

Contribute menus could be used to add menu options for writing declarations
[https://code.visualstudio.com/api/references/contribution-points#contributes.menus]

### Provide json object references
Example: show where as3 profile object is referenced

![VS Code Extension Reference Editor Sample](https://raw.githubusercontent.com/Microsoft/vscode-extension-samples/master/contentprovider-sample/preview.gif)
---
## Questions...

1. How are the current F5 automation tools making API calles (what module?):
    * Most popular "request" module has been depricated as of *March 2019*:
      * [https://medium.com/@wilmoore/saying-goodbye-to-request-one-of-javascripts-oldest-npm-modules-58f4405db1b7]
    * GitHub: Request - Request’s Past, Present and Future #3142
      * [https://github.com/request/request/issues/3142]
    * GitHub: request - Alternative libraries to request #3143
      * [https://github.com/request/request/issues/3143]
    * latest version of request is 2.88.1 as of Aug 2018
      * [https://github.com/request/request/releases]
    * F5 DO seems to be running request v2.88.0 as of Jan 2020
      * [https://github.com/F5Networks/f5-declarative-onboarding/blob/master/package.json]



---
## Notes:
* Markdown cheatsheet for writing this [https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet]
* Original Markdown spec? [https://daringfireball.net/projects/markdown/basics]
* VS Code Markdown Extensions [https://code.visualstudio.com/docs/languages/markdown]
* Public test api:  [https://api.chucknorris.io/jokes/random]