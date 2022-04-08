export interface DrawStyle {
    name?: string;
    strokeStyle?: string | CanvasGradient | CanvasPattern;
    fillStyle?: string | CanvasGradient | CanvasPattern;
    globalAlpha?: number;
    lineWidth?: number;
    lineCap?: CanvasLineCap;
    lineJoin?: CanvasLineJoin;
    miterLimit?: number;
    lineDashOffset?: number;
    shadowBlur?: number;
    shadowColor?: string;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    globalCompositeOperation?: string;
    font?: string;
    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
    direction?: CanvasDirection;
    imageSmoothingEnabled?: boolean;
}

export interface MapOptions {
    tileSize: number;
    bgColor: string;
    antialias?: 'default' | 'gray' | 'none' | 'subpixel';
}

export interface Point {
    x: number;
    y: number;
}

export interface BBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}