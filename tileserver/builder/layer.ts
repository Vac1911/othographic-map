import type { Point } from './interfaces'
import { Feature } from './feature'
import { Tile } from './tile'
import {MapOptions} from "./interfaces";

const chalk = require('chalk');
const log = console.log;

// CONSTANTS
const PI: number = Math.PI;

export class Layer {
    zoom: number;
    options: MapOptions;
    storagePath!: string;
    tiles: Tile[][] = [];
    features: Feature[] = [];

    constructor(zoom: number, options: MapOptions) {
        this.zoom = zoom;
        this.options = options;
    }

    run() {
        this.buildTiles();
        this.drawTiles();
    }

    buildTiles() {
        const length: number = 2 ** this.zoom;
        for (const x of Array(length).keys()) {
            let tileColumn: Tile[] = [];
            for (const y of Array(length).keys()) {
                tileColumn[y] = new Tile(x, y, this.zoom, this.options);
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

    writeTo(storagePath: string) {
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

    addFeature(feat: Feature) {
        this.features.push(feat);
        return this;
    }
}