import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Text, Float, MeshDistortMaterial } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'

// KeyboardControllerBox: like Box, but position can be moved with keyboard (arrow or WASD)
// REWRITE: if the key is down, keep stepping the position
function KeyboardControllerBox({ initialPosition = [2, 0, 0], color, ...props }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [position, setPosition] = useState(initialPosition)
  const keysDownRef = useRef({})

  // Track key states (keydown/keyup)
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

  // Update position as long as keys are down
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
    // Only update if changed, avoid infinite rerender
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
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : color} />
    </mesh>
  )
}

function Sphere({ position }) {
  const meshRef = useRef()

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <MeshDistortMaterial
          color="#ff6b6b"
          distort={0.3}
          speed={2}
          roughness={0}
        />
      </mesh>
    </Float>
  )
}

function Torus({ position }) {
  const meshRef = useRef()

  return (
    <mesh ref={meshRef} position={position} rotation={[Math.PI / 4, 0, 0]}>
      <torusGeometry args={[0.8, 0.2, 16, 100]} />
      <meshStandardMaterial color="#4ecdc4" />
    </mesh>
  )
}

function AnimatedText() {
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <Text
        position={[0, 3, 0]}
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

function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Objects */}
      <Box position={[-2, 0, 0]} color="#ff6b6b" />
      {/* Keyboard controlled box */}
      <KeyboardControllerBox initialPosition={[2, 0, 0]} color="#4ecdc4" />
      <Sphere position={[0, 2, 0]} />
      <Torus position={[0, -2, 0]} />

      {/* Text */}
      <AnimatedText />

      {/* Background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />

      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={20}
      />
    </>
  )
}

export default function App() {
  return (
    <Canvas
      camera={{ position: [5, 5, 5], fov: 75 }}
      style={{ background: '#0a0a0a' }}
    >
      <Scene />
    </Canvas>
  )
}
