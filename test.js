// Run: node test.js
const assert = require('assert');
const { shotOutcome, aiOutcome, applyBall, inningsOver, verdict, RUNS, OUTS, SWING_MS } = require('./logic.js');
const C = [-1, -0.37, 0, 0.35, 1];

assert.equal(shotOutcome(999, 0, true, 0, C), 'bowled');
assert.equal(shotOutcome(999, 0, false, 0, C), 'miss');
assert.equal(shotOutcome(10, 0, true, 0, C), 'six');
assert.equal(shotOutcome(10, 0.6, true, 0, C), 'four');
assert.equal(shotOutcome(10, -0.9, true, 0, C), 'house'); // smashed into the balcony
assert.equal(shotOutcome(80, 0.65, true, 0, C), 'one'); // gap
assert.equal(shotOutcome(80, 0.35, true, 0, C), 'dot'); // straight to a fielder
assert.equal(shotOutcome(130, 0.6, true, 0.1, C), 'house');
assert.equal(shotOutcome(130, 0, true, 0.1, C), 'caught'); // straight skier never reaches a house
assert.equal(shotOutcome(130, 0.6, true, 0.9, C), 'dot');

const st = { runs: 0, wkts: 0, balls: 0, log: [] };
['six', 'four', 'one', 'dot', 'miss', 'caught'].forEach(o => applyBall(st, o));
assert.deepEqual([st.runs, st.wkts, st.balls], [11, 1, 6]);
assert.equal(inningsOver(st), false);
for (let i = 0; i < 6; i++) applyBall(st, 'bowled');
assert.equal(inningsOver(st), true); // 7th wicket ends it, not the 6th
assert.equal(inningsOver({ balls: 30, wkts: 0 }), true);
assert.equal(inningsOver({ balls: 29, wkts: 6 }), false);

// chase: reaching the target ends the innings early
assert.equal(inningsOver({ balls: 5, wkts: 0, runs: 12 }, 12), true);
assert.equal(inningsOver({ balls: 5, wkts: 0, runs: 11 }, 12), false);
assert.equal(inningsOver({ balls: 5, wkts: 0, runs: 0 }), false);

// AI batter
assert.equal(aiOutcome(0, 0.2, 1, 0), 'bowled');
assert.equal(aiOutcome(0.25, 0.2, 1, 0.01), 'caught'); // can't be bowled by a ball missing the crate
assert.equal(aiOutcome(0.25, 0.6, 0, 0.37), 'house');
assert.equal(aiOutcome(0.25, 0.6, 0, 0.4), 'six');
assert.equal(aiOutcome(0.25, 0.6, 0, 0.7), 'four');
assert.equal(aiOutcome(0.25, 0.6, 0, 0.999), 'one');
const avg = (...a) => { let runs = 0, w = 0; for (let i = 0; i < 1000; i++) { const o = aiOutcome(...a, i / 1000); runs += RUNS[o] || 0; w += OUTS.includes(o); } return [runs / 1000, w / 1000]; };
const [goodR, goodW] = avg(0, 0.2, 1), [badR, badW] = avg(0.28, 0.6, 0);
assert.ok(goodR < badR / 3 && goodW > badW * 2, 'a fast straight good-length ball must beat a slow wide long hop');

// a swing exactly at the edge of the window still connects; one ms later it does not
assert.notEqual(shotOutcome(SWING_MS, 0, true, 0.9, C), 'bowled');
assert.equal(shotOutcome(SWING_MS + 1, 0, true, 0.9, C), 'bowled');

// who won, from the player's side
const s = (runs, wkts) => ({ runs, wkts });
assert.deepEqual(verdict([s(40, 2), s(30, 7)], 'bat'), { result: 'won', margin: '10 run' }); // batted first, defended
assert.deepEqual(verdict([s(40, 2), s(41, 3)], 'bat'), { result: 'lost', margin: '4 wicket' }); // batted first, got chased down
assert.deepEqual(verdict([s(40, 2), s(41, 3)], 'bowl'), { result: 'won', margin: '4 wicket' }); // bowled first, chased it
assert.deepEqual(verdict([s(40, 2), s(30, 7)], 'bowl'), { result: 'lost', margin: '10 run' });
assert.deepEqual(verdict([s(40, 2), s(40, 7)], 'bowl'), { result: 'tie' });
console.log('ok', { goodR, goodW, badR, badW });
