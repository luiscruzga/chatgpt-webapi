# chatgpt-webapi

Implementation of [transitive-bullshit/chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api) as web api running on a docker container



## RUN
```
docker run --restart=always -dp 8080:8080 chatgpt-webapi
```

## REQUEST

```
GET
    http://localhost:8080/?apiKey=SECRET_AUTH_KEY&message=Hello[&conversationId=XXXX]
```


```
POST
    http://localhost:8080

BODY
    {
        'apiKey':'SECRET_AUTH_KEY',
        'message':'Hello',
        'conversationId':'XXXX' // optional
    }

CONTENT TYPE
    application/json
```

## RESPONSE

### Good
```
BODY
    {
        "response":"Hello!
    }

CONTENT TYPE
    application/json  
```

### Bad
```
BODY
    {
        "error":"[string] or [object]"
    }

CONTENT TYPE
    application/json
```


## BUILD
```
 docker build -t chatgpt-webapi .
```
