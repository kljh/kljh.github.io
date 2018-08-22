/* base function for matrix/vectors numerical operations */

function is_scalar(x) { return x.length==undefined; }
function is_vector(x) { return x.length!=undefined && x[0].length==undefined; }
function is_matrix(x) { return x.length!=undefined && x[0].length!=undefined; }

function vec_make(n, x) {
    if (x===undefined) x=0.0;
	var vec = Array(n);
    for (var i=0; i<n; i++) 
        vec[i] = x;
    return vec;
}

function vec_copy(v) {
    var n = v.length;
    var vec = Array(n);
    for (var i=0; i<n; i++) 
        vec[i] = v[i];
    return vec;
}

function mtx_make(n, m) {
    var mtx = Array(n);
    for (var i=0; i<n; i++) mtx[i] = Array(m);
    for (var i=0; i<n; i++) 
        for (var j=0; j<m; j++)
            mtx[i][j] = 0.0;
    return mtx;
}

function mtx_copy(A) {
    var n = A.length, m = A[0].length;
    var mtx = Array(n);
    for (var i=0; i<n; i++) {
        mtx[i] = Array(m);
        for (var j=0; j<m; j++)
            mtx[i][j] = A[i][j];
    }
    return mtx;
}

function rows(A) {
	return A.length;
}
function cols(A) {
	return rows(A)===0?0:A[0].length;
}

function mtx_diag(w) {
    var W = mtx_make(w.length, w.length); 
    for (var k=0; k<w.length; k++) W[k][k] = w[k];
    return W;
}

function mtx_trsp(m) {
    var t = mtx_make(m[0].length, m.length); 
    for (var i=0; i<m.length; i++) 
        for (var j=0; j<m[0].length; j++) 
            t[j][i] = m[i][j];
    return t;
}

function mtx_text(A) {
    var txt = "";
    var n = A.length, m = A[0].length;
    for (var i=0; i<n; i++) {
        for (var j=0; j<m; j++)
            txt += A[i][j] + "\t";
        txt += "\n";
    }
    return txt;
}
function mtx_html(A) {
    var txt = "[ ";
    var n = A.length, m = A[0].length;
    for (var i=0; i<n; i++) {
        txt += "[ ";
		for (var j=0; j<m; j++)
            txt += A[i][j] + ",   ";
        txt += "]<br/>";
    }
	txt += "]<br/>";
    return txt;
}

function mtx_prod(A, B) {
    var nA = A.length, mA = A[0].length;
    var nB = B.length, mB = B[0].length;
    if (mA!=nB) throw new Error("mtx_prod: dimension mismatch");
    
    var out = mtx_make(nA, mB);
    for (var i=0; i<nA; i++) {
        for (var j=0; j<mB; j++) {
            var tmp=0;
            for (var k=0; k<mA; k++) 
                tmp += A[i][k]*B[k][j];
            out[i][j] = tmp;
        }
    }
    return out;
}

function vec_2_mtx_row(v) { return [v]; }
function vec_2_mtx_col(v) { var m=[],i;n=v.length; for(i=0;i<n;i++) m.push([v[i]]); return m; }
function mtx_2_vec(m) { var n=m.length; if (n==1) return m[0]; var v=[]; for (var i=0; i<n; i++) v.push(m[i][0]); return v; }

function mtx_get_slice(mtx, i0, j0, n, m) {
	var res = mtx_make(n, m);
	for (var i=0; i<n; i++)
		for (var j=0; j<m; j++)
			res[i][j] = mtx[i0+i][j0+j];
	return res;
}
function mtx_set_slice(dest, i0, j0, src) {
	var n=rows(src), m=cols(src);
	require(i0+n <= rows(dest), "mtx_set_slice goes after the last row."); 
	require(j0+m <= cols(dest), "mtx_set_slice goes after the last column.");
	for (var i=0; i<n; i++)
		for (var j=0; j<m; j++)
			dest[i0+i][j0+j] = src[i][j];
}

function mtx_vec_prod(A, b) {
    var nA = A.length, mA = A[0].length;
    var nB = b.length;
    if (mA!=nB) throw new Error("mtx_vec_prod: dimension mismatch");
    
    var out = vec_make(nA);
    for (var i=0; i<nA; i++) {
        var tmp=0;
        for (var k=0; k<mA; k++) 
            tmp += A[i][k]*b[k];
        out[i] = tmp;
    }
    return out;
}

function vec_mtx_prod(a, B) {
    var mA = a.length;
    var nB = B.length, mB = B[0].length;
    if (mA!=nB) throw new Error("vec_mtx_prod: dimension mismatch");
    
    var out = vec_make(mB);
    for (var j=0; j<mB; j++) {
        var tmp=0;
        for (var k=0; k<mA; k++) 
            tmp += a[k]*B[k][j];
        out[j] = tmp;
    }
    return out;
}

function mtx_scalar_prod(A, b) {
	var n=rows(A), m=cols(A); 
	var res = mtx_make(n,m);
	for (var i=0; i<n; i++)
		for (var j=0; j<m; j++)
			res[i][j] = A[i][j]*b;
	return res;
}

function vec_scalar_prod(a, b) {
    var n = a.length;
    var res = vec_make(n);
    for (var i=0; i<n; i++) 
        res[i] = a[i] * b;
    return res;
}
