"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Marker = require('./marker');
const layer_1 = require("./layer");
const { execCmd } = require('../utils');
const chalk = require('chalk');
const log = console.log;
// CONSTANTS
const PI = Math.PI;
const PI_4 = PI / 4;
const DEGREES_TO_RADIANS = PI / 180;
const RADIANS_TO_DEGREES = 180 / PI;
module.exports = class Map {
    constructor(maxZoom, storagePath, options = {}) {
        this.options = {
            tileSize: 512,
            bgColor: 'black',
        };
        this.layers = [];
        this.features = [];
        this.maxZoom = maxZoom;
        this.storagePath = storagePath;
        this.options = Object.assign(this.options, options);
    }
    async run() {
        await this.clearStorage();
        this.buildLayers();
        this.drawLayers();
    }
    async clearStorage() {
        await execCmd(`rm -rf ${this.storagePath}/*`);
    }
    buildLayers() {
        for (const z of Array(this.maxZoom + 1).keys()) {
            this.layers[z] = new layer_1.Layer(z, this.options);
        }
    }
    drawLayers() {
        for (const feat of this.features) {
            for (const z in this.layers) {
                this.layers[z].addFeature(feat);
            }
        }
        for (const z in this.layers) {
            log(chalk.green(`Layer ${z} (${(2 ** parseInt(z)) ** 2}) Tiles`));
            this.layers[z].run();
            this.layers[z].writeTo(`${this.storagePath}`);
        }
    }
    addFeature(feature) {
        feature.calcWorldGeom(this.coordToWorld.bind(this));
        if (feature.geometry.type)
            this.features.push(feature);
        else
            console.log(feature);
        return this;
    }
    /**
     * Project [lng,lat] on sphere onto [x,y] on 512*512 Mercator Zoom 0 layer.
     * Performs the nonlinear part of the web mercator projection.
     * Remaining projection is done with 4x4 matrices which also handles
     * perspective.
     *
     * @see https://github.com/uber-web/math.gl/blob/master/modules/web-mercator/src/web-mercator-utils.js
     *
     * @param Point {x: lng, y: lat} Specifies a point on the sphere to project onto the map.
     * @return Point world pixel position.
     */
    coordToWorld([lng, lat]) {
        //  Lattitude flipped because canvas system has flipped y axis
        // lat = -lat;
        const lambda2 = lng * DEGREES_TO_RADIANS;
        const phi2 = lat * DEGREES_TO_RADIANS;
        const x = (this.options.tileSize * (lambda2 + PI)) / (2 * PI);
        const y = (this.options.tileSize * (PI + Math.log(Math.tan(PI_4 + phi2 * 0.5)))) / (2 * PI);
        return { x: x, y: Math.abs(y - this.options.tileSize) };
    }
    // Unproject world point [x,y] on map onto {lat, lon} on sphere
    worldToLngLat({ x, y }) {
        const lambda2 = (x / this.options.tileSize) * (2 * PI) - PI;
        const phi2 = 2 * (Math.atan(Math.exp((y / this.options.tileSize) * (2 * PI) - PI)) - PI_4);
        return [lambda2 * RADIANS_TO_DEGREES, phi2 * RADIANS_TO_DEGREES];
    }
};
