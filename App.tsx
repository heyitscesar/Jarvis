import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  SERVER_URL,
  INITIAL_BRIGHTNESS,
  MIN_BRIGHTNESS,
  MAX_BRIGHTNESS,
  BRIGHTNESS_SENSITIVITY,
  PIXEL_SIZE,
  DOUBLE_TAP_THRESHOLD_MS
} from './constants';
import { valueToHex } from './utils';

// --- Type Definitions ---
interface Rect {
  x: number;
  y: number;
}

// --- Custom Hooks ---

/**
 * Manages the Socket.IO connection and event handling.
 */
const useSocket = (onBrightnessUpdate: (newBrightness: number) => void) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on('connect', () => console.log('Connected to socket server'));
    socket.on('disconnect', () => console.log('Disconnected from socket server'));
    socket.on('brightnessUpdate', onBrightnessUpdate);

    return () => {
      socket.disconnect();
    };
  }, [onBrightnessUpdate]);

  const emitBrightnessChange = useCallback((newBrightness: number) => {
    socketRef.current?.emit('brightnessChange', newBrightness);
  }, []);
  
  return { emitBrightnessChange };
};

/**
 * Manages the generation of the dither pattern.
 */
const useDither = () => {
  const [rects, setRects] = useState<Rect[]>([]);

  const generateDither = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const cols = Math.ceil(width / PIXEL_SIZE);
    const rows = Math.ceil(height / PIXEL_SIZE);

    const newRects: Rect[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (Math.random() > 0.5) {
          newRects.push({ x: x * PIXEL_SIZE, y: y * PIXEL_SIZE });
        }
      }
    }
    setRects(newRects);
  }, []);

  useEffect(() => {
    generateDither();
    window.addEventListener('resize', generateDither);
    return () => {
      window.removeEventListener('resize', generateDither);
    };
  }, [generateDither]);

  return rects;
};


// --- Child Component: DitherPattern ---
interface DitherPatternProps {
  foregroundColor: string;
  onBrightnessChange: (delta: number) => void;
  rects: Rect[];
}

const DitherPattern: React.FC<DitherPatternProps> = memo(({ foregroundColor, onBrightnessChange, rects }) => {
  const lastTouchY = useRef(0);
  const lastTapTime = useRef(0);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);
  
  const handleTouchEnd = useCallback(() => {
    const currentTime = Date.now();
    if (currentTime - lastTapTime.current < DOUBLE_TAP_THRESHOLD_MS) {
      toggleFullscreen();
    }
    lastTapTime.current = currentTime;
  }, [toggleFullscreen]);

  return (
    <svg
      role="graphics-document"
      aria-label="Interactive dither pattern"
      className="w-screen h-screen block"
      onTouchStart={(e) => {
        lastTouchY.current = e.touches[0].clientY;
      }}
      onTouchMove={(e) => {
        const currentY = e.touches[0].clientY;
        const delta = currentY - lastTouchY.current;
        onBrightnessChange(delta);
        lastTouchY.current = currentY;
      }}
      onTouchEnd={handleTouchEnd}
      onWheel={(e) => {
        onBrightnessChange(e.deltaY);
      }}
      onDoubleClick={toggleFullscreen}
    >
      {rects.map((rect, i) => (
        <rect
          key={i}
          x={rect.x}
          y={rect.y}
          width={PIXEL_SIZE}
          height={PIXEL_SIZE}
          fill={foregroundColor}
        />
      ))}
    </svg>
  );
});
DitherPattern.displayName = 'DitherPattern';


// --- Main App Component ---
const App: React.FC = () => {
  const [brightness, setBrightness] = useState(INITIAL_BRIGHTNESS);
  
  const handleSocketBrightnessUpdate = useCallback((newBrightness: number) => {
    setBrightness(newBrightness);
  }, []);

  const { emitBrightnessChange } = useSocket(handleSocketBrightnessUpdate);
  const rects = useDither();

  const handleBrightnessChange = useCallback((delta: number) => {
    setBrightness(prev => {
      const newBrightness = Math.max(MIN_BRIGHTNESS, Math.min(MAX_BRIGHTNESS, prev - (delta * BRIGHTNESS_SENSITIVITY)));
      
      if (newBrightness !== prev) {
        emitBrightnessChange(newBrightness);
      }
      return newBrightness;
    });
  }, [emitBrightnessChange]);

  const foregroundColor = valueToHex(brightness);

  return (
    <div className="w-screen h-screen bg-black cursor-pointer">
      <DitherPattern
        foregroundColor={foregroundColor}
        onBrightnessChange={handleBrightnessChange}
        rects={rects}
      />
    </div>
  );
};

export default App;
