import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Text, Float, OrthographicCamera } from '@react-three/drei'
import { useRef, useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'

// KeyboardControllerBox: like Box, but position can be moved with keyboard (arrow or WASD)
function KeyboardControllerBox({ initialPosition = [2, 0.5, 0], color, ...props }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [position, setPosition] = useState(initialPosition)
  const keysDownRef = useRef({})

  useEffect(() => {
    const handleKeyDown = (event) => {
      keysDownRef.current[event.key.toLowerCase()] = true
    }
    const handleKeyUp = (event) => {
      keysDownRef.current[event.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame(() => {
    let [x, y, z] = position
    const step = 0.15
    let next = [x, y, z]
    let moved = false
    const keysDown = keysDownRef.current
    if (keysDown['arrowleft'] || keysDown['a']) {
      next[0] -= step
      moved = true
    }
    if (keysDown['arrowright'] || keysDown['d']) {
      next[0] += step
      moved = true
    }
    if (keysDown['arrowup'] || keysDown['w']) {
      next[2] -= step
      moved = true
    }
    if (keysDown['arrowdown'] || keysDown['s']) {
      next[2] += step
      moved = true
    }
    if (moved) {
      setPosition(next)
    }
  })

  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={clicked ? 1.5 : hovered ? 1.2 : 1}
      position={position}
      onClick={() => setClicked(!clicked)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : color} />
    </mesh>
  )
}

function Box({ position, color, ...props }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)

  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={clicked ? 1.5 : hovered ? 1.2 : 1}
      position={position}
      onClick={() => setClicked(!clicked)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : color} />
    </mesh>
  )
}

// Simple "blades of grass" using many green planes of various heights/orientations
function GrassField({ width = 12, height = 12, bladeCount = 600 }) {
  const blades = useMemo(() => {
    const arr = []
    for (let i = 0; i < bladeCount; i++) {
      const x = Math.random() * width - width / 2
      const z = Math.random() * height - height / 2
      const h = 0.3 + Math.random() * 0.6
      const rot = Math.random() * Math.PI
      arr.push({ x, z, h, rot })
    }
    return arr
  }, [width, height, bladeCount])
  return (
    <group>
      {blades.map((blade, i) => (
        <mesh
          key={i}
          position={[blade.x, blade.h / 2 + 0.01, blade.z]}
          rotation={[0, blade.rot, 0]}
          castShadow
          receiveShadow
        >
          <planeGeometry args={[0.03 + Math.random()*0.03, blade.h]} />
          <meshStandardMaterial color="#278a36" roughness={0.9} side={THREE.DoubleSide}/>
        </mesh>
      ))}
    </group>
  )
}

// S-curve footpath using TubeGeometry along a spline curve
function SCurvePath({ color = "#835c32", radius = 0.35, tube = 30, ...props }) {
  // Define an S-curve through a few control points
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.5, 0.03,  5),
      new THREE.Vector3(-2.5, 0.03,  2),
      new THREE.Vector3( 0.0, 0.03,  0),
      new THREE.Vector3( 2.5, 0.03, -2),
      new THREE.Vector3( 4.5, 0.03, -5),
    ])
  }, [])
  return (
    <mesh position={[0, 0, 0]} {...props} castShadow receiveShadow>
      <tubeGeometry args={[curve, tube, radius, 8, false]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  )
}

// Animate text float above the world
function AnimatedText() {
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <Text
        position={[0, 3.7, 0]}
        fontSize={0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        jakedowns.com
      </Text>
    </Float>
  )
}

// The "ground" for the scene (under the grass) as a green plane
function GrassPlane({ size = [12, 12] }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color="#57b050" roughness={1.0}/>
    </mesh>
  )
}

// Camera in isometric view: fov very low, looking down the diagonal from far away
const ISOMETRIC_CAMERA = {
  // position approximates isometric perspective for a plane centered at (0,0,0) with y up
  position: [10, 10, 10],
  fov: 20,
  near: 0.1,
  far: 100,
}

// Wrapper for zoom scaling
import { createContext, useContext } from 'react'
const ZoomContext = createContext(1)

function Scene() {
  // Consume zoom scale from context and apply it to all scene children
  const zoom = useContext(ZoomContext)
  return (
    <group scale={[zoom, zoom, zoom]}>
      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 12, 8]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[-10, 5, -10]} intensity={0.3} />

      {/* World */}
      <GrassPlane />
      <GrassField />
      <SCurvePath />
      
      {/* Example objects */}
      <Box position={[-2, 0.5, 0]} color="#ff6b6b" />
      <KeyboardControllerBox initialPosition={[2, 0.5, 0]} color="#4ecdc4" />

      {/* Floating text */}
      <AnimatedText />

      {/* Stars background */}
      <Stars radius={100} depth={50} count={3500} factor={3.5} saturation={0} fade />

      {/* Controls: Isometric, Orbit disabled, enablePan only */}
      {/* We keep pan only, disable rotate/zoom */}
      {/* OrbitControls is NOT imported/enabled */}
    </group>
  )
}

import { extend, useThree } from '@react-three/fiber'

// Pan-only controls with manual zoom controls for isometric camera (scale the scene)
function PanZoomControls({ zoom, setZoom, zoomMin=0.4, zoomMax=2.0, zoomStep=0.08 }) {
  const { camera, gl } = useThree()
  const panRef = useRef()
  // Pan: Mouse drag horizontally/vertically moves camera+target
  useEffect(() => {
    let dragging = false
    let last = { x: 0, y: 0 }
    function onPointerDown(e) {
      if (e.button !== 0) return
      dragging = true
      last.x = e.clientX
      last.y = e.clientY
    }
    function onPointerMove(e) {
      if (!dragging) return
      // pan speed auto-choose based on camera height
      const dx = (e.clientX - last.x) * 0.01
      const dy = (e.clientY - last.y) * 0.01
      camera.position.x -= dx
      camera.position.z -= dy
      camera.updateProjectionMatrix()
      last.x = e.clientX
      last.y = e.clientY
    }
    function onPointerUp() {
      dragging = false
    }
    const dom = gl.domElement
    dom.addEventListener('pointerdown', onPointerDown)
    dom.addEventListener('pointermove', onPointerMove)
    dom.addEventListener('pointerup', onPointerUp)
    return () => {
      dom.removeEventListener('pointerdown', onPointerDown)
      dom.removeEventListener('pointermove', onPointerMove)
      dom.removeEventListener('pointerup', onPointerUp)
    }
  }, [camera, gl])

  // Zoom: Mouse wheel scales the scene (within bounds)
  useEffect(() => {
    function onWheel(e) {
      // Prevent regular browser scroll if over canvas
      e.preventDefault()
      let delta = e.deltaY > 0 ? 1 : -1
      setZoom(z => {
        let next = z + delta * -zoomStep
        return Math.min(zoomMax, Math.max(zoomMin, next))
      })
    }
    const dom = gl.domElement
    dom.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      dom.removeEventListener('wheel', onWheel)
    }
  }, [setZoom, gl, zoomMin, zoomMax, zoomStep])

  return null
}

import React from 'react'

export default function App() {
  // Scene-wide zoom state
  const [zoom, setZoom] = useState(1)
  return (
    <Canvas
      camera={ISOMETRIC_CAMERA}
      shadows
      style={{ background: '#0a0a0a' }}
    >
      {/* For crispy isometric, use OrthographicCamera */}
      {/* Uncomment if you'd rather orthographic (then comment ISOMETRIC_CAMERA on Canvas above) */}
      {/*
      <OrthographicCamera
        makeDefault
        position={[10, 10, 10]}
        zoom={30}
        near={-100}
        far={100}
      />
      */}
      <ZoomContext.Provider value={zoom}>
        <Scene />
      </ZoomContext.Provider>
      <PanZoomControls zoom={zoom} setZoom={setZoom} />
    </Canvas>
  )
}
