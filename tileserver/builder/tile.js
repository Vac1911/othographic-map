"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tile = void 0;
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");
class Tile {
    constructor(x, y, z, options) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.options = options;
        this.canvas = createCanvas(this.options.tileSize, this.options.tileSize);
        this.context = this.canvas.getContext("2d");
        if (options.hasOwnProperty("antialias"))
            this.context.antialias = options.antialias ?? "default";
        this.context.save();
        this.context.fillStyle = options.bgColor;
        this.context.fillRect(0, 0, this.options.tileSize, this.options.tileSize);
        this.context.restore();
    }
    get boundingBox() {
        return [
            this.x * this.options.tileSize,
            this.y * this.options.tileSize,
            (this.x + 1) * this.options.tileSize,
            (this.y + 1) * this.options.tileSize,
        ];
    }
    layerToCanvas(p) {
        const x = p.x - this.x * this.options.tileSize;
        const y = p.y - this.y * this.options.tileSize;
        return { x: x, y: y };
    }
    draw(feat) {
        feat.draw(this);
    }
    writeImage(file) {
        if (!fs.existsSync(path.dirname(file)))
            fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, this.canvas.toBuffer("image/png"));
        // console.log('wrote: ' + file)
    }
}
exports.Tile = Tile;
