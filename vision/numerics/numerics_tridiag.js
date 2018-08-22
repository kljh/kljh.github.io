
/// Solves for a vector u[1..n] the tridiagonal linear set given by equation M.u=r. 
/// a,b,c are lower_diag, diag, and upper_diag respectively
/// lower_diag[1] and upper_diag[n] are discarded. u must be allocated.
function tridag(n, a, b, c, r, u)
{
	var j;
	var bet;

	var n=a.length;
	var gam = Array(n);
	if (b[0] == 0.0) error_msg("Error in tridag b[0]="+b[0]);
	u[0]=r[0]/(bet=b[0]);
	for (j=1;j<n;j++) {
		gam[j]=c[j-1]/bet;
		bet=b[j]-a[j]*gam[j];
		if (bet == 0.0) nrerror("Error in tridag bet="+bet);
		u[j]=(r[j]-a[j]*u[j-1])/bet;
	}
	for (j=(n-2);j>=0;j--)
		u[j] -= gam[j+1]*u[j+1];
}



/// -df/dt(t,x) = mu(t,x).df/dx(t,x) + 1/2.sigma^2(t,x).d2f/dx2(t,x)
/// -f_t        = c0.f + c1.f_x + c2.f_xx
/// (fout-fin)/dt = c0.f + c1.f_x + c2.f_xx
function backward_coefs(
	n, x, mu, sigma2,
    // out
	c0, c1, c2
	)
{
	// Note: we could remove together 
	// - the divide 2 on sigma2 below in the second order term
	// - the multiply 2 on 1/(x[i+1]-x[i-1]) for the second order finite differences in pde_step_1d

	for (var i=0; i<n; i++) {
		c0[i] = 0;
		c1[i] = mu[i];
		c2[i] = sigma2[i]/2.0;	
	}
}

/// df/dt(t,x) = -d/dx( mu(t,x).f(t,x) ) + 1/2.d2/dx2( sigma^2(t,x).f(t,x) )
/// df/dt(t,x) = - mu(t,x).df/dx(t,x) + 1/2.sigma^2(t,x).d2f/dx2(t,x)
/// 			 - dmu/dx(t,x).f(t,x) +    dsigma^2/dx(t,x).df/dx(t,x)
///									  + 1/2.d2sigma^2/dx2(t,x).f(t,x)
/// df/dt(t,x) =  [ -dmu/dx + 1/2.d2sigma^2/dx2 ].f 
///				+ [ - mu	+     dsigma^2/dx   ].f_x
///				+ [              1/2.sigma^2    ].f_xx
///
///  f_t		= c0.f + c1.f_x + c2.f_xx
/// (fout-fin)/dt = c0.f + c1.f_x + c2.f_xx
function forward_coefs(
	n, x, mu, sigma2,
    // out
	c0, c1, c2
	)
{
	var i=0;
	c0[i] = - (mu[i+1]-mu[i]) / (x[i+1]-x[i]);
	c1[i] = - mu[i] + (sigma2[i+1]-sigma2[i]) / (x[i+1]-x[i]);
	c2[i] = sigma2[i]/2.0;

	for (i=1; i<n-1; i++) {
		c0[i] = - (mu[i+1]-mu[i-1]) / (x[i+1]-x[i-1])
				+  ((sigma2[i+1]-sigma2[i])/(x[i+1]-x[i])-(sigma2[i]-sigma2[i-1])/(x[i]-x[i-1])) / (x[i+1]-x[i-1]); // 0.5*2.0;
		c1[i] = - mu[i] + (sigma2[i+1]-sigma2[i-1]) / (x[i+1]-x[i-1]);
		c2[i] = sigma2[i]/2.0;
	}

	c0[i] = - (mu[i]-mu[i-1]) / (x[i]-x[i-1]);
	c1[i] = - mu[i] + (sigma2[i]-sigma2[i-1]) / (x[i]-x[i-1]);
	c2[i] = sigma2[i]/2.0;

}


// theta : implicit=1, explicit=0

// forward :
// f_t = c0.f + c1.f_x + c2.f_xx

// (f[s+1,i]-f[s,i])/dt 	 
//	= theta  .    ( c0.f[s+1,i] + c1.(f[s+1,i+1]-f[s+1,i-1])/{2dx} + c2.(f[s+1,i+1]-f[s+1,i]+f[s+1,i-1])/{dx^2} )
//  + (1-theta) . ( c0.f[s,i]   + c1.( f[s, i+1]- f[s, i-1])/{2dx} + c2.( f[s, i+1]- f[s, i]+ f[s, i-1])/{dx^2} )

// f[s+1,i]/dt -   theta  .  ( c0.f[s+1,i] + c1.(f[s+1,i+1]-f[s+1,i-1])/{2dx} + c2.(f[s+1,i+1]-f[s+1,i]+f[s+1,i-1])/{dx^2} )
// = f[s,i]/dt + (1-theta) . ( c0.f[s,i]   + c1.( f[s, i+1]- f[s, i-1])/{2dx} + c2.( f[s, i+1]- f[s, i]+ f[s, i-1])/{dx^2} )

// Forward :
// (f1-f0)/dt = theta_impl . L(f1) + theta_expl . L(f0)
// f_1/dt - theta_impl.L(f_1) =  f_0/dt + theta_expl.L(f_0)
// [ 1 - (theta_impl*dt)L ] (f_1) = [ 1 + (theta_expl*dt).L ] (f_0)
// [ 1 - (theta_impl*dt)L ] (fout) = [ 1 + (theta_expl*dt).L ] (fin)

// Backward :
// (f0-f1)/dt = theta_impl . L(f0) + theta_expl . L(f1)
// f_0/dt - theta_impl.L(f_0) =  f_1/dt + theta_expl.L(f_1)
// [ 1 - (theta_impl*dt)L ] (f_0) = [ 1 + (theta_expl*dt).L ] (f_1)
// [ 1 - (theta_impl*dt)L ] (fout) = [ 1 + (theta_expl*dt).L ] (fin)

function pde_step_1d(
    n, cn, dt,
    x, c0, c1, c2, fin,
    // out
	fout, mem
	)
{
	var i=0;
	var theta_impl_dt = dt * cn; 
	var theta_expl_dt = dt * (1.0-cn); 

    if (!mem.upper) { mem.upper = new Array(n); mem.diag = new Array(n); mem.lower = new Array(n); mem.r = new Array(n); }
	var upper = mem.upper;
	var diag  = mem.diag;
	var lower = mem.lower;
	var r     = mem.r;		///< temporary variable: [ 1 + (theta_expl*dt).L ] (fin)
	
	// indices of band diag vectors are row indices 
	// diag lower[0] and upper[n] are discarded.
	lower[0] = upper[n-1] = -1e99;	// not used

	// explicit term : 
	// r = [ 1 + (theta_expl*dt).L ] (fin)
	
	{
		var tau = +theta_expl_dt;

		i = 0;
		upper[i] = 0.0 + tau * (         c1[i]/(x[i+1]-x[i]) );	// terms in fout[i+1]
		diag[i]  = 1.0 + tau * ( c0[i] - c1[i]/(x[i+1]-x[i]) );	// terms in fout[i]
		lower[i] = 0.0;		// outside the matrix
		for (i=1; i<n-1; i++) {
			upper[i] =     + tau * (         c1[i]/(x[i+1]-x[i-1])  + c2[i]*(  1/(x[i+1]-x[i])                   )/(x[i+1]-x[i-1])*2.0 );  // terms in fout[i+1]
			diag[i]  = 1.0 + tau * ( c0[i]                          + c2[i]*( -1/(x[i+1]-x[i]) - 1/(x[i]-x[i-1]) )/(x[i+1]-x[i-1])*2.0 );  // terms in fout[i]
			lower[i] =     + tau * (       - c1[i]/(x[i+1]-x[i-1])  + c2[i]*(                  + 1/(x[i]-x[i-1]) )/(x[i+1]-x[i-1])*2.0 );  // terms in fout[i-1]
		}
		upper[i] = 0.0;		// outside the matrix
		diag[i]  = 1.0 + tau * ( c0[i] + c1[i]/(x[i]-x[i-1]) ); // terms in fout[i]
		lower[i] = 0.0 + tau * (       - c1[i]/(x[i]-x[i-1]) ); // terms in fout[i-1]

		i = 0;
		r[0]  = diag[i]*fin[i] + upper[i]*fin[i+1];
		for (i=1; i<n-1; i++)
			r[i] = lower[i]*fin[i-1] + diag[i]*fin[i] + upper[i]*fin[i+1];
		r[i]  = lower[i]*fin[i-1] + diag[i]*fin[i];

        if (hasNaN(r)) error_msg("r after explicit step "+r+"\n"+"upper "+upper+"\n"+"diag "+diag+"\n"+"lower "+lower+"\n"+"fin "+fin+"\n");
        
		// calculate with direct method (without diag matrix)
		/*
		dvector e(n);	
		i = 0;
		e[i]  = fin[i]; // + tau * ( c0[i]*fin[i] + c1[i]*(fin[i+1]-fin[i])/(x[i+1]-x[i]) );
		for (i=1; i<n-1; i++) 
			e[i] = fin[i] + tau * ( c0[i]*fin[i] + c1[i]*(fin[i+1]-fin[i-1])/(x[i+1]-x[i-1])
				+ c2[i]*( (fin[i+1]-fin[i])/(x[i+1]-x[i]) - (fin[i]-fin[i-1])/(x[i]-x[i-1]) )/(x[i+1]-x[i-1])*2.0 );
		e[i]  = fin[i]; // + tau * ( c0[i]*fin[i] + c1[i]*(fin[i]-fin[i-1])/(x[i]-x[i-1]) );
		// check difference
		double max_e = 0.0;
		for (i=0; i<n; i++) { 
			e[i] = e[i] - r[i];
			max_e = max(max_e, abs(e[i]));
		}
		max_e = max(max_e, 0.0);
		*/
	}

	// implicit tridiagonal matrix
	// M = [ 1 - (theta_impl*dt)L ] (fout)

	{
		var tau = -theta_impl_dt;

		i = 0;
		diag[i]  = 1.0 + tau * ( c0[i] - c1[i]/(x[i+1]-x[i]) );	// terms in fout[i]
		upper[i] = 0.0 + tau * (         c1[i]/(x[i+1]-x[i]) );	// terms in fout[i+1]
		for (i=1; i<n-1; i++) {
			lower[i] =     + tau * (       - c1[i]/(x[i+1]-x[i-1])  + c2[i]*(                  + 1/(x[i]-x[i-1]) )/(x[i+1]-x[i-1])*2.0 );  // terms in fout[i-1]
			diag[i]  = 1.0 + tau * ( c0[i]                          + c2[i]*( -1/(x[i+1]-x[i]) - 1/(x[i]-x[i-1]) )/(x[i+1]-x[i-1])*2.0 );  // terms in fout[i]
			upper[i] =     + tau * (         c1[i]/(x[i+1]-x[i-1])  + c2[i]*(  1/(x[i+1]-x[i])                   )/(x[i+1]-x[i-1])*2.0 );  // terms in fout[i+1]
		}
		lower[i] = 0.0 + tau * (       - c1[i]/(x[i]-x[i-1]) ); // terms in fout[i-1]
		diag[i]  = 1.0 + tau * ( c0[i] + c1[i]/(x[i]-x[i-1]) ); // terms in fout[i]
	}

	// solve 
	tridag(n, lower, diag, upper, r, fout);
    if (hasNaN(fout)) error_msg("fout "+fout+"\n"+"n "+n+"\n"+"lower "+lower+"\n"+"diag "+diag+"\n"+"upper "+upper+"\n");
}

function pde_explicit_step_1d(
	n,				///< NbSpacePts 
	cn,				///< Crank-Nicholson theta
	x,				///< [NbSpacePts] values of X_t
	mu,				///< [NbSpacePts] mu(t+1,x)
	sigma2,			///< [NbSpacePts] sigma^2(t+1,x)
	f,				///< [NbSpacePts] f(t+1,x) = E[ u(X_T) | X_{t+1} = x]
	f_bwd_step		///< [NbSpacePts] f(t,x) - f(t+1,x)
	)
{
	// assumes x_i evenly spaced
	var dx = x[1]-x[0];
	var inv_dx   = 1.0 / dx;
	var inv_2dx  = 1.0 / (2.0*dx);
	var inv_2dx2 = 1.0 / (2.0*dx*dx);

	for (var i=1; i<n-1; i++)
		f_bwd_step[i]   = - mu[i]*(f[i+1]-f[i-1])*inv_2dx - sigma2[i]*(f[i+1]-2*f[i]+f[i-1])*inv_2dx2;
	var i=0; 
		f_bwd_step[0]   = - mu[i]*(f[i+1]-f[i])*inv_dx    - sigma2[i]*(f[i+2]-2*f[i+1]+f[i])*inv_2dx2;
	var i=n-1;
		f_bwd_step[n-1] = - mu[i]*(f[i]-f[i-1])*inv_dx    - sigma2[i]*(f[i]-2*f[i-1]+f[i-2])*inv_2dx2;
}

function pde_backward_step_1d(
	n,				///< NbSpacePts 
	dt,				///< time step
	cn,				///< Crank-Nicholson theta
	x,				///< [NbSpacePts] values of X_t
	mu,				///< [NbSpacePts] mu(t+1,x)
	sigma2,			///< [NbSpacePts] sigma^2(t+1,x)
	f,				///< [NbSpacePts] f(t+1,x) = E[ u(X_T) | X_{t+1} = x]
	f_bwd_step,		///< [NbSpacePts] f(t+1,x) = E[ u(X_T) | X_{t} = x]
	mem				///< internal memory owner
	)
{
    // allocate once if needed
    if (!mem.c0) { mem.c0= new Array(n); mem.c1= new Array(n); mem.c2= new Array(n); }
    
	backward_coefs(n, x, mu, sigma2, mem.c0, mem.c1, mem.c2);
    //info_msg("mem.c0 "+mem.c0+"\n"+"mem.c1 "+mem.c1+"\n"+"mem.c2 "+mem.c2+"\n");
	pde_step_1d(n, cn, dt, x, mem.c0, mem.c1, mem.c2, f, f_bwd_step, mem);
}

function pde_forward_step_1d(
	n,				///< NbSpacePts 
	dt,				///< time step
	cn,				///< Crank-Nicholson theta
	x,				///< [NbSpacePts] values of X_t
	mu,				///< [NbSpacePts] mu(t+1,x)
	sigma2,			///< [NbSpacePts] sigma^2(t+1,x)
	f,				///< [NbSpacePts] f(t,x) = E[ u(X_t) | t ]
	f_fwd_step,		///< [NbSpacePts] f(t+1,x) - f(t,x)
	mem				///< internal memory owner
	)
{
	// allocate once if needed
    if (!mem.c0) { mem.c0= new Array(n); mem.c1= new Array(n); mem.c2= new Array(n); }
    
    forward_coefs(n, x, mu, sigma2, mem.c0, mem.c1, mem.c2);
	pde_step_1d(n, cn, dt, x, mem.c0, mem.c1, mem.c2, f, f_fwd_step, mem);
}

/*
void pde_step_1d_test(
	const bool		isBackward,		
	const bool		isLogNormal,
	const int		n,				///< NbSpacePts 
	const double	cn,				///< Crank-Nicholson theta
	const dvector&	x,	
	const double	dt,
	const double	mu,	
	const double	sigma2,
	const dvector&	fin,
	dvector&		fout,			///< can be a reference to 'fin' which will get modified
	dvector&		c0,
	dvector&		c1,
	dvector&		c2, 
	dvector&		r
	)
{
	dvector mu_vec(n, mu);
	dvector var_vec(n, sigma2);
	dvector f_bwd_step(n);
	
	pde_memory_1d	mem(n);
	resize_vec(c0, n);
	resize_vec(c1, n);
	resize_vec(c2, n);
	resize_vec(r, n);
	resize_vec(fout, n);

	for (int i=0; i<n; i++)
		mu_vec[i] = mu*x[i];
	if (isLogNormal)
		for (int i=0; i<n; i++) 
			var_vec[i] = sigma2*x[i]*x[i];
	
	/// (fout-fin)/dt = c0.f + c1.f_x + c2.f_xx

	if (isBackward)
		backward_coefs(n, &x[0], &mu_vec[0], &var_vec[0], &c0[0], &c1[0], &c2[0]);
	else
		forward_coefs(n, &x[0], &mu_vec[0], &var_vec[0], &c0[0], &c1[0], &c2[0]);

	
	/*if (cn=0.0) {
		// explicit
		// pde_explicit_step_1d(n, cn, &x[0], &mu_vec[0], &var_vec[0], &f_in[0], &f_bwd_step[0]);
		// for (int i=0; i<n; i++)
		//	f_out[i] = f_in[i] + f_bwd_step[i]*dt;
	} else { * /
	

	// if jumps are part of the diffusion, they should occurs :
	// - before Crank Nicholson step for forward diffusion
	// - after Crank Nicholson step for backward diffusion
	// fin[i] = (1.0-p[i])*fin[i] + p[i]*...;

	pde_step_1d(n, cn, dt, &x[0], &c0[0], &c1[0], &c2[0], &fin[0], &fout[0], mem);
	r = mem.r; // populate output
}
*/