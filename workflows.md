# Workflows

## Connectivity Mgmt

List of BIGIP targets like VS Code Remote SSH plugin
* Select device
  * Manage connection credentials
  * VS Code will connect over api
  * Return device details:
    * F5 ADC or F5 BIGIQ or Container?
    * Platform information:
      * Software Version
      * CPU/Mem
      * Installed ILX plugins
        * plugin versions

![VS Code Remote SSH target list](https://code.visualstudio.com/assets/docs/remote/ssh/ssh-explorer-open-folder.png)

---

## Get FAST details

* version
* templates
* deployed templates?

---

## Update template

Select template from left file tree, it would display json template in editor.
Edit template
On save, post updated template back to FAST

---

## Clone template

Right click existing template in left pane list (like a file), provide name for new template.
Once saved, would post new template to FAST
Can be updated/changed using update/modify flow

---

This VS Code Source-Control-Sample shows another way to list F5 devices and select which one to work with
    [https://github.com/microsoft/vscode-extension-samples/tree/master/source-control-sample]

![Multiple workspace folder support](https://github.com/microsoft/vscode-extension-samples/raw/master/source-control-sample/resources/images/multi-workspace-folder.gif)


---
## Post/Response

Like the VS Code rest client extension, the response can be opened in a new window like below

> this could be expanded to key off HTTP/202 to keep GETing the job ID till it's done

![rest-client example post](https://raw.githubusercontent.com/Huachao/vscode-restclient/master/images/usage.gif)