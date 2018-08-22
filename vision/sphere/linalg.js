
function output(s) {
	//var out = WScript.Stdout;
	//out.writeline(s);	
	//opera.postError(s);
}

function str(mtx) {
	var dmtx = new DMatrix(mtx.length, mtx[0].length);
	dmtx.dt = mtx;
	
	return dmtx.ToString();
}

// this takes a simple array[][] as input
function inv(mtx) {
	var dmtx = new DMatrix(mtx.length, mtx[0].length);
	dmtx.dt = mtx;
	
	dmtx = inverse(dmtx);
	return dmtx.dt;
}

function trsp(mtx) {
	var dmtx = new DMatrix(mtx.length, mtx[0].length);
	dmtx.dt = mtx;
	
	dmtx = transp(dmtx);
	return dmtx.dt;
}

function prod(P, Q)
{
	var nP = P.length;
	var mP = P[0].length;
	var nQ = Q.length;
	var mQ = Q[0].length;
	
	// check mP ?= nQ
	
	var R = []
	for (var i=0; i<nP; i++) {
		R[i] = [];
		for (var j=0; j<mQ; j++) {
			R[i][j] = 0;
			for (var k=0; k<nQ; k++) 
				R[i][j] = R[i][j] + P[i][k]*Q[k][j];
		}
	}
	return R;
}

function prod_mv(P, q)
{
	var n = P.length;
	var m= q.length;
	
	var r = []
	for (var i=0; i<n; i++) {
		r[i] = 0;
		for (var j=0; j<m; j++)
			r[i] = r[i] + P[i][j] * q[j];
	}
	return r;
}

// **************************************************************************************************

// *** DMatrix : two dimension array of numbers ***

function DMatrix(n, m) {
	//if (arguments.length!=2) throw new Error("DMatrix needs 2 args, " + arguments.length + " provided.");
	this.n = n;
	this.m = m;
	
	this.dt = new Array(this.n);
	for (var i=0; i<this.n; i++) 
		this.dt[i] = new Array(this.m);
	
	for (var i=0; i<this.n; i++) 
		for (var j=0; j<this.m; j++) 
			this.dt[i][j] = 0;
}

DMatrix.prototype.Clone = function () {
	var res = new DMatrix(this.n, this.m);
	
	for (var i=0; i<res.n; i++) 
		for (var j=0; j<res.m; j++) 
			res.dt[i][j] = this.dt[i][j];
	
	return res;
}

DMatrix.prototype.ToString = function () {
	var res = "Mtx("+this.n+","+this.m+") = [ ";
	for (var i=0; i<this.n; i++) 
	{
		//res = res + " [" + this.dt[i].join(", ") + "]; ";
		
		res += " [ "
		for (var j=0; j<this.m; j++) 
			//res += this.dt[i][j].toPrecision(4) + "  ";
			res += this.dt[i][j].toFixed(2) + "  "
		res += " ]; "
	}
	res = res + " ] ";
	return res;
}


function IdMtx(n) {
	var res = new DMatrix(n, n);
	
	for (var i=0; i<n; i++) 
		res.dt[i][i] = 1;
	
	return res;
}

function sum(lhs, rhs) {
	var res = new DMatrix(lhs.n, rhs.m);
	if (lhs.n!=rhs.n) throw new Error("DMatrix.Sum : lhs and rhs height mismatch");
	if (lhs.m!=rhs.m) throw new Error("DMatrix.Sum : lhs and rhs height mismatch");
	
	for (var i=0; i<res.n; i++) 
		for (var j=0; j<res.m; j++) 
			res.dt[i][j] = lhs.dt[i][j] + rhs.dt[i][j];
	
	return res;
}

function transp(u) {
	var res = new DMatrix(u.m, u.n);
	
	for (var i=0; i<res.n; i++) 
		for (var j=0; j<res.m; j++) 
			res.dt[i][j] = u.dt[j][i];
	
	return res;
}


function product(lhs, rhs) {
	var res = new DMatrix(lhs.n, rhs.m);
	if (lhs.m!=rhs.n) throw new Error("product : lhs width and rhs height mismatch");
	
	for (var i=0; i<res.n; i++) {
		for (var j=0; j<res.m; j++) {
			var tmp=0;
			for (var k=0; k<lhs.m; k++) 
				tmp += lhs.dt[i][k] * rhs.dt[k][j];
			res.dt[i][j] = tmp;
		}
	}		
	return res;
}

function scalar_product(cst, mtx) {
	var res = new DMatrix(mtx.n, mtx.m);
	
	for (var i=0; i<res.n; i++) 
		for (var j=0; j<res.m; j++) 
			res.dt[i][j] = cst * mtx.dt[i][j];
	
	return res;
}

DMatrix.prototype.det = function (mtx) {
	if ( mtx.m != mtx.n ) throw new Error("Matrix det : not a square matrix "+mtx.m+"x"+mtx.n+".");

	function det_IntListFromTo(startx, stopx) {
		var res = new Array(stopx-startx+1);
		for (var i=0; i<stopx-startx+1; i++)
			res[i] = startx + i;
		return res;
	}

	function det_recurse(mtx, rows, cols) {
		if (rows.length==1) 
			return mtx.dt[ rows[0] ][ cols[0] ];
		
		var res=0;
		for (var i=0; i<rows.length; i++) {
			var r = det_IntListExclNth(rows,i), 
				c = det_IntListExclNth(cols,0);
			res += (i%2==0?1.0:-1.0) * mtx.dt[rows[i]][cols[0]] * det_recurse(mtx, r, c);
		}
		return res;
	}

	function det_IntListExclNth(list, excl) {
		var res = new Array(list.length-1);
		for (var i=0; i<excl; i++)
			res[i] = list[i];
		for (var i=excl+1; i<list.length; i++)
			res[i-1] = list[i];
		return res;
	}

	var rows = det_IntListFromTo(0,mtx.m-1);
	var cols = det_IntListFromTo(0,mtx.m-1);

	return det_recurse(mtx, rows, cols);
}

function inverse(mtx) {
	if ( mtx.m  != mtx.n  ) throw new Error("DoInv : dt is not a square matrix "+mtx.m+"x"+mtx.n+".");
		
	function inverse_TrwSup(m, l) {
		var currrow = 0;
		
		for (var j=0; j<m.n; j++) {
		
			// find row with max value in col j and swap to put this row at the top
			var maxrow = currrow;
			for (var i=maxrow; i<mtx.n; i++) 
				if ( Math.abs(m.dt[i][j]) > Math.abs(m.dt[maxrow][j]))  
					maxrow = i;
			
			if (currrow != maxrow) {
				inverse_RowSwap(m, currrow, maxrow); 
				inverse_RowSwap(l, currrow, maxrow);
				
				/* output("> swaping "+currrow+" "+maxrow);
				output("m = "+m.ToString());
				output("l = "+l.ToString()); */
			}
			
			// if no following row has non null value for this col, proceed next column with same row
			if (m.dt[currrow][j]==0) continue;
			if (Math.abs(m.dt[currrow][j])<1e-9) continue;
						
			// cancel values in col j for following rows
			rowlinear = new DMatrix(m.n, m.n);
			for (var i=0; i<currrow+1; i++)  
				rowlinear.dt[i][i] = 1;
			for (var i=currrow+1; i<m.n; i++) { 
				rowlinear.dt[i][i] = 1; 
				rowlinear.dt[i][currrow] = - m.dt[i][j] / m.dt[currrow][j];
			}
			
			m = product(rowlinear, m); 
			l = product(rowlinear, l);
			
			/* output("> canceling rows > "+currrow);
			output("m = "+m.ToString());
			output("l = "+l.ToString()); */
			
			// proceed next column with next row
			currrow++;
		}
		return new Array( currrow==m.n, m, l);
	}

	function inverse_RowSwap(mtx, r1, r2) {
		if (r1==r2) 
			return;
		for (var k=0; k<mtx.m; k++) {
			var tmp = mtx.dt[r1][k];
			mtx.dt[r1][k] = mtx.dt[r2][k];
			mtx.dt[r2][k] = tmp;
		}
	}

			
	function inverse_id(m, l) {
		for (var j=m.n-1; j>=0; j--) {
			// normalize row j / cancel values in col j for preceeding rows
			rowlinear = new DMatrix(m.n,m.n);
			for (var i=m.n-1; i>j; i--) 
				rowlinear.dt[i][i] = 1;
			rowlinear.dt[j][j] = 1 / m.dt[j][j];
			for (var i=j-1; i>=0; i--) { 
				rowlinear.dt[i][i] = m.dt[j][j]; 
				rowlinear.dt[i][j] = -m.dt[i][j];
			}
			m = product(rowlinear, m); 
			l = product(rowlinear, l);
		}
		return l;
	}	

	var m = mtx.Clone()
	var l = IdMtx(mtx.n);
	
	// Transformation of m in a plain top triangular matrix
	var retvals = inverse_TrwSup(m, l);
	var bOk = retvals[0];
	m = retvals[1];  /// upper triangular = Tn ... T2 . T1 . T0 . M
	l = retvals[2];	  /// lower triangular = Tn ... T2 . T1 . T0 . Id
	
	if (!bOk) throw new Error("Trying to inverse a singular matrix. \n MTX " + mtx.ToString() + "\n M " + m.ToString() + "\n l " + l.ToString());

	// Transformation of m into an identity matrix
	var res = inverse_id(m,l);
	
	return res;	
}



function DMatrixTest()
{
	var out = WScript.Stdout;
	
	//var m = new DMatrix(4,4);
	//m.dt = [ [ 1, 3, 5, 4], [7, 3, 7, 4], [5, 2, 1, 4], [0, 2, .1, 4] ]
	
	var m = new DMatrix(6,6);
	m.dt = [
		[819.4604550873241, 2382.499200507425, 1, 0, 0, 0],
		[-475.88992566889215, -2460.2098409360974, 1, 0, 0, 0],
		[968.1368351345154, 1007.2810769981072, 1, 0, 0, 0],
		[0, 0, 0, 819.4604550873241, 2382.499200507425, 1],
		[0, 0, 0, -475.88992566889215, -2460.2098409360974, 1],
		[0, 0, 0, 968.1368351345154, 1007.2810769981072, 1] ];
	
	out.write(m.ToString())
	out.writeline("|M| = "+m.det(m))
	
	var mi = inverse(m);
	out.write(mi.ToString())
	
	var mmi = product(m,mi)
	out.write(mmi.ToString())
}

//DMatrixTest();
