// Checking level Sudoku from Le Monde
// 18_205 in indeed hard

var sudoku_18_205_expert =
	"... ... ... \n" +
	"... 1.. .45 \n" +
	"... .52 138 \n" +
	"... ... ... \n" +
	"... .3. 594 \n" +
	"... 56. 3.. \n" +
	".56 ... .2. \n" +
	".17 ... ... \n" +
	".34 ..7 ..6 \n";

var sudoku_18_209_difficile =
	"... ... ... \n" +
	"... 9.8 6.5 \n" +
	"... ... .89 \n" +
	"..4 ... 1.. \n" +
	".8. .27 .9. \n" +
	".23 ..4 8.6 \n" +
	"..5 ... ..4 \n" +
	"... 3.. 962 \n" +
	"..1 .6. ... \n";

var sudoku_18_210_tres_difficile =
	"... ... ... \n" +
	"... ... 7.2 \n" +
	"... .47 .8. \n" +
	"... .6. ..1 \n" +
	"... ... 32. \n" +
	"..5 73. 8.9 \n" +
	".78 ..2 .4. \n" +
	".24 ..8 .35 \n" +
	".53 ..6 ... \n";

var sudoku_18_213_facile =
	"... ... ... \n" +
	"... ... ..9 \n" +
	"... 9.2 6.. \n" +
	"..3 ... ..7 \n" +
	".1. ..8 ... \n" +
	"..9 .7. .63 \n" +
	"... .4. ... \n" +
	".81 ..5 2.4 \n" +
	".24 .96 3.5 \n";

var sudoku = sudoku_18_210_tres_difficile;

var sdk = {
	known: 0,
	next: sudoku.replace(/ /g,"").split("\n").slice(0,9).map(row => Array.from(row).map(v => isNaN(v) ? {} : v*1))
	};
var n = sdk.next.length;

function count_known(grid) {
	var known = 0;
	for (var i=0; i<n; i++)
		for (var j=0; j<n; j++)
			if (!isNaN(grid[i][j]))
				known++;
	return known;
}

function rule1(grid) {
	var found = [];
	var next = JSON.parse(JSON.stringify(grid));
	var val = new Array(3).fill([]).map(row => new Array(3));
	for (var i=0; i<n; i++) {
		for (var j=0; j<n; j++) {

			// we already know the number
			if (!isNaN(grid[i][j])) {
				next[i][j] = grid[i][j];
				continue;
			}

			// we find valid numbers
			var ib = i - i%3;
			var jb = j - j%3;
			var excl_row = grid[i];
			var excl_col = grid.map(row => row[j]);
			var excl_bloc = [].concat( grid[ib].slice(jb, jb+3), grid[ib+1].slice(jb, jb+3), grid[ib+2].slice(jb, jb+3) );
			var excl = [].concat( excl_row, excl_col, excl_bloc ).filter(x => !isNaN(x)).sort();

			/*
			var allowed = [];
			for (var k=1;k<10; k++)
				if (excl.indexOf(k)==-1)
					allowed.push(k);
			//console.log(i, j, "allowed", allowed);
			*/
			var allowed = next[i][j].allowed ||  [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
			allowed = allowed.filter(k => excl.indexOf(k)==-1);

			if (allowed.length==0) {
				throw new Error("rule1", i, j);
			} else if (allowed.length==1) {
				//console.log(i, j, "excl", excl);
				num = allowed[0]
				next[i][j] = num;
				found.push({ i, j, num })
			} else {
				next[i][j] = { allowed: allowed } ;
			}
		}
	}

	return { found, next };
}

function rule_apply(sdk, rule_impl) {
	var res = [];
	var grid = sdk.next;
	for (var i=0; i<n; i++) {
		var allowed_row = grid[i].map((x, j) => { return { pos: { i, j }, x }});
		res = res.concat(rule_impl(sdk, allowed_row, { row: i }));
	}
	for (var j=0; j<n; j++) {
		var allowed_col = grid.map(row => row[j]).map((x, i) => { return { pos: { i, j }, x: x }});
		res = res.concat(rule_impl(sdk, allowed_col, { col: j }));
	}
	for (var ib=0; ib<9; ib+=3) {
		for (var jb=0; jb<9; jb+=3) {
			var allowed_bloc = [].concat(
				grid[ib].slice(jb, jb+3).map((x, j) => { return { pos: { i: ib, j: jb+j }, x: x }}),
				grid[ib+1].slice(jb, jb+3).map((x, j) => { return { pos: { i: ib+1, j: jb+j }, x: x }}),
				grid[ib+2].slice(jb, jb+3).map((x, j) => { return { pos: { i: ib+2, j: jb+j }, x: x }}));
			res = res.concat(rule_impl(sdk, allowed_bloc, { row: ib/3, col: jb /3}));
		}
	}
	return res;
}

function rule2_impl(sdk, seq, bloc_info) {
	var found = [];
	for (var k=1; k<10; k++) {
		var was_already_found = false;
		var possible_at = [];
		for (var i=0; i<seq.length; i++) {
			var info = seq[i];
			if (info.x==k) {
				was_already_found = true;
				break;
			}
			if (info.x==k || ( info.x.allowed && info.x.allowed.indexOf(k)!=-1 )) {
				possible_at.push(info.pos);
			}
		}

		if (was_already_found)
			continue;
		if (possible_at.length==0) {
			// only possible in one place
			throw new Error(k+" not found.\n    bloc_info= "+JSON.stringify(bloc_info)+"\n    seq="+seq.length+" "+JSON.stringify(seq));
		}
		if (possible_at.length==1) {
			console.log("rule 2 (at least each digit once): "+k+" found at "+JSON.stringify(possible_at[0]));
			found.push({ pos: possible_at[0], x: k });
		}
	}
	return found;
}

function rule3_impl(sdk, seq, bloc_info) {
	var seq2 = seq.filter(s => s.x.allowed);
	//console.log("rule3", bloc_info, " with ", seq2.map(s => s.x.allowed));
	if (seq2.length<3) return;

	return exclusive_allowed_subgroups(sdk, seq2, bloc_info)
}

function exclusive_allowed_subgroups(sdk, seq, bloc_info) {
	var all_allowed = {};
	var max_allowed_length = 0;
	for (var i=0; i<seq.length; i++) {
		for (var j=0; j<seq[i].x.allowed.length; j++)
			all_allowed[seq[i].x.allowed[j]] = true;
		max_allowed_length = Math.max(max_allowed_length, seq[i].x.allowed.length);
	}
	all_allowed = Object.keys(all_allowed).map(k => k*1).sort();
	//console.log("all_allowed", all_allowed);


	for (var subgrp_size=2; subgrp_size<max_allowed_length; subgrp_size++) {
		var subgrps = subgroups(subgrp_size, 0, all_allowed.length);
		for (var subgrp of subgrps) {
			var subgrp = subgrp.map(idx => all_allowed[idx]);
			//console.log("subgrp", subgrp)

			// is this subgroup limited to a surface of same size
			var nb_pos_allowed = 0;
			for (var i=0; i<seq.length; i++) {
				var subgrp_allowed_here = false;
				for (var v of subgrp)
					if (seq[i].x.allowed.indexOf(v)!=-1) {
						subgrp_allowed_here = true;
						break;
					}
				if (subgrp_allowed_here) nb_pos_allowed++
			}

			if (nb_pos_allowed<subgrp_size)
				throw new Error("not enough room for "+JSON.stringify(subgrp_size));
			if (nb_pos_allowed>subgrp_size)
				continue; // more than enough room for this subgroup

			// this subgroup is limited to a surface of same size => remove other numbers
			console.log("rule3", bloc_info, " with ", seq.map(s => s.x.allowed));
			console.log("rule3 (exclusive digits zone): ", JSON.stringify(subgrp));

			var improved = false;
			for (var i=0; i<seq.length; i++) {
				for (var v of subgrp)
					if (seq[i].x.allowed.indexOf(v)!=-1) {
						var pos = seq[i].pos;
						var prev_allowed = sdk.next[pos.i][pos.j].allowed;
						var new_allowed = intersection(prev_allowed, subgrp);
						improved = improved || (new_allowed.length < prev_allowed.length);
						sdk.next[pos.i][pos.j].allowed = new_allowed;
					}
			}
			if (improved) {
				disp(sdk.next, true);
				console.log("rule3 improved: ", improved);
				return improved;
			}
		}
	}
}

function rule4_impl(sdk, seq, bloc_info) {
	var seq2 = seq.filter(s => s.x.allowed);
	//console.log("rule3", bloc_info, " with ", seq2.map(s => s.x.allowed));
	if (seq2.length<3) return;

	return exclusive_location(sdk, seq2, bloc_info)
}

function exclusive_location(sdk, seq, bloc_info) {
	for (var subgrp_size=2; subgrp_size<seq.length-1; subgrp_size++) {
		var subgrps = subgroups(subgrp_size, 0, seq.length);
		for (var subgrp of subgrps) {

			// what are the list of possible numbers in this subset of cells
			var possible_at = [];
			for (var i=0; i<subgrp.length; i++) {
				var info = seq[subgrp[i]];
				possible_at = possible_at.concat(info.x.allowed);
			}
			possible_at = unique(possible_at);

			var nb_possible_at = possible_at.length;
			if (nb_possible_at<subgrp_size)
				throw new Error("not enough numbers for subset of cells "+JSON.stringify(subgrp));
			if (nb_possible_at>subgrp_size)
				continue; // more than enough numbers for this subset of cells

			// this subset of cells will contains all these digites => other cells can't contain them
			console.log("rule4", bloc_info, " with ", seq.map(s => s.x.allowed));
			console.log("rule4 (zone contains those digits):\n  zone="+JSON.stringify(subgrp)+"\n  possible="+JSON.stringify(possible_at));

			var improved = false;
			var other_cells = difference(sequence(0, seq.length), subgrp);
			var possible_other_cells = difference([1,2,3,4,5,6,7,8,9], possible_at);
			for (var o of other_cells) {
				var pos = seq[o].pos;
				var prev_allowed = sdk.next[pos.i][pos.j].allowed;
				var new_allowed = intersection(prev_allowed, possible_other_cells);
				improved = improved || (new_allowed.length < prev_allowed.length);
				sdk.next[pos.i][pos.j].allowed = new_allowed;
			}

			if (improved)  {
				disp(sdk.next, true);
				console.log("rule4 improved: ", improved);
				return improved;
			}
		}
	}
}

function subgroups(size, index_beg, index_end) {
	if (size==0)
		return [[]];

	var subgrps = [];
	for (var i=index_beg; i<index_end; i++) {
		var subsubgrps = subgroups(size-1, i+1, index_end);

		for (var s of subsubgrps) {
			var tmp = [i].concat(s);
			subgrps.push(tmp);
		}
	}
	return subgrps;
}

function sequence(from_incl, to_excl) {
	return new Array(to_excl - from_incl).fill(-1).map((v, i) => from_incl+i );
}
function unique(lst) {
	var sorted = lst.sort();
	var uniq = sorted.filter((v, i) => (i==0) || (v!=sorted[i-1]));
	return uniq;
}
function union(a, b) {
	return unique([].concat(a, b));
}
function intersection(a, b) {
	var u = union(a, b);
	return u.filter(v => a.indexOf(v)!=-1 && b.indexOf(v)!=-1);
}
function difference(a, b) {
	return a.filter(v => b.indexOf(v)==-1);
}


function disp(x, bDetails) {
	var txt = x.map(
		(row, i) => (i%3==0?"\n ":" ") + row.map(
			(x, j) => (j%3==0?"   ":" ") + (isNaN(x) ? ( bDetails ? JSON.stringify(x.allowed): "_" ) : x )
		).join("")
	).join("\n") + "\n";
	console.log(txt);
	return txt;
}

function solve_sodoku(sdk) {
	var known = count_known(sdk.next);
	console.log("init #known "+known);

	disp(sdk.next);
	for (;;) {
		var prev_known = known;

		sdk = rule1(sdk.next)
		known = count_known(sdk.next);
		console.log("rule 1 (no more than each digit once): found ", JSON.stringify(sdk.found));
		if (known > prev_known) {
			sdk.known = known;
			continue; // do again
		}

		disp(sdk.next, true);

		var found = rule_apply(sdk, rule2_impl);
		if (found.length) {
			found.forEach(fnd => { sdk.next[fnd.pos.i][fnd.pos.j] = fnd.x; });
			continue;  // do again
		}

		var flags3 = rule_apply(sdk, rule3_impl);
		var flag3 = flags3.reduce((a,b) => a||b, false);
		known = count_known(sdk.next);
		if (known > prev_known || flag3) {
			continue;   // do again
		}

		var flags4 = rule_apply(sdk, rule4_impl);
		var flag4 = flags4.reduce((a,b) => a||b, false);
		known = count_known(sdk.next);
		if (known > prev_known || flag4) {
			continue;   // do again
		}

		break; // stuck
	}

	known = count_known(sdk.next);
	console.log("final #known "+known);
	disp(sdk.next, true);

}

solve_sodoku(sdk);
