/**
 * Procedural 3D furniture models for the Sidequest room.
 * All geometry is built from Three.js primitives — no external assets needed.
 * Claude can add new furniture by writing a new named export here.
 *
 * Coordinate convention:
 *   - Group origin is at the floor center of the furniture's tile footprint.
 *   - Y is up; Y=0 is the floor surface.
 *   - Models should stay within their tileW×tileH footprint (TILE_UNIT=2 per tile).
 *
 * Lighting is handled by the scene (directional + ambient), so meshStandardMaterial
 * shading comes for free — no manual face-color tricks needed.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// ─── Shared material helpers ─────────────────────────────────────────────────

function Matte({ color, roughness = 0.85, metalness = 0.05 }) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />;
}

function Metal({ color = '#888', roughness = 0.3, metalness = 0.8 }) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />;
}

function Emissive({ color, emissiveIntensity = 0.6 }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.9} />;
}

// ─── COUCH (2×1 tile footprint: -2..+2 x, -1..+1 z) ────────────────────────

export function CouchModel({ primaryColor = '#c4785a', secondaryColor = '#7a4e30' }) {
  return (
    <group>
      {/* Seat platform */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[3.5, 0.36, 1.55]} />
        <Matte color={secondaryColor} />
      </mesh>
      {/* Left cushion */}
      <mesh position={[-0.88, 0.44, 0.05]}>
        <boxGeometry args={[1.5, 0.2, 1.25]} />
        <Matte color={primaryColor} roughness={0.95} />
      </mesh>
      {/* Right cushion */}
      <mesh position={[0.88, 0.44, 0.05]}>
        <boxGeometry args={[1.5, 0.2, 1.25]} />
        <Matte color={primaryColor} roughness={0.95} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.8, -0.72]}>
        <boxGeometry args={[3.6, 0.8, 0.24]} />
        <Matte color={primaryColor} roughness={0.95} />
      </mesh>
      {/* Left armrest */}
      <mesh position={[-1.74, 0.5, 0]}>
        <boxGeometry args={[0.28, 0.64, 1.6]} />
        <Matte color={primaryColor} roughness={0.95} />
      </mesh>
      {/* Right armrest */}
      <mesh position={[1.74, 0.5, 0]}>
        <boxGeometry args={[0.28, 0.64, 1.6]} />
        <Matte color={primaryColor} roughness={0.95} />
      </mesh>
      {/* Legs */}
      {[[-1.5, -0.6], [1.5, -0.6], [-1.5, 0.6], [1.5, 0.6]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.06, lz]}>
          <boxGeometry args={[0.18, 0.14, 0.18]} />
          <Metal color="#3a2010" roughness={0.6} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// ─── BEAN BAG (1×1) ──────────────────────────────────────────────────────────

export function BeanBagModel({ primaryColor = '#7a5098' }) {
  return (
    <group>
      {/* Body — squished sphere */}
      <mesh position={[0, 0.46, 0]} scale={[1, 0.78, 0.92]}>
        <sphereGeometry args={[0.65, 14, 10]} />
        <Matte color={primaryColor} roughness={0.92} />
      </mesh>
      {/* Top seam highlight */}
      <mesh position={[0, 0.82, 0]} scale={[0.38, 0.18, 0.38]}>
        <sphereGeometry args={[0.65, 10, 8]} />
        <Matte color={primaryColor} roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── BAR STOOL (1×1) ─────────────────────────────────────────────────────────

export function BarStoolModel({ primaryColor = '#c8a840', secondaryColor = '#2a2a3a' }) {
  return (
    <group>
      {/* Seat */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.45, 0.42, 0.1, 12]} />
        <Matte color={primaryColor} />
      </mesh>
      {/* Seat cushion */}
      <mesh position={[0, 1.07, 0]} scale={[1, 0.5, 1]}>
        <sphereGeometry args={[0.42, 12, 6]} />
        <Matte color={primaryColor} roughness={0.95} />
      </mesh>
      {/* Central pole */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 1.1, 8]} />
        <Metal color={secondaryColor} />
      </mesh>
      {/* Base ring */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.06, 14]} />
        <Metal color={secondaryColor} />
      </mesh>
      {/* Footrest */}
      <mesh position={[0, 0.45, 0]}>
        <torusGeometry args={[0.28, 0.04, 6, 14]} />
        <Metal color={secondaryColor} />
      </mesh>
    </group>
  );
}

// ─── SWING (1×1) ─────────────────────────────────────────────────────────────

export function SwingModel({ primaryColor = '#a07040', secondaryColor = '#4a3020' }) {
  return (
    <group>
      {/* Frame left post */}
      <mesh position={[-0.5, 1.1, 0]}>
        <boxGeometry args={[0.1, 2.2, 0.1]} />
        <Matte color={secondaryColor} />
      </mesh>
      {/* Frame right post */}
      <mesh position={[0.5, 1.1, 0]}>
        <boxGeometry args={[0.1, 2.2, 0.1]} />
        <Matte color={secondaryColor} />
      </mesh>
      {/* Frame top bar */}
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[1.2, 0.1, 0.1]} />
        <Matte color={secondaryColor} />
      </mesh>
      {/* Left rope */}
      <mesh position={[-0.22, 1.55, 0]}>
        <boxGeometry args={[0.05, 1.3, 0.05]} />
        <Matte color="#c8b890" />
      </mesh>
      {/* Right rope */}
      <mesh position={[0.22, 1.55, 0]}>
        <boxGeometry args={[0.05, 1.3, 0.05]} />
        <Matte color="#c8b890" />
      </mesh>
      {/* Seat plank */}
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[0.55, 0.08, 0.32]} />
        <Matte color={primaryColor} />
      </mesh>
    </group>
  );
}

// ─── GAMING CHAIR (1×1) ──────────────────────────────────────────────────────

export function GamingChairModel({ primaryColor = '#282838', accentColor = '#c03030' }) {
  return (
    <group>
      {/* Base star */}
      {[0, 72, 144, 216, 288].map((deg, i) => (
        <mesh key={i} position={[Math.cos((deg * Math.PI) / 180) * 0.55, 0.04, Math.sin((deg * Math.PI) / 180) * 0.55]}>
          <boxGeometry args={[0.55, 0.06, 0.1]} />
          <Metal color="#222" />
        </mesh>
      ))}
      {/* Gas cylinder */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.6, 8]} />
        <Metal color="#555" />
      </mesh>
      {/* Seat pan */}
      <mesh position={[0, 0.62, 0.05]}>
        <boxGeometry args={[0.85, 0.12, 0.78]} />
        <Matte color={primaryColor} />
      </mesh>
      {/* Seat cushion */}
      <mesh position={[0, 0.72, 0.1]} scale={[1, 0.5, 0.95]}>
        <sphereGeometry args={[0.42, 10, 6]} />
        <Matte color={primaryColor} roughness={0.95} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 1.28, -0.38]}>
        <boxGeometry args={[0.82, 1.22, 0.16]} />
        <Matte color={primaryColor} />
      </mesh>
      {/* Accent stripe left */}
      <mesh position={[-0.38, 1.28, -0.32]}>
        <boxGeometry args={[0.08, 1.1, 0.06]} />
        <Matte color={accentColor} roughness={0.5} />
      </mesh>
      {/* Accent stripe right */}
      <mesh position={[0.38, 1.28, -0.32]}>
        <boxGeometry args={[0.08, 1.1, 0.06]} />
        <Matte color={accentColor} roughness={0.5} />
      </mesh>
      {/* Headrest */}
      <mesh position={[0, 1.96, -0.34]}>
        <boxGeometry args={[0.6, 0.3, 0.18]} />
        <Matte color={primaryColor} />
      </mesh>
      {/* Left armrest */}
      <mesh position={[-0.5, 0.9, -0.1]}>
        <boxGeometry args={[0.12, 0.08, 0.55]} />
        <Metal color="#333" />
      </mesh>
      {/* Right armrest */}
      <mesh position={[0.5, 0.9, -0.1]}>
        <boxGeometry args={[0.12, 0.08, 0.55]} />
        <Metal color="#333" />
      </mesh>
    </group>
  );
}

// ─── FLOOR CUSHION (1×1) ─────────────────────────────────────────────────────

export function FloorCushionModel({ primaryColor = '#d4906a' }) {
  return (
    <group>
      <mesh position={[0, 0.1, 0]} scale={[1, 0.55, 1]}>
        <sphereGeometry args={[0.7, 14, 8]} />
        <Matte color={primaryColor} roughness={0.95} />
      </mesh>
      {/* Seam lines */}
      <mesh position={[0, 0.12, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.5, 0.025, 4, 18]} />
        <Matte color={primaryColor} roughness={0.7} />
      </mesh>
    </group>
  );
}

// ─── TABLE (1×1) ─────────────────────────────────────────────────────────────

export function TableModel({ primaryColor = '#c4a060', secondaryColor = '#7a5c38' }) {
  return (
    <group>
      {/* Tabletop */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[1.55, 0.08, 1.55]} />
        <Matte color={primaryColor} roughness={0.7} />
      </mesh>
      {/* Legs */}
      {[[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.34, lz]}>
          <boxGeometry args={[0.1, 0.7, 0.1]} />
          <Matte color={secondaryColor} />
        </mesh>
      ))}
    </group>
  );
}

// ─── SHELF (1×1) ─────────────────────────────────────────────────────────────

export function ShelfModel({ primaryColor = '#a07848' }) {
  return (
    <group>
      {/* Back panel */}
      <mesh position={[0, 1.0, -0.72]}>
        <boxGeometry args={[1.7, 2.0, 0.08]} />
        <Matte color={primaryColor} roughness={0.7} />
      </mesh>
      {/* Side panels */}
      <mesh position={[-0.82, 1.0, -0.22]}>
        <boxGeometry args={[0.08, 2.0, 1.05]} />
        <Matte color={primaryColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.82, 1.0, -0.22]}>
        <boxGeometry args={[0.08, 2.0, 1.05]} />
        <Matte color={primaryColor} roughness={0.7} />
      </mesh>
      {/* Shelves */}
      {[0.12, 0.72, 1.32, 1.9].map((sy, i) => (
        <mesh key={i} position={[0, sy, -0.22]}>
          <boxGeometry args={[1.64, 0.06, 1.0]} />
          <Matte color={primaryColor} roughness={0.6} />
        </mesh>
      ))}
      {/* Decorative items on shelves (small boxes) */}
      <mesh position={[-0.3, 0.84, -0.42]}>
        <boxGeometry args={[0.22, 0.24, 0.18]} />
        <Matte color="#5577bb" />
      </mesh>
      <mesh position={[0.35, 0.84, -0.45]}>
        <boxGeometry args={[0.18, 0.3, 0.16]} />
        <Matte color="#cc7744" />
      </mesh>
    </group>
  );
}

// ─── LAMP (1×1) ──────────────────────────────────────────────────────────────

export function LampModel({ primaryColor = '#c8c090', accentColor = '#d4af37' }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.16, 12]} />
        <Metal color={accentColor} roughness={0.4} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.5, 8]} />
        <Metal color={accentColor} roughness={0.35} />
      </mesh>
      {/* Shade */}
      <mesh position={[0, 1.55, 0]}>
        <coneGeometry args={[0.5, 0.55, 14, 1, true]} />
        <meshStandardMaterial color={primaryColor} roughness={0.8} side={2} />
      </mesh>
      {/* Bulb glow */}
      <mesh position={[0, 1.38, 0]}>
        <sphereGeometry args={[0.08, 8, 6]} />
        <Emissive color="#fff8c0" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

// ─── POSTER (1×1) ────────────────────────────────────────────────────────────

export function PosterModel({ primaryColor = '#3355aa', accentColor = '#d4af37' }) {
  return (
    <group>
      {/* Frame */}
      <mesh position={[0, 1.2, -0.78]}>
        <boxGeometry args={[1.45, 1.85, 0.06]} />
        <Matte color="#2a1a0e" roughness={0.6} />
      </mesh>
      {/* Poster paper */}
      <mesh position={[0, 1.2, -0.74]}>
        <boxGeometry args={[1.3, 1.7, 0.02]} />
        <Matte color={primaryColor} roughness={0.95} />
      </mesh>
      {/* Design accent */}
      <mesh position={[0, 1.3, -0.72]}>
        <boxGeometry args={[0.9, 0.08, 0.02]} />
        <Matte color={accentColor} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.1, -0.72]}>
        <boxGeometry args={[0.6, 0.08, 0.02]} />
        <Matte color={accentColor} roughness={0.6} />
      </mesh>
    </group>
  );
}

// ─── ARCADE MACHINE (1×1) ────────────────────────────────────────────────────

export function ArcadeModel({ primaryColor = '#1a1a2e', accentColor = '#4488ff' }) {
  return (
    <group>
      {/* Cabinet body */}
      <mesh position={[0, 0.95, -0.18]}>
        <boxGeometry args={[1.1, 1.9, 1.0]} />
        <Matte color={primaryColor} roughness={0.6} />
      </mesh>
      {/* Screen bezel */}
      <mesh position={[0, 1.3, 0.34]}>
        <boxGeometry args={[0.86, 0.7, 0.06]} />
        <Matte color="#111" roughness={0.4} />
      </mesh>
      {/* Screen glow */}
      <mesh position={[0, 1.3, 0.38]}>
        <boxGeometry args={[0.74, 0.58, 0.02]} />
        <Emissive color={accentColor} emissiveIntensity={0.8} />
      </mesh>
      {/* Control panel */}
      <mesh position={[0, 0.8, 0.42]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.9, 0.06, 0.38]} />
        <Matte color="#222" roughness={0.4} />
      </mesh>
      {/* Joystick */}
      <mesh position={[-0.22, 0.88, 0.55]}>
        <sphereGeometry args={[0.065, 8, 6]} />
        <Metal color="#cc3333" roughness={0.3} />
      </mesh>
      {/* Buttons */}
      {[[0.12, 0.58], [0.3, 0.58], [0.21, 0.5]].map(([bx, bz], i) => (
        <mesh key={i} position={[bx, 0.88, bz]}>
          <cylinderGeometry args={[0.05, 0.05, 0.04, 8]} />
          <Emissive color={i === 0 ? '#ff4444' : i === 1 ? '#44ff44' : '#ffff44'} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ─── JUKEBOX (1×1) ───────────────────────────────────────────────────────────

export function JukeboxModel({ primaryColor = '#1a0a0a', accentColor = '#cc4444' }) {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[1.1, 2.0, 0.7]} />
        <Matte color={primaryColor} roughness={0.5} />
      </mesh>
      {/* Dome top */}
      <mesh position={[0, 2.08, 0]} scale={[1, 0.5, 0.7]}>
        <sphereGeometry args={[0.55, 12, 8]} />
        <meshStandardMaterial color={primaryColor} roughness={0.5} transparent opacity={0.7} />
      </mesh>
      {/* Grill slats */}
      {[-0.22, 0, 0.22].map((sy, i) => (
        <mesh key={i} position={[0, 0.8 + sy * 0.6, 0.37]}>
          <boxGeometry args={[0.8, 0.06, 0.04]} />
          <Metal color={accentColor} roughness={0.4} />
        </mesh>
      ))}
      {/* Record window glow */}
      <mesh position={[0, 1.55, 0.37]}>
        <boxGeometry args={[0.65, 0.55, 0.04]} />
        <Emissive color={accentColor} emissiveIntensity={0.5} />
      </mesh>
      {/* Chrome trim */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[1.14, 0.08, 0.74]} />
        <Metal color="#888" />
      </mesh>
    </group>
  );
}

// ─── TV (1×1) ────────────────────────────────────────────────────────────────

export function TVModel({ primaryColor = '#1a1a1a', accentColor = '#3366ff' }) {
  return (
    <group>
      {/* Stand base */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.7, 0.12, 0.5]} />
        <Metal color="#333" roughness={0.5} />
      </mesh>
      {/* Stand neck */}
      <mesh position={[0, 0.28, -0.08]}>
        <boxGeometry args={[0.12, 0.3, 0.12]} />
        <Metal color="#333" roughness={0.5} />
      </mesh>
      {/* Screen bezel */}
      <mesh position={[0, 0.95, -0.28]}>
        <boxGeometry args={[1.7, 1.0, 0.1]} />
        <Matte color={primaryColor} roughness={0.4} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0.95, -0.22]}>
        <boxGeometry args={[1.55, 0.86, 0.04]} />
        <Emissive color={accentColor} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

// ─── PLANT (1×1) ─────────────────────────────────────────────────────────────

export function PlantModel({ primaryColor = '#4a9c4a', potColor = '#c4785a' }) {
  return (
    <group>
      {/* Pot */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.32, 0.42, 0.56, 12]} />
        <Matte color={potColor} roughness={0.8} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.57, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.06, 12]} />
        <Matte color="#3a2810" roughness={0.95} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.5, 6]} />
        <Matte color="#2d5a1e" roughness={0.9} />
      </mesh>
      {/* Leaf clusters */}
      <mesh position={[0, 1.18, 0]} scale={[1, 0.85, 1]}>
        <sphereGeometry args={[0.5, 12, 9]} />
        <Matte color={primaryColor} roughness={0.9} />
      </mesh>
      <mesh position={[-0.3, 1.02, 0.2]} scale={[0.7, 0.7, 0.7]}>
        <sphereGeometry args={[0.38, 10, 7]} />
        <Matte color="#3d8c3d" roughness={0.9} />
      </mesh>
      <mesh position={[0.28, 1.0, -0.15]} scale={[0.65, 0.65, 0.65]}>
        <sphereGeometry args={[0.38, 10, 7]} />
        <Matte color="#56a856" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─── RUG (2×1) ───────────────────────────────────────────────────────────────

export function RugModel({ primaryColor = '#8855aa', accentColor = '#c4a030' }) {
  return (
    <group>
      {/* Rug base */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[3.8, 0.04, 1.8]} />
        <Matte color={primaryColor} roughness={0.98} />
      </mesh>
      {/* Border pattern */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[3.5, 0.01, 1.5]} />
        <Matte color={accentColor} roughness={0.95} />
      </mesh>
      {/* Center medallion */}
      <mesh position={[0, 0.05, 0]} scale={[1, 1, 0.62]}>
        <cylinderGeometry args={[0.58, 0.58, 0.01, 16]} />
        <Matte color={primaryColor} roughness={0.95} />
      </mesh>
    </group>
  );
}

// ─── CEILING LIGHT (1×1) ─────────────────────────────────────────────────────

export function CeilingLightModel({ primaryColor = '#e8e0c8', accentColor = '#d4af37' }) {
  return (
    <group>
      {/* Ceiling mount */}
      <mesh position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.1, 8]} />
        <Metal color={accentColor} />
      </mesh>
      {/* Chain */}
      <mesh position={[0, 2.18, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 1.24, 4]} />
        <Metal color="#888" roughness={0.5} />
      </mesh>
      {/* Shade */}
      <mesh position={[0, 1.52, 0]}>
        <cylinderGeometry args={[0.55, 0.28, 0.45, 14, 1, true]} />
        <meshStandardMaterial color={primaryColor} roughness={0.8} side={2} />
      </mesh>
      {/* Shade rim */}
      <mesh position={[0, 1.3, 0]}>
        <torusGeometry args={[0.55, 0.035, 6, 14]} />
        <Metal color={accentColor} />
      </mesh>
      {/* Bulb */}
      <mesh position={[0, 1.58, 0]}>
        <sphereGeometry args={[0.11, 8, 6]} />
        <Emissive color="#fff8c0" emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
}

// ─── BOOKCASE (1×1) ──────────────────────────────────────────────────────────

export function BookcaseModel({ primaryColor = '#7a5030' }) {
  const bookColors = ['#c84040', '#4060c8', '#40a040', '#c8a030', '#8040a8', '#c87040'];
  return (
    <group>
      {/* Frame */}
      <mesh position={[0, 1.1, -0.65]}>
        <boxGeometry args={[1.7, 2.2, 0.08]} />
        <Matte color={primaryColor} roughness={0.7} />
      </mesh>
      <mesh position={[-0.82, 1.1, -0.18]}>
        <boxGeometry args={[0.08, 2.2, 1.0]} />
        <Matte color={primaryColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.82, 1.1, -0.18]}>
        <boxGeometry args={[0.08, 2.2, 1.0]} />
        <Matte color={primaryColor} roughness={0.7} />
      </mesh>
      {/* Shelves */}
      {[0.08, 0.78, 1.45, 2.1].map((sy, i) => (
        <mesh key={i} position={[0, sy, -0.18]}>
          <boxGeometry args={[1.64, 0.07, 1.0]} />
          <Matte color={primaryColor} roughness={0.7} />
        </mesh>
      ))}
      {/* Books on shelves */}
      {[0, 1, 2].map((shelf) =>
        [0, 1, 2, 3, 4].map((book) => (
          <mesh key={`${shelf}-${book}`} position={[-0.6 + book * 0.28, 0.45 + shelf * 0.66, -0.38]}>
            <boxGeometry args={[0.2, 0.55 + (book % 3) * 0.07, 0.18]} />
            <Matte color={bookColors[(shelf * 5 + book) % bookColors.length]} roughness={0.8} />
          </mesh>
        ))
      )}
    </group>
  );
}

// ─── DOG (1×1, animated) ─────────────────────────────────────────────────────

export function DogModel({ primaryColor = '#c8a060', accentColor = '#7a5030' }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      // Gentle tail-wag style bobbing
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.8) * 0.25;
    }
  });
  return (
    <group ref={ref}>
      {/* Body */}
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.72, 0.42, 1.05]} />
        <Matte color={primaryColor} roughness={0.9} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.58, -0.55]}>
        <boxGeometry args={[0.52, 0.46, 0.44]} />
        <Matte color={primaryColor} roughness={0.9} />
      </mesh>
      {/* Snout */}
      <mesh position={[0, 0.48, -0.78]}>
        <boxGeometry args={[0.28, 0.24, 0.2]} />
        <Matte color={accentColor} roughness={0.9} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.22, 0.78, -0.55]}>
        <boxGeometry args={[0.14, 0.28, 0.12]} />
        <Matte color={accentColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.22, 0.78, -0.55]}>
        <boxGeometry args={[0.14, 0.28, 0.12]} />
        <Matte color={accentColor} roughness={0.9} />
      </mesh>
      {/* Legs */}
      {[[-0.24, -0.5], [0.24, -0.5], [-0.24, 0.38], [0.24, 0.38]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.1, lz]}>
          <boxGeometry args={[0.18, 0.22, 0.22]} />
          <Matte color={primaryColor} roughness={0.9} />
        </mesh>
      ))}
      {/* Tail */}
      <mesh position={[0, 0.48, 0.6]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.1, 0.08, 0.45]} />
        <Matte color={primaryColor} roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─── CACTUS (1×1, animated) ──────────────────────────────────────────────────

export function CactusModel({ primaryColor = '#3a8a3a', accentColor = '#c84040' }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.08;
    }
  });
  return (
    <group ref={ref}>
      {/* Pot */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.3, 0.38, 0.44, 10]} />
        <Matte color="#c4785a" roughness={0.85} />
      </mesh>
      {/* Main trunk */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 1.1, 8]} />
        <Matte color={primaryColor} roughness={0.8} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.3, 0.9, 0]} rotation={[0, 0, -1.1]}>
        <cylinderGeometry args={[0.12, 0.14, 0.55, 7]} />
        <Matte color={primaryColor} roughness={0.8} />
      </mesh>
      <mesh position={[-0.52, 1.12, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.35, 7]} />
        <Matte color={primaryColor} roughness={0.8} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.3, 1.05, 0]} rotation={[0, 0, 1.1]}>
        <cylinderGeometry args={[0.12, 0.14, 0.55, 7]} />
        <Matte color={primaryColor} roughness={0.8} />
      </mesh>
      <mesh position={[0.52, 1.28, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.35, 7]} />
        <Matte color={primaryColor} roughness={0.8} />
      </mesh>
      {/* Flower on top */}
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.15, 8, 6]} />
        <Emissive color={accentColor} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// ─── BAR COUNTER (3×1) ───────────────────────────────────────────────────────

export function BarCounterModel({ primaryColor = '#8a5c28', accentColor = '#d4af37' }) {
  return (
    <group>
      {/* Counter top */}
      <mesh position={[0, 0.88, -0.1]}>
        <boxGeometry args={[5.8, 0.12, 1.45]} />
        <Matte color={accentColor} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Counter body */}
      <mesh position={[0, 0.44, -0.28]}>
        <boxGeometry args={[5.8, 0.8, 1.1]} />
        <Matte color={primaryColor} roughness={0.75} />
      </mesh>
      {/* Front panel detail */}
      <mesh position={[0, 0.44, 0.28]}>
        <boxGeometry args={[5.8, 0.78, 0.06]} />
        <Matte color="#6a4418" roughness={0.8} />
      </mesh>
      {/* Support legs */}
      {[-2.5, 0, 2.5].map((lx, i) => (
        <mesh key={i} position={[lx, 0.04, -0.28]}>
          <boxGeometry args={[0.18, 0.1, 1.0]} />
          <Matte color={primaryColor} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ─── DISPATCH: type string → model component ─────────────────────────────────

const MODEL_MAP = {
  couch:         CouchModel,
  listencouch:   CouchModel,
  beanbag:       BeanBagModel,
  afkbeanbag:    BeanBagModel,
  barstool:      BarStoolModel,
  swing:         SwingModel,
  gamingchair:   GamingChairModel,
  floorcushion:  FloorCushionModel,
  listencushion: FloorCushionModel,
  table:         TableModel,
  shelf:         ShelfModel,
  lamp:          LampModel,
  poster:        PosterModel,
  arcade:        ArcadeModel,
  jukebox:       JukeboxModel,
  tv:            TVModel,
  plant:         PlantModel,
  rug:           RugModel,
  ceilinglight:  CeilingLightModel,
  bookcase:      BookcaseModel,
  dog:           DogModel,
  cactus:        CactusModel,
  barcounter:    BarCounterModel,
};

/** Render the correct model for a given furniture type. */
export function FurnitureBody({ type, primaryColor, secondaryColor, accentColor }) {
  const Model = MODEL_MAP[type];
  if (!Model) return null;
  return <Model primaryColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor} />;
}
