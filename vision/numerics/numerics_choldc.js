
/// Given a positive-definite symmetric matrix a[1..n][1..n], 
/// this routine constructs its Cholesky decomposition, A = L.L'. 
/// On input, only the upper triangle of a need be given; it is not modified. 
/// The Cholesky factor L is returned in the lower triangle of a, 
/// except for its diagonal elements which are returned in p[1..n].
function choldc(a, p)
{
	var n=rows(a);
	if (p==undefined) p = vec_make(n);

	for (var i=0; i<n; i++) {
		for (var j=i; j<n; j++) {
			var k;
			var sum;
			for (sum=a[i][j],k=i-1; k>=0; k--) 
				sum -= a[i][k]*a[j][k];
			if (i == j) {
				if (sum <= 0.0)
					nrerror("choldc failed");
				p[i]=Math.sqrt(sum);
			} else a[j][i]=sum/p[i];
		}
	}
	
	// -------
	
	// uses p to fill the diagonal 
	for (var i=0; i<n; i++) 
		a[i][i] = p[i];
	// fill the upper triangle with zero
	for (var i=0; i<n; i++) 
		for (var j=i+1; j<n; j++) 
			a[i][j] = 0;
}

function cholesky_decomposition(a) {
	choldc(a);
	return a;
}
