## GitHub Apps and JWT based flow for server-to-server use
GitHub has great documentation and examples for this flow. I only created this, as I wanted to have single page for documentation with code examples for my use case (GitHub Apps JWT tokens in server to server flows)
[Documentation about the flow](#documentation-about-the-flow)
### Recommended reading
![howTo](https://docs.github.com/en/developers/apps/authenticating-with-github-apps)
https://docs.github.com/en/developers/apps/authenticating-with-github-apps
https://docs.github.com/en/developers/apps/differences-between-github-apps-and-oauth-apps
https://docs.github.com/en/developers/apps/about-apps#determining-which-integration-to-build


## Why should I use this flow?
In my opinion this flow is much more secure than Personal Access Tokens for unattended use-cases (akin to client credentials flow in OAuth2), as the flow itself never transports the secret portion of the client (Like personal access tokens do). The flow only produces a proof in form of a signature, that it is in posession of the private key used to create the signature.

## NodeJS depedencies (only relevant if you use the example code)
## Depedencies and references
NodeJS version 14 lts 
|Depedencies| NPM Description | Use in project|
|---|---|---|
| [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)   |*An implementation of JSON Web Tokens*   | Creation and signatures of tokens  |
[axios](https://www.npmjs.com/package/axios) | *Promise based HTTP client for the browser and node.js*| Used to call GH endpoints

- [GitHub Apps and JWT based flow for server-to-server use](#github-apps-and-jwt-based-flow-for-server-to-server-use)
  - [Recommended reading](#recommended-reading)
- [Why should I use this flow?](#why-should-i-use-this-flow)
- [NodeJS depedencies (only relevant if you use the example code)](#nodejs-depedencies-only-relevant-if-you-use-the-example-code)
- [Depedencies and references](#depedencies-and-references)
- [Flow example](#flow-example)
  - [Client created JWT token](#client-created-jwt-token)
  - [Request for Access Token](#request-for-access-token)
  - [Response from Authorization](#response-from-authorization)
  - [Example call with the token (note! no Bearer prefix)](#example-call-with-the-token-note-no-bearer-prefix)
- [Notes](#notes)
  - [Documentation about the flow](#documentation-about-the-flow)
  - [Possible confusions](#possible-confusions)
    - [InstallationID](#installationid)
    - ["Deleting Private Keys"](#deleting-private-keys)
    - [Code Example for NodeJS](#code-example-for-nodejs)

## Flow example
![img](img/flow.png)

### Client created JWT token
```
{
  header: {
    alg: "RS256",
    typ: "JWT",
  },
  payload: {
    iss: "yourappid",
    exp: 1619592328,
    iat: 1619591729,
  },
  signature: "WuGb......",
}
```



### Request for Access Token
```
{
  method: "post",
  url: "https://api.github.com/app/installations/yourInstallationID/access_tokens",
  headers: {
    "content-type": "application/vnd.github.v3+json",
    authorization: "Bearer eyJhbGciOiJ",
    accept: "application/vnd.github.v3+json",
  },
  data: {
    permissions: {
      pull_requests: "write",
    },
    installation_id: "yourInstallationID",
  },
}
```

### Response from Authorization 
```
{
  token: 'ghs_secretTokenIsHeretoGo',
  expires_at: '2021-04-28T07:32:35Z',
  permissions: { metadata: 'read', pull_requests: 'write' },
  repository_selection: 'selected'
}
```


### Example call with the token (note! no Bearer prefix)
```
"Authorization": token ghs_installatioNToken"
```

```
Response
 repositories: [
    {
      id: ,
      node_id: '=',
      name: 'caManager',
      full_name: 'jsa2',
      private: true,
      owner: [Object],
      html_url: 'https://github.com/jsa2/...',
      }
 ]
```

## Notes 

### Documentation about the flow
Even though the documentation does not explictly state which flow is being used, to my understanding it aligns pretty well with [Common Name: JWT Bearer Token Profile for OAuth 2.0 Client](https://tools.ietf.org/html/draft-ietf-oauth-jwt-bearer-12)

The final token type is not JWT but "Server-to-server token for a GitHub App"
|Example from GitHub| references
|--|--|
|![img](img/tokens.png)|[link](https://docs.github.com/en/github/authenticating-to-github/about-authentication-to-github#githubs-token-formats)

### Possible confusions
#### InstallationID
Before proceeding with getting access tokens for GitHub App, you have to create installation, and select which repositories where they have access to.
![img](img/Installation2.png)
![img](img/Installation.png)

#### "Deleting Private Keys"
When first exploring the guide, I was confused by the option to "delete private token from GH". Since you have only the option to create the private key in GH, I assumed, that GH also stores the private key, which would make no sense for RS256 alg in jwt tokens

|Example from GitHub| references
|--|--|
|![img](img/priv.png)|[link](https://docs.github.com/en/developers/apps/authenticating-with-github-apps#deleting-private-keys)
|![img](img/actual.png)|


#### Code Example for NodeJS
Get installation ID and AppID. And give required permissions during the wizard for GitHub App Creation
```Javascript
const fs = require('fs')
const {axiosClient} = require('./src/axioshelpers')
const {createToken} = require('./src/createToken')


var installation_Id = "YourInstallationID"
var appId = "YourAppId"
var privateKey = fs.readFileSync('private1.pem').toString()
var data = {
    permissions: {
        pull_requests: "write"
    },
    installation_id : "YourInstallationID"
}

getGitHubAccessToken(privateKey,installation_Id,appId,data).catch((error) => {
    console.log(error)
}).then((data) => {
    
    options = {
        url:"https://api.github.com/installation/repositories",
        headers: {
            "content-type": "application/vnd.github.v3+json",
            "authorization": "Token " + data.token,
            "accept": "application/vnd.github.v3+json"
        },
    }
    axiosClient(options).catch((error) => console.log(error)).then((data) => console.log(data.data))

})

async function getGitHubAccessToken (priv,installationId, appId, data) {

    var auth = await createToken(appId,priv).catch((error) => {
        error
    })
    
    var s = require('jsonwebtoken').decode(auth,{complete:true})
  console.log(  s)

    var options = {
        method: "post",
        url: `https://api.github.com/app/installations/${installationId}/access_tokens`,
        headers: {
            "content-type": "application/vnd.github.v3+json",
            "authorization": "Bearer " + auth,
            "accept": "application/vnd.github.v3+json"
        },
        data
    }
    
    var token = await axiosClient(options).catch((error) => {
        return Promise.reject(error?.response?.data1 || error.response.status)
    })
    
    if (token) {
        return token?.data || 'undefined error' 
    }
  
}




```