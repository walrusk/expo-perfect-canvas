# Expo Perfect Canvas

A high-performance React Native drawing canvas with perfect-freehand integration, haptic feedback, and modern gesture handling.

## Features

- 🎨 **Perfect Freehand Integration** - Natural, pressure-sensitive strokes
- 📱 **Haptic Feedback** - Enhanced drawing experience with Expo Haptics
- 🚀 **High Performance** - Optimized with React Native Skia and Reanimated
- 🔄 **Undo/Redo** - Full history management
- 🔍 **Zoom & Pan** - Optional multi-touch gestures
- 📐 **Path Simplification** - Automatic optimization for better performance
- 💾 **Export Options** - SVG, Base64, and image snapshots
- 🎯 **TypeScript** - Full type safety

## Installation

```bash
npm install expo-perfect-canvas

# Required peer dependencies
npm install @shopify/react-native-skia react-native-gesture-handler react-native-reanimated expo-haptics perfect-freehand
```

Or with yarn:

```bash
yarn add expo-perfect-canvas

# Required peer dependencies  
yarn add @shopify/react-native-skia react-native-gesture-handler react-native-reanimated expo-haptics perfect-freehand
```

### iOS Setup

```bash
cd ios && pod install
```

## Basic Usage

```jsx
import React, { useRef } from 'react';
import { View, Button } from 'react-native';
import { PerfectCanvas } from 'expo-perfect-canvas';

export default function App() {
  const canvasRef = useRef(null);

  return (
    <View style={{ flex: 1 }}>
      <PerfectCanvas
        ref={canvasRef}
        strokeColor="#000000"
        strokeWidth={8}
        enableHaptics={true}
        hapticStyle="light"
      />
      <Button
        title="Undo"
        onPress={() => canvasRef.current?.undo()}
      />
    </View>
  );
}
```

## Advanced Usage

```jsx
import React, { useRef, useState } from 'react';
import { View, Button } from 'react-native';
import { PerfectCanvas } from 'expo-perfect-canvas';

export default function AdvancedCanvas() {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#000000');
  const [width, setWidth] = useState(8);

  const handleExport = async () => {
    const base64 = await canvasRef.current?.toBase64();
    console.log('Exported:', base64);
  };

  return (
    <View style={{ flex: 1 }}>
      <PerfectCanvas
        ref={canvasRef}
        strokeColor={color}
        strokeWidth={width}
        strokeOpacity={0.9}
        strokeOptions={{
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.5,
        }}
        enableHaptics={true}
        hapticStyle="medium"
        enableZoom={true}
        zoomRange={[0.5, 3]}
        simplifyPaths={true}
        simplifyTolerance={2}
        onDrawEnd={(path) => console.log('Path completed:', path)}
        backgroundColor="#f0f0f0"
      />
      
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <Button title="Undo" onPress={() => canvasRef.current?.undo()} />
        <Button title="Redo" onPress={() => canvasRef.current?.redo()} />
        <Button title="Clear" onPress={() => canvasRef.current?.clear()} />
        <Button title="Export" onPress={handleExport} />
      </View>
    </View>
  );
}
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `strokeColor` | `string` | `'black'` | Stroke color |
| `strokeWidth` | `number` | `8` | Stroke width |
| `strokeOpacity` | `number` | `1` | Stroke opacity (0-1) |
| `strokeOptions` | `StrokeOptions` | `{}` | Perfect-freehand options |
| `enableHaptics` | `boolean` | `true` | Enable haptic feedback |
| `hapticStyle` | `'light' \| 'medium' \| 'heavy'` | `'light'` | Haptic feedback intensity |
| `enableZoom` | `boolean` | `false` | Enable pinch zoom |
| `zoomRange` | `[number, number]` | `[0.5, 3]` | Min and max zoom levels |
| `simplifyPaths` | `boolean` | `true` | Simplify paths for performance |
| `simplifyTolerance` | `number` | `1` | Path simplification tolerance |
| `backgroundColor` | `string` | `'white'` | Canvas background color |
| `onDrawStart` | `() => void` | - | Called when drawing starts |
| `onDrawEnd` | `(path: PathData) => void` | - | Called when drawing ends |

### Methods (via ref)

| Method | Description |
|--------|-------------|
| `undo(steps?: number)` | Undo last action(s) |
| `redo(steps?: number)` | Redo action(s) |
| `clear()` | Clear canvas |
| `reset()` | Reset canvas and history |
| `resetZoom()` | Reset canvas zoom level |
| `setZoom(zoom: number, animated?: boolean, anchor?: { x: number, y: number })` | Set canvas zoom level |
| `setTranslation(x, y, zoom?: number, animated?: boolean)` | Set canvas offset |
| `getSnapshot()` | Get image snapshot |
| `toBase64(format?, quality?)` | Export as base64 |
| `toSvg(width?, height?, bgColor?)` | Export as SVG |
| `getPaths()` | Get all paths |
| `setPaths(paths)` | Set paths |
| `setStrokeColor(color)` | Change stroke color |
| `setStrokeWidth(width)` | Change stroke width |
| `setStrokeOpacity(opacity)` | Change stroke opacity |
| `setBackgroundColor(color)` | Change canvas background color |
| `setEnableHaptics(enabled)` | Enable/disable haptic feedback |
| `setHapticStyle(style)` | Change haptic feedback style |

## Performance Tips

1. **Enable path simplification** for better performance with complex drawings
2. **Adjust simplifyTolerance** based on your needs (higher = fewer points)
3. **Use onDemand render mode** for static drawings
4. **Limit history size** with `maxHistorySize` prop
5. **Disable haptics** if not needed for better performance

## Author

Jan Horak

## License

MIT