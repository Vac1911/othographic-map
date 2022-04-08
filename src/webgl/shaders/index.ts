import fragmentShader from "./fragment-shader";
import vertexShader from "./vertex-shader";

export interface ShaderProgram {
  program: WebGLProgram;
  attribLocations: {
    vertexPosition: number;
    vertexColor: number;
  };
  uniformLocations: {
    projectionMatrix: WebGLUniformLocation | null;
    modelViewMatrix: WebGLUniformLocation | null;
  };
}

export function loadShader(
  gl: WebGLRenderingContext,
  type: GLenum,
  source: string
): WebGLShader | false {
  const shader = gl.createShader(type);
  if (!shader) return false;

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      "An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return false;
  }

  return shader;
}

export function initCustomShaderProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
): ShaderProgram | false {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  if (!(vertexShader && fragmentShader)) return false;

  // Create the shader program
  const shaderProgram = gl.createProgram();
  if (!shaderProgram) return false;

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error(
      "Unable to initialize the shader program: " +
        gl.getProgramInfoLog(shaderProgram)
    );
    return false;
  }

  return {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
    },
  };
}

export function initShaderProgram(
  gl: WebGLRenderingContext
): ShaderProgram | false {
  return initCustomShaderProgram(gl, vertexShader, fragmentShader);
}
