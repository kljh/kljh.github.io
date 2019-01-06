
/*
Given a matrix a[1..n][1..n], this routine replaces it by the LU decomposition of a row-wise permutation of itself.

- a and n are input.
- a is output, arranged as in equation (2.3.14).
- indx[1..n] is an output vector that records the row permutation effected by the partial pivoting.
- d is output as +-1 depending on whether the number of row interchanges was even or odd, respectively.

This routine is used in combination with lubksb to solve linear equations or invert a matrix.
*/

function ludcmp(a, indx)
{
	if (indx==undefined) indx = Array(n);

	var TINY = 1.0e-20;

	var d = 1.0;
	var big, dum, sum, temp;
    var i, j, k, imax, n=a.length;

    var vv = Array(n);
	for (i=0; i<n; i++) {
		big = 0.0;
		for (j=0;j<n;j++)
			big = Math.max(big, Math.abs(a[i][j]));
		if (big==0.0) throw new Error("Singular matrix in routine ludcmp" );
		vv[i]=1.0/big;
	}

    for (j=0; j<n; j++) {
		for (i=0; i<j; i++) {
			sum = a[i][j];
			for (k=0;k<i;k++)
                sum -= a[i][k]*a[k][j];
			a[i][j] = sum;
		}
		big = 0.0;
		for (i=j; i<n; i++) {
			sum=a[i][j];
			for (k=0; k<j; k++)
                sum -= a[i][k]*a[k][j];
			a[i][j]=sum;

            var dum=vv[i]*Math.abs(sum);
			if (dum >= big) {
				big=dum;
				imax=i;
			}
		}
		if (j != imax) {
			for (k=0;k<n;k++) {
				dum=a[imax][k];
				a[imax][k]=a[j][k];
				a[j][k]=dum;
			}
			d = -d;
			vv[imax]=vv[j];
		}
		indx[j]=imax;
		if (a[j][j] == 0.0) a[j][j]=TINY;
		if (j != n-1) {
			dum = 1.0/(a[j][j]);
			for (i=j+1;i<n;i++) a[i][j] *= dum;
		}
	}

    return { a: a, indx: indx, d: d };
}

/*

Solves the set of n linear equations A . X = B.

Here a[1..n][1..n] is input, not as the matrix A but rather as its LU decomposition, determined by the routine ludcmp.
- indx[1..n] is input as the permutation vector returned by ludcmp.
- b[1..n] is input as the right-hand side vector B, and  returns with the solution vector X.
- a, n, and indx are not modified by this routine and can be left in place for successive calls with different right-hand sides b.

This routine takes into account the possibility that b will begin with many zero elements, so it is effcient for use in matrix inversion.
*/

function lubksb(a, indx, b)
{
	var i, ii=0, ip, j;
	var sum;

	var n = a.length;
	for (i=0;i<n;i++) {
		ip=indx[i];
		sum=b[ip];
		b[ip]=b[i];
		if (ii != 0)
			for (j=ii-1;j<i;j++) sum -= a[i][j]*b[j];
		else if (sum != 0.0)
			ii=i+1;
		b[i]=sum;
	}
	for (i=n-1;i>=0;i--) {
		sum=b[i];
		for (j=i+1;j<n;j++) sum -= a[i][j]*b[j];
		b[i]=sum/a[i][i];
	}
}


/// Solves linear equations using LU decomposition

function lusolve(mat, vec) {
	var N = mat.length;

    var tmp = mtx_copy(mat);
	var indx = Array(N);
	var d;
	ludcmp(tmp, indx, d); // LU decomposition.

 	var out = vec_copy(vec);
 	lubksb(tmp, indx, out);
	return out;
}

/// Matrix inversion using LU decomposition

function luinv(mat) {
	var N = mat.length;
	var out = mtx_make(N, N);

    var tmp = mtx_copy(mat);
	var indx = Array(N);
	var d;
	ludcmp(tmp, indx, d); // LU decomposition.

 	var i, j;
    var col = Array(N);
 	for(j=0; j<N; j++) {
		// find inverse by columns.
		for(i=0; i<N; i++)
			col[i]=0.0;
		col[j]=1.0;

		lubksb(tmp, indx, col);
		for(i=0; i<N; i++)
			out[i][j]=col[i];
 	}
	return out;
}
function mtx_inv(mat) {
	return luinv(mat);
}

if (false && (typeof window) === "undefined" ) {
	// load_script : defintion copy pasted in any file that need to load script files
	var load_script;
	if (typeof load  != "undefined") { load_script = load; } // V8
	else if (typeof LoadModule  != "undefined") { load_script = function(jsfile) { LoadModule('jsstd'); Exec(jsfile); }; } // JsLibs

	load_script('base_utils.js');
	load_script('numerics_base.js');

	var m = [[1,5,0],[5,1,2],[0,2,1]];
    var mi = luinv(m);
    info_msg("m  =  \n", mtx_text(m));
    info_msg("mi =  \n", mtx_text(mi));
    info_msg("id ?= \n", mtx_text(mtx_prod(m,mi)));
}

if (typeof exports !="undefined") {
	exports.mtx_inv = mtx_inv;
	exports.lusolve = lusolve;

	// bring some functions of numerics_base.js in this scope
	const base = require("../../vision/numerics/numerics_base.js");
	var { vec_copy, mtx_make, mtx_copy } = base;
}
