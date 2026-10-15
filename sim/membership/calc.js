/* 회원권 손익 계산 — 몬테카를로(화면 · 검사가 같이 쓴다). 계산 모델: Obsidian 04.Simulator/01.계산모델.md
   2026-10-14 화면을 새로 짜며 app.js 에서 떼어 냄. 새로 더한 것: 달마다 쌓이는 이익(acc.월, 달별요약) — '달마다 쌓이는 이익' 그래프 */

export function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// 삼각분포(최소 a, 최빈 c, 최대 b)
export function tri(u, a, c, b) { if (!(b > a)) return a; c = Math.min(b, Math.max(a, c)); const f = (c - a) / (b - a);
  return u < f ? a + Math.sqrt(u * (b - a) * (c - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - c)); }
export function poisson(l, rng) { const L = Math.exp(-l); let k = 0, q = rng(); while (q > L) { k++; q *= rng(); } return k; }
// 건당 손익(m)과, 같은 시술을 판매가로 받았을 때의 건당 이익(cf)
export function econ(items, p) { return items.map(x => { const cost = x.cost;
  return { cost, m: x.price * (1 - p.comm) - cost - p.opex, cf: x.list > 0 ? x.list * (1 - p.comm) - cost - p.opex : 0, lim: x.lim }; }); }
// 방문 1회에 각 시술이 포함될 확률. 시술마다 따로 뽑아 실적 비중이 그대로 유지되고, 다시 뽑기 루프가 없다.
export function inclusion(items, kbar, beta) {
  const w = items.map(x => Math.max(0, x.w) * (beta && x.list > 0 && x.price > 0 ? (x.list / x.price) ** beta : 1));
  const s = w.reduce((a, b) => a + b, 0); return w.map(v => s ? Math.min(1, kbar * v / s) : 0);
}

// 1회 시뮬레이션. 회차 가정(방문·고객 비율·회원권 없어도 받았을 비율)을 먼저 뽑고, 그 조건에서 회원별 행동을 뽑는다.
// rv(방문·회원)와 ri(시술 선택)는 세 경우가 같은 시드를 써서 방문 패턴과 난수가 같다.
// 월(길이 months+1, 없어도 됨) — 그 회차의 달마다 쌓인 이익. 0달 = 가입비 순액, 끝 달 = inc(고정비는 달마다 나눠 뺀다)
export function runOnce(p, E, pis, rv, ri, usage, 월) {
  const fx = p.fix || {};
  const mu = fx.mu ?? tri(rv(), p.mu[0], p.mu[1], p.mu[2]);
  const r = fx.r ?? tri(rv(), p.ex[0], p.ex[1], p.ex[2]);
  const s = fx.s ?? tri(rv(), p.keep[0], p.keep[1], p.keep[2]);
  const mix = fx.mix ?? tri(rv(), p.mix[0], p.mix[1], p.mix[2]);
  const sig2 = Math.log(1 + p.cv * p.cv), sig = Math.sqrt(sig2), n = E.length, base = p.fee * (1 - p.comm) - p.acq, cnt = new Int32Array(n);
  let sumC = 0, sumK = 0, loss = 0, items = 0, visits = 0;
  for (let m = 0; m < p.members; m++) {
    const z = Math.sqrt(-2 * Math.log(1 - rv())) * Math.cos(2 * Math.PI * rv());
    const lam = Math.min(30, mu * Math.exp(sig * z - sig2 / 2)); // 회원별 월 방문 기대치(평균 1인 로그정규 배수)
    const existing = rv() < r;
    const pi = rv() < mix && pis.b ? pis.b : pis.a; // pis.b가 있을 때만(종합) 회원별로 할인 큰 시술 위주 여부를 나눔
    const 뺌 = existing ? s : 0;
    cnt.fill(0); let c = base, cf = 0;
    if (월) 월[0] += c;
    for (let t = 0; t < p.months; t++) {
      const v = poisson(lam, rv); visits += v;
      for (let k = 0; k < v; k++) for (let i = 0; i < n; i++) {
        if (ri() >= pi[i] || (E[i].lim > 0 && cnt[i] >= E[i].lim)) continue;
        cnt[i]++; c += E[i].m; cf += E[i].cf; usage[i]++; items++;
      }
      if (월) 월[t + 1] += c - 뺌 * cf;
    }
    const kept = 뺌 * cf;
    sumC += c; sumK += kept; if (c < 0) loss++;
  }
  if (월) for (let t = 1; t <= p.months; t++) 월[t] -= p.fixed * t / p.months;
  return { contrib: sumC - p.fixed, cannib: sumK, inc: sumC - sumK - p.fixed, loss, items, visits };
}
// months 를 주면 회차마다 달별 누적(acc.월 — 회차 r 의 t 달 = 월[r × (months+1) + t])도 모은다
export function newAcc(runs, n, months = 0) {
  return { inc: new Float64Array(runs), contrib: new Float64Array(runs), cannib: new Float64Array(runs), loss: 0, items: 0, visits: 0, usage: new Float64Array(n),
    월: months ? new Float64Array(runs * (months + 1)) : null, 달수: months };
}
export function step(p, E, pis, seed, r, acc) {
  const 월 = acc.월 ? acc.월.subarray(r * (acc.달수 + 1), (r + 1) * (acc.달수 + 1)) : undefined;
  const res = runOnce(p, E, pis, mulberry32(seed + r * 2654435761), mulberry32((seed ^ 0x9e3779b9) + r * 40503), acc.usage, 월);
  acc.inc[r] = res.inc; acc.contrib[r] = res.contrib; acc.cannib[r] = res.cannib; acc.loss += res.loss; acc.items += res.items; acc.visits += res.visits;
}
export const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
export function quantile(s, q) { const i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); }
export function summarize(acc, p) {
  const s = Float64Array.from(acc.inc).sort();
  return { mean: avg(s), p05: quantile(s, .05), p95: quantile(s, .95), min: s[0], max: s[s.length - 1], lossP: s.filter(v => v < 0).length / s.length,
    contrib: avg(acc.contrib), cannib: avg(acc.cannib), lossM: acc.loss / (acc.inc.length * p.members), load: acc.items / (acc.inc.length * p.months) };
}
// 달마다 평균 · 하위 5% · 상위 5% (0달 ~ 끝 달)
export function 달별요약(acc) {
  const 달 = acc.달수, runs = acc.inc.length, 줄 = new Float64Array(runs);
  return Array.from({ length: 달 + 1 }, (_, t) => {
    for (let r = 0; r < runs; r++) 줄[r] = acc.월[r * (달 + 1) + t];
    const s = Float64Array.from(줄).sort();
    return { t, mean: avg(s), p05: quantile(s, .05), p95: quantile(s, .95) };
  });
}
// 민감도: 가정 하나만 정해 두고 나머지는 종합 결과처럼 범위 안에서 뽑아, 그 조건의 손해 볼 확률과 평균 이익을 구함
export function caseStats(items, p, over, seed, runs) {
  const pp = { ...p, ...over, fix: { ...(over.fix || {}) } };
  const E = econ(items, pp), pis = { a: inclusion(items, pp.kbar, 0), b: inclusion(items, pp.kbar, pp.beta) }, acc = newAcc(runs, items.length);
  for (let r = 0; r < runs; r++) step(pp, E, pis, seed, r, acc);
  const q = Float64Array.from(acc.inc).sort();
  return { mean: avg(q), p05: quantile(q, .05), p95: quantile(q, .95), loss: q.filter(v => v < 0).length / runs };
}
const pc = v => Math.round(v * 100) + '%';
export function tornadoCases(p) {
  const k = p.kbar, kl = Math.max(.5, k - 1);
  return [
    ['평균 월 방문 횟수', [`${p.mu[0]}회`, `${p.mu[2]}회`], { fix: { mu: p.mu[0] } }, { fix: { mu: p.mu[2] } }],
    ['기존 고객 비율', [pc(p.ex[0]), pc(p.ex[2])], { fix: { r: p.ex[0] } }, { fix: { r: p.ex[2] } }],
    ['회원권 없어도 받았을 시술 비율', [pc(p.keep[0]), pc(p.keep[2])], { fix: { s: p.keep[0] } }, { fix: { s: p.keep[2] } }],
    ['방문당 평균 시술 수', [`${+kl.toFixed(1)}개`, `${+(k + 1).toFixed(1)}개`], { kbar: kl }, { kbar: k + 1 }],
    ['할인 큰 시술 선호도', ['0', '2'], { beta: 0 }, { beta: 2 }],
    ['할인 큰 시술 위주 회원 비율', [pc(p.mix[0]), pc(p.mix[2])], { fix: { mix: p.mix[0] } }, { fix: { mix: p.mix[2] } }]
  ];
}
