
var sql_worker, sql_worker_count=0;
function sql_init() {
    // textarea and buttons
    var html = ''
        + '<p>SQL query: <em>your input</em></p>'
        + '<textarea id="sql_textarea" style="width:95%; height:100px;"></textarea>'
        + '<pre id="sql_error"></pre>'
        + '<div style="text-align: right;">'
        + '  <input id="sql_try" type="submit" value="Try" >'
        + '</div>';
    $("#sql_div").html(html);
    $("#sql_try").click(sql_try);
    
    // start a background worker for SQLite
    var worker_path = "https://kripken.github.io/sql.js/js/worker.sql.js";
    var worker_path = "worker.sql.js"; // CORS
    sql_worker = new Worker(worker_path);
    // open a database (async)
    sql_worker_promise({action:'open'})
    .catch(e => console.error("sql_init", e)); 
}


function sql_worker_promise(msg) {
    return new Promise(function(resolve, reject) {
		var id = "#"+(sql_worker_count++)+" "+new Date().toISOString();
        msg.id = id; 

        sql_worker.onmessage = function(event) {
            console.log("sql_worker_promise", msg, event.data);
			if (event.data.id!=id) {
                console.warn("a previous call to sql_worker_promise was made without await, discard this result\n")
                return;
            }
			
            var results = event.data.results;
            resolve(results);
        }
        sql_worker.onerror = function(event) {
            console.error("sql_worker_promise", msg, event);
            reject(event.message);
        }
        sql_worker.postMessage(msg);
    });
}

function sql_add_tables(data) {
    var sql_cmds = "";
    for (var table_name in data) {
		// add table to HTML
        var html = '<p>Table: <tt>'+table_name+'</tt><div id="sql_table_'+table_name+'"></div></p>';
        $("#quiz").append(html);

        var container = document.getElementById("sql_table_"+table_name);
        var table_data = data[table_name];
        var table_header = table_data.shift();
        var hot = new Handsontable(container, {
            data: table_data,
            colHeaders: table_header,
            rowHeaders: true
            });
        
        // add table to SQLite DB (async)
        sql_cmds += "DROP TABLE IF EXISTS "+table_name+";\n"
        sql_cmds += "CREATE TABLE "+table_name+" (" + table_header.join(",") + ");\n";
        for (var i=0; i<table_data.length; i++) {
            var row_data = table_data[i];
            // !! SQL injection !!
            var row_data_str = row_data.map(x => (typeof x == "number") ? x : ('"'+x+'"')).join(', ');
            sql_cmds += "INSERT INTO "+table_name+" VALUES ( " + row_data_str + " );\n";
        }
    }
    
    var html = '<div id="sql_user_output"></div>';
    $("#quiz").append(html);
    
    sql_worker_promise({action:'exec', sql: sql_cmds })
    .catch(e => console.error("sql_add_tables", e)); ;
}


function sql_try() {
    // clear previous errors
    $("#sql_error").empty();
    
    // try executing user statement
    var sql_cmd = $("#sql_textarea").val();
    sql_worker_promise({action:'exec', sql: sql_cmd })
    .then(res => { 
        console.log("sql_try", res); 

        var data = res[0];
        if (!data) return;
        var table_data = data.values;
        var table_header = data.columns;

        var html = '<p>Table: <em>your output</em><div id="sql_table_user_output"></div></p>';
        $("#sql_user_output").empty().append(html);

        var container = document.getElementById("sql_table_user_output");
        var hot = new Handsontable(container, {
            data: table_data,
            colHeaders: table_header,
            rowHeaders: true
            });
    })
    .catch(e => { 
        //console.error("sql_try", e);
        sql_error(e);
    });

}

function sql_error(err) {
    console.log("sql_error", err);
    var ts = '<span style="font-size: small;">('+ new Date().toTimeString().substr(0,8) +')</span> ';
    $("#sql_error").html('<h2>Syntax error '+ts+'</h2><pre>'+err+'</pre>');
}