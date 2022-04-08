import { Canvas, CanvasRenderingContext2D } from "canvas";
import type { DrawStyle, Point } from "./interfaces";
import type { BBox } from "@turf/turf";
import { Feature } from "./feature";
import { MapOptions } from "./interfaces";
import { Marker } from "./marker";
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

export class Tile {
  x: number;
  y: number;
  z: number;
  options: MapOptions;
  canvas: Canvas;
  context: CanvasRenderingContext2D;

  constructor(x: number, y: number, z: number, options: MapOptions) {
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

  get boundingBox(): BBox {
    return [
      this.x * this.options.tileSize,
      this.y * this.options.tileSize,
      (this.x + 1) * this.options.tileSize,
      (this.y + 1) * this.options.tileSize,
    ];
  }

  layerToCanvas(p: Point): Point {
    const x: number = p.x - this.x * this.options.tileSize;
    const y: number = p.y - this.y * this.options.tileSize;
    return { x: x, y: y };
  }

  draw(feat: Feature) {
    feat.draw(this);
  }

  writeImage(file: string) {
    if (!fs.existsSync(path.dirname(file)))
      fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, this.canvas.toBuffer("image/png"));
    // console.log('wrote: ' + file)
  }
}
