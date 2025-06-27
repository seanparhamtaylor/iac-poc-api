import { Injectable } from '@nestjs/common';

@Injectable()
export class StoreService {
  private store: Map<string, any>;

  constructor() {
    this.store = new Map();
  }

  set(key: string, value: any): void {
    this.store.set(key, value);
  }

  get(key: string): any {
    return this.store.get(key);
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  clear(): void {
    this.store.clear();
  }

  getAll(): Map<string, any> {
    return this.store;
  }
} 