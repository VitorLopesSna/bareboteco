import type { User } from '../../../src/types.ts';
import type { StoredUser } from '../../../database.ts';
import { 
  findUserByUsername, 
  findUserById, 
  listUsers, 
  loadDatabase, 
  saveDatabase 
} from '../../../database.ts';
import type { IUserRepository } from '../interfaces/IUserRepository.ts';

/**
 * Single Responsibility: User entity persistence in local encrypted JSON storage.
 * Liskov Substitution: Satisfies IUserRepository contract.
 */
export class FileUserRepository implements IUserRepository {
  findByUsername(username: string): StoredUser | null {
    const user = findUserByUsername(username);
    return user || null;
  }

  findById(id: string): StoredUser | null {
    const user = findUserById(id);
    return user || null;
  }

  findAll(): User[] {
    return listUsers();
  }

  saveUser(user: StoredUser): void {
    const db = loadDatabase();
    const index = db.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      db.users[index] = user;
    } else {
      db.users.push(user);
    }
    saveDatabase(db);
  }
}
