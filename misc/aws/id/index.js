'use strict';

const oauth = require('./oauth');
const nodemailer = require('nodemailer');

// const mail_prms = JSON.parse(require('fs').readFileSync(".mail.creds"));
const mail_prms = { 
	"host": process.env["SMTP_HOST"] || 'smtp.gmail.com',  // Allow less secure apps: ON
	"port": process.env["SMTP_PORT"] || 465,
	"user": process.env["SMTP_USER"],
	"pass": process.env["SMTP_PASS"],
	"from": process.env["MAIL_FROM" ],
};

exports.handler = async (event) => {
    var qs = event.queryStringParameters || {};
    
    if (event.httpMethod == "GET")
        return await get_lambda_static_file('index.html');
    
    var data, err, statusCode;
    try {
        var user_id = qs.id || qs.email || qs.user_id || qs.user_email;
        var user_otp = qs.pwd || qs.otp || qs.user_pwd || qs.user_otp;
        
        if (qs.action=="register" && user_id) {
            var otp = generate_code( user_id + new Date().toISOString().substr(0,8) + mail_prms.pass );
            if (!user_otp) {
                // send OTP
                var txt = `Your sign-in code: ${otp}`;
                if (user_id.startsWith("+"))
                    data = await send_text(user_id, txt);
                else 
                    data = await send_email(user_id, txt, txt, `Your sign-in code: <b>${otp}</b>`);
            } else {
                // check OTP
                if (otp == user_otp)
                    data = { uid: user_id, name: user_id, email: user_id, hash: oauth.user_hash(user_id) };
                else 
                    statusCode = 400;
            }
        } else if (qs.action=="oauth") {
            // data = { status: "authentication token to process" };
            data = await oauth.process_oauth_token(qs);
        } else { 
            throw new Error("Invalid request. "+JSON.stringify(qs));
        }
    } catch (e) {
        err = "Query: " + JSON.stringify(qs) + "\n\n" + e + "\n" + ( e.stack || "" );
    }
    
    return {
        statusCode: statusCode || ( data ? 200 : 500 ),
        headers: { 
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        },
        body: data ? ( data.substr ? data : JSON.stringify(data)) : err,
    };

};

async function get_lambda_static_file(filename) {
    return new Promise((resolve, reject) => {
        var fs = require('fs');
        fs.readFile(filename, 'utf8' , (err, data) => {
            if (err) 
                reject(err);
            else 
                resolve({
                    statusCode: 200,
                    headers: { "Content-Type": "text/html" },
                    body: data });
        });
    });
}

async function send_email(to, subject, text, html) {
    return new Promise((resolve, reject) => {
    
        var transporter = nodemailer.createTransport({
            host: mail_prms.host,
            port: mail_prms.port,
            secure: true,
            auth: {
                user: mail_prms.user,
                pass: mail_prms.pass
            }
        });

        var mailOptions = { from: mail_prms.from, to, subject, text, html };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error)
                reject(error);
            else
                resolve(info);
        });
    });
}

async function send_text(to, text) {
    const axios = require('axios');
    
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const tok = process.env.TWILIO_AUTH_TOKEN;
    const num = process.env.TWILIO_NUMBER_FROM;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

    const prms = new URLSearchParams({
        'To': to,
        'Body': text,
        'From': num });

    const config = {
    	headers: {
    		'Content-Type': 'application/x-www-form-urlencoded'
    	},
    	auth: {
			username: sid,
			password: tok
		}
    };
    
    return axios.post(url, prms, config)
        .then(res => { return { status: res.status, data: res.data }; });
}

function generate_code(txt) {
	var a = 1664525, b = 10139042230;
	var hash = 7654321;
	for (var c of txt) {
		var k = c.charCodeAt(0);
		hash = ( a * hash + b + k * (k-1)) % (1<<24);
	}
	var code = (hash + "" + a) .substr(0,6);
	return code;
}

if (require.main === module) {
	
    send_email('claude.cochet@gmail.com', 'Hello Code from AWS', 'Toc Toc?', '<b>Toc Toc Toc?</b>')
    .then(console.log)
    .catch(console.error);
}
