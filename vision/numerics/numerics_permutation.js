// load_script : defintion copy pasted in any file that need to load script files
var load_script;
if (typeof load  != "undefined") { load_script = load; } // V8
else if (typeof LoadModule  != "undefined") { load_script = function(jsfile) { LoadModule('jsstd'); Exec(jsfile); }; } // JsLibs


function random_permutations(
	v,			///< [n] vector to be shuffled
	ran2) 	///< uniform random variable generator	
{
	function random_int(from_0_to_n_excluded) {
		return Math.floor(from_0_to_n_excluded * ran2());
	}

	var n = v.length;
	var w = v.slice(0,n);
	for (var i=0; i<n-1; i++) {
		// pick any value after us (because value already used are swapped to be before us) between i and vect_size-1
		//var rnd = i + random_int(n-i);
		// -- or simpler  --
		var rnd = Math.floor(n*ran2());
		
		// swap
		var tmp = w[i];
		w[i] = w[rnd]; 
		w[rnd] = tmp;
	}
	// last item default to last item left (the only that has not be used yet)
	
	return w;
}

function uniform_sampling(nbSimul) {
	var x = new Array(nbSimul);
	
	var step = 1.0 / (nbSimul+1);
	var proba = step;
	
	var odd = (nbSimul & 1) ? 1 : 0;
	var m = odd ? (nbSimul-1)/2 : nbSimul/2;
	for (var i=0; i<m; i++) {
		x[i] = proba;
		x[nbSimul-i-1] = 1.0-proba;
		proba += step;
	}
	if (odd)
		x[m] = 0.5;
	return x;
}	
	
function gaussian_sampling(nbSimul) {
	var x = new Array(nbSimul);
	
	var step = 1.0 / (nbSimul+1);
	var proba = step;
	
	var odd = (nbSimul & 1) ? 1 : 0;
	var m = odd ? (nbSimul-1)/2 : nbSimul/2;
	for (var i=0; i<m; i++) {
		x[i] = normal_cumulative_inv(proba);
		x[nbSimul-i-1] = -x[i];
		proba += step;
	}
	if (odd)
		x[m] = 0.0;
	return x;
}

/// Generates random variable with Balsam algorithm
function independent_to_correlated_gaussians(
	gauss_idpt,		///< [nbDim][nbSimul] independent Gaussian realisations
	corr_mtx,		///< [nbDim][nbDim] Correlation matrix
	// output
	gauss_corr)	///< [nbDim][nbSimul] ALLOCATED OUTPUT correlated Gaussian realisations
{
	nbSimul = gauss_idpt.length;	///< Number of simulation on each dimension
	nbDim = corr_mtx.length;  		///< Number of dimension
	
	/// Cholesky decomposition
	var chol_dec = mtx_make(nbDim,nbDim);
	for(var i=0; i<nbDim; i++)
		for(var j=0; j<nbDim; j++)
			chol_dec[i][j] = corr_mtx[i][j];
	///< arg is in/out: input is a symmetric definite positive matrix (from upper triangle), output is lower triangle
	chol_dec = cholesky_decomposition(chol_dec);		

	if (gauss_corr===undefined || gauss_corr.length==0) 
		gauss_corr = mtx_make(nbDim,nbSimul);
	
	// temporary variables 
	var idpt = new Array(nbDim);
	var corr = new Array(nbDim);
	for(var iSim=0; iSim<nbSimul; iSim++) {
		
		// get independent Gaussian vector corresponding to simulation iSimul
		for(var i=0; i<nbDim; i++)
			idpt[i] = gauss_idpt[i][iSim];

		// product with Cholseky matrix
		for(var i=0; i<nbDim; i++) {
			var tmp = 0.0;
			for (var j=0; j<nbDim; j++)
				tmp += chol_dec[i][j] * idpt[j];
			corr[i] = tmp;
		}

		// store correlated Gaussian vector corresponding to simulation iSimul
		for(var i=0; i<nbDim; i++)
			gauss_corr[i][iSim] = corr[i];
	}
	return gauss_corr;
}


function test() {
	load_script("../../quant/notes/base_utils.js");
	info_msg("numerics_permutation.js");
	load_script("numerics_base.js");
	load_script("numerics_choldc.js");
	load_script("numerics_ran2.js");
	load_script("numerics_special_fcts.js");
	
	var nbSimul = 20;
	var nbDim = 2;
	var gauss_mtx;			///< [nbDim][nbDim] Gaussian realisation
	
	var ran2 = ran2_init(-123456789);
	var tmp = [ ran2(), ran2(), ran2(), ran2(), ran2() ]; 
	info_msg("ran2 "+tmp);
	
	info_msg("uniform_sampling(even) " + uniform_sampling(20));
	info_msg("uniform_sampling(odd) " + uniform_sampling(21));
	info_msg("gaussian_sampling(even) " + gaussian_sampling(20));
	info_msg("gaussian_sampling(odd) " + gaussian_sampling(21));
	
	info_msg("gaussian_sampling(odd) " + gaussian_sampling(21));
	
	var ran2 = ran2_init(-12345678);
	var tmp = [ 0,1,2,3,4,5,6,7,8,9 ];
	tmp = random_permutations(tmp, ran2);
	info_msg("random_permutations "+tmp);
	
	// two factors
	var gauss_idpt = [ 
		random_permutations(gaussian_sampling(21),ran2), 
		random_permutations(gaussian_sampling(21),ran2) ];
	var rho = 0.8;
	var corr_mtx = [[1,rho],[rho,1]];
	var gauss_corr = independent_to_correlated_gaussians(gauss_idpt, corr_mtx);
	info_msg("gauss_corr "+gauss_corr);

	function compare_with_uniform_sampling(tirages) {
		var nbSimul = tirages.length;
		var actual = tirages.sort();
		var expected = uniform_sampling(nbSimul);
		var expected_actual_diff = new Array(nbSimul);;
		var step = 1.0 / (nbSimul+1);
		for (var iSimul=0; iSimul<nbSimul; iSimul++) 
			expected_actual_diff[iSimul] = Math.round((expected[iSimul] - actual[iSimul])/step*100)+"%";
		info_msg("(expected-actual)/step: "+expected_actual_diff);
	}
	function compare_with_gaussian_sampling(tirages) {
		var nbSimul = tirages.length;
		var unif = new Array(nbSimul);
		for (var iSimul=0; iSimul<nbSimul; iSimul++) 
			unif[iSimul] = normal_cumulative(tirages[iSimul]);
		compare_with_uniform_sampling(unif);
	}
	
	// one step gaussian increment
	var nbSimul = 2500;
	var nbSteps = 15;
	var gauss_idpt = random_permutations(gaussian_sampling(nbSimul),ran2); 
	info_msg("one time step increment.");
	compare_with_gaussian_sampling(gauss_idpt);
	// time step composition of gaussian increments
	var gauss_idpt = random_permutations(gaussian_sampling(nbSimul),ran2); 
	for (var iStep=1; iStep<nbSteps; iStep++) {
		tmp = random_permutations(gaussian_sampling(nbSimul),ran2);
		for (var iSimul=0; iSimul<nbSimul; iSimul++) 
			gauss_idpt[iSimul] += tmp[iSimul];
	}
	// we now expect a normal distribution of variance nbSteps; we normalise it 
	for (var iSimul=0; iSimul<nbSimul; iSimul++) 
		gauss_idpt[iSimul] /= Math.sqrt(nbSteps);
	// and take the normal cumulative (this should give a uniform)
	info_msg("time step composition of gaussian increments.");
	compare_with_gaussian_sampling(gauss_idpt);
	
	// brownian bridge
	var brownians = new Array(nbSteps); 	// [nbSteps][nbSimul]
	var b_t0 = new Array(nbSimul); for (var iSimul=0; iSimul<nbSimul; iSimul++) b_t0[iSimul] = 0.0;
	var b_tn = random_permutations(gaussian_sampling(nbSimul),ran2); for (var iSimul=0; iSimul<nbSimul; iSimul++) b_tn[iSimul] *= Math.sqrt(nbSteps);
	function bridge_brownians(i, i1, i2, b1, b2) {
		var a = (i2-i)/(i2-i1);
		var s = Math.sqrt((i2-i)*(i-i1)/(i2-i1));
		var b = random_permutations(gaussian_sampling(nbSimul),ran2); 
		var b_t = new Array(nbSimul); 
		for (var iSimul=0; iSimul<nbSimul; iSimul++) {
			b_t[iSimul] = ( a*b1[iSimul] + (1-a)*b2[iSimul] ) + b[iSimul]*s;
		}
		return b_t;
	}
	brownians[0] = b_t0;
	brownians[nbSteps-1] = b_tn;
	var ranges_to_bridge = [ [0, nbSteps-1] ];
	while (ranges_to_bridge.length!=0) {
		var rng = ranges_to_bridge.shift();
		var i = Math.floor((rng[0]+rng[1])/2);
		//info_msg("rng "+rng+" => "+i);
		brownians[i] = bridge_brownians(i, rng[0], rng[1], brownians[rng[0]],brownians[rng[1]]);
		if (rng[0] != i-1) ranges_to_bridge.push([rng[0],i]);
		if (i+1 != rng[1]) ranges_to_bridge.push([i, rng[1]]);
	}
	function dgts4(x) { return Math.round(x*10000)/10000; }
	/*function moments(v) {  
		var n=v.length();
		for (var i=0; i<nbSimul; i++) {
			x += v[i];
			x2 += v[i]*v[i];
		}
		x /= n;
		x2 /= n;
		return [ dgts4(x), dgts4(x2-x*x) ];
	}*/
	function check_brownians(brownians) {  // [nbSteps][nbSimul]  brownians
		var nbSteps=rows(brownians);
		var nbSimul=cols(brownians);
		for (var iStep=1; iStep<nbSteps; iStep++) {
			var b=brownians[iStep], p=brownians[iStep-1];
			var x=0, x2=0, dx=0, dx2=0;
			for (var i=0; i<nbSimul; i++) {
				x += b[i];
				x2 += b[i]*b[i];
				dx += b[i]-p[i];
				dx2 += (b[i]-p[i])*(b[i]-p[i]);
			}
			x /= nbSimul;
			x2 /= nbSimul;
			dx /= nbSimul;
			dx2 /= nbSimul;
			info_msg("step "+iStep+" E[X]="+dgts4(x)+" Var[X]="+dgts4(x2-x*x)+" E[dX]="+dgts4(dx)+" Var[dX]="+dgts4(dx2-dx*dx));
		}
	}
	check_brownians([b_t0, random_permutations(gaussian_sampling(nbSimul),ran2)]); info_msg("Expected Var "+nbSteps);
	check_brownians([b_t0, b_tn]); info_msg("Expected Var "+nbSteps);
	check_brownians(brownians);
	
	// variance driven importance sampling
	
	// weight deltas
}
test();