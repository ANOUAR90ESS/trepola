import { db } from './index.js';
import { users } from './schema.js';

export async function getOrCreateUser(uid: string, email: string, name?: string, avatarUrl?: string) {
  try {
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

    return result?.[0] || { id: 1, uid, email, name: name || '', avatarUrl: avatarUrl || '', role: 'user', createdAt: new Date() };
  } catch (err) {
    console.warn('getOrCreateUser db fallback:', err);
    return { id: 1, uid, email, name: name || '', avatarUrl: avatarUrl || '', role: 'user', createdAt: new Date() };
  }
}
