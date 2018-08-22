/*
	Author: Claude Cochet
	Creation date : 2013-05-06
*/

// DOUBLE 
x = -43093.699999999997

// INT64
// *(__int64*)&x  0xc0e50ab666666666 

/*
(double)((*i)&0xFFFFFFFFFFFFF|0x10000000000000)/0x10000000000000
1.3151153564453124
double  x/1024/1024*2*2*2*2*2
-1.3151153564453124
*/

bytes = [ 0xc0, 0xe5, 0x0a, 0xb6, 0x66, 0x66, 0x66, 0x66 ] 
bytes = [ 0x66, 0x66, 0x66, 0x66, 0xb6, 0x0a, 0xe5, 0xc0 ] 

function bytes_to_ascii(bytes) {
    var chars=[]
    var n= bytes.length; 
    for (var i=0; i<n;i++) {
        if (0x20<=bytes[i] && bytes[i]<=0x7E)
            chars.push(String.fromCharCode(bytes[i]));
        else 
            chars.push("&hearts;");
    }
    return chars;
}

function bytes_to_unsigned32(bytes, bigendian) {
    //var integer_low=0, integer_high=0;
    var unsigned_low=0, unsigned_high=0;
    if (bigendian) {
        integer_low  = bytes[0] |  bytes[1]<<8 |  bytes[2]<<16 | bytes[3]<<24;
        integer_high = bytes[4] |  bytes[5]<<8 |  bytes[6]<<16 | bytes[7]<<24;
        
        unsigned_low  = ( bytes[0] |  bytes[1]<<8 |  bytes[2]<<16 ) + (bytes[3]<<23)*2.0;
        unsigned_high = ( bytes[4] |  bytes[5]<<8 |  bytes[6]<<16 ) + (bytes[7]<<23)*2.0;
        
        //info_msg("integer_high 0x"+integer_high.toString(16));
        //info_msg("integer_low 0x"+integer_low.toString(16));
        info_msg("unsigned_high 0x"+unsigned_high.toString(16));
        info_msg("unsigned_low 0x"+unsigned_low.toString(16));

        return { unsigned_low: unsigned_low, unsigned_high: unsigned_high, uint : [ unsigned_low, unsigned_high ] };
    } else {
        unsigned_low  = ( bytes[7] |  bytes[6]<<8 |  bytes[5]<<16 ) + (bytes[4]<<23)*2.0;
        unsigned_high = ( bytes[3] |  bytes[2]<<8 |  bytes[1]<<16 ) + (bytes[0]<<23)*2.0;
        return { unsigned_low: unsigned_low, unsigned_high: unsigned_high, uint : [ unsigned_high, unsigned_low ] };
    }
}

function bytes_to_double(bytes, bigendian) {
    var output = "";
    
    // Javascript bitwise operators :
    // the operands of all bitwise operators are converted to signed 32-bit integers in big-endian order and in two's complement format.
    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Bitwise_Operators
    
    // IEEE 754 standard 
    var uint32 = bytes_to_unsigned32(bytes, bigendian);
    var unsigned_low = uint32.unsigned_low;
    var unsigned_high = uint32.unsigned_high;
    
    var dbl_int_high_part = (unsigned_high&0x000FFFFF) | 0x100000;
    var dbl_int = dbl_int_high_part*256*256*256*256 + unsigned_low
    var dbl_int = dbl_int / 65536.0 / 65536.0 /1024.0 / 1024.0
    var dbl_exp = (unsigned_high&0x7FF00000) >> 20;  
    var dbl_sign = (unsigned_high&0x80000000) >> 31;
    var dbl_exp_val = dbl_exp - 0x3FF
    var dbl = (dbl_sign==0?1:-1) * dbl_int * Math.pow(2,dbl_exp_val);
    
    info_msg("");
    info_msg("unsigned_high_int  0x"+(unsigned_high&0x000FFFFF).toString(16)+" dbl_int_high_part 0x"+dbl_int_high_part.toString(16));
    info_msg("unsigned_high_exp 0x"+(unsigned_high&0x7FF00000).toString(16)+" dbl_exp 0x"+dbl_exp.toString(16)+" dbl_exp_val "+dbl_exp_val);
    info_msg("unsigned_high_sign 0x"+(unsigned_high&0x80000000).toString(16));
    
    info_msg("");
    info_msg("dbl_sign "+dbl_sign);
    info_msg("dbl_int "+dbl_int);
    info_msg("dbl_exp "+dbl_exp.toString(16));
    info_msg("dbl "+dbl );
    
    return dbl; 
}

function double_to_bytes(dbl) {
    var dbl_sign = dbl<0 ? -1 : 1;
    var dbl_abs = Math.abs(dbl);
    var dbl_exp = Math.floor(Math.log(dbl_abs)/Math.LN2);
    var dbl_frac = dbl_abs / Math.pow(2, dbl_exp);
    
    var dbl_int = Math.floor( dbl_frac * Math.pow(2, 53) - Math.pow(2, 53) );
    
    var dbl_int_high = Math.floor( dbl_int / Math.pow(2, 32) );
    var dbl_int_low = Math.floor( dbl_int - dbl_int_high * Math.pow(2, 32) );
    
    info_msg("dbl "+dbl);
    info_msg("dbl_exp "+dbl_exp);
    info_msg("dbl_frac "+dbl_frac);
    
    info_msg("dbl_int \n"+dbl_int);
    info_msg("dbl_int_high*2^32+dbl_int_low \n"+(dbl_int_high*Math.pow(2, 32)+dbl_int_low));
    info_msg("dbl_int_high 0x"+dbl_int_high.toString(16)+"   "+dbl_int_high/Math.pow(2, 20)+"%" );
    info_msg("dbl_int_low 0x"+dbl_int_low.toString(16)+"   "+dbl_int_low/Math.pow(2, 32)+"%");
    
    info_msg("dbl_sign * (2^53+dbl_int_high*2^32+dbl_int_low) * 2^dbl_exp \n"+dbl_sign*(Math.pow(2,53)+dbl_int_high*Math.pow(2, 32)+dbl_int_low)*Math.pow(2,dbl_exp-53));
    info_msg("");
}

function info_msg(msg) {
    if (typeof(Document)==="undefined")
        print(msg);
}

/*
function() {
    if (typeof(Document)!=="undefined")
        return;
    
    var bigendian=true;
    info_msg(double_to_bytes(x));
    info_msg(double_to_bytes(0.023));
    info_msg(bytes_to_double(bytes, bigendian));
}();
*/