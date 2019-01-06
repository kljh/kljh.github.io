var http_rpc_server = "https://5nn8oaty7b.execute-api.eu-west-3.amazonaws.com/default";

$(function () {
	if (window.location.hostname=="localhost") {
		//console.warn("changing http_rpc_server")
		//http_rpc_server = window.location.origin;
		//http_rpc_server = "http://127.0.0.1:5000";
		http_rpc_server = "";
	}

    // code executed on startup
	if (localStorage && localStorage["user_id"]) {
		$("#user_id").text(localStorage["user_id"]);
		next_reply_or_skip();
	} else {
		window.location.href = "quizlogin.html";
		return;
	}

	$("#logout").click(function (ev) {
		if (localStorage) delete localStorage["user_id"];
		var pwd = uri_args()["pwd"];
		window.location.href = "quizlogin.html" + (pwd?"?pwd="+pwd:"");
	});

	$("#show_hide_box").click(function (ev) {
		ev.preventDefault();
		var div = ev.target.parentElement.parentElement.parentElement;
		$(div).toggle();
		//$(".box").toggleClass()("box nobox");
	});

	$("#menu").click(function () { display_menu(); });
	$("#skip").click(function () { next_reply_or_skip({ skip: true }); });
	$("#next").click(function () { next_reply_or_skip(); });
	function next_reply_or_skip(opt_prms) {
		var prms = opt_prms || {};

		$("#menu").prop('disabled', true);
		$("#skip").prop('disabled', true);
		$("#next").prop('disabled', true);


        if (localStorage && $("#user_id").text())
            localStorage["user_id"] = $("#user_id").text();

        var req = { action: "next" };
        if (prms.skip)
            req.skip_question = true;
        if (prms.next_quiz_id)
            req.next_quiz_id = prms.next_quiz_id;
        if (localStorage && localStorage["user_id"])
            req.user_id = localStorage["user_id"];
        req = build_request_from_html_input(req);

		var src = code_editor ? code_editor.getValue() : undefined;
		if (src) {
			code_editor.setValue("");
			req.src = src;
		}
        http_rpc(
            req,
            function (res) {
                res = res.result || res;
                res = res.substr ? JSON.parse(res) : res;
                $("#quiz_id").val(res.id || res.quiz_id);
				$("#quiz_title").empty().append(res.id || res.quiz_id);
				$("#reason").val("");

                var question = Array.isArray(res.question) ? res.question.join("<br/>") : res.question;
				$("#quiz").empty().append(question);

                if (res.done) {
                    //$("#done").show();
                    $("#done").val("Send");
                    $("#done").click(send_email);
                    $("#done").focus(); // set focus on this element
                }

                $("#answer_choice").empty();
                $("#code_div").hide();
                $("#sql_div").hide();

				var answer_type = res.answer_type;
				if (answer_type=="exclusive") {
                    var answer_list = res.answer_list;
                	var src = "";
                    for (var i=0; i<answer_list.length; i++) {
                        src += '<label><input type="radio" name="answer_choice" value="'+answer_list[i]+'" id="answer_'+i+'" checked> '+answer_list[i]+'</label><br/>'
                    }
                    $("#answer_choice").append(src);
                } else if (answer_type=="multiple") {
                    var answer_list = res.answer_list;
                	var src = "";
                    for (var i=0; i<answer_list.length; i++) {
                        src += '<label><input type="checkbox" value="'+answer_list[i]+'" id="answer_'+i+'"> '+answer_list[i]+'</label><br/>'
                    }
                    $("#answer_choice").append(src);
                } else if (answer_type=="free") {
					$("#answer_choice").append('<b>Your answer</b><br/><input id="user_answer" class="textbox"><br/>');
				} else if (answer_type=="code") {
					$("#code_div").show(); // .css("display", "block");
					$("#code_generate_test").hide();
					$("#code_prev_sample").hide();
					$("#code_next_sample").hide();
					code_info = res; // save as global variable
					code_editor.setValue(res.skeleton_code.js);
					if (res.test_data) {
						var test_data = res.test_data[0];
						var html = "";
						if (res.test_data_generate)
							$("#code_generate_test").show()
						if (res.test_data.length>1) {
							$("#code_prev_sample").show();
							$("#code_next_sample").show();
							html += '<p>Test <span id="sample_curr">1</span>/'+res.test_data.length+'</p>';
						}
						if (test_data.input!==undefined)
							html += '<h2>Sample input</h2><pre id="sample_input" contenteditable="true">'+stringify_objects(test_data.input)+'</pre>';
						if (test_data.output!==undefined)
							html += '<h2>Sample output</h2><pre id="sample_output" contenteditable="true">'+stringify_objects(test_data.output)+'</pre>'
						$("#sample_input_output_div").html(html);
					} else {
						$("#sample_input_output_div").empty();
					}
				} else if (answer_type=="sql") {
	             	$("#sql_div").show();
    				$("#sql_textarea").text(res.skeleton_sql);

	             	var test_data = res.test_data[0];
	             	sql_add_tables(test_data);
                } else if (answer_type=="no_scoring") {
                } else {
					console.warn("answer_type", answer_type);
				}


				try {
					MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
				} catch (e) {
					console.error(""+e);
				}
				$("#menu").prop('disabled', false);
				$("#skip").prop('disabled', false);
				$("#next").prop('disabled', false);
            },
            function (err) {
            	console.error(err);
                $("#menu").prop('disabled', false);
                $("#skip").prop('disabled', false);
                $("#next").prop('disabled', false);
            }
        );
    }
	function display_menu() {
		$("#menu").prop('disabled', true);
		$("#skip").prop('disabled', true);
		$("#next").prop('disabled', false);

		if (localStorage && $("#user_id").val())
            localStorage["user_id"] = $("#user_id").val();
		if (localStorage && $("#user_id").text())
            localStorage["user_id"] = $("#user_id").text();

		var pwd = uri_args()["pwd"];
		var admin = pwd=="Galilei";

		$.get(http_rpc_server + "/quiz?action=questions&user_id=" + localStorage["user_id"] + (pwd?"&pwd="+pwd:""))
		.done(function (res) {
			res = res.result || res;

			$("#quiz").empty();
			$("#quiz_id").val("");
			$("#reason").val("");
			$("#answer_choice").empty();

			var txt = "";

			if (admin) {
				txt += '<a href="#" id="quizz_toggle_all_switch">fold all</a><br/>';
			}

			for (var i=0; i<res.length; i++) {
				var q = res[i], prevq = res[i-1]||{};
				var quiz_id = q.id || q.quiz_id;
				var quiz_category_prev = prevq.category;
				var quiz_category = q.category;
				var quiz_level = q.level;
				var answer_type = q.answer_type;
				var question_timestamp = q.request_timestamp;
				var reply_timestamp = q.reply_timestamp;
				// only if pwd provided
				var question = Array.isArray(q.question) ? q.question.join("<br/>") : q.question;
				var answer = q.answer;
				var validation = q.validation;
				var score = q.score;

				var reply_skipped = ( q.skip_question ) || ( question_timestamp && !reply_timestamp);
				var reply_reason = answer && answer.reason;

				if (answer_type=="multiple" || answer_type=="exclusive") {
					var tmp = [];
					for (var k in answer)
						if (answer[k]===true)
							tmp.push(k);
					answer = tmp;
				}

				if (quiz_category!=quiz_category_prev)
					txt += "<br/><b>Category: "+quiz_category+"</b><br/>\n";
				txt += ""+quiz_id;

				if (reply_skipped)
					txt += ' <span style="color:orange;">skipped</span>';
				else if (reply_timestamp) {
					txt += ' <span style="color:green;">done</span>';
					if (admin) {

						if (answer_type != "no_scoring") {
							if (score==null || score==undefined)
								txt += ' <b>not scored</b>';
							else
								txt += ' <b>'+(Math.round(score*1000)/1000)+'</b>';
						}

						if (question_timestamp && reply_timestamp) {
						    var duration = Math.round((new Date(reply_timestamp).valueOf() - new Date(question_timestamp).valueOf())/100)/10 + "s";
						    try {
						        //txt += moment(question_timestamp).to(reply_timestamp);
						        var duration_tmp = moment.duration(moment(question_timestamp).diff(reply_timestamp)).humanize();
						        if (duration_tmp.indexOf("a few seconds")==-1)
						            duration = duration_tmp;
						    } catch (e) {}
						    txt += " in "+duration;
						}

						txt += ' <a href="#" class="quizz_toggle_switch" style="text-decoration:none;">&#9660;</a>';
						txt += '<div class="quizz_toggle_div" ' + ( score==1||answer_type=='no_scoring' ? ' style="display:none;"' : '' ) +'>';
						txt += '<br/>Question:'+question;

						txt += '<br/>Answer type: '+answer_type+'';
						txt += '<br/>Validation: <tt>'+escape_html_entities_lt_and_gt(JSON.stringify(validation,null,4))+'</tt>'; // html entities
						txt += '<br/>Reply: <pre>'+escape_html_entities_lt_and_gt(JSON.stringify(answer,null,4))+'</pre>';
						if (reply_reason)
						txt += '<br/>Reason:<br/><b>'+(reply_reason.substr?reply_reason.replace(/\n/g,"<br/>"):reply_reason)+'</b>';
						txt += '<br/>';

						txt += '</div>';
					}
				}

				if (reply_skipped || !reply_timestamp || admin)
					txt += ' <a href="#" class="quiz_direct_access" id="'+quiz_id+'">try-it</a>';
				txt += "<br/>";

			}

			$("#quiz_title").empty().append("Quiz menu");
			$("#quiz").append($(txt));
			$("#code_div").hide();

			//$("#quiz").append(""+res);

			$("#quizz_toggle_all_switch").click(function (ev) {
				ev.preventDefault();
				$(".quizz_toggle_div").hide("slow");
			});

			$(".quizz_toggle_switch").click(function (ev) {
				ev.preventDefault();
				var e0 = this.nextElementSibling;
				var el = ev.target.nextElementSibling;
				$(el).toggle("slow");
			});
			$(".quizz_toggle_div");

			$(".quiz_direct_access").click(function (ev) {
				var id = this.id;
				var id2 = ev.target.id;
				next_reply_or_skip({ next_quiz_id: id });
			});
			$("#next").prop('disabled', false);
		})
		.fail(function (err) {
			console.error(err);
			$("#menu").prop('disabled', false);
			$("#skip").prop('disabled', false);
			$("#next").prop('disabled', false);
		});
	}


    // get next question
    $("#quiz_id").val("login");
    //next_reply_or_skip();

    sql_init();
});

function send_email() {
	window.open("mailto:@.org?subject=Quiz complete&body=Quiz complete with id "+localStorage["user_id"]);
}

function http_rpc(request_data, success, error) {
	var ajax_data = JSON.stringify(request_data, null, 4);
	var timestamp = (new Date()).toISOString().replace(/[ ]/g, "");

	var method = "POST"; // GET, PUT, POST
	$.ajax({
		url: http_rpc_server + "/quiz?action=next&timestamp="+timestamp,
		method : method,
		data : ajax_data,
		contentType: "application/json; charset=utf-8",
		dataType: "json",

		success: function(data) {
			if (success)
				success(data);
		},
		error : function(e) {
			alert("http_rpc error. "+e.message);
			if (error)
				error(e);
		}
	});
}


function build_request_from_html_input(req) {
	if (!req)
		req = {};

	var inputs = document.querySelectorAll("input");
	for (var i=0, n=inputs.length; i<n; i++) {
		var input = inputs[i];
		if (input.type=="button" || input.type=="submit")
			continue; // do nothing

		var input_parent = element_path(input, req);
		if (input.type=="checkbox" || input.type=="radio")
			input_parent[(input.value || input.id)+""] = input.checked;
		else if (input.type=="date")
			input_parent[input.id] = iso_to_excel_date(input.value);
		else
			input_parent[input.id] = isNumber(input.value) ? parseFloat(input.value) : input.value;
	}

	var inputs = document.querySelectorAll("select");
	for (var i=0, n=inputs.length; i<n; i++) {
		var input = inputs[i];
		var input_parent = element_path(input, req);

		input_parent[input.id] = input.value;
	}

    var inputs = document.querySelectorAll("textarea");
	for (var i=0, n=inputs.length; i<n; i++) {
		var input = inputs[i];
		var input_parent = element_path(input, req);

		if (input.id)
		input_parent[input.id] = input.innerText || input.value;
	}

	return req;
}

function element_path(e, req) {
	var id = e.id;
	var path = [];
	while (e.parentNode) {
		var e = e.parentNode;
		if (e.hasAttribute && e.hasAttribute("id") && (e.nodeName=="form"||e.nodeName=="FORM"||e.getAttribute("class")==="html2json"))
			path.unshift(e.id);
	}
	for (var i=0, n=path.length; i<n; i++) {
		if (!req[path[i]])
			req[path[i]] = {};
		req = req[path[i]];
	}
	return req;
}

function escape_html_entities_lt_and_gt(txt) {
	if (typeof txt != "string")
		return txt;
	return txt.replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function js_to_excel_date(t) {
	return Math.floor(t/(24*60*60*1000)) + 25569;
}
function iso_to_excel_date(s) {
	var t = new Date(s); // does NOT work everywhere
	return js_to_excel_date(t);
}
function excel_to_js_date(x) {
	var t = (x-25569) * (24*60*60*1000);
	return new Date(t);
}
function js_to_iso_date(t) {
	return t.toISOString().substr(0,10);
}
function excel_to_iso_date(x) {
	var t = excel_to_js_date(x);
	return js_to_iso_date(t);
}
function excel_to_iso_date_schedule(sched) {
	var tmp = sched.slice(0, sched.length);
	for (var i=0, n=sched.length; i<n; i++)
		for (var k in tmp[i])
			if (k.substr(k.length-4).toLowerCase()==="date")
				try {
					tmp[i][k] = excel_to_iso_date(tmp[i][k]);
				} catch (e) {}
	return tmp;
}

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}


function uri_args() {
	var tmp = window.location.search.substr(1).split('&');
	var kv = {};
	for (var i=0; i<tmp.length; i++) {
		var key = tmp[i].split('=', 1)[0];
		var val = tmp[i].substr(key.length+1);
		kv[key] = val ? decodeURIComponent(val) : val;
	}
	return kv;
}