/*
	Author: Claude Cochet
	Creation date : 2009-08-08
*/

// List of headers to read (should read this from extra argument on the command line).
var headers_base = [ 
	"xll\\xll_export_base.h",
	"xll\\xll_export_extra.h",
	"xll\\xll_export_ticker.h",
	"base\\sqliteutils.h",
	"base\\datadictutilstest.h",
	"base\\memcached\\memcacheutils.h"
	];
var headers_numerics = [ 
	"numerics\\routines\\numerics_edp_1d.h",
	"numerics\\routines\\numerics_interpolation.h", 
	"numerics\\routines\\numerics_linalg.h", 
	"numerics\\routines\\numerics_qp.h",
	"numerics\\routines\\numerics_solver_simplex.h",
	"numerics\\routines\\numerics_special_fcts.h"
	];

var headers = [].concat(headers_base, headers_numerics);

// types that don't have 'to_dict' method defined 
// AND aren't stored in depot (e.g. they are immediate value, directly translated form XlOper/native types) 
var no_dict_no_depot_types = [
	"double", "float", "int", "uint", "long", "date", "bool", "string", 
	"dvector", "ivector", "datevec", "svector", "bvector",
	"dmatrix", "darray1", "darray2", "imatrix", "iarray1", 
	"IDictionaryPtr", "XLOper", "AnyVal", "AnyVectVectPtr"
	];

// types that don't have 'to_dict' method defined 
// BUT can be stored as shared pointer in depots
var no_dict_depotable_types = [
	"AnyVectVect" ];
	
// merged of the above
var no_dict_types = [].concat(no_dict_no_depot_types, no_dict_depotable_types);

var fs = new ActiveXObject("Scripting.FileSystemObject"); 
var scriptPath = fs.GetFile(WScript.ScriptFullName).ParentFolder
eval(fromFile(fs,scriptPath+"\\lexer.js"));
//eval(fromFile(fs,scriptPath+"\\..\\..\\..\\Tools\\SrcCtrl\\json.js"));

var re_id = /[a-zA-Z~][\w_:.<>]*[&\*]*/;
var re_keywords = /namespace|const|public|private|protected|mutable/;
var re_bloccomment = /\/\*.*\*\//;
var re_comment = /\/\/.*\n/;
var re_preproc = /#.*\n/;
var re_typedef = /(typedef|using)\s*[^;}]*;/;
var re_struct = /(struct|class|enum)/;
var re_linkage = /[A-Z]*API/;

// (a|ab|b) is not greedy so "ab" will be captured as "a", that's why "typedef" is before "id" and "comment" is before "op" which includes "/"
var re_hdrs_source = "^\\s*(" + re_string.source + "|" 
	+ re_typedef.source + "|" + re_struct.source + "|" 
	+ re_linkage.source + "|" + re_id.source + "|" 
	+ re_bloccomment.source + "|" + re_comment.source + "|" + re_op.source + "|" 
	+ re_number.source + "|" + re_keywords.source + "|" + re_preproc.source + ")";
var re_hdrs = new RegExp(re_hdrs_source);

function tokenizer_hdrs(txt)
{
	if (re_bloccomment.test(txt))
		return { type:"bloccomment", value:txt};
	if (re_comment.test(txt))
		return { type:"comment", value:txt};
	if (re_typedef.test(txt))
		return { type:"typedef", value:txt};
	if (re_struct.test(txt))
		return { type:"struct", value:txt};
	if (re_preproc.test(txt))
		return { type:"preproc", value:txt};
	if (re_string.test(txt))
		return { type:"string", value:txt};
	if (rx_number.test(txt))
		return { type:"number", value:parseFloat(txt)};
	if (re_linkage.test(txt))
		return { type:"linkage", value:txt};	// linkage must be done before ids
	if (re_keywords.test(txt))
		return txt;	// keywords must be done before ids
	if (re_id.test(txt))
		return { type:"id", value:txt};
	return txt;
}

var header_rules = [
	{ lhs : "$S", 	rhs : [ "program", "eof" ] },
	{ lhs : "program", rhs : [ "stmts" ] },
	{ lhs : "stmts", 	rhs : [ "stmt" ] },
	{ lhs : "stmts", 	rhs : [ "stmts", "stmt" ] },
	
	{ lhs : "stmt", 	rhs : [ "#include", "string" ] },
	{ lhs : "stmt", 	rhs : [ "comment" ] },
	{ lhs : "stmt", 	rhs : [ "id", "id", "(", ")", ";" ] },
	{ lhs : "stmt", 	rhs : [ "id", "id", "(", "prms", ")", ";" ] },
	{ lhs : "stmt", 	rhs : [ "struct", "id", ";" ] },
	{ lhs : "stmt", 	rhs : [ "struct", "id", "curly_bloc" ] },
	{ lhs : "stmt", 	rhs : [ "struct", "id", ":", "prms", "curly_bloc" ] },
	
	{ lhs : "prms", 	rhs : [ "prms", "prm" ] },
	{ lhs : "prms", 	rhs : [ "prm" ] },
	
	{ lhs : "prm", 	rhs : [ "id", "id" ] },
	{ lhs : "prm", 	rhs : [ "id", "id", "comment" ] },
	{ lhs : "prm", 	rhs : [ "id", "id", "," ] },
	{ lhs : "prm", 	rhs : [ "id", "id", ",", "comment"] },
	{ lhs : "prm", 	rhs : [ "id", "id", ",", "comment", "comment"] },
	{ lhs : "prm", 	rhs : [ "id", "&", "id" ] },
	{ lhs : "prm", 	rhs : [ "id", "&", "id", "," ] },
	
	{ lhs : "curly_bloc", 	rhs : [ "{", "curly_elnts", "}", ";" ] },
	{ lhs : "curly_bloc", 	rhs : [ "{", "}", ";" ] },
	{ lhs : "curly_elnts", 	rhs : [ "curly_elnts", "curly_elnt" ] },
	{ lhs : "curly_elnts", 	rhs : [ "curly_elnt" ] },
	//{ lhs : "curly_elnt", 	rhs : [ "stmt" ] },
	{ lhs : "curly_elnt", 	rhs : [ "comment" ] },
	{ lhs : "curly_elnt", 	rhs : [ "struct", "id", "curly_bloc" ] },
	{ lhs : "curly_elnt", 	rhs : [ "id" ] },
	{ lhs : "curly_elnt", 	rhs : [ "number" ] },
	{ lhs : "curly_elnt", 	rhs : [ "string" ] },
	{ lhs : "curly_elnt", 	rhs : [ "(" ] },
	{ lhs : "curly_elnt", 	rhs : [ ")" ] },
	{ lhs : "curly_elnt", 	rhs : [ "=" ] },
	{ lhs : "curly_elnt", 	rhs : [ "*" ] },
	{ lhs : "curly_elnt", 	rhs : [ "," ] },
	{ lhs : "curly_elnt", 	rhs : [ ":" ] },
	{ lhs : "curly_elnt", 	rhs : [ ";" ] },
	{ lhs : "curly_elnt", 	rhs : [ "curly_bloc" ] }
]; 

// WScript.Quit(1) reports any error (cscript will not set ErrorLevel otherwise)
//try {
	hdr_export();
//} catch(e) { WScript.Quit(1); }

function hdr_export()
{
	var args = WScript.Arguments.Unnamed;
	var hdr_folder = args.length>0 ? args(0) : fs.GetParentFolderName(WScript.scriptFullName)+"\\..\\..\\..\\Xll";
	var xll_file = args.length>1 ? args(1) : "xll/xll_export_auto";
	var xpy_file = args.length>2 ? args(2) : "xll/xpy_export_auto";
	info_msg("header root folder : "+hdr_folder);
	
	var lr0 = build_lr0(header_rules);
	//var dot = textify_lr0(lr0);
	
	//info_msg("Regexp: "+re_hdrs.source+".");
	
	// xll export variables
	var xll_export_conv_from_xloper = [], xll_export_conv_to_xloper = [];
	var xll_export_source = "";
	
	// xpy export variables
	var xpy_export_conv_from_pyobj = [], xpy_export_conv_to_pyobj = [];
	var xpy_export_source = "";
	
	for (var h=0; h<headers.length; h++) 
	{
		var hdr = fs.GetAbsolutePathName(hdr_folder) + "\\" + headers[h];
		info_msg("Header "+hdr+".");
		var txt = fromFile(fs, hdr);
		
		var tokens = lexer(txt, re_hdrs, tokenizer_hdrs);
		tokens = remove_tokens(tokens, [ "const", "&", "preproc", "typedef", "public", "private", "protected", "mutable", "linkage", "bloccomment" ]);	// these qualifiers are transparent fromt he caller point of view
		if (tokens.length==0) continue; 
		//show_tokens(tokens);
		
		var stack = run_automaton(tokens, lr0);
		convert_statevecofsize1_into_state(stack); 
		compact_collections(stack, [ "stmts", "prms" ]);
		var root = stack;
		
		var fcts = hdr_export_read(root);
		
		// xll export update
		xll_list_conversions(fcts, xll_export_conv_from_xloper, xll_export_conv_to_xloper);
		xll_export_source += xll_export_fcts(fcts);
		
		// xpy export update
		//xpy_list_conversions(fcts, xpy_export_conv_from_pyobj, xpy_export_conv_to_pyobj);
		xpy_export_source += xpy_export_fcts(fcts);
		
		info_msg("");
	}
	
	// xll export: write result to file
	xll_export_conv_from_xloper.sort(); xll_export_conv_to_xloper.sort();
	var xll_export_includes = xll_export_hdrs(headers);
	var xll_export_incl_convs = xll_export_conversions(xll_export_conv_from_xloper, xll_export_conv_to_xloper);
	var xll_export_srce_convs = xll_export_conversions_using_dict(xll_export_conv_from_xloper, xll_export_conv_to_xloper);
	
	var xll_export_file = hdr_folder + "\\" + xll_file;
	toFile(fs, xll_export_file+".h",    "#pragma once\n#include \"xll_export.h\"\n" + xll_export_includes + "\n" 
	    + "// Excel 97 XLOper \n\n" + xll_export_incl_convs 
	    + "// Excel 2007 XLOper \n\n" + xll_export_incl_convs.replace(/XLOper/g, "XLOper12"));
	toFile(fs, xll_export_file+".cpp", 	"#include \"xll_export.h\"\n#include \""+xll_file+".h\"\n\n" 
		+ "// Excel 97 XLOper<->struct using dict \n\n" + xll_export_srce_convs 
		+ "// Excel 2007 XLOper<->struct using dict \n\n" +  xll_export_srce_convs.replace(/XLOper/g, "XLOper12") 
		+ "\n\n" + xll_export_source);
	
	// xpy export: write result to file
	var xpy_export_includes = xll_export_hdrs(headers);
	var xpy_export_incl_convs = xll_export_incl_convs.replace(/xloper/g, "xpyobj").replace(/const XLOper&/g, "/*const*/ PyObject*").replace(/XLOper&/g, "PyObject*&");
	var xpy_export_srce_convs = xll_export_srce_convs.replace(/xloper/g, "xpyobj").replace(/const XLOper&/g, "/*const*/ PyObject*").replace(/XLOper&/g, "PyObject*&");
	var xpy_export_file = hdr_folder + "\\" + xpy_file;
	toFile(fs, xpy_export_file+".h",    "#pragma once\n#include \"xpy_export.h\"\n" +xpy_export_includes + "\n" + xpy_export_incl_convs );
	toFile(fs, xpy_export_file+".cpp", 	"#include \"xpy_export.h\"\n#include \""+xpy_file+".h\"\n\n" 
		+ xpy_export_srce_convs + "\n\n" + xpy_export_source);
	
	info_msg("Done");
}

function show_tokens(tokens)
{
	info_msg("");
	for (var t=0; t<tokens.length; t++)
		info_msg(t+" > "+tokens[t]+" > "+tokens[t].type+" > "+tokens[t].value);
	info_msg("");
}
function remove_tokens(tokens, to_remove)
{
	var new_tokens = [];
	for (var t=0; t<tokens.length; t++)
	{
		var tok = tokens[t];
		if (belongsTo(tok, to_remove))
			continue;
		if (belongsTo(tok.type, to_remove))
			continue;
		if (belongsTo(tok.value, to_remove))
			continue;
		new_tokens.push(tok);
	}

	info_msg("remove_tokens : "+tokens.length+" -> "+new_tokens.length);
	return new_tokens;
}

function hdr_export_read(root)
{
	var fcts = [];
	var stmts = root[1].value;
	var meta = {};  // meta data as key value
	var reOptional = /^[ /<]*optional/i; // matches optional at the beginning of argument description
	var reOptional = /optional/i; // matches optional anywhere in the argument description
	
	
	//info_msg(textify_tree(stmts));
	
	// stack is an array of states
	for (var s in stmts) {
		var stmt = stmts[s].value;
		//info_msg(stmt.toJSONString());
		
		if (stmt.type=="comment") {
			hdr_export_read_meta_comment(meta, stmt.value);
			continue; }
		// if line below fails, edit header to have more than one statement (eg. add a comment to the exported function).
		if (stmt[0].value=="#include") 
			continue;
		if (stmt[0].value.type=="struct") // struct / class / enum
			continue;
		
		//assert(stmt[0].value.type == "id", "...");
		var ret_type = stmt[0].value.value;
		var fct_name = stmt[1].value.value;
		var args = stmt[3].value;
			
		var fct = { 
			name : fct_name, 
			type : ret_type, 
			desc : meta.desc!=undefined ? meta.desc : "", 
			rtrn : [] , 
			args : [] };	
	
		if (meta.returns!=undefined) {
			fct.rtrn = meta.returns.split(",");
			for (var r=0; r<fct.rtrn.length; r++)
				fct.rtrn[r] = fct.rtrn[r].replace(/^\s*/g, "").replace(/\s*$/g, ""); 	// trim spaces  
		}
		info_msg("Function: "+fct.name+",\ttype: "+fct.type+",\treturns '"+fct.rtrn+"',\tdesc: '"+fct.desc+"'.");
		
		if (args.length!=undefined)				// we have one or more argument
			if (args[0].value.length==undefined)	// we have one argument only; put it in an array
				args = [ { value : args } ];
		
		var bSubsequentArgsAreOutput = false;
		var re_output = /.*output.*/;
		for (var a in args) {
			var arg = args[a].value;
			
			var arg_type = arg[0].value.value;
			var arg_name = arg[1].value.value;
			var arg_desc = arg.length>3 ? arg[3].value.value : "";
			arg_desc = arg.length>2 ? (arg[2].value!="," ? arg[2].value.value : arg_desc) : "";
			arg_desc = arg_desc.substr(0,4)=="///<" ? arg_desc.substr(4) : arg_desc.substr(3);
			arg_desc = arg_desc.replace(/^\/+|^\s+|\s+$/g, '');
			var arg_opt = reOptional.test(arg_desc);
			
			fct.args.push( { name : arg_name, type : arg_type, desc : arg_desc, isOptional : arg_opt } );
			
			if ( bSubsequentArgsAreOutput )
				fct.rtrn.push(arg_name);
			
			if ( re_output.test(arg_desc) || (arg.length>4 && re_output.test(arg[4].value.value)) ) {
				bSubsequentArgsAreOutput = true;
				info_msg("found 'output' comment => subsequent args are output ("+arg_desc+" / "+arg[4]+").");
			}
			
			//var arg = fct.args[fct.args.length-1];
			//info_msg("Arg: "+arg.name +",\ttype: "+ arg.type +",\tdesc: "+ arg.desc);
		}
		
		
		if (meta.exported == undefined)
			fcts.push(fct);
		
		// reset meta data that should be local to ONE function.
		meta.desc = undefined;
		meta.returns = undefined;
		meta.exported = undefined;
	}
	
	return fcts;
}

function hdr_export_read_meta_comment(meta, comment)
{
	if (comment.substr(0,3)!="///") {
		//info_msg("Skipping comment (no meta-info).\t"+comment);
		return; }
		
	comment = comment.substr(0,4)=="///<" ? comment.substr(4) : comment.substr(3);
	comment = comment.replace(/^\s*/g, "").replace(/\s*$/g, "");    // trim spaces
	
	var keyvals = comment.split(":");
	if (keyvals.length==2) 
	{
		var key = keyvals[0];
		var val = keyvals[1];
		key = key.replace(/ /g, "");		// remove all space
		val = val.replace(/^\s*/g, "").replace(/\s*$/g, "");		// trim spaces
		info_msg("Added meta-info, key:"+key +",\tvalue:"+val+".");
		meta[key] = val;
	}
	else
	{
		if (meta["desc"]==undefined)
			meta["desc"] = ""
		meta["desc"] = meta["desc"] + (meta["desc"]!=""?" ":"") + comment;
	}
}

function remove_ns(id, keep_ptr)
{
	if (keep_ptr==undefined)
		keep_ptr = false;
	
	var tmp = String(id)
	var tmp = tmp.indexOf("::") < 0 ? tmp : tmp.split("::")[1];
	tmp = tmp.replace(/[<>&]/g, "")
	if (!keep_ptr)
		tmp = tmp.replace(/[\*]/g, "")
	return tmp;
}
function is_arg_out_multiple(fct)
{
	return fct.rtrn.length > 1;
}
function is_arg_out(fct, a)
{
	if (!belongsTo(fct.args[a].name,fct.rtrn))
		return false;
	
	//info_msg("Argument "+fct.args[a].name+" is return value of "+fct.name+" export (because rtrn is "+fct.rtrn+").");
	return true;
}
function get_arg_out_type(fct, r)
{
	if (r==undefined) {
		if (fct.rtrn.length!=1)
			throw new Error("get_arg_out_type: called with no arg out id.");
		r = 0;;
	}
	
	var arg_out_id = fct.rtrn[r]
	for (var a=0; a<fct.args.length; a++) 
		if (fct.args[a].name == arg_out_id)
			return fct.args[a].type;
	throw new Error("get_arg_out_type: fct '"+fct.name+"' couldn't find arg :'"+arg_out_id+"'.");
	return "";
}

function xll_export_hdrs(headers)
{
	var xport = "";
	for (var h=0; h<headers.length; h++) {
		// Don't include Excel specific headers
		if (/.*Xl.*/i.test(headers[h]))
			continue;
		xport += "#include \""+headers[h]+"\"\n";
	}
	return xport + "\n";
}
function xll_list_conversions(fcts, xport_conv_from_xloper, xport_conv_to_xloper, meta)
{
	for (var f=0; f<fcts.length; f++) {
		if (fcts[f].type!="void")
		{
			var arg_type = remove_ns(fcts[f].type);
			if (!belongsTo(arg_type, xport_conv_to_xloper))
				xport_conv_to_xloper.push(arg_type);
		}
		for (var a=0; a<fcts[f].args.length; a++) {
			var arg_type = remove_ns(fcts[f].args[a].type);
			
			if (is_arg_out(fcts[f], a))
				if (!belongsTo(arg_type, xport_conv_to_xloper))
					xport_conv_to_xloper.push(arg_type);
			if (!belongsTo(arg_type, xport_conv_from_xloper))
				xport_conv_from_xloper.push(arg_type);
		}
	}
}

function xll_export_conversions(xport_conv_from_xloper, xport_conv_to_xloper)
{
	var xport = "";
	for (var x=0; x<xport_conv_to_xloper.length; x++) {
		var arg_type = xport_conv_to_xloper[x];
		var to_oper = "void "+arg_type+"_2_xloper\t( const "+arg_type+"& res,\tXLOper& xres,\tconst char*fct );\n";
		xport = xport + to_oper;
	}
	xport = xport + "\n"
	for (var x=0; x<xport_conv_from_xloper.length; x++) {
		var arg_type = xport_conv_from_xloper[x];
		var from_oper = "void xloper_2_"+arg_type+"\t( const XLOper& xarg, "+arg_type+"& arg,\tconst char*fct, const char*name );\n";
		xport = xport + from_oper;
	}
	return xport + "\n";
}
function xll_export_conversions_using_dict(xport_conv_from_xloper, xport_conv_to_xloper)
{
	var xport = "";
	
	xport_dict = [];
	for (var x=0; x<xport_conv_to_xloper.length; x++)
		xport_dict.push(xport_conv_to_xloper[x]);
	for (var x=0; x<xport_conv_from_xloper.length; x++)
		xport_dict.push(xport_conv_from_xloper[x]);
	xport_dict.sort();
	
	for (var x=0; x<xport_dict.length; x++)
		if (!belongsTo(xport_dict[x], no_dict_types)) 
			xport = xport + "void to_dict(PtrDictionary& d, "+xport_dict[x]+"& x);\n";
	xport = xport + "\n"
	
	for (var x=0; x<xport_conv_to_xloper.length; x++) {
		var arg_type = xport_conv_to_xloper[x];
		var to_oper = "void "+arg_type+"_2_xloper\t( const "+arg_type+"& res,\tXLOper& xres,\tconst char*fct ) \n"
			+  "{\n"
			+  "	struct_2_xloper(res, xres, fct);\n"
			+  "}\n";
		if (!belongsTo(arg_type, no_dict_types)) 
			xport = xport + to_oper;
	}
	xport = xport + "\n"
	for (var x=0; x<xport_conv_from_xloper.length; x++) {
		var arg_type = xport_conv_from_xloper[x];
		var from_oper = "void xloper_2_"+arg_type+"\t( const XLOper& xarg, "+arg_type+"& arg,\tconst char*fct, const char*name ) \n"
			+  "{\n"
			+  "	xloper_2_struct(xarg, arg, fct, name);\n"
			+  "}\n";
		if (!belongsTo(arg_type, no_dict_types)) 
			xport = xport + from_oper;
	}
	return xport + "\n";
}

function xll_export_fct_outputs(fct_name, fct)
{
	if (fct.rtrn.length<2) return ""; 	// nothing to do, no multiple output
	
	// define output struct
	var txt = "struct "+fct_name+"_outputs \n{\n";
	for (var r=0; r<fct.rtrn.length; r++)
		txt += "	"+get_arg_out_type(fct, r).replace(/[&*]/g, "")+"	"+fct.rtrn[r]+";\n";
	txt += "};\n";
	
	// define to_dict
	txt += "void to_dict(PtrDictionary& d, "+fct_name+"_outputs& x) \n{\n"
	for (var r=0; r<fct.rtrn.length; r++) {
		var arg_type = remove_ns(get_arg_out_type(fct,r));
		var arg_desc = "";
		if (belongsTo(arg_type, no_dict_types)) {
			txt += "	Add(d, \""+fct.rtrn[r]+"\", &x."+fct.rtrn[r]+", \""+arg_desc+"\");\n";
		} else {
			txt += "	//to_dict(d, \""+fct.rtrn[r]+"\", x."+fct.rtrn[r]+");\n";
			txt += "	to_dict(d, x."+fct.rtrn[r]+");\n";
		}
	}	
	txt += "}\n\n";
	
	// define export to Excel
	txt += "void "+fct_name+"_outputs_2_xloper(const "+fct_name+"_outputs& res_, XLOper& xres, const char*fct) \n{\n"
	txt += "	struct_2_xloper(res_, xres, fct);\n"	
	txt += "}\n\n";
	
	txt += "void "+fct_name+"_outputs_2_xloper(const "+fct_name+"_outputs& res_, XLOper12& xres, const char*fct) \n{\n"
	txt += "	struct_2_xloper(res_, xres, fct);\n"	
	txt += "}\n\n";
	
	txt += "// --------------------------- \n\n";
	return txt;
}

function xll_export_fcts(fcts)
{
	var xport = "";
	for (var f=0; f<fcts.length; f++) {
		var fct = fcts[f];
		var prefix = "Xl";
		// strip namespace if any
		var fct_name = fct.name.indexOf("::") < 0 ? fct.name : fct.name.split("::")[1]; 
		var xport_fct_name = (fct_name.substr(0,prefix.length)==prefix?"":prefix)
			+ fct_name.substr(0,1).toUpperCase() + fct_name.substr(1);
		
		var txt = "// ---------------------------------------------------------------------------- \n\n";
		
		txt += xll_export_fct_outputs(fct_name, fct);
				
		txt += "namespace { \n";
		txt += "static XLFunc xl_"+fct_name+"( \n";
		txt += "	"+(is_xloper_fct(fct)==0?"\"Xl"+fct_name+"\""  :(is_xloper_fct(fct)==4?"\"Xl"+fct_name+"\"":"0"))+",";
		txt += "	"+(is_xloper_fct(fct)==0?"\"Xl"+fct_name+"12\"":(is_xloper_fct(fct)==12?"\"Xl"+fct_name+"\"":"0"))+","; 
		txt += "	\"P"; 
		for (var a=0; a<fct.args.length; a++) 
			if (!is_arg_out(fct, a))
				txt += "P"
		txt += "\", \n";
		txt += "	\""+xport_fct_name+"\", \"";
		var txt_list = ""
		for (var a=0; a<fct.args.length; a++) 
			if (!is_arg_out(fct, a))
				txt_list += (txt_list==""?"":",") + (fct.args[a].isOptional?"[":"") + fct.args[a].name + (fct.args[a].isOptional?"]":"")
		txt += txt_list + "\",\n";
		txt += "	1.0, Category, \"\", HelpFile, \n";
		txt += "	\""+fct.desc+"\"";
		for (var a=0; a<fct.args.length; a++) 
			if (!is_arg_out(fct, a))
				txt += ",\n	\""+fct.args[a].desc+"\""; 
		txt += ");\n}\n\n";

        var ver = is_xloper_fct(fct);
        if ( ver==0 || ver==4 ) {
            txt = xll_export_fct_cpp(txt, fct_name, fct, "");
            txt = xll_export_fct_seh(txt, fct_name, fct, "");
        }
        if ( ver==0 || ver==12 ) {
            txt = xll_export_fct_cpp(txt, fct_name, fct, "12");
            txt = xll_export_fct_seh(txt, fct_name, fct, "12");
		}		
		
		//info_msg(txt);
		xport += txt;
	}
	
	return xport;
}

function is_xloper_fct(fct) {
    if (remove_ns(fct.type).toUpperCase()=="XLOPER") return 4;
    for (var a=0; a<fct.args.length; a++)
	    if (remove_ns(fct.args[a].type).toUpperCase()=="XLOPER") return 4;
    
	if (remove_ns(fct.type).toUpperCase()=="XLOPER12") return 12;
    for (var a=0; a<fct.args.length; a++)
	    if (remove_ns(fct.args[a].type).toUpperCase()=="XLOPER12") return 12;
    
    return 0;
}

function xll_export_fct_cpp(txt, fct_name, fct, xl_ver) 
{
	// SECOND LAYER : catches C++ exceptions
	txt += "const XLOper"+xl_ver+"* XLLSEH"+fct_name+"(";
	
	var txt_list = ""
	for (var a=0; a<fct.args.length; a++)
		if (!is_arg_out(fct, a))
			txt_list += (txt_list==""?"\n":",\n") + "	const XLOper"+xl_ver+"& xloper_"+ fct.args[a].name;
	txt += txt_list + "\n) {\n";
	
	//txt += "	xll_last_call = \""+fct_name+"\";\n";
	txt += "	if(IsWizard())  return &ErrorNotAvailable"+xl_ver+"; \n\n";
	txt += "	XLL_TRY { \n";
	
	// arguments
	for (var a=0; a<fct.args.length; a++) {
		if (is_arg_out_multiple(fct) && is_arg_out(fct, a))
			continue;
		if (remove_ns(fct.args[a].type).toUpperCase()!="XLOPER") {
			var txt_x2oper 	=  "";
			var case_xloper_2_type = belongsTo(remove_ns(fct.args[a].type),no_dict_no_depot_types);
			var case_xloper_2_rawptr = belongsTo(remove_ns(fct.args[a].type),no_dict_depotable_types);
			var case_xloper_2_struct = !case_xloper_2_type && !case_xloper_2_rawptr;
			if (!is_arg_out(fct, a)) {
				if (case_xloper_2_type) {
					// input, immediate value only
					txt_x2oper 	+= "		" + push_spaces_to_tab_length(remove_ns(fct.args[a].type)+"  ",4);
					txt_x2oper 	+= push_spaces_to_tab_length(fct.args[a].name+";    ",4);
					txt_x2oper 	+= "xloper_2_"+remove_ns(fct.args[a].type)+"(xloper_"+fct.args[a].name+", "+fct.args[a].name+", \""+fct_name+"\", \""+fct.args[a].name+"\"); \n";
				} else if (case_xloper_2_struct) {
					// input, either ticker or description
					txt_x2oper 	+= "		" + push_spaces_to_tab_length(remove_ns(fct.args[a].type)+"  ",4);
					txt_x2oper 	+= push_spaces_to_tab_length(fct.args[a].name+";    ",4);
					txt_x2oper 	+= "xloper_2_struct(xloper_"+fct.args[a].name+", "+fct.args[a].name+", \""+fct_name+"\", \""+fct.args[a].name+"\"); \n";
				} else  {
					/*
					// xloper_2_ptr is a template:
					// retrieve CONST REFERENCE from depot (where it is stored as DataDictinaryPtr/IDictionaryPtr or AnyVectVectPtr)
					// OR construct (from dict except for AnyVectVect) OR convert from range (for xloper)
					const AnyVectVectPtr arg_ptr = xloper_2_ptr(xloper_arg, "XlGet", "arg"); 
					const AnyVectVect&   arg_ref = *arg_ref; 
					*/
					// input, as raw pointer pointing to data owned by shared_ptr in depot
					txt_x2oper 	+= "		" + push_spaces_to_tab_length("const "+remove_ns(fct.args[a].type)+"* ",4);
					txt_x2oper 	+= push_spaces_to_tab_length(fct.args[a].name+"_raw ",4);
					txt_x2oper 	+= "= ticker_2_rawptr<"+remove_ns(fct.args[a].type)+">(xloper_" +fct.args[a].name + "); \n";
					// input, immediate value
					txt_x2oper 	+= "		" + push_spaces_to_tab_length(remove_ns(fct.args[a].type)+"        ",4);
					txt_x2oper 	+= push_spaces_to_tab_length(fct.args[a].name+"_val; ",4);
					txt_x2oper 	+= "if(!"+fct.args[a].name+"_raw) xloper_2_"+remove_ns(fct.args[a].type)+"(xloper_"+fct.args[a].name+", "+fct.args[a].name+"_val, \""+fct_name+"\", \""+fct.args[a].name+"\"); \n";
					// input, reference on one of the two above
					txt_x2oper 	+= "		" + push_spaces_to_tab_length("const "+remove_ns(fct.args[a].type)+"&       ",4);
					txt_x2oper 	+= push_spaces_to_tab_length(fct.args[a].name+"     ",4);
					txt_x2oper 	+= "= "+fct.args[a].name+"_raw ? *"+fct.args[a].name+"_raw : "+fct.args[a].name+"_val; \n";
				}
			} else {
			    // output, immediate value
			    txt_x2oper 	+= "		" + push_spaces_to_tab_length(remove_ns(fct.args[a].type)+" ",4);
			    txt_x2oper 	+= "	    " + push_spaces_to_tab_length(fct.args[a].name+";\n",4);
			}
			txt += txt_x2oper + "\n";
		}
	}
	txt +="\n";
	
	// multiple output struct instance
	if (is_arg_out_multiple(fct)) {
		txt += "		// multiple output\n";
		txt += "		"+fct_name+"_outputs res_;\n";
	}
	
	// function call
	txt += "		"+(fct.type=="void"?"":"const "+fct.type+" res = ")+fct.name+"("
	var txt_list = ""
	for (var a=0; a<fct.args.length; a++) 
		txt_list += (txt_list==""?"":", ") + (remove_ns(fct.args[a].type).toUpperCase()!="XLOPER"?"":"xloper_") 
			+ (is_arg_out_multiple(fct) && is_arg_out(fct, a) ? "res_." : "")+ fct.args[a].name
	txt += txt_list + ");\n\n";
	
	// result
	if (remove_ns(fct.type).toUpperCase()=="XLOPER") 
	{
		txt += "		return res;\n\n";
	} 
	else 
	{
		txt += "		XLOper"+xl_ver+" xloper_res; \n";
	
	    if (fct.rtrn.length>0)
		    if (fct.rtrn.length>1) 
			    txt += "		"+fct_name+"_outputs_2_xloper(res_, xloper_res, \""+fct_name+"\"); \n";
		    else
			    txt += "		"+remove_ns(get_arg_out_type(fct))+"_2_xloper("+fct.rtrn+", xloper_res, \""+fct_name+"\"); \n";
	    else if (fct.type!="void")
		    txt += "		"+remove_ns(fct.type)+"_2_xloper(res, xloper_res, \""+fct_name+"\"); \n";
    	
	    txt += "		return return_xloper_raw_ptr(xloper_res); \n";
	}
	
	txt += "	} XLL_CATCH"+xl_ver+" \n\n";
	txt += "}\n\n";
	return txt;
}
function xll_export_fct_seh(txt, fct_name, fct, xl_ver) 
{
	// FIRST LAYER : catches SEH exceptions
	
	txt += "XLL_API\n"
	txt += "const XLOper"+xl_ver+"* Xl"+fct_name+xl_ver+"(";
	
	var txt_list = ""
	for (var a=0; a<fct.args.length; a++)
		if (!is_arg_out(fct, a))
			txt_list += (txt_list==""?"\n":",\n") + "	const XLOper"+xl_ver+"& xloper_"+ fct.args[a].name;
	txt += txt_list + "\n) {\n";
	txt += "	XLL_SEH_TRY\n"
	
	// function call
	txt += "		return XLLSEH"+fct_name+"(";
	var txt_list = ""
	for (var a=0; a<fct.args.length; a++) 
		if (!is_arg_out(fct, a))
			txt_list += (txt_list==""?"":", ") + "xloper_"+fct.args[a].name
	txt += txt_list + ");\n";

	txt += "	XLL_SEH_CATCH"+xl_ver+"\n"		
	txt += "}\n\n";
	return txt;
}		

function xpy_export_fcts(fcts)
{
	var xport = "";
	for (var f=0; f<fcts.length; f++) {
		var fct = fcts[f];
		// strip namespace if any
		var fct_name = fct.name.indexOf("::") < 0 ? fct.name : fct.name.split("::")[1]; 
		var xport_fct_name = fct_name.substr(0,1).toUpperCase() + fct_name.substr(1);
		
		// skip Excel functions
		var xl_prefix = "Xl";
		var xl_fct = fct_name.substr(0,xl_prefix.length)==xl_prefix;
		if (xl_fct) continue;
		
		var txt = "", xarg_decl_str = "", xarg_type_str = "|", xarg_ptr_str ="";
		
		for (var a=0; a<fct.args.length; a++) {
			if (!is_arg_out(fct, a)) {
				xarg_decl_str   += "		PyObject *xarg_"+fct.args[a].name+" = NULL;\n";
				xarg_type_str   += "O";
				xarg_ptr_str    += (xarg_ptr_str==""?"":",") + "&xarg_"+fct.args[a].name;
			}
		}
		
		txt += "// ---------------------------------------------------------------------------- \n";
		txt += "// "+fct_name+" \n\n";

		txt += "static PyObject* \n";
		txt += "xpy_"+xport_fct_name+"(PyObject *self, PyObject *args) \n";
		txt += "{\n";
		txt += "	XPY_TRY { \n";
		txt +=         xarg_decl_str + "\n";
		txt += "		if (!PyArg_ParseTuple(args,\""+xarg_type_str+"\","+xarg_ptr_str+"))\n"
		txt += "			return NULL;\n\n";
		
		// arguments
		for (var a=0; a<fct.args.length; a++) {
			txt += "		"+remove_ns(fct.args[a].type)+"\t"+fct.args[a].name+";\t\t";
			if (!is_arg_out(fct, a))
				txt += "		xpyobj_2_"+remove_ns(fct.args[a].type)+"(xarg_"+fct.args[a].name+", "+fct.args[a].name+", \""+fct_name+"\", \""+fct.args[a].name+"\");";
			txt +="\n";
		}
		
		// function call
		txt += "		"+(fct.type=="void"?"":fct.type+" res = ")+fct.name+"("
		var txt_list = ""
		for (var a=0; a<fct.args.length; a++) 
			txt_list += (txt_list==""?"":",") + fct.args[a].name
		txt += txt_list + ");\n\n";
		
		// result
		txt += "		PyObject *xres; \n";
		if (fct.rtrn.length>0)
			if (fct.rtrn.length>1) {
				txt += "		// multiple output (return a tuple)\n";
				txt += "		xres = PyTuple_New("+fct.rtrn.length+");\n";
				for (var r=0; r<fct.rtrn.length; r++) {
					txt += "		{\n";
					txt += "			PyObject *xtmp = 0;\n";
					txt += "			"+remove_ns(get_arg_out_type(fct,r))+"_2_xpyobj("+fct.rtrn[r]+", xtmp, \""+fct_name+"\"); \n";
					txt += "			int bSuccess = PyTuple_SetItem(xres, "+r+", xtmp);\n";
					txt += "		}\n";
				}
			} else {
				txt += "		// single output\n";
				txt += "		"+remove_ns(get_arg_out_type(fct))+"_2_xpyobj("+fct.rtrn+", xres, \""+fct_name+"\"); \n";
			}
		else if (fct.type!="void")
			txt += "		"+remove_ns(fct.type)+"_2_xpyobj(res, xres, \""+fct_name+"\"); \n";
		else
			txt += "		xres = Py_BuildValue(\"s\", \"ok\");\n";
		
		txt += "		return xres;\n";
		txt += "	} XPY_CATCH \n\n";
		txt += "	return NULL; \n";
		txt += "}\n\n";
		
		txt += "namespace { \n";
		txt += "static XpyFunc xpy_reg_"+xport_fct_name+"( \n";
		txt += "	\""+xport_fct_name+"\",\n";
		txt += "	xpy_"+xport_fct_name+", \n";
		txt += "	\""+fct.desc+"\");\n";
		txt += "}\n\n";
		
		//info_msg(txt);
		xport += txt;
	}
	
	return xport;
}

/*
// repeat the strin 'num' times
String.prototype.repeat = function( num )
{
	return new Array( num + 1 ).join( this );
}
*/

function push_spaces_to_length(txt, len) {
	if (len < txt.length) 
		return txt;
	var n = len-txt.length;
	return txt + (new Array(n+1).join(" "));
}
function push_spaces_to_tab_length(txt, tab_length) {
	if (txt.length%tab_length == 0) 
		return txt;
	var n = 4-(txt.length%tab_length);
	return txt + (new Array(n+1).join(" "));
}

function toFile(fs, filename, txt) {
	var ForWriting = 2;
	var file = fs.OpenTextFile(filename, ForWriting, true);
	file.Write(txt);
}

function fromFile(fs, filename) {
	var ForReading = 1;
	WScript.echo("Loading JS file "+filename+"\n");
	var file = fs.OpenTextFile(filename, ForReading, false);
	var txt = file.ReadAll();
	return txt;
}
