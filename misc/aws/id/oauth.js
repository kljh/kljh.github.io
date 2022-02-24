/*
OAuth config:
https://www.linkedin.com/developers/apps
https://github.com/settings/applications/1156918
https://console.developers.google.com/apis/credentials

AWS Lambda setting :
- !! allow 15s for oauth redirect execution!!

*/

/* global AWS */

const REDIRECT_URL = "https://aws.kljh.org/id";

function get_redirect_uri(provider) {
    return REDIRECT_URL;
}

async function process_oauth_token(auth) {
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
        console.error("ERROR: " + e);
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

    // console.log("LinkedIn access_token url", url, urlenc_data);

    return await
    rp.post(url, { form: urlenc_data})
    .then(function (res_at) {
        // use access token to request user name and email

        var res_at = JSON.parse(res_at);
        var access_token = res_at.access_token;
        var at = { headers: { "Authorization": "Bearer " + access_token }};

        // console.log("LinkedIn access_token", access_token);

        return Promise.all([
            rp.get("https://api.linkedin.com/v2/me", at),
            rp.get("https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))", at) ]);
    })
    .then(function (res_info) {
        // console.log("LinkedIn api_info", res_info);

        var name_info = JSON.parse(res_info[0]);
        var email_info = JSON.parse(res_info[1]);

        var email = email_info.elements[0]["handle~"].emailAddress;
        var user_info = {
            uid: email,
            name: name_info.localizedFirstName + " " + name_info.localizedLastName,
            first_name: name_info.localizedFirstName,
            last_name: name_info.localizedLastName,
            email: email,
            hash: user_hash(email),
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
            uid: login_info.email,
            name: login_info.login,
            email: login_info.email,
            hash: user_hash(login_info.email),
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
        user_info.uid = user_info.email;
        user_info.hash = user_hash(user_info.email);
        user_info.state = auth_state;

        return user_info;
    });
}


async function check_hash(uid, pwd) {
    var exp = user_hash(uid);
    if (pwd != exp)
        throw new Error("Hash check did not pass");
    return { verified: true };
}

function user_hash(uid) {
    var crypto = require('crypto');
    var hash = crypto.createHash('md5')
        .update(uid + process.env.USER_HASH + new Date().toISOString().substr(0,8), 'utf8')     // utf-8, binary, or ascii
        .digest('base64').replace(/=/g, "");
    return hash;
}

function urlenc_data_to_string(data) {
	var tmp = [];
	for (var k in data)
		tmp.push(k + "=" + data[k]);
	return "?" + tmp.join("&");
}

function read_text_from_s3(bucket, key) {
    const s3 = new AWS.S3({ signatureVersion: 'v4' });
    return s3.getObject({ Bucket: bucket, Key: key }).promise()
        .then(data => data.Body.toString())
		.then(data => JSON.parse(data));
}

var users, auth_to_user_id;
async function build_user_infos() {
    if (users)
        return;

    users = await read_text_from_s3("kusers", "users.json");

    auth_to_user_id = {};
    for (var user_id in users ) {
        for (var auth_id of users[user_id].auth_ids) {
            if (!auth_id.startsWith('@'))
                auth_to_user_id[auth_id] = user_id;
        }
    }
}

async function user_name(headers, prms) {
    var cookie = headers["Cookie"] || headers["cookie"] || "";
    var cookies = Object.fromEntries(cookie.split(";").map(x => x.split("=", 2).map(y => y.trim())));
    var { uid, hash } = cookies;

    if (!uid && !hash) {
        try {
            uid = prms.uid;
            hash = prms.hash;
        } catch(e) {}
    }

    await build_user_infos();

    var ok = hash == user_hash(uid);
    if (ok) return auth_to_user_id[uid];
}

async function switch_user(from_user, from_hash, to_user) {
    // check crendentials
    check_hash(from_user, from_hash);

    // check permission
    await build_user_infos();
    var from_user = auth_to_user_id[from_user] || from_user;
    if (!users[to_user] ||  users[to_user].auth_ids.indexOf("@"+from_user) == -1)
        throw new Error("User switch from "+from_user+" to "+to_user+": no '@"+from_user+"' permission found");

    return {
        uid: to_user,
        hash: user_hash(to_user),
        };
}

module.exports = {
    process_oauth_token,
    user_hash,
    check_hash,
    user_name,
    switch_user,
};
