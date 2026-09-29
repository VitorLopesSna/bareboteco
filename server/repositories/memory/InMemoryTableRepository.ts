import type { Table } from '../../../src/types.ts';
import type { ITableRepository } from '../interfaces/ITableRepository.ts';

/**
 * Single Responsibility: In-memory persistence and query for Table entities.
 * Liskov Substitution: Satisfies ITableRepository contract.
 */
export class InMemoryTableRepository implements ITableRepository {
  private tables: Table[];

  constructor(initialTables: Table[]) {
    this.tables = [...initialTables];
  }

  findById(id: string): Table | null {
    const table = this.tables.find(t => t.id === id);
    return table || null;
  }

  findByNumber(number: number): Table | null {
    const table = this.tables.find(t => t.number === number);
    return table || null;
  }

  findAll(): Table[] {
    return [...this.tables];
  }

  save(table: Table): Table {
    const index = this.tables.findIndex(t => t.id === table.id);
    if (index !== -1) {
      this.tables[index] = { ...table };
    } else {
      this.tables.push({ ...table });
    }
    return table;
  }

  update(table: Table): Table {
    return this.save(table);
  }

  delete(id: string): boolean {
    const initialLen = this.tables.length;
    this.tables = this.tables.filter(t => t.id !== id);
    return this.tables.length < initialLen;
  }
}
