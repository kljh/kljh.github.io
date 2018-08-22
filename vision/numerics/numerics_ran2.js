
// Long period (> 2e18) random number generator of L'Ecuyer with Bays-Durham shuffle and added safeguards. 
// Returns a uniform random deviate between 0.0 and 1.0 (exclusive of the endpoint values). 
// Call with idum a negative integer to initialize; thereafter, do not alter idum between successive deviates in a sequence. 
// RNMX should approximate the largest floating value that is less than 1.

ran2_init = function (idum_init) {
	// const int
	var IM1=2147483563,IM2=2147483399;
	var IA1=40014,IA2=40692,IQ1=53668,IQ2=52774;
	var IR1=12211,IR2=3791,NTAB=32,IMM1=IM1-1;
	var NDIV=1+IMM1/NTAB;
	// const double
	var EPS=3.0e-16,RNMX=1.0-EPS,AM=1.0/IM1;
	// static int 
	var idum=idum_init;
	var idum2=123456789,iy=0;
	// 	static int vector
	var iv=new Array(NTAB);
	for (var i=0; i<NTAB; i++) iv[i]=0;
	
	return function() {
		var j,k;
		var temp;

		if (idum <= 0) {
			idum=(idum==0 ? 1 : -idum);
			idum2=idum;
			for (j=NTAB+7;j>=0;j--) {
				k=Math.floor(idum/IQ1);
				idum=IA1*(idum-k*IQ1)-k*IR1;
				if (idum < 0) idum += IM1;
				if (j < NTAB) iv[j] = idum;
			}
			iy=iv[0];
		}
		k=Math.floor(idum/IQ1);
		idum=IA1*(idum-k*IQ1)-k*IR1;
		if (idum < 0) idum += IM1;
		k=Math.floor(idum2/IQ2);
		idum2=IA2*(idum2-k*IQ2)-k*IR2;
		if (idum2 < 0) idum2 += IM2;
		j=Math.floor(iy/NDIV);
		iy=iv[j]-idum2;
		iv[j] = idum;
		if (iy < 1) iy += IMM1;
		
		//if ((temp=AM*iy) > RNMX) return RNMX;
		//else return temp;
		temp=AM*iy;
		if (temp > RNMX) return RNMX;
		else return temp;
	};
};

