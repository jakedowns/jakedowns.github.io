import { Canvas, useFrame, useThree, extend } from '@react-three/fiber'
import { Stars, Text, Float, OrthographicCamera } from '@react-three/drei'
import { useRef, useState, useEffect, useMemo, createContext, useContext, useCallback, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'

// Define the bounding plane size for the character (matches GrassPlane and GrassField defaults)
const PLANE_WIDTH = 12
const PLANE_HEIGHT = 12
const BOX_SIZE = 1 // from <boxGeometry args={[1, 1, 1]} />, so half size is 0.5

// KeyboardControllerBox: like Box, but position can be moved with keyboard (arrow or WASD) RELATIVE TO CAMERA
// Expose box's ref via forwardRef so camera can follow its position
const KeyboardControllerBox = forwardRef(function KeyboardControllerBox({ initialPosition = [2, 0.5, 0], color, onPositionChange, ...props }, ref) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [position, setPosition] = useState(initialPosition)
  const keysDownRef = useRef({})
  const { camera } = useThree()

  useImperativeHandle(ref, () => ({
    getPosition: () => position,
    getRef: () => meshRef.current
  }), [position])

  useEffect(() => {
    if (onPositionChange) onPositionChange(position)
  }, [position, onPositionChange])

  useEffect(() => {
    const handleKeyDown = event => {
      keysDownRef.current[event.key.toLowerCase()] = true
    }
    const handleKeyUp = event => {
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
    let moveX = 0
    let moveZ = 0
    const keysDown = keysDownRef.current

    // Move screen relative (camera local X/Z axes), not world X/Z axes
    if (keysDown['arrowleft'] || keysDown['a']) {
      moveX -= step
    }
    if (keysDown['arrowright'] || keysDown['d']) {
      moveX += step
    }
    if (keysDown['arrowup'] || keysDown['w']) {
      moveZ += step
    }
    if (keysDown['arrowdown'] || keysDown['s']) {
      moveZ -= step
    }
    if (moveX !== 0 || moveZ !== 0) {
      // Camera direction vectors
      // We want movement in the camera local right/forward directions on X/Z plane
      // Get camera's right and forward vectors projected onto XZ plane
      const camQuat = camera.quaternion
      const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camQuat) // forward dir
      camForward.y = 0
      camForward.normalize()

      const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camQuat)
      camRight.y = 0
      camRight.normalize()

      let next = [x, y, z]
      // moveX: right/left, moveZ: forward/back
      // Add right and forward scaled vectors appropriately
      next[0] += camRight.x * moveX + camForward.x * moveZ
      next[2] += camRight.z * moveX + camForward.z * moveZ

      // --- Clamp the box so it can't go off the plane edges ---
      // Assume box is centered at position, and plane center is (0,0)
      // Leave a small epsilon so the box never visually clips the edge
      const HALF_W = PLANE_WIDTH / 2 - BOX_SIZE / 2
      const HALF_H = PLANE_HEIGHT / 2 - BOX_SIZE / 2
      next[0] = Math.max(-HALF_W, Math.min(HALF_W, next[0]))
      next[2] = Math.max(-HALF_H, Math.min(HALF_H, next[2]))

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
})

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
function SCurvePath({ color = "#835c32", radius = 0.35, tube = 30, curveOffset = [0,0,0], ...props }) {
  // Define an S-curve through a few control points, with optional offset
  const curve = useMemo(() => {
    const basePoints = [
      new THREE.Vector3(-4.5, 0.03,  5),    // Start of the path
      new THREE.Vector3(-2.5, 0.03,  2),
      new THREE.Vector3( 0.0, 0.03,  0),
      new THREE.Vector3( 2.5, 0.03, -2),
      new THREE.Vector3( 4.5, 0.03, -5),    // End of the path
    ]
    // Offset every point for ease of "river curve"
    if (curveOffset && (curveOffset[0] !== 0 || curveOffset[1] !== 0 || curveOffset[2] !== 0)) {
      return new THREE.CatmullRomCurve3(
        basePoints.map(pt => pt.clone().add(new THREE.Vector3(...curveOffset)))
      )
    }
    return new THREE.CatmullRomCurve3(basePoints)
  }, [curveOffset])
  return (
    <mesh position={[0, 0, 0]} {...props} castShadow receiveShadow>
      <tubeGeometry args={[curve, tube, radius, 8, false]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  )
}

// RIVER: S-curve, blue, offset by 25% of world width (so approximately +3 on x axis)
function RiverSCurve({ tube = 32, width = 12 }) {
  // Offset by 25% of world width on the X axis
  const offsetX = width * 0.25
  // Position slightly lower than path so it "sits beneath"
  return (
    <SCurvePath
      color="#299fff"
      radius={0.55}
      tube={tube}
      curveOffset={[offsetX, -0.01, 0]}
      // Optionally, tweak roughness/opacity for water look:
      // ...or add a MeshPhysicalMaterial for fancier water
    />
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

const FOLLOW_CAMERA_OFFSET = new THREE.Vector3(-4, 3, 8) // "over the shoulder" offset

const ZoomContext = createContext(1)

// "Milestone" text mesh components
function MilestoneText({ children, position, color, fontSize = 0.66 }) {
  // Float a little with a slight up offset for visibility
  return (
    <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.13}>
      <Text
        position={position}
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineColor="#222"
        outlineWidth={0.02}
      >
        {children}
      </Text>
    </Float>
  )
}

function Scene({ keyboardRef }) {
  // Consume zoom scale from context and apply it to all scene children
  const zoom = useContext(ZoomContext)
  const grassWidth = 12

  // Path endpoints for S curve (as in the basePoints list in SCurvePath)
  // Start:  [-4.5, 0.03, 5]
  // End:    [4.5, 0.03, -5]
  // We'll raise y for text to float above path

  return (
    <group scale={[zoom, zoom, zoom]}>
      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 12, 8]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[-10, 5, -10]} intensity={0.3} />

      {/* World */}
      <GrassPlane />
      <GrassField />
      {/* River first so it's underneath */}
      <RiverSCurve width={grassWidth} />
      <SCurvePath />

      {/* Milestone Texts */}
      <MilestoneText
        position={[-4.5, 1.18, 5]}   // just above the start of the path
        color="#FFD700"               // Gold
        fontSize={0.7}
      >2026</MilestoneText>

      <MilestoneText
        position={[4.5, 1.18, -5]}   // opposite corner/end of path
        color="#1DE9B6"               // Turquoise
        fontSize={0.7}
      >2006</MilestoneText>


      {/* Example objects */}
      <Box position={[-2, 0.5, 0]} color="#ff6b6b" />
      <KeyboardControllerBox ref={keyboardRef} initialPosition={[-5, 0.5, 5]} color="#4ecdc4" />

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

// Pan-only controls with manual zoom controls for isometric camera (scale the scene)
function PanZoomControls({ zoom, setZoom, zoomMin=0.4, zoomMax=2.0, zoomStep=0.08, enabled = true }) {
  const { camera, gl } = useThree()
  const panRef = useRef()
  // Pan: Mouse drag horizontally/vertically moves camera+target
  useEffect(() => {
    if (!enabled) return
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
  }, [camera, gl, enabled])

  // Zoom: Mouse wheel scales the scene (within bounds)
  useEffect(() => {
    if (!enabled) return
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
  }, [setZoom, gl, zoomMin, zoomMax, zoomStep, enabled])

  return null
}

// CameraController that smoothly transitions between isometric and follow modes
function CameraController({
  mode,
  keyboardRef,
  isometricPosition = ISOMETRIC_CAMERA.position,
  isometricLookAt = [0, 0, 0],
  followOffset = FOLLOW_CAMERA_OFFSET,
  transitionSpeed = 0.04, // 0-1, lerp speed
  }) {
  const { camera } = useThree()
  const lastTargetRef = useRef({pos: new THREE.Vector3(...isometricPosition), look: new THREE.Vector3(...isometricLookAt)})

  useFrame(() => {
    if (mode === 'isometric') {
      // Animate smooth transition back to isometric
      const targetPos = new THREE.Vector3(...isometricPosition)
      const targetLook = new THREE.Vector3(...isometricLookAt)

      // Current position/target
      const current = lastTargetRef.current
      current.pos.lerp(targetPos, transitionSpeed)
      current.look.lerp(targetLook, transitionSpeed)

      camera.position.copy(current.pos)
      camera.lookAt(current.look)
    } else if (mode === 'follow') {
      // Follow the KeyboardControllerBox
      let boxPos = keyboardRef.current
        ? keyboardRef.current.getPosition?.() || [0,0,0]
        : [0,0,0]
      let boxVec = new THREE.Vector3(...boxPos)

      // Offset is in local space "behind and up" from box. Use fixed world offset behind box for simplicity.
      // If you want to use box facing, update followOffset computation accordingly.

      // For a nicer effect, use offset relative to camera's current view direction or global
      const offset = followOffset // Vector3
      // Optionally, directionally behind box (ignoring rotation in this implementation)
      let desiredPos = boxVec.clone().add(offset.clone())
      let lookAt = boxVec.clone()

      // Smoothly move camera into position
      const current = lastTargetRef.current
      current.pos.lerp(desiredPos, transitionSpeed)
      current.look.lerp(lookAt, transitionSpeed)

      camera.position.copy(current.pos)
      camera.lookAt(current.look)
    }
    camera.updateProjectionMatrix()
  })
  return null
}

import React from 'react'

// Overlay button for camera switching
function CameraToggleButton({ mode, setMode, style = {} }) {
  return (
    <button
      onClick={() => setMode(m => m === "isometric" ? "follow" : "isometric")}
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        background: '#161616ee',
        color: '#fff',
        fontSize: '1rem',
        padding: "8px 18px",
        border: 'none',
        borderRadius: 6,
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 2px 7px #0006',
        ...style
      }}
    >
      {mode === "isometric" ? 'Switch to Follow Camera' : 'Switch to Isometric'}
    </button>
  )
}

export default function App() {
  // Scene-wide zoom state
  const [zoom, setZoom] = useState(0.5)
  // Camera mode state: 'isometric' | 'follow'
  const [cameraMode, setCameraMode] = useState('isometric')
  const keyboardBoxRef = useRef()

  // f key global shortcut: toggle camera follow mode
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignore if focus is on an input field or textarea
      if (
        event.repeat ||
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable
      ) {
        return
      }
      if (event.key && event.key.toLowerCase() === 'f') {
        setCameraMode((prev) => (prev === "isometric" ? "follow" : "isometric"))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, []) // only on mount

  // Don't allow user pan/zoom in follow camera mode
  const panZoomEnabled = cameraMode === 'isometric'

  return (
    <div style={{width:'100vw',height:'100vh',position:'relative',overflow:'hidden'}}>
      <CameraToggleButton mode={cameraMode} setMode={setCameraMode} />
      <Canvas
        camera={ISOMETRIC_CAMERA}
        shadows
        style={{ background: '#0a0a0a', width: '100vw', height: '100vh', display: "block" }}
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
          <Scene keyboardRef={keyboardBoxRef} />
        </ZoomContext.Provider>
        <PanZoomControls zoom={zoom} setZoom={setZoom} enabled={panZoomEnabled} />
        <CameraController
          mode={cameraMode}
          keyboardRef={keyboardBoxRef}
          // Optionally pass custom offsets here
        />
      </Canvas>
    </div>
  )
}
