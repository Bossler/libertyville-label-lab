import { useRef, useCallback, useState } from 'react';

interface DragState {
  element: string | null;
  isDragging: boolean;
  startX: number;
  startY: number;
  startElementX: number;
  startElementY: number;
}

interface DragPosition {
  x: number;
  y: number;
}

export const useDragOptimized = (
  onDragEnd: (element: string, position: DragPosition) => void
) => {
  const [dragState, setDragState] = useState<DragState>({
    element: null,
    isDragging: false,
    startX: 0,
    startY: 0,
    startElementX: 0,
    startElementY: 0
  });

  const animationFrameRef = useRef<number | null>(null);
  const ghostElementRef = useRef<HTMLDivElement | null>(null);
  const targetElementRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  const createGhostElement = useCallback((originalElement: HTMLElement) => {
    const ghost = document.createElement('div');
    const rect = originalElement.getBoundingClientRect();
    
    ghost.style.position = 'fixed';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.background = 'rgba(59, 130, 246, 0.1)';
    ghost.style.border = '2px dashed rgba(59, 130, 246, 0.5)';
    ghost.style.borderRadius = '4px';
    ghost.style.willChange = 'transform';
    ghost.style.transition = 'none';
    
    document.body.appendChild(ghost);
    return ghost;
  }, []);

  const handlePointerDown = useCallback((
    event: React.PointerEvent, 
    element: string,
    container: HTMLElement
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);
    
    // Create ghost element for visual feedback
    const ghost = createGhostElement(target);
    ghostElementRef.current = ghost;
    targetElementRef.current = target;
    containerRef.current = container;
    
    const rect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    const elementX = rect.left - containerRect.left + rect.width / 2;
    const elementY = rect.top - containerRect.top + rect.height / 2;
    
    setDragState({
      element,
      isDragging: true,
      startX: event.clientX,
      startY: event.clientY,
      startElementX: elementX,
      startElementY: elementY
    });

    // Hide original element during drag
    target.style.opacity = '0.3';
    target.style.willChange = 'transform';
    
    // Add global event listeners
    document.addEventListener('pointermove', handleGlobalPointerMove);
    document.addEventListener('pointerup', handleGlobalPointerUp);
  }, []);

  const handleGlobalPointerMove = useCallback((event: PointerEvent) => {
    if (!dragState.isDragging || !ghostElementRef.current || !containerRef.current) return;
    
    event.preventDefault();
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const ghost = ghostElementRef.current;
      const container = containerRef.current;
      if (!ghost || !container) return;
      
      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      
      // Use transform for smooth movement
      ghost.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    });
  }, [dragState]);

  const handleGlobalPointerUp = useCallback((event: PointerEvent) => {
    if (!dragState.isDragging || !dragState.element || !containerRef.current) return;
    
    const container = containerRef.current;
    const target = targetElementRef.current;
    
    // Clean up
    if (ghostElementRef.current) {
      document.body.removeChild(ghostElementRef.current);
      ghostElementRef.current = null;
    }
    
    if (target) {
      target.style.opacity = '';
      target.style.willChange = '';
      target.releasePointerCapture && target.releasePointerCapture(event.pointerId);
    }
    
    // Remove global listeners
    document.removeEventListener('pointermove', handleGlobalPointerMove);
    document.removeEventListener('pointerup', handleGlobalPointerUp);
    
    // Calculate final position
    const containerRect = container.getBoundingClientRect();
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    
    const newX = dragState.startElementX + deltaX;
    const newY = dragState.startElementY + deltaY;
    
    const clampedX = Math.max(50, Math.min(containerRect.width - 50, newX));
    const clampedY = Math.max(30, Math.min(containerRect.height - 30, newY));
    
    // Notify parent with final position
    onDragEnd(dragState.element, { x: clampedX, y: clampedY });
    
    setDragState({
      element: null,
      isDragging: false,
      startX: 0,
      startY: 0,
      startElementX: 0,
      startElementY: 0
    });
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [dragState, onDragEnd]);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (ghostElementRef.current) {
      document.body.removeChild(ghostElementRef.current);
      ghostElementRef.current = null;
    }
    document.removeEventListener('pointermove', handleGlobalPointerMove);
    document.removeEventListener('pointerup', handleGlobalPointerUp);
  }, []);

  return {
    dragState,
    handlePointerDown,
    cleanup
  };
};