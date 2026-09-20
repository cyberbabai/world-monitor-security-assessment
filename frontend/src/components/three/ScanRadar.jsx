import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Radar({ progress = 0, findings = [] }) {
  const sweepRef = useRef()
  const torusRef = useRef()
  const sweepAngle = (progress / 100) * Math.PI * 2

  useFrame(({ clock }) => {
    if (torusRef.current) {
      torusRef.current.rotation.z = clock.elapsedTime * 0.5
    }
  })

  const SEV_COLORS = { critical: '#FF453A', high: '#FF9F0A', medium: '#FFD60A', low: '#30D158' }

  const sweepPoints = []
  const segments = 64
  sweepPoints.push(new THREE.Vector3(0, 0, 0))
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * sweepAngle - Math.PI / 2
    sweepPoints.push(new THREE.Vector3(Math.cos(angle) * 2.2, Math.sin(angle) * 2.2, 0))
  }

  return (
    <group>
      <mesh ref={torusRef}>
        <torusGeometry args={[2.2, 0.02, 8, 80]} />
        <meshBasicMaterial color="#0A84FF" transparent opacity={0.3} />
      </mesh>

      <mesh>
        <torusGeometry args={[1.5, 0.01, 8, 80]} />
        <meshBasicMaterial color="#0A84FF" transparent opacity={0.15} />
      </mesh>

      <mesh>
        <torusGeometry args={[0.8, 0.01, 8, 80]} />
        <meshBasicMaterial color="#0A84FF" transparent opacity={0.1} />
      </mesh>

      {sweepAngle > 0 && (
        <mesh>
          <shapeGeometry args={[(() => {
            const shape = new THREE.Shape()
            shape.moveTo(0, 0)
            for (let i = 0; i <= segments; i++) {
              const angle = (i / segments) * sweepAngle - Math.PI / 2
              shape.lineTo(Math.cos(angle) * 2.2, Math.sin(angle) * 2.2)
            }
            shape.closePath()
            return shape
          })()]} />
          <meshBasicMaterial color="#0A84FF" transparent opacity={0.06} side={THREE.DoubleSide} />
        </mesh>
      )}

      {findings.map((f, i) => {
        const angle = (i / Math.max(findings.length, 1)) * Math.PI * 2 - Math.PI / 2
        const r = 1.8 + (i % 3) * 0.2
        return (
          <mesh key={i} position={[Math.cos(angle) * r, Math.sin(angle) * r, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial color={SEV_COLORS[f.severity] ?? '#636366'} />
          </mesh>
        )
      })}

      <mesh>
        <circleGeometry args={[0.08, 16]} />
        <meshBasicMaterial color="#0A84FF" />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[new THREE.CircleGeometry(2.2, 4)]} />
        <lineBasicMaterial color="#0A84FF" transparent opacity={0.08} />
      </lineSegments>
    </group>
  )
}

export default function ScanRadar({ progress = 0, findings = [] }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
    >
      <Radar progress={progress} findings={findings} />
    </Canvas>
  )
}
