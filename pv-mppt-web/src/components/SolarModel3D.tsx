import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Float, Sphere, MeshDistortMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

const SolarPanel = () => {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (group.current) {
      // Gentle floating and tilting
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1 - 0.5;
      group.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <group ref={group} rotation={[0.4, -0.5, 0]}>
      {/* Panel Base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[4, 0.1, 6]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Photovoltaic Cells */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[3.8, 0.02, 5.8]} />
        <meshPhysicalMaterial 
          color="#003366" 
          metalness={0.9} 
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          iridescence={0.3}
        />
      </mesh>
      
      {/* Grid Lines */}
      <gridHelper args={[6, 12, '#06b6d4', '#444']} position={[0, 0.08, 0]} rotation={[0, Math.PI / 2, 0]} />

      {/* Stand/Pole */}
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 3, 16]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.4} />
      </mesh>
    </group>
  );
};

export default function SolarModel3D() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={2} 
        color="#f97316" 
        castShadow 
      />
      <directionalLight position={[-5, 5, -5]} intensity={1} color="#06b6d4" />
      
      <Environment preset="city" />

      {/* Artificial Sun / Energy Core */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Sphere args={[0.8, 64, 64]} position={[3, 2, -2]}>
          <MeshDistortMaterial 
            color="#f97316" 
            emissive="#ea580c" 
            emissiveIntensity={2} 
            distort={0.4} 
            speed={2} 
          />
        </Sphere>
      </Float>

      {/* Main Panel */}
      <SolarPanel />
      
      {/* Glowing Energy Particles */}
      <Sparkles 
        count={200} 
        scale={10} 
        size={4} 
        speed={0.4} 
        opacity={0.5} 
        color="#06b6d4" 
      />
      <Sparkles 
        count={50} 
        scale={8} 
        size={10} 
        speed={1} 
        opacity={0.8} 
        color="#a855f7" 
      />
    </>
  );
}
