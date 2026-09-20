import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const POINT_COUNT = 600
const CONNECT_DIST = 1.4
const SPEED = 0.0003

function Particles() {
  const meshRef = useRef()
  const linesRef = useRef()

  const positions = useMemo(() => {
    const arr = new Float32Array(POINT_COUNT * 3)
    for (let i = 0; i < POINT_COUNT; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 14
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    return arr
  }, [])

  const velocities = useMemo(() => {
    const arr = new Float32Array(POINT_COUNT * 3)
    for (let i = 0; i < POINT_COUNT * 3; i++) {
      arr[i] = (Math.random() - 0.5) * 0.004
    }
    return arr
  }, [])

  const linePositions = useMemo(() => new Float32Array(POINT_COUNT * POINT_COUNT * 6), [])
  const lineGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
    return geo
  }, [linePositions])

  const pointGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3))
    return geo
  }, [positions])

  useFrame(() => {
    const pos = pointGeo.attributes.position.array
    for (let i = 0; i < POINT_COUNT; i++) {
      pos[i * 3]     += velocities[i * 3]
      pos[i * 3 + 1] += velocities[i * 3 + 1]
      pos[i * 3 + 2] += velocities[i * 3 + 2]
      if (Math.abs(pos[i * 3])     > 7)  velocities[i * 3]     *= -1
      if (Math.abs(pos[i * 3 + 1]) > 5)  velocities[i * 3 + 1] *= -1
      if (Math.abs(pos[i * 3 + 2]) > 3)  velocities[i * 3 + 2] *= -1
    }
    pointGeo.attributes.position.needsUpdate = true

    let lineIdx = 0
    const lp = linePositions
    for (let i = 0; i < POINT_COUNT; i++) {
      for (let j = i + 1; j < POINT_COUNT; j++) {
        const dx = pos[i*3] - pos[j*3]
        const dy = pos[i*3+1] - pos[j*3+1]
        const dz = pos[i*3+2] - pos[j*3+2]
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
        if (dist < CONNECT_DIST && lineIdx + 6 < lp.length) {
          lp[lineIdx++] = pos[i*3];   lp[lineIdx++] = pos[i*3+1]; lp[lineIdx++] = pos[i*3+2]
          lp[lineIdx++] = pos[j*3];   lp[lineIdx++] = pos[j*3+1]; lp[lineIdx++] = pos[j*3+2]
        }
      }
    }
    for (let k = lineIdx; k < lp.length; k++) lp[k] = 0
    lineGeo.setDrawRange(0, lineIdx / 3)
    lineGeo.attributes.position.needsUpdate = true
  })

  return (
    <>
      <points ref={meshRef} geometry={pointGeo}>
        <pointsMaterial color="#0A84FF" size={0.04} transparent opacity={0.7} />
      </points>
      <lineSegments ref={linesRef} geometry={lineGeo}>
        <lineBasicMaterial color="#0A84FF" transparent opacity={0.15} />
      </lineSegments>
    </>
  )
}

export default function ParticleNetwork() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60 }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
    >
      <Particles />
    </Canvas>
  )
}
