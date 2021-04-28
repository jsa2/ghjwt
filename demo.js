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



