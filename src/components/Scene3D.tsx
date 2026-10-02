import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'

// @react-three/fiber (<=9.8) still instantiates THREE.Clock internally; three r183+ warns on it.
// Route three's logs through its own hook and drop only that library-internal notice.
THREE.setConsoleFunction((type, message, ...params) => {
  if (type === 'warn' && message.startsWith('THREE.Clock:')) return
  ;(console[type as 'log' | 'warn' | 'error'] ?? console.log)(message, ...params)
})

/** Shared normalized cursor (-1..1), tracked on window so the canvas can sit behind UI. */
const pointer = { x: 0, y: 0 }
let scrollP = 0
function usePointer() {
  useEffect(() => {
    const f = (e: PointerEvent) => { pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = -(e.clientY / innerHeight) * 2 + 1 }
    const sc = () => { scrollP = Math.min(scrollY / innerHeight, 1.5) }
    addEventListener('pointermove', f, { passive: true }); addEventListener('scroll', sc, { passive: true })
    return () => { removeEventListener('pointermove', f); removeEventListener('scroll', sc) }
  }, [])
}

/** Amethyst crystal — a distorting icosahedron with a wireframe shell. */
function Crystal({ accent }: { accent: string }) {
  const g = useRef<THREE.Group>(null)
  const shell = useRef<THREE.Mesh>(null)
  useFrame((s, dt) => {
    if (!g.current) return
    const scroll = scrollP
    g.current.rotation.y += dt * (0.18 + scroll * 0.8)
    g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, pointer.y * 0.5, 0.05)
    g.current.position.x = THREE.MathUtils.lerp(g.current.position.x, pointer.x * 0.6, 0.04)
    g.current.scale.setScalar(1 + scroll * 0.35)
    if (shell.current) shell.current.rotation.z = s.clock.elapsedTime * -0.12
  })
  return (
    <Float speed={1.4} floatIntensity={0.8} rotationIntensity={0.3}>
      <group ref={g}>
        <mesh>
          <icosahedronGeometry args={[1.35, 8]} />
          <MeshDistortMaterial color="#1a0f3a" emissive={accent} emissiveIntensity={0.35} roughness={0.15} metalness={0.9} distort={0.38} speed={1.6} />
        </mesh>
        <mesh ref={shell} scale={1.65}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color={accent} wireframe transparent opacity={0.18} />
        </mesh>
        {[2.4, 3.1].map((r, i) => (
          <mesh key={r} rotation={[Math.PI / 2.3 + i * 0.5, i * 0.6, 0]}>
            <torusGeometry args={[r, 0.006, 8, 160]} />
            <meshBasicMaterial color={i ? '#ff3dbb' : '#3ef2ff'} transparent opacity={0.45} />
          </mesh>
        ))}
      </group>
    </Float>
  )
}

/** Particle field that drifts and is pushed away from the cursor. */
function Field({ count = 2600 }: { count?: number }) {
  const pts = useRef<THREE.Points>(null)
  const [base, pos, col] = useMemo(() => {
    const b = new Float32Array(count * 3), c = new Float32Array(count * 3)
    const cyan = new THREE.Color('#3ef2ff'), vio = new THREE.Color('#8b5cff'), mag = new THREE.Color('#ff3dbb')
    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 9, th = Math.random() * Math.PI * 2, y = (Math.random() - 0.5) * 9
      b.set([Math.cos(th) * r, y, Math.sin(th) * r - 2], i * 3)
      const k = Math.random(); const cc = k < 0.6 ? cyan : k < 0.9 ? vio : mag
      c.set([cc.r, cc.g, cc.b], i * 3)
    }
    return [b, b.slice(), c]
  }, [count])
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame((s) => {
    const p = pts.current; if (!p) return
    const t = s.clock.elapsedTime
    v.set(pointer.x * 6, pointer.y * 3.5, 0)
    const arr = p.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      const ix = i * 3
      let x = base[ix], y = base[ix + 1] + Math.sin(t * 0.3 + x) * 0.15
      const z = base[ix + 2]
      const dx = x - v.x, dy = y - v.y, d2 = dx * dx + dy * dy
      if (d2 < 4) { const f = (4 - d2) * 0.35; x += dx * f; y += dy * f }
      arr[ix] += (x - arr[ix]) * 0.08; arr[ix + 1] += (y - arr[ix + 1]) * 0.08; arr[ix + 2] = z
    }
    p.geometry.attributes.position.needsUpdate = true
    p.rotation.y = t * 0.02
  })
  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[col, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} vertexColors transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

function Rig() {
  useFrame(({ camera }) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.8, 0.03)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.5, 0.03)
    camera.lookAt(0, 0, 0)
  })
  return null
}

/**
 * Interactive WebGL backdrop over a static gradient fallback.
 * Renders only while on-screen (frameloop pauses off-screen), skipped entirely for reduced motion.
 */
export default function Scene3D({ crystal = true, accent = '#8b5cff', particles = 1400, className = '' }: { crystal?: boolean; accent?: string; particles?: number; className?: string }) {
  usePointer()
  const box = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const mobile = typeof innerWidth !== 'undefined' && innerWidth < 768
  useEffect(() => {
    if (!box.current) return
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: '100px' })
    io.observe(box.current)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={box} className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden style={{ background: `radial-gradient(50% 50% at 50% 50%, ${accent}22, transparent 70%)` }}>
      {!reduce && (
        <Canvas frameloop={on ? 'always' : 'never'} dpr={[1, mobile ? 1 : 1.5]} camera={{ position: [0, 0, 7], fov: 50 }} gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[4, 3, 4]} intensity={60} color="#3ef2ff" />
          <pointLight position={[-4, -2, 3]} intensity={50} color="#ff3dbb" />
          <Field count={mobile ? 400 : particles} />
          {crystal && <Crystal accent={accent} />}
          <Rig />
        </Canvas>
      )}
    </div>
  )
}
