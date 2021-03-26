
# proxy configuration objects

this is just a placeholder for configuration/documentation for the external HTTP proxy support

issue details can be found here:

- [#88](https://github.com/f5devcentral/vscode-f5/issues/88) - [RFE] Examples Requests with web proxy support (**PENDING**)
  - Provides configuration options for external proxy support
  - This would be for all calls not destined for an F5


proxy "configuration" section for the package.json

```json
"f5.proxy": {
    "type": "object",
    "description": "external HTTP(s) proxy details",
    "port": {
        "type": "number"
    },
    "host": {
        "type": "string"
    },
    "required": [ 
        "host",
        "port"
    ],
    "examples": [
        {
            "protocol": "https",
            "host": "127.0.0.1",
            "port": 9000,
            "auth": {
                "username": "mikeymike",
                "password": "rapunz3l"
            }
        }
    ]
},
"f5.proxyAuth": {
    "type": "object",
    "username": {
        "type": "string"
    },
    "password": {
        "type": "string"
    }
}
```


extensionVariables.ts

```ts

    // in the loadSettings function
    
    // ext.settings.proxy = workspace.getConfiguration().get('f5.proxy');
    const proxyCfg = workspace.getConfiguration('f5.proxy');
    const proxyAuthCfg = workspace.getConfiguration('f5.proxyAuth');

    if (proxyCfg) {       

        ext.settings.proxy = {
            host: proxyCfg.get('host'),
            port: proxyCfg.get('port'),
            protocol: proxyCfg.get('protocol'),
        };

        if (proxyAuthCfg.has('username') && proxyAuthCfg.has('password')) {
            ext.settings.proxy.auth = {
                username: proxyAuthCfg.get('username'),
                password: proxyAuthCfg.get('password')
            };
        }
        const y = 'x';
    }
```
