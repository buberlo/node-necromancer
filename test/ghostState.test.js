import test from 'node:test';
import assert from 'node:assert/strict';

import { GHOST_STATES, assignGhostState, assignGhostStates } from '../src/ghostState.js';

const baseFinding = {
  name: 'example',
  used: true,
  unused: false,
  outdated: false,
  risky: false,
  reasons: [],
};

function makeFinding(overrides = {}) {
  return { ...baseFinding, ...overrides };
}

test('GHOST_STATES exposes the expected ghost states', () => {
  assert.equal(GHOST_STATES.QUIET, 'quiet');
  assert.equal(GHOST_STATES.DRIFTING, 'drifting');
  assert.equal(GHOST_STATES.HAUNTED, 'haunted');
  assert.equal(GHOST_STATES.CURSED, 'cursed');
});

test('assignGhostState returns quiet for a healthy dependency', () => {
  assert.equal(assignGhostState(makeFinding()), GHOST_STATES.QUIET);
});

test('assignGhostState returns drifting for outdated dependencies', () => {
  assert.equal(
    assignGhostState(makeFinding({ outdated: true })),
    GHOST_STATES.DRIFTING,
  );
});

test('assignGhostState returns haunted for risky dependencies', () => {
  assert.equal(
    assignGhostState(makeFinding({ risky: true })),
    GHOST_STATES.HAUNTED,
  );
});

test('assignGhostState returns cursed for unused dependencies', () => {
  assert.equal(
    assignGhostState(makeFinding({ used: false, unused: true, outdated: true, risky: true })),
    GHOST_STATES.CURSED,
  );
});

test('assignGhostState prioritizes risk over outdated state', () => {
  assert.equal(
    assignGhostState(makeFinding({ outdated: true, risky: true })),
    GHOST_STATES.HAUNTED,
  );
});

test('assignGhostState ignores unknown fields and defaults to quiet', () => {
  assert.equal(
    assignGhostState(makeFinding({ unknown: true, notes: 'still quiet' })),
    GHOST_STATES.QUIET,
  );
});

test('assignGhostStates annotates every finding without mutating input', () => {
  const input = [
    makeFinding({ name: 'used', used: true, unused: false }),
    makeFinding({ name: 'unused', used: false, unused: true }),
    makeFinding({ name: 'risky', risky: true }),
    makeFinding({ name: 'outdated', outdated: true }),
  ];
  const snapshot = JSON.parse(JSON.stringify(input));

  const result = assignGhostStates(input);

  assert.deepEqual(result, [
    { ...snapshot[0], ghostState: GHOST_STATES.QUIET },
    { ...snapshot[1], ghostState: GHOST_STATES.CURSED },
    { ...snapshot[2], ghostState: GHOST_STATES.HAUNTED },
    { ...snapshot[3], ghostState: GHOST_STATES.DRIFTING },
  ]);
  assert.deepEqual(input, snapshot);
});

test('assignGhostStates handles an empty list', () => {
  assert.deepEqual(assignGhostStates([]), []);
});