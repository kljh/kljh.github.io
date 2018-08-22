
/// Normal distribution density Accurate
function normal_distribution(x)
{
	var inv_sqrt_2pi = 3.98942280401433e-1;
	return inv_sqrt_2pi * exp( - x*x * 0.5 );
}

/// normal cumulative distribution
function normal_cumulative_apx(x)
{
	var inv_sqrt2 = 7.07106781186547e-1;
	var norm_cum_from_infty = erfcc(inv_sqrt2*x);
	return 1.0 - 0.5*norm_cum_from_infty;
} 

/// normal cumulative distribution
function normal_cumulative(X)
{
	var NORM_ACCURATE_B_LOW = -45.0;
	var NORM_ACCURATE_B_HIGH = 15.0;
	var MATH_INV_SQRT2 = 7.07106781186547e-1;

	//	static values
	var A = [
		0.0,
		3.16112374387056560,
		1.13864154151050156*100,
		3.77485237685302021*100,
		3.20937758913846947*1000,
		1.85777706184603153*0.1

	];
	var B = [ 
		0.0,
		2.36012909523441209*10,
		2.44024637934444173*100,
		1.28261652607737228*1000, 
		2.84423683343917062*1000,

	];
	var C = [
		0.0,
		5.64188496988670089*0.1,
		8.88314979438837594,
		6.61191906371416295*10,
		2.98635138197400131*100,
		8.81952221241769090*100,
		1.71204761263407058*1000,
		2.05107837782607147*1000,
		1.23033935479799725*1000,
		2.15311535474403846e-8
	];
	var D = [
		0.0,
		1.57449261107098347*10,
		1.17693950891312499*100,
		5.37181101862009858*100,
		1.62138957456669019*1000,
		3.29079923573345963*1000,
		4.36261909014324716*1000,
		3.43936767414372164*1000,
		1.23033935480374942*1000

	];
	
	var P = [
		0.0,
		3.05326634961232344*0.1,
		3.60344899949804439*0.1,
		1.25781726111229246*0.1,
		1.60837851487422766*0.01,
		6.58749161529837803*0.0001,
		1.63153871373020978*0.01
	];
	var Q = [
		0.0,
		2.56852019228982242,
		1.87295284992346047,
		5.27905102951428412e-1,
		6.05183413124413191e-2,
		2.33520497626869185e-3
	];

	var THRESH= 0.46875;
	var SQRPI=5.6418958354775628695*0.1;


	var DEL;
	var d, ans,y,ysq,Xden,Xnum;
	var dResult;

	//	extreme values : we found with excel when the answer was REALLY indentically 0 or 1
	if (X < NORM_ACCURATE_B_LOW) return 0.0;
	if (X > NORM_ACCURATE_B_HIGH) return 1.0;

	d = X * MATH_INV_SQRT2;

	y = Math.abs(d);


	// ------------------------------------------------------------------
	// Evaluate  erf  for  |X| <= 0.46875
	// ------------------------------------------------------------------   
	if (y<=THRESH) 
	{
		ysq = 0;
		ysq=y*y;
		Xnum = A[5]*ysq;
		Xden = ysq;
		for (var i=1;i<4;i++)
		{
			Xnum = (Xnum + A[i]) * ysq;
			Xden = (Xden + B[i]) * ysq;
		}

		ans = d * (Xnum + A[4]) / (Xden + B[4]);        
		//	erf to normal cumul
		return 	0.5 * (1.0 + ans);
	} // END if (y<= THRESH) 
	else
	{
		//  -------------------------------------------------------------------
		//	Evaluate  erfc  for 0.46875 <= |X| <= 4.0
		//  ------------------------------------------------------------------- 
		if(y<=4)
		{
			Xnum = C[9]*y;
			Xden=y;
			for (var i=1;i<8;i++)
			{
				Xnum = (Xnum + C[i])*y;
				Xden = (Xden + D[i])*y;
			}
			ans = (Xnum+C[8]) / (Xden + D[8]);

		} // END if (y <=4)     
		//  ------------------------------------------------------------------
		//	Evaluate  erfc  for |X| > 4.0
		//	------------------------------------------------------------------ 
		else
		{
			ysq = 1 / (y * y);
			Xnum = P[6]*ysq;
			Xden = ysq;
			for (var i=1;i<5;i++)
			{
				Xnum = (Xnum + P[i]) * ysq;
				Xden = (Xden + Q[i]) * ysq;
			}
			ans =ysq *(Xnum + P[5]) / (Xden + Q[5]);
			ans = (SQRPI -  ans) / y;

			// -------------------------------------------
			//Fix up for negative argument, erf, etc.
			//------------------------------------------- 

		} // END else if (x>4.0)

		ysq = (Math.floor(y*16))/16;
		DEL = (y-ysq)*(y+ysq);

		dResult = Math.exp(-ysq*ysq-DEL)*ans;

		return  d <= 0.0 ? 0.5 * dResult : (1.0 - 0.5 * dResult);
	}

	//	should never get here 		
	return 0.0;
}

/// inverse normal cumulative distribution
function normal_cumulative_inv(u)
{
	// Static variables for the analytical approximation to the inverse of a cumulative normal distribution
	var a = [
		2.50662823884,
		-18.61500062529,
		41.39119773534,
		-25.44106049637
	];

	var b = [
		-8.47351093090,
		23.08336743743,
		-21.06224101826,
		3.13082909833
	];

	var c = [
		0.3374754822726147,
		0.9761690190917186,
		0.1607979714918209,
		0.0276438810333863,
		0.0038405729373609,
		0.0003951896511919,
		0.0000321767881768,
		0.0000002888167364,
		0.0000003960315187
	];

	var x, r;
	// cumulative normal inverse returning -8.16 or 8.16 for inputs very near 0 or 1
	// This gets us going when there are defaults, but this is too crap to be usable outside 
	// this file and put in math_cumNormInv... 
	// We will need to put an assymptotic expansion of normal inv to deal with such values, 
	// properly then math_cumNormInv will work properly.
	if (u<3e-16)	return -8.10006299881351;
	if (u>1.-3e-16) return  8.10006299881351;
	x = u- 0.5;

	if ( Math.abs(x) <0.42)
	{
		r = x*x;
		r = x*(((a[3]*r+a[2])*r+a[1])*r+a[0])/
			((((b[3]*r+b[2])*r+b[1])*r+b[0])*r+1) ;
		return (r);
	}

	r = u;

	if	( x>0.0)
		r = 1.0 - u;

	r = Math.log(-Math.log(r));
	r = c[0] + r*(c[1]+r*(c[2]+r*(c[3]+r*(c[4] + r*(c[5]+r*(c[6]+r*(c[7]+r*c[8])))))));

	if	(x<0.0)
		r = -r;

	return (r);
}
