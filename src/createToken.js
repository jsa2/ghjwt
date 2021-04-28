const {sign} = require('jsonwebtoken')

//https://docs.github.com/en/rest/reference/apps#create-an-installation-access-token-for-an-app
function createToken(appid, priv) {
    return new Promise((resolve, reject) => {

        var claims = {
            "iss": appid,
        }

        //one second skew for generation (600 minutes)
        claims.exp = Math.floor(Date.now() / 1000) + (599)

        sign(claims, priv, {
            algorithm: 'RS256',
            header: {}
        }, (err, jwt) => {

            if (err) {
                return reject(err)
            }

            return resolve(jwt)

        })

    })
}


module.exports={createToken}