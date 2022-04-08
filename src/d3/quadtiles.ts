import tiletolnglat from "./tiletolnglat";
import subdivideline from "./subdivideline";

export default function (projection, options) {
  if (options == null) {
    options = {};
  }
  if (options.maxtiles == null) {
    options.maxtiles = 16;
  }
  if (options.maxzoom == null) {
    options.maxzoom = 18;
  }
  if (options.divisions == null) {
    options.divisions = 10;
  }

  const precision = projection.precision();
  const extent = projection.clipExtent();
  let visible = false;

  const stream = projection.precision(960).stream({
    point: function () {
      return (visible = true);
    },
    lineStart: function () {},
    lineEnd: function () {},
    polygonStart: function () {},
    polygonEnd: function () {},
  });

  const square = (x, y) => {
    return [
      [x, y],
      [x + 1, y],
      [x + 1, y + 1],
      [x, y + 1],
    ];
  };

  const projectTile = (x, y, z) => {
    var calc, coords, p;
    p = square(x, y);
    coords = [];
    calc = function (i) {
      return coords.push(tiletolnglat(i[0], i[1], z));
    };
    subdivideline(p[0], p[1], options.divisions, calc);
    subdivideline(p[1], p[2], options.divisions, calc);
    subdivideline(p[2], p[3], options.divisions, calc);
    subdivideline(p[3], p[0], options.divisions, calc);
    return coords;
  };

  const isvisible = function (x, y, z) {
    var check, p;
    p = square(x, y);
    visible = false;
    stream.polygonStart();
    stream.lineStart();
    check = function (i) {
      var o;
      o = tiletolnglat(i[0], i[1], z);
      return stream.point(o[0], o[1]);
    };
    subdivideline(p[0], p[1], options.divisions, check);
    subdivideline(p[1], p[2], options.divisions, check);
    subdivideline(p[2], p[3], options.divisions, check);
    subdivideline(p[3], p[0], options.divisions, check);
    stream.lineEnd();
    stream.polygonEnd();
    return visible;
  };

  let fin = false;
  let currentTiles: any[] = [[0, 0]];
  let allTiles: any[] = [];
  allTiles.push(currentTiles);
  let zoom = 0;

  const dive = function () {
    var gen1, gen2, j, k, len, len1, nextTiles, ref;
    nextTiles = [];
    for (j = 0, len = currentTiles.length; j < len; j++) {
      gen1 = currentTiles[j];
      ref = square(gen1[0] * 2, gen1[1] * 2);
      for (k = 0, len1 = ref.length; k < len1; k++) {
        gen2 = ref[k];
        if (!isvisible(gen2[0], gen2[1], zoom + 1)) {
          continue;
        }
        nextTiles.push(gen2);
      }
    }
    if (nextTiles.length > options.maxtiles) {
      fin = true;
      return;
    }
    currentTiles = nextTiles;
    allTiles.push(nextTiles);
    return zoom++;
  };

  while (!fin && zoom <= options.maxzoom) {
    dive();
  }

  allTiles = allTiles.map(function (tiles, z) {
    return tiles.map(function (tile) {
      return {
        type: "Polygon",
        key: [tile[0], tile[1], z],
        coordinates: [projectTile(tile[0], tile[1], z)],
        centroid: tiletolnglat(tile[0] + 0.5, tile[1] + 0.5, z),
      };
    });
  });

  projection.precision(precision);
  projection.clipExtent(extent);

  return {
    zoom: zoom,
    tiles: allTiles[zoom],
    all: allTiles,
  };
}
