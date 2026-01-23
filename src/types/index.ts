import type { SkImage, ImageFormat } from '@shopify/react-native-skia';
import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

export type Point = [number, number, number?]; // [x, y, pressure?]

export interface StrokeOptions {
  size?: number;
  thinning?: number;
  smoothing?: number;
  streamline?: number;
  easing?: (t: number) => number;
  start?: {
    taper?: number;
    cap?: boolean;
  };
  end?: {
    taper?: number;
    cap?: boolean;
  };
}

export interface PathData {
  id: string;
  points: Point[];
  svgPath: string;
  color: string;
  width: number;
  opacity?: number;
  blendMode?: string;
  completed: boolean;
}

export interface DrawingState {
  paths: PathData[];
  currentPath: PathData | null;
  isDrawing: boolean;
  strokeColor: string;
  strokeWidth: number;
  strokeOpacity: number;
}

export interface PerfectCanvasRef {
  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  clear: () => void;
  reset: () => void;
  resetZoom: () => void;
  setZoom: (zoom: number, animated?: boolean, anchor?: { x: number, y: number }) => void;
  setTranslation: (x: number, y: number, zoom?: number, animated?: boolean) => void;
  getSnapshot: () => Promise<SkImage | undefined>;
  toBase64: (format?: ImageFormat, quality?: number) => Promise<string | undefined>;
  toSvg: (width?: number, height?: number, backgroundColor?: string) => string;
  getPaths: () => PathData[];
  setPaths: (paths: PathData[]) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setStrokeOpacity: (opacity: number) => void;
  setBackgroundColor: (color: string) => void;
  setEnableHaptics: (enabled: boolean) => void;
  setHapticStyle: (style: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid') => void;
  getDrawingState: () => DrawingState;
  isDrawing: () => boolean;
}

export interface PerfectCanvasProps {
  style?: ViewStyle;
  backgroundColor?: string;
  strokeColor?: string | SharedValue<string>;
  strokeWidth?: number | SharedValue<number>;
  strokeOpacity?: number | SharedValue<number>;
  strokeOptions?: StrokeOptions;
  enableHaptics?: boolean;
  hapticStyle?: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';
  enableZoom?: boolean;
  zoomRange?: [number, number];
  enableRotation?: boolean;
  maxHistorySize?: number;
  debounceDelay?: number;
  simplifyPaths?: boolean;
  simplifyTolerance?: number;
  renderMode?: 'continuous' | 'onDemand';
  onDrawStart?: (point?: Point) => void;
  onDrawUpdate?: (point: Point) => void;
  onDrawEnd?: (path: PathData) => void;
  onPathComplete?: (path: PathData) => void;
  onStateChange?: (state: DrawingState) => void;
  onZoomChange?: (scale: number) => void;
  onTranslateChange?: (x: number, y: number) => void;
  onRotationChange?: (rotation: number) => void;
  children?: React.ReactNode;
  debug?: boolean;
}