import Dexie, { Table } from 'dexie';
import { Action, CreateAction, UpdateAction } from '../types/action';

export interface Setting {
  id?: number;
  key: string;
  value: any;
  updatedAt: Date;
}

interface Color {
  id?: number;
  value: string;
  timestamp: number;
}

class FlowyDatabase extends Dexie {
  actions!: Table<Action>;
  settings!: Table<Setting>;
  colors!: Table<Color>;

  constructor() {
    super('FlowyDB');
    this.version(1).stores({
      actions: '++id, name, shortcut, tags',
      settings: '++id, key',
      colors: '++id, value, timestamp'
    });
  }
}

export const db = new FlowyDatabase();

// Initialize default settings
export async function initializeSettings() {
  const defaultSettings = [
    { key: 'theme', value: 'light' },
    { key: 'searchEngine', value: 'google' },
    { key: 'shortcutsEnabled', value: true }
  ];

  for (const setting of defaultSettings) {
    const exists = await db.settings.where('key').equals(setting.key).first();
    if (!exists) {
      await db.settings.add({
        ...setting,
        updatedAt: new Date()
      });
    }
  }
}

// CRUD operations for actions
export const actionService = {
  // Create
  async create(action: CreateAction): Promise<Action> {
    const id = await db.actions.add({
      ...action,
      id: crypto.randomUUID()
    });
    const newAction = await db.actions.get(id);
    if (!newAction) throw new Error('Failed to create action');
    return newAction;
  },

  // Read
  async getAll(): Promise<Action[]> {
    return db.actions.toArray();
  },

  async getById(id: string): Promise<Action | undefined> {
    return db.actions.get(id);
  },

  async getByShortcut(shortcut: string): Promise<Action | undefined> {
    return db.actions.where('shortcut').equals(shortcut).first();
  },

  // Update
  async update(id: string, updates: UpdateAction): Promise<Action> {
    await db.actions.update(id, updates);
    const updated = await db.actions.get(id);
    if (!updated) throw new Error('Failed to update action');
    return updated;
  },

  // Delete
  async delete(id: string): Promise<void> {
    await db.actions.delete(id);
  }
};

// Chrome storage sync operations
export const storageService = {
  async syncToStorage(): Promise<void> {
    const actions = await actionService.getAll();
    await chrome.storage.sync.set({ actions });
  },

  async syncFromStorage(): Promise<void> {
    const { actions } = await chrome.storage.sync.get('actions');
    if (actions) {
      await db.actions.clear();
      await db.actions.bulkAdd(actions);
    }
  }
}; 