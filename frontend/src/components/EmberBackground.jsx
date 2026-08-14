import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const Embers = () => {
  const ref = useRef();
  
  const count = 1000;
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Scatter embers widely in 3D space
      p[i * 3] = (Math.random() - 0.5) * 15; // x
      p[i * 3 + 1] = (Math.random() - 0.5) * 15; // y
      p[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2; // z
    }
    return p;
  }, [count]);

  const velocities = useMemo(() => {
    const v = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      v[i * 3] = (Math.random() - 0.5) * 0.01; // dx
      v[i * 3 + 1] = Math.random() * 0.02 + 0.01; // dy (rising up)
      v[i * 3 + 2] = (Math.random() - 0.5) * 0.01; // dz
    }
    return v;
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i * 3]; // x
      pos[i * 3 + 1] += velocities[i * 3 + 1]; // y
      pos[i * 3 + 2] += Math.sin(state.clock.elapsedTime + i) * 0.005; // slight wave in z

      // Reset ember if it goes too high
      if (pos[i * 3 + 1] > 8) {
        pos[i * 3 + 1] = -8;
        pos[i * 3] = (Math.random() - 0.5) * 15;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    
    // Slow rotation of the whole system
    ref.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#ffa62e"
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
};

const EmberBackground = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-void-950">
      <Canvas camera={{ position: [0, 0, 5] }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <Embers />
      </Canvas>
      {/* Subtle overlay gradient to darken the edges and bottom */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-void-950/80 to-void-950"></div>
    </div>
  );
};

export default EmberBackground;
