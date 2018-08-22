
/// Given a matrix a[1..m][1..n], this routine computes its singular value decomposition, A = U.W.V'. 
/// The matrix U replaces A on output. 
/// The diagonal matrix of singular values W is output as a vector w[1..n]. 
/// The matrix V (not the transpose V') is output as v[1..n][1..n].

function svdcmp(a, w, v)
{
	var a=mtx_copy(a);
	var m=a.length;
	var n=a[0].length;
	
    // U dimension is m,n
	// W dimension is n,n  ~ stored as diag vector n
	// V dimension is n,n
	if (w==undefined || w.length==0) w = vec_make(n);
	if (v==undefined || v.length==0) v = mtx_make(n,n);
	assert(w.length==n);
	assert(v.length==n && v[0].length==n);

	var i,its,j,jj,k,l,nm;
	var anorm,c,f,g,h,s,scale,x,y,z;

	var rv1=Array(n);
	g=scale=anorm=0.0;
	for (i=0;i<n;i++) {
		l=i+2;
		rv1[i]=scale*g;
		g=s=scale=0.0;
		if (i < m) {
			for (k=i;k<m;k++) scale += fabs(a[k][i]);
			if (scale != 0.0) {
				for (k=i;k<m;k++) {
					a[k][i] /= scale;
					s += a[k][i]*a[k][i];
				}
				f=a[i][i];
				g = -SIGN(Math.sqrt(s),f);
				h=f*g-s;
				a[i][i]=f-g;
				for (j=l-1;j<n;j++) {
					for (s=0.0,k=i;k<m;k++) s += a[k][i]*a[k][j];
					f=s/h;
					for (k=i;k<m;k++) a[k][j] += f*a[k][i];
				}
				for (k=i;k<m;k++) a[k][i] *= scale;
			}
		}
		w[i]=scale *g;
		g=s=scale=0.0;
		if (i+1 <= m && i+1 != n) {
			for (k=l-1;k<n;k++) scale += fabs(a[i][k]);
			if (scale != 0.0) {
				for (k=l-1;k<n;k++) {
					a[i][k] /= scale;
					s += a[i][k]*a[i][k];
				}
				f=a[i][l-1];
				g = -SIGN(Math.sqrt(s),f);
				h=f*g-s;
				a[i][l-1]=f-g;
				for (k=l-1;k<n;k++) rv1[k]=a[i][k]/h;
				for (j=l-1;j<m;j++) {
					for (s=0.0,k=l-1;k<n;k++) s += a[j][k]*a[i][k];
					for (k=l-1;k<n;k++) a[j][k] += s*rv1[k];
				}
				for (k=l-1;k<n;k++) a[i][k] *= scale;
			}
		}
		anorm=Math.max(anorm,(fabs(w[i])+fabs(rv1[i])));
	}
	for (i=n-1;i>=0;i--) {
		if (i < n-1) {
			if (g != 0.0) {
				for (j=l;j<n;j++)
					v[j][i]=(a[i][j]/a[i][l])/g;
				for (j=l;j<n;j++) {
					for (s=0.0,k=l;k<n;k++) s += a[i][k]*v[k][j];
					for (k=l;k<n;k++) v[k][j] += s*v[k][i];
				}
			}
			for (j=l;j<n;j++) v[i][j]=v[j][i]=0.0;
		}
		v[i][i]=1.0;
		g=rv1[i];
		l=i;
	}
	for (i=Math.min(m,n)-1;i>=0;i--) {
		l=i+1;
		g=w[i];
		for (j=l;j<n;j++) a[i][j]=0.0;
		if (g != 0.0) {
			g=1.0/g;
			for (j=l;j<n;j++) {
				for (s=0.0,k=l;k<m;k++) s += a[k][i]*a[k][j];
				f=(s/a[i][i])*g;
				for (k=i;k<m;k++) a[k][j] += f*a[k][i];
			}
			for (j=i;j<m;j++) a[j][i] *= g;
		} else for (j=i;j<m;j++) a[j][i]=0.0;
		++a[i][i];
	}
	for (k=n-1;k>=0;k--) {
		for (its=0;its<30;its++) {
			var flag=true;
			for (l=k;l>=0;l--) {
				nm=l-1;
				if (fabs(rv1[l])+anorm == anorm) {
					flag=false;
					break;
				}
				if (fabs(w[nm])+anorm == anorm) break;
			}
			if (flag) {
				c=0.0;
				s=1.0;
				for (i=l;i<k+1;i++) {
					f=s*rv1[i];
					rv1[i]=c*rv1[i];
					if (fabs(f)+anorm == anorm) break;
					g=w[i];
					h=pythag(f,g);
					w[i]=h;
					h=1.0/h;
					c=g*h;
					s = -f*h;
					for (j=0;j<m;j++) {
						y=a[j][nm];
						z=a[j][i];
						a[j][nm]=y*c+z*s;
						a[j][i]=z*c-y*s;
					}
				}
			}
			z=w[k];
			if (l == k) {
				if (z < 0.0) {
					w[k] = -z;
					for (j=0;j<n;j++) v[j][k] = -v[j][k];
				}
				break;
			}
			if (its == 29) error_msg("no convergence in 30 svdcmp iterations");
			x=w[l];
			nm=k-1;
			y=w[nm];
			g=rv1[nm];
			h=rv1[k];
			f=((y-z)*(y+z)+(g-h)*(g+h))/(2.0*h*y);
			g=pythag(f,1.0);
			f=((x-z)*(x+z)+h*((y/(f+SIGN(g,f)))-h))/x;
			c=s=1.0;
			for (j=l;j<=nm;j++) {
				i=j+1;
				g=rv1[i];
				y=w[i];
				h=s*g;
				g=c*g;
				z=pythag(f,h);
				rv1[j]=z;
				c=f/z;
				s=h/z;
				f=x*c+g*s;
				g=g*c-x*s;
				h=y*s;
				y *= c;
				for (jj=0;jj<n;jj++) {
					x=v[jj][j];
					z=v[jj][i];
					v[jj][j]=x*c+z*s;
					v[jj][i]=z*c-x*s;
				}
				z=pythag(f,h);
				w[j]=z;
				if (z) {
					z=1.0/z;
					c=f*z;
					s=h*z;
				}
				f=c*g+s*y;
				x=c*y-s*g;
				for (jj=0;jj<m;jj++) {
					y=a[jj][j];
					z=a[jj][i];
					a[jj][j]=y*c+z*s;
					a[jj][i]=z*c-y*s;
				}
			}
			rv1[l]=0.0;
			rv1[k]=f;
			w[k]=x;
		}
	}
    var sv = { u: a, w: w, v: v };
    var sv = sort_sv(sv);
    return sv;
}

/// Computes (a^2 + b^2)^.5 without destructive underflow or overflow.
function pythag(a, b)
{
	var absa,absb;
	absa=fabs(a);
	absb=fabs(b);
	if (absa > absb) return absa*Math.sqrt(1.0+SQR(absb/absa));
	else return (absb == 0.0 ? 0.0 : absb*Math.sqrt(1.0+SQR(absa/absb)));
}

function fabs(a) { return Math.abs(a); }
function SIGN(a, b) { return b >= 0 ? (a >= 0 ? a : -a) : (a >= 0 ? -a : a); }
function SQR(a) { return a*a; }
function assert(test, msg) { if (!test) throw new Error(msg); }

function sort_indices(v, bDecr) {
    var indices=new Array(v.length), sorted=new Array(v.length); 
    for (var i=0; i<v.length; i++) { indices[i] = [v[i], i]; }
    if (bDecr)
        indices.sort(function(lhs, rhs) { return lhs[0]<rhs[0] ? 1 : -1; });
    else
        indices.sort(function(lhs, rhs) { return lhs[0]<rhs[0] ? -1 : 1; });
    for (var i=0; i<v.length; i++) { indices[i] = indices[i][1]; sorted[i] = v[indices[i]]; }
    return indices;
}
function sort_sv(sv) {
    var idx = sort_indices(sv.w, true);
    var n=idx.length, bSorted=true;
    for (var i=0; i<n; i++) if (idx[i]!=i) { bSorted= false; break; }
    if (bSorted) return sv;
    
    warn_msg("singular values were not sorted. permutation indices: "+idx.join(', '));
    sv.u = select_cols(sv.u, idx);
    sv.v = select_cols(sv.v, idx);
    sv.w = select_rows(sv.w, idx);  // actualy select_vals
    return sv;
}

if (false && (typeof window) === "undefined" ) {
    // load_script : defintion copy pasted in any file that need to load script files
	var load_script;
	if (typeof load  != "undefined") { load_script = load; } // V8
	else if (typeof LoadModule  != "undefined") { load_script = function(jsfile) { LoadModule('jsstd'); Exec(jsfile); }; } // JsLibs
    
	load_script("base_utils.js");
    load_script("base_tables.js");
    load_script("numerics_base.js");
    
    // example with and without need for permutation
    var m = [[7,2,0],[2,1,3],[0,3,1]];
    var m = [[1.0000000000000007,0.9390165913094501,0.8663904946300783],[0.9390165913094501,1.0000000000000016,0.7720472872197338],[0.8663904946300783,0.7720472872197338,0.9999999999999813]];
    info_msg("m  =  \n", mtx_text(m));
    var sv = svdcmp(m);
    
    info_msg("U  =  \n", mtx_text(sv.u));
    info_msg("W  =  \n", mtx_text(mtx_diag(sv.w)));
    info_msg("V'  =  \n", mtx_text(mtx_trsp(sv.v)));
    
    var check = mtx_prod(mtx_prod(sv.u,mtx_diag(sv.w)),mtx_trsp(sv.v));
    info_msg("UWV' =  \n", mtx_text(check));
}
