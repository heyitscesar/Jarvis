
# Real-time Dither Sync

This is a collaborative, full-screen dither pattern artwork where users can adjust the brightness in real-time. Changes are synchronized across all connected clients using Socket.IO.

## Features

-   Generates a full-screen, randomized dither pattern.
-   Adjust pattern brightness using the mouse wheel or touch-drag (vertical).
-   Real-time synchronization of brightness changes with all connected clients.
-   Double-tap or double-click to toggle fullscreen mode.
-   Responsive pattern that regenerates on window resize.

## Tech Stack

-   **Frontend**: React 18, TypeScript, Tailwind CSS
-   **Real-time Sync**: Socket.IO
-   **Backend**: Node.js, Express, Socket.IO

## Setup and Running

You need to have Node.js and npm installed.

### 1. Install Dependencies

First, install the necessary dependencies for both the server and the client.

```bash
npm install
```

### 2. Run the Backend Server

The Socket.IO server is required for real-time communication. Open a terminal and run:

```bash
npm run server
```

This will start the server on `http://localhost:4001`. Keep this terminal window open.

### 3. Run the React Frontend

This project is set up to be used with a standard React development server like Vite or Create React App. The `package.json` includes a `dev` script for this purpose.

In a new terminal window, run:

```bash
npm run dev
```

This will start the React development server, typically on `http://localhost:5173` (for Vite), and should open the application in your browser automatically.

Now, you can open the application in multiple browser tabs or on different devices to see the real-time synchronization in action.

## How to Use

-   **Adjust Brightness**:
    -   **Desktop**: Use your mouse wheel to scroll up or down.
    -   **Mobile**: Touch and drag your finger up or down on the screen.
-   **Toggle Fullscreen**:
    -   **Desktop**: Double-click anywhere on the pattern.
    -   **Mobile**: Double-tap anywhere on the screen.
