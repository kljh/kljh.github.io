

function graph_recalc_naive(nodes) {
	for (var node_id in nodes) {
		var node = nodes[node_id];
		if (!node.fct)
			continue;

		var args = [];
		for (var i=0; i<node.prec.length; i++) {
			args.push(nodes[node.prec[i]].val);
		}


		try{
			var old_val = node.val;
			var new_val = node.fct.apply(node, args);

			if (new_val.type=="point" && isNaN(new_val.x))
				debugger;

		} catch(e) {
			// skip update
			console.warn(arguments.callee.name+": error evaluating node "+node_id+".\n"+e);
			debugger;
			continue;
		}

		node.val = new_val;
	}
}