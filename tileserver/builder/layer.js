"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Layer = void 0;
const tile_1 = require("./tile");
const chalk = require('chalk');
const log = console.log;
// CONSTANTS
const PI = Math.PI;
class Layer {
    constructor(zoom, options) {
        this.tiles = [];
        this.features = [];
        this.zoom = zoom;
        this.options = options;
    }
    run() {
        this.buildTiles();
        this.drawTiles();
    }
    buildTiles() {
        const length = 2 ** this.zoom;
        for (const x of Array(length).keys()) {
            let tileColumn = [];
            for (const y of Array(length).keys()) {
                tileColumn[y] = new tile_1.Tile(x, y, this.zoom, this.options);
            }
            this.tiles[x] = tileColumn;
        }
    }
    drawTiles() {
        for (const feat of this.features) {
            feat.scaleTo(this.zoom);
            for (const x in this.tiles) {
                for (const y in this.tiles[x]) {
                    this.tiles[x][y].draw(feat);
                }
            }
        }
    }
    writeTo(storagePath) {
        this.storagePath = storagePath;
        this.writeTiles();
    }
    writeTiles() {
        for (const x in this.tiles) {
            for (const y in this.tiles[x]) {
                this.tiles[x][y].writeImage(`${this.storagePath}/${this.zoom}/${x}/${y}.png`);
            }
        }
    }
    addFeature(feat) {
        this.features.push(feat);
        return this;
    }
}
exports.Layer = Layer;
