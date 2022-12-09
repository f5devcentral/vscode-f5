# documenting local schema reference veriables in vscode json editor

This whole process is part of an effort to figure out how to get vscode schema validation working with json bodies destined for an api endpoint with a swagger/OpenApi spec

The key point about OpenApi schema, is that we can have many different endpoints with many different schemas.  So, the typical schema mapping provided by vscode doesn't scale.  But I can programmatically provide the schema/reference depending on how the user got the json.

Also, as noted in this issue, there is no programmatic way to provide the schema and/or reference

Seems someone has already opened an issue for this feature (it was pretty much rejected)
[json] $schema: support predefined variables like ${workspaceFolder} #166438
<https://github.com/microsoft/vscode/issues/166438>

OpenApi schema validation #162
<https://github.com/microsoft/vscode-json-languageservice/issues/162>

## package.json contributes

<https://code.visualstudio.com/api/references/contribution-points#contributes.jsonValidation>

## current understanding of behavior

Currently the "$schema" value in a vscode editor/textDocument with the language set to json, is used to provide schema validation of the json object.

This schema reference in the json body can be a local file or an HTTP destination that will be fetched

## Behavior change or feature request

Requesting the support of variables in the "$schema" reference value, preferrably the vscode variables for debugging and task json files, so something similar.

The intent is to reference many different schema files bundled with an extension.

### extension schema references?

What about the current ability to reference a schema provided by the extension "contributes" package.json

It is my understanding that this is a static reference of a single schema to many file types

### local project schema reference

The following example shows local workspace reference, meaning the device_schema.json file is in the same directory as the current open project/workspace

```json
{
    "$schema": "./device_schema.json",
    "address": "10.1.1.7",
    "port": "5443",
    "device_user": "admin",
    "device_password": "whos-clues",
    "management_user": "admin-cm",
    "management_password": "blues-clues",
    "something": "new"
}
```

## Other parts of the local file system

The following shows how absolute directory traversal is possible

```json
{
    "$schema": "/home/ted/projects/vscode-f5/schemas/nextCm/DeviceDiscoveryRequest.json",
    "address": "10.1.1.7",
    "port": "5443",
    "device_user": "admin",
    "device_password": "whos-clues",
    "management_user": "admin-cm",
    "management_password": "blues-clues",
    "something": "new"
}
```

## linux local user home system variable

Attempting to use a linux current user dir var is unsuccessful

```json
{
    "$schema": "$HOME/projects/vscode-f5/schemas/nextCm/DeviceDiscoveryRequest.json",
    "address": "10.1.1.7",
    "port": "5443",
    "device_user": "admin",
    "device_password": "whos-clues",
    "management_user": "admin-cm",
    "management_password": "blues-clues",
    "something": "new"
}
```

### error

```text
Unable to load schema from '/home/ted/projects/f5-fasting/NEXT/$HOME/projects/vscode-f5/schemas/nextCm/DeviceDiscoveryRequest.json': ENOENT: no such file or directory, open '/home/ted/projects/f5-fasting/NEXT/$HOME/projects/vscode-f5/schemas/nextCm/DeviceDiscoveryRequest.json'.(768)
```

## vscode exec path

Attempting to use built in vscode variables is unsuccessful (${execPath})

<https://code.visualstudio.com/docs/editor/variables-reference>

### execPath

```json
{
    "$schema": "${execPath}/projects/vscode-f5/schemas/nextCm/DeviceDiscoveryRequest.json",
    "address": "10.1.1.7",
    "port": "5443",
    "device_user": "admin",
    "device_password": "whos-clues",
    "management_user": "admin-cm",
    "management_password": "blues-clues",
    "something": "new"
}
```

```text
Unable to load schema from '/home/ted/projects/f5-fasting/NEXT/${execPath}/projects/vscode-f5/schemas/nextCm/DeviceDiscoveryRequest.json': ENOENT: no such file or directory, open '/home/ted/projects/f5-fasting/NEXT/${execPath}/projects/vscode-f5/schemas/nextCm/DeviceDiscoveryRequest.json'.(768)
```

### userHome

```json
{
    "$schema": "${userHome}/projects/vscode-f5/schemas/nextCm/DeviceDiscoveryRequest.json",
    "address": "10.1.1.7",
    "port": "5443",
    "device_user": "admin",
    "device_password": "whos-clues",
    "management_user": "admin-cm",
    "management_password": "blues-clues",
    "something": "new"
}
```

```text
Unable to load schema from '/home/ted/projects/f5-fasting/NEXT/${userHome}/projects/vscode-f5/schemas/nextCm/DeviceDiscoveryRequest.json': ENOENT: no such file or directory, open '/home/ted/projects/f5-fasting/NEXT/${userHome}/projects/vscode-f5/schemas/nextCm/DeviceDiscoveryRequest.json'.(768)
```

## double bracket on vscode variable

double bracket vscode variables do not work

```json
{
    "$schema": "${{userHome}}/projects/vscode-f5/schemas/nextCm/DeviceDiscoveryRequest.json",
    "address": "10.1.1.7",
    "port": "5443",
    "device_user": "admin",
    "device_password": "whos-clues",
    "management_user": "admin-cm",
    "management_password": "blues-clues",
    "something": "new"
}
```

```text
Unable to load schema from '/home/ted/projects/f5-fasting/NEXT/${{userHome}}/projects/vscode-f5/schemas/nextCm/DeviceDiscoveryRequest.json': ENOENT: no such file or directory, open '/home/ted/projects/f5-fasting/NEXT/${{userHome}}/projects/vscode-f5/schemas/nextCm/DeviceDiscoveryRequest.json'.(768)
```