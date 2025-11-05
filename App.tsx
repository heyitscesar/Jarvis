
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// --- Type Definitions ---
interface Rect {
  x: number;
  y: number;
}

// --- Helper Functions ---
const valueToHex = (value: number): string => {
  const hex = Math.round(value).toString(16).padStart(2, '0');
  return `#${hex}${hex}${hex}`;
};

// --- Child Component: DitherPattern ---
// Defined outside the main component to prevent re-creation on re-renders.
interface DitherPatternProps {
  foregroundColor: string;
  onBrightnessChange: (delta: number) => void;
}

const DitherPattern: React.FC<DitherPatternProps> = ({ foregroundColor, onBrightnessChange }) => {
  const [rects, setRects] = useState<Rect[]>([]);
  const lastTouchY = useRef(0);
  const lastTapTime = useRef(0);

  const generateDither = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelSize = 2;
    const cols = Math.ceil(width / pixelSize);
    const rows = Math.ceil(height / pixelSize);

    const newRects: Rect[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (Math.random() > 0.5) {
          newRects.push({ x: x * pixelSize, y: y * pixelSize });
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleInteractionEnd = () => {
    const currentTime = Date.now();
    if (currentTime - lastTapTime.current < 500) {
      toggleFullscreen();
    }
    lastTapTime.current = currentTime;
  };

  return (
    <svg
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
      onTouchEnd={handleInteractionEnd}
      onWheel={(e) => {
        onBrightnessChange(e.deltaY);
      }}
      onClick={handleInteractionEnd}
    >
      {rects.map((rect, i) => (
        <rect
          key={i}
          x={rect.x}
          y={rect.y}
          width={2}
          height={2}
          fill={foregroundColor}
        />
      ))}
    </svg>
  );
};

// --- Main App Component ---
const App: React.FC = () => {
  const [brightness, setBrightness] = useState(3);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io('http://localhost:4001');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('brightnessUpdate', (newBrightness: number) => {
      setBrightness(newBrightness);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleBrightnessChange = (delta: number) => {
    setBrightness(prev => {
      const sensitivity = 0.1;
      const newBrightness = Math.max(3, Math.min(36, prev - (delta * sensitivity)));
      
      // Emit the change to the server only if it's different
      if (newBrightness !== prev && socketRef.current) {
        socketRef.current.emit('brightnessChange', newBrightness);
      }
      return newBrightness;
    });
  };

  const foregroundColor = valueToHex(brightness);

  return (
    <div className="w-screen h-screen bg-black cursor-pointer">
      <DitherPattern
        foregroundColor={foregroundColor}
        onBrightnessChange={handleBrightnessChange}
      />
    </div>
  );
};

export default App;
