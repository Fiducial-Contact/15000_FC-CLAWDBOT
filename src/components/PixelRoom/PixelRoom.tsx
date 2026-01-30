'use client';

import { useEffect, useRef, useState } from 'react';
import type { LearningEvent } from '@/lib/types/profile';
import './pixelroom.css';

const NATIVE_W = 480;
const NATIVE_H = 192;
const SCALE = 2;
const DISPLAY_W = NATIVE_W * SCALE;
const DISPLAY_H = NATIVE_H * SCALE;
const CHAR = 32;
const CHAR_D = CHAR * SCALE;

// Behavior zones - agent will do contextual actions when near these spots
const ZONES = {
  desk: { x: 55, y: 105, action: 'work' as const },
  bed: { x: 145, y: 130, action: 'sleep' as const },
  dining: { x: 240, y: 115, action: 'eat' as const },
  bookshelf: { x: 340, y: 95, action: 'read' as const },
  coffee: { x: 420, y: 120, action: 'drink' as const },
};

const WALK_TARGETS = [
  { x: 100, y: 130 },
  { x: 180, y: 110 },
  { x: 280, y: 140 },
  { x: 380, y: 120 },
  { x: 200, y: 150 },
  ...Object.values(ZONES).map(z => ({ x: z.x, y: z.y })),
];

type AgentState = 'idle' | 'walk' | 'think' | 'eureka' | 'sleep' | 'work' | 'read' | 'drink' | 'eat' | 'rest';
type Direction = 'down' | 'left' | 'right' | 'up';

interface PixelRoomProps {
  learningEvents?: LearningEvent[];
  signalCount24h?: number;
  isConnected?: boolean;
}

const DIMENSION_LABELS: Record<string, string> = {
  'skill-level': 'Skill',
  'interaction-style': 'Style',
  'topic-interests': 'Topics',
  'frustration-signals': 'Mood',
};

const WORK_MESSAGES = [
  'Analyzing patterns...',
  'Learning preferences...',
  'Processing signals...',
  'Updating profile...',
];

const READ_MESSAGES = [
  'Reading docs...',
  'Checking notes...',
  'Reviewing history...',
];

const EAT_MESSAGES = [
  'Lunch time! 🍜',
  'Nom nom...',
  'Tasty! 😋',
];

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function calcDir(dx: number, dy: number): Direction {
  return Math.abs(dx) > Math.abs(dy)
    ? dx > 0 ? 'right' : 'left'
    : dy > 0 ? 'down' : 'up';
}

function getTempo(count?: number) {
  if (count !== undefined && count > 20)
    return { idleMin: 1200, idleMax: 2000, walkMin: 600, walkMax: 1200 };
  if (count === 0)
    return { idleMin: 3500, idleMax: 5500, walkMin: 1800, walkMax: 3500 };
  return { idleMin: 2000, idleMax: 3500, walkMin: 1000, walkMax: 2000 };
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

function getZoneAction(x: number, y: number): AgentState | null {
  for (const zone of Object.values(ZONES)) {
    if (Math.abs(x - zone.x) < 25 && Math.abs(y - zone.y) < 20) {
      return zone.action;
    }
  }
  return null;
}

function pickIdleState(events?: LearningEvent[]): { state: AgentState; dimension?: string; insight?: string } {
  if (!events || events.length === 0) return { state: 'idle' };
  
  const now = Date.now();
  for (const ev of events.slice(0, 5)) {
    const ageMs = now - new Date(ev.created_at).getTime();
    if (ev.confidence >= 0.8 && ageMs < 3600000) {
      return { state: 'eureka', dimension: ev.dimension, insight: ev.insight };
    }
  }
  
  const thinkable = events.filter(e => e.confidence >= 0.4);
  if (thinkable.length > 0) {
    const pickEv = thinkable[Math.floor(Math.random() * Math.min(3, thinkable.length))];
    return { state: 'think', dimension: pickEv.dimension, insight: pickEv.insight };
  }
  
  return { state: 'idle' };
}

// Sprite caches
let _spriteWalk: string | null = null;
let _spriteSit: string | null = null;
let _spriteRead: string | null = null;
let _spriteDrink: string | null = null;
let _spriteLie: string | null = null;
let _spriteEat: string | null = null;

// No caching for room - regenerate every time for debugging
function makeRoom(): string {
  console.log('[PixelRoom] Generating room v3 with bed and dining table');
  const c = document.createElement('canvas');
  c.width = NATIVE_W;
  c.height = NATIVE_H;
  const g = c.getContext('2d');
  if (!g) return '';

  // === FLOOR ===
  g.fillStyle = '#5a4a3a';
  g.fillRect(0, 0, NATIVE_W, NATIVE_H);
  
  // Floor planks
  g.fillStyle = '#4e3f30';
  for (let y = 55; y < NATIVE_H; y += 18) {
    g.fillRect(0, y, NATIVE_W, 1);
  }
  for (let x = 0; x < NATIVE_W; x += 35) {
    g.fillRect(x, 50, 1, NATIVE_H - 50);
  }

  // === WALL ===
  g.fillStyle = '#7a8fa0';
  g.fillRect(0, 0, NATIVE_W, 52);
  
  // Baseboard
  g.fillStyle = '#5a4535';
  g.fillRect(0, 50, NATIVE_W, 4);

  // === 1. WORK CORNER (left) ===
  
  // Small desk
  g.fillStyle = '#8b7355';
  g.fillRect(15, 70, 70, 28);
  g.fillStyle = '#7a6345';
  g.fillRect(15, 70, 70, 3);
  // Desk legs
  g.fillRect(18, 98, 6, 20);
  g.fillRect(76, 98, 6, 20);
  
  // Monitor
  g.fillStyle = '#2a2a2a';
  g.fillRect(35, 42, 40, 30);
  g.fillStyle = '#1a3a5a';
  g.fillRect(38, 45, 34, 24);
  
  // Code on screen
  const codeColors = ['#4ade80', '#fbbf24', '#e0e0e0', '#a78bfa'];
  for (let i = 0; i < 4; i++) {
    g.fillStyle = codeColors[i];
    g.fillRect(40, 48 + i * 5, 15 + (i % 3) * 6, 2);
  }
  
  // Monitor stand
  g.fillStyle = '#3a3a3a';
  g.fillRect(50, 72, 10, 6);
  g.fillRect(45, 76, 20, 3);
  
  // Keyboard
  g.fillStyle = '#4a4a4a';
  g.fillRect(38, 82, 28, 6);
  
  // Chair
  g.fillStyle = '#3d3d3d';
  g.fillRect(40, 108, 24, 18);
  g.fillStyle = '#4a4a4a';
  g.fillRect(38, 104, 28, 6);
  g.fillStyle = '#2a2a2a';
  g.fillRect(46, 126, 4, 6);
  g.fillRect(58, 126, 4, 6);

  // === 2. BED AREA (center-left) ===
  
  // Bed frame
  g.fillStyle = '#6b5340';
  g.fillRect(105, 115, 75, 50);
  
  // Mattress
  g.fillStyle = '#e8e0d8';
  g.fillRect(108, 118, 69, 44);
  
  // Pillow
  g.fillStyle = '#f5f0e8';
  g.fillRect(110, 120, 25, 15);
  g.fillStyle = '#e8e0d0';
  g.fillRect(110, 120, 25, 2);
  
  // Blanket
  g.fillStyle = '#6b8caa';
  g.fillRect(108, 138, 69, 24);
  g.fillStyle = '#5a7a98';
  g.fillRect(108, 138, 69, 3);
  
  // Blanket fold
  g.fillStyle = '#7a9cba';
  g.fillRect(140, 135, 35, 6);
  
  // Nightstand
  g.fillStyle = '#7a6350';
  g.fillRect(95, 130, 12, 20);
  g.fillStyle = '#6b5440';
  g.fillRect(95, 130, 12, 2);
  
  // Lamp on nightstand
  g.fillStyle = '#3a3a3a';
  g.fillRect(99, 118, 4, 14);
  g.fillStyle = '#f5e6c8';
  g.fillRect(95, 112, 12, 8);
  g.fillStyle = '#fff8e0';
  g.fillRect(97, 114, 8, 4);

  // === 3. DINING AREA (center) ===
  
  // Round table (shown as octagon-ish)
  g.fillStyle = '#8b7355';
  g.fillRect(215, 100, 50, 35);
  g.fillStyle = '#9b8365';
  g.fillRect(218, 103, 44, 29);
  
  // Table leg
  g.fillStyle = '#6b5340';
  g.fillRect(235, 135, 10, 18);
  
  // Ramen bowl - white bowl with rim
  g.fillStyle = '#f0f0f0';
  g.fillRect(222, 105, 20, 14);
  g.fillStyle = '#e0e0e0';
  g.fillRect(222, 105, 20, 3); // rim
  g.fillStyle = '#d4a574'; // broth
  g.fillRect(224, 108, 16, 9);
  // Noodles
  g.fillStyle = '#f5e6c8';
  g.fillRect(226, 110, 4, 5);
  g.fillRect(232, 109, 3, 6);
  g.fillRect(236, 110, 3, 4);
  // Egg
  g.fillStyle = '#fff';
  g.fillRect(228, 111, 4, 3);
  g.fillStyle = '#f5a030';
  g.fillRect(229, 112, 2, 1);
  // Steam
  g.fillStyle = 'rgba(255,255,255,0.4)';
  g.fillRect(227, 100, 2, 4);
  g.fillRect(232, 99, 2, 5);
  g.fillRect(237, 101, 2, 3);
  
  // Chopsticks on chopstick rest
  g.fillStyle = '#5a4a3a'; // rest
  g.fillRect(245, 112, 8, 3);
  g.fillStyle = '#d4a574'; // chopsticks
  g.fillRect(246, 108, 2, 10);
  g.fillRect(250, 109, 2, 9);
  
  // Glass of water with ice
  g.fillStyle = 'rgba(220,240,255,0.8)';
  g.fillRect(256, 106, 10, 14);
  g.fillStyle = 'rgba(180,210,255,0.6)';
  g.fillRect(258, 110, 6, 8);
  // Ice cubes
  g.fillStyle = 'rgba(255,255,255,0.5)';
  g.fillRect(259, 111, 3, 3);
  g.fillRect(261, 115, 2, 2);
  
  // Dining chair with back
  g.fillStyle = '#6b5340';
  g.fillRect(228, 145, 18, 12); // seat
  g.fillStyle = '#7a6350';
  g.fillRect(226, 135, 22, 12); // back
  g.fillStyle = '#5a4230';
  g.fillRect(228, 135, 18, 2); // back top edge

  // === 4. READING CORNER (center-right) ===
  
  // Bookshelf
  g.fillStyle = '#6b5340';
  g.fillRect(300, 10, 65, 80);
  g.fillStyle = '#7a6350';
  g.fillRect(304, 14, 57, 72);
  
  // Shelf dividers
  g.fillStyle = '#6b5340';
  for (let i = 0; i < 4; i++) {
    g.fillRect(304, 28 + i * 15, 57, 2);
  }
  
  // Books
  const bookColors = ['#c04040', '#4a6b40', '#4a4a9b', '#9b8040', '#7a4a9b', '#4090a0'];
  const bookWidths = [7, 5, 8, 6, 7, 5, 8, 6];
  for (let shelf = 0; shelf < 4; shelf++) {
    let bx = 306;
    for (let b = 0; b < 5; b++) {
      const w = bookWidths[(shelf * 5 + b) % bookWidths.length];
      g.fillStyle = bookColors[(shelf * 5 + b) % bookColors.length];
      g.fillRect(bx, 16 + shelf * 15, w, 11);
      bx += w + 2;
    }
  }
  
  // Cozy armchair - clear sofa shape
  // Seat cushion
  g.fillStyle = '#b8860b'; // golden brown
  g.fillRect(310, 110, 38, 20);
  // Back cushion
  g.fillStyle = '#daa520';
  g.fillRect(312, 95, 34, 18);
  // Left armrest
  g.fillStyle = '#b8860b';
  g.fillRect(306, 98, 8, 30);
  // Right armrest
  g.fillRect(344, 98, 8, 30);
  // Seat shadow
  g.fillStyle = '#8b6914';
  g.fillRect(312, 115, 32, 3);
  // Back pattern (buttons)
  g.fillStyle = '#cd9b1d';
  g.fillRect(320, 100, 4, 4);
  g.fillRect(332, 100, 4, 4);
  
  // Small rug under chair
  g.fillStyle = '#7a5a4a';
  g.fillRect(305, 130, 45, 25);
  g.fillStyle = '#8a6a5a';
  g.fillRect(308, 133, 39, 19);

  // === 5. COFFEE/PLANT CORNER (right) ===
  
  // Small side table
  g.fillStyle = '#7a6350';
  g.fillRect(400, 110, 30, 22);
  g.fillStyle = '#6b5440';
  g.fillRect(400, 110, 30, 2);
  g.fillRect(405, 132, 5, 12);
  g.fillRect(420, 132, 5, 12);
  
  // Coffee cup
  g.fillStyle = '#e8e8e8';
  g.fillRect(407, 100, 12, 12);
  g.fillStyle = '#6b4423';
  g.fillRect(409, 102, 8, 8);
  g.fillStyle = '#e8e8e8';
  g.fillRect(419, 104, 4, 6);
  
  // Steam
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.fillRect(410, 95, 2, 5);
  g.fillRect(414, 93, 2, 6);
  
  // Large plant pot
  g.fillStyle = '#8b5a2b';
  g.fillRect(445, 130, 28, 35);
  g.fillStyle = '#7a4a1b';
  g.fillRect(443, 126, 32, 6);
  
  // Plant leaves
  g.fillStyle = '#3a8a3a';
  g.fillRect(440, 95, 16, 35);
  g.fillRect(458, 100, 14, 30);
  g.fillRect(448, 85, 18, 18);
  g.fillStyle = '#2a7a2a';
  g.fillRect(444, 90, 12, 28);
  g.fillRect(460, 95, 10, 24);
  g.fillStyle = '#4a9a4a';
  g.fillRect(450, 82, 14, 14);

  // === WALL DECORATIONS ===
  
  // Window (above bed)
  g.fillStyle = '#5a4535';
  g.fillRect(115, 8, 55, 38);
  g.fillStyle = '#87ceeb';
  g.fillRect(119, 12, 47, 30);
  // Clouds
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.fillRect(123, 18, 10, 5);
  g.fillRect(126, 16, 6, 4);
  g.fillRect(142, 20, 14, 5);
  // Window dividers
  g.fillStyle = '#5a4535';
  g.fillRect(141, 12, 3, 30);
  g.fillRect(119, 25, 47, 3);
  
  // Clock (above dining) - round clock with frame
  g.fillStyle = '#5a4535'; // wooden frame
  g.fillRect(228, 8, 24, 24);
  g.fillStyle = '#f5f5f0'; // clock face
  g.fillRect(231, 11, 18, 18);
  // Hour markers
  g.fillStyle = '#333';
  g.fillRect(239, 12, 2, 2); // 12
  g.fillRect(239, 26, 2, 2); // 6
  g.fillRect(232, 19, 2, 2); // 9
  g.fillRect(246, 19, 2, 2); // 3
  // Clock hands
  g.fillStyle = '#2a2a2a';
  g.fillRect(239, 15, 2, 6); // hour hand (pointing up)
  g.fillRect(239, 19, 6, 2); // minute hand (pointing right)
  // Center dot
  g.fillStyle = '#c04040';
  g.fillRect(239, 19, 2, 2);
  
  // Poster (above coffee area)
  g.fillStyle = '#3a3a3a';
  g.fillRect(405, 12, 28, 35);
  g.fillStyle = '#2a5a8a';
  g.fillRect(408, 15, 22, 29);
  g.fillStyle = '#4a8aba';
  g.fillRect(412, 22, 14, 8);
  g.fillStyle = '#6aaada';
  g.fillRect(415, 34, 8, 6);

  // Vignette
  const vg = g.createRadialGradient(NATIVE_W/2, NATIVE_H/2, 120, NATIVE_W/2, NATIVE_H/2, 300);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.25)');
  g.fillStyle = vg;
  g.fillRect(0, 0, NATIVE_W, NATIVE_H);

  return c.toDataURL();
}

// Walking sprite - 4 frames × 4 directions
function makeSpriteWalk(): string {
  if (_spriteWalk) return _spriteWalk;
  const c = document.createElement('canvas');
  c.width = CHAR * 4;
  c.height = CHAR * 4;
  const g = c.getContext('2d');
  if (!g) return '';

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const ox = col * CHAR;
      const oy = row * CHAR;

      // Body
      g.fillStyle = '#4a6fa5';
      g.fillRect(ox + 11, oy + 14, 10, 10);

      // Head
      g.fillStyle = '#f5d6ba';
      g.fillRect(ox + 10, oy + 6, 12, 10);

      // Hair
      g.fillStyle = '#3d3d3d';
      g.fillRect(ox + 10, oy + 4, 12, 5);

      // Eyes
      g.fillStyle = '#222';
      if (row === 0) {
        g.fillRect(ox + 12, oy + 10, 2, 2);
        g.fillRect(ox + 18, oy + 10, 2, 2);
      } else if (row === 1) {
        g.fillRect(ox + 10, oy + 10, 2, 2);
        g.fillRect(ox + 14, oy + 10, 2, 2);
      } else if (row === 2) {
        g.fillRect(ox + 16, oy + 10, 2, 2);
        g.fillRect(ox + 20, oy + 10, 2, 2);
      }

      // Legs
      g.fillStyle = '#333';
      const s = col % 2;
      g.fillRect(ox + 11 + s * 2, oy + 24, 4, 4);
      g.fillRect(ox + 17 - s * 2, oy + 24, 4, 4);
    }
  }

  _spriteWalk = c.toDataURL();
  return _spriteWalk;
}

// Sitting at desk - typing
function makeSpriteSit(): string {
  if (_spriteSit) return _spriteSit;
  const c = document.createElement('canvas');
  c.width = CHAR * 4;
  c.height = CHAR;
  const g = c.getContext('2d');
  if (!g) return '';

  for (let col = 0; col < 4; col++) {
    const ox = col * CHAR;

    // Body (back view, sitting)
    g.fillStyle = '#4a6fa5';
    g.fillRect(ox + 10, 14, 12, 8);

    // Head (back of head)
    g.fillStyle = '#f5d6ba';
    g.fillRect(ox + 10, 6, 12, 10);

    // Hair
    g.fillStyle = '#3d3d3d';
    g.fillRect(ox + 9, 4, 14, 7);

    // Arms typing
    g.fillStyle = '#f5d6ba';
    if (col % 2 === 0) {
      g.fillRect(ox + 6, 16, 4, 4);
      g.fillRect(ox + 22, 18, 4, 4);
    } else {
      g.fillRect(ox + 6, 18, 4, 4);
      g.fillRect(ox + 22, 16, 4, 4);
    }
  }

  _spriteSit = c.toDataURL();
  return _spriteSit;
}

// Reading - holding book
function makeSpriteRead(): string {
  if (_spriteRead) return _spriteRead;
  const c = document.createElement('canvas');
  c.width = CHAR * 4;
  c.height = CHAR;
  const g = c.getContext('2d');
  if (!g) return '';

  for (let col = 0; col < 4; col++) {
    const ox = col * CHAR;

    // Body (sitting in chair)
    g.fillStyle = '#4a6fa5';
    g.fillRect(ox + 11, 12, 10, 10);

    // Head (looking down)
    g.fillStyle = '#f5d6ba';
    g.fillRect(ox + 10, 5, 12, 10);

    // Hair
    g.fillStyle = '#3d3d3d';
    g.fillRect(ox + 10, 3, 12, 5);

    // Eyes looking down
    g.fillStyle = '#222';
    g.fillRect(ox + 12, 10, 2, 1);
    g.fillRect(ox + 18, 10, 2, 1);

    // Arms holding book
    g.fillStyle = '#f5d6ba';
    g.fillRect(ox + 8, 14, 4, 5);
    g.fillRect(ox + 20, 14, 4, 5);

    // Book
    g.fillStyle = '#c04040';
    g.fillRect(ox + 10, 16, 12, 8);
    g.fillStyle = '#f5f5f0';
    g.fillRect(ox + 12, 17, 8, 6);
    
    if (col === 1 || col === 3) {
      g.fillStyle = '#e8e8e8';
      g.fillRect(ox + 14, 17, 4, 5);
    }

    // Legs
    g.fillStyle = '#333';
    g.fillRect(ox + 12, 22, 4, 6);
    g.fillRect(ox + 16, 22, 4, 6);
  }

  _spriteRead = c.toDataURL();
  return _spriteRead;
}

// Drinking coffee
function makeSpriteDrink(): string {
  if (_spriteDrink) return _spriteDrink;
  const c = document.createElement('canvas');
  c.width = CHAR * 4;
  c.height = CHAR;
  const g = c.getContext('2d');
  if (!g) return '';

  for (let col = 0; col < 4; col++) {
    const ox = col * CHAR;
    const drinking = col >= 2;

    // Body
    g.fillStyle = '#4a6fa5';
    g.fillRect(ox + 11, 14, 10, 10);

    // Head
    g.fillStyle = '#f5d6ba';
    const headTilt = drinking ? -1 : 0;
    g.fillRect(ox + 10, 6 + headTilt, 12, 10);

    // Hair
    g.fillStyle = '#3d3d3d';
    g.fillRect(ox + 10, 4 + headTilt, 12, 5);

    // Eyes
    g.fillStyle = '#222';
    if (drinking) {
      g.fillRect(ox + 12, 10, 3, 1);
      g.fillRect(ox + 17, 10, 3, 1);
    } else {
      g.fillRect(ox + 12, 10, 2, 2);
      g.fillRect(ox + 18, 10, 2, 2);
    }

    // Arms
    g.fillStyle = '#f5d6ba';
    g.fillRect(ox + 6, 16, 4, 6);
    const cupY = drinking ? 8 : 14;
    g.fillRect(ox + 22, cupY, 4, 6);

    // Cup
    g.fillStyle = '#e8e8e8';
    g.fillRect(ox + 24, cupY - 2, 6, 8);
    g.fillStyle = '#6b4423';
    g.fillRect(ox + 25, cupY, 4, 5);

    // Legs
    g.fillStyle = '#333';
    g.fillRect(ox + 12, 24, 4, 4);
    g.fillRect(ox + 16, 24, 4, 4);
  }

  _spriteDrink = c.toDataURL();
  return _spriteDrink;
}

// Lying in bed
function makeSpriteLie(): string {
  if (_spriteLie) return _spriteLie;
  const c = document.createElement('canvas');
  c.width = CHAR * 4;
  c.height = CHAR;
  const g = c.getContext('2d');
  if (!g) return '';

  for (let col = 0; col < 4; col++) {
    const ox = col * CHAR;

    // Blanket covering body
    g.fillStyle = '#6b8caa';
    g.fillRect(ox + 8, 16, 18, 10);

    // Head on pillow
    g.fillStyle = '#f5d6ba';
    g.fillRect(ox + 2, 14, 10, 10);

    // Hair
    g.fillStyle = '#3d3d3d';
    g.fillRect(ox + 1, 13, 8, 6);

    // Eye (closed for sleep)
    g.fillStyle = '#222';
    if (col % 2 === 0) {
      g.fillRect(ox + 8, 18, 2, 1);
    } else {
      g.fillRect(ox + 8, 17, 2, 2);
    }
    
    // Pillow edge
    g.fillStyle = '#f5f0e8';
    g.fillRect(ox + 0, 20, 8, 6);
  }

  _spriteLie = c.toDataURL();
  return _spriteLie;
}

// Eating at table
function makeSpriteEat(): string {
  if (_spriteEat) return _spriteEat;
  const c = document.createElement('canvas');
  c.width = CHAR * 4;
  c.height = CHAR;
  const g = c.getContext('2d');
  if (!g) return '';

  for (let col = 0; col < 4; col++) {
    const ox = col * CHAR;
    const eating = col % 2 === 1;

    // Body
    g.fillStyle = '#4a6fa5';
    g.fillRect(ox + 11, 14, 10, 10);

    // Head
    g.fillStyle = '#f5d6ba';
    g.fillRect(ox + 10, 6, 12, 10);

    // Hair
    g.fillStyle = '#3d3d3d';
    g.fillRect(ox + 10, 4, 12, 5);

    // Eyes
    g.fillStyle = '#222';
    if (eating) {
      // Eyes closed while eating
      g.fillRect(ox + 12, 10, 3, 1);
      g.fillRect(ox + 17, 10, 3, 1);
    } else {
      g.fillRect(ox + 12, 10, 2, 2);
      g.fillRect(ox + 18, 10, 2, 2);
    }

    // Arms with chopsticks
    g.fillStyle = '#f5d6ba';
    g.fillRect(ox + 6, 16, 4, 5);
    
    const chopY = eating ? 10 : 14;
    g.fillRect(ox + 22, chopY, 4, 5);
    
    // Chopsticks
    g.fillStyle = '#d4a574';
    g.fillRect(ox + 24, chopY - 4, 1, 8);
    g.fillRect(ox + 26, chopY - 3, 1, 7);

    // Legs
    g.fillStyle = '#333';
    g.fillRect(ox + 12, 24, 4, 4);
    g.fillRect(ox + 16, 24, 4, 4);
  }

  _spriteEat = c.toDataURL();
  return _spriteEat;
}

export function PixelRoom({ learningEvents, signalCount24h, isConnected }: PixelRoomProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const posRef = useRef({ x: 240, y: 120 });
  const eventsRef = useRef(learningEvents);
  const tempoRef = useRef(signalCount24h);
  const prevConnectedRef = useRef(isConnected);

  eventsRef.current = learningEvents;
  tempoRef.current = signalCount24h;

  const [ready, setReady] = useState(false);
  const [assets, setAssets] = useState({ 
    room: '', 
    walk: '', 
    sit: '', 
    read: '', 
    drink: '', 
    lie: '',
    eat: '',
  });
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 240, y: 120 });
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [direction, setDirection] = useState<Direction>('down');
  const [walkMs, setWalkMs] = useState(0);
  const [activeInsight, setActiveInsight] = useState<string | undefined>();
  const [activeDimension, setActiveDimension] = useState<string | undefined>();
  const [bubbleText, setBubbleText] = useState<string | undefined>();

  useEffect(() => {
    setAssets({ 
      room: makeRoom(), 
      walk: makeSpriteWalk(),
      sit: makeSpriteSit(),
      read: makeSpriteRead(),
      drink: makeSpriteDrink(),
      lie: makeSpriteLie(),
      eat: makeSpriteEat(),
    });
    setReady(true);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setScale(Math.min(1, e.contentRect.width / DISPLAY_W));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (isConnected === false) {
      // Go to bed when disconnected
      const bedPos = ZONES.bed;
      setPos({ x: bedPos.x, y: bedPos.y });
      posRef.current = { x: bedPos.x, y: bedPos.y };
      setAgentState('sleep');
      setBubbleText(undefined);
      setActiveInsight(undefined);
      prevConnectedRef.current = false;
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const waking = prevConnectedRef.current === false;
    prevConnectedRef.current = isConnected;

    const step = () => {
      const target = pick(WALK_TARGETS);
      const dx = target.x - posRef.current.x;
      const dy = target.y - posRef.current.y;
      const tempo = getTempo(tempoRef.current);
      const dist = Math.hypot(dx, dy);
      const ms = tempo.walkMin + (dist / 360) * (tempo.walkMax - tempo.walkMin);

      posRef.current = { x: target.x, y: target.y };
      setDirection(calcDir(dx, dy));
      setAgentState('walk');
      setBubbleText(undefined);
      setActiveInsight(undefined);
      setWalkMs(ms);
      setPos({ x: target.x, y: target.y });

      timerRef.current = setTimeout(() => {
        const zoneAction = getZoneAction(target.x, target.y);
        
        if (zoneAction && zoneAction !== 'sleep' && Math.random() > 0.3) {
          setAgentState(zoneAction);
          
          let actionMsg: string | undefined;
          let actionDur: number;
          
          switch (zoneAction) {
            case 'work':
              actionMsg = pick(WORK_MESSAGES);
              actionDur = rand(4000, 7000);
              setDirection('up');
              break;
            case 'read':
              actionMsg = pick(READ_MESSAGES);
              actionDur = rand(3000, 5000);
              setDirection('down');
              break;
            case 'drink':
              actionMsg = 'Coffee break ☕';
              actionDur = rand(2500, 4000);
              setDirection('down');
              break;
            case 'eat':
              actionMsg = pick(EAT_MESSAGES);
              actionDur = rand(3500, 6000);
              setDirection('up');
              break;
            default:
              actionDur = rand(2000, 4000);
          }
          
          setBubbleText(actionMsg);
          timerRef.current = setTimeout(step, actionDur);
        } else {
          const idle = pickIdleState(eventsRef.current);
          setAgentState(idle.state);
          setActiveInsight(idle.insight);
          setActiveDimension(idle.dimension);
          setBubbleText(undefined);

          let idleDur: number;
          if (idle.state === 'eureka') idleDur = 3000;
          else if (idle.state === 'think') idleDur = rand(3500, 5500);
          else idleDur = rand(tempo.idleMin, tempo.idleMax);

          timerRef.current = setTimeout(step, idleDur);
        }
      }, ms);
    };

    const idle = pickIdleState(eventsRef.current);
    setAgentState(idle.state);
    setActiveInsight(idle.insight);
    setActiveDimension(idle.dimension);

    const initDelay = waking ? 1000 : rand(1500, 2500);
    timerRef.current = setTimeout(step, initDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ready, isConnected]);

  if (!ready) return null;

  const isWalking = agentState === 'walk';
  const isSleeping = agentState === 'sleep';
  const isWorking = agentState === 'work';
  const isReading = agentState === 'read';
  const isDrinking = agentState === 'drink';
  const isEating = agentState === 'eat';
  
  const frameW = DISPLAY_W * scale;
  const frameH = DISPLAY_H * scale;

  let spriteUrl = assets.walk;
  let spriteClass = isWalking ? 'walking' : 'idle';
  let spriteRows = 4;
  
  if (isWorking) {
    spriteUrl = assets.sit;
    spriteClass = 'typing';
    spriteRows = 1;
  } else if (isReading) {
    spriteUrl = assets.read;
    spriteClass = 'reading';
    spriteRows = 1;
  } else if (isDrinking) {
    spriteUrl = assets.drink;
    spriteClass = 'drinking';
    spriteRows = 1;
  } else if (isSleeping) {
    spriteUrl = assets.lie;
    spriteClass = 'lying';
    spriteRows = 1;
  } else if (isEating) {
    spriteUrl = assets.eat;
    spriteClass = 'eating';
    spriteRows = 1;
  }

  return (
    <div ref={wrapRef} className="pr-wrap" style={{ height: frameH }}>
      <div className="pr-frame" style={{ width: frameW, height: frameH }}>
        <div
          className="pr-room"
          style={{
            width: DISPLAY_W,
            height: DISPLAY_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            backgroundImage: `url(${assets.room})`,
            backgroundSize: `${DISPLAY_W}px ${DISPLAY_H}px`,
          }}
        >
          {isSleeping && <div className="pr-dim-overlay" />}

          <div
            className={`pr-agent ${spriteClass} dir-${direction}`}
            style={{
              width: CHAR_D,
              height: CHAR_D,
              backgroundImage: `url(${spriteUrl})`,
              backgroundSize: `${CHAR_D * 4}px ${CHAR_D * spriteRows}px`,
              transform: `translate(${pos.x * SCALE - CHAR_D / 2}px, ${pos.y * SCALE - CHAR_D / 2}px)`,
              transition: isWalking ? `transform ${walkMs}ms linear` : 'none',
            }}
          >
            {bubbleText && (
              <div className="pr-bubble pr-bubble-action">
                <span className="pr-bubble-text">{bubbleText}</span>
              </div>
            )}
            
            {agentState === 'think' && activeInsight && !bubbleText && (
              <div className="pr-bubble pr-bubble-think">
                <span className="pr-bubble-icon">💭</span>
                <span className="pr-bubble-text">{truncate(activeInsight, 26)}</span>
              </div>
            )}
            
            {agentState === 'eureka' && !bubbleText && (
              <div className="pr-bubble pr-bubble-eureka">
                <span className="pr-bubble-icon">💡</span>
                <span className="pr-bubble-text">
                  {activeDimension ? DIMENSION_LABELS[activeDimension] || activeDimension : 'New insight!'}
                </span>
              </div>
            )}
            
            {agentState === 'sleep' && (
              <div className="pr-bubble pr-bubble-sleep">
                <span className="pr-bubble-icon">💤</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
