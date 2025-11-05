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
});


describe('App', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockedIo.mockReturnValue(mockSocket as any);
    fullscreenElement = null;

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

    const svg = screen.getByRole('graphics-document');
    const rect = svg.querySelector('rect');
    expect(rect).toHaveAttribute('fill', valueToHex(20));
  });

  it('emits a "brightnessChange" event on mouse wheel scroll', () => {
    render(<App />);
    const svg = screen.getByRole('graphics-document');

    fireEvent.wheel(svg, { deltaY: -100 });

    const expectedBrightness = constants.INITIAL_BRIGHTNESS - (-100 * constants.BRIGHTNESS_SENSITIVITY);
    expect(mockSocket.emit).toHaveBeenCalledWith('brightnessChange', expectedBrightness);
  });

  it('toggles fullscreen on double click', async () => {
    const user = userEvent.setup();
    render(<App />);
    const svg = screen.getByRole('graphics-document');

    await user.dblClick(svg);

    expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
    
    // Simulate being in fullscreen
    fullscreenElement = document.documentElement;
    
    await user.dblClick(svg);
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
  });

  it('disconnects from socket on unmount', () => {
    const { unmount } = render(<App />);
    unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
