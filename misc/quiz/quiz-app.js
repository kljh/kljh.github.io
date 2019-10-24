const fs = require('fs');
const path = require('path');

const rp = require('request-promise');
const qs = require('querystring');

const bDebug = true;

// https://aws.amazon.com/blogs/compute/simply-serverless-using-aws-lambda-to-expose-custom-cookies-with-api-gateway/
const oauth = require('./oauth');
const db = require('./quiz-db');

// Questions (with extra fields)
var questions, question_map;
function load_questions_from_file() {
    var json = fs.readFileSync(path.join(__dirname, 'quiz-questions.json'), 'utf8');
    questions = JSON.parse(json);
    question_map = {};
    for (var q of questions)
        question_map[q.quiz_id||q.id] = q;
    console.log("#questions", questions.length);
    //console.log("questions ids", Object.keys(question_map));

}

function quiz_server_start() {
    const http = require('http');
    const express = require('express');
    const bodyParser = require('body-parser');

    const http_port = 8080;
    var app = express();
    var server = http.createServer(app);
    server.listen(http_port, function () { console.log('HTTP server started on port: %s', http_port); });

    app.use('/static', express.static(__dirname));

    app.use(bodyParser.json()); // parse JSON requests
    app.set('json spaces', 4); // pretty JSON replies
    register(app);
}

function register(app) {
    oauth.register(app);

    app.use("/lambda", async function (req, res, next) {
        var prms = req.method=="GET" ? req.query : req.body;

        try {
            var response = await quiz_aws_handler({ body: prms });
            var resobj = JSON.parse(response.body);
            res.status(response.statusCode || 500).json(resobj);
        } catch(e) {
            res.status(500).json({ error: e.message });
            console.log("quiz error", e);
        }
    });

    load_questions_from_file();
}

/*

AWS Lambda, put in index.js:

    const app = require('./quiz-app');
    app.load_questions_from_file();
    exports.handler = app.quiz_aws_handler;

Documentation:
https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format

    // event.body
    // event.queryStringParameters
    // event.headers

*/
async function quiz_aws_handler(event, context, callback) {
    var req = null, res = null, err= null;
    try {
		if (event && event.queryStringParameters) {
			req = event.queryStringParameters;
		}
		if (event && typeof event.body =="object" && event.body!==null) {
			req = event.body;
		}
		if (event && typeof event.body =="string" && event.headers && event.headers["content-type"].toLowerCase().indexOf("application/json")==0) {
			req = JSON.parse(event.body);
		}

		if (!req) {
            err = "No action specified.";
		} else {
            console.log("quiz", JSON.stringify(req));
            switch (req.action) {
                case "register":
                    res = await quiz_register(req);
                    break;
                case "next":
                    res = await quiz_next(req);
                    break;
                case "questions":
                    res = await quiz_questions(req);
                    break;
                case "users":
                    res = await quiz_users(req);
                    break;
                case "oauth":
                    res = await oauth.lambda_oauth(req);
                    break;
                default:
                    err = "Unhandled action '"+ req.action+"'.";
                    // res = event;
            }
		}

    } catch(e) {
        err = ""+( e.stack || e.message || e );
    }

    // IMPORT: !!RESPECT STRUCTURE OF REPLY BELOW !!

    var response = {
        "isBase64Encoded": false,
        "statusCode": err ? 500 : 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            //"Access-Control-Allow-Headers": "*",
        },
        "body": typeof res == "string" ? res : JSON.stringify({
            "error": err,
            "request": err ? req : undefined,
            "content-type" : err && event.headers ? event.headers["content-type"] : undefined,
            "query": err ? event.queryStringParameters : undefined,
            "body" : err ? event.body : undefined,
			"result": res
        }, null, 4)
    };
    return response;
};


async function quiz_register(prms) {
    var user_id = prms.user_id || prms.uid;
	var bReplace = prms.replace;

    if (!user_id) throw new Error("user_id missing");

	// try getting existing user
	var tmp = await db.get_user(user_id, bReplace);
	if (tmp.uid) return tmp;

	// create and get
    var tmp = await db.add_user(user_id, bReplace);
    var tmp = await db.get_user(user_id, bReplace);
	return tmp;
}


async function quiz_next(prms) {
    var timestamp = new Date().toISOString();
    var admin = prms.pwd=="Galilei";

    var user_id = prms.user_id || prms.uid;
    var user = await db.get_user(user_id);
    if (!user || !user.answers)
        throw new Error("User data for '"+user_id+" 'contains no 'answers'. "+JSON.stringify(user));

    // save answer (if we got one)
    var quiz_id = prms.quiz_id;
    var skip_question = prms.skip_question;

    if (quiz_id && !skip_question) {
        prms.request_timestamp = user.answers[quiz_id] ? user.answers[quiz_id].request_timestamp : null;
        prms.reply_timestamp = timestamp;
        prms.score = auto_scoring(question_map[quiz_id], prms);
        console.log("update_user_with_answer", prms)
        user = await db.update_user_with_answer(user_id, quiz_id, prms);
    }

    // pick next question
    if (prms.next_quiz_id) {
        console.log("questions ("+user_id+"): picked "+prms.next_quiz_id);
    } else {
        var questions_available = Object.keys(question_map);
        var questions_already_seen = Object.keys(user.answers);
        var question_left = questions_available.filter(q => questions_already_seen.indexOf(q)==-1);
        console.log("questions ("+user_id+"):",
            "#available", questions_available.length,
            "#seen", questions_already_seen.length,
            "#left", question_left.length, )
    }
    // .. and return it
    if (prms.next_quiz_id || question_left.length>0) {
        var next_question_id = prms.next_quiz_id || question_left[0]
        var user_after = await db.update_user_with_answer(user_id, next_question_id, { request_timestamp: timestamp });
        var question = question_map[next_question_id];

        var q = deep_clone(question);
        delete q.validation;
        return q;
    } else {
        return {
            id: "You're done",
            question: "<p>What can you do from here ?\n<ul>\n"
                + "<li>Go to the menu to retry skipped quizes<br/>(and to see additionnal brain teasers).<br/><br/></li>\n"
                + "<li>Help us improve by sending feedback:<br/>improve existing questions, propose new ones, report buggy behavior.<br/><br/></li>\n"
                + "<li>Send an email (with the id you used)<br/>if you're ready for an technical interview.<br/><br/></li>\n"
                + "</ul></p>\n",
            answer_type: "no_scoring",
            done: true,
            };
    }
}

async function quiz_questions(prms) {
    var user_id = prms.user_id || prms.uid;
    var admin = prms.pwd=="Galilei";

    if (bDebug) load_questions_from_file();

    var user = await db.get_user(user_id);

    if (prms.id) return question_map[prms.id];

    var rep = [];
    for (var id in question_map) {
        var question = question_map[id];
        var answer = user && user.answers && user.answers[id];

        var item = {};

        // extract from question
        var headers = [ "id", "category", "level", "answer_type" ];
        if (admin) headers = headers.concat([ "question", "validation" ]);
        for (var k of headers) item[k] = question[k];

        // extract from answer
        // "question_timestamp", "reply_timestamp", "reply_json"
        if (answer) {
            var headers = [ "request_timestamp", "reply_timestamp" ];
            if (admin) headers = headers.concat([ "answer", "score" ]);
            for (var k of headers) item[k] = answer[k];
        }

        rep.push(item);
    }
    return rep;
}

function auto_scoring(question, reply) {
    console.log("\nauto_scoring(\n/*** question ***/\n"+JSON.stringify(question)+",\n/*** reply ***/\n"+JSON.stringify(reply)+");\n");

    var answer_type = question && question.answer_type;

    if (answer_type=="no_scoring") {
        console.log("> score", null);
        return null;
    }

    if (answer_type == "free") {
        var answer = reply.answer.user_answer;
        var expected = expected_answers();
        var accepted = match_one_of_expected_answer(expected, answer);
        var score = accepted ? 1.0 : 0.0;
        console.log("> score", score);
        return score
    }

    if (answer_type=="exclusive" || answer_type=="multiple") {
        var nb_bool_compared = 0
        var nb_bool_matching = 0

        var answers = reply.answer;
        var expected = expected_answers();

        for (var a in answers) {
            var boolean_answer = answers[a];
            if (typeof boolean_answer != "boolean") continue;

            nb_bool_compared++;
            var replied_true = boolean_answer===true;

            var true_expected = match_one_of_expected_answer(expected, a);

            if ( (true_expected && replied_true) || (!true_expected && !replied_true) ) {
                nb_bool_matching++;
            } else {
                console.log("auto_scoring: incorrect answer for '"+a+"'.",
                    "true_expected", true_expected, "replied_true", replied_true);
            }
        }

        console.log("nb_bool_matching", nb_bool_matching)
        console.log("nb_bool_compared", nb_bool_compared)

        var score = null;
        if (answer_type == "exclusive") {
            if (nb_bool_matching != nb_bool_compared && (nb_bool_matching+2)!=nb_bool_compared)
                console.warn("answer_type=='exclusive' nb_bool_matching [+2] != nb_bool_compared for question " + JSON.stringify(question) + " and reply "+ JSON.stringify(reply));
            score = nb_bool_matching==nb_bool_compared ? 1.0 : 0.0;
        } else { // answer_type == "multiple"
            score = (1.0 * nb_bool_matching) / nb_bool_compared;
        }
        console.log("> score", score);
        return score
    }

    if (answer_type=="code") {
        score = auto_scoring_code(question, reply);
        console.log("> score", score);
        return score
    }

    console.warn("> score (no auto scoring available)", score);
    return null;

    //  supporting functions

    function expected_answers() {
        var expected = question.validation;
        if (!expected) { console.warn("missing validation"); return null; }
        if (!Array.isArray(expected)) expected = [expected];
        expected = expected.map(expr => {
            if (expr.substr && expr[0]=="/" && expr[expr.length-1]=="/") {
                try {
                    expr = RegExp(expr.substr(1,expr.length-2));
                } catch (e) {
                    console.warn("Expression '"+expr+"' loohs like a regular expression but isn't. "+e);
                }
            }
            return expr;
        });
        console.log(expected);
        return expected;
    }

    function match_one_of_expected_answer(expected, answer) {
        var matches = false;
        for (var exp of expected) {
            if (exp instanceof RegExp) {
                // use regular expression
                if (exp.test(answer))
                    return true;
            } else if (!isNaN(exp*1)) {
                // numeric expression
                var user_answer = answer*1; // To do: allow expessions
                if (Math.abs(exp-user_answer) < Math.max(1e-4, 1e-4*exp))
                    return true;
            } else {
                // use plain string
                // CAREFUL with HTML entity in math expressions ('&lt;' becomes '<' in answers)
                if ((""+answer).trim() == (""+exp).trim())
                    return true;
            }
        }
        return false;
    }

    function auto_scoring_code(question, reply) {
        var test_data = question.validation.test_data

        // compile
        var fct_name = question.skeleton_code.function_name;
        var fct_ref = fct_from_src(fct_name, question.validation.src);
        var fct_usr = fct_from_src(fct_name, reply.src);
        if (!fct_ref) return null;
        if (!fct_usr) return 0;

        // run and compare
        console.log("#test_data", test_data.length);
        var nb_ok=0, nb_run=0;
        for (var td of test_data) {
            var input = td.input;
            console.log("run with input", JSON.stringify(input));
            var val_ref = fct_ref(input);
            var val_usr = fct_usr(input);

            console.log("val_ref", val_ref);
            console.log("val_usr", val_usr);
            if (JSON.stringify(val_ref) === JSON.stringify(val_usr))
                nb_ok++;
            nb_run ++;
        }

        return nb_ok/nb_run;

        function fct_from_src(fct_name, src) {
            try {
                var alt_src = "'use strict';\n" + src + "\n\n" + "  try { return "+fct_name+"(sample_input); } catch(e) { console.log(e); }"
                console.log("fct_from_src: function", fct_name, "(sample_input) {\n", alt_src, "\n}");
                return new Function("sample_input", alt_src);
            } catch(e) {}
        }
    }
}

async function quiz_users(prms) {
    var admin = prms.pwd=="Galilei";

    var users = await db.get_users();
    return users;
}

function deep_clone(o) { return JSON.parse(JSON.stringify(o)); }

module.exports = {
    register: register,
	quiz_aws_handler: quiz_aws_handler,
	load_questions_from_file: load_questions_from_file,
};

if (typeof require != 'undefined' && require.main==module) {
    quiz_server_start();
}
