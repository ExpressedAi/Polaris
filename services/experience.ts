import { getSetting, saveSetting, logXpEvent, getXpEvents } from './storage';
import { XPEvent } from '../types';

const XP_KEY = 'xp_total';
const LAST_LEVEL_KEY = 'xp_last_level';

export interface ExperienceState {
  total: number;
  level: number;
  nextLevel: number;
  levelName: string;
  levelDescription: string;
}

const LEVEL_STEP = 200;

// Epic level names with descriptions - using icon names instead of emojis
// Icons are resolved in the UI components
const LEVEL_NAMES: Array<{ name: string; description: string; iconName?: string }> = [
  { name: 'Seedling', description: 'Just beginning your journey', iconName: 'Sprout' },
  { name: 'Novice Operator', description: 'Learning the ropes', iconName: 'User' },
  { name: 'Resonance Seeker', description: 'Finding your frequency', iconName: 'Radio' },
  { name: 'Context Weaver', description: 'Connecting the dots', iconName: 'Network' },
  { name: 'Memory Architect', description: 'Building your knowledge base', iconName: 'Building' },
  { name: 'Flow Catalyst', description: 'Accelerating momentum', iconName: 'Zap' },
  { name: 'Sylvia Collaborator', description: 'Working in harmony', iconName: 'Handshake' },
  { name: 'Resonance Navigator', description: 'Charting new territories', iconName: 'Compass' },
  { name: 'Context Master', description: 'Owning your domain', iconName: 'Crown' },
  { name: 'Memory Virtuoso', description: 'Perfect recall', iconName: 'Target' },
  { name: 'Flow Architect', description: 'Designing systems', iconName: 'Building' },
  { name: 'Sylvia Partner', description: 'Deep collaboration', iconName: 'Gem' },
  { name: 'Resonance Commander', description: 'Leading the charge', iconName: 'Rocket' },
  { name: 'Context Sage', description: 'Wisdom through experience', iconName: 'Brain' },
  { name: 'Memory Oracle', description: 'Seeing patterns others miss', iconName: 'Gem' },
  { name: 'Flow Sovereign', description: 'Master of momentum', iconName: 'Wand2' },
  { name: 'Sylvia Co-Pilot', description: 'Seamless integration', iconName: 'Plane' },
  { name: 'Resonance Legend', description: 'Stories told of your work', iconName: 'Scroll' },
  { name: 'Context Deity', description: 'Transcendent understanding', iconName: 'Star' },
  { name: 'Memory Titan', description: 'Unstoppable knowledge', iconName: 'Brain' },
  { name: 'Flow Deity', description: 'Divine momentum', iconName: 'Sparkle' },
  { name: 'Sylvia Unity', description: 'One mind, one purpose', iconName: 'Sparkles' },
];

// Get level name and description
export const getLevelInfo = (level: number): { name: string; description: string; iconName?: string } => {
  if (level < LEVEL_NAMES.length) {
    return LEVEL_NAMES[level];
  }
  // For levels beyond the list, use a formula
  const tier = Math.floor(level / 10);
  const baseIndex = level % LEVEL_NAMES.length;
  const base = LEVEL_NAMES[baseIndex];
  return {
    name: `${base.name} ${tier > 0 ? `(Tier ${tier + 1})` : ''}`,
    description: base.description,
    iconName: base.iconName,
  };
};

export const getExperience = async (): Promise<ExperienceState> => {
  const total = await getSetting<number>(XP_KEY, 0);
  const level = Math.floor(total / LEVEL_STEP);
  const nextLevel = (level + 1) * LEVEL_STEP;
  const levelInfo = getLevelInfo(level);
  return { 
    total, 
    level, 
    nextLevel,
    levelName: levelInfo.name,
    levelDescription: levelInfo.description,
  };
};

export const checkLevelUp = async (): Promise<number | null> => {
  const current = await getExperience();
  const lastLevel = await getSetting<number>(LAST_LEVEL_KEY, 0);
  
  if (current.level > lastLevel) {
    await saveSetting(LAST_LEVEL_KEY, current.level);
    return current.level;
  }
  
  return null;
};

export const XP_REASONS: Record<string, number> = {
  'journal.entry': 15,
  'journal.grade': 6,
  'agenda.add': 10,
  'pomodoro.session': 8,
  'agenda.session': 12,
};

export const awardExperience = async (reason: keyof typeof XP_REASONS, metadata?: string): Promise<ExperienceState> => {
  const points = XP_REASONS[reason] ?? 0;
  const current = await getSetting<number>(XP_KEY, 0);
  const oldLevel = Math.floor(current / LEVEL_STEP);
  const total = current + Math.max(points, 0);
  const newLevel = Math.floor(total / LEVEL_STEP);
  
  await saveSetting(XP_KEY, total);
  await logXpEvent({
    id: `xp-${Date.now()}`,
    reason,
    points,
    metadata,
    createdAt: Date.now(),
  });
  
  const newState = await getExperience();
  
  // Check for level up
  if (newLevel > oldLevel) {
    await saveSetting(LAST_LEVEL_KEY, newLevel);
    // Dispatch custom event for level up notification
    window.dispatchEvent(new CustomEvent('levelUp', { 
      detail: { 
        level: newLevel, 
        levelName: newState.levelName,
        levelDescription: newState.levelDescription,
        iconName: getLevelInfo(newLevel).iconName,
      } 
    }));
  }
  
  return newState;
};

export const fetchRecentXpEvents = async (): Promise<XPEvent[]> => {
  return getXpEvents(30);
};
