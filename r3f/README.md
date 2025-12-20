# R3F Example Project

A React Three Fiber example project with interactive 3D objects.

## Features

- ⚛️ React 18 with JSX
- 🎯 React Three Fiber for 3D rendering
- 🎨 @react-three/drei for useful helpers
- 🎮 Interactive objects (click, hover, rotate)
- 🌟 Animated floating text and objects
- 🎨 Custom materials and lighting
- 🖱️ Orbit controls for camera movement

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
r3f/
├── src/
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## Components

- **Box**: Interactive cube that changes size on click/hover
- **Sphere**: Floating sphere with distortion material
- **Torus**: Rotated torus geometry
- **AnimatedText**: Floating 3D text
- **Scene**: Main scene with lighting and controls

## Controls

- 🖱️ **Drag**: Rotate camera
- 🔍 **Scroll**: Zoom in/out
- 🎯 **Click objects**: Interact with boxes
- 🌟 **Hover**: See hover effects

## Technologies Used

- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [React Three Drei](https://github.com/pmndrs/drei)
- [Three.js](https://threejs.org/)
- [Vite](https://vitejs.dev/)

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
