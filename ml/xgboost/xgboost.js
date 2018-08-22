
function xgboost_parse_dump(dump_txt, opt_feature_names) {
    var rows = dump_txt.split('\n');
    
    // booster trees
    var trees = [], tree;
    for (var row of rows) {
        if (!row) continue;
        if (row.substr(0,7)=="booster") {
            // new booster tree
            if (tree) trees.push(tree);
            tree = [];
        } else { 
            tree.push(row.trim())
        }
    }
    if (tree) trees.push(tree);
    console.log("#trees", trees.length);
    
    function feature_index(f) {
        var pos; 
        if (opt_feature_names) {
            pos = opt_feature_names.indexOf(f);
            if (pos>-1) return pos;
        }
        
        pos = f.substr(1)*1;
        if (isNaN(pos)) 
            throw new Error("could not recognize feature "+f);
        return pos
    }
    
    function xgboost_parse_dump_tree_rows(tree_rows) {
        var tree = new Array(tree_rows.length);
        for (var row of tree_rows) {
            var tmp = row.split(':');
            var idx = tmp[0], desc = tmp[1], cond = undefined;
            
            if (desc[0]=='[') {
                var pos = desc.indexOf(']');
                cond = desc.substr(1, pos-1).split('<');
                cond[0] = feature_index(cond[0]);
                cond[1] = 1*cond[1];
                
                desc = desc.substr(pos+2);
            }
            
            desc = desc.split(',').map(kv => kv.split('='));
            
            var tmp = cond ? { feature: cond[0], threshold: cond[1] } : {};
            for (var d of desc) { 
                var k=d[0], v=d[1];
                if (v*1!=undefined) v = v*1;
                tmp[k] = v;
            }
            desc = tmp;
            
            tree[idx] = desc;
        }
        return tree;
    }
    
    trees = trees.map(xgboost_parse_dump_tree_rows);
    return trees;
}

function xgboost_predict(trees, feature_values) {
    
    function xgboost_tree_predict(tree, node, feature_values) {
        if (node.leaf)
            return node.leaf;
        
        var feature_idx = node.feature;
        var feature_value = feature_values[feature_idx];
        var feature_threshold = node.threshold;
        
        //console.log({ feature_idx, feature_value, feature_threshold });
        if (feature_value == undefined) {
            console.log("missing feature "+feature_idx)
            return xgboost_tree_predict(tree, tree[node.missing], feature_values);
        } else if (feature_value < feature_threshold) {
            return xgboost_tree_predict(tree, tree[node.yes], feature_values);
        } else {
            return xgboost_tree_predict(tree, tree[node.no], feature_values);
        }
    }
    
    var scores = trees.map(tree => { 
        // console.log("---"); 
        var tmp = xgboost_tree_predict(tree, tree[0], feature_values) 
        // console.log("> ", tmp);
        return tmp;
        });
    
    var score = scores.reduce((x,acc) => acc+x);
    
    return { score, 
        score_and_half: score+0.5, 
        logistic_score: 1/(1+Math.exp(score+0.5)),
        scores };
}

function test() {
    const fs = require('fs')
    var dump_txt = fs.readFileSync("dump.raw.txt", 'utf-8')
    var dump_obj = xgboost_parse_dump(dump_txt)
    //console.log(JSON.stringify(dump_obj, null, 4))
    
    var test_data = [
            [ 276.399999999999977, 116, 90.299999999999997, 179.599999999999994, 8.900000000000000, 870.100000000000023, 768.299999999999955, 28, 44.284354003999994 ],
            [ 322.199999999999989, 0, 115.599999999999994, 196, 10.400000000000000, 817.899999999999977, 813.399999999999977, 28, 31.178794196000002 ],
            [ 148.500000000000000, 139.400000000000006, 108.599999999999994, 192.699999999999989, 6.100000000000000, 892.399999999999977, 780, 28, 23.696600644000000 ],
            [ 159.099999999999994, 186.699999999999989, 0, 175.599999999999994, 11.300000000000001, 989.600000000000023, 788.899999999999977, 28, 32.768036376000005 ],
            [ 260.899999999999977, 100.500000000000000, 78.299999999999997, 200.599999999999994, 8.600000000000000, 864.500000000000000, 761.500000000000000, 28, 32.401235143999997 ],
            [ 401.8, 94.7, 0, 147.4, 11.4, 946.8, 852.1, 56, 75 ]
        ];

    for (var tmp of test_data) {
        var actual = tmp.pop();
        var predicted = xgboost_predict(dump_obj, tmp);
        console.log({actual, predicted})
    }
}

if (typeof global != "undefined")
    test();