import type { DrawStyle, Point } from "./interfaces";
import type { BBox } from "@turf/turf";
import { CanvasRenderingContext2D } from "canvas";
import { LineString, Polygon } from "@turf/turf";
import { Tile } from "./tile";

const { feature } = require("@turf/helpers");
const bboxClip = require("@turf/bbox-clip");
const flatten = require("@turf/flatten");
const { getGeom } = require("@turf/invariant");
const { geomMap } = require("../coordMap");

export class Feature {
  geometry;
  worldGeom!: any;
  layerGeom!: any;
  layerBbox!: BBox;
  styles!: DrawStyle;

  constructor(geometry, styles?: DrawStyle) {
    this.geometry = geometry;
    if (styles !== undefined) this.styles = styles;
  }

  static fromGeoJson(geoJson, styles?: DrawStyle) {
    const geometry = geoJson.type == "Feature" ? geoJson.geometry : geoJson;
    return new this(geometry, styles);
  }

  calcWorldGeom(callback) {
    this.worldGeom = geomMap(this.geometry, callback);
    return this;
  }

  scaleTo(zoomLevel: number) {
    const scalar: number = 2 ** zoomLevel;

    let maxX: number | undefined = undefined,
      minX: number | undefined = undefined,
      maxY: number | undefined = undefined,
      minY: number | undefined = undefined;

    const callback = (p) => {
      const point: Point = { x: p.x * scalar, y: p.y * scalar };
      if (maxX === undefined || point.x > maxX) maxX = point.x;
      if (minX === undefined || point.x < minX) minX = point.x;
      if (maxY === undefined || point.y > maxY) maxY = point.y;
      if (minY === undefined || point.y < minY) minY = point.y;
      point[0] = point.x;
      point[1] = point.y;
      return point;
    };
    this.layerGeom = geomMap(this.worldGeom, callback);
    this.layerBbox = [minX ?? 0, minY ?? 0, maxX ?? 0, maxY ?? 0];
    return this;
  }

  clip(box: BBox) {
    return bboxClip(feature(this.layerGeom), box);
  }

  inBox(box: BBox): boolean {
    // no horizontal overlap
    if (this.layerBbox[0] >= box[2] || box[0] >= this.layerBbox[2])
      return false;

    // no vertical overlap
    return !(this.layerBbox[1] >= box[3] || box[1] >= this.layerBbox[3]);
  }

  draw(tile: Tile) {
    this.setStyles(tile.context);
    this.makeGeom(tile);
  }

  setStyles(context: CanvasRenderingContext2D) {
    context.restore();
    for (const [key, val] of Object.entries(this.styles)) {
      context[key] = val;
    }
  }

  makeGeom(tile: Tile) {
    if (!this.inBox(tile.boundingBox)) return;
    const canvasGeom = geomMap(this.layerGeom, tile.layerToCanvas.bind(tile));
    const geometries = flatten(canvasGeom).features.map((f) => getGeom(f));

    for (let geometry of geometries) {
      tile.context.beginPath();
      if (geometry.type == "LineString") {
        this.makePath(tile, geometry.coordinates);
      } else if (geometry.type == "Polygon") {
        for (let ring of geometry.coordinates) {
          this.makePath(tile, ring);
          tile.context.closePath();
        }
      }
      this.drawPath(tile);
    }
  }

  makePath(tile: Tile, pathData: Point[]) {
    for (const i in pathData) {
      tile.context[i === "0" ? "moveTo" : "lineTo"](
        pathData[i].x,
        pathData[i].y
      );
    }
  }

  drawPath(tile: Tile) {
    if (this.styles.fillStyle) tile.context.fill();
    if (this.styles.strokeStyle) tile.context.stroke();
  }
}
