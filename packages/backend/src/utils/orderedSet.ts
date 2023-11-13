export default class OrderedSet<T> {
  private set: Set<T>;
  private order: T[];

  constructor() {
    this.set = new Set<T>();
    this.order = [];
  }

  add(value: T): void {
    if (!this.set.has(value)) {
      this.set.add(value);
      this.order.push(value);
    }
  }

  delete(value: T): void {
    if (this.set.has(value)) {
      this.set.delete(value);
      const index = this.order.indexOf(value);
      if (index !== -1) {
        this.order.splice(index, 1);
      }
    }
  }

  has(value: T): boolean {
    return this.set.has(value);
  }

  clear(): void {
    this.set.clear();
    this.order = [];
  }

  values(): T[] {
    return this.order;
  }

  size(): number {
    return this.set.size;
  }
}
