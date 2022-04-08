"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Marker = void 0;
const feature_1 = require("./feature");
class Marker extends feature_1.Feature {
    makeGeom(tile) {
        const point = tile.layerToCanvas(this.layerGeom.coordinates);
        tile.context.beginPath();
        tile.context.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        tile.context.stroke();
        tile.context.beginPath();
        tile.context.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        tile.context.fill();
    }
}
exports.Marker = Marker;
