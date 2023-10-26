

# Importing devices

There are functions to automatically import devices into the list or import devices by right clicking on data in an editor.  Both methods support the same data structure defined below.

## Auto import using seed file

For automated deployments (mainly for coder), place a seed file named `.vscode-f5.json` in the base install directory of the vscode extension directoy, typically under 

- `local windows location` - C:\Users\SomeUser\.vscode\extensions\devcentral.vscode-f5-v3.0.0
- `linux over remote-ssh extension` - /home/SomeUser/.vscode-server/extensions/devcentral.vscode-f5-v3.0.0/

When the extension launches and finishes loading, it should detect the seed file and prompt to install.  See import formats below for more details on input types.

- `Yes` will import the devices and details found in the seed file
- `Yes-Consume` will import like above but then delete the file so passwords at not left behind
- `No` or `closing the window`, will just cancel the operation (like saying no)

## Import from right click in an editor

The following formats are also supported by right-click in an editor (highlight text), then `Import Devices`

### Don't see anything happending?

Check the `f5` log OUTPUT for more details on what might be missing

### simple string import

```yaml
admin@1.1.1.1
```

### json array import structure (list)

```json
[
    "admin@1.1.1.1",
    "user2@2.2.2.2:8443",
    "user3@testf5.com"
]
```

### single json object import structure

```json
{
    "device": "dude@2.1.3.4",
    "password": "coolness",
    "provider": "tmos"
}
```

### json object list import structure

```json
[
    {
        "device": "admin@2.168.1.1:8443"
    },
    {
        "device": "admin@2.168.6.5",
        "password": "giraffie"
    },
    {
        "device": "dude@2.1.3.4",
        "password": "coolness",
        "provider": "tmos"
    }
]
```
