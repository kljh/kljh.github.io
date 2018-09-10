'use strict';

var bVerbose = false;

/*

Based Tensorflow MNIST tutorial (with reduced number of features/neurons to keep size of trained data under control)
https://www.tensorflow.org/versions/r1.1/get_started/mnist/beginners
https://www.tensorflow.org/versions/r1.2/get_started/mnist/pros

Exporting Tensorflow training results from Python: 
    training_results = {
        "W_conv1": sess.run(W_conv1).tolist(), 
        "b_conv1": sess.run(b_conv1).tolist(),
        ...
        "labels" : labels.tolist(),
        "imgs" : imgs.tolist(),
        ...
        "ximgs" : x_image.eval(feed_dict={ x: imgs, y_: labels, keep_prob: 1.0}).tolist(),
        ...
        "y_conv" : y_conv.eval(feed_dict={ x: imgs, y_: labels, keep_prob: 1.0}).tolist(),
        "y" : tf.nn.softmax(y_conv).eval(...),
        "digit": tf.argmax(y_conv,1).eval(...),
        }

Layer 1 and 2 dimensions: nb_images x width x height x nb_features
Layer 3 and 4 dimensions: nb_images x nb_features

*/


function images_convolution(ximgs, W, b) {
    var nb_imgs = ximgs.length;
    var yimgs = new Array(nb_imgs);
    for (var i=0; i<nb_imgs; i++)
        yimgs[i] = image_convolution(ximgs[i], W, b);
    return yimgs;
}

function image_convolution(ximg, W, b) {
    var img_dim1 = ximg.length;
    var img_dim2 = ximg[0].length;
    var img_dim3 = ximg[0][0].length; // nb_channels
    if (bVerbose) console.log("image_convolution ximg dim1, dim2, dim3/nb_channels: \n", img_dim1, img_dim2, img_dim3)
    
    var filter_dim1 = W.length;
    var filter_dim2 = W[0].length;
    var filter_dim3 = W[0][0].length;
    var filter_dim4 = W[0][0][0].length; 
    if (bVerbose) console.log("image_convolution filter dim1, dim2, dim3/nb_colors/nb_channels_in, dim4/nb_features/nb_channels_out): \n", filter_dim1, filter_dim2, filter_dim3, filter_dim4);
    
    var filter_bias_nb_features = b.length;
    if (bVerbose) console.log("image_convolution filter bias nb_features: \n", filter_bias_nb_features)

    var out_dim1 = img_dim1;
    var out_dim2 = img_dim2;
    var out_dim3 = filter_dim4;
    
    // iterate on output
    var off1 = (filter_dim1-1)/2;
    var off2 = (filter_dim2-1)/2;
    var yimg = new Array(out_dim1);
    for (var oi=0; oi<out_dim1; oi++) {
        yimg[oi] = new Array(out_dim2);
        for (var oj=0; oj<out_dim2; oj++) {
            yimg[oi][oj] = new Array(out_dim3); // also filter_dim4
            for (var ok=0; ok<out_dim3; ok++) { 
                
                // convolution
                var tmp = 0.0;
                for (var fi=0; fi<filter_dim1; fi++) {
                    for (var fj=0; fj<filter_dim2; fj++) {
                        for (var fk=0; fk<filter_dim3; fk++) {
                            if ( (oi+fi-off1)<0 || (oi+fi-off1)>=img_dim1) continue;
                            if ( (oj+fj-off2)<0 || (oj+fj-off2)>=img_dim2) continue;
                            
                            tmp += W[fi][fj][fk][ok]
                               * ximg[oi+fi-off1][oj+fj-off2][fk];
                        }
                    }
                }
                tmp += b[ok];
                yimg[oi][oj][ok] = tmp;
            }
        }
    }    
    return yimg;
}

// RELU neuron: in-place floor values to zero
function relu(x) {
    for (var i=0; i<x.length; i++) {
        if (Array.isArray(x[i])) 
            relu(x[i]);
        else
            x[i] = Math.max(x[i], 0.0);
    }
    return x;
}

function max_pool_2x2(x) {
    var n1 = x.length;
    var n2 = x[0].length/2;
    var n3 = x[0][0].length/2;
    var n4 = x[0][0][0].length;
    
    var y = new Array(n1);
    for (var i1=0; i1<n1; i1++) {
        y[i1] = new Array(n2);
        for (var i2=0; i2<n2; i2++) {
            y[i1][i2] = new Array(n3);
            for (var i3=0; i3<n3; i3++) {
                y[i1][i2][i3] = new Array(n4);
                for (var i4=0; i4<n4; i4++) {
                    y[i1][i2][i3][i4] = Math.max(
                        x[i1][2*i2][2*i3][i4],
                        x[i1][2*i2][2*i3+1][i4],
                        x[i1][2*i2+1][2*i3][i4],
                        x[i1][2*i2+1][2*i3+1][i4] );
                }
            }
        }
    }
    return y;
}

function make_flat(x) {
    var n1 = x.length;
    var n2 = x[0].length;
    var n3 = x[0][0].length;
    var n4 = x[0][0][0].length;
    var N = n2*n3*n4;
    if (bVerbose) console.log("make_flat : \n", n1, " x ", n2, n3, n4, " => ", n1, " x ", N)
    
    var y = new Array(n1);
    for (var i1=0; i1<n1; i1++) {
        y[i1] = new Array(N);
        
        var k=0;
        for (var i2=0; i2<n2; i2++) 
            for (var i3=0; i3<n3; i3++) 
                for (var i4=0; i4<n4; i4++) 
                {
                    y[i1][k] =  x[i1][i2][i3][i4];
                    k++;
                }
    }
    return y;    
}

function mtxmult_xW_plus_b(x, W, b) {
    var nb_samples = x.length; // nb samples
    
    var nb_features_in = x[0].length; // input features vector size
    var nb_features_out = b.length;   // bias size
    
    var dim1 = W.length;    // nb_features_in
    var dim2 = W[0].length; // nb_features_out
    
    if (bVerbose) console.log("mtxmult_xW_plus_b nb_features in/out: ", nb_features_in, nb_features_out)
    if (bVerbose) console.log("mtxmult_xW_plus_b dim", dim1, dim2)
    
    var out = new Array(nb_samples);
    for (var is=0; is<nb_samples; is++) {
        out[is] = new Array(nb_features_out);
        
        for (var io=0; io<nb_features_out; io++) {
            var tmp = b[io];
            for (var ii=0; ii<nb_features_in; ii++)
                tmp += x[is][ii] * W[ii][io];
            out[is][io] = tmp;
        }
    }
    return out;
}
    
function get_feature_image(ximg, k) {
    var n = ximg.length;
    var m = ximg[0].length;
    
    var yimg = new Array(n);
    for (var i=0; i<n; i++) {
        yimg[i] = new Array(m);
        for (var j=0; j<m; j++) {
            yimg[i][j] = ximg[i][j][k];
        }
    }
    return yimg;
}

function ximgs_eval(training_data, ximgs) {
    
    if (bVerbose) console.log("\n  ximgs_eval: layer1");
    var ximgs1 = relu(images_convolution(ximgs, training_data.conv1.W, training_data.conv1.b));
    var pool1 = max_pool_2x2(ximgs1);
    
    if (bVerbose) console.log("\n  ximgs_eval: layer2");
    var ximgs2 = relu(images_convolution(pool1, training_data.conv2.W, training_data.conv2.b));
    var pool2 = max_pool_2x2(ximgs2);
    
    if (bVerbose) console.log("\n  ximgs_eval: layer3 densely connected");
    var flat2 = make_flat(pool2);
    var fc3_pre = mtxmult_xW_plus_b(flat2, training_data.fc1.W, training_data.fc1.b);
    var fc3 = relu(fc3_pre);
    
    if (bVerbose) console.log("\n  ximgs_eval: layer4");
    var fc4 = mtxmult_xW_plus_b(fc3, training_data.fc2.W, training_data.fc2.b);

    /*
    var val = ximgs2;
    var ref = training_data.h_conv2;
    
    var iRow = 5
    console.log("row "+iRow)
    console.log("y (feature 0)", get_feature_image(val[0], 0)[iRow])
    console.log("h (feature 0)", get_feature_image(ref[0], 0)[iRow])
    console.log()
    
    */
    
    var summary = [];
    var probas = [];
    var nb_img = ximgs.length;
    for (var i=0; i<nb_img; i++) {
        var max_score = fc4[i].reduce((acc, x, p) => { return Math.max(acc, x); }, 0.0);
        var label = fc4[i].reduce((acc, x, p) => { return acc + (Math.abs(x-max_score)<1e-13?1:0) * p }, 0.0);
        
        var expf = fc4[i].map(x => Math.exp(x));
        var exps = expf.reduce((acc, x) => acc+x, 0.0);
        var proba = expf[label]/exps;
        probas.push(expf.map(x => x/exps));
        
        summary.push({ label: label, score: max_score, proba: proba });
    }
    
    return { summary: summary, pool1: pool1, pool2: pool2, fc3: fc3, fc4: fc4, probas: probas };
}

if (typeof exports != "undefined") {
    var fs = require("fs")
    
    var training_path = "training_results - v1.json"
    var training_path = "training_results.json"
    var training_data = JSON.parse(fs.readFileSync(training_path, { "encoding": "ascii"}));
    
    var res = ximgs_eval(training_data, training_data.ximgs);
    
    var nb_img = training_data.labels.length;
    for (var i=0; i<nb_img; i++) {
        var label = training_data.labels[i].reduce((acc, x, p) => { return acc + p * training_data.labels[i][p] }, 0.0);
        var score = training_data.y_conv[i].reduce((acc, x, p) => { return acc + x * training_data.labels[i][p] }, 0.0);
        
        console.log("label (tensorflow vs manual )", label, res.summary[i].label);
        console.log("score (tensorflow vs manual )", score, res.summary[i].score);
        console.log();
    }
}