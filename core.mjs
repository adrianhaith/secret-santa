export const KEY = 'family-secret-santa-v1';
export const GROUPS = [0,0,0,0,1,1,1,1,2];
export function randomBelow(n) {
  const limit = 2 ** 32 - (2 ** 32 % n);
  const word = new Uint32Array(1);
  do { globalThis.crypto.getRandomValues(word); } while (word[0] >= limit);
  return word[0] % n;
}
export function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomBelow(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function validateNames(names) {
  const normalized = names.map(n => n.trim().toLocaleLowerCase());
  return normalized.map(n => !n ? 'Please enter a name.' : normalized.filter(x => x === n).length > 1 ? 'Each person needs a unique name.' : '');
}
export function validAssignment(a) {
  return Array.isArray(a) && a.length === 9 && new Set(a).size === 9 && a.every((r,i) => Number.isInteger(r) && r >= 0 && r < 9 && GROUPS[r] !== GROUPS[i]);
}
export async function draw(names, practice = false, { batch = 250, cap = 100000 } = {}) {
  if (names.length !== 9 || validateNames(names).some(Boolean)) throw Error('Check the nine names.');
  const indices = GROUPS.map((_,i) => i);
  for (let attempt = 0; attempt < cap;) {
    for (let j = 0; j < batch && attempt < cap; j++, attempt++) {
      const assignment = shuffle(indices);
      if (validAssignment(assignment)) return {version:1, participants:names.map((name,i) => ({name:name.trim(),household:GROUPS[i]})), assignment, order:shuffle(indices), turn:0, phase:'handoff', practice};
    }
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  throw Error('The elves need another try. Please start the draw again.');
}
export function validState(s) {
  return !!s && s.version === 1 && typeof s.practice === 'boolean' && Array.isArray(s.participants) && s.participants.length === 9 && s.participants.every((p,i) => p && typeof p.name === 'string' && p.name.length <= 80 && p.household === GROUPS[i]) && !validateNames(s.participants.map(p => p.name)).some(Boolean) && validAssignment(s.assignment) && Array.isArray(s.order) && s.order.length === 9 && new Set(s.order).size === 9 && s.order.every(i => Number.isInteger(i) && i >= 0 && i < 9) && Number.isInteger(s.turn) && s.turn >= 0 && s.turn <= 9 && (s.turn === 9 ? ['finished','closed'].includes(s.phase) : ['handoff','ready','reveal'].includes(s.phase));
}
export function resume(s) {
  if (!validState(s)) throw Error('Invalid saved draw');
  return {...s, phase:s.turn === 9 ? s.phase : 'handoff'};
}
export function transition(s, action) {
  if (!validState(s)) throw Error('Invalid draw');
  const next = {...s};
  if (action === 'identify' && s.phase === 'handoff') next.phase = 'ready';
  if (action === 'reveal' && s.phase === 'ready') next.phase = 'reveal';
  if (action === 'hide' && s.phase === 'reveal') { next.turn++; next.phase = next.turn === 9 ? 'finished' : 'handoff'; }
  if (action === 'close' && s.phase === 'finished') next.phase = 'closed';
  return next;
}
