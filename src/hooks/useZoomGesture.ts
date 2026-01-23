import { useCallback } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ZoomGestureConfig {
  enabled?: boolean;
  minScale?: number;
  maxScale?: number;
  onScaleChange?: (scale: number) => void;
  onTranslateChange?: (x: number, y: number) => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

export function useZoomGesture(config: ZoomGestureConfig = {}) {
  const {
    enabled = true,
    minScale = 0.1,
    maxScale = 3,
    onScaleChange,
    onTranslateChange,
    canvasWidth = screenWidth,
    canvasHeight = screenHeight,
  } = config;
  
  // Throttle flags to prevent too many JS callbacks
  const lastCallbackTime = useSharedValue(0);
  const callbackThrottle = 16; // ~60fps max

  // Main state - this is the source of truth
  const scale = useSharedValue(1);
  const translation = useSharedValue({ x: 0, y: 0 });
  
  // Values saved at gesture start
  const savedScale = useSharedValue(1);
  const savedTranslation = useSharedValue({ x: 0, y: 0 });
  
  // Pinch specific
  const pinchFocal = useSharedValue({ x: 0, y: 0 });
  const pinchAnchor = useSharedValue({ x: 0, y: 0 });
  const lastValidFocal = useSharedValue({ x: 0, y: 0 });
  const lastScale = useSharedValue(1);
  const jumpDetectedTime = useSharedValue(0);
  const consecutiveJumps = useSharedValue(0);
  
  // Flags
  const isPinching = useSharedValue(false);
  const isPanning = useSharedValue(false);

  // Pinch gesture handles zoom and pan simultaneously
  const pinchGesture = Gesture.Pinch()
    .enabled(enabled)
    .onStart((e) => {
      'worklet';
      
      // Debug logging removed - was causing UI thread blocking
      
      savedScale.value = scale.value;
      savedTranslation.value = { ...translation.value };
      pinchFocal.value = { x: e.focalX, y: e.focalY };
      lastValidFocal.value = { x: e.focalX, y: e.focalY };
      lastScale.value = 1;
      jumpDetectedTime.value = 0;
      consecutiveJumps.value = 0;
      
      // Calculate the world point under the focal point
      pinchAnchor.value = {
        x: (e.focalX - translation.value.x) / scale.value,
        y: (e.focalY - translation.value.y) / scale.value
      };
      
      isPinching.value = true;
    })
    .onUpdate((e) => {
      'worklet';
      
      // Calculate new scale
      const newScale = Math.min(
        Math.max(savedScale.value * e.scale, minScale),
        maxScale
      );
      
      // The focal point may have moved (pan during pinch)
      let focalX = e.focalX;
      let focalY = e.focalY;
      
      // Detect focal point jump (happens when lifting a finger)
      const focalJumpThreshold = 40; // pixels - reduced for better detection
      const deltaX = Math.abs(focalX - lastValidFocal.value.x);
      const deltaY = Math.abs(focalY - lastValidFocal.value.y);
      const focalJumped = (deltaX > focalJumpThreshold || deltaY > focalJumpThreshold);
      
      // Check if scale stayed nearly the same (indicates finger lift, not intentional zoom)
      const scaleStable = Math.abs(e.scale - lastScale.value) < 0.01;
      
      // Special check for when we're at min/max scale limits
      const atScaleLimit = (newScale === minScale && scale.value === minScale) || 
                          (newScale === maxScale && scale.value === maxScale);
      
      const now = Date.now();
      
      if (focalJumped && (scaleStable || atScaleLimit)) {
        // Focal jump detected - ignoring
        consecutiveJumps.value++;
        jumpDetectedTime.value = now;
        // Use the last valid focal point instead
        focalX = lastValidFocal.value.x;
        focalY = lastValidFocal.value.y;
      } else if (consecutiveJumps.value > 0 && (now - jumpDetectedTime.value) < 200) {
        // If we recently detected jumps, be more conservative about accepting new focal points
        const smallDelta = deltaX < 20 && deltaY < 20;
        if (!smallDelta) {
          // Still recovering from jump - ignoring focal change
          focalX = lastValidFocal.value.x;
          focalY = lastValidFocal.value.y;
        } else {
          // Small movement after jump - probably safe
          lastValidFocal.value = { x: focalX, y: focalY };
          consecutiveJumps.value = 0;
        }
      } else {
        // Normal update - no jump detected
        lastValidFocal.value = { x: focalX, y: focalY };
        consecutiveJumps.value = 0;
      }
      
      lastScale.value = e.scale;
      
      // Update scale and focal point
      
      // Keep the anchor point at the focal point
      translation.value = {
        x: focalX - pinchAnchor.value.x * newScale,
        y: focalY - pinchAnchor.value.y * newScale
      };
      
      scale.value = newScale;
      
      // Throttle callbacks to prevent performance issues
      if (now - lastCallbackTime.value > callbackThrottle) {
        lastCallbackTime.value = now;
        if (onScaleChange) {
          runOnJS(onScaleChange)(newScale);
        }
        if (onTranslateChange) {
          runOnJS(onTranslateChange)(translation.value.x, translation.value.y);
        }
      }
    })
    .onEnd(() => {
      'worklet';
      // Pinch ended
      isPinching.value = false;
      
      // Final callback to sync state
      if (onScaleChange) {
        runOnJS(onScaleChange)(scale.value);
      }
      if (onTranslateChange) {
        runOnJS(onTranslateChange)(translation.value.x, translation.value.y);
      }
    });

  // Pan gesture for pure panning (no zoom)
  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .minPointers(2)
    .maxPointers(2)
    .averageTouches(true)
    .onStart(() => {
      'worklet';
      // Pan started
      savedTranslation.value = { ...translation.value };
      isPanning.value = true;
    })
    .onUpdate((e) => {
      'worklet';
      
      // Don't update translation if pinch is active - let pinch handle it
      if (isPinching.value) {
        // Update skipped - pinch active
        return;
      }
      
      // Update translation
      
      // Simple pan - just add the translation
      translation.value = {
        x: savedTranslation.value.x + e.translationX,
        y: savedTranslation.value.y + e.translationY
      };
      
      // Throttle callback
      const nowPan = Date.now();
      if (onTranslateChange && nowPan - lastCallbackTime.value > callbackThrottle) {
        lastCallbackTime.value = nowPan;
        runOnJS(onTranslateChange)(translation.value.x, translation.value.y);
      }
    })
    .onEnd(() => {
      'worklet';
      // Pan ended
      isPanning.value = false;
      
      // Final callback to sync state
      if (onTranslateChange) {
        runOnJS(onTranslateChange)(translation.value.x, translation.value.y);
      }
    });

  // Use Simultaneous
  const combinedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const reset = useCallback((duration: number = 300) => {
    'worklet';
    scale.value = withTiming(1, { duration });
    translation.value = withTiming({ x: 0, y: 0 }, { duration });
    isPinching.value = false;
    isPanning.value = false;
  }, []);

  const setTranslation = useCallback((x: number, y: number, newScale?: number, animated: boolean = true) => {
    'worklet';
    if (newScale) {
      scale.value = animated ? withTiming(newScale, { duration: 200 }) : newScale;
    }
    translation.value = animated ? withTiming({ x, y }, { duration: 200 }) : { x, y };
    isPinching.value = false;
    isPanning.value = false;
  }, []);

  const setScale = useCallback((
    newScale: number, 
    animated: boolean = true,
    anchor?: { x: number; y: number }
  ) => {
    'worklet';
    const clampedScale = Math.min(Math.max(newScale, minScale), maxScale);
    
    // Use provided anchor or default to canvas center
    const anchorX = anchor ? anchor.x : canvasWidth / 2;
    const anchorY = anchor ? anchor.y : canvasHeight / 2;
    
    // Calculate what world point is at the anchor
    const worldX = (anchorX - translation.value.x) / scale.value;
    const worldY = (anchorY - translation.value.y) / scale.value;
    
    // Calculate new translation to keep the world point at the anchor
    const newTransX = anchorX - worldX * clampedScale;
    const newTransY = anchorY - worldY * clampedScale;
    
    // Update scale and translation
    if (animated) {
      scale.value = withTiming(clampedScale, { duration: 200 });
      translation.value = withTiming(
        { x: newTransX, y: newTransY }, 
        { duration: 200 }
      );
    } else {
      scale.value = clampedScale;
      translation.value = { x: newTransX, y: newTransY };
    }
    
    if (onScaleChange) {
      runOnJS(onScaleChange)(clampedScale);
    }
    
    if (onTranslateChange) {
      runOnJS(onTranslateChange)(newTransX, newTransY);
    }
  }, [minScale, maxScale, canvasWidth, canvasHeight, onScaleChange, onTranslateChange]);

  return {
    combinedGesture,
    pinchGesture,
    panGesture,
    scale,
    translation,
    reset,
    setScale,
    setTranslation,
    isPinching,
    isPanning,
  };
}