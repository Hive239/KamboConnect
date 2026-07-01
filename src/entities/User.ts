/**
 * Built-in User entity. CRUD comes from the generic store; auth methods
 * (me/login/logout/updateMyUserData) come from the mock session.
 * Role gating across the app is ONLY `user.role === 'admin'`; practitioner
 * identity is determined by `Practitioner.filter({ email })`.
 */
import { makeEntity } from '@/data/store';
import * as session from '@/data/session';
import type { User as UserType } from '@/types/entities';

const store = makeEntity('User');

export const User = {
  list: store.list,
  filter: store.filter,
  get: store.get,
  create: store.create,
  update: store.update,
  delete: store.delete,

  async me(): Promise<UserType> {
    const user = await session.getCurrentUser();
    if (!user) {
      const err: any = new Error('Not authenticated');
      err.status = 401;
      throw err;
    }
    return user;
  },

  async login(): Promise<void> {
    session.login();
  },

  async logout(): Promise<void> {
    session.logout();
  },

  async updateMyUserData(data: Partial<UserType> & Record<string, any>) {
    return session.updateCurrentUser(data);
  },
};

export default User;
