// prettier-ignore
export default function(opt: {
  nlat?: number; // The number of vertices for latitude. Default = 10.
  nlong ?: number; // The number of vertices for longitude. Default = 10.
  radius  ?: number; // The radius of the sphere. Default = 1.
} = {}) {
  const nlat = opt.nlat || 10,
    nlong = opt.nlong || 10,
    radius = opt.radius || 1,
    startLat = 0,
    endLat = Math.PI,
    latRange = endLat - startLat,
    startLong = 0,
    endLong = 2 * Math.PI,
    longRange = endLong - startLong,
    numVertices = (nlat + 1) * (nlong + 1),
    vertices = new Float32Array(numVertices * 3),
    normals = new Float32Array(numVertices * 3),
    texCoords = new Float32Array(numVertices * 2),
    indices = new Uint16Array(nlat * nlong * 6);
  
  // Create vertices, normals and texCoords
  for (var y = 0; y <= nlat; y++) {
    for (var x = 0; x <= nlong; x++) {
      var u = x / nlong,
      v = y / nlat,
      theta = longRange * u,
      phi = latRange * v,
      sinTheta = Math.sin(theta),
      cosTheta = Math.cos(theta),
      sinPhi = Math.sin(phi),
      cosPhi = Math.cos(phi),
      ux = cosTheta * sinPhi,
      uy = cosPhi,
      uz = sinTheta * sinPhi,
      r = radius,
      index = x + y * (nlong + 1),
      i3 = index * 3,
      i2 = index * 2;
      
      vertices[i3 + 0] = r * ux;
      vertices[i3 + 1] = r * uy;
      vertices[i3 + 2] = r * uz;
      
      normals[i3 + 0] = ux;
      normals[i3 + 1] = uy;
      normals[i3 + 2] = uz;
      
      texCoords[i2 + 0] = u;
      texCoords[i2 + 1] = v;
    }
  }
  
  //Create indices
  var numVertsAround = nlat + 1;
  for (x = 0; x < nlat; x++) {
    for (y = 0; y < nlong; y++) {
      var index = (x * nlong + y) * 6;
      
      indices[index + 0] = y * numVertsAround + x;
      indices[index + 1] = y * numVertsAround + x + 1;
      indices[index + 2] = (y + 1) * numVertsAround + x;
      
      indices[index + 3] = (y + 1) * numVertsAround + x;
      indices[index + 4] = y * numVertsAround + x + 1;
      indices[index + 5] = (y + 1) * numVertsAround + x + 1;
    }
  }

  return {
    vertices: vertices,
    indices: indices,
    normals: normals,
    texCoords: texCoords
  };
}
