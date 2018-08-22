// linear interp, flat extrap
function interp_linear(x_in, y_in, x)
{
	var n=x_in.length;
	var i = lower_bound(x_in, x);

	//var epsilon = 1e-11;
	if (i==0)
		//assert(x_in[0] < x+epsilon, "interp_linear: before first point");
		return y_in[0];	
	if (i==n)
		//assert(x-epsilon < x_in[i-1], "interp_linear: after last point");
		return y_in[i-1]; 

	var xl = x_in[i-1], xr = x_in[i];
	var yl = y_in[i-1], yr = y_in[i];
	var delta = (yr-yl)/(xr-xl);

	return yl + delta*(x-xl);
}

// ...