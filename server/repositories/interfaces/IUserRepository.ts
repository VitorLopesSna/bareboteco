import type { User } from '../../../src/types.ts';
import type { StoredUser } from '../../../database.ts';

export interface IUserRepository {
  findByUsername(username: string): StoredUser | null;
  findById(id: string): StoredUser | null;
  findAll(): User[];
  saveUser(user: StoredUser): void;
}
