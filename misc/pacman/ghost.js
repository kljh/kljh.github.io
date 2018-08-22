/*
	Author: Claude Cochet
	Creation date : 2012-01-19
*/

// Function that must be exported from here.
// Must return one of : dir_left, dir_right, dir_up, dir_down or dir_none
// - ask_ghost(id, x, y, dir, state, internal, pm)

// Arguments:
// x, y, dir :			current position and direction of pacman
// state :				current state :  normal_pacman, super_pacman,  zombie (must go home)
// pm : 				pacman info 
// internal state (free use):
//   flag : 			0: go to pacman
//   dx 				time before checking where is pacman
function ask_ghost(id, x, y, dir, state, internal, pm) {
	var new_dir = dir;
	if (internal.dx>0) { 
		// keep same direction
		internal.dx--; 
	} else {
		// new direction
		internal.flag = false;
		
		// target
		var xp,yp;
		if (state==normal_pacman) {
			if (id=='clyde') 	{ xp = pm.ox+1;	yp = pm.oy; }
			if (id=='blinky') 	{ xp = pm.ox; 	yp = pm.oy+1; }
			if (id=='inky') 	{ xp = pm.ox-1;	yp = pm.oy; }
			if (id=='pinky') 	{ xp = pm.ox;		yp = pm.oy-1; }				
		} else {
			xp =13; yp=14;	
		}
		
		if ( !is_wall(x + 1, y) && (dir != dir_left) )
				if (Math.abs((x+1) - xp) < Math.abs(x - xp)) {	
					new_dir = dir_right; internal.flag = true; }
		if ( !is_wall(x - 1, y) && (dir != dir_right) )
				if (Math.abs((x - 1) - xp) < Math.abs(x - xp)) { 
					new_dir = dir_left; internal.flag = true; }
		if ( !is_wall(x, y - 1) && (dir!=dir_down) )
				if (Math.abs((y - 1) - yp) < Math.abs(y - yp)) { 
					new_dir = dir_up; internal.flag = true;	}
		if ( !is_wall(x, y + 1) && (dir!=dir_up) ) 
				if (Math.abs((y + 1) - yp) < Math.abs(y - yp)) { 
					new_dir = dir_down;	internal.flag = true; }
			
		if (!internal.flag) 
			internal.dx = 15;
		

	}
	
	// if going to a wall : go randomly in any orthogonal direction
	var bStraightOk = is_direction_ok(x, y, new_dir);
	if (!bStraightOk) {
		var coin = Math.random();
		if (new_dir==dir_up || new_dir==dir_down) {
			if (coin<0.5) { 	new_dir = is_direction_ok(x, y, dir_left) ? dir_left : dir_right ;		}
			if (coin>0.5) { 	new_dir = is_direction_ok(x, y, dir_right) ? dir_right : dir_left;	}
		} else {
			if (coin<0.5) { 	new_dir = is_direction_ok(x, y, dir_down) ? dir_down : dir_up;		}
			if (coin>0.5) { 	new_dir = is_direction_ok(x, y, dir_up) ? dir_up : dir_down;		}
		}
	} 

	return new_dir;
}
