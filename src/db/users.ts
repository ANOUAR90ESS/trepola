import { db } from './index.js';
import { users } from './schema.js';

export async function getOrCreateUser(uid: string, email: string, name?: string, avatarUrl?: string) {
  const result = await db.insert(users)
    .values({
      uid,
      email,
      name,
      avatarUrl,
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: {
        email,
        name,
        avatarUrl,
      },
    })
    .returning();

  return result[0];
}
