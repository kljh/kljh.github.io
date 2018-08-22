/*
	Author: Claude Cochet
	Creation date : 2012-01-19
*/

// Functions that must be exported from here.
// Must return one of : dir_left, dir_right, dir_up, dir_down or dir_none
// - ask_pacman_keyboard(x, y, dir, requested_dir) 	for manual control pacman 
// - ask_pacman_autopilot(x, y, dir, internal)  			for pacman autopilot 

// Global functions/variables that can be used here :
// - map :							map of the game field ("o" super gum, "." gum, "x" and "X" wall)
// - is_wall(x, y) :				check if there is a wall at this coordinates
// - is_direction_ok(x,y,dir) : 	check if ther is a wall in this direction

// Arguments:
// x, y, dir :			current position and direction of pacman
// requested_dir : 	requested direction
function ask_pacman_keyboard(x, y, dir, requested_dir) {
	// manual control
	if (is_direction_ok(x, y, requested_dir)) 
		return requested_dir; 
	if (is_direction_ok(x, y, dir)) 
		return dir; 
	return dir_none;
}

// Arguments:
// x, y, dir :		current position and direction of pacman
// internal : 		persistent internal state (free usage), contains maze with the postions and state of ghosts
function ask_pacman_autopilot(x, y, dir, internal) {
	var new_dir = dir;
	var maze = internal.maze;
	
	/*
	// can we carry same direction ?
	var bStraightOk = is_direction_ok(x, y, dir);
	if (!bStraightOk) {
		var coin = Math.random();
		if (dir==dir_up || dir==dir_down) {
			if (coin<0.5) { 	new_dir = is_direction_ok(x, y, dir_left) ? dir_left : dir_right ;		}
			if (coin>0.5) { 	new_dir = is_direction_ok(x, y, dir_right) ? dir_right : dir_left;	}
		} else {
			if (coin<0.5) { 	new_dir = is_direction_ok(x, y, dir_down) ? dir_down : dir_up;		}
			if (coin>0.5) { 	new_dir = is_direction_ok(x, y, dir_up) ? dir_up : dir_down;		}
		}
	}
	return new_dir ;
	*/
	
	// distance to pacman
	var maze_map = clone(map);
	maze_map[y][x] = "P";
	var distPi = distance_zero(maze_map ,"P")
	var distP = distance_iter(distPi)
	
	// distance to ghosts
	var maze_map = clone(map);
	maze_map[maze.clyde.oy][maze.clyde.ox] = ( maze.clyde.state==normal_pacman ? "G" : " " ); 
	maze_map[maze.blinky.oy][maze.blinky.ox] = ( maze.blinky.state==normal_pacman ? "G" : " " );
	maze_map[maze.inky.oy][maze.inky.ox] = ( maze.inky.state==normal_pacman ? "G" : " " );
	maze_map[maze.pinky.oy][maze.pinky.ox] = ( maze.pinky.state==normal_pacman ? "G" : " " );
	var distGi = distance_zero(maze_map ,"G")
	var distG = distance_iter(distGi)
	
	// distance to food
	var maze_map = clone(map);
	// destroy food closer from ghosts than from pacman (in perimeter around pacman) to avoid to die for quick food
	destroy_food_under_influence(maze_map, distP.map, distG.map);
	// also ghosts are as wall to access to food (we can't go through) unless they are food themselves
	function state_subst(s) { if (s==normal_pacman) return "x";  if (s==super_pacman) return ".";  return " "; }
	maze_map[maze.clyde.oy][maze.clyde.ox] = state_subst(maze.clyde.state); 
	maze_map[maze.blinky.oy][maze.blinky.ox] = state_subst(maze.blinky.state); 
	maze_map[maze.inky.oy][maze.inky.ox] = state_subst(maze.inky.state); 
	maze_map[maze.pinky.oy][maze.pinky.ox] = state_subst(maze.pinky.state); 
	var dist0i = distance_zero(maze_map ,".")
	var dotsleft = dist0i.lst.length;
	var dist0 = distance_iter(dist0i)
	
	var score_left = is_direction_ok(x, y, dir_left) ? -dist0.map[y][x-1] : -999;
	var score_right = is_direction_ok(x, y, dir_right) ? -dist0.map[y][x+1] : -999;
	var score_down = is_direction_ok(x, y, dir_down) ? -dist0.map[y+1][x]  : -999;
	var score_up = is_direction_ok(x, y, dir_up) ? -dist0.map[y-1][x] : -999;
	
	var dist_to_food = dist0.map[y][x]
	var dist_to_ghosts = distG.map[y][x]
	if (dotsleft==0  ||  false && dist_to_food>13 && dist_to_ghosts<7) {
		// - either dotsleft==0  (this can happen because we exclude gums too near from ghosts) =>  dist0 is not relevant
		// - or we are far from any food and near from ghosts : switch priorities ()
		var score_left = is_direction_ok(x, y, dir_left) ? distG.map[y][x-1] : -999;
		var score_right = is_direction_ok(x, y, dir_right) ? distG.map[y][x+1] : -999;
		var score_down = is_direction_ok(x, y, dir_down) ? distG.map[y+1][x]  : -999;
		var score_up = is_direction_ok(x, y, dir_up) ? distG.map[y-1][x] : -999;
	}
	
	// add demi-tour penalty
	var penalty = 0.5
	if (dir===dir_right) 	score_left -= penalty
	if (dir===dir_left)  	score_right -= penalty
	if (dir===dir_up) 	score_up -= penalty
	if (dir===dir_down)  score_down -= penalty
	
	// checks scores are number because distance map can contain fake walls which are not number
	if (isNaN(score_left)) score_left = -9999
	if (isNaN(score_right)) score_right = -9999
	if (isNaN(score_up)) score_up = -9999
	if (isNaN(score_down)) score_down = -9999
	
	var best_score = Math.max( Math.max(score_left ,score_right), Math.max(score_down, score_up) )
	if (best_score===score_left) return dir_left;
	if (best_score===score_right) return dir_right;
	if (best_score===score_down) return dir_down;
	if (best_score===score_up) return dir_up;
	
	debugger;
	
}

function distance_zero(maze_map,item) {
    // var map = maze_map          REFERENCE : NOT SUITABLE FOR MODIFICATION
    // var map = $.extend(true, [], maze_map )      DEEP COPY : needs jQuery (merge maze_map into [])
    var map = clone(maze_map)  //  DEEP COPY
    var lst = []
	for (var i=0; i<n; i++)
		for (var j=0; j<m; j++)
			if (map[i][j]==item) {
                lst.push([i,j]); 
                map[i][j] = 0;
            } else if (maze_map[i][j]=='x'||maze_map[i][j]=='X'||j==0||j==(m-1)) { 
                map[i][j] = 'x'; 
            } else {
                map[i][j] = ' '; // this denotes a place to fill with number
            }
	if (lst.length===0) {
		// distance to nothing => set all distances to 999
		for (var i=0; i<n; i++)
			for (var j=0; j<m; j++)
				map[i][j] = 999;
	}
    return { map : map, lst : lst, imax : 0 } ;
}

function distance_iter(dist) {
    if (dist.lst.length==0) 
        return dist; // distance map complete 
    
    var imax = dist.imax + 1
    var lst = []
    
	// tunnel is hard-coded 
    if (dist.map[14][1]===' '&&dist.map[14][26]!==' ')  { dist.map[14][1]=dist.map[14][27]=imax; lst.push([14,1]); }
    if (dist.map[14][1]!==' '&&dist.map[14][26]===' ')  { dist.map[14][26]=dist.map[14][0]=imax; lst.push([14,26]); }
    
    for (var k=0; k<dist.lst.length; k++) {
        var i = dist.lst[k][0], j = dist.lst[k][1]
        if (dist.map[i+1][j]===' ') { dist.map[i+1][j] = imax; lst.push([i+1,j]); }
        if (dist.map[i-1][j]===' ') { dist.map[i-1][j] = imax; lst.push([i-1,j]); }
        if (dist.map[i][j+1]===' ') { dist.map[i][j+1] = imax; lst.push([i,j+1]); }
        if (dist.map[i][j-1]===' ') { dist.map[i][j-1] = imax; lst.push([i,j-1]); }
    }
    
    dist.imax = imax;
    dist.lst = lst;
    
    // iterate and return result
    return distance_iter(dist)
}

function destroy_food_under_influence(maze_map, mapdistP, mapdistG) {
	var i, j
	for (var i=0; i<n; i++)
		for (var j=0; j<m; j++)
			if ( (mapdistG[i][j]-5)<=mapdistP[i][j] && mapdistG[i][j] < 17)
				maze_map[i][j] = ' ';
}

// deep copy of reference
function clone(obj) {
    if (Object.prototype.toString.call(obj) === '[object Array]') {
        var out = [], i = 0, len = obj.length;
        for ( ; i < len; i++ ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    if (typeof obj === 'object') {
        var out = {}, i;
        for ( i in obj ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    return obj;
}
