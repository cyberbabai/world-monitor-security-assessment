import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

const THREAT_CITIES = [
  { lat: 40.7,  lon: -74.0, severity: 'critical', label: 'New York' },
  { lat: 51.5,  lon: -0.1,  severity: 'high',     label: 'London' },
  { lat: 35.7,  lon: 139.7, severity: 'high',     label: 'Tokyo' },
  { lat: 28.6,  lon: 77.2,  severity: 'medium',   label: 'Delhi' },
  { lat: -23.5, lon: -46.6, severity: 'medium',   label: 'São Paulo' },
  { lat: 55.8,  lon: 37.6,  severity: 'critical', label: 'Moscow' },
  { lat: 1.3,   lon: 103.8, severity: 'low',      label: 'Singapore' },
]

const SEV_COLORS = { critical: '#FF453A', high: '#FF9F0A', medium: '#FFD60A', low: '#30D158' }

function latLonToVec3(lat, lon, r = 2) {
  const phi   = (90 - lat)  * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  )
}

function Globe() {
  const globeRef = useRef()
  const ringsRef = useRef([])

  useFrame(({ clock }) => {
    if (globeRef.current) globeRef.current.rotation.y += 0.002
    ringsRef.current.forEach((ring, i) => {
      if (ring) {
        const s = 1 + 0.3 * Math.sin(clock.elapsedTime * 2 + i)
        ring.scale.setScalar(s)
        ring.material.opacity = 0.4 - 0.3 * Math.abs(Math.sin(clock.elapsedTime * 2 + i))
      }
    })
  })

  const dots = useMemo(() =>
    THREAT_CITIES.map((city) => ({ ...city, pos: latLonToVec3(city.lat, city.lon) }))
  , [])

  return (
    <group ref={globeRef}>
      <mesh>
        <icosahedronGeometry args={[2, 3]} />
        <meshBasicMaterial color="#0A84FF" wireframe transparent opacity={0.12} />
      </mesh>

      {dots.map((city, i) => (
        <group key={i} position={city.pos}>
          <mesh>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color={SEV_COLORS[city.severity]} />
          </mesh>
          <mesh
            ref={(el) => (ringsRef.current[i] = el)}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.06, 0.09, 16]} />
            <meshBasicMaterial
              color={SEV_COLORS[city.severity]}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function ThreatGlobe() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.2} />
      <Globe />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI * 3 / 4}
      />
    </Canvas>
  )
}
