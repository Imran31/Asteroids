const canv = document.getElementById('gameCanvas')
const ctx = canv.getContext('2d');
const FPS = 30; // frames per second
const SHIP_SIZE = 30; // ship height in pixels
const TURN_SPEED = 360; // turn speed in degrees per second
const SHIP_THRUST = 5; // acceleration fo the ship in pixels per second per second
const FRICTION = 0.7; // coeff of friction (0: no friction 1: lots of friction)
const SHIP_EXPLODE_DUR = 0.3; // duration of ship explosion
const ROIDS_NUM = 3; // starting number of asteroids
const ROIDS_SPEED = 50; // max starting speed in pixels per second
const ROIDS_SIZE = 100; // starting size of aseroids in pixels
const ROIDS_VERT = 7; // average number of vertices on each asteroid
const ROIDS_JAG = 0.4; // jaggedness of asteroids (0: non, 1: lots)
const SHOW_BOUNNDING = false; // show or hide collision binding
const SHIP_INV_DUR = 3; // invulnerability duriation in seconds
const SHIP_BLINk_DUR = 0.1; // duration of ship's blink during invulnerability in seconds
const LASER_MAX = 10; // max number of lasers on screen
const LASER_SPEED = 500; // speed of lasers in pixels per second
const LASER_DIST = 0.6; // max distance laser travels as fraction of screen width

function newShip() {
    return {
                x: canv.width / 2,
                y: canv.height / 2,
                radius: SHIP_SIZE / 2,
                angle: 90 / 180 * Math.PI, // Convert to radians
                rot: 0,
                explodeTime: 0,
                blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINk_DUR),
                blinkTime: Math.ceil(SHIP_BLINk_DUR * FPS),
                canShoot: true,
                lasers: [],
                thrusting: false,
                thrust: {
                    x: 0,
                    y: 0
                }
            }
}

let ship = newShip();

let roids = [];
createAsteroidBelt();

// setup event handlers
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);


// set up the game loop
setInterval(update, 1000 / FPS);


function createAsteroidBelt() {
    roids = [];
    let x, y;
    for(let i = 0; i < ROIDS_NUM; i++) {
        do {
            x = Math.floor(Math.random() * canv.width);
            y = Math.floor(Math.random() * canv.height);
        } while(distBetweenPoints(ship.x, ship.y, x, y) < ROIDS_SIZE * 2 + ship.radius)
        roids.push(Asteroid(x, y))
    }
}

function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2) );
}

function Asteroid(x, y) {

    let v = Math.ceil(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2) + 2; // vertices
    let offsetArray = Array.from({length: v}, () => Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG);

    return {
        x: x,
        y: y,
        xv: Math.random() * ROIDS_SPEED / FPS * (Math.random < 0.5 ? 1 : -1),
        yv: Math.random() * ROIDS_SPEED / FPS * (Math.random < 0.5 ? 1 : -1),
        radius: ROIDS_SIZE / 2,
        angle: Math.random() * Math.PI * 2, // in radians
        vert:  v, // vertices
        offset: offsetArray
    }
}

function shootLaser() {
    // create laser object
    if(ship.canShoot && ship.lasers.length < LASER_MAX) {
        ship.lasers.push({
            x: ship.x + 4 / 3 * ship.radius * Math.cos(ship.angle),
            y: ship.y - 4 / 3 * ship.radius * Math.sin(ship.angle),
            xv: LASER_SPEED * Math.cos(ship.angle) / FPS,
            yv: -LASER_SPEED * Math.sin(ship.angle) / FPS,
            dist: 0
        })
    }
    // prevent further shooting
    ship.canShoot = false;
}

function keyDown(ev) {
    switch(ev.keyCode) {
        case 65: // left arrow : rotate ship left
            ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
            break;
        case 87: // up arrow : thrust forward
            ship.thrusting = true;
            break;
        case 68: // right arrow : rotate ship right
            ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;
            break;   
        case 32: // space bar for laser shoot
            shootLaser();
            break;     
    }
}

function keyUp(ev) {
    switch(ev.keyCode) {
        case 65: // left arrow : stop rotate ship left
            ship.rot = 0;
            break;
        case 87: // up arrow : stop thrusting
            ship.thrusting = false;
            break;
        case 68: // right arrow : stop rotate ship right
            ship.rot = 0;
            break;  
        case 32: // space bar allow shooting
            ship.canShoot = true;
            break;           
    }
    
}

function explodeShip() {
    ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS)
}

function update() {
    let exploding = ship.explodeTime > 0;
    let blinkOn = ship.blinkNum % 2 == 0;
    // draw space
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.width, canv.height);

    // thrust the ship
    if(ship.thrusting) {
        ship.thrust.x += SHIP_THRUST * Math.cos(ship.angle) / FPS;
        ship.thrust.y -= SHIP_THRUST * Math.sin(ship.angle) / FPS;

        // draw thruster
        if (!exploding && blinkOn) {    
            ctx.strokeStyle = "yellow";
            ctx.fillStyle = "red";
            ctx.lineWidth = SHIP_SIZE / 10;
            ctx.beginPath();
            ctx.moveTo( // rear left
                ship.x - ship.radius * ( 2 / 3 * Math.cos(ship.angle) + 0.5 * Math.sin(ship.angle)),
                ship.y + ship.radius * (2 / 3 * Math.sin(ship.angle) - 0.5 * Math.cos(ship.angle))
            );
            ctx.lineTo( // rear center behind ship
                ship.x - ship.radius * 6 / 3 * Math.cos(ship.angle),
                ship.y + ship.radius * 6 / 3 * Math.sin(ship.angle)
            );
            ctx.lineTo( // rear right
                ship.x - ship.radius * (2 / 3 * Math.cos(ship.angle) - 0.5 * Math.sin(ship.angle)),
                ship.y + ship.radius * (2 / 3 * Math.sin(ship.angle) + 0.5 * Math.cos(ship.angle))
            );
            ctx.closePath();
            ctx.fill()
            ctx.stroke();
        }
    }
    else {
        ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
        ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
    }

    // draw triangular ship
    if (!exploding) {   
        if (blinkOn) {    ctx.strokeStyle = "white";
            ctx.lineWidth = SHIP_SIZE / 20;
            ctx.beginPath();
            ctx.moveTo( // nose of the ship
                ship.x + 4 / 3 * ship.radius * Math.cos(ship.angle),
                ship.y - 4 / 3 * ship.radius * Math.sin(ship.angle)
            );
            ctx.lineTo( // rear left
                ship.x - ship.radius * ( 2 / 3 * Math.cos(ship.angle) + Math.sin(ship.angle)),
                ship.y + ship.radius * (2 / 3 * Math.sin(ship.angle) - Math.cos(ship.angle))
            );
            ctx.lineTo( // rear right
                ship.x - ship.radius * (2 / 3 * Math.cos(ship.angle) - Math.sin(ship.angle)),
                ship.y + ship.radius * (2 / 3 * Math.sin(ship.angle) + Math.cos(ship.angle))
            );
            ctx.closePath();
            ctx.stroke();
        }

        // handle blinking
        if(ship.blinkNum > 0) {
            // reduce blink time
            ship.blinkTime--;
            // reduce blink num
            if (ship.blinkTime == 0) {
                ship.blinkTime = Math.ceil(SHIP_BLINk_DUR * FPS);
                ship.blinkNum--;
            }
        }
    }
    else {
        ctx.fillStyle = "maroon";
        ctx.strokeStyle = "maroon";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.radius * 1.7, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "red";
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.radius * 1.4, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "orange";
        ctx.strokeStyle = "orange";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.radius * 1.1, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "yellow";
        ctx.strokeStyle = "yellow";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.radius * 0.8, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.radius * 0.5, Math.PI * 2, false);
        ctx.fill();
    }

    if(SHOW_BOUNNDING) {
        ctx.strokeStyle ="yellow";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.radius, Math.PI * 2, false);
        ctx.stroke();
    }

    // draw the steroids
    for(let i = 0; i < roids.length; i++) {
        ctx.strokeStyle = "slategrey";
        ctx.lineWidth = SHIP_SIZE / 20;
        let x = roids[i].x;
        let y = roids[i].y;
        let radius = roids[i].radius;
        let angle = roids[i].angle;
        let vert = roids[i].vert;
        let offs = roids[i].offset
        // draw a path
        ctx.beginPath();
        ctx.moveTo(
            x + radius * offs[0] * Math.cos(angle),
            y + radius * offs[0] * Math.sin(angle),
        );
        // draw a polygon
        for(let j = 1; j < vert; j++) {
            ctx.lineTo(
                x + radius * offs[j] * Math.cos(angle + j * Math.PI * 2 / vert),
                y + radius * offs[j] * Math.sin(angle + j * Math.PI * 2 / vert),
            );
        }

        ctx.closePath();
        ctx.stroke();

        if(SHOW_BOUNNDING) {
            ctx.strokeStyle ="yellow";
            ctx.beginPath();
            ctx.arc(x, y, radius, Math.PI * 2, false);
            ctx.stroke();
        }


    }
    
    if (!exploding) {    
        // check for collisions
        if(ship.blinkNum == 0) {
            for(let i = 0; i < roids.length; i++) {
                if(distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) < ship.radius + roids[i].radius) {
                    explodeShip();
                }
            }      
        } 
        // rotate ship
        ship.angle += ship.rot;

        // move the sjip
        ship.x += ship.thrust.x;
        ship.y += ship.thrust.y;
    } 
    else {
        ship.explodeTime--;

        if(ship.explodeTime == 0) {
            ship = newShip();
            console.log(ship)
        }
    }

    // draw lasers
    for(let i = 0; i < ship.lasers.length; i++) {
        ctx.fillStyle = "salmon";
        ctx.beginPath();
        ctx.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15, 0, Math.PI * 2, false);
        ctx.fill();
    }

    // detect laser hits on asteroids

    // move lasers
    for(let i = ship.lasers.length - 1; i >= 0; i--) {
        // check distance traveled
        if (ship.lasers[i].dist > LASER_DIST * canv.width) {
            ship.lasers.splice(i, 1);
            continue;
        }

        // move laser
        ship.lasers[i].x += ship.lasers[i].xv;
        ship.lasers[i].y += ship.lasers[i].yv;

        // calculate distance traveled
        ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2));

        // handel edge of screen
        if( ship.lasers[i].x < 0) {
            ship.lasers[i].x = canv.width;
        }
        else if (ship.lasers[i].x > canv.width) {
            ship.lasers[i].x = 0;
        }
        if( ship.lasers[i].y < 0) {
            ship.lasers[i].y = canv.height;
        }
        else if (ship.lasers[i].y > canv.height) {
            ship.lasers[i].y = 0;
        }
    }


    // handle if ship goes off screen
    if (ship.x < 0 - ship.radius) {
        ship.x = canv.width + ship.radius
    }
    else if (ship.x > canv.width + ship.radius) {
        ship.x = 0 - ship.radius;
    }
    if (ship.y < 0 - ship.radius) {
        ship.y = canv.height + ship.radius
    }
    else if (ship.y > canv.height + ship.radius) {
        ship.y = 0 - ship.radius;
    }


    for(let i = 0; i < roids.length; i++) {
        // move asteroid
        roids[i].x += roids[i].xv;
        roids[i].y +=  roids[i].yv;

        // handle edge of screen
        if (roids[i].x < 0 - roids[i].radius) {
            roids[i].x = canv.width + roids[i].radius;
        }
        else if (roids[i] > canv.width + roids[i].radius) {
            roids[i].x = 0 - roids[i].radius;
        }
        if (roids[i].y < 0 - roids[i].radius) {
            roids[i].y = canv.height + roids[i].radius;
        }
        else if (roids[i] > canv.height + roids[i].radius) {
            roids[i].y = 0 - roids[i].radius;
        }
    }

    if (SHOW_BOUNNDING) {
        // centre dot
        ctx.fillStyle = "red",
        ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2);
    }
}
