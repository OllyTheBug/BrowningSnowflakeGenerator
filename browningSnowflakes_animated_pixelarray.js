/* -------------------------------------------------------------------------- */
/*                  //SECTION - DEFINITIONS AND DECLARATIONS                  */
/* -------------------------------------------------------------------------- */
// noinspection JSUnusedGlobalSymbols

/* ------------------------------- PARAMETERS ------------------------------- */
let _frameRate = 60;
let centerHorizontal;
let leftness = 1.5;
let rightness = 1;
let density = 10;
/* -------------------------------- INTERNAL -------------------------------- */
const fallingLimit = 1000;
const sin45 = Math.sin(Math.PI / 4);
const cos45 = Math.cos(Math.PI / 4);
let fallingParticles = [];
let emitterPixel;
let lockedIndexes = [];
let img;
/* ------------------------------- //!SECTION ------------------------------- */

/* -------------------------------------------------------------------------- */
/*                             // SECTION - SETUP                             */

/* -------------------------------------------------------------------------- */

function setup() {
    let canvas = createCanvas(800, 800);
    canvas.parent("sketch-holder");
    centerHorizontal = (width * 4) * (height / 2);
    emitterPixel = (width * 2);
    lockedIndexes = Array(width * height).fill(0);

    background(255);
    loadPixels();
    //noStroke();
    //fill(255);

    pixelDensity(1);
    frameRate(_frameRate);
    imageMode(CENTER);
    img = createImage(width, height);
}

/* ------------------------------ // !SECTION ------------------------------- */

/* -------------------------------------------------------------------------- */
/*                              // SECTION - DRAW                             */

/* -------------------------------------------------------------------------- */
function draw() {
    background(0);
    translate(width / 2, height / 2);
    img.loadPixels();
    //clear image
    for (let i = 0; i < img.pixels.length; i++) {
        img.pixels[i] = 0;
    }
    // Spawn particle
    if (fallingParticles.length < fallingLimit && frameCount % Math.floor(map(density, 1, 10, 60, 1)) === 0) {
        fallingParticles.push({pos: indexToXY(emitterPixel), color: 255});
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
    mirrorPixelArrayAcrossHorizontal();
    imposeRotatedPixelArray(getRotatedNinetyDeg());
    img.updatePixels();
    image(img, 0, 0);
    rotate(PI / 4);
    image(img, 0, 0);
}

/* ------------------------------ // !SECTION ------------------------------- */

/* -------------------------------------------------------------------------- */
/*                         // SECTION PARTICLE CHECKS                         */

/* -------------------------------------------------------------------------- */

function pixelAtVCenter(particle) {
    // if pixel index is at or below the center of the screen, return false
    return xyToIndex(particle.pos) >= centerHorizontal;

}

function pixelAtHCenter(particle) {
    if (xyToIndex(particle.pos) % (width * 4) >= (width * 4) / 2) {
        return true;
    }
}

function pixelAtEmitter(particle) {
    // if pixel hasn't left the emitter, return true
    return xyToIndex(particle.pos) <= emitterPixel;
}

// NOTE - Uses global landedParticles
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
    lockedIndexes[xyToIndex(particle.pos) / 4] = 1;
}

function particleToPixelArray(particle) {
    let root = xyToIndex(particle.pos);
    img.pixels[root] = particle.color;
    img.pixels[root + 1] = particle.color;
    img.pixels[root + 2] = particle.color;
    img.pixels[root + 3] = 255;
}

function xyToPixelArray(pos) {
    let root = xyToIndex(pos);
    img.pixels[root] = 255;
    img.pixels[root + 1] = 255;
    img.pixels[root + 2] = 255;
    img.pixels[root + 3] = 255;
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
            img.pixels[i * 4] = 255;
            img.pixels[i * 4 + 1] = 255;
            img.pixels[i * 4 + 2] = 255;
            img.pixels[i * 4 + 3] = 255;
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

function imposeRotatedPixelArray(rotatedPixels) {
    // OR the rotated pixels with the current pixels
    for (let i = 0; i < pixels.length; i++) {
        img.pixels[i] = (img.pixels[i] || rotatedPixels[i]) ? 255 : 0;
    }
}

function getRotatedFourtyFiveDeg() {
    let rotatedPixels = Array(pixels.length).fill(0);
    for (let i = 0; i < pixels.length; i += 4) {
        // if pixel (x,y) is white, make pixel (x+y,x-y) white
        if (img.pixels[i] === 255) {
            let pos = indexToXY(i);
            let newPos = [pos[0] * cos45 - pos[1] * sin45, pos[0] * sin45 + pos[1] * cos45];
            let newIndex = xyToIndex(newPos);
            rotatedimg.pixels[newIndex] = 255;
            rotatedimg.pixels[newIndex + 1] = 255;
            rotatedimg.pixels[newIndex + 2] = 255;
            rotatedimg.pixels[newIndex + 3] = 255;
        }
    }
    return rotatedPixels;

}

function getRotatedNinetyDeg() {
    let rotatedPixels = Array(pixels.length).fill(0);
    for (let i = 0; i < pixels.length; i += 4) {

        if (img.pixels[i] === 255) {
            let pos = indexToXY(i);
            let newPos = [-pos[1], pos[0]];
            let newIndex = xyToIndex(newPos);
            rotatedPixels[newIndex] = 255;
            rotatedPixels[newIndex + 1] = 255;
            rotatedPixels[newIndex + 2] = 255;
            rotatedPixels[newIndex + 3] = 255;
        }

    }
    return rotatedPixels;
}

function mirrorPixelArrayAcrossVertical() {
    for (let i = 0; i < pixels.length; i += 4) {
        // if pixel (x,y) is white, make pixel (-y,x) white
        if (img.pixels[i] === 255) {
            let pos = indexToXY(i);
            let newPos = [width - pos[0], pos[1]];
            let newIndex = xyToIndex(newPos);
            img.pixels[newIndex] = 255;
            img.pixels[newIndex + 1] = 255;
            img.pixels[newIndex + 2] = 255;
            img.pixels[newIndex + 3] = 255;
        }
    }
}

function mirrorPixelArrayAcrossHorizontal() {
    for (let i = 0; i < pixels.length; i += 4) {
        // if pixel (x,y) is white, make pixel (-y,x) white
        if (img.pixels[i] === 255) {
            let pos = indexToXY(i);
            let newPos = [pos[0], height - pos[1]];
            let newIndex = xyToIndex(newPos);
            img.pixels[newIndex] = 255;
            img.pixels[newIndex + 1] = 255;
            img.pixels[newIndex + 2] = 255;
            img.pixels[newIndex + 3] = 255;
        }
    }
}

/* ------------------------------ // !SECTION ------------------------------ */
//Page controls
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