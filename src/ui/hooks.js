import { useSyncExternalStore } from 'react';
import { subscribe, getVersion, subscribeTick, getTickVersion } from '../engine/game.js';

/** Re-render when game state changes (the engine mutates state, then bumps). */
export const useGame = () => useSyncExternalStore(subscribe, getVersion);
/** Re-render on the fast clock tick (day progress, map movement). */
export const useTick = () => useSyncExternalStore(subscribeTick, getTickVersion);
