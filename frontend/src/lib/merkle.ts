import { poseidon2 } from "poseidon-lite";

const TREE_DEPTH = 20;
const ZERO_VALUE = 0n;

function buildZeroHashes(): bigint[] {
  const zeros: bigint[] = [ZERO_VALUE];
  for (let i = 0; i < TREE_DEPTH; i++) {
    zeros.push(poseidon2([zeros[i], zeros[i]]));
  }
  return zeros;
}

export interface MerkleProof {
  pathElements: bigint[];
  pathIndices: number[];
  root: bigint;
}

export class PoseidonMerkleTree {
  private leaves: bigint[] = [];
  private nodes: Map<string, bigint> = new Map();
  private zeroHashes: bigint[] = buildZeroHashes();

  private key(level: number, index: number): string {
    return `${level}:${index}`;
  }

  private getNode(level: number, index: number): bigint {
    return this.nodes.get(this.key(level, index)) ?? this.zeroHashes[level];
  }

  private setNode(level: number, index: number, value: bigint) {
    this.nodes.set(this.key(level, index), value);
  }

  insert(leaf: bigint): number {
    const index = this.leaves.length;
    this.leaves.push(leaf);
    this.setNode(0, index, leaf);

    let currentIndex = index;
    for (let level = 0; level < TREE_DEPTH; level++) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      const sibling = this.getNode(level, siblingIndex);
      const current = this.getNode(level, currentIndex);
      const parentIndex = Math.floor(currentIndex / 2);
      const [left, right] =
        currentIndex % 2 === 0 ? [current, sibling] : [sibling, current];
      this.setNode(level + 1, parentIndex, poseidon2([left, right]));
      currentIndex = parentIndex;
    }

    return index;
  }

  getRoot(): bigint {
    return this.getNode(TREE_DEPTH, 0);
  }

  generateProof(leafIndex: number): MerkleProof {
    const pathElements: bigint[] = [];
    const pathIndices: number[] = [];

    let currentIndex = leafIndex;
    for (let level = 0; level < TREE_DEPTH; level++) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      pathElements.push(this.getNode(level, siblingIndex));
      pathIndices.push(currentIndex % 2);
      currentIndex = Math.floor(currentIndex / 2);
    }

    return { pathElements, pathIndices, root: this.getRoot() };
  }

  static fromCommitments(commitments: bigint[]): PoseidonMerkleTree {
    const tree = new PoseidonMerkleTree();
    for (const c of commitments) tree.insert(c);
    return tree;
  }
}