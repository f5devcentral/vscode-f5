
# Make HTTP/S Request documentation and examples

This function provides the necessary flexbility to make any API call to ANYthing

Highlight text, right-click, select: `Make HTTPS Request`



## Calls without "http" in url
This assumes the request is intented for the currently connected device, of which host details are already known.

K13225405: Common iControl REST API command examples
- https://support.f5.com/csp/article/K13225405

How to use postman api for external tests like post
- https://docs.postman-echo.com/?version=latest


https://www.npmjs.com/package/axios

### simple url as string
```url
/mgmt/tm/sys/clock
```

### simple url in yaml format
```yaml
url: /mgmt/tm/sys/clock
```

### simple url in json format
```json
{
  "url": "/mgmt/tm/sys/clock"
}
```

### list vlans
```yaml
/mgmt/tm/net/vlan/
```

### list nodes
```yaml
/mgmt/tm/ltm/node
```



### url post in yaml
```yaml
url: /mgmt/shared/authn/login
method: POST
body:
    username: user1
    password: dobgispet
```

### url post in yaml
```yaml
url: /mgmt/tm/sys/config
method: POST
body:
    command: save
```

### list sys options
```yaml
/mgmt/tm/sys/
```

### list sys ucs
```
/mgmt/tm/sys/ucs/
```

### url post in json
```json
{
    "url": "/mgmt/shared/authn/login",
    "method": "POST",
    "body": {
        "username": "todai",
        "password": "dobgispet"
    }
}
```

### tmsh save sys config (all partitions)
> <POST> /mgmt/tm/sys/config  -d '{"command":"save","partition":"all"}'

```yaml
url: /mgmt/tm/sys/config
method: POST
body:
  command: save
```

---

## Calls for outside f5

The command will detect if the url has "http", if found, it considers it a fully qualified request destined for something outside of a device defined within the extension

This is based off of NodeJS AXIOS request
https://www.npmjs.com/package/axios#request-config

Default HTTP method = GET

data, or body, must also include 'POST' HTTP method

### Simple get
```
https://api.chucknorris.io/jokes/random
```

### simple get in yaml
```yaml
url: https://api.chucknorris.io/jokes/random
```

### simple get in yaml - shows broken destination
```yaml
url: https://broken.extra.io/whah
```

### simple POST in yaml
```yaml
url: 'https://postman-echo.com/post'
method: POST
data:
  hi: yo
```

### simple POST in json
```json
{
    "url": "https://postman-echo.com/post",
    "method": "POST",
    "data": {
        "hi": "yo"
    }
}
```


### raw get to external F5 using basic auth - DEV
```json
{
  "url": "https://192.168.200.131/mgmt/tm/sys/ntp",
  "auth": {
      "username": "admin",
      "password": "yayPassword!",
      "sendImmediately": "true"
  }
}
```



### raw get to external F5 using basic auth - DEV
```json
{
  "url": "https://192.168.200.131/mgmt/tm/sys/ntp",
  "data": {
      "username": "admin",
      "password": "yayPassword!",
      "sendImmediately": "true"
  }
}
```


### get f5 auth token
```json
{
  "url": "https://10.200.244.110:8443/mgmt/shared/authn/login",
  "method": "POST",
  "data": {
    "username":"admin",
    "password":"passss!"
  }
}
```


### get f5 auth token
```yaml
url: 'https://10.200.244.110:8443/mgmt/tm/auth/source'
headers:
    Content-Type: application/json
    X-F5-Auth-Token: ZM2MKZCDJ5FSDIPDVAVQIW7IBQ

```
