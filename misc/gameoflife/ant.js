'use-strict'

const frontcolor = "blue";
const backcolor = "beige";

const heading_names = [ "North", "East", "South", "West" ];
const heading_steps = [ [ 0, 1 ], [ 1, 0 ], [ 0, -1 ], [ -1, 0 ] ];

function iterate(state) {
    state.iStep++;
    
    // move 
    var step = heading_steps[state.heading];
    state.x = ( state.x + step[0] + state.w) % state.w;
    state.y = ( state.y + step[1] + state.h) % state.h;

    // turn right if on white, left in on black
    if (state.grid[state.x][state.y] == 0)
        state.heading = (state.heading + 1) % 4;
    else
        state.heading = (state.heading - 1 + 4) % 4;

    // change color of the cell we're on
    state.grid[state.x][state.y] = ( state.grid[state.x][state.y] + 1 ) % 2;
}

function new_grid(w, h) {
    return new Array(w).fill(true).map(_ => new Array(h).fill(0));
}

function render_grid_init(state) {
    var txt = "<table>";
    for (var i=0; i<state.h; i++) {
        txt += "<tr>"
        for (var j=0; j<state.w; j++)
            txt += '<td id="r'+(state.h-1-i)+'c'+j+'" style="height: 7px; width: 7px; padding: 0px; background-color: '+backcolor+';"></td>';
        txt += "</tr>"
    }
    txt += "</table>"

    var table = document.getElementById("ant");
    table.innerHTML = txt;
}

function render_grid_update(state) {
    var elnt = document.getElementById("info");
    elnt.innerText = "Ant step "+state.iStep+" heading " + heading_names[state.heading];

    var id = 'r'+state.y+'c'+state.x;
    var elnt = document.getElementById(id);
    elnt.style.backgroundColor = state.grid[state.x][state.y] ? frontcolor : backcolor;
}

function main() {
    var state = {
        w: 120, h: 80, 
        x: 50, y: 40,
        iStep: 0,
        heading: 3, // North (0), East (1), South (2) or West (3)
        grid: new_grid(120, 80)
    };
    
    render_grid_init(state);
    
    function one_step(e) {
        iterate(state);
        render_grid_update(state)
    }

    one_step();
    
    document.getElementById("step")
    .addEventListener("click", one_step, false);
    
    document.getElementById("walk")
    .addEventListener("click", function (e) {
        setInterval(one_step, 200);
    }, false);
    
}