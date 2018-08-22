/*
	Author: Claude Cochet
	Creation date : 2009-08-08
*/

//var src = "y = pow(a,5) - 3*7*xy - 5*b; y= 3; z=22";
var tokens; // = lexer(src, re);
var token_pos = 0;			// position of the lookahead terminal
var lr0 = build_lr0(arith_rules);
var stack;


function htmlify_tokens(tokens, token_pos, bHideConsumed)
{
	var html = "";
	for (var i=Math.max(bHideConsumed?token_pos:0, 0); i<tokens.length; i++) {
		var isTypeValue = typeof tokens[i] == "object";
		html = html + "<span class=\"token"+(i<token_pos?" consumed":"")+(i==token_pos?" lookahead":"")+"\"><b>"
			+(isTypeValue?tokens[i].type:tokens[i])+"</b>"+(isTypeValue?" : "+tokens[i].value:"")+"</span> \n";
	}
	return html;
}

function htmlify_bnf(lr0)
{
	var rhs_size = 0;
	for (var r=0; r<lr0.rules.length; r++)
		rhs_size = Math.max(rhs_size, lr0.rules[r].rhs.length)
	
	var html = "";
	html = html + "<table class=\"smart\" border=1 cellspacing=0 cellpadding=3 width=\"40%\" >";
	html = html + "<tr><th>lhs</th><th colspan="+rhs_size+">rhs (max "+rhs_size+")</th></tr>\n";
	for (var r=0; r<lr0.rules.length; r++) {
		html = html + "<tr class=\""+(r%2?"odd":"even")+"\">";
		html = html + "<td><b>"+lr0.rules[r].lhs+"</b></td>";
		for (var i=0; i<lr0.rules[r].rhs.length; i++) {
			var bold = belongsTo(lr0.rules[r].rhs[i], lr0.nonterminals);
			html = html + "<td "+(i==0?"":"style=\"border-left-style:hidden;\"")+">"+(bold?"<b>":"")+lr0.rules[r].rhs[i]+(bold?"</b>":"")+"</td>";
		}
		if (lr0.rules[r].rhs.length<rhs_size)
			html = html + "<td style=\"border-left-style:hidden;\" colspan="+(rhs_size-lr0.rules[r].rhs.length)+"></td>";
		html = html + "</tr>";
	}
	html = html + "</table>\n";
	return html;
}

function htmlify_table(lr0)
{
	var html = "";
	html = html + "<table class=\"smart\" border=1 cellspacing=0 cellpadding=1 width=\"80%\" "
		+"style=\"font-size:smaller;\">";
	html = html + "<tr><th>state</th>\n";
	for (var i=0; i<lr0.terminals.length; i++)
		html = html + "<th>"+lr0.terminals[i]+"</th>";	
	html = html + "\n";
	for (var i=0; i<lr0.nonterminals.length; i++)
		html = html + "<th>"+lr0.nonterminals[i]+"</th>";	
	html = html + "</tr>\n\n";
	
	for (var s=0; s<lr0.actions_goto.length; s++) {
		html = html + "<tr id=\"LrTableState"+s+"\" class=\""+(s%2?"odd":"even")+"\" >";
		html = html + "<td><a href=\"javascript:toggleVisibilityById('divState"+s+"Rules');\">"+s+"</a>\n";
		html = html + "    <div id=\"divState"+s+"Rules\" style=\"position:absolute; visibility:hidden;\" class=\"staterules\"><pre>"+textify_state(s, lr0) +"</pre></div>\n";
		html = html + "</td>";
		for (var i=0; i<lr0.terminals.length; i++)
			html = html + "<td class=\"LrTableAction\" >"+lr0.actions_goto[s][0][i]+"</td>";	
		html = html + "\n";
		for (var i=0; i<lr0.nonterminals.length; i++)
			html = html + "<td class=\"LrTableGoto\" >"+lr0.actions_goto[s][1][i]+"</td>";	
		html = html + "</tr>\n\n";		
	}

	// lr0.rules;
	html = html + "</table>\n";
	return html;
}

function htmlify_statestack(stack)
{
	var html = "";
	
	// stack is an array of states
	for (var i=0; i<stack.length; i++) {
		if (!is_stack_state(stack[i])) 
			error_msg("Stack state expected ("+stack[i].value+")");
			
		var stt = stack[i].state
		var val = stack[i].value;
		var lhs = stack[i].rule_lhs!=undefined ? stack[i].rule_lhs : "";
		
		if (is_stack_state_vect(val))
		{
			html = html + "<div class=\"statetree\">\n";
			
			//html = html + "<i>"+stt+"</i><br/>\n";
			
			if (lhs!="")
				html = html + "<a href=\""+lhs+"\">"+lhs+"</a>\n";
			
			html = html + "<div class=\"children\">\n"
			html = html + htmlify_statestack(val);
			html = html + "</div>\n"
			html = html + "</div>\n";
		} else {
			html = html + "<div class=\"statetree terminal\">\n";
			html = html + "<i>"+stt+"</i><br/>\n";
			if (typeof (val)  == "object") {
				html = html + val.type +"<br/><b>"+ val.value +"</b>";
			} else {
				html = html +"<b>"+ val +"</b>";
			}
			html = html + "</div>\n";
		}
	}
	return html;
}

//info_msg(htmlify_tokens(tokens));
//info_msg(htmlify_bnf(lr0));
//info_msg(htmlify_table(lr0));
//info_msg(htmlify_statestack(stack));


function html_update_tokens()
{
	var bHideConsumed = getById("cbHideConsumed").checked == 1;
	
	if (token_pos>=0) {
		var st = getStackState(stack);
		var look = getTokenType(tokens, token_pos);
		
		getById("spanNextLR").innerHTML = "Next (state:"+st+", lookahead:"+look+", tok:"+token_pos+"/"+tokens.length+")";
		var gst = -1;
		var lkbk = "";
		
		var action = getAction(getStackState(stack), look, lr0);
		if (action.action=="r") {
			var rule = lr0.rules[action.rule];
			var nb_pop = rule.rhs.length;
			var stack_state = getStackState(stack, nb_pop);
			var goto_state = getGoto(stack_state,rule.lhs,lr0);
			
			getById("spanNextLR").innerHTML = "Reduce by rule "+action.rule+" to lhs "+rule.lhs
				+" (state:"+st+", lookahead:"+look+", tok:"+token_pos+"/"+tokens.length+") <br/>"
				+" Goto "+goto_state+" (state "+stack_state+" after "+nb_pop+" pop, lookahead with lhs)";
			gst = stack_state;
			lkbk = rule.lhs;
		}
		
		html_update_LRtable(st, look, gst, lkbk, lr0);
	}
	
	var html_tokens = htmlify_tokens(tokens, token_pos, bHideConsumed);
	//alert(html_tokens);
	getById("divTokens").innerHTML = html_tokens;
	//var nodeTxt=document.createTextNode("txt");
	//getById("divTokens").appendChild(nodeTxt);
	
}
function html_update_stack()
{
	var html_stack = htmlify_statestack(stack);
	//alert(html_stack);
	getById("divCurrStateStack").innerHTML = html_stack;
}
function html_update_LRtable_state(s, xtra_class_s, t, xtra_class_t, lr0)
{
	//alert(s + "-" + xtra_class_s);
	if (s==-1) return;	// nothing to do
	
	var dom_obj = getById("LrTableState"+s);
	var parity = (s%2?"odd":"even");
	dom_obj.setAttribute("class", parity+" "+xtra_class_s);		// Moz, Opera
	dom_obj.setAttribute("className", parity+" "+xtra_class_s);	// IE
	
	/*if (p==-1) return;	// nothing else to do
	var nbTok = lr0.terminals + lr0.nonterminals;
	if (nbTok!=dom_obj.childNodes.length) 
		alert("LR table row has "+dom_obj.childNodes.length+" DOM children while LR grammar has "+lr0.terminals+" terminals + "+lr0.nonterminals+" nonterminals");
	*/
}
function html_update_LRtable(as, atok, gs, gtok, lr0)
{	
	//alert(as+" - "+atok+" - "+gs+" - "+atok+" - "+lr0);
	// remove previous row highlights
	html_update_LRtable_state(LrTableActionState, "", LrTableActionLookahead, "", lr0);
	html_update_LRtable_state(LrTableGotoState, "", LrTableGotoLookback, "", lr0);
	// add next row highlights
	LrTableActionState = as
	LrTableGotoState = gs
	html_update_LRtable_state(as, "HighlightAction", atok, "", lr0);
	html_update_LRtable_state(gs, "HighlightGoto", gtok, "", lr0);
	if (as==gs) {
		html_update_LRtable_state(as, "HighlightAction HighlightGoto", atok, "", lr0);
		html_update_LRtable_state(gs, "HighlightAction HighlightGoto", gtok, "", lr0);
	}
	
}

// what should be highlighted in LR table (-1 means ignore)
var LrTableActionState = 0;	// state in LR grammar
var LrTableGotoState = -1;	// state in LR grammar
var LrTableActionLookahead = -1;	// terminal in LR grammar
var LrTableGotoLookback = -1;	// non terminal in LR grammar

function html_js_tokenize()
{
	var src = getById("inputSrc").value;
	tokens = lexer(src, re);
	
	showById("buttonsLR");
	
	token_pos = 0;
	stack = [ { state : 0, value : "$" } ];
	getById("buttonNextLR").disabled = false;
	getById("buttonPlayLR").disabled = false;
	getById("buttonPauseLR").disabled = true;
	getById("buttonCompactAST").disabled = false;
		
	html_update_tokens();
	html_update_stack();
}

function html_js_load_rules()
{
	var rules_var = getById("selectRules").value;
	var rules_eval = "build_lr0("+rules_var+")"
	lr0 = eval(rules_var);
	alert("Rules updated : "+rules_var);
}

function html_js_parsenext()
{
	token_pos = run_automaton_step(tokens, lr0, token_pos, stack);
	if (token_pos==0) {
		// Parsing complete.
		getById("buttonNextLR").value = "Done.";
		getById("buttonNextLR").disabled = true;
		getById("buttonPlayLR").disabled = true;
		getById("buttonPauseLR").disabled = true;
		clearInterval(playIntervalId);
		token_pos = tokens.length;
	}
	
	var bCompactAST = getById("cbCompactAST").checked == 1;
	if (bCompactAST)
		html_js_compactAst();
	
	html_update_tokens();
	html_update_stack();
}

var playIntervalId;
function html_js_parse_play()
{
	getById("buttonPlayLR").disabled = true;
	getById("buttonPauseLR").disabled = false;
	
	var pause_ms = getById("fieldPauseMs").value;
	var pause_ms = parseInt(pause_ms);
	
	playIntervalId = setInterval("html_js_parsenext();", pause_ms);

}
function html_js_parse_pause()
{
	getById("buttonPlayLR").disabled = false;
	getById("buttonPauseLR").disabled = true;
	
	clearInterval(playIntervalId);
}

function html_js_compactAst()
{
	convert_statevecofsize1_into_state_but_root(stack);
	html_update_tokens();
	html_update_stack();
}
