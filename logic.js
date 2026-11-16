// Match rules, kept pure so test.js can check them without a browser.
const OVERS = 5, WICKETS = 7; // last man bats alone, so all 7 must fall
const RUNS = { six: 6, four: 4, one: 1 };
const OUTS = ['caught', 'house', 'bowled'];
const SWING_MS = 160; // a swing this far either side of the ball arriving still makes contact; the game loop waits this long too

// absDt: ms between the tap and the ball arriving. d: shot direction, -1 (leg) to 1 (off).
// covers: directions the fielders guard. r: random 0..1.
function shotOutcome(absDt, d, onStumps, r, covers) {
  if (absDt > SWING_MS) return onStumps ? 'bowled' : 'miss';
  const side = Math.abs(d);
  if (absDt <= 45) return side > 0.8 ? 'house' : side < 0.3 ? 'six' : 'four';
  if (absDt <= 100) return covers.some(c => Math.abs(c - d) < 0.14) ? 'dot' : 'one';
  if (side > 0.3 && r < 0.25) return 'house'; // mistimed, ball balloons up
  return r < 0.6 ? 'caught' : 'dot';
}

function applyBall(st, o) {
  st.balls++;
  st.runs += RUNS[o] || 0;
  if (OUTS.includes(o)) st.wkts++;
  st.log.push(o);
}

// What the AI batter does with the player's delivery. line: x at the crate (-0.3..0.3),
// zb: how far in front of the batter it pitches (0.08 yorker .. 0.6 short), speed and r: 0..1.
function aiOutcome(line, zb, speed, r) {
  const onStumps = Math.abs(line) < 0.14;
  const length = 1 - Math.min(1, Math.abs(zb - 0.2) / 0.4); // just short of a yorker is hardest to hit
  const diff = 0.2 + 0.4 * speed + 0.3 * length + (onStumps ? 0.1 : 0); // 0.2 loose .. 1 unplayable
  const pW = (onStumps ? 0.05 : 0.02) + 0.15 * diff, pDot = 0.25 + 0.3 * diff;
  if (r < pW) return onStumps && r < pW * 0.6 ? 'bowled' : 'caught';
  if (r < pW + pDot) return 'dot';
  const q = (r - pW - pDot) / (1 - pW - pDot), loose = 1 - diff; // q: 0..1 across the scoring shots
  if (q < 0.3 * loose) return q < 0.03 * loose ? 'house' : 'six';
  return q < 0.1 + 0.65 * loose ? 'four' : 'one';
}

// target: runs the chasing side needs, 0 in the first innings
const inningsOver = (st, target = 0) => st.balls >= OVERS * 6 || st.wkts >= WICKETS || (target > 0 && st.runs >= target);

// Who won, seen from the player's side. scores: [first innings, second innings]; first: what the player did first, 'bat' or 'bowl'.
function verdict([a, b], first) {
  if (a.runs === b.runs) return { result: 'tie' };
  const chased = b.runs > a.runs; // the side batting second got there
  return { result: chased === (first === 'bowl') ? 'won' : 'lost', margin: chased ? `${WICKETS - b.wkts} wicket` : `${a.runs - b.runs} run` };
}

if (typeof module !== 'undefined') module.exports = { shotOutcome, aiOutcome, applyBall, inningsOver, verdict, RUNS, OUTS, SWING_MS };
