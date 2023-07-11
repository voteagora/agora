import seedrandom from "seedrandom";

class FenwickTree {
  size: number;
  tree: number[];

  constructor(size: number) {
    this.size = size;
    this.tree = new Array(size).fill(0);
  }

  add(i: number, value: number) {
    for (; i < this.size; i |= i + 1) this.tree[i] += value;
  }

  sum(i: number) {
    let result = 0;
    for (; i >= 0; i = (i & (i + 1)) - 1) result += this.tree[i];
    return result;
  }

  get(weight: number) {
    let i = -1;
    for (let bit = Math.floor(Math.log2(this.size)); bit >= 0; bit--) {
      let temp = i + (1 << bit);
      if (temp < this.size && weight >= this.tree[temp]) {
        weight -= this.tree[temp];
        i = temp;
      }
    }
    return i + 1;
  }
}

export function weightedRandomizer<T extends { weight: number }>(
  array: T[],
  seed: string
) {
  let n = array.length;
  let prefixSum: number[] = new Array(n).fill(0);
  let fenwickTree = new FenwickTree(n);
  let rand = seedrandom(seed);

  prefixSum[0] = array[0].weight;
  fenwickTree.add(0, array[0].weight);
  for (let i = 1; i < n; i++) {
    prefixSum[i] = prefixSum[i - 1] + array[i].weight;
    fenwickTree.add(i, array[i].weight);
  }

  let totalSum = prefixSum[n - 1];
  let randomArray = [];

  for (let i = 0; i < n; i++) {
    let randNum = rand() * totalSum;
    let index = fenwickTree.get(randNum);
    totalSum -= array[index].weight;
    fenwickTree.add(index, -array[index].weight);
    randomArray.push(array[index]);
  }

  return randomArray;
}

export async function* weightedRandomizerGenerator<
  T extends { weight: number }
>(iterator: AsyncIterable<T>, seed: string): AsyncGenerator<T> {
  let array: T[] = [];
  for await (const item of iterator) {
    array.push(item);
  }

  let n = array.length;
  let prefixSum = new Array(n).fill(0);
  let fenwickTree = new FenwickTree(n);
  let rand = seedrandom(seed);

  prefixSum[0] = array[0].weight;
  fenwickTree.add(0, array[0].weight);
  for (let i = 1; i < n; i++) {
    prefixSum[i] = prefixSum[i - 1] + array[i].weight;
    fenwickTree.add(i, array[i].weight);
  }

  let totalSum = prefixSum[n - 1];

  for (let i = 0; i < n; i++) {
    let randNum = rand() * totalSum;
    let index = fenwickTree.get(randNum);
    totalSum -= array[index].weight;
    fenwickTree.add(index, -array[index].weight);
    yield array[index];
  }
}
