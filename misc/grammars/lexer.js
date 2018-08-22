/*
	Author: Claude Cochet
	Creation date : 2009-08-08
*/

var re_string = /"[^"]*"|'[^']*'/;
var re_number = /[+-]?[0-9]+\.?[0-9]*(e[+-]?[0-9]+)?/;
var rx_number = /^[+-]?[0-9]+\.?[0-9]*(e[+-]?[0-9]+)?$/;
var re_id = /[a-zA-Z~][\w_:.]*/;
var re_op = /=|\+|-|\*|\/|\(|\)|\{|\}|\[|\]|<|>|,|;|:|!|%|&/;

var re_source = "^\\s*(" + re_string.source + "|" + re_id.source + "|" + re_op.source + "|" + re_number.source +")";
var re = new RegExp(re_source);

function tokenizer_dflt(txt)
{
	if (re_string.test(txt))
		return { type:"string", value:txt};
	if (rx_number.test(txt))
		return { type:"number", value:parseFloat(txt)};
	if (re_id.test(txt))
		return { type:"id", value:txt};
	return txt;
}

var arith_rules = [
	{ lhs : "$S", 	rhs : [ "program", "eof" ] },
	{ lhs : "program", rhs : [ "stmts" ] },
	{ lhs : "stmts", 	rhs : [ "stmt" ] },
	//{ lhs : "stmts", 	rhs : [ "stmt", "stmts" ] },
	{ lhs : "stmts", 	rhs : [ "stmts", "stmt" ] },
	
	{ lhs : "stmt", 	rhs : [ "comment" ] },
	//{ lhs : "stmt", 	rhs : [ "id", "=", "expr" ] },
	{ lhs : "stmt", 	rhs : [ "id", "=", "expr", ";" ] },
	
	{ lhs : "expr", 	rhs : [ "expr", "+", "term" ] },
	{ lhs : "expr", 	rhs : [ "expr", "-", "term" ] },
	{ lhs : "expr", 	rhs : [ "term" ] },
	
	{ lhs : "term", 	rhs : [ "term", "*", "value" ] },   // conflicts with r0 (when eof) or r4 (when eof removed)
	{ lhs : "term", 	rhs : [ "term", "/", "value" ] },
	//{ lhs : "term", 	rhs : [ "term", "div", "factor" ] },
	//{ lhs : "term", 	rhs : [ "term", "mod", "factor" ] },
	{ lhs : "term", 	rhs : [ "value" ] },
	//{ lhs : "factor", 	rhs : [ "value" ] },
	
	// The two lines below exibit an exemple where LALR(0) is needed. SLR(0) reports reduce-reduce conflict.
	{ lhs : "value", 	rhs : [ "(", "expr", ")" ] },
	{ lhs : "value", 	rhs : [ "id", "(", "lstexpr", ")" ] },	// function
	{ lhs : "value", 	rhs : [ "id", "(", ")" ] },			// empty function
	{ lhs : "value", 	rhs : [ "id" ] },
	{ lhs : "value", 	rhs : [ "number" ] },
	{ lhs : "value", 	rhs : [ "array" ] },
	{ lhs : "value", 	rhs : [ "object" ] },
	
	{ lhs : "array", 	rhs : [ "[", "lstexpr", "]" ] },
	{ lhs : "array", 	rhs : [ "[", "]" ] },
	
	{ lhs : "lstexpr", 	rhs : [ "lstexpr", ",", "expr" ] },
	{ lhs : "lstexpr", 	rhs : [ "expr" ] },

	{ lhs : "object", 	rhs : [ "{", "keyvals", "}" ] },
	{ lhs : "object", 	rhs : [ "{", "}" ] },
	
	{ lhs : "keyvals", 	rhs : [ "keyvals", ",", "keyval" ] },
	{ lhs : "keyvals", 	rhs : [ "keyval" ] },
	{ lhs : "keyval", 	rhs : [ "string", ":", "expr" ] }
]; 

function info_msg(msg) {
	if (typeof WScript != "undefined") {
		WScript.Echo(msg);
	} 
}
function warn_msg(msg) {
	info_msg(msg);
}
function error_msg(msg) {
	warn_msg(msg);
	throw new Error(msg);
}

function lexer(txt, re, tokenizer)
{
	if (tokenizer==undefined)
		tokenizer=tokenizer_dflt;
	
	var tokens = new Array();
	for (; txt.length>0;)
	{
		var res = re.exec(txt);
		if (res==null) {
			if (/^[\s]*$/.exec(txt)!=null) 
				return tokens;
			else 
				error_msg("lexer failed with '"+ txt + "'");
		}
		
		var toktxt = res[1];
		var token = tokenizer(toktxt);
		if (typeof token == "object") {
			//info_msg("token \t"+token.value+"\t\t"+token.type);
			tokens.push(token);
		} else {
			//info_msg("lexeme\t"+toktxt+"");
			tokens.push(toktxt);
		}
		
		txt = txt.substring(res[0].length);
	}
	return tokens;
}

function getTokenType(tokens, pos)
{
	if (pos>=tokens.length) 
		return "eof";
		
	if (typeof tokens[pos] == "object")
		return tokens[pos].type;
	else
		return tokens[pos];
}

function indexOf(s, vs) 
{
	//info_msg("{"+vs+"}");
	for (var i=0;  i<vs.length; i++) 
		if (vs[i]==s)
			return i;
	throw new Error("Couldn't find "+s+" in array {"+vs+"}");
}
function belongsTo(s,vs)
{
	//info_msg("{"+vs+"}");
	for (var i=0;  i<vs.length; i++) 
		if (vs[i]==s)
			return true;
	return false;
}
function appendsTo(s,vs)
{
	if (!belongsTo(s,vs))
		vs.push(s);
}
function equalVect(lhs,rhs)
{
	if (lhs.length!=rhs.length)
		return false;
	for (var i=0; i<lhs.length; i++)
		if (lhs[i]!=rhs[i])
			return false;
	return true;
}

function getAction(state, lookahead, automaton)
{
	var col = indexOf(lookahead, automaton.terminals); 
	var action = automaton.actions_goto[state][0][col];
	//info_msg("Action(state:"+state+", lookahead:"+lookahead+"): "+action+"");
	if (action.charAt(0)=="s")
		return { action : "s", state : parseInt(action.substring(1)) };
	if (action.charAt(0)=="r")
		return { action : "r", rule : parseInt(action.substring(1)) };
	if (action.charAt(0)=="a")
		return { action : "a" };
	return { action : "e" };
}
function getGoto(state,nonterminal,automaton)
{
	var col = indexOf(nonterminal, automaton.nonterminals); 
	var goto_state = automaton.actions_goto[state][1][col];
	//info_msg("Goto(state:"+state+", nonterminal:"+nonterminal+"): "+goto_state+"");
	return parseInt(goto_state);
}
function getStackState(stack, nbpop)
{
	if (nbpop==undefined) 
		nbpop=0;
	return stack[stack.length-1-nbpop].state;
}
function textify_tree(tree, offset)
{
	if (offset==undefined) offset = "";
	
	var txt = "";
	for (var i in tree) {
		if (typeof tree[i] == "object") {
			txt = txt + offset +"[ "+i+" ]\n";
			txt = txt + textify_tree(tree[i], offset+"\t");
		} else {
			txt = txt + offset +"[ "+i+" ]\t" + tree[i] + "\t(" + (typeof tree[i]) + ")\n";
		}
	}
	return txt;
}

function run_automaton(tokens, automaton)
{
	var pos = 0;
	var stack = [ { state : 0, value : "$" } ];
	
	for (;;) 
	{
		var pos = run_automaton_step(tokens, automaton, pos, stack);
		if (pos==0) 
			return stack;
		if (pos<0)
			throw new Error("run_automaton_step return negative token position "+ pos);
		
	}
}
function run_automaton_step(tokens, automaton, pos, stack)
{
	//display_stack(stack);
		
	var lookahead = getTokenType(tokens, pos);
	//info_msg("Lookahead(pos:"+pos+"): "+lookahead+"");
	var action = getAction(getStackState(stack), lookahead, automaton);
	if (action.action=="s") {
		//info_msg("shifting lookahead type:"+lookahead+", value:"+tokens[pos]+" in state "+action.state);
		if (lookahead=="eof") {
			//info_msg("Accepted upon shifting of eof");
			return 0;
		}
		stack.push({ state : action.state, value : tokens[pos] });
		pos++;
	} else if (action.action=="r") {
		var rule = automaton.rules[action.rule];
		//info_msg("reducing by rule "+ action.rule);
		if (action.rule==0) {
			//info_msg("Accepted upon reduction by rule 0");
			return 0;
		}
		
		var nb_pop = rule.rhs.length;
		var leaves = [];
		for (var i=0; i<nb_pop; i++) 
			leaves.push(stack[stack.length-nb_pop+i]);
		for (var i=0; i<nb_pop; i++) 
			stack.pop();
		var stack_state = getStackState(stack);
		var goto_state = getGoto(stack_state,rule.lhs,automaton);
		//info_msg("goto state "+goto_state+" on state "+stack_state+" x lhs "+rule.lhs);
		stack.push({ state : goto_state, rule:action.rule, rule_lhs:rule.lhs, value : leaves });
	} else if (action.action=="a") {
		//info_msg("Accepted");
		return 0;
	} else {
        info_msg("Tokens:  ");
		for (var i=0; i<pos; i++) {
            var tok_val = (typeof tokens[i] == "object" ? tokens[i].value : tokens[i] );
            info_msg(tok_val+" ("+i+")   ");
        }
		var tok_val = (typeof tokens[pos] == "object" ? tokens[pos].value : tokens[pos] );
        throw new Error("Pb at token "+pos+" ("+tok_val+"), state is "+getStackState(stack)+", lookahead is "+lookahead+", action is "+action.action);
	}
	return pos;
}

function build_lr0_nonterminals(rules)
{
	var nonterminals = [];
	for (var i=0; i<rules.length; i++)
		appendsTo(rules[i].lhs, nonterminals);
	info_msg("Non terminals: {"+nonterminals+"}");
	return nonterminals;
}
function build_lr0_terminals(rules, nonterminals)
{
	var terminals = [];
	for (var i=0; i<rules.length; i++) 
		for (var j=0; j<rules[i].rhs.length; j++) 
			if (!belongsTo(rules[i].rhs[j], nonterminals))
				appendsTo(rules[i].rhs[j], terminals);
	info_msg("Terminals: {"+terminals+"}");
	return terminals;
}
// rule is a number whose integer part is the rule number and fractional part the current position in rule evaluation
function rule_id(rule)		{ return Math.floor(rule); }
function rule_position(rule)	{ return Math.round((rule-Math.floor(rule))*10); }
function rule_mk(id, pos)	{ return Math.round((rule-Math.floor(rule))*10); }
function rule_next(rule)	{ return (rule*10+1)/10; }
function rule_prev(rule)	{ return (rule*10-1)/10; }

// rule is a number whose integer part is the rule number and fractional part the current position in rule evaluation
function build_lr0_rule_reduces_to(rule, grammar)
{
	return  grammar.rules[rule_id(rule)].lhs;
}
// rule is a number whose integer part is the rule number and fractional part the current position in rule evaluation
function build_lr0_rule_waits_for(rule, grammar)
{
	var rule_index = rule_id(rule);
	var rule_pos = rule_position(rule);
	var rule_syms = grammar.rules[rule_index];
	
	if (rule_syms.rhs.length == rule_pos)
		// we are at the end, waiting for reduction
		return "";
	
	if (rule_syms.lhs == rule_syms.rhs[rule_pos]) {
		// we are refering our self => waiting on next token (if any)
		//if (rule_syms.rhs.length == rule_pos+1)
		//	return "";
		//return rule_syms.rhs[rule_pos+1];
	}
	
	return rule_syms.rhs[rule_pos];
}
function build_lr0_state_closure(state, grammar)
{
	// a state is a list of pair { rule, position }
	var rules = state;
	// we iterate over the rules of this state
	for (var r=0; r<rules.length; r++)
	{
		var waits_for_sym = build_lr0_rule_waits_for(rules[r], grammar);
		if (belongsTo(waits_for_sym, grammar.nonterminals)) 
		{
			// add extra rules to this state
			//info_msg("Adding rules for non terminal symbol "+waits_for_sym+" to state "+s);
			for (var gr=0; gr<grammar.rules.length; gr++) 
			{
				if (grammar.rules[gr].lhs==waits_for_sym) {
					if (!belongsTo(gr, rules)) {
						rules.push(gr);
					}
				}
			}
		}
	}
	// state rules are sorted to allow state comparison
	rules.sort();
}
function build_lr0_addtransition_from_state(s, grammar)
{
	// build list of transistion symbols
	var rules = grammar.states[s];
	var transistion_syms = new Array();
	//var reduce_to_syms = new Array();
	for (var r=0; r<rules.length; r++)
	{
		var waits_for_sym = build_lr0_rule_waits_for(rules[r], grammar);
		if (waits_for_sym!="")	
			appendsTo(waits_for_sym, transistion_syms);
		//else
		//	appendsTo(build_lr0_rule_reduces_to(rules[r], grammar), reduce_to_syms);
	}
	//info_msg("Transition symbols from state "+s+" rules {"+rules+"} : {"+transistion_syms+"}");
	//info_msg("Reduction symbols from state "+s+" rules {"+rules+"} : {"+reduce_to_syms+"}");
	
	// add new states from these transition
	for (var t=0; t<transistion_syms.length; t++)
	{
		var transition_sym = transistion_syms[t];
		var new_state_rules = new Array();
		for (var r=0; r<rules.length; r++)
		{
			var waits_for_sym = build_lr0_rule_waits_for(rules[r], grammar);
			
			if (waits_for_sym==transition_sym)
				new_state_rules.push( rule_next(rules[r]) );
		}
		
		//info_msg("State closure, state "+s+", current rules {"+grammar.states[s]+"}");
		build_lr0_state_closure(new_state_rules, grammar);
		
		// Check if this state already exist
		for (var p=0; p<grammar.states.length; p++)
			if (equalVect(new_state_rules, grammar.states[p]))
				break;
		
		if (p==grammar.states.length) {
			//info_msg("Adding transition state: "+s+" x sym "+transition_sym+" -> state "+grammar.states.length+" with rules {"+new_state_rules+"}");
			grammar.states.push(new_state_rules);
			grammar.transitions.push( { from:s, sym:transition_sym, to:grammar.states.length-1} );
		} else {
			//info_msg("Transition to existing state: "+s+" x sym "+transition_sym+" -> state "+p+" with rules {"+new_state_rules+"}");
			grammar.transitions.push( { from:s, sym:transition_sym, to:p} );
		}
		
		
	}
}
function build_lr0_addreductions(s, grammar)
{
	var rules = grammar.states[s];
	
	// Simple case 
	var nbReduceRules = 0;
	var idReduceRule = 0;
	for (var r=0; r<rules.length; r++) {
		var waits_for_sym = build_lr0_rule_waits_for(rules[r], grammar);
		if (waits_for_sym=="")	{
			nbReduceRules = nbReduceRules+1;
			idReduceRule = rule_id(rules[r]);
		}
	}
	if (nbReduceRules==0) {
		// nothing to do;
		return true;
	} else if (nbReduceRules==1 && rules.length==1) {
		//info_msg("Added LR0 reduction for state "+s+", rule "+idReduceRule);
		grammar.reductions.push( { state:s, terminal:"", rule:idReduceRule, any:true } );
		return true;
	} else if (nbReduceRules==1 ) {
		//info_msg("Added LR0 reductionS for state "+s+", rule "+idReduceRule);
		grammar.reductions.push( { state:s, terminal:"", rule:idReduceRule, any:false } );
		return true;
	}
	return false;
}
function build_slr0_successors(nonterminal, grammar, successors_sym, successors_rule, path, ctrl)
{	
	if (path==undefined) path = nonterminal;
	if (ctrl==undefined) ctrl = [];
	//info_msg("Build SLR0 successors of nonterminal: "+nonterminal);
			
	// loop on all rules
	for (var gr=0; gr<grammar.rules.length; gr++) 
	{
		// loop on each symbol (excl. last) ...
		for (var s=0; s<grammar.rules[gr].rhs.length-1; s++) {
			if (nonterminal==grammar.rules[gr].rhs[s]) {
				var next_sym = grammar.rules[gr].rhs[s+1];
				
				if (!belongsTo(next_sym, grammar.nonterminals)) {
					var tmp = next_sym+"_"+gr;
					info_msg("SLR0: terminal "+path+"/"+next_sym+" follows nonterminal "+nonterminal+" by rule "+gr+ " -> adding to successors");
					if (!belongsTo(tmp, ctrl)) {
						successors_sym.push(next_sym);
						successors_rule.push(gr);
						appendsTo(tmp, ctrl);
					}
				} else {
					info_msg("SLR0: nonterminal "+path+"/"+next_sym+" follows nonterminal "+nonterminal+" by rule "+gr+ " -> iterate");
					build_slr0_successors(next_sym, grammar, successors_syms, successors_rules, path+"/"+next_sym, ctrl);
				}
			}
		}
		// ... and last symbol
		var s=grammar.rules[gr].rhs.length-1;
		if (nonterminal==grammar.rules[gr].rhs[s]) {
			var next_sym = grammar.rules[gr].lhs;
			if (next_sym!=nonterminal)  	// this test to avoid infinite loop
			{
				info_msg("SLR0: nonterminal "+path+"/"+next_sym+" follows nonterminal "+nonterminal+" by rule "+gr+ " reduction -> iterate");
				build_slr0_successors(next_sym, grammar, successors_sym, successors_rule, path+"/"+next_sym, ctrl);
			}
		}
	}
	//info_msg("Exit SLR0 successors of nonterminal "+nonterminal+", successors: syms={"+successors_sym+"}, rules={"+successors_rule+"}\n");
}
/*function build_lalr0_successors(s, current_rule, grammar, successors_sym, successors_rule, path, ctrl)
{
	info_msg("build_lalr0_successors, state:"+s+", rule:"+current_rule);
	if (path==undefined) path = "";
	if (ctrl==undefined) ctrl = [];

	// loop through parent state
	
	if (rule_position(current_rule)>0) {
		
		// Case 1 : 
		// Current rule is :		X =  [A] B ... [C]
		// Parent rule was : 		X =  [A] ... B [C]  	
		// Looking for another state from which we transitionned on B
		
		var current_rule_on_sym = grammar.rules[rule_id(current_rule)].rhs[rule_position(current_rule)-1];
		info_msg("Case 1, state "+s+", rule "+rule_id(current_rule)+", pos "+rule_position(current_rule)+", on_sym "+current_rule_on_sym);
		for (var gt=0; gt<grammar.transitions.length; gt++) 
		{
			// Is it a parent state ? If not a parent try next
			if (grammar.transitions[gt].to != s) continue;
			if (grammar.transitions[gt].sym != current_rule_on_sym) continue;
			
			info_msg("Case 1, state "+s+", rule "+rule_id(current_rule)+", pos "+rule_position(current_rule)+", transition "+gt+", from state "+grammar.transitions[gt].from);
			var tmp = s + "_" + current_rule;
			if (!belongsTo(tmp, ctrl)) {
				build_lalr0_successors(
					grammar.transitions[gt].from, rule_prev(current_rule), grammar, successors_sym, successors_rule, 
					path+"state:"+s+",rule:"+current_rule+"/", ctrl);
				appendsTo(tmp, ctrl);
			}
		}
		
	} else {
		
		// Case 2 : 
		// Current rule is :		X =  ... A [B]
		// Parent rule was : 		Z =  [C] ... X D 	in the same state, with X a non terminal, case 2.1
		// 		or :  		Z =  [C] ... X 		in the same state, with X a non terminal, case 2.2
		// Case 2.1: Successors are all the terminals than can make D, eg the closure of the parent rule.
		// Case 2.2: Successors are obtained recursively on the parent rule.
		
		var current_rule_reduces_to = build_lr0_rule_reduces_to(current_rule, grammar);
		info_msg("Case 2, state "+s+", rule "+rule_id(current_rule)+", pos "+rule_position(current_rule)+", reduces to "+current_rule_reduces_to);
		
		var next_syms_closure = [];
		
		var parent_rules = grammar.states[s];
		for (var pr=0; pr<parent_rules.length; pr++) {
			var parent_rule = parent_rules[pr];
			if (build_lr0_rule_waits_for(parent_rule, grammar)==current_rule_reduces_to) {
			
				if (build_lr0_rule_waits_for(rule_next(parent_rule), grammar)!="") {
					// Case 2.1
					info_msg("Case 2.1");
					next_syms_closure.push(rule_next(parent_rule));
				} else {
					// Case 2.2
					info_msg("Case 2.2, rule "+parent_rule );
					var tmp = s + "_" + current_rule;
					if (!belongsTo(tmp, ctrl)) {
						build_lalr0_successors(
							s, rule_next(parent_rule), grammar, successors_sym, successors_rule, 
							path+"state:"+s+",current_rule:"+current_rule+"/", ctrl);
						appendsTo(tmp, ctrl);
					}
				}
			}
		}
		
		
		// build closure
		info_msg("Case 2, build closure state "+s+", rules {"+next_syms_closure+"}");
		build_lr0_state_closure(next_syms_closure, grammar);
		for (var i=0; i<next_syms_closure.length; i++) {
			if (rule_position(next_syms_closure[i])!=0) continue;
			
			var next_sym = grammar.rules[rule_id(next_syms_closure[i])][0];
		
			if (!belongsTo(next_sym, grammar.nonterminals)) {
				info_msg("LALR0: terminal "+path+"state:"+s+",rule:"+current_rule+",next_terminal_sym:"+next_sym+" -> adding to successors");
				
				successors_sym.push(next_sym);
				successors_rule.push(gr);
			}
		} 
	}
	info_msg("Exit build_lalr0_successors, state:"+s+", rule:"+current_rule);
}
*/

function build_slr0_lalr0_addreductions(s, grammar)
{
	var rules = grammar.states[s];
	info_msg("build_slr0_lalr0_addreductions state:"+s+", rules:"+rules);
		
	for (var r=0; r<rules.length; r++) {
		var waits_for_sym = build_lr0_rule_waits_for(rules[r], grammar);
		if (waits_for_sym!="")	
			continue;
		
		var successors_sym = [];
		var successors_rule = [];
		
		var nonterminal_result = build_lr0_rule_reduces_to(rules[r], grammar);
		build_slr0_successors(nonterminal_result, grammar, successors_sym, successors_rule);
		
		//build_lalr0_successors(s, rules[r], grammar, successors_sym, successors_rule);
		
		for (var i=0; i<successors_sym.length; i++)
			grammar.reductions.push( { state:s, terminal:successors_sym[i], rule:successors_rule[i]} );
	}
}
function build_lr0_check_tables(lr0) 
{
	lr0.actions_goto = [];
	for (var s=0; s<lr0.states.length; s++) {
		lr0.actions_goto[s] = [ [], [] ]; 	// for each state, action and goto tables 
		for (var t=0; t<lr0.terminals.length; t++) lr0.actions_goto[s][0].push("");
		for (var t=0; t<lr0.nonterminals.length; t++) lr0.actions_goto[s][1].push("");
	}
	//info_msg("Checking tables transitions");
	for (var t=0; t<lr0.transitions.length; t++) {
		var state = lr0.transitions[t].from;
		var sym = lr0.transitions[t].sym;
		if (belongsTo(sym, lr0.terminals)) {
			var idx = indexOf(sym, lr0.terminals)
			var action = "s"+lr0.transitions[t].to;
			if (lr0.actions_goto[state][0][idx]!="") {
				var txt = "Action table, state "+state+", sym "+sym+" (idx "+idx+"), conflict "+action+" - "+lr0.actions_goto[state][0][idx];
				error_msg(txt); throw new Error(txt);
			} else {
				lr0.actions_goto[state][0][idx] = action;
			}
		} else {
			var idx = indexOf(sym, lr0.nonterminals)
			var action = lr0.transitions[t].to;
			if (lr0.actions_goto[state][1][idx]!="") {
				var txt = "Goto table, state "+state+", sym "+sym+" (idx "+idx+"), conflict "+action+" - "+lr0.actions_goto[state][1][idx];
				error_msg(txt); throw new Error(txt);
			} else {
				lr0.actions_goto[state][1][idx] = action;
			}
		}
	}
	//info_msg("Checking tables reductions");
	for (var r=0; r<lr0.reductions.length; r++) {
		var state = lr0.reductions[r].state;
		var terminal = lr0.reductions[r].terminal;
		var action = "r"+lr0.reductions[r].rule;
		
		if(terminal!="") {
			//info_msg("Checking tables reductions, state "+state+", terminal "+terminal+" (idx "+idx+")");
			var idx = ( terminal=="" ? -1 :  indexOf(terminal, lr0.terminals) );
			if (lr0.actions_goto[state][0][idx]!="") {
				var txt = "Action table, state "+state+", terminal "+terminal+" (idx "+idx+"), conflict "+lr0.actions_goto[state][0][idx]+" - "+action;
				error_msg(txt); 	throw new Error(txt);
				lr0.actions_goto[state][0][idx] = lr0.actions_goto[state][0][idx] + " - " +action
			} else {
				lr0.actions_goto[state][0][idx] = action;
			}
		} else {
			//info_msg("Checking tables reductions, state "+state+", all terminals");
			for (var a=0; a<lr0.terminals.length; a++) {
				if (lr0.actions_goto[state][0][a]=="") 
					lr0.actions_goto[state][0][a] = action;
			}
		}
	}
}	
function build_lr0(rules)
{
	var nonterminals = build_lr0_nonterminals(rules);
	var terminals = build_lr0_terminals(rules, nonterminals);
	var lr0 = { terminals:terminals, nonterminals:nonterminals, rules : rules };
	
	// each state is described by a list of pair { possible rule + position in the rule / 10 }
	lr0.states = [ [ 0.0 ] ];
	lr0.transitions = [ ];
	lr0.reductions = [ ];
	
	//info_msg("State closure, state "+0+", current rules {"+grammar.states[s]+"}");
	build_lr0_state_closure(lr0.states[0], lr0);
		
	for (var s=0; s<lr0.states.length; s++)
	{
		//info_msg("");
		//info_msg("Transitions from state "+s+", rules {"+grammar.states[s]+"}");
		build_lr0_addtransition_from_state(s, lr0);
	}
	//info_msg();
	//info_msg("Adding reductions");
	for (var s=0; s<lr0.states.length; s++)
	{
		var isLR0 = build_lr0_addreductions(s, lr0);
		if (!isLR0) {
			info_msg();
			info_msg("Adding SLR0/LALR0 reductions for state "+s);
			build_slr0_lalr0_addreductions(s, lr0);
		}
	}
	//info_msg("Checking tables");
	build_lr0_check_tables(lr0);
	info_msg("LR0 \n");
	return lr0;
}

function textify_state(s, lr0) 
{
	var txt = "";
	for (var r=0; r<lr0.states[s].length; r++) {
		var rule = lr0.states[s][r];
		var rule_index = rule_id(rule)
		var rule_pos = rule_position(rule);
		var rule_syms = lr0.rules[rule_index];
		
		var txt = txt+rule_index+"("+rule_pos+")\t\t"+rule_syms.lhs+"\t";
		for (ri=0; ri<rule_syms.rhs.length; ri++)
			txt = txt + "\t" + ( rule_pos==ri ? "...\t" : "" ) + rule_syms.rhs[ri];
		if (rule_pos==ri)
			txt = txt + "\t...";
		txt = txt + "\n";
	}
	return txt;
}
function textify_states(lr0) 
{
	var txt = "States\n";
	for (var s=0; s<lr0.states.length; s++) {
		txt = txt + "State " + s + "\n";
		txt = txt + textify_state(s, lr0);
	}
	return txt;
}
function textify_transistions(lr0) 
{
	txt= "Transistions\n";
	for (var t=0; t<lr0.transitions.length; t++)
		txt = txt + "state "+lr0.transitions[t].from+" , symbol "+lr0.transitions[t].sym+" -> state "+lr0.transitions[t].to + "\n";
	txt = txt + "\n";
	txt = txt + "Reductions\n";
	for (var r=0; r<lr0.reductions.length; r++)
		if (lr0.reductions[r].terminal != "")
			txt = txt + "state "+lr0.reductions[r].state+" , terminals "+lr0.reductions[r].terminal+" -> rule "+lr0.reductions[r].rule + "\n";
		else
			txt = txt + "state "+lr0.reductions[r].state+" , any terminal -> rule "+lr0.reductions[r].rule + "\n";
	return txt;
}
function textify_lr0(lr0) 
{
	info_msg(textify_states(lr0));
	info_msg(textify_transistions(lr0));
	info_msg();	
}
function is_stack_state(x)
{
	try {
	if (x.state==undefined)
		return false;
	// some value are genuinely false
	//if (x.value==undefined)
	//	return false;
	} catch (e) {
		return false;
	}
	return true;
}
function is_stack_state_vect(x)
{
	try {
	if (typeof x == "object")
		if (x[0] != undefined)
			if (is_stack_state(x[0]))
				return true;
	} catch (e) {}
	return false;
}
function convert_statevecofsize1_into_state_but_root(stack)
{
	for (var i in stack) {
		if (is_stack_state_vect(stack[i].value)) {
			convert_statevecofsize1_into_state(stack[i].value);
			if (stack[i].value.length==1) {
				// DO NOTHING
			} 
		} 
	}
	//convert_statevecofsize1_into_state(stack);
}
function convert_statevecofsize1_into_state(stack)
{
	for (var i in stack) {
		var val = stack[i].value;
		if (is_stack_state_vect(stack[i].value)) {
			convert_statevecofsize1_into_state(stack[i].value);
			if (stack[i].value.length==1) {
				//info_msg("convert_statevecofsize1_into_state : compacting");
				stack[i] = stack[i].value[0];
			} 
		} 
	}
}
function compact_stack(stack, bLhs) 
{
	if (bLhs==undefined)
		bLhs = false
	
	var tree = [];
		
	// stack is an array of states
	for (var i in stack) {
		if (!is_stack_state(stack[i])) 
			error_msg("Stack state expected ("+stack[i].value+")");
		
		var stt = stack[i].state
		var val = stack[i].value;
		var lhs = stack[i].rule_lhs!=undefined ? stack[i].rule_lhs : "";
		if (is_stack_state_vect(val))
		{
			var compacted = compact_stack(val);
			
			//info_msg("vs " + stt);
			if (bLhs) compacted.lhs = lhs;
			tree.push(compacted);
			//info_msg("ret vs " + stt);
			
		} else if (typeof (val)  == "object") {
			//info_msg("o "+val.type +":"+ val.value);
			tree.push(val.type +":"+ val.value);
		} else {
			//info_msg("v "+val)
			tree.push(val);
		}
	}
	return tree;
}
function compact_collections(stack, syms) 
{
	var tree = [];
	
	// stack is an array of states
	for (var i in stack) {
		if (!is_stack_state(stack[i])) 
			error_msg("Stack state expected ("+stack[i].value+")");
		
		// first we apply to all child ...
		var val = stack[i].value;
		if (is_stack_state_vect(val)) 
			compact_collections(val, syms);
		
		// ... then to us
		var lhs = stack[i].rule_lhs!=undefined ? stack[i].rule_lhs : "";
		var val = stack[i].value;
		if (!belongsTo(lhs, syms)) 
			continue;
		if (!is_stack_state_vect(val)) 
			throw new Error("compact_collections: "+lhs+" value is not a collection (1).");
		var lhs_child = val[0].rule_lhs!=undefined ? val[0].rule_lhs : "";
		var val_child = val[0].value;
		if (lhs!=lhs_child)
			continue;
		if (!is_stack_state_vect(val_child)) 
			throw new Error("compact_collections: "+lhs+" value is not a collection (2).");
		val_child.push(val[1]);
		stack[i].value = val_child;
	}
	
	return tree;
}

function test_lexer_lr0() {
	
	var lr0 = build_lr0(arith_rules);
	//var dot = textify_lr0(lr0);
	//build_lr0_check_tables(lr0);

	//var txt = " = F9(a,xY,\"kjh\")   + E7:b7 * 7b35 - 7e  +-23e-35 'C:\\path\\file.xls:a'!da";
	var txt = "y = pow(a,5) - 3*7*xy; y = { 's' : 7, 'a' : [ 3, tan(x) ], 'vd' : 22 };"
	var txt = "z= { \"vd\" : 22, \"abc\" : [ ab, c+1 ] }; x= [ 3, 5*b, {} ];  y = pow(a,5) - 3*7*xy;"
	info_msg("\n"+txt+"\n");
	
	var tokens = lexer(txt, re);
	
	var stack = run_automaton(tokens, lr0);

	convert_statevecofsize1_into_state(stack); 

	compact_collections(stack, [ "stmts", "prms" ]);

	var tree = stack;
	var tree = compact_stack(tree);
	info_msg(textify_tree(tree));
	info_msg("Done");
}

//test_lexer_lr0();