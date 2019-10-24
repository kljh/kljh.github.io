/*
OAuth config:
https://www.linkedin.com/developers/apps
https://github.com/settings/applications
https://console.developers.google.com/apis/credentials
*/

//const rp = require('request-promise');
//const qs = require('querystring');

const IS_LOCALHOST = process.env.COMPUTERNAME == "ZENBOOK";
const REDIRECT_URL =  ( IS_LOCALHOST ? "https://localhost:8486/kljh/" : "https://kljh.github.io/" ) + "misc/quiz/quiz.html";
console.log("REDIRECT_URL", REDIRECT_URL);

function get_redirect_uri(provider) {
    return REDIRECT_URL;
}

function register(app) {

    app.use("/checkpwd", async function (req, res, next) {
        var prms = req.method=="GET" ? req.query : req.body;
        var uid = prms.user_id || prms.userid || prms.uid || prms.email || prms.login;
        var pwd = prms.password || prms.pwd;
        var exp = mkpwd(uid);
        return pwd==exp;
    });

    app.use("/linkedin", async function (req, res, next) {
        var prms = req.method=="GET" ? req.query : req.body;
        try {
            res.status(200).json(linkedin_oauth(prms));
        } catch(e) {
            res.status(500).json({ error: e.message });
            console.log("ERROR", e);
        }
    });

    app.use("/github", async function (req, res, next) {
        var prms = req.method=="GET" ? req.query : req.body;
        try {
            res.status(200).json(github_oauth(prms));
        } catch(e) {
            res.status(500).json({ error: e.message });
            console.log("ERROR", e);
        }
    });

    app.use("/google", async function (req, res, next) {
        var prms = req.method=="GET" ? req.query : req.body;
        try {
            res.status(200).json(google_oauth(prms));
        } catch(e) {
            res.status(500).json({ error: e.message });
            console.log("ERROR", e);
        }
    });
}

async function lambda_oauth(auth) {
    try {
        var provider = auth.state;
        var user_info = false;
        switch (provider) {
            case "linkedin": user_info = await linkedin_oauth(auth); break;
            case "github": user_info = await github_oauth(auth); break;
            case "google": user_info = await google_oauth(auth); break;
            default:
                throw new Error("Unknown authentication provider. " + provider);
        }
        console.log("user_info", user_info);
        return user_info;
    } catch(e) {
        console.log("ERROR", e);
        throw e;
    }
}

async function linkedin_oauth(auth) {
    const rp = require('request-promise');

            if (auth.error)
                throw new Error("LinkedIn authentication error. " + auth.error);

            // exchange auth code for access token
            var auth_code = auth.code;
            var auth_state = auth.state;
            var url = 'https://www.linkedin.com/oauth/v2/accessToken';
            var urlenc_data = {
                    grant_type: "authorization_code",
                    code: auth_code,
                    client_id: process.env.LINKEDIN_CLIENT_ID,
                    client_secret: process.env.LINKEDIN_CLIENT_SECRET,
                    redirect_uri: get_redirect_uri("linkedin")
                };

            //console.log("Linked access_token url", url, urlenc_data);

            return await
            rp.post(url, { form: urlenc_data})
            .then(function (res_at) {
                // use access token to request user name and email

                var res_at = JSON.parse(res_at);
                var access_token = res_at.access_token;
                var at = { headers: { "Authorization": "Bearer " + access_token }};

                //console.log("Linked access_token", access_token);

                return Promise.all([
                    rp.get("https://api.linkedin.com/v2/me", at),
                    rp.get("https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))", at) ]);
            })
            .then(function (res_info) {

                var name_info = JSON.parse(res_info[0]);
                var email_info = JSON.parse(res_info[1]);

                var email = email_info.elements[0]["handle~"].emailAddress;
                var user_info = {
                    name: name_info.localizedFirstName + " " + name_info.localizedLastName,
                    first_name: name_info.localizedFirstName,
                    last_name: name_info.localizedLastName,
                    email: email,
                    hash: mkpwd(email),
                    state: auth_state
                    };

                //console.log("Linked user_info", user_info);

                return user_info;
            });
}

async function github_oauth(auth) {
    const rp = require('request-promise');

            if (auth.error)
                throw new Error("GitHub authentication error. " + auth.error);

            // exchange auth code for access token
            var auth_code = auth.code;
            var auth_state = auth.state;

            var url = 'https://github.com/login/oauth/access_token';
            var urlenc_data = {
                    code: auth_code,
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    redirect_uri: get_redirect_uri("github"),
                    // state: "foobar",
                };
            var urlenc_str = urlenc_data_to_string(urlenc_data);

            //console.log("GitHub access_token url", url + urlenc_str);

            return await
            rp.post(url  + urlenc_str, {
                //form: urlenc_data,
                headers: { "Accept": "application/json" }})
            .then(function (res_at) {
                // use access token to request user name and email

                var res_at = JSON.parse(res_at);
                var access_token = res_at.access_token;
                var at = { headers: { "Authorization": "token " + access_token, "User-Agent": "kljh" }};

                //console.log("GitHub access_token", access_token);
                return rp.get("https://api.github.com/user", at);
            })
            .then(function (res_info) {
                var login_info = JSON.parse(res_info);

                var user_info = {
                    name: login_info.login,
                    email: login_info.email,
                    hash: mkpwd(login_info.email),
                    state: auth_state
                    };
                return user_info;
            });
}

async function google_oauth(auth) {
    const rp = require('request-promise');

            if (auth.error)
                throw new Error("Google authentication error. " + auth.error);

            // exchange auth code for access token
            var auth_code = auth.code;
            var auth_state = auth.state

            var url = 'https://www.googleapis.com/oauth2/v4/token';
            var urlenc_data = {
                    code: auth_code,
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    grant_type: "authorization_code",
                    redirect_uri: get_redirect_uri("google"),
                    // state: "foobar",
                };

            //console.log("Google access_token url", url, urlenc_data);

            return await
            rp.post(url, {
                form: urlenc_data,
                headers: { "Content-Type": "application/x-www-form-urlencoded" }})
            .then(function (res_at) {
                // use access token to request user name and email

                var res_at = JSON.parse(res_at);
                var access_token = res_at.access_token;
                var at = { headers: { "Authorization": "Bearer " + access_token }};
                //console.log("Google token", access_token)

                // var url = "https://www.googleapis.com/oauth2/v2/userinfo";    // email and picture only
                var url = "https://openidconnect.googleapis.com/v1/userinfo";    // email and picture only
                return rp.get(url, at);
            })
            .then(function (res_info) {
                var user_info = JSON.parse(res_info);
                user_info.hash = mkpwd(user_info.email);
                user_info.state = auth_state;

                return user_info;
            });
}


function mkpwd(uid) {
    var crypto = require('crypto');
    var hash = crypto.createHash('md5')
        .update(uid + "agarderpoursoi", 'utf8')     // utf-8, binary, or ascii
        .digest('base64').replace(/=/g, "");
    return hash;
}

function urlenc_data_to_string(data) {
	var tmp = [];
	for (var k in data)
		tmp.push(k + "=" + data[k]);
	return "?" + tmp.join("&");
}

module.exports = {
    register: register,
    lambda_oauth: lambda_oauth,
};

