import type { Table } from '../../../src/types.ts';
import type { IRepository } from './IRepository.ts';

export interface ITableRepository extends IRepository<Table, string> {
  findByNumber(number: number): Table | null;
  update(table: Table): Table;
}
