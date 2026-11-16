import fs from 'node:fs/promises';
import path from 'node:path';
import { createSeedState } from './seedData.ts';
import type {
  DatabaseState,
  PlanRecord,
  PopulatedSubscription,
  SanitizedUser,
  SubscriptionRecord,
  UserRecord,
} from '../types.ts';

const DB_FILE_PATH = path.resolve(process.cwd(), 'server', 'data', 'db.json');

let memoryState: DatabaseState | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function persistToDisk(state: DatabaseState): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    try {
      await fs.mkdir(path.dirname(DB_FILE_PATH), { recursive: true });
      await fs.writeFile(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not persist local backend store to disk; continuing in memory:', err);
    }
  });
  return writeQueue;
}

export async function initDatabase(): Promise<void> {
  if (memoryState) return;

  try {
    const raw = await fs.readFile(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseState;
    if (
      Array.isArray(parsed.users) &&
      Array.isArray(parsed.plans) &&
      Array.isArray(parsed.salads) &&
      Array.isArray(parsed.ingredients)
    ) {
      memoryState = parsed;
      return;
    }
  } catch {
    // Seed fresh database when file does not exist yet
  }

  memoryState = await createSeedState();
  await persistToDisk(memoryState);
}

export async function getDB(): Promise<DatabaseState> {
  if (!memoryState) {
    await initDatabase();
  }
  return memoryState!;
}

export async function saveDB(nextState?: DatabaseState): Promise<void> {
  if (nextState) {
    memoryState = nextState;
  }
  if (memoryState) {
    await persistToDisk(memoryState);
  }
}

export function sanitizeUser(user: UserRecord, plans: PlanRecord[]): SanitizedUser {
  const { passwordHash: _hash, ...rest } = user;
  const planObj = rest.membershipPlan ? plans.find((p) => p._id === rest.membershipPlan) || null : null;
  return {
    ...rest,
    membershipPlan: planObj,
  };
}

export function populateSubscription(sub: SubscriptionRecord, state: DatabaseState): PopulatedSubscription {
  const plan = state.plans.find((p) => p._id === sub.plan) || state.plans[0];
  const preferredSalad = sub.preferredSalad
    ? state.salads.find((s) => s._id === sub.preferredSalad) || null
    : null;
  return {
    ...sub,
    plan,
    preferredSalad,
  };
}
