import { Donor, RecipientRequest, MatchResult } from "@shared/schema";

export class AVLNode {
  donor: Donor;
  height: number;
  left: AVLNode | null;
  right: AVLNode | null;

  constructor(donor: Donor) {
    this.donor = donor;
    this.height = 1;
    this.left = null;
    this.right = null;
  }
}

export class AVLTree {
  root: AVLNode | null = null;

  private getHeight(node: AVLNode | null): number {
    return node ? node.height : 0;
  }

  private getBalanceFactor(node: AVLNode | null): number {
    return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
  }

  private rightRotate(y: AVLNode): AVLNode {
    const x = y.left!;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;
    x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;

    return x;
  }

  private leftRotate(x: AVLNode): AVLNode {
    const y = x.right!;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;
    y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;

    return y;
  }

  private compare(a: Donor, b: Donor): number {
    const otA = a.organType.toLowerCase();
    const otB = b.organType.toLowerCase();
    if (otA !== otB) return otA.localeCompare(otB);
    
    const bgA = a.bloodGroup.toLowerCase();
    const bgB = b.bloodGroup.toLowerCase();
    if (bgA !== bgB) return bgA.localeCompare(bgB);
    
    return (a.id || "").localeCompare(b.id || "");
  }

  private insertNode(node: AVLNode | null, donor: Donor): AVLNode {
    if (!node) return new AVLNode(donor);

    const cmp = this.compare(donor, node.donor);
    if (cmp < 0) {
      node.left = this.insertNode(node.left, donor);
    } else if (cmp > 0) {
      node.right = this.insertNode(node.right, donor);
    } else {
      return node; 
    }

    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    const balance = this.getBalanceFactor(node);

    if (balance > 1 && this.compare(donor, node.left!.donor) < 0) {
      return this.rightRotate(node);
    }
    if (balance < -1 && this.compare(donor, node.right!.donor) > 0) {
      return this.leftRotate(node);
    }
    if (balance > 1 && this.compare(donor, node.left!.donor) > 0) {
      node.left = this.leftRotate(node.left!);
      return this.rightRotate(node);
    }
    if (balance < -1 && this.compare(donor, node.right!.donor) < 0) {
      node.right = this.rightRotate(node.right!);
      return this.leftRotate(node);
    }

    return node;
  }

  insert(donor: Donor) {
    this.root = this.insertNode(this.root, donor);
  }

  findMatches(organType: string, bloodGroup: string): Donor[] {
    const matches: Donor[] = [];
    this.inOrderSearch(this.root, organType, bloodGroup, matches);
    return matches;
  }

  private inOrderSearch(node: AVLNode | null, organType: string, bloodGroup: string, matches: Donor[]) {
    if (!node) return;

    const targetA = { organType, bloodGroup, id: "" } as Donor;
    const targetB = { organType, bloodGroup, id: "\uFFFF" } as Donor;

    if (this.compare(targetA, node.donor) <= 0) {
      this.inOrderSearch(node.left, organType, bloodGroup, matches);
    }

    if (node.donor.organType.toLowerCase() === organType.toLowerCase() && 
        node.donor.bloodGroup.toLowerCase() === bloodGroup.toLowerCase()) {
      matches.push(node.donor);
    }

    if (this.compare(targetB, node.donor) >= 0) {
      this.inOrderSearch(node.right, organType, bloodGroup, matches);
    }
  }

  getAll(): Donor[] {
    const all: Donor[] = [];
    const traverse = (n: AVLNode | null) => {
      if (!n) return;
      traverse(n.left);
      all.push(n.donor);
      traverse(n.right);
    };
    traverse(this.root);
    return all;
  }
}

export class MaxHeap<T> {
  private heap: T[] = [];
  private scoreFn: (item: T) => number;

  constructor(scoreFn: (item: T) => number) {
    this.scoreFn = scoreFn;
  }

  push(item: T) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0 && bottom !== undefined) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(index: number) {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.scoreFn(this.heap[current]) <= this.scoreFn(this.heap[parent])) break;
      [this.heap[current], this.heap[parent]] = [this.heap[parent], this.heap[current]];
      current = parent;
    }
  }

  private sinkDown(index: number) {
    let current = index;
    const length = this.heap.length;
    while (true) {
      const left = 2 * current + 1;
      const right = 2 * current + 2;
      let largest = current;

      if (left < length && this.scoreFn(this.heap[left]) > this.scoreFn(this.heap[largest])) {
        largest = left;
      }
      if (right < length && this.scoreFn(this.heap[right]) > this.scoreFn(this.heap[largest])) {
        largest = right;
      }

      if (largest === current) break;
      [this.heap[current], this.heap[largest]] = [this.heap[largest], this.heap[current]];
      current = largest;
    }
  }
}
