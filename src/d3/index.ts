import * as d3 from 'd3';
import * as geo from 'd3-geo';
import quadtiles from './quadtiles';
import versor from 'versor';
import zoom, { GeoProjection } from './zoom';
import * as topojson from 'topojson-client';

if (document.getElementById('globe')) draw();

async function draw() {
  const canvas = <HTMLCanvasElement>document.getElementById('globe');
  const width = (canvas.width = 960);
  const height = (canvas.height = 600);
  const context = <CanvasRenderingContext2D>canvas.getContext('2d');
  const world = await (await fetch('/land110.json')).json();
  const tileStorage: ImageData[][][] = [];

  context.save();

  const p = 100;
  const viewRect: [[number, number], [number, number]] = [
    [0, 0],
    [width, height],
  ];
  const clipRect: [[number, number], [number, number]] = [
    [p, p],
    [width - p, height - p],
  ];

  const projection = geo
    // .geoMercator()
    .geoOrthographic()
    .clipAngle(90)
    .precision(0.1)
    .scale(150)
    .clipExtent(viewRect);

  const path = geo.geoPath(projection, context);

  function getQuad() {
    projection.clipExtent(clipRect);
    const quad = quadtiles(projection, { maxzoom: 8 });
    projection.clipExtent(viewRect);

    return quad;
  }

  async function render(projection: d3.GeoProjection) {
    context.restore();

    context.clearRect(0, 0, width, height);

    context.beginPath();
    path({ type: 'Sphere' });
    context.fillStyle = '#dee2e6';
    context.fill();
    context.closePath();

    context.beginPath();
    path(world);
    context.fillStyle = '#adb5bd';
    context.fill();
    context.closePath();

    context.beginPath();
    context.strokeStyle = '#000';
    context.strokeRect(...clipRect[0], clipRect[1][0] - clipRect[0][0], clipRect[1][1] - clipRect[0][1]);
    context.closePath();

    const quad = getQuad();
    for (let tile of quad.tiles) {
      context.restore();

      context.beginPath();
      path(tile);
      context.strokeStyle = 'blue';
      context.stroke();
      context.closePath();

      const pos = projection(tile.centroid);
      if (pos) {
        context.fillStyle = '#000';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(tile.key.join(','), pos[0], pos[1]);
      }
    }

    const fillStart: [number, number] = [width / 2, height / 2];
    const fillData = context.getImageData(...fillStart, 60, 60);

    for (var i = 0; i < fillData.data.length; i += 4) {
      const x = fillStart[0] + ((i / 4) % fillData.width);
      const y = fillStart[1] + Math.floor(i / 4 / fillData.height);
      // @ts-ignore
      const lnglat: [number, number] = projection.invert([x, y]);
      const pixel = await getPixel(lnglat[1], lnglat[0], quad.zoom);
      fillData.data[i] = pixel[0]; // red
      fillData.data[i + 1] = pixel[1]; // green
      fillData.data[i + 2] = pixel[2]; // blue
    }

    context.putImageData(fillData, ...fillStart);
    // getPixel(0, 0, quad.zoom);
  }

  async function getPixel(lat: number, lng: number, zoom: number) {
    const toRad = (deg) => (deg * Math.PI) / 180.0;

    var tileX = Math.floor(((lng + 180) / 360) * (1 << zoom));

    // pretier-ignore
    var tileY = Math.floor(((1 - Math.log(Math.tan(toRad(lat)) + 1 / Math.cos(toRad(lat))) / Math.PI) / 2) * (1 << zoom));
    //const tile = await getTile(tileX, tileY, zoom);
    const tile = await getTile(0, 0, 0);

    // const res = 180.0 / tile.width / 2 ** zoom;
    // const px = Math.floor((180 + lat) / res) % tile.width;
    // const py = Math.floor((90 + lng) / res) % tile.width;

    const [px, py] = coordToWorld([lng, lat], zoom);

    const offset = Math.round(px) * 4 + Math.round(py) * 4 * tile.height;
    console.log([Math.round(px), Math.round(py)]);
    return tile.data.slice(offset, offset + 4);
  }

  async function getTile(x, y, z) {
    if (!tileStorage[x]?.[y]?.[z]) {
      const tile = new Image();
      tile.src = `/tilemap/${z}/${x}/${y}.png`;
      await tile.decode();

      const canvas = document.createElement('canvas');
      canvas.width = tile.width;
      canvas.height = tile.height;
      const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
      ctx.drawImage(tile, 0, 0);
      document.body.append(canvas);
      tileStorage[x] ??= [];
      tileStorage[x][y] ??= [];
      tileStorage[x][y][z] = ctx.getImageData(0, 0, tile.width, tile.height);
    }

    return tileStorage[x][y][z];
  }

  d3.select(context.canvas)
    // .call(zoom)
    .call(zoom(<GeoProjection>projection).on('zoom.render', () => render(projection)))
    // .call(drag(projection).on("drag.render", () => render()))
    // .call(drag2D(projection).on("drag.render", () => render()))
    .call(() => render(projection));
}

// CONSTANTS
const PI: number = Math.PI;
const PI_4: number = PI / 4;
const DEGREES_TO_RADIANS: number = PI / 180;
const RADIANS_TO_DEGREES: number = 180 / PI;
const TILE_SIZE: number = 512;

function coordToWorld([lng, lat]: number[], zoom = 0) {
  const resolution = TILE_SIZE * 2 ** zoom;
  const lambda2 = lng * DEGREES_TO_RADIANS;
  const phi2 = lat * DEGREES_TO_RADIANS;
  const x = (resolution * (lambda2 + PI)) / (2 * PI);
  const y = (resolution * (PI + Math.log(Math.tan(PI_4 + phi2 * 0.5)))) / (2 * PI);
  return [x, Math.abs(y - resolution)];
}

function coordToPixel([lng, lat]: number[], zoom = 0) {
  const [tileX, tileY] = coordToTileIndex([lng, lat], zoom);
  const [worldX, worldY] = coordToWorld([lng, lat], zoom);
  const offsetX = (1 + tileX) * TILE_SIZE;
  const offsetY = (1 + tileY) * TILE_SIZE;
  return [worldX - offsetX, worldY - offsetY];
}

function coordToTileIndex([lng, lat]: number[], zoom) {
  var tileX = Math.floor(((lng + 180) / 360) * (1 << zoom));
  var tileY = Math.floor(((1 - Math.log(Math.tan(lat * DEGREES_TO_RADIANS) + 1 / Math.cos(lat * DEGREES_TO_RADIANS)) / Math.PI) / 2) * (1 << zoom));
  return [tileX, tileY];
}
