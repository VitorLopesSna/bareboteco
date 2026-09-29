/**
 * Interface Segregation Principle (ISP):
 * Segregating read and write capabilities so clients only depend on the operations they need.
 */
export interface IReadOnlyRepository<T, ID = string> {
  findById(id: ID): T | null;
  findAll(): T[];
}

export interface IWriteRepository<T, ID = string> {
  save(entity: T): T;
  delete(id: ID): boolean;
}

export interface IRepository<T, ID = string> extends IReadOnlyRepository<T, ID>, IWriteRepository<T, ID> {}
