$(code_init);

var code_info; // from quiz.js

var code_editor;
function code_init() {
    $("#code_try").click(function (ev) { code_try(editor); });

    var lang = localStorage["language"];
    if (lang) $("#language").val(lang);

    lang_to_code_mirror_mode = {
        "js": "javascript", 
        "py": "python" };
        
    var editor = CodeMirror.fromTextArea(document.getElementById("code_textarea"), {
            lineNumbers: true,
            mode: lang_to_code_mirror_mode[lang],
            gutters: ["CodeMirror-lint-markers"],
            lint: true
        });

    editor.setSize(null, 400);

    // save as global variable
    code_editor = editor

    $("#code_try").removeAttr('disabled');
    $("#language").change(function (ev) {
        var lang = ev.target.value;
        switch(lang) {
            case "js":
                editor.setOption("mode", "javascript");
                if (code_info) {
                    if (code_info.skeleton_code.js) {
                        editor.setValue(code_info.skeleton_code.js);
                    } else
                        editor.setValue("// no code skeleton for this language\n\n"
                            + "function "+code_info.skeleton_code.function_name+"(sample_input) {\n"
                            + "    var x = 123;\n"
                            + "    if (x%7<2) x /= Math.sqrt(3);\n"
                            + "    return x;"
                            + "\n}\n");
                }
                break;
            case "py":
                editor.setOption("mode", "python");
                if (code_info) {
                    if (code_info.skeleton_code.py) {
                        editor.setValue(code_info.skeleton_code.py);
                    } else {
                        editor.setValue("# no code skeleton for this language\n\n"
                            + "def "+code_info.skeleton_code.function_name+"(sample_input):\n"
                            + "    z = 123.4\n"
                            + "    zpow = [ z**k for k in range(1,3) ]\n"
                            + "    return zpow\n"
                            + "\n");
                    }
                }
                if (!code_init_pypyjs_interpreter_started)
                    code_init_pypyjs_interpreter();
                break;
            case "sql":
                editor.setOption("mode", "sql");
                editor.setValue("select shoe_size, socks_color from confidential_data_table ");
                break;
            default:
                editor.setOption("mode", "clike");
                editor.setValue("Feel free to use your own environment.\n"
                    + "Test your code with sample provided. Paste it below to submit.\n\n"
                    + "Please put in comment the language used (and possibly why it is more relevant for the taks).\n");
                $("#code_try").attr('disabled','disabled');
        }
    });


    $("#code_generate_test").click(code_generate_test);
    $("#code_next_sample").click(_ => code_next(1));
    $("#code_prev_sample").click(_ => code_next(-1));
}

function code_try(editor) {
    $("#code_console").empty();
    $("#user_output").empty();

    var lang = $("#language").val();
    localStorage["language"] = lang;
    switch(lang) {
        case "js":
            return code_js_try(editor);
        case "py":
            return code_pypyjs_try(editor);
    }
}

function code_js_try(editor) {
    var ts = '<span style="font-size: small;">('+ new Date().toTimeString().substr(0,8) +')</span> ';
    var src = editor.getValue();
    var sample_input = read_objects_from_id("sample_input"),
        sample_output = read_objects_from_id("sample_output");

    // compile
    try {
        var alt_src = "'use strict';\n" + src + "\n\n";
        if (code_info) alt_src += "return "+code_info.skeleton_code.function_name+"(sample_input);";
        var fct = new Function("sample_input", alt_src);
    } catch(e) {
        $("#code_console").html('<h2>Syntax error '+ts+'</h2><pre>'+e+'</pre> while compiling <pre>function f(sample_input) {\n'+alt_src+'\n}</pre>');
        return;
    }

    // run
    var user_output;
    try {
        user_output = fct(sample_input);
    } catch(e) {
        $("#code_console").html('<h2>Execution error '+ts+'</h2><pre>' + e + '</pre>');
        return;
    }

    code_validate_output(user_output, sample_output, ts);
}


// https://github.com/pypyjs/pypyjs-release/blob/master/README.rst

var code_init_pypyjs_interpreter_started = false;
var code_init_pypyjs_interpreter_complete = false;
function code_init_pypyjs_interpreter() {
    code_init_pypyjs_interpreter_started = true;
    pypyjs.stdout = pypyjs.stderr = function(data) {
        console.log('pypyjs:', data);
    }

    // Display a helpful message and twiddle thumbs as it loads.
    pypyjs.stdout("PyPy.js loading..");

    pypyjs.ready()
    .then(function() {
        pypyjs.stdout('PyPy.js loaded.');
        code_init_pypyjs_interpreter_complete = true;
    }).then(null, function(err) {
        alert('ERROR code_init_pypyjs_interpreter: ' + err);
        console.error('ERROR code_init_pypyjs_interpreter: ' + err);
    });
};

function code_pypyjs_try(editor) {
    var ts = '<span style="font-size: small;">('+ new Date().toTimeString().substr(0,8) +')</span> ';
    var src = editor.getValue();
    var sample_input = read_objects_from_id("sample_input"),
        sample_output = read_objects_from_id("sample_output");


    pypyjs.ready().then(function() {
        return pypyjs.set('sample_input', sample_input);
    }).then(function(v) {
        return pypyjs.exec(src);
    }).catch(function(e) {
         if (e!==null)
            $("#code_console").html('<h2>Syntax error '+ts+'</h2><pre>'+e+'</pre> while compiling <pre>'+src+'</pre>');
        return Promise.reject(null);
    }).then(function() {
        if (!code_info) 
            // getting main function
            return pypyjs.get("main");
    }).then(function(fct) {
        if (code_info)
            return pypyjs.exec("res = "+code_info.skeleton_code.function_name+"(sample_input)");
        if (fct)
            return pypyjs.exec("res = main()");
    }).catch(function(e) {
        if (e!==null)
            $("#code_console").html('<h2>Execution error '+ts+'</h2><pre>' + e + '</pre>');
        return Promise.reject(null);
    }).then(function(v) {
        return pypyjs.get("res")
    }).then(function(v) {
        var user_output = v;
        code_validate_output(user_output, sample_output, ts);
    }).catch(function(e) {
        if (e!==null)
            $("#code_console").html('<h2>Unhandled error '+ts+'</h2><pre>' + e + '</pre>');
        return Promise.reject(null);
    });
}


function code_validate_output(user_output, sample_output, ts) {
    var html_short;
    if (sample_output) {
        // check
        var validated = JSON.stringify(user_output)==JSON.stringify(sample_output);

        // display check summary
        html_short = '<h2>Validation '+ts+'</h2>' + (validated ?
            '<p style="color: #12AD2A;">validated with sample input.</p>' :
            '<p style="color: #B3000C;">NOT validated (compare output below).</p>' );
    } else {
        html_short = "";
        if (user_output==null || user_output==undefined) {
            var lang = $("#language").val();
            html_short = lang=="js"
                ? '<em style="color:red;">add a <tt>return</tt> statement at the end of your code to display a result</em>'
                : '<em style="color:red;">define a <tt>main</tt> function in your code</em>';
        }
        
    }

    var html = '<h2>Execution output '+ts+'</h2><pre>' + stringify_objects(user_output) + '</pre>';

    $("#code_console").html(html_short);
    $("#user_output").html(html);

}

function code_generate_test() {
    var f = code_info.test_data_generate;
    var test_data = f();
    if (test_data.input)  $("#sample_input").text(stringify_objects(test_data.input));
    if (test_data.output)  $("#sample_output").text(stringify_objects(test_data.output));
}
function code_next(incr) {
    var n = code_info.test_data.length;
    var curr = $("#sample_curr").text()*1 - 1;
    var next = (curr + incr + n) % n;
    var test_data = code_info.test_data[next];
    $("#sample_curr").text(""+(next+1));
    if (test_data.input!==undefined)  $("#sample_input").text(stringify_objects(test_data.input));
    if (test_data.output!==undefined)  $("#sample_output").text(stringify_objects(test_data.output));
}

function stringify_objects(o) {
    return typeof o == "object" ? JSON.stringify(o,null,4) : o;
}

function read_objects_from_id(id) {
    var o;
    try {
        o = $("#"+id).text();
        o = JSON.parse(o);
    } catch(e) {}
    return o;
}
