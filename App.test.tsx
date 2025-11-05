import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { io } from 'socket.io-client';
import { valueToHex } from './utils';
import * as constants from './constants';

// Mock socket.io-client
vi.mock('socket.io-client');
const mockedIo = vi.mocked(io);

const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
};

// Mock fullscreen API
document.documentElement.requestFullscreen = vi.fn(() => Promise.resolve());
document.exitFullscreen = vi.fn(() => Promise.resolve());
let fullscreenElement: Element | null = null;
Object.defineProperty(document, 'fullscreenElement', {
  get: () => fullscreenElement,
  set: (val) => { fullscreenElement = val; },
  // Fix: Make property configurable to avoid redefinition errors across tests.
  configurable: true,
});

// Fix: Mock canvas context to test drawing operations since the component uses canvas, not SVG.
const mockContext = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  scale: vi.fn(),
  fillStyle: '',
};

vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((contextId) => {
  if (contextId === '2d') {
    return mockContext as any;
  }
  return null;
});


describe('App', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockedIo.mockReturnValue(mockSocket as any);
    fullscreenElement = null;
    mockContext.fillStyle = '';

    // Default mock implementation
    mockSocket.on.mockImplementation((event, callback) => {
      if (event === 'connect') {
        callback();
      }
    });
  });

  it('renders the DitherPattern component', () => {
    render(<App />);
    expect(screen.getByRole('graphics-document')).toBeInTheDocument();
  });

  it('connects to the socket server on mount', () => {
    render(<App />);
    expect(mockedIo).toHaveBeenCalledWith(constants.SERVER_URL);
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('brightnessUpdate', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
  });

  it('updates brightness when a "brightnessUpdate" event is received', () => {
    let brightnessCallback: (newBrightness: number) => void = () => {};
    mockSocket.on.mockImplementation((event, callback) => {
      if (event === 'brightnessUpdate') {
        brightnessCallback = callback;
      }
    });

    render(<App />);
    
    act(() => {
      brightnessCallback(20);
    });

    // Fix: Assert on the mocked canvas context's fillStyle property instead of a non-existent SVG element.
    expect(mockContext.fillStyle).toBe(valueToHex(20));
  });

  it('emits a "brightnessChange" event on mouse wheel scroll', () => {
    render(<App />);
    // Fix: Use a more descriptive variable name than 'svg'.
    const container = screen.getByRole('graphics-document');

    fireEvent.wheel(container, { deltaY: -100 });

    const expectedBrightness = constants.INITIAL_BRIGHTNESS - (-100 * constants.BRIGHTNESS_SENSITIVITY);
    expect(mockSocket.emit).toHaveBeenCalledWith('brightnessChange', expectedBrightness);
  });

  it('toggles fullscreen on double click', async () => {
    const user = userEvent.setup();
    render(<App />);
    // Fix: Use a more descriptive variable name than 'svg'.
    const container = screen.getByRole('graphics-document');

    await user.dblClick(container);

    expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
    
    // Simulate being in fullscreen
    fullscreenElement = document.documentElement;
    
    await user.dblClick(container);
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
  });

  it('disconnects from socket on unmount', () => {
    const { unmount } = render(<App />);
    unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
