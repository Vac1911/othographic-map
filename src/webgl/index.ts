import * as d3 from "d3";
import * as topojson from "topojson-client";

// https://bl.ocks.org/HarryStevens/3d3cd2b46417d7d11aa7b57cf1c0eb76

const vertexShaderCode = `
  attribute vec2 a_position;
  varying vec2 pos;

  void main(void) {
    gl_Position = vec4(a_position, 0.0, 1.0);
    pos = a_position;
  }
`;
const fragmentShaderCode = `
  precision mediump float;

  uniform sampler2D u_image;
  uniform vec2 u_translate;  /*  width/2, height/2 */
  uniform float u_scale;  /* in pixels ! */
  uniform vec3 u_rotate;  /* rotation in degrees ! */

  const float c_pi = 3.14159265358979323846264;
  const float c_halfPi = c_pi * 0.5;
  const float c_twoPi = c_pi * 2.0;

  void applyRotation(in float rotatex, in float rotatey, in float rotatez,
                      inout float lambda, inout float phi) {
    float x, y, rho, c, cosphi, z, deltaLambda, deltaPhi, deltaGamma, cosDeltaPhi,
        sinDeltaPhi, cosDeltaGamma, sinDeltaGamma, k, circle, proj, a, b;

    cosphi = cos(phi);
    x = cos(lambda) * cosphi;
    y = sin(lambda) * cosphi;
    z = sin(phi);

    // inverse rotation
    deltaLambda = rotatex / 90.0 * c_halfPi; // rotate[0]
    deltaPhi = -rotatey / 90.0 * c_halfPi;   // rotate[1]
    deltaGamma = -rotatez / 90.0 * c_halfPi; // rotate[2]

    cosDeltaPhi = cos(deltaPhi);
    sinDeltaPhi = sin(deltaPhi);
    cosDeltaGamma = cos(deltaGamma);
    sinDeltaGamma = sin(deltaGamma);

    k = z * cosDeltaGamma - y * sinDeltaGamma;

    lambda = atan(y * cosDeltaGamma + z * sinDeltaGamma,
                  x * cosDeltaPhi + k * sinDeltaPhi) -
              deltaLambda;
    k = k * cosDeltaPhi - x * sinDeltaPhi;
    if (k > 0.99999)
      k = 0.99999; // south pole (for some reason it goes > 1 near the pole??)
    if (k < -0.99999)
      k = -0.99999; // north pole
    phi = asin(k);
  }

  void main(void) {
    float x = (gl_FragCoord.x - u_translate.x) / u_scale;
    float y = (u_translate.y - gl_FragCoord.y) / u_scale;

    // Inverse orthographic projection
    float rho = sqrt(x * x + y * y);

    // Color the point (px, py) only if it exists in the texture
    if (rho < 1.0) {
      float c = asin(rho);
      float sinc = sin(c);
      float cosc = cos(c);
      float lambda = atan(x * sinc, rho * cosc);
      float phi = asin(y * sinc / rho);

      // Apply the three-axis rotation
      applyRotation(u_rotate.x, u_rotate.y, u_rotate.z, lambda, phi);

      // pixels
      float px = fract((lambda + c_pi) / c_twoPi);
      float py = fract((phi + c_halfPi) / c_pi);
      
      gl_FragColor = texture2D(u_image, vec2(px, py));
      
      float intensity = 1.1; // boost the pixel by some factor
      gl_FragColor[0] = intensity * gl_FragColor[0] * (1.3 - 0.3 * sqrt(gl_FragColor[0]));
      gl_FragColor[1] = intensity * gl_FragColor[1];
      gl_FragColor[2] = intensity * gl_FragColor[2];
    }
  }
`;

// Select the canvas from the document.
var canvas = <HTMLCanvasElement>document.getElementById("globe");

// Create the WebGL context, with fallback for experimental support.
var context = <WebGLRenderingContext>canvas.getContext("webgl");

// Compile the vertex shader.
var vertexShader = <WebGLShader>context.createShader(context.VERTEX_SHADER);
context.shaderSource(vertexShader, vertexShaderCode);
context.compileShader(vertexShader);
if (!context.getShaderParameter(vertexShader, context.COMPILE_STATUS))
  throw new Error(context.getShaderInfoLog(vertexShader) ?? "Unknown Error");

// Compile the fragment shader.
var fragmentShader = <WebGLShader>context.createShader(context.FRAGMENT_SHADER);
context.shaderSource(fragmentShader, fragmentShaderCode);
context.compileShader(fragmentShader);
if (!context.getShaderParameter(fragmentShader, context.COMPILE_STATUS))
  throw new Error(context.getShaderInfoLog(fragmentShader) ?? "Unknown Error");

// Link and use the program.
var program = <WebGLProgram>context.createProgram();
context.attachShader(program, vertexShader);
context.attachShader(program, fragmentShader);
context.linkProgram(program);
if (!context.getProgramParameter(program, context.LINK_STATUS))
  throw new Error(context.getProgramInfoLog(program) ?? "Unknown Error");
context.useProgram(program);

// Define the positions (as vec2) of the square that covers the canvas.
var positionBuffer = context.createBuffer();
context.bindBuffer(context.ARRAY_BUFFER, positionBuffer);
context.bufferData(
  context.ARRAY_BUFFER,
  new Float32Array([-1.0, -1.0, +1.0, -1.0, +1.0, +1.0, -1.0, +1.0]),
  context.STATIC_DRAW
);

// Bind the position buffer to the position attribute.
var positionAttribute = context.getAttribLocation(program, "a_position");
context.enableVertexAttribArray(positionAttribute);
context.vertexAttribPointer(positionAttribute, 2, context.FLOAT, false, 0, 0);

// Extract the projection parameters.
var translateUniform = context.getUniformLocation(program, "u_translate"),
  scaleUniform = context.getUniformLocation(program, "u_scale"),
  rotateUniform = context.getUniformLocation(program, "u_rotate");

// Load the reference image.
var image = new Image();
image.src = "raster.jpg";
image.onload = readySoon;

// SVG map declarations
var svg = d3.select("body").append("svg");
var projection = d3.geoOrthographic();
var path = d3.geoPath(projection);

// Hack to ensure correct inference of window dimensions.
async function readySoon() {
  const map = await (
    await fetch(
      "https://gist.githubusercontent.com/HarryStevens/3d3cd2b46417d7d11aa7b57cf1c0eb76/raw/b670a5213cb9987d9e3267764be1ab0b2bfeb129/world.json"
    )
  ).json();
  var feature = topojson.feature(map, map.objects.countries),
    mesh = topojson.feature(map, map.objects.land);

  setTimeout(() => {
    resize(feature);
    ready(feature, mesh);
  }, 10);

  self.onresize = () => resize(feature);
}

function resize(feature) {
  var w = self.innerWidth,
    h = self.innerHeight;
  var width = Math.min(w, h),
    height = width;

  // The canvas is absolutely positioned in order to overlay it with the SVG.
  // To get it to center, do some math.
  d3.select(canvas).style("left", (w - width) / 2 + "px");

  canvas.setAttribute("width", width.toString());
  canvas.setAttribute("height", height.toString());
  context.uniform2f(translateUniform, width / 2, height / 2);
  context.uniform1f(scaleUniform, height / 2);
  context.viewport(0, 0, width, height);

  // Basic D3 + TopoJSON map
  svg.attr("width", w).attr("height", h);
  projection.fitSize([w, height], feature);
}

function ready(feature, mesh) {
  // Create a texture and a mipmap for accurate minification.
  var texture = context.createTexture();
  context.bindTexture(context.TEXTURE_2D, texture);
  context.texParameteri(
    context.TEXTURE_2D,
    context.TEXTURE_MAG_FILTER,
    context.LINEAR
  );
  context.texParameteri(
    context.TEXTURE_2D,
    context.TEXTURE_MIN_FILTER,
    context.LINEAR_MIPMAP_LINEAR
  );
  context.texImage2D(
    context.TEXTURE_2D,
    0,
    context.RGBA,
    context.RGBA,
    context.UNSIGNED_BYTE,
    image
  );
  context.texParameteri(
    context.TEXTURE_2D,
    context.TEXTURE_WRAP_S,
    context.CLAMP_TO_EDGE
  );
  context.texParameteri(
    context.TEXTURE_2D,
    context.TEXTURE_WRAP_T,
    context.CLAMP_TO_EDGE
  );
  context.texParameteri(
    context.TEXTURE_2D,
    context.TEXTURE_MIN_FILTER,
    context.LINEAR
  ); // or NEAREST

  // The current rotation and speed.
  var rotate: [number, number, number] = [0, 0, 0],
    speed = 0.5;

  redraw();

  // Rotate and redraw!
  function redraw() {
    rotate = [rotate[0] + speed, rotate[1] + speed, rotate[2] + speed];
    context.uniform3fv(rotateUniform, rotate); // Three-axis rotation
    context.bindTexture(context.TEXTURE_2D, texture); // XXX Safari
    context.drawArrays(context.TRIANGLE_FAN, 0, 4);
    requestAnimationFrame(redraw);

    projection.rotate(rotate);

    // var countries = svg.selectAll(".country").data(feature.features);

    // countries
    //   .enter()
    //   .append("path")
    //   .attr("class", "country")
    //   // @ts-ignore
    //   .merge(countries)
    //   .attr("d", path);

    // var boundaries = svg.selectAll(".boundary").data([mesh]);

    // boundaries
    //   .enter()
    //   .append("path")
    //   .attr("class", "boundary")
    //   // @ts-ignore
    //   .merge(boundaries)
    //   .attr("d", path);
  }
}
