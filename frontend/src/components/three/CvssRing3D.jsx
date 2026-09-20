import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { getSeverityConfig } from '../../lib/cvss'

function Ring({ score, color }) {
  const torusRef = useRef()
  const fillRef = useRef()
  const fillAngle = (score / 10) * Math.PI * 2

  useFrame(() => {
    if (torusRef.current) torusRef.current.rotation.z += 0.005
  })

  const arcShape = new THREE.Shape()
  const segments = 80
  arcShape.moveTo(0, 0)
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * fillAngle - Math.PI / 2
    arcShape.lineTo(Math.cos(angle) * 1.7, Math.sin(angle) * 1.7)
  }
  arcShape.closePath()

  return (
    <group>
      <mesh ref={torusRef}>
        <torusGeometry args={[1.7, 0.14, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>

      <mesh>
        <torusGeometry args={[1.7, 0.14, 16, 100, fillAngle]} rotation={[0, 0, -Math.PI / 2]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      <Text
        position={[0, 0, 0]}
        fontSize={0.7}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {score.toFixed(1)}
      </Text>
    </group>
  )
}

export default function CvssRing3D({ score = 0, severity = 'medium' }) {
  const { color } = getSeverityConfig(severity)
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={1} />
      <pointLight position={[2, 2, 2]} intensity={0.5} color={color} />
      <Ring score={score} color={color} />
    </Canvas>
  )
}
