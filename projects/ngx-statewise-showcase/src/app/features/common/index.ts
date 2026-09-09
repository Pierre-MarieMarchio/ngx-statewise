/*
 * The shared kernel: what two features genuinely need of each other, as ports
 * and nothing else. It imports nothing from this repository, which is what
 * keeps "no feature imports another feature" absolute — the need descends here
 * instead of one feature reaching for another.
 *
 * Three conditions, all of them, before anything is added:
 *
 *   1. At least two features consume it.
 *   2. None of them could get it from `pages/` instead — the need arises in a
 *      service, an effect or a feature's own component, not in a composition.
 *   3. It is cut down to what the consumers actually call, not to what the
 *      provider happens to expose.
 *
 * A port that grows a member for a single caller fails (1). A whole type
 * published when two fields are read fails (3). Today that leaves seven
 * symbols, and the count is checkable by reading the call sites.
 */

export * from './session';
export * from './reload';
