'use client'

import { motion } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Eraser, Eye, EyeOff, Play, Pause, ChevronRight, Check } from 'lucide-react'
import type { WriteItData } from '@/data/types'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'

interface WriteItProps {
  data: WriteItData
  onComplete: () => void
}

interface DrawingPath {
  points: { x: number; y: number }[];
  color: string;
  isEraser?: boolean;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export function WriteIt({ data, onComplete }: WriteItProps) {
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const isEraser = false;
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [penSize] = useState<number>(5); // Increased from 3 to 5 for better visibility
  const [isReplaying, setIsReplaying] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(50); // slider value (1=slow, 100=fast)
  const [isPaused, setIsPaused] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() =>
    (data.sentences[0]?.checklist ?? []).map((label) => ({
      id: label,
      label,
      checked: false,
    })),
  )
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isReplayingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const replaySpeedRef = useRef<number>(50); // Ref for reactive speed changes

  const sentence = data.sentences[currentSentenceIndex]?.text ?? ''
  const isLastSentence = currentSentenceIndex >= data.sentences.length - 1

  const handleNextSentence = () => {
    if (isLastSentence) {
      onComplete()
      return
    }
    setCurrentSentenceIndex((prev) => prev + 1)
  }

  useEffect(() => {
    const s = data.sentences[currentSentenceIndex]
    if (!s) return
    setChecklist(
      s.checklist.map((label) => ({
        id: label,
        label,
        checked: false,
      })),
    )
    setPaths([])
    setCurrentPath([])
    setIsDrawing(false)
    setIsReplaying(false)
    isReplayingRef.current = false
    setIsPaused(false)
    isPausedRef.current = false
  }, [currentSentenceIndex, data.id]) // eslint-disable-line react-hooks/exhaustive-deps -- bundle by lesson id

  const handleChecklistToggle = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    )
  }

  // Set canvas size to match container
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    // Initial update with a small delay to ensure container is rendered
    setTimeout(updateCanvasSize, 100);
    
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Redraw canvas whenever paths change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all completed paths
    paths.forEach(path => {
      if (path.points.length < 2) return;
      
      if (path.isEraser) {
        // Eraser mode - use destination-out to erase
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = 20;
      } else {
        // Normal drawing mode
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = path.color;
        ctx.lineWidth = penSize;
      }
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      
      ctx.stroke();
    });

    // Draw current path being drawn
    if (currentPath.length > 1) {
      if (isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = 20;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = penSize;
      }
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      
      ctx.stroke();
    }
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }, [paths, currentPath, isEraser, penSize]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCursorPos({ x, y });

    if (!isDrawing) return;

    setCurrentPath(prev => [...prev, { x, y }]);
  };

  const handleMouseUp = () => {
    if (isDrawing && currentPath.length > 1) {
      setPaths(prev => [...prev, { points: currentPath, color: '#1e40af', isEraser }]);
      setCurrentPath([]);
    }
    setIsDrawing(false);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });
  };

  const handleMouseLeave = () => {
    setCursorPos(null);
    if (isDrawing && currentPath.length > 1) {
      setPaths(prev => [...prev, { points: currentPath, color: '#1e40af', isEraser }]);
      setCurrentPath([]);
    }
    setIsDrawing(false);
  };

  // Touch event handlers for mobile/tablet
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
    setCursorPos({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDrawing) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    setCursorPos({ x, y });
    setCurrentPath(prev => [...prev, { x, y }]);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDrawing && currentPath.length > 1) {
      setPaths(prev => [...prev, { points: currentPath, color: '#1e40af', isEraser }]);
      setCurrentPath([]);
    }
    setIsDrawing(false);
    setCursorPos(null);
  };

  const handleClearDrawing = () => {
    isReplayingRef.current = false; // Stop any ongoing replay immediately
    setPaths([]);
    setCurrentPath([]);
    setIsReplaying(false);
  };

  const handleReplayDrawing = async () => {
    if (paths.length === 0) return;
    
    isReplayingRef.current = true;
    setIsReplaying(true);
    isPausedRef.current = false;
    setIsPaused(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Animate each path
    for (const path of paths) {
      if (path.points.length < 2) continue;

      // Animate drawing this path point by point
      for (let i = 0; i < path.points.length; i++) {
        // Check if replay was cancelled
        if (!isReplayingRef.current) {
          ctx.globalCompositeOperation = 'source-over';
          return;
        }

        // Wait while paused
        while (isPausedRef.current && isReplayingRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Check again after pause
        if (!isReplayingRef.current) {
          ctx.globalCompositeOperation = 'source-over';
          return;
        }

        // Read current speed from ref (reactive to slider changes)
        const actualDelay = 201 - (replaySpeedRef.current * 2);
        
        // Wait a bit between points for animation effect
        await new Promise(resolve => setTimeout(resolve, actualDelay));

        if (path.isEraser) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = 'rgba(0,0,0,1)';
          ctx.lineWidth = 20;
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = path.color;
          ctx.lineWidth = penSize;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(path.points[i].x, path.points[i].y);
        } else {
          ctx.lineTo(path.points[i].x, path.points[i].y);
          ctx.stroke();
        }
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    isReplayingRef.current = false;
    setIsReplaying(false);
    setIsPaused(false);
  };

  const handleTogglePause = () => {
    if (!isReplaying) {
      // Start replay if not already playing
      handleReplayDrawing();
    } else {
      // Toggle pause
      isPausedRef.current = !isPausedRef.current;
      setIsPaused(!isPaused);
    }
  };

  if (!data.sentences.length) {
    return (
      <div className="flex flex-col items-center justify-center py-xl text-sm text-gray-500">
        No sentences for this activity.
      </div>
    )
  }

  const sentenceTotal = data.sentences.length

  return (
    <ActivityCardFrame
      emoji={data.emoji}
      title={data.title}
      instruction={data.instruction}
      progress={
        sentenceTotal > 1
          ? { current: currentSentenceIndex + 1, total: sentenceTotal }
          : undefined
      }
    >
      <div className="flex w-full flex-col gap-6">
        <div className="flex w-full items-center gap-4">
          <div className={`min-w-0 flex-1 transition-all duration-300 ${isHidden ? 'blur-md grayscale' : ''}`}>
            <p className="text-center font-andika text-4xl font-bold leading-relaxed text-gray-900 md:text-5xl">
              {sentence}
            </p>
          </div>
          <TactileButton
            onClick={handleNextSentence}
            className="!shrink-0 !px-4"
            aria-label={isLastSentence ? 'Finish activity' : 'Next sentence'}
          >
            <ChevronRight className="h-6 w-6" />
          </TactileButton>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-inner"
        >
          <div className="mb-6 flex flex-wrap justify-center gap-3">
            {checklist.map((item) => (
              <TactileButton
                key={item.id}
                variant="ghost"
                type="button"
                onClick={() => handleChecklistToggle(item.id)}
                className={`!min-h-14 !px-4 !py-2 !text-sm ${
                  item.checked ? '!border-primary !bg-primary-light !text-gray-900' : ''
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      item.checked ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {item.checked && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  {item.label}
                </span>
              </TactileButton>
            ))}
          </div>

          <div className="flex justify-center">
            <div
              ref={containerRef}
              className={`relative overflow-hidden rounded-xl border border-gray-200 shadow-inner transition-all duration-300 ${isHidden ? 'blur-md grayscale' : ''}`}
              style={{
                width: '100%',
                maxWidth: '1000px',
                height: '400px',
                backgroundImage: `
                  repeating-linear-gradient(
                    to bottom,
                    transparent 0px,
                    transparent 79px,
                    #d1d5db 79px,
                    #d1d5db 80px
                  ),
                  linear-gradient(
                    to right,
                    transparent 0px,
                    transparent 120px,
                    #ef4444 120px,
                    #ef4444 121px,
                    transparent 121px
                  )
                `,
                backgroundColor: '#ffffff',
              }}
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full"
                style={{
                  cursor: isEraser
                    ? 'none'
                    : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%232d0a6e' d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'/%3E%3C/svg%3E") 0 24, auto`,
                  touchAction: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onMouseEnter={handleMouseEnter}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />

              {isEraser && cursorPos && (
                <div
                  className="pointer-events-none absolute rounded-full border-2 border-primary"
                  style={{
                    left: cursorPos.x - 10,
                    top: cursorPos.y - 10,
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'rgba(124, 58, 237, 0.12)',
                  }}
                />
              )}
            </div>
          </div>

          {checklist.every((item) => item.checked) && (
            <motion.div
              className="pointer-events-none fixed inset-0 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    background: ['#2D0A6E', '#EDE9FE', '#3D1589', '#6D28D9'][i % 4],
                    left: `${20 + Math.random() * 60}%`,
                    bottom: -30,
                    width: i % 3 === 0 ? '12px' : i % 3 === 1 ? '16px' : '14px',
                    height: i % 3 === 0 ? '12px' : i % 3 === 1 ? '6px' : '14px',
                    borderRadius: i % 2 === 0 ? '50%' : '3px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  }}
                  animate={{
                    y: [0, -window.innerHeight - 100],
                    x: [0, (Math.random() - 0.5) * 300],
                    rotate: [0, Math.random() * 1080],
                    scale: [0, 1.5, 1, 0.5],
                    opacity: [0, 1, 1, 0.8, 0],
                  }}
                  transition={{
                    duration: 3,
                    delay: i * 0.025,
                    ease: [0.17, 0.67, 0.3, 1.0],
                  }}
                />
              ))}
            </motion.div>
          )}

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-center gap-4 px-4">
              <span className="w-16 text-sm text-gray-500">Slow</span>
              <input
                type="range"
                min="1"
                max="100"
                value={replaySpeed}
                onChange={(e) => {
                  setReplaySpeed(Number(e.target.value))
                  replaySpeedRef.current = Number(e.target.value)
                }}
                className="h-2 w-48 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-primary"
              />
              <span className="w-16 text-sm text-gray-500">Fast</span>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <TactileButton variant="ghost" onClick={handleClearDrawing} className="!px-6">
                <span className="inline-flex items-center gap-2">
                  <Eraser className="h-5 w-5" />
                  Clear
                </span>
              </TactileButton>
              <TactileButton
                variant="ghost"
                onClick={handleTogglePause}
                disabled={paths.length === 0}
                className="!px-6"
              >
                <span className="inline-flex items-center gap-2">
                  {isReplaying && !isPaused ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {isReplaying && isPaused ? 'Resume' : isReplaying ? 'Pause' : 'Play'}
                </span>
              </TactileButton>
              <TactileButton variant="ghost" onClick={() => setIsHidden(!isHidden)} className="!px-6">
                <span className="inline-flex items-center gap-2">
                  {isHidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  {isHidden ? 'Show' : 'Hide'}
                </span>
              </TactileButton>
            </div>
          </div>
        </motion.div>
      </div>
    </ActivityCardFrame>
  )
}