import {Feature} from "./feature";
import {Tile} from "./tile";

export class Marker extends Feature {

    makeGeom(tile: Tile) {
        const point = tile.layerToCanvas(this.layerGeom.coordinates);

        tile.context.beginPath();
        tile.context.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        tile.context.stroke();
        tile.context.beginPath();
        tile.context.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        tile.context.fill();
    }
}