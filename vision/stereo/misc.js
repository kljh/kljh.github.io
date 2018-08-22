
function info_msg(msg) { $("#log").append(msg+"<br/>"); }
function warn_msg(msg) { $("#log").append("<b>"+msg+"</b><br/>"); }

function require(b, msg) { 
	if (!b) {
		debugger;
		throw new Error(msg); 
	}
}

//  ---------------------------------
// from base_tables

function select_row(t,row)  { return t[row]; }
function select_rows(t,rows)  { 
    var r=[],i,n=rows.length;
    for (i=0; i<n; i++) { r.push(t[rows[i]]); }
    return r;
}
function select_col(t,col)  { var v=[],i,n=t.length; for (i=0;i<n;i++) v.push(t[i][col]); return v; }
function select_cols(t, cols)  {
    var r=[],i,j,n=t.length,m=cols.length;
    for (i=0; i<n; i++) { var row=[]; for (j=0; j<m; j++) row.push(t[i][cols[j]]); r.push(row); }
    return r;
}
function select_vals(t,vals)  { return select_rows(t,vals); }

//  ---------------------------------

function hideById(id)
{
    var tmp = document.getElementById(id);
    tmp.style.visibility = "hidden";
	tmp.style.position = "absolute";
	tmp.style.display = "none";
}

function showById(id)
{
    var tmp = document.getElementById(id);
	tmp.style.visibility = "visible";
	tmp.style.position = "relative";
	tmp.style.display = "inline";
}

function toggleById(id)
{
    var tmp = document.getElementById(id);
    if (tmp.style.visibility=="hidden")
        showById(id);
    else
        hideById(id);
}

