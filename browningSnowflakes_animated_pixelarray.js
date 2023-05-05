/* -------------------------------------------------------------------------- */
/*                  //SECTION - DEFINITIONS AND DECLARATIONS                  */
/* -------------------------------------------------------------------------- */
// noinspection JSUnusedGlobalSymbols

/* ------------------------------- PARAMETERS ------------------------------- */
const _frameRate = 60;
let centerHorizontal;
let leftness = 1;
let rightness = 1;
let density = 10;
let oscillationSpeed = 0;
let selectedColor = [0, 255, 255, 255];
/* -------------------------------- INTERNAL -------------------------------- */
const fallingLimit = 1000;
const sin45 = Math.sin(Math.PI / 4);
const cos45 = Math.cos(Math.PI / 4);
let fallingParticles = [];
let emitterPixel;
let lockedIndexes = [];
let currentColor = [0, 255, 255, 255]
let indexColors = [];
let img;
let ctx;
/* ------------------------------- //!SECTION ------------------------------- */

/* -------------------------------------------------------------------------- */
/*                             // SECTION - SETUP                             */

/* -------------------------------------------------------------------------- */

function setup() {
    let canvas = createCanvas(800, 800);
    ctx = canvas.drawingContext;
    canvas.parent("sketch-holder");
    centerHorizontal = (width * 4) * (height / 2);
    emitterPixel = (width * 2);
    lockedIndexes = Array(width * height).fill(0);
    indexColors = Array(width * height).fill(0);

    background(255);
    loadPixels();

    pixelDensity(1.1);
    frameRate(_frameRate);
    imageMode(CENTER);
    img = createImage(width, height);
}

/* ------------------------------ // !SECTION ------------------------------- */

/* -------------------------------------------------------------------------- */
/*                              // SECTION - DRAW                             */

/* -------------------------------------------------------------------------- */
function draw() {
    currentColor = oscillationSpeed > 0 ? oscilateColor() : selectedColor;
    background(0);
    translate(width / 2, height / 2);
    img.loadPixels();
    //clear image
    for (let i = 0; i < img.pixels.length; i++) {
        img.pixels[i] = 0;
    }
    // Spawn particle
    if (fallingParticles.length < fallingLimit && frameCount % Math.floor(map(density, 1, 10, 60, 1)) === 0) {
        fallingParticles.push({ pos: indexToXY(emitterPixel), color: currentColor });
        // If new spawn is adjacent to landed particle, the snowflake is complete
        if (particleAdjacentToLanded(fallingParticles[fallingParticles.length - 1])) {
            noLoop();
            console.log("done");
        }
    }
    addFallingParticlesToPixelArray();
    updateFallingParticles();
    landedToPixelArray();
    mirrorPixelArrayAcrossVertical();
    img.updatePixels();
    for (let i = 0; i<6; i++){
        rotate(PI/3);
        image(img, 0, 0);
    }
}

/* ------------------------------ // !SECTION ------------------------------- */

/* -------------------------------------------------------------------------- */
/*                         // SECTION PARTICLE CHECKS                         */
/* -------------------------------------------------------------------------- */

function pixelAtVCenter(particle) {
    // if pixel index is at or below the center of the screen, return false
    return xyToIndex(particle.pos) >= centerHorizontal;

}

function particleAdjacentToLanded(particle) {
    let root = xyToIndex(particle.pos);
    //check the eight pixels surrounding the particleA
    let adjacents = [root - 4,
    root + 4,
    root - (width * 4),
    root + (width * 4),
    root - (width * 4) - 4,
    root - (width * 4) + 4,
    root + (width * 4) - 4,
    root + (width * 4) + 4]
    for (let i = 0; i < adjacents.length; i++) {
        if (lockedIndexes[adjacents[i] / 4] === 1) {
            return true;
        }
    }
    return false;
}

/* ------------------------------- // !SECTION ------------------------------ */

/* -------------------------------------------------------------------------- */
/*                      // SECTION PARTICLE MANIPULATION                      */

/* -------------------------------------------------------------------------- */

function xyToIndex(pos) {
    let rowLength = width * 4;
    return round(pos[0] * 4 + pos[1] * rowLength);
}

function indexToXY(index) {
    return [Math.floor((index % (width * 4)) / 4), Math.floor(index / (width * 4))];
}

function fall(particle) {
    particle.pos[1] += 1;
    particle.pos[0] += round(random(-leftness, rightness));
}

function land(particle) {
    const root = xyToIndex(particle.pos);
    lockedIndexes[root / 4] = 1;
    indexColors[root / 4] = particle.color;

}

function particleToPixelArray(particle) {
    let root = xyToIndex(particle.pos);
    img.pixels[root] = particle.color[0];
    img.pixels[root + 1] = particle.color[1];
    img.pixels[root + 2] = particle.color[2];
    img.pixels[root + 3] = particle.color[3];
}

function updateFallingParticles() {
    for (let i = 0; i < fallingParticles.length; i++) {
        if (pixelAtVCenter(fallingParticles[i]) || particleAdjacentToLanded(fallingParticles[i])) {
            land(fallingParticles[i]);
            fallingParticles.splice(i, 1);
        } else {
            fall(fallingParticles[i]);
        }
    }
}

function landedToPixelArray() {
    for (let i = 0; i < lockedIndexes.length; i++) {
        if (lockedIndexes[i] === 1) {
            img.pixels[i * 4] = indexColors[i][0];
            img.pixels[i * 4 + 1] = indexColors[i][1];
            img.pixels[i * 4 + 2] = indexColors[i][2];
            img.pixels[i * 4 + 3] = indexColors[i][3];
        }
    }
}

function addFallingParticlesToPixelArray() {
    for (let i = 0; i < fallingParticles.length; i++) {
        particleToPixelArray(fallingParticles[i]);
    }
}

/* -------------------------------------------------------------------------- */
/*                        // SECTION - TRANSFORMATIONS                        */
/* -------------------------------------------------------------------------- */
function mirrorPixelArrayAcrossVertical() {
    for (let i = 0; i < pixels.length; i += 4) {
        // if pixel (x,y) is white, make pixel (-y,x) white
        if (img.pixels[i + 3] === 255) {
            let pos = indexToXY(i);
            let newPos = [width - pos[0], pos[1]];
            let newIndex = xyToIndex(newPos);
            img.pixels[newIndex] = img.pixels[i];
            img.pixels[newIndex + 1] = img.pixels[i + 1];
            img.pixels[newIndex + 2] = img.pixels[i + 2];
            img.pixels[newIndex + 3] = img.pixels[i + 3];
        }
    }
}

/* ------------------------------ // !SECTION ----------------------------- */
/* ------------------------------------------------------------------------ */
/*                           // SECTION - CONTROLS                          */
/* ------------------------------------------------------------------------ */

//When #leftness slider changes, update leftness
$("#leftness").on("input", function () {
    leftness = this.value;
    $("#leftn").text(leftness);
});
//When #rightness slider changes, update rightness
$("#rightness").on("input", function () {
    rightness = this.value;
    $("#rightn").text(rightness);
});
//When #density slider changes, update rightness
$("#density").on("input", function () {
    density = this.value;
    $("#densityn").text(rightness);
});
//When $frameRate slider changes, update frameRate
$("#framerate").on("input", function () {
    frameRate(this.value);
    $("#framern").text(this.value);
});
//When color slider changes, update currentColor
$("#color-picker").on("input", function () {
    selectedColor = hexToRgb(this.value);
});
//When clear button is clicked, clear the canvas, reset the lockedIndexes, and reset the fallingParticles
$("#clearButton").on("click", function () {
    clear();
    background(0);

    lockedIndexes = Array(width * height).fill(0);
    fallingParticles = [];
});
//When Stop button is clicked, stop the draw loop
$("#stopButton").on("click", function () {
    noLoop();
});
//When Play button is clicked, start the draw loop
$("#playButton").on("click", function () {
    loop();
});
//When oscillation speed slider changes, update oscillation speed
$("#oscillation").on("input", function () {
    oscillationSpeed = this.value;
    $("#oscn").text(this.value);
});
//Helper functions

//oscillate over the entire color spectrum
function oscilateColor() {
    let hue = frameCount * 2 * map(oscillationSpeed,0,10,0,20) % 360;
    let sat = 1;
    let val = 1;
    return HSVtoRGB(hue, sat, val);
}
//Convert hex color to rgb array
function hexToRgb(hex) {
    if (hex.length === 4) {
        hex = hex + hex[1] + hex[2] + hex[3];
    }
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    let a = 255;
    return [r, g, b, a];
}
function HSVtoRGB(hue, sat, val) {
    let chroma = val * sat;
    let huePrime = hue / 60;
    let x = chroma * (1 - Math.abs((huePrime % 2) - 1));
    let r1, g1, b1;
    if (huePrime >= 0 && huePrime <= 1) {
        [r1, g1, b1] = [chroma, x, 0];
    } else if (huePrime >= 1 && huePrime <= 2) {
        [r1, g1, b1] = [x, chroma, 0];
    } else if (huePrime >= 2 && huePrime <= 3) {
        [r1, g1, b1] = [0, chroma, x];
    } else if (huePrime >= 3 && huePrime <= 4) {
        [r1, g1, b1] = [0, x, chroma];
    } else if (huePrime >= 4 && huePrime <= 5) {
        [r1, g1, b1] = [x, 0, chroma];
    } else if (huePrime >= 5 && huePrime <= 6) {
        [r1, g1, b1] = [chroma, 0, x];
    }
    let m = val - chroma;
    let [r, g, b] = [r1 + m, g1 + m, b1 + m];
    return [r * 255, g * 255, b * 255, 255];
}