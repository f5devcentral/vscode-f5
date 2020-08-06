

# Make HTTP/S Request documentation and examples

[BACK TO MAIN README](../README.md)

---

This function provides the necessary flexbility to make any API call to ANYthing

Highlight text, right-click, select: `Make HTTPS Request`

## Calls without "http" in url
This assumes the request is intented for the currently connected device, of which host details are already known.

K13225405: Common iControl REST API command examples
- https://support.f5.com/csp/article/K13225405

### simple url as string
```
/mgmt/tm/sys/clock
```

### simple url in yaml format
```
url: /mgmt/tm/sys/clock
```

### simple url in json format
```
{
  "url": "/mgmt/tm/sys/clock"
}
```

### list vlans
```
/mgmt/tm/net/vlan/
```



### url post in yaml
```
url: /mgmt/shared/authn/login
method: POST
body:
    username: user1
    password: dobgispet
```

### url post in yaml
```
url: /mgmt/tm/sys/config
method: POST
body:
    command: save
```

### list sys options
```
/mgmt/tm/sys/
```

### list sys ucs
```
/mgmt/tm/sys/ucs/
```

### url post in json
```
{
  "url": "/mgmt/shared/authn/login",
  "method": "POST",
  "body": {
      "username": "todai",
      "password": "dobgispet"
  }
}
```

---

## Calls for outside f5

The command will detect if the url has "http", if found, it considers it a fully qualified request destined for something outside of a device defined within the extension

Default HTTP method = GET

data, or body, must also include 'POST' HTTP method

### Simple get
```
https://api.chucknorris.io/jokes/random
```

### simple get in yaml
```
url: https://api.chucknorris.io/jokes/random
```

### simple get in yaml - shows broken response
```
url: https://broken.extra.io/whah
```

### simple POST in yaml
```
url: https://postman-echo.com/post
method: POST
data: 'hi'
```

### simple POST in json
```
{
    "url": "https://postman-echo.com/post",
    "method": "POST",
    "data": "hi"
}
```

