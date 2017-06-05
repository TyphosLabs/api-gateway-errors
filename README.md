# api-gateway-errors

This module was created to handle the strangeness of API Gateway's error handling. 


### Simple Response Body Mapping:
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
### Response Body Mapping:
```
#set ($errorJson = $util.parseJson($input.path('$.errorMessage')))
#if("$errorJson.message" != '')
{
    "message" : "$errorJson.message",
    "type" : "$errorJson.name"
    #if("$errorJson.fields" != '')
    ,"fields" : {
    #foreach($key in $errorJson.fields.keySet())
        "$key" : "$util.escapeJavaScript($errorJson.fields.get($key))"
        #if($foreach.hasNext),#end
    #end
    }
    #end
}
#else
{
    "message" : "There was an error.",
    "type" : "Error" 
}
#end
```
