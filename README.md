# api-gateway-errors

This module was created to handle the strangeness of API Gateway's error handling. 

```
#set ($errorJson = $util.parseJson($input.path('$.errorMessage')))
#if("$errorJson.message" != '')
{
    "message" : "$errorJson.message",
    "type" : "$errorJson.name"
}
#else
{
    "message" : "There was an error.",
    "type" : "Error" 
}
#end
```
