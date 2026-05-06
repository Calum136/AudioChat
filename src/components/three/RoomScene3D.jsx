/**
 * RoomScene3D — React Three Fiber scene replacing the pixel-art isometric canvas.
 *
 * Architecture:
 *  - OrthographicCamera at the classic isometric angle (45° azimuth, ~35° elevation)
 *  - Auto-fit zoom: room fills the viewport, user adjusts relative to that
 *  - Floor tiles: thin BoxGeometry planes (checker pattern per theme)
 *  - Walls: flat BoxGeometry back panels (only hasWalls themes)
 *  - Furniture: FurnitureBody models + seat targets + edit HTML controls
 *  - Drag: scene-level dragging state; floor plane fires onPointerMove during drag
 *  - Avatars: simple capsule + sphere head + Html name label
 */

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

import { useRoomStore } from '../../stores/roomStore';
import { useAuthStore } from '../../stores/authStore';
import { useVoiceStore } from '../../stores/voiceStore';
import { FURNITURE_CATALOG } from '../../data/furniture';
import { ROOM_SHAPES, isInMask } from '../../data/roomShapes';
import { TILE_UNIT, tileToWorld, furnitureWorldPos, worldToTile, roomCenter } from '../../lib/grid3d';
import { FurnitureBody } from './FurnitureModels';

// ─── Theme 3D colour maps ────────────────────────────────────────────────────

const THEME_3D = {
  'gaming-den': {
    floorA: '#1a1428', floorB: '#201830',
    wallColor: '#2a1f38', wallTrim: '#3d2d4a',
    bg: '#0d0d18',
    ambientIntensity: 0.35, dirIntensity: 1.1, dirColor: '#fff4e0',
  },
  'scifi-lounge': {
    floorA: '#0d1a2e', floorB: '#122038',
    wallColor: null,
    bg: '#080d1a',
    ambientIntensity: 0.3, dirIntensity: 0.9, dirColor: '#c0e8ff',
  },
  'fantasy-tavern': {
    floorA: '#2a1810', floorB: '#321c12',
    wallColor: '#3a2818', wallTrim: '#5a4020',
    bg: '#140e08',
    ambientIntensity: 0.4, dirIntensity: 0.95, dirColor: '#ffe8c0',
  },
  'retro-arcade': {
    floorA: '#1a0d28', floorB: '#200d30',
    wallColor: null,
    bg: '#100820',
    ambientIntensity: 0.28, dirIntensity: 0.85, dirColor: '#e0c0ff',
  },
};

// ─── Furniture default colours ───────────────────────────────────────────────

const FURNITURE_COLORS = {
  couch:         { primaryColor: '#c4785a', secondaryColor: '#7a4e30' },
  listencouch:   { primaryColor: '#5a78c4', secondaryColor: '#304e7a' },
  beanbag:       { primaryColor: '#7a5098' },
  afkbeanbag:    { primaryColor: '#506070' },
  barstool:      { primaryColor: '#c8a840', secondaryColor: '#2a2a3a' },
  swing:         { primaryColor: '#a07040', secondaryColor: '#4a3020' },
  gamingchair:   { primaryColor: '#282838', accentColor: '#c03030' },
  floorcushion:  { primaryColor: '#d4906a' },
  listencushion: { primaryColor: '#6a90d4' },
  table:         { primaryColor: '#c4a060', secondaryColor: '#7a5c38' },
  shelf:         { primaryColor: '#a07848' },
  lamp:          { primaryColor: '#c8c090', accentColor: '#d4af37' },
  poster:        { primaryColor: '#3355aa', accentColor: '#d4af37' },
  arcade:        { primaryColor: '#1a1a2e', accentColor: '#4488ff' },
  jukebox:       { primaryColor: '#1a0a0a', accentColor: '#cc4444' },
  tv:            { primaryColor: '#1a1a1a', accentColor: '#3366ff' },
  plant:         { primaryColor: '#4a9c4a', potColor: '#c4785a' },
  rug:           { primaryColor: '#8855aa', accentColor: '#c4a030' },
  ceilinglight:  { primaryColor: '#e8e0c8', accentColor: '#d4af37' },
  bookcase:      { primaryColor: '#7a5030' },
  dog:           { primaryColor: '#c8a060', accentColor: '#7a5030' },
  cactus:        { primaryColor: '#3a8a3a', accentColor: '#c84040' },
  barcounter:    { primaryColor: '#8a5c28', accentColor: '#d4af37' },
};

const SEAT_DOT_COLOR = {
  sit: '#d4af37', stand: '#60c860', listen: '#4488cc', afk: '#888888',
};

// ─── Seat click target + avatar indicator ────────────────────────────────────

function SeatTarget({ furnitureId, seatIndex, seat }) {
  const user = useAuthStore((s) => s.user);
  const participants = useRoomStore((s) => s.participants);
  const isEditing = useRoomStore((s) => s.isEditing);
  const sitDown = useRoomStore((s) => s.sitDown);
  const standUp = useRoomStore((s) => s.standUp);
  const speakingMap = useVoiceStore((s) => s.speakingMap);

  const pos3d = seat.pos3d || [0, 0.5, 0];
  const seatType = seat.type || 'sit';
  const dotColor = SEAT_DOT_COLOR[seatType] || SEAT_DOT_COLOR.sit;

  const occupant = Object.values(participants).find(
    (p) => p.seatFurnitureId === furnitureId && p.seatIndex === seatIndex
  );
  const iAmHere = occupant && user && occupant.id === user.id;
  const isSpeaking = occupant && speakingMap[occupant.id];

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (isEditing || !user) return;
    if (iAmHere) {
      standUp(user.id);
    } else if (!occupant) {
      const me = participants[user.id];
      if (me?.seatFurnitureId) standUp(user.id);
      sitDown(user.id, furnitureId, seatIndex);
    }
  }, [isEditing, user, iAmHere, occupant, participants, sitDown, standUp, furnitureId, seatIndex]);

  return (
    <group position={pos3d}>
      <mesh onClick={handleClick}>
        <sphereGeometry args={[occupant ? 0.22 : 0.1, 10, 8]} />
        <meshStandardMaterial
          color={occupant ? (occupant.color || '#5577bb') : dotColor}
          emissive={occupant
            ? (isSpeaking ? '#00ff88' : iAmHere ? '#ffffff' : '#000000')
            : dotColor}
          emissiveIntensity={occupant ? (isSpeaking ? 0.5 : iAmHere ? 0.15 : 0) : 0.7}
          roughness={0.7}
          transparent={!occupant}
          opacity={occupant ? 1 : 0.75}
        />
      </mesh>
      {occupant && (
        <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div style={{
            fontSize: 10, color: '#fff', background: 'rgba(0,0,0,0.65)',
            padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap',
            transform: 'translateY(-28px)', textShadow: '0 1px 2px #000',
          }}>
            {occupant.displayName}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Individual furniture 3D group ───────────────────────────────────────────

function FurnitureItem3D({ item, isEditing, onDragStart }) {
  const removeFurniture = useRoomStore((s) => s.removeFurniture);
  const flipFurniture = useRoomStore((s) => s.flipFurniture);
  const participants = useRoomStore((s) => s.participants);
  const sitDown = useRoomStore((s) => s.sitDown);
  const standUp = useRoomStore((s) => s.standUp);
  const user = useAuthStore((s) => s.user);

  const catalog = FURNITURE_CATALOG[item.type];
  if (!catalog) return null;

  const worldPos = furnitureWorldPos(item.x, item.y, catalog.tileW, catalog.tileH);
  const colors = FURNITURE_COLORS[item.type] || {};
  const hasOccupants = Object.values(participants).some((p) => p.seatFurnitureId === item.id);
  const dragStartRef = useRef(null);
  const [wasDragged, setWasDragged] = useState(false);

  const handlePointerDown = useCallback((e) => {
    if (!isEditing) return;
    e.stopPropagation();
    dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
    setWasDragged(false);
  }, [isEditing]);

  const handlePointerMove = useCallback((e) => {
    if (!isEditing || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    if (Math.hypot(dx, dy) > 5) {
      setWasDragged(true);
      dragStartRef.current = null;
      onDragStart(item);
    }
  }, [isEditing, item, onDragStart]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (isEditing || wasDragged) return;
    if (!user || catalog.seats.length === 0) return;
    const me = participants[user.id];
    if (me?.seatFurnitureId === item.id) { standUp(user.id); return; }
    const emptyIdx = catalog.seats.findIndex((_, i) =>
      !Object.values(participants).some((p) => p.seatFurnitureId === item.id && p.seatIndex === i)
    );
    if (emptyIdx < 0) return;
    if (me?.seatFurnitureId) standUp(user.id);
    sitDown(user.id, item.id, emptyIdx);
  }, [isEditing, wasDragged, user, catalog, item, participants, sitDown, standUp]);

  const handleContextMenu = useCallback((e) => {
    e.stopPropagation();
    if (!isEditing) return;
    flipFurniture(item.id);
  }, [isEditing, flipFurniture, item.id]);

  return (
    <group
      position={worldPos}
      rotation={[0, item.flipped ? Math.PI : 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <FurnitureBody type={item.type} {...colors} />

      {catalog.seats.map((seat, i) => (
        <SeatTarget key={i} furnitureId={item.id} seatIndex={i} seat={seat} />
      ))}

      {isEditing && !hasOccupants && (
        <Html position={[0, 2.8, 0]} center distanceFactor={10}>
          <button
            style={{
              background: '#c83030', color: '#fff', border: 'none',
              borderRadius: '50%', width: 22, height: 22, cursor: 'pointer',
              fontSize: 14, lineHeight: '22px', fontWeight: 'bold',
            }}
            onClick={(e) => { e.stopPropagation(); removeFurniture(item.id); }}
          >×</button>
        </Html>
      )}
    </group>
  );
}

// ─── Standing avatar ─────────────────────────────────────────────────────────

function Avatar3D({ participant, gx, gy }) {
  const user = useAuthStore((s) => s.user);
  const speakingMap = useVoiceStore((s) => s.speakingMap);
  const isMe = user && participant.id === user.id;
  const isSpeaking = speakingMap[participant.id];
  const color = participant.color || '#5577bb';
  const worldPos = tileToWorld(gx, gy);

  return (
    <group position={worldPos}>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.22, 0.2, 0.7, 10]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.08, 0]}>
        <sphereGeometry args={[0.26, 12, 9]} />
        <meshStandardMaterial
          color={color} roughness={0.7}
          emissive={isSpeaking ? '#00ff88' : isMe ? '#ffffff' : '#000000'}
          emissiveIntensity={isSpeaking ? 0.5 : isMe ? 0.2 : 0}
        />
      </mesh>
      {isSpeaking && (
        <mesh position={[0, 1.08, 0]}>
          <torusGeometry args={[0.35, 0.04, 6, 16]} />
          <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.8} roughness={0.3} />
        </mesh>
      )}
      <Html position={[0, 1.55, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div style={{
          fontSize: 10, color: isMe ? '#d4af37' : '#fff',
          background: 'rgba(0,0,0,0.65)', padding: '1px 5px',
          borderRadius: 4, whiteSpace: 'nowrap', textShadow: '0 1px 2px #000',
          border: isMe ? '1px solid #d4af37' : 'none',
        }}>
          {participant.displayName}
        </div>
      </Html>
    </group>
  );
}

// ─── Floor tiles ─────────────────────────────────────────────────────────────

function FloorTiles({ shape, t3d }) {
  const { gridW, gridH, mask } = shape;
  return useMemo(() => {
    const tiles = [];
    for (let gx = 0; gx < gridW; gx++) {
      for (let gy = 0; gy < gridH; gy++) {
        if (!isInMask(gx, gy, mask)) continue;
        const color = (gx + gy) % 2 === 0 ? t3d.floorA : t3d.floorB;
        tiles.push(
          <mesh key={`${gx}-${gy}`} position={[(gx + 0.5) * TILE_UNIT, -0.025, (gy + 0.5) * TILE_UNIT]} receiveShadow>
            <boxGeometry args={[TILE_UNIT - 0.04, 0.05, TILE_UNIT - 0.04]} />
            <meshStandardMaterial color={color} roughness={0.8} metalness={0.05} />
          </mesh>
        );
      }
    }
    return <>{tiles}</>;
  }, [gridW, gridH, mask, t3d]);
}

// ─── Walls ───────────────────────────────────────────────────────────────────

function Walls({ shape, t3d }) {
  if (!shape.hasWalls || !t3d.wallColor) return null;
  const { gridW, gridH } = shape;
  const W = gridW * TILE_UNIT, D = gridH * TILE_UNIT;
  const H = 3.8, T = 0.18;
  return (
    <group>
      <mesh position={[W / 2, H / 2, -T / 2]}>
        <boxGeometry args={[W + T, H, T]} />
        <meshStandardMaterial color={t3d.wallColor} roughness={0.85} />
      </mesh>
      <mesh position={[-T / 2, H / 2, D / 2]}>
        <boxGeometry args={[T, H, D + T]} />
        <meshStandardMaterial color={t3d.wallColor} roughness={0.85} />
      </mesh>
      <mesh position={[W / 2, 0.12, -T]}>
        <boxGeometry args={[W + T, 0.24, 0.08]} />
        <meshStandardMaterial color={t3d.wallTrim || '#555'} roughness={0.6} />
      </mesh>
      <mesh position={[-T, 0.12, D / 2]}>
        <boxGeometry args={[0.08, 0.24, D + T]} />
        <meshStandardMaterial color={t3d.wallTrim || '#555'} roughness={0.6} />
      </mesh>
    </group>
  );
}

// ─── Edit grid overlay ───────────────────────────────────────────────────────

function EditGrid({ shape, furniture }) {
  const occupied = useMemo(() => {
    const s = new Set();
    for (const f of furniture) {
      const cat = FURNITURE_CATALOG[f.type];
      if (!cat) continue;
      for (let dx = 0; dx < cat.tileW; dx++)
        for (let dy = 0; dy < cat.tileH; dy++)
          s.add(`${f.x + dx},${f.y + dy}`);
    }
    return s;
  }, [furniture]);

  const { gridW, gridH, mask } = shape;
  return useMemo(() => {
    const cells = [];
    for (let gx = 0; gx < gridW; gx++) {
      for (let gy = 0; gy < gridH; gy++) {
        if (!isInMask(gx, gy, mask)) continue;
        const color = occupied.has(`${gx},${gy}`) ? '#cc3333' : '#33cc66';
        cells.push(
          <mesh key={`eg-${gx}-${gy}`} position={[(gx + 0.5) * TILE_UNIT, 0.04, (gy + 0.5) * TILE_UNIT]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[TILE_UNIT - 0.1, TILE_UNIT - 0.1]} />
            <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} />
          </mesh>
        );
      }
    }
    return <>{cells}</>;
  }, [gridW, gridH, mask, occupied]);
}

// ─── Point lights for emissive furniture ─────────────────────────────────────

const FURNITURE_LIGHTS = {
  lamp:         { color: '#fff8c0', intensity: 1.2, dist: 10 },
  arcade:       { color: '#4488ff', intensity: 0.7, dist:  7 },
  jukebox:      { color: '#cc4444', intensity: 0.7, dist:  7 },
  tv:           { color: '#3366ff', intensity: 0.6, dist:  7 },
  ceilinglight: { color: '#fff8c0', intensity: 1.5, dist: 12 },
};

function FurnitureLights({ furniture }) {
  return (
    <>
      {furniture.map((f) => {
        const lp = FURNITURE_LIGHTS[f.type];
        if (!lp) return null;
        const cat = FURNITURE_CATALOG[f.type];
        const [wx, , wz] = furnitureWorldPos(f.x, f.y, cat?.tileW, cat?.tileH);
        return <pointLight key={f.id} position={[wx, 2.5, wz]} color={lp.color} intensity={lp.intensity} distance={lp.dist} decay={2} />;
      })}
    </>
  );
}

// ─── Camera controller: orthographic isometric, auto-fit + user zoom ─────────

function IsoCamera({ shape, userZoom }) {
  const ref = useRef();
  const { size } = useThree();
  const [cx, , cz] = roomCenter(shape.gridW, shape.gridH);

  // Compute camera position for isometric view (45° azimuth, ~35° elevation)
  const D = 30;
  const camPos = useMemo(() => [cx + D, D * 0.85, cz + D], [cx, cz]);

  // Auto-fit zoom: scale so the room fills the canvas at userZoom=1
  const baseZoom = useMemo(() => {
    const W = (shape.gridW + shape.gridH) * TILE_UNIT * Math.SQRT2 * 0.5 + 5;
    const H = (shape.gridW + shape.gridH) * TILE_UNIT * Math.SQRT2 * 0.25 + 8;
    return Math.min(size.width / W, size.height / H) * 0.88;
  }, [shape, size.width, size.height]);

  useEffect(() => {
    const cam = ref.current;
    if (!cam) return;
    cam.position.set(...camPos);
    cam.lookAt(cx, 0, cz);
    cam.zoom = baseZoom * userZoom;
    cam.updateProjectionMatrix();
  }, [camPos, cx, cz, baseZoom, userZoom]);

  return <perspectiveCamera ref={ref} />;
}

// ─── Scene contents (must be inside Canvas for useThree) ─────────────────────

function SceneContents({ theme, userZoom, onFloorClick }) {
  const furniture = useRoomStore((s) => s.furniture);
  const participants = useRoomStore((s) => s.participants);
  const isEditing = useRoomStore((s) => s.isEditing);
  const selectedType = useRoomStore((s) => s.selectedFurnitureType);
  const moveFurniture = useRoomStore((s) => s.moveFurniture);

  const shape = ROOM_SHAPES[theme] || ROOM_SHAPES['gaming-den'];
  const t3d = THEME_3D[theme] || THEME_3D['gaming-den'];
  const [cx, , cz] = roomCenter(shape.gridW, shape.gridH);

  const { camera, scene, size } = useThree();

  // Background colour
  useEffect(() => {
    scene.background = new THREE.Color(t3d.bg);
  }, [scene, t3d.bg]);

  // Setup camera manually (OrthographicCamera for isometric)
  useEffect(() => {
    const D = 30;
    const fitW = (shape.gridW + shape.gridH) * TILE_UNIT * Math.SQRT2 * 0.5 + 5;
    const fitH = (shape.gridW + shape.gridH) * TILE_UNIT * Math.SQRT2 * 0.25 + 8;
    const baseZoom = Math.min(size.width / fitW, size.height / fitH) * 0.88;

    camera.position.set(cx + D, D * 0.85, cz + D);
    camera.zoom = baseZoom * userZoom;
    camera.lookAt(cx, 0, cz);
    camera.updateProjectionMatrix();
  }, [camera, cx, cz, shape, size.width, size.height, userZoom]);

  // Scene-level dragging state: which furniture is being dragged
  const [draggingItem, setDraggingItem] = useState(null);

  const handleDragStart = useCallback((item) => {
    setDraggingItem(item);
  }, []);

  // Floor plane click — avatar movement OR furniture placement
  const handleFloorClick = useCallback((e) => {
    if (draggingItem) return; // ignore clicks while dragging
    e.stopPropagation();
    const { gx, gy } = worldToTile(e.point.x, e.point.z);
    onFloorClick(gx, gy);
  }, [draggingItem, onFloorClick]);

  // Floor plane pointer move — drag furniture to new grid position
  const handleFloorMove = useCallback((e) => {
    if (!draggingItem || !isEditing) return;
    const cat = FURNITURE_CATALOG[draggingItem.type];
    if (!cat) return;
    const rawX = e.point.x - (cat.tileW / 2) * TILE_UNIT;
    const rawZ = e.point.z - (cat.tileH / 2) * TILE_UNIT;
    const { gx, gy } = worldToTile(rawX + TILE_UNIT / 2, rawZ + TILE_UNIT / 2);

    if (gx < 0 || gy < 0 || gx + cat.tileW > shape.gridW || gy + cat.tileH > shape.gridH) return;
    for (let dx = 0; dx < cat.tileW; dx++)
      for (let dy = 0; dy < cat.tileH; dy++)
        if (!isInMask(gx + dx, gy + dy, shape.mask)) return;

    if (gx !== draggingItem.x || gy !== draggingItem.y) {
      moveFurniture(draggingItem.id, gx, gy);
      setDraggingItem((prev) => prev ? { ...prev, x: gx, y: gy } : null);
    }
  }, [draggingItem, isEditing, shape, moveFurniture]);

  const handleFloorPointerUp = useCallback(() => {
    setDraggingItem(null);
  }, []);

  // Sort by depth for correct render order (not strictly needed in 3D but keeps R3F consistent)
  const sortedFurniture = useMemo(() =>
    [...furniture]
      .filter((f) => isInMask(f.x, f.y, shape.mask))
      .sort((a, b) => (a.x + a.y) - (b.x + b.y)),
    [furniture, shape]
  );

  const floorW = shape.gridW * TILE_UNIT;
  const floorD = shape.gridH * TILE_UNIT;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={t3d.ambientIntensity} />
      <directionalLight position={[cx + 20, 30, cz - 10]} intensity={t3d.dirIntensity} color={t3d.dirColor} castShadow />
      <directionalLight position={[cx - 10, 15, cz + 20]} intensity={t3d.dirIntensity * 0.28} color="#d0d8ff" />
      <FurnitureLights furniture={furniture} />

      {/* Floor geometry */}
      <FloorTiles shape={shape} t3d={t3d} />

      {/* Walls */}
      <Walls shape={shape} t3d={t3d} />

      {/* Edit grid overlay */}
      {isEditing && <EditGrid shape={shape} furniture={furniture} />}

      {/* Invisible floor plane for clicks + drag */}
      <mesh
        position={[floorW / 2, 0, floorD / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleFloorClick}
        onPointerMove={handleFloorMove}
        onPointerUp={handleFloorPointerUp}
        onPointerLeave={handleFloorPointerUp}
      >
        <planeGeometry args={[floorW + 6, floorD + 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Furniture */}
      {sortedFurniture.map((item) => (
        <FurnitureItem3D
          key={item.id}
          item={item}
          isEditing={isEditing && !selectedType}
          onDragStart={handleDragStart}
        />
      ))}

      {/* Standing avatars */}
      {Object.values(participants).map((p) => {
        if (p.seatFurnitureId) return null;
        if (p.gridX == null || p.gridY == null) return null;
        if (!isInMask(p.gridX, p.gridY, shape.mask)) return null;
        return <Avatar3D key={`av-${p.id}`} participant={p} gx={p.gridX} gy={p.gridY} />;
      })}
    </>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export default function RoomScene3D({ theme, zoom = 1, onFloorClick }) {
  return (
    <Canvas
      shadows
      orthographic
      camera={{ zoom: 26, near: 0.1, far: 500 }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 1.5]}
    >
      <SceneContents theme={theme} userZoom={zoom} onFloorClick={onFloorClick} />
    </Canvas>
  );
}
