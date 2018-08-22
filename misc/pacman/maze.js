/*
	Author: Claude Cochet
	Creation date : 2012-01-19
*/

var dir_none = 0, dir_left = 1, dir_right = 2, dir_down = 5, dir_up =6;
var normal_pacman = 0, super_pacman = 1, zombie = 2;

var n, m, map;   // maze
var dist0, distG; // distance to food/ghosts
var walls =[
	//123456789012345678901234567
	"xxxxxxxxxxxxxxxxxxxxxxxxxxxx", // 0
	"x............xX............x",	// 1
	"x.xxxx.xxxxx.xX.xxxxx.xxxx.x",	// 2
	"xoxXXX.xXXXX.xX.xXXXX.xXXXox",	// 3
	"x.xXXX.xXXXX.xX.xXXXX.xXXX.x",	// 4
	"x..........................x",	// 5
	"x.xxxx.xx.xxxxxxxx.xx.xxxx.x",	// 6
	"x.xXXX.xX.xXXXXXXX.xX.xXXX.x",	// 7
	"x......xX....xX....xX......x",	// 8
	"xxxxxx.xXxxx.xX.xxxxX.xxxxxx",	// 9
	"xXXXXX.xXXXX.xX.xXXXX.xXXXXX",	// 10
	"xZZZZX.xX          xX.xXZZZZ",	// 11
	"xZZZZX.xX xxx  xxx xX.xXZZZZ",	// 12
	"xXXXXX.xX xXX  xXX xX.xXXXXX",	// 13
	"      .              .      ",	// 14
	"xxxxxx.xx xxx  xxx xx.xxxxxx",	// 15
	"xXXXXX.xX xXX  xXX xX.xXXXXX",	// 16
	"xZZZZX.xX          xX.xXZZZZ",	// 17
	"xZZZZX.xX.xxxxxxxx.xX.xXZZZZ",	// 18
	"xXXXXX.xX.xXXXXXXX.xX.xXXXXX",	// 19
	"x............xX............x",	// 20
	"x.xxxx.xxxxx.xX.xxxxx.xxxx.x",	// 21
	"x.xXXX.xXXXX.xX.xXXXX.xXXX.x",	// 22
	"xo..xX................xX..ox",	// 23
	"xxx.xX.xx.xxxxxxxx.xx.xX.xxx",	// 24
	"xXX.xX.xX.xXXXXXXX.xX.xX.xXX",	// 25
	"x......xX....xX....xX......x",	// 26
	"x.xxxxxxXxxx.xX.xxxxXxxxxx.x",	// 27
	"x.xXXXXXXXXX.xX.xXXXXXXXXX.x",	// 28
	"x..........................x", // 29
	"xxxxxxxxxxxxxxxxxxxxxxxxxxxx"  // 30  
	//012345678901234567890123456
];

function make_map() {
	n = walls.length;
	m = walls[0].length;
	var table = Array(n)
	for (var i=0; i<n; i++) {
		table[i] = Array(m)
		for (var j=0; j<m; j++) { 
			table[i][j] = walls[i].substring(j,j+1);
		}
	}
	return table;
};
map = make_map();

function make_map_text(map) {
	var txt = "\n"
	for (var i=0; i<n; i++) {
		txt = txt + i + "\t"
        for (var j=0; j<m; j++)
			txt = txt + map[i][j]
        txt = txt + "\n"
	}
    return txt+"\n";
}

// Generate dots and walls graphics
// dot ids are "#line-col"
function GenerateWallsAndDots(){
	$maze = $("#maze")
	$maze.height((n*18-18)+"px");
	$maze.width((m*18-18)+"px");
	for (var i=0; i<n; i++) {
		for (var j=0; j<m; j++) { 
			if (map[i][j] == ".") {
				$maze.append('<div id="'+i+'-'+j+'" class="small-dot" />');
				$('#'+i+'-'+j).css({
					left : (18*j-2)+"px",
					top : (18*i-2)+"px"
				});
			} else if (map[i][j] == "o") {
				$maze.append('<div id="'+i+'-'+j+'" class="big-dot" />');
				$('#'+i+'-'+j).css({
					left : (18*j-8)+"px",
					top : (18*i-8)+"px"
				});
			} else if (map[i][j] == "X" || map[i][j] == "Z") { 
				$maze.append('<div class="wall" style="width:18px;height:18px;left:'+(18*j-18)+'px;top:'+(18*i-18)+'px;"></div>')
			}
		}
	}
}

function is_wall(j,i) {
	return map[i][j] == "X" || map[i][j] == "x";
}

function count_gums(map) {
    var count = 0;
	for (var i=0; i<n; i++)
		for (var j=0; j<m; j++)
			if (map[i][j]=='.' || map[i][j]=='o') 
				count++;
    return count;
}

function is_direction_ok(x, y, dir) {
	switch (dir){
		case dir_none: 	return true;
		case dir_left: 		return !is_wall(x - 1, y);
		case dir_right: 	return !is_wall(x + 1, y);
		case dir_down: 	return !is_wall(x, y + 1);
		case dir_up: 		return !is_wall(x, y - 1);
			break;
		default: 
			debugger;
			return false;
	}
}

// Show all dots
function ShowAllDots() {
	$("div.small-dot").show();
	$("div.big-dot").show();
	map = make_map(); 
}

// -----------------------------------------------------------------------------------------------------

// responsioble for animation / score / lives
pacman = function () {
	var pmspeed=160; //120; // 80
	var pmspeed=160; //120; // 80
	var gspeed=180; // 135; // 90
	var score = 0;
	var lives = 3;
	
	
	// Hide dot
	function HideDot(id) {
		if ($('#'+id).css("display") != "none") {
			$('#'+id).hide();
			SetScore(score+10);
			
			if ((id=='3-26') || (id=='23-26') || (id=='3-1') || (id=='23-1')) {
				SetScore(score+40);
				
				clyde.state = blinky.state = inky.state = pinky.state = super_pacman;
				clyde.setDirFrame(); pinky.setDirFrame(); inky.setDirFrame(); blinky.setDirFrame();				   				   
				ResetInterval(120);
				
				window.setTimeout(function(){
					clyde.state = pinky.state = inky.state = blinky.state = normal_pacman;
					clyde.setDirFrame(clyde.direction); pinky.setDirFrame(clyde.direction); inky.setDirFrame(clyde.direction); blinky.setDirFrame(clyde.direction);				   				   
					ResetInterval(gspeed);
				}, 10000);
			}
		}
	}
 
	function ResetInterval(speed) {
		clrInt();
		clyde.interval = window.setInterval(function () {clyde.move();},speed);
		inky.interval = window.setInterval(function () {inky.move();},speed);		
		pinky.interval = window.setInterval(function () {pinky.move();},speed);				
		blinky.interval = window.setInterval(function () {blinky.move();},speed);	
		pm.interval = window.setInterval(function () {pm.move();},pmspeed);	
	}
	
	function clrInt() {
		window.clearInterval(clyde.interval);
		window.clearInterval(inky.interval);
		window.clearInterval(pinky.interval);		
		window.clearInterval(blinky.interval);				
		window.clearInterval(pm.interval);				
	}

	function SetScore(nr) { score=nr;  
		$('#sc').html("Score: "+score);  
	}
	function SetLives(nr) { lives=nr;
		$("div.lives").css("background", "none"); 
		for (var i=1;i<=lives;i++) 
			$('#life'+i).css("background", "url(img/pm.gif) -120px 0");
	}

	function newLevel() {
		pacman.LockKey();
		clrInt();	   
		ShowAllDots();
		pm.moveTo(14,23);    	
		clyde.moveTo(13,14); blinky.moveTo(14,14); inky.moveTo(13,14); pinky.moveTo(14,14);			
		clyde.setDirFrame(dir_up); blinky.setDirFrame(dir_down); inky.setDirFrame(dir_left); pinky.setDirFrame(dir_right);
		clyde.state = blinky.state = inky.state = pinky.state = normal_pacman;
	}

	function death() {
		pacman.LockKey();
		clrInt();	  
		
		SetLives(lives-1);
		window.clearInterval(pm.interval);
		pm.setDirFrame(dir_none);
		window.setTimeout(function() {
			MoveKey($("#autopilot").is(':checked')?dir_none:dir_left);
			pm.moveTo(14,23);
			pm.setDirFrame(dir_none); 	        
			$(document).keydown(pacman.UnLockKey);
			
			clyde.moveTo(13,14); blinky.moveTo(14,14); inky.moveTo(13,14); pinky.moveTo(14,14);			
			clyde.setDirFrame(dir_up); blinky.setDirFrame(dir_down); inky.setDirFrame(dir_left); pinky.setDirFrame(dir_right);
			clyde.state = blinky.state = inky.state = pinky.state = normal_pacman;
			
			if (lives<0) {
				$('#infobox').css('display','block');
				$('#infobox').innerHTML='GAME OVER';
				clrInt();		
				clyde.setDirFrame(7); blinky.setDirFrame(7); inky.setDirFrame(7); pinky.setDirFrame(7);
				pacman.LockKey();
				return 0;
			}
			ResetInterval(gspeed);
		},1000);
	}
	
	// CSprite Object
	var CSprite = function (id, x, y, dir, state) {
		this.id = id;
		this.ox = x;
		this.oy = y;
		this.direction = dir;				// direction
		this.dir_request = dir;			// direction requested (manual)
		this.state = normal_pacman;	// normal_pacman (0), super_pacman (1), dead (2 if ghost)
		this.external_state = state;
		this.interval = 100;		// ms
		
		// set direction (and pict frame)
		this.setDirFrame = function (dir) {
			if (this.state==normal_pacman) {
				if (dir>=1 && dir<=4) { // left 1 or right 2
					$('#'+this.id).css("background-position", (dir*-30)+"px 0px"); 
				} else if (dir>=5 && dir<=8) { // down 5 or up 6 (the bitmap is 5 sprite wide and sliding is cyclic so shifting by 6x30px is actualy moving by (6%5)*30px)
					$('#'+this.id).css("background-position", (dir*-30)+"px 30px"); 
				}
			}
			else if (this.state==1) {
				// state=1 means : dead for pacman / pacman in super user mode for ghosts
				$('#'+this.id).css("background-position", "0 0"); 
			}
			else if (this.state==zombie) {
				// the bitmap is 5 sprite wide and sliding is cyclic so shifting by 9x30px is actualy moving by (9%5)*30px = 4*30px)
				$('#'+this.id).css("background-position", (9*-30)+"px 30px"); 
			}
			if (dir!=undefined) // dir is optional when just changing the frame to reflect new state 
				this.direction = dir;
		}
		
		this.moveTo = function (mx,my) {
			if (!is_wall(mx, my)) {
				// valid target position
				$('#'+this.id).css({
					left : ((18*mx-18)+3), 
					top : ((18*my-18)+3)
				});
				
				this.ox = mx;
				this.oy = my;
			} else {
				// invalid : do nothing
				var bug = 1;
			}
		} 
	}
	// only used by move to above
	/*
	*/
	
	// collision ?
	CSprite.prototype.collision_detected = function(pm, ghost)  {
	return ( (ghost.ox+1>=pm.ox && ghost.ox+1<=pm.ox+2) || (ghost.ox<=pm.ox+1 && ghost.ox>=pm.ox+1)) 
			&& ((ghost.oy+1>=pm.oy && ghost.oy+1<=pm.oy+2) || (ghost.oy<=pm.oy+1 && ghost.oy>=pm.oy+1));
	}
	
	CSprite.prototype.move = function () {
		// *** ghosts ***
		
		var mx = this.ox;
		var my = this.oy;
		
		if (this.id != "pacman") {
			if (this.collision_detected(pm, this)) {
				// collision
				if (this.state == normal_pacman) { death(); return; }
				if (this.state == super_pacman ) { SetScore(score+200); this.state=zombie; this.setDirFrame(); }
			}
			if (mx == 13 && my == 14) { 	
				// back to life
				this.state = normal_pacman;	
				this.setDirFrame(this.direction); 
			}
			
			var new_dir = ask_ghost(this.id, this.ox, this.oy, this.direction, this.state, this.external_state, pm)
			if (new_dir!=-1) this.setDirFrame(new_dir);
			
		} else {
			// Pacman direction
			$autopilot = $("#autopilot")
			if ( this.dir_request==0 ) {
				$autopilot.attr('checked', true);
				$("#maze").css({ "border-color" : "#f30" });
				
				var new_dir = ask_pacman_autopilot(this.ox, this.oy, this.direction, this.external_state); 
				if (new_dir!=-1) this.setDirFrame(new_dir);				
			} else {
				$("#maze").css({ "border-color" : "#03f" });
				$autopilot.attr('checked', false);
				
				var new_dir = ask_pacman_keyboard(this.ox, this.oy, this.direction, this.dir_request);
				if (new_dir!=-1) this.setDirFrame(new_dir);				
			}
		}
		
		// maze geometry
		switch (this.direction) {
			case dir_left:
				if ( (mx-1)==0 && my==14 ) { this.moveTo(26,14); break;  }  // tunnel
				this.moveTo(mx-1,my); break;
			case dir_right:
				if ( (mx+1)==27 && my==14 ) { this.moveTo(0,14); break;  }  // tunnel
				this.moveTo(mx+1,my); break;
			case dir_down :
				this.moveTo(mx,my+1); break;
			case dir_up: 
				this.moveTo(mx,my-1); break;
		}
		
		if (this.id == "pacman") {
			HideDot(my+'-'+mx);
			map[my][mx] = ' ';
			
			var dotsleft = count_gums(map)
			
			if (dotsleft == 0) {
				alert("Level complete")
				newLevel(); }
		}
	}
	
	// Pacman manual control
	function MoveKey(d) {
		pm.dir_request = d; 
	}

	
	var clyde = new CSprite("clyde", 13, 14, dir_down, {  flag : false, dx : 15 });
	var blinky = new CSprite("blinky", 14, 14, dir_up, {  flag : false, dx : 15 });   
	var inky = new CSprite("inky", 13, 14, dir_left, {  flag : false, dx : 15 });
	var pinky = new CSprite("pinky", 14, 14, dir_right, {  flag : false, dx : 15 });   
	var maze = { clyde : clyde,  blinky : blinky,  inky :  inky, pinky : pinky };
	
	var pm = new CSprite("pacman",14, 23, dir_left, { maze : maze } );		
	var pm_state = 37;		
 
	var key_enter = 13, key_space = 32, key_up = 38, key_down = 40, key_left = 37, key_right = 39 
	
	return {
		StartGame: function () {
			ShowAllDots(); SetScore(0); SetLives(3);
			$(document).unbind('keydown');
			$(document).keydown(pacman.UnLockKey);
			$('#infobox').hide()
			
			// Pacman
			pm.moveTo(14,23); MoveKey($("#autopilot").is(':checked')?dir_none:dir_left); 	
			
			// Ghosts
			clyde.moveTo(13,14); blinky.moveTo(14,14); inky.moveTo(13,14); pinky.moveTo(14,14);			
			clyde.setDirFrame(dir_up); blinky.setDirFrame(dir_down); inky.setDirFrame(dir_left); pinky.setDirFrame(dir_right);
			
			ResetInterval(gspeed);
		},
		UnLockKey: function (e) {
			// key presssed
			var pm_choice = e.which
			switch (pm_choice) {
				case (key_space): MoveKey(dir_none); break;
				case (key_left): MoveKey(dir_left); break;
				case (key_right): MoveKey(dir_right); break;
				case (key_down): MoveKey(dir_down);  break;
				case (key_up):  MoveKey(dir_up);  break;
			}
		},	
		MenuKey: function (e) {
			if (e.which==key_enter) pacman.StartGame();
		},
		LockKey: function () {
			$(document).unbind('keydown');
			$(document).keydown(pacman.MenuKey);
		},
		init: function () {
			GenerateWallsAndDots();
			$('#infobox').css('display','block');
			$(document).keydown(pacman.MenuKey);
		}
	}
} ();

function init() {
	pacman.init();
}
