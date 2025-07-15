import { useRef, useCallback, useEffect } from 'react';

interface CanvasCache {
  imageData: ImageData | null;
  backgroundImage: string | null;
  staticElements: ImageData | null;
  lastUpdate: number;
}

export const useCanvasOptimized = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
  const cacheRef = useRef<CanvasCache>({
    imageData: null,
    backgroundImage: null,
    staticElements: null,
    lastUpdate: 0
  });
  const animationFrameRef = useRef<number | null>(null);
  const isDrawingRef = useRef(false);

  // Initialize offscreen canvas
  useEffect(() => {
    if (typeof OffscreenCanvas !== 'undefined') {
      offscreenCanvasRef.current = new OffscreenCanvas(384, 576);
    }
  }, []);

  const scheduleCanvasUpdate = useCallback((forceUpdate = false) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const now = performance.now();
      
      // Throttle updates to 60fps max
      if (!forceUpdate && now - cacheRef.current.lastUpdate < 16.67) {
        return;
      }

      if (!isDrawingRef.current) {
        isDrawingRef.current = true;
        cacheRef.current.lastUpdate = now;
        isDrawingRef.current = false;
      }
    });
  }, []);

  const drawWithCache = useCallback((
    drawFunction: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void,
    backgroundImage?: string,
    invalidateCache = false
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { 
      alpha: false, 
      desynchronized: true 
    });
    if (!ctx) return;

    // Check if we can use cached content
    const cache = cacheRef.current;
    const backgroundChanged = cache.backgroundImage !== backgroundImage;
    
    if (invalidateCache || backgroundChanged || !cache.imageData) {
      // Clear cache and redraw
      canvas.width = 384;
      canvas.height = 576;
      
      drawFunction(ctx, canvas);
      
      // Cache the result
      try {
        cache.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        cache.backgroundImage = backgroundImage || null;
      } catch (e) {
        console.warn('Canvas caching failed:', e);
      }
    } else if (cache.imageData) {
      // Use cached content
      ctx.putImageData(cache.imageData, 0, 0);
    }
  }, []);

  const drawOptimized = useCallback((
    labelData: any,
    previewMode: boolean,
    drawTextElements: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void,
    drawWatermark?: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { 
      alpha: false, 
      desynchronized: true 
    });
    if (!ctx) return;

    // Set canvas size
    canvas.width = 384;
    canvas.height = 576;
    
    // Use offscreen canvas for background if available
    if (offscreenCanvasRef.current && labelData.backgroundImage) {
      const offscreenCtx = offscreenCanvasRef.current.getContext('2d');
      if (offscreenCtx) {
        const img = new Image();
        img.onload = () => {
          offscreenCtx.drawImage(img, 0, 0, 384, 576);
          ctx.drawImage(offscreenCanvasRef.current!, 0, 0);
          drawTextElements(ctx, canvas);
          if (previewMode && drawWatermark) drawWatermark(ctx, canvas);
        };
        img.src = labelData.backgroundImage;
        return;
      }
    }

    // Fallback to direct drawing
    if (labelData.backgroundImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawTextElements(ctx, canvas);
        if (previewMode && drawWatermark) drawWatermark(ctx, canvas);
      };
      img.src = labelData.backgroundImage;
    } else {
      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#f5f5f5');
      gradient.addColorStop(1, '#e5e5e5');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      drawTextElements(ctx, canvas);
      if (previewMode && drawWatermark) drawWatermark(ctx, canvas);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isDrawingRef.current = false;
  }, []);

  return {
    canvasRef,
    scheduleCanvasUpdate,
    drawWithCache,
    drawOptimized,
    cleanup
  };
};