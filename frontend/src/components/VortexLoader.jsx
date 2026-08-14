import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const Vortex = () => {
  const ref = useRef();
  
  const count = 2000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const r = Math.random() * 2 + 0.1;
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 4;
    
    positions[i * 3] = r * Math.cos(theta);
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = r * Math.sin(theta);
    
    // Fire colors: Red to yellow based on radius
    const color = new THREE.Color();
    color.setHSL(0.1 + (1 - r/2) * 0.1, 1, 0.5);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.getElapsedTime();
    const pos = ref.current.geometry.attributes.position.array;
    
    for (let i = 0; i < count; i++) {
      const x = pos[i * 3];
      const z = pos[i * 3 + 2];
      const radius = Math.sqrt(x*x + z*z);
      
      // Swirl effect
      const speed = 2 / (radius + 0.5);
      const angle = Math.atan2(z, x) + speed * 0.05;
      
      pos[i * 3] = radius * Math.cos(angle);
      pos[i * 3 + 2] = radius * Math.sin(angle);
      
      // Pull upwards and inwards
      pos[i * 3 + 1] += 0.02;
      if (pos[i * 3 + 1] > 2) {
        pos[i * 3 + 1] = -2;
      }
    }
    
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.y = time * 0.5;
    ref.current.rotation.x = 0.2 * Math.sin(time * 0.5);
  });

  return (
    <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        vertexColors
        size={0.03}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

const VortexLoader = () => {
  return (
    <div className="w-full h-40 relative rounded-xl overflow-hidden glass-dark border border-ember-500/20 shadow-glow-ember">
      <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <Vortex />
      </Canvas>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p className="text-ember-50 font-bold text-lg tracking-widest uppercase bg-void-950/50 px-4 py-2 rounded-lg backdrop-blur-sm animate-pulse-amber">
          Forging Audio...
        </p>
      </div>
    </div>
  );
};

export default VortexLoader;
