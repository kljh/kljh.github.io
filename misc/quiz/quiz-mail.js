'use strict';

const nodemailer = require('nodemailer');

const fs = require('fs');
const mail_prms = JSON.parse(fs.readFileSync(".email.creds"));

function send_quiz_email() {

	var transporter = nodemailer.createTransport({
        host: mail_prms.host || 'smtp.gmail.com',  // Allow less secure apps: ON
        port: mail_prms.port || 465,
        secure: true,
        auth: {
            user: mail_prms.user,
            pass: mail_prms.pass
        }
    });

    var mailOptions = {
		from: mail_prms.from,
        to: 'code@main2.fr',
        subject: 'Hello Code from AWS',
        text: 'Toc Toc?',
        html: '<b>Toc Toc?</b>'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
}

send_quiz_email();
