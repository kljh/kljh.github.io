const AWS = require('aws-sdk');
const ddb = configure_dynamo_db_aws();

function configure_dynamo_db_local() {
    AWS.config.update({
      region: 'fakeRegion',  
      accessKeyId: "fakeMyKeyId",
      secretAccessKey: "fakeMyKeyId",
      });

    var ddb = new AWS.DynamoDB({ apiVersion: '2012-10-08' });
    
    // Create the DynamoDB service object
    //console.log(ddb.endpoint)
    ddb.endpoint.protocol = 'http';
    ddb.endpoint.host = 'localhost',
    ddb.endpoint.hostname = 'localhost',
    ddb.endpoint.port = 8000,
    ddb.endpoint.href = "http://localhost:8000";
    //console.log(ddb.endpoint)
    return ddb;
}

function configure_dynamo_db_aws() {
    var ddb = new AWS.DynamoDB({apiVersion: '2012-10-08', 
		region: 'eu-west-3' });
    return ddb;
}

function create_quiz_table_promise(ddb) {
    return new Promise(function(resolve, reject) {
        var create_table_prms = {
           "TableName": "quiz",
           "ProvisionedThroughput": {
                "ReadCapacityUnits": 5,
                "WriteCapacityUnits": 5
            },
            "KeySchema": [
                {
                    "AttributeName": "uid",
                    "KeyType": "HASH"
                },
                {
                    "AttributeName": "timestamp",
                    "KeyType": "RANGE"
                }
            ],
            "AttributeDefinitions": [
                {
                    "AttributeName": "uid",
                    "AttributeType": "S"
                },
                {
                    "AttributeName": "timestamp",
                    "AttributeType": "S"
                }
            ]
        };
     
        ddb.createTable(create_table_prms, function(err, data) {
            if (err) reject(err);
            else     resolve(data);
        });
    })
}

async function test_dynamo_db(uid) {
    try { 
        var userid = uid || "test_user";
        var qid = "test_question"
        var answer = { oui: false, non: false, maybe: true, reason: [ "pt'etre ben qu'oui", "pt'etre ben qu'nan." ], o: { a: "abc", b: false, c: 123 } };
        
		var replace = true;
        var add_user_status = await add_user(userid, replace);
		console.log("add_user_status (replaced item)", JSON.stringify(add_user_status, null,4));
    
        var user = await get_user(userid);
        console.log("user", JSON.stringify(user, null,4));
    
        var user = await update_user_with_answer(userid, qid, answer);
        console.log("updated user", JSON.stringify(user, null,4));

        return "OK";
    } catch (e) {
        console.error("ERROR with dynamodb test", e);
		return "PB";
    }
}

function add_user(userid, replace) {
    return new Promise(function (resolve, reject) {
        var put_item_prms = {
            "TableName": "quiz",
            "ReturnValues": "ALL_OLD", 
            //"ReturnConsumedCapacity": "TOTAL", 
            "Item": {
                "uid": { "S": "user_"+userid },
                "timestamp": { "S": "-" }, 
				"score" : { "N": "0" },
                "scored" : { "N": "0" },
                //"comments" : { "S": "this is a test item" } ,
                "actions" : { "L": [ { S: "created "+(new Date().toISOString()) }, { N: ""+Math.random() } ] },
                "answers" : { "M": {} },
            }, 
            
        };
		if (!replace) {
            // disable overwrite 
			put_item_prms["ConditionExpression"] = "attribute_not_exists(uid)"; 
		}
		
        ddb.putItem(put_item_prms, function(err, data) {
            if (err) {
                reject({ put_item_prms, err, message: err.message, stack: err.stack });
            } else {
                if (data.Item) data.Item = dynamo_attribute_value_to_js_value(data.Item);
                if (data.Attributes) data.Attributes = dynamo_attribute_value_to_js_value(data.Attributes);
                resolve( data.Item || data.Attributes || data );
            }
        });
    });
}

function get_user(userid) {
    return new Promise(function (resolve, reject) {
        var get_item_prms = {
            "TableName": "quiz",
            "Key": {
                "uid": {
                    "S": "user_"+userid
                },
                "timestamp": {
                    "S": "-"
                }
            },
            //"ProjectionExpression":"LastPostDateTime, Message, Tags",
            //"ConsistentRead": false,
            //"ReturnConsumedCapacity": "TOTAL"
        };
        ddb.getItem(get_item_prms, function(err, data) {
            if (err) {
                reject({ get_item_prms, err, message: err.message, stack: err.stack });
            } else {
                if (data.Item) data.Item = dynamo_attribute_value_to_js_value(data.Item);
                if (data.Attributes) data.Attributes = dynamo_attribute_value_to_js_value(data.Attributes);
                resolve( data.Item || data.Attributes || data );
            }
        });
    });
}

function update_user_with_answer(userid, qid, answer) {
    //console.log("adding answer", JSON.stringify(answer, null, 4));
    
    var dynamo_attr_val = js_value_to_dynamo_attribute_value(answer);
    //console.log("dynamo_attr_val", JSON.stringify(dynamo_attr_val, null, 4));
    
    var expression = "";
    var expr_names = {};
    var expr_vals = {};
    
    if (qid) {
        expression = "SET answers.#id = :a ";
        expr_names["#id"] = qid;
        expr_vals[":a"] = dynamo_attr_val;
		
		if (answer.score !== undefined && answer.score !== null) { 
			expression += "ADD score :si , scored :ni ",
			expr_vals[":si"] = { "N" : ""+answer.score };
			expr_vals[":ni"] = { "N" : ""+1 };
		}
    } 
    if (!qid) {
        expression += (!expression?"SET":",") + " actions = list_append(actions, :al) "
        expr_vals[":al"] = { "L": [ dynamo_attr_val ] };
    }
    
    return new Promise(function (resolve, reject) {
        var update_item_prms = {
            "TableName": "quiz",
            "Key": {
                "uid": {
                    "S": "user_"+userid
                },
                "timestamp": {
                    "S": "-"
                }
            },
            "UpdateExpression": expression,
            "ExpressionAttributeNames": expr_names,
            "ExpressionAttributeValues": expr_vals,
            "ReturnValues": "ALL_NEW",
            //"ReturnConsumedCapacity": "TOTAL"
        };
        
        if (Object.keys(expr_names).length==0) {
            // empty struct not allowed
            delete update_item_prms.ExpressionAttributeNames; 
        }
            
        ddb.updateItem(update_item_prms, function(err, data) {
            if (err) {
                console.error("update_item_prms:", JSON.stringify(update_item_prms, null, 4));
                console.error("ERROR:", err);
                reject({ update_item_prms, err, message: err.message, stack: err.stack });
            } else {
                if (data.Item) data.Item = dynamo_attribute_value_to_js_value(data.Item);
                if (data.Attributes) data.Attributes = dynamo_attribute_value_to_js_value(data.Attributes);
                resolve( data.Item || data.Attributes || data );
            }
        });
    });
}

function delete_user(userid) {
    return new Promise(function (resolve, reject) {
        var delete_prms = {
            "TableName": "quiz",
            "Key": {
                "uid": {
                    "S": "user_"+userid
                },
                "timestamp": {
                    "S": "-"
                }
            }
        };
        ddb.deleteItem(delete_prms, function(err, data) {
            if (err) {
                reject({ delete_prms, err, message: err.message, stack: err.stack });
            } else {
                resolve( data );
            }
        });
    });
}

function get_users() {
    return new Promise(function (resolve, reject) {
        var scan_prms = {
            "TableName": "quiz",
            "ProjectionExpression": "uid, score, scored",
            /*
			"KeyConditionExpression": "#yr = :yyyy and title between :letter1 and :letter2",
			"ExpressionAttributeNames:{
				"#yr": "year"
			},
			ExpressionAttributeValues: {
				":yyyy": 1992,
				":letter1": "A",
				":letter2": "L"
			}*/
        };
        ddb.scan(scan_prms, function(err, data) {
            if (err) {
                reject({ scan_prms, err, message: err.message, stack: err.stack });
            } else {
                if (data.Items) data.Items = data.Items.map(item => dynamo_attribute_value_to_js_value(item));
				resolve( data );
            }
        });
    });
}

function js_value_to_dynamo_attribute_value(a) {
    if (typeof a=="string") return a.length ? { "S": a } : { "NULL": true }; // empty string not allowed by DynamoDB
    if (typeof a=="number") return { "N": ""+a };
    if (typeof a=="boolean") return { "BOOL": a };
    if (typeof a=="undefined" || a===null) return { "NULL": true };
    if (Array.isArray(a)) {
        // List
        return { "L": a.map(js_value_to_dynamo_attribute_value) }
    }
    if (typeof a=="object") {
        // Map
        var kv = {};
        for (var k in a)
            kv[k] = js_value_to_dynamo_attribute_value(a[k]);
        return { "M": kv };
    }
} 

function dynamo_attribute_value_to_js_value(a) {
    
    function impl(a) {
        var err_msg = "Expected DynamoDB attribute, e.g. a JS object with exactly one key among N, NS, S, SS, BOOL, NULL, B, BS, L or M."
        
        var keys = Object.keys(a);
        if (keys.length!=1) throw new Error(err_msg+" "+JSON.stringify(a));
        
        var typ = keys[0];
        var val = a[keys[0]];
        switch (typ) {
            case 'N': return val*1;
            case 'NS': return val.map(x => x*1);
            case 'S': return val;
            case 'SS': return val;
            case 'BOOL': return !!val;
            case 'NULL': return null;
            case 'B':
            case 'BS':
                throw new Error(err_msg+" Types 'B' and 'BS' are not supported.");
            case 'L':
                return val.map(x => impl(x));
            case 'M':
                var kv = {};
                for (var k in val) 
                    kv[k] = impl(val[k]);
                return kv;
            default:
                throw new Error(err_msg+" Type '"+typ+"' unknown. "+JSON.stringify(a));
        }
    }
    
    return impl({ "M": a });
}

module.exports = {
    add_user: add_user,
    get_user: get_user,
    update_user_with_answer: update_user_with_answer
};

function test() {
	var userid = "test27@test.com", 
		replace = true, 
		answer = {score: 0.7 } ;
	
	var userid0 = "test31@test.com"; 
	
	Promise.resolve()
	//.then(_ => create_quiz_table_promise(ddb))
	//.then(_ => test_dynamo_db(userid))
	//.then(_ => add_user(userid, replace))
	.then(_ => update_user_with_answer(userid, "q12", answer))
	//.then(_ => delete_user(userid0))
	.then(_ => get_users())
	.then(x=> console.log(JSON.stringify(x, null, 4)))
	.catch(console.error);
}
// test();
