/* 회원권 손익 시뮬레이터 화면 — vvclsim /membership/. 서버 = ERP Edge rpc MEM_(mkt.ts), 저장 = Supabase 회원권시나리오.
   2026-10-14 새로 짬(답 → 원인 → 손잡이, 마케팅 시뮬과 같은 생김새). 계산은 calc.js(검사 sim/test-membership-calc.mjs).
   ★ 기본 시술 표(원가) · 9월 전체 건수는 로그인 뒤 MEM_기본시술 로 받는다 — 화면 파일은 비밀번호 없이 열린다.
   ★ 안(시나리오) 꼴은 옛 화면과 같다 — params = 옛 입력 칸 id 를 키로 한 값, items = 시술 표 통째 */
import { econ, inclusion, newAcc, step, summarize, 달별요약, caseStats, tornadoCases } from './calc.js';
import { 시뮬메뉴 } from '../shared.js';

const 회원RPC = location.hostname === 'localhost' ? '/rpc' : 'https://koulrgvigntnqpwgpgzt.supabase.co/functions/v1/rpc';
const 회원토큰 = {
  읽기: () => { try { return localStorage.getItem('mem-token'); } catch { return null; } },
  쓰기: v => { try { localStorage.setItem('mem-token', v); } catch { /* 이번 창만 */ } },
  지우기: () => { try { localStorage.removeItem('mem-token'); } catch { /* 없다 */ } }
};
if (!회원토큰.읽기()) location.replace('/sim/#membership');
async function 회원부르기(fn, ...args) {
  let r;
  try {
    r = await fetch(회원RPC, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-sim-token': 회원토큰.읽기() || '' }, body: JSON.stringify({ fn, args }) });
  } catch { throw new Error('서버에 닿지 못했습니다 — 인터넷을 확인해 주세요.'); }
  const j = await r.json().catch(() => ({}));
  /* 새로고침하면 저장 안 한 입력이 날아간다 — 처음 불러올 때만 런처로, 저장 중엔 문구만 */
  if (r.status === 401) throw Object.assign(new Error('로그인이 풀렸습니다. [로그아웃]을 눌러 다시 들어와 주세요.'), { 풀림: true });
  if (!r.ok || j.err) throw new Error(j.err || '서버 오류 ' + r.status);
  return j.ok;
}

const $ = id => document.getElementById(id);
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const 억만 = v => { const s = v < 0 ? '−' : '', a = Math.round(Math.abs(v) / 1e4), e = Math.floor(a / 1e4), m = a % 1e4;
  return s + (e ? e.toLocaleString('ko-KR') + '억' + (m ? ' ' + m.toLocaleString('ko-KR') + '만' : '') : m.toLocaleString('ko-KR') + '만'); };
const 축 = v => { if (Math.abs(v) < 1) return '0'; const a = Math.abs(v), s = v < 0 ? '−' : '';
  return s + (a >= 1e8 ? +(a / 1e8).toFixed(2) + '억' : Math.round(a / 1e4).toLocaleString('ko-KR') + '만'); };
const 원 = v => (Math.round(v) < 0 ? '−' : '') + Math.abs(Math.round(v)).toLocaleString('ko-KR');
const 퍼 = v => (v * 100).toFixed(1) + '%';
function niceStep(raw) { if (!(raw > 0)) return 1; const e = 10 ** Math.floor(Math.log10(raw)), f = raw / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e; }
const 눈금들 = (lo, hi, 개) => { const st = niceStep((hi - lo) / 개); const a = Math.floor(lo / st) * st, b = Math.ceil(hi / st) * st;
  return { lo: a, hi: b, 칸: Array.from({ length: Math.round((b - a) / st) + 1 }, (_, i) => a + i * st) }; };

let SEPT_TOTAL = 0;
const ITEMS = [];
const MODES = [
  { key: 'mix', label: '종합', 설명: '일부는 할인 큰 시술 위주, 나머지는 실적대로 — 현실 추정' },
  { key: 'real', label: '원가표 실적 분포', 설명: '모두 8 · 9월 실적 비율대로 — 좋은 쪽 끝' },
  { key: 'tilt', label: '할인 큰 시술 위주', 설명: '모두 할인 큰 시술을 더 고른다 — 나쁜 쪽 끝' }
];

/* 값 — 키는 옛 입력 칸 id(저장된 안의 params 와 같은 꼴) */
const 처음값 = { members: 100, months: 36, fee: 4980000, mu0: 0.4, mu1: 0.6, mu2: 0.8, ex0: 40, ex1: 60, ex2: 80, keep0: 30, keep1: 50, keep2: 70,
  mix0: 30, mix1: 50, mix2: 70, kbar: 2, cv: 0.8, beta: 1, comm: 0, acq: 0, opex: 0, fixed: 0, runs: 500 };
let 값 = { ...처음값 };
const 줄들 = [
  { 묶음: '회원' },
  { 키: 'members', 이름: '회원 수', 단: '명', 최소: 1, 최대: 1000, 걸음: 1 },
  { 키: 'months', 이름: '회원 기간', 단: '개월', 최소: 1, 최대: 60, 걸음: 1 },
  { 키: 'fee', 이름: '가입비', 단: '원', 최소: 0, 최대: 10000000, 걸음: 10000, 풀이: '회원 1명당 가입할 때 한 번' },
  { 묶음: '불확실한 가정 — 회차마다 이 범위 안에서 뽑는다 (최소 · 가능성 높음 · 최대)' },
  { 셋: 'mu', 이름: '평균 월 방문 횟수', 단: '회', 최소: 0, 최대: 3, 걸음: 0.1, 풀이: '0.6이면 10달에 6번' },
  { 셋: 'ex', 이름: '기존 고객 비율', 단: '%', 최소: 0, 최대: 100, 걸음: 5 },
  { 셋: 'keep', 이름: '회원권 없어도 받았을 시술 비율', 단: '%', 최소: 0, 최대: 100, 걸음: 5, 풀이: '기존 고객만' },
  { 셋: 'mix', 이름: '할인 큰 시술 위주 회원 비율', 단: '%', 최소: 0, 최대: 100, 걸음: 5, 풀이: '종합 결과에 쓰임' },
  { 묶음: '이용 패턴' },
  { 키: 'kbar', 이름: '방문당 평균 시술 수', 단: '개', 최소: 0, 최대: 5, 걸음: 0.1 },
  { 키: 'cv', 이름: '회원 간 이용 편차', 단: '', 최소: 0, 최대: 3, 걸음: 0.1, 풀이: '0이면 모두 같은 빈도' },
  { 키: 'beta', 이름: '할인 큰 시술 선호도', 단: '', 최소: 0, 최대: 5, 걸음: 0.1, 풀이: '0이면 실적 비율 그대로' },
  { 묶음: '비용' },
  { 키: 'comm', 이름: '결제 수수료율', 단: '%', 최소: 0, 최대: 10, 걸음: 0.1 },
  { 키: 'acq', 이름: '회원 1명당 모집 · 판매비', 단: '원', 최소: 0, 최대: 1000000, 걸음: 10000 },
  { 키: 'opex', 이름: '시술 1건당 운영비', 단: '원', 최소: 0, 최대: 200000, 걸음: 1000 },
  { 키: 'fixed', 이름: '기간 고정비 총액', 단: '원', 최소: 0, 최대: 100000000, 걸음: 1000000 },
  { 묶음: '계산' },
  { 키: 'runs', 이름: '반복 횟수', 단: '회', 최소: 50, 최대: 5000, 걸음: 50, 풀이: '같은 값이면 늘 같은 결과' }
];
const 줄찾기 = k => 줄들.find(줄 => 줄.키 === k || (줄.셋 && k.startsWith(줄.셋) && k.length === 줄.셋.length + 1));

/* 값 → 계산 인자 — 옛 화면 readParams 와 같은 경계 */
function 인자() {
  const c = (v, a, b) => Math.min(b, Math.max(a, v)), n = k => Number(값[k]) || 0;
  const 셋 = (k, hi, scale) => [0, 1, 2].map(j => c(n(k + j), 0, hi) / scale).sort((a, b) => a - b);
  return { members: c(Math.round(n('members')), 1, 5000), months: c(Math.round(n('months')), 1, 120), fee: Math.max(0, n('fee')),
    mu: 셋('mu', 30, 1), ex: 셋('ex', 100, 100), keep: 셋('keep', 100, 100), mix: 셋('mix', 100, 100),
    kbar: c(n('kbar'), 0, ITEMS.length), cv: c(n('cv'), 0, 3), beta: c(n('beta'), 0, 5),
    comm: c(n('comm'), 0, 100) / 100, acq: Math.max(0, n('acq')), opex: Math.max(0, n('opex')),
    fixed: Math.max(0, n('fixed')), runs: c(Math.round(n('runs')), 50, 5000) };
}

/* ── 바꿔 보기 ── */
const 소수 = 걸음 => (String(걸음).split('.')[1] || '').length;
const 칸값 = (줄, v) => 줄.단 === '원' ? 원(v) : String(+Number(v).toFixed(소수(줄.걸음)));
const 말 = ['최소', '가능성 높음', '최대'];
function 바꿈그리기() {
  $('바꿈').innerHTML = '<thead><tr><th>항목</th><th>값</th><th>끌어서 바꾸기</th></tr></thead><tbody>' + 줄들.map(줄 => {
    if (줄.묶음) return `<tr><td class="묶음" colspan="3">${줄.묶음}</td></tr>`;
    const 이름 = 줄.이름 + (줄.풀이 ? `<small>${줄.풀이}</small>` : '');
    if (줄.셋) {
      const ks = [0, 1, 2].map(j => 줄.셋 + j);
      return `<tr><td>${이름}</td><td><span class="셋칸">${ks.map((k, j) => `<input class="칸글" data-값="${k}" inputmode="decimal" aria-label="${줄.이름} ${말[j]}" value="${칸값(줄, 값[k])}">`).join('')}</span><span class="단">${줄.단}</span></td>
        <td><div class="셋끌">${ks.map((k, j) => `<input type="range"${j === 1 ? ' class="가운데"' : ''} data-끌="${k}" min="${줄.최소}" max="${줄.최대}" step="${줄.걸음}" value="${값[k]}" aria-label="${줄.이름} ${말[j]} 끌기">`).join('')}</div></td></tr>`;
    }
    return `<tr><td>${이름}</td><td><input class="칸글" id="${줄.키}" data-값="${줄.키}" inputmode="decimal" aria-label="${줄.이름}" value="${칸값(줄, 값[줄.키])}"><span class="단">${줄.단}</span></td>
      <td><input type="range" data-끌="${줄.키}" min="${줄.최소}" max="${줄.최대}" step="${줄.걸음}" value="${값[줄.키]}" aria-label="${줄.이름} 끌기"></td></tr>`;
  }).join('') + '</tbody>';
  끌칠하기();
}
function 끌칠하기() {
  const 몫 = i => (Math.min(+i.max, Math.max(+i.min, +i.value)) - i.min) / (i.max - i.min) * 100;
  document.querySelectorAll('#바꿈 input[type=range]').forEach(i => { if (!i.closest('.셋끌')) i.style.setProperty('--p', 몫(i) + '%'); });
  document.querySelectorAll('#바꿈 .셋끌').forEach(d => { const [a, , b] = [...d.querySelectorAll('input')].map(몫); d.style.setProperty('--a', a + '%'); d.style.setProperty('--b', b + '%'); });
}
const 칸맞추기 = k => { const 줄 = 줄찾기(k), 칸 = document.querySelector(`#바꿈 [data-값="${k}"]`), 끌 = document.querySelector(`#바꿈 [data-끌="${k}"]`);
  if (칸 && document.activeElement !== 칸) 칸.value = 칸값(줄, 값[k]); if (끌) 끌.value = 값[k]; };
$('바꿈').addEventListener('input', e => {
  const k = e.target.dataset.끌; if (!k) return;
  값[k] = +e.target.value;
  const 줄 = 줄찾기(k);
  if (줄.셋) {   // 손잡이 셋은 최소 ≤ 가능성 높음 ≤ 최대 — 넘으면 옆 손잡이를 밀고 간다
    const j = +k.slice(-1), s = 줄.셋;
    for (let i = j + 1; i < 3; i++) if (값[s + i] < 값[s + (i - 1)]) 값[s + i] = 값[s + (i - 1)];
    for (let i = j - 1; i >= 0; i--) if (값[s + i] > 값[s + (i + 1)]) 값[s + i] = 값[s + (i + 1)];
    [0, 1, 2].forEach(i => 칸맞추기(s + i));
  } else 칸맞추기(k);
  끌칠하기(); 바뀜();
});
$('바꿈').addEventListener('change', e => {
  const k = e.target.dataset.값; if (!k) return;
  const v = Number(e.target.value.replace(/[,\s원%]/g, ''));
  if (Number.isFinite(v) && v >= 0) 값[k] = v;
  e.target.value = 칸값(줄찾기(k), 값[k]); 칸맞추기(k); 끌칠하기(); 바뀜();
});
$('되돌리기').addEventListener('click', () => { 값 = { ...처음값 }; 바꿈그리기(); 바뀜(); });

/* ── 계산 ── */
let 차례 = 0, 계산타이머 = 0, 지난 = null;
const seed = 20261014;   // 늘 같은 난수 — 새로고침해도 같은 값이면 같은 결과, 차이는 값을 바꾼 데서만
const 쉼 = () => new Promise(ok => setTimeout(ok, 0));
const 상태 = t => { $('상태').textContent = t; };
function 바뀜() { 저장예약(); clearTimeout(계산타이머); 계산타이머 = setTimeout(계산, 250); }
async function 계산() {
  const 내차례 = ++차례, p = 인자(), n = ITEMS.length;
  if (!n) return 상태('시술 표가 비었습니다 — 시술을 넣으면 계산합니다');
  const E = econ(ITEMS, p), piReal = inclusion(ITEMS, p.kbar, 0), piTilt = inclusion(ITEMS, p.kbar, p.beta);
  const PIS = { mix: { a: piReal, b: piTilt }, real: { a: piReal }, tilt: { a: piTilt } };
  const 경우 = MODES.map(m => ({ ...m, pi: PIS[m.key], acc: newAcc(p.runs, n, m.key === 'mix' ? p.months : 0) }));
  const t0 = performance.now();
  let r = 0;
  while (r < p.runs) {
    const 까지 = performance.now() + 24;
    while (r < p.runs && performance.now() < 까지) { for (const md of 경우) step(p, E, md.pi, seed, r, md.acc); r++; }
    상태(`계산 중 ${Math.round(r / p.runs * 100)}%`);
    await 쉼(); if (내차례 !== 차례) return;
  }
  경우.forEach(md => { md.stats = summarize(md.acc, p); });
  지난 = { p, E, 경우, 달: 달별요약(경우[0].acc) };
  답그리기(); 쌓임그리기(); 경우그리기(); 폭포그리기(); 시술결과(); 안탭그리기();
  상태(`${p.runs.toLocaleString('ko-KR')}회 반복 · 회원 ${p.members.toLocaleString('ko-KR')}명 · ${((performance.now() - t0) / 1000).toFixed(1)}초`);
  /* 무엇이 가장 크게 바꾸나 — 가정마다 최소 · 최대로 다시 돌린다(시간이 걸려 뒤에) */
  const 가정들 = tornadoCases(p), runsT = Math.max(100, Math.ceil(30000 / p.members)), 줄 = [];
  $('토네이도').innerHTML = '<p class="계산중">다시 계산 중</p>';
  for (const [이름, 범위, lo, hi] of 가정들) {
    await 쉼(); if (내차례 !== 차례) return;
    const a = caseStats(ITEMS, p, lo, seed, runsT);
    await 쉼(); if (내차례 !== 차례) return;
    줄.push({ 이름, 범위, lo: a, hi: caseStats(ITEMS, p, hi, seed, runsT) });
    $('토네이도').innerHTML = `<p class="계산중">다시 계산 중 ${Math.round(줄.length / 가정들.length * 100)}%</p>`;
  }
  토네이도그리기(경우[0].stats, 줄);
}

/* ── 답 한 줄 ── */
function 답그리기() {
  const { p, 경우 } = 지난, s = 경우[0].stats;
  $('답이름').textContent = `실제로 늘어나는 이익 · 종합 · ${p.months}개월`;
  $('답이익').textContent = 억만(s.mean); $('답이익').classList.toggle('음', s.mean < 0);
  $('답범위').textContent = `하위 5% ${축(s.p05)} ~ 상위 5% ${축(s.p95)}`;
  $('답손해').textContent = 퍼(s.lossP);
  $('답손해풀이').textContent = `${p.runs.toLocaleString('ko-KR')}번 중 ${Math.round(s.lossP * p.runs).toLocaleString('ko-KR')}번 손해`;
  $('답남는').textContent = 억만(s.contrib); $('답남는').classList.toggle('음', s.contrib < 0);
  $('답줄어').textContent = s.cannib ? '−' + 억만(s.cannib) : '0';
  $('답건수').textContent = Math.round(s.load).toLocaleString('ko-KR') + '건';
  $('답건수풀이').textContent = SEPT_TOTAL ? `9월 전체 ${SEPT_TOTAL.toLocaleString('ko-KR')}건의 ${퍼(s.load / SEPT_TOTAL)}` : '';
}

/* ── ② 달마다 쌓이는 이익 — 평균 선 + 하위 5% ~ 상위 5% 띠, 0원 점선, 올리면 그 달 ── */
function 쌓임그리기() {
  const 달 = 지난.달, N = 달.length - 1, box = $('쌓임');
  const W = Math.max(320, box.clientWidth - 24), H = 320, L = 64, R = 150, T = 18, B = 36, pw = W - L - R, ph = H - T - B;
  const { lo, hi, 칸 } = 눈금들(Math.min(0, ...달.map(d => d.p05)), Math.max(0, ...달.map(d => d.p95)) || 1, 5);
  const X = t => L + t / N * pw, Y = v => T + ph - (v - lo) / (hi - lo) * ph;
  const 사이 = N > 60 ? 12 : N > 24 ? 6 : N > 12 ? 3 : 1;
  let g = 칸.map(v => `<line x1="${L}" x2="${L + pw}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--stroke2)"/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end">${축(v)}</text>`).join('');
  for (let t = 0; t <= N; t += 사이) g += `<text x="${X(t)}" y="${H - B + 20}" text-anchor="middle">${t}개월</text>`;
  const 띠 = 달.map(d => `${X(d.t)},${Y(d.p95)}`).join(' ') + ' ' + [...달].reverse().map(d => `${X(d.t)},${Y(d.p05)}`).join(' ');
  const 선 = 달.map(d => `${X(d.t)},${Y(d.mean)}`).join(' ');
  const 끝 = 달[N];
  box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="달마다 쌓이는 이익. ${N}개월 끝 평균 ${억만(끝.mean)}">${g}
    <polygon points="${띠}" fill="var(--band)" stroke="var(--stroke1)" stroke-width="1"/>
    ${lo < 0 ? `<line x1="${L}" x2="${L + pw}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--fg4)" stroke-dasharray="5 4"/><text x="${L + 6}" y="${Y(0) - 6}">0원</text>` : ''}
    <polyline points="${선}" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="${X(0)}" cy="${Y(달[0].mean)}" r="4" fill="var(--brand)"/><text x="${X(0) + 8}" y="${Y(달[0].mean) - 8}">가입비 순액 ${축(달[0].mean)}</text>
    <circle cx="${X(N)}" cy="${Y(끝.mean)}" r="5" fill="var(--brand)" stroke="var(--bg1)" stroke-width="2"/>
    <text class="강" x="${X(N) + 10}" y="${Y(끝.mean) + 4}">${N}개월 ${축(끝.mean)}</text>
    <text x="${X(N) + 10}" y="${Y(끝.p95) + 4}">상위 5% ${축(끝.p95)}</text><text x="${X(N) + 10}" y="${Y(끝.p05) + 4}">하위 5% ${축(끝.p05)}</text>
    <line id="쌓임선" x1="0" x2="0" y1="${T}" y2="${T + ph}" stroke="var(--fg3)" visibility="hidden"/>
    <rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="transparent"/></svg><div id="풀이창" hidden></div>`;
  const svg = box.firstElementChild, 세로 = svg.querySelector('#쌓임선'), 창 = box.querySelector('#풀이창');
  svg.onpointerleave = () => { 창.hidden = true; 세로.setAttribute('visibility', 'hidden'); };
  svg.onpointermove = e => {
    const x = e.clientX - svg.getBoundingClientRect().left, t = Math.round((x - L) / pw * N);
    if (t < 0 || t > N) return svg.onpointerleave();
    const d = 달[t]; 세로.setAttribute('x1', X(t)); 세로.setAttribute('x2', X(t)); 세로.setAttribute('visibility', 'visible');
    창.innerHTML = `<b>${t}개월째 · 평균 ${억만(d.mean)}</b>하위 5% ${축(d.p05)} ~ 상위 5% ${축(d.p95)}`; 창.hidden = false;
    창.style.left = Math.min(X(t) + 24, W - 창.offsetWidth) + 'px'; 창.style.top = (Y(d.mean) - 20) + 'px';
  };
  /* 한 줄 풀이 — 0원 밑으로 가는 달 */
  const 아래 = k => 달.find(d => d.t > 0 && d[k] < 0)?.t;
  const 하 = 아래('p05'), 평 = 아래('mean');
  $('쌓임글').innerHTML = `가입비로 먼저 <b>${억만(달[0].mean)}</b> 받고 ${N}개월 끝에 평균 <b>${억만(끝.mean)}</b> 남습니다. ` +
    (평 ? `<span class="음">평균도 ${평}개월째에 0원 아래로 내려갑니다.</span>` : 하 ? `하위 5%는 <b>${하}개월째</b>에 0원 아래로 내려갑니다.` : `${N}개월 내내 하위 5%도 0원 위에 있습니다.`);
}

/* ── ③ 세 경우 — 범위 막대 한 판 ── */
function 경우그리기() {
  const 경우 = 지난.경우;
  const { lo, hi, 칸 } = 눈금들(Math.min(0, ...경우.map(m => m.stats.p05)), Math.max(0, ...경우.map(m => m.stats.p95)) || 1, 6);
  const X = v => (v - lo) / (hi - lo) * 100;
  $('경우들').innerHTML = 경우.map((m, i) => { const s = m.stats, 종 = i ? '' : ' 종합';
    return `<div class="이름${종}"><b>${m.label}</b><small>${m.설명}</small></div>
      <div class="막대칸" role="img" aria-label="${m.label}: 평균 ${억만(s.mean)}, 하위 5% ${축(s.p05)} ~ 상위 5% ${축(s.p95)}, 손해 볼 확률 ${퍼(s.lossP)}">
        <span class="띠" style="left:${X(s.p05)}%;width:${X(s.p95) - X(s.p05)}%"></span>
        ${s.p05 < 0 ? `<span class="띠 손해" style="left:${X(s.p05)}%;width:${X(Math.min(0, s.p95)) - X(s.p05)}%"></span>` : ''}
        <span class="영선" style="left:${X(0)}%"></span><span class="점${종}" style="left:${X(s.mean)}%"></span></div>
      <div class="경우값">평균 <b class="${s.mean < 0 ? '음' : ''}">${억만(s.mean)}</b> · 손해 ${퍼(s.lossP)}<br><span class="흐">${축(s.p05)} ~ ${축(s.p95)}</span></div>`; }).join('') +
    `<div class="축">${칸.map(v => `<span style="left:${X(v)}%">${축(v)}</span>`).join('')}</div>`;
}

/* ── ④ 폭포 — 남는 돈 − 줄어드는 이익 = 늘어나는 이익 ── */
function 폭포그리기() {
  const s = 지난.경우[0].stats, 남 = s.contrib, 줄 = s.cannib, 늘 = s.mean, box = $('폭포');
  const W = Math.max(300, box.clientWidth - 40), H = 240, T = 30, B = 44, ph = H - T - B;
  const { lo, hi } = 눈금들(Math.min(0, 늘, 남 - 줄), Math.max(0, 남) || 1, 4);
  const Y = v => T + (hi - v) / (hi - lo) * ph, 폭 = W / 3, 막 = Math.min(120, 폭 * .5), x = i => 폭 * i + (폭 - 막) / 2;
  const 막대 = (i, a, b, 색) => `<rect x="${x(i)}" y="${Y(Math.max(a, b))}" width="${막}" height="${Math.max(1, Math.abs(Y(a) - Y(b)))}" rx="2" fill="${색}"/>`;
  const 글 = (i, v, t, 강) => `<text${강 ? ' class="강"' : ''} x="${x(i) + 막 / 2}" y="${Y(Math.max(0, v, i === 1 ? 남 : 0)) - 8}" text-anchor="middle">${t}</text>`;
  box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="회원권에서 남는 돈 ${억만(남)}에서 줄어드는 이익 ${억만(줄)}을 빼면 실제로 늘어나는 이익 ${억만(늘)}">
    <line x1="0" x2="${W}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--stroke1)"/>
    ${막대(0, 0, 남, 'var(--past)')}${막대(1, 남, 남 - 줄, 'var(--barReal)')}${막대(2, 0, 늘, 늘 < 0 ? 'var(--danger)' : 'var(--brand)')}
    <line x1="${x(0) + 막}" x2="${x(1)}" y1="${Y(남)}" y2="${Y(남)}" stroke="var(--fg4)" stroke-dasharray="3 3"/>
    <line x1="${x(1) + 막}" x2="${x(2)}" y1="${Y(남 - 줄)}" y2="${Y(남 - 줄)}" stroke="var(--fg4)" stroke-dasharray="3 3"/>
    ${글(0, 남, (남 < 0 ? '' : '+') + 억만(남))}${글(1, 남, '−' + 억만(줄))}${글(2, 늘, '= ' + 억만(늘), true)}
    ${['회원권에서 남는 돈', '기존 고객에게서 줄어드는 이익', '실제로 늘어나는 이익'].map((t, i) => `<text x="${x(i) + 막 / 2}" y="${H - 14}" text-anchor="middle">${t}</text>`).join('')}</svg>`;
}

/* ── ⑤ 토네이도 — 가운데 = 지금 평균, 막대 = 그 가정을 최소 · 최대로 둔 평균 ── */
function 토네이도그리기(cur, 줄) {
  줄.sort((a, b) => Math.abs(b.hi.mean - b.lo.mean) - Math.abs(a.hi.mean - a.lo.mean));
  const 값들 = 줄.flatMap(r => [r.lo.mean, r.hi.mean]).concat(cur.mean);
  const 작 = Math.min(...값들), 큰 = Math.max(...값들), 여유 = (큰 - 작 || 1) * .04, lo = 작 - 여유, hi = 큰 + 여유;
  const X = v => (v - lo) / (hi - lo) * 100, 중 = X(cur.mean);
  const 막대 = v => `<span class="토막 ${v < cur.mean ? '아래' : '위'}" style="left:${Math.min(X(v), 중)}%;width:${Math.abs(X(v) - 중)}%"></span>`;
  const 글 = (이름, v, 쪽) => `<span class="토글 ${쪽}">${이름} → <b class="${v < 0 ? '음' : ''}">${축(v)}</b></span>`;
  /* 글은 막대 양옆 칸 — 왼쪽 = 평균이 낮아지는 쪽, 오른쪽 = 높아지는 쪽 */
  $('토네이도').innerHTML = `<div class="토들">${줄.map(r => { const 둘 = [['최소 ' + r.범위[0], r.lo.mean], ['최대 ' + r.범위[1], r.hi.mean]].sort((a, b) => a[1] - b[1]);
    return `<div class="이름">${r.이름}<small>${r.범위[0]} ↔ ${r.범위[1]}</small></div>${글(...둘[0], '왼')}
    <div class="토칸" role="img" aria-label="${r.이름}: 최소 ${r.범위[0]}일 때 평균 ${억만(r.lo.mean)}, 최대 ${r.범위[1]}일 때 평균 ${억만(r.hi.mean)}">
      ${막대(r.lo.mean)}${막대(r.hi.mean)}<span class="중심" style="left:${중}%"></span></div>${글(...둘[1], '오')}`; }).join('')}
    <div class="토아래"><span class="강" style="left:${중}%">지금 평균 ${축(cur.mean)}</span></div></div>`;
}

/* ── 시술 표 ── */
function 시술그리기() {
  $('items').innerHTML = ITEMS.map((x, i) => `<tr>
    <td>${x.added ? `<span class="이름줄"><input class="칸글" id="name-${i}" value="${esc(x.name)}" placeholder="시술 이름" aria-label="추가한 시술 이름"><button type="button" class="단추 글" data-지움="${i}" aria-label="${esc(x.name)} 지우기">지우기</button></span>` : esc(x.name)}<span class="근거">${esc(x.src)}</span></td>
    <td><input class="칸글" id="list-${i}" type="number" min="0" step="100" value="${x.list}" aria-label="${esc(x.name)} 기존 판매가"><span class="기록없음" id="lf-${i}"${x.list > 0 ? ' hidden' : ''}>판매 기록 없음</span></td>
    <td><input class="칸글" id="price-${i}" type="number" min="0" step="100" value="${x.price}" aria-label="${esc(x.name)} 회원가"></td>
    <td id="dc-${i}"></td>
    <td><input class="칸글" id="cost-${i}" type="number" min="0" step="100" value="${x.cost}" aria-label="${esc(x.name)} 원가"></td>
    <td id="mg-${i}"></td>
    <td><input class="칸글 짧" id="lim-${i}" type="number" min="0" step="1" value="${x.lim || ''}" placeholder="무제한" aria-label="${esc(x.name)} 기간 한도"></td>
    <td><input class="칸글 짧" id="w-${i}" type="number" min="0" step="1" value="${x.w}" aria-label="${esc(x.name)} 실적 건수"></td>
    <td id="sh-${i}"></td><td id="u0-${i}"></td><td id="u1-${i}"></td><td id="u2-${i}"></td><td id="c0-${i}"></td><td id="c1-${i}"></td><td id="c2-${i}"></td></tr>`).join('');
}
function 시술읽기() {
  const n = id => Math.max(0, Number($(id).value) || 0);
  ITEMS.forEach((x, i) => { x.list = n('list-' + i); x.price = n('price-' + i); x.cost = n('cost-' + i); x.lim = Math.round(n('lim-' + i)); x.w = n('w-' + i);
    if (x.added) x.name = $('name-' + i).value.trim() || '추가 시술'; });
}
function 시술결과() {
  const { p, E, 경우 } = 지난, 칸 = (id, t, 음) => { const el = $(id); if (!el) return; el.textContent = t; el.classList.toggle('음', !!음); };
  const 합 = ITEMS.reduce((a, x) => a + x.w, 0), 회원수 = p.runs * p.members, 이용합 = 경우.map(() => 0), 남합 = 경우.map(() => 0);
  ITEMS.forEach((x, i) => {
    const m = E[i]?.m ?? 0;
    칸('dc-' + i, x.list > 0 ? 퍼(1 - x.price / x.list) : '–'); 칸('mg-' + i, 원(m), m < 0); 칸('sh-' + i, 합 ? 퍼(x.w / 합) : '–');
    $('lf-' + i).hidden = x.list > 0;
    경우.forEach((md, j) => { const u = (md.acc.usage[i] || 0) / 회원수, c = u * m; 칸(`u${j}-${i}`, u.toFixed(1)); 칸(`c${j}-${i}`, 원(c), c < 0); 이용합[j] += u; 남합[j] += c; });
  });
  $('w-sum').textContent = 합.toLocaleString('ko-KR');
  경우.forEach((md, j) => { 칸(`u${j}-sum`, 이용합[j].toFixed(1)); 칸(`c${j}-sum`, 원(남합[j]), 남합[j] < 0); });
}
const toItem = x => ({ name: String(x.name ?? ''), list: +x.list || 0, price: +x.price || 0, cost: +x.cost || 0, lim: +x.lim || 0, w: +x.w || 0, src: String(x.src ?? ''), added: !!x.added });
$('items').addEventListener('change', () => { 시술읽기(); 바뀜(); });
$('items').addEventListener('click', e => { const b = e.target.closest('[data-지움]'); if (!b) return; 시술읽기(); ITEMS.splice(+b.dataset.지움, 1); 시술그리기(); 바뀜(); });
$('addItem').addEventListener('click', () => {
  시술읽기();
  ITEMS.push({ name: '추가 시술 ' + (ITEMS.filter(x => x.added).length + 1), list: 0, price: 0, cost: 0, lim: 0, w: 0, src: '직접 추가 · 값은 VAT 제외로 입력', added: true });
  시술그리기(); 바뀜();
  const el = $('name-' + (ITEMS.length - 1)); el.focus(); el.select();
});
/* 시술 표 ↔ 엑셀 · CSV — 파일의 열 이름으로 찾으므로 열 순서는 바뀌어도 된다(옛 화면 그대로) */
const DEF_SRC = new Map();
const COLS = [['name', '시술명'], ['list', '기존 판매가'], ['price', '회원가'], ['cost', '원가'], ['lim', '기간 한도'], ['w', '실적 건수'], ['memo', '메모']];
const ALIAS = { name: ['시술명', '시술', '시술 이름'], list: ['기존 판매가', '판매가', '정가'], price: ['회원가'], cost: ['원가'], lim: ['기간 한도', '한도'], w: ['실적 건수', '건수', '실적'], memo: ['메모', '근거'] };
const ioMsg = (t, ok) => { $('ioMsg').textContent = t; $('ioMsg').className = '메시지 ' + (ok ? '됨' : '못'); };
function rowsToItems(aoa) {
  const norm = v => String(v ?? '').replace(/\s+/g, ' ').trim();
  const hi = aoa.findIndex(r => r.some(c => norm(c) === '시술명'));
  if (hi < 0) return { error: "'시술명' 열을 찾지 못했습니다. 양식의 첫 줄(열 이름)을 지우지 말아 주세요." };
  const head = aoa[hi].map(norm), col = {};
  for (const k in ALIAS) col[k] = head.findIndex(h => ALIAS[k].includes(h));
  const miss = ['price', 'cost', 'w'].filter(k => col[k] < 0).map(k => COLS.find(c => c[0] === k)[1]);
  if (miss.length) return { error: `필수 열이 없습니다: ${miss.join(', ')}` };
  const toNum = v => { const t = norm(v).replace(/[,원₩\s]/g, ''); if (t === '') return 0; const n = Number(t); return Number.isFinite(n) ? n : NaN; };
  const items = [], skipped = [], seen = new Set();
  aoa.slice(hi + 1).forEach((r, i) => {
    const line = hi + i + 2, name = norm(r[col.name]);
    const vals = ['list', 'price', 'cost', 'lim', 'w'].map(k => col[k] < 0 ? 0 : toNum(r[col[k]]));
    if (!name) { if (vals.some(v => v)) skipped.push(`${line}행(시술명 없음)`); return; }
    if (vals.some(v => Number.isNaN(v) || v < 0)) { skipped.push(`${line}행 ${name}(숫자가 아닌 값)`); return; }
    if (seen.has(name)) { skipped.push(`${line}행 ${name}(중복)`); return; }
    seen.add(name);
    const [list, price, cost, lim, w] = vals, memo = col.memo < 0 ? '' : norm(r[col.memo]);
    items.push({ name, list, price, cost, lim: Math.round(lim), w, src: memo || DEF_SRC.get(name) || '파일에서 불러옴', added: !DEF_SRC.has(name) });
  });
  return { items, skipped };
}
function parseCsv(t) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"' && t[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c; }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
$('dlTpl').addEventListener('click', () => {
  시술읽기();
  const aoa = [COLS.map(c => c[1]), ...ITEMS.map(x => [x.name, x.list, x.price, x.cost, x.lim || '', x.w, x.src])];
  try {
    if (window.XLSX) {
      const wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(wb, ws, '시술 메뉴');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['작성 방법'], ['금액은 모두 VAT 제외 원 단위 숫자로 적습니다. 쉼표는 있어도 됩니다.'], ['기간 한도: 비우거나 0이면 무제한입니다.'], ['실적 건수: 시술 비중의 기준입니다. 0이면 회원이 그 시술을 받지 않는 것으로 계산됩니다.'], ['첫 줄의 열 이름은 지우거나 바꾸지 마세요. 시술명·회원가·원가·실적 건수 열은 꼭 있어야 합니다.'], ['올리면 파일에 있는 시술만 표에 남습니다. 파일에서 지운 시술은 표에서도 빠집니다.']]), '작성 방법');
      XLSX.writeFile(wb, '회원권_시술메뉴_양식.xlsx');
    } else {
      const q = v => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + aoa.map(r => r.map(q).join(',')).join('\r\n')], { type: 'text/csv' }));
      a.download = '회원권_시술메뉴_양식.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
    ioMsg('양식을 내려받았습니다. 고친 뒤 [엑셀 · CSV 올리기]로 올려 주세요.', true);
  } catch { ioMsg('파일을 내려받지 못했습니다. 잠시 뒤 다시 눌러 주세요.'); }
});
$('ulBtn').addEventListener('click', () => $('ulFile').click());
$('ulFile').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const buf = await f.arrayBuffer(); let aoa;
    if (/\.csv$/i.test(f.name)) {
      let t; try { t = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { t = new TextDecoder('euc-kr').decode(buf); }   // 엑셀 "CSV" 저장은 EUC-KR
      aoa = parseCsv(t.replace(/^﻿/, ''));
    } else {
      if (!window.XLSX) return ioMsg('엑셀 파일을 읽는 기능을 불러오지 못했습니다. CSV로 저장해서 올려 주세요.');
      const wb = XLSX.read(buf, { type: 'array' });
      aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
    }
    const res = rowsToItems(aoa);
    if (res.error) return ioMsg(res.error);
    if (!res.items.length) return ioMsg('불러올 시술이 없습니다. 시술명이 적힌 줄이 있는지 확인해 주세요.');
    ITEMS.splice(0, ITEMS.length, ...res.items); 시술그리기(); 바뀜();
    ioMsg(`「${f.name}」에서 시술 ${res.items.length}개를 불러왔습니다.` + (res.skipped.length ? ` 건너뛴 줄: ${res.skipped.join(', ')}` : ''), !res.skipped.length);
  } catch { ioMsg('파일을 읽지 못했습니다. 양식에서 내려받은 엑셀(.xlsx)이나 CSV 파일인지 확인해 주세요.'); }
});

/* ── ⑦ 안 탭 — 바꾸면 저절로 저장(마케팅 시뮬과 같은 꼴) ── */
let 안들 = [], 지금안 = null, 저장타이머 = 0, 저장할것 = false, 지움준비 = 0;
const 새이름 = () => { for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') if (!안들.some(s => s.name === c + '안')) return c + '안'; return '새 안 ' + (안들.length + 1); };
const 표시 = (꼴, 글) => { const el = $('저장표시'); el.className = '저장표시' + (꼴 === '됨' ? ' 됨' : 꼴 === '못' ? ' 못' : '');
  el.textContent = { 됨: '저절로 저장됨', 중: '저장 중', 고침: '곧 저절로 저장', 못: '저장 못 함 — ' + (글 || '다시 시도합니다') }[꼴] || ''; el.hidden = !꼴; };
function 안탭그리기() {
  const 목록 = [...안들].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const 숫자 = 지난 ? 억만(지난.경우[0].stats.mean) : '';
  const 탭 = 목록.map(s => { const 나 = 지금안?.id === s.id; return `<button type="button" class="탭" role="tab" data-안="${esc(s.id)}" aria-selected="${나}">${esc(s.name)}<small>${나 ? 숫자 : '눌러서 보기'}</small></button>`; });
  const 저장됨 = 안들.some(s => s.id === 지금안?.id);
  if (!저장됨) 탭.unshift(`<button type="button" class="탭" role="tab" aria-selected="true">${esc($('안이름').value.trim() || 새이름())}<small>${숫자 ? 숫자 + ' · ' : ''}저장 전</small></button>`);
  $('안탭').innerHTML = 탭.join('') + '<button type="button" class="단추" id="새안">+ 다른 안</button>';
  $('안지우기').hidden = !저장됨;
}
function 저장예약() { 저장할것 = true; 표시('고침'); clearTimeout(저장타이머); 저장타이머 = setTimeout(저장, 900); }
async function 저장() {
  clearTimeout(저장타이머); 저장할것 = false;
  /* 번호는 첫 저장을 보내기 전에 정한다 — 응답이 늦을 때 또 바꿔도 같은 안으로 간다(두 개 생기지 않게) */
  if (!지금안) 지금안 = { id: crypto.randomUUID() };
  const id = 지금안.id, name = ($('안이름').value.trim() || 지금안.name || 새이름()).slice(0, 60);
  const 몸 = { name, params: { ...값 }, items: ITEMS.map(toItem) };
  표시('중');
  try {
    const { updated_at } = await 회원부르기('MEM_시나리오저장', id, name, 몸.params, 몸.items);
    const 새것 = { id, ...몸, updated_at };
    안들 = [새것, ...안들.filter(s => s.id !== id)];
    if (지금안?.id !== id) return;   // 저장하는 사이 다른 탭으로 옮겼다 — 목록만 고친다
    지금안 = 새것; if (document.activeElement !== $('안이름')) $('안이름').value = name;
    안탭그리기(); 표시(저장할것 ? '고침' : '됨');
  } catch (e) { if (지금안?.id === id) { 표시('못', e.message); 저장할것 = true; } }
}
function 적용(s) {
  지금안 = s;
  값 = { ...처음값 };
  for (const [k, v] of Object.entries(s.params || {})) if (Object.hasOwn(처음값, k) && Number.isFinite(Number(v))) 값[k] = Number(v);
  ITEMS.splice(0, ITEMS.length, ...(s.items || []).map(toItem));
  $('안이름').value = s.name; 바꿈그리기(); 시술그리기(); 안탭그리기(); 표시('됨');
  clearTimeout(계산타이머); 계산();
}
$('안탭').addEventListener('click', async e => {
  if (e.target.closest('#새안')) {   // 지금 값 그대로 복사해 새 안
    if (저장할것) await 저장();
    지금안 = null; $('안이름').value = 새이름(); await 저장();
    return;
  }
  const t = e.target.closest('[data-안]'); if (!t || t.dataset.안 === 지금안?.id) return;
  if (저장할것) await 저장();
  const s = 안들.find(x => x.id === t.dataset.안); if (s) 적용(s);
});
$('안이름').addEventListener('input', 저장예약);
$('안지우기').addEventListener('click', async () => {
  const b = $('안지우기');
  if (!지금안) return;
  if (Date.now() - 지움준비 > 4000) { 지움준비 = Date.now(); b.textContent = '한 번 더 누르면 지웁니다'; setTimeout(() => { b.textContent = '이 안 지우기'; }, 4000); return; }
  지움준비 = 0; b.textContent = '이 안 지우기';
  try {
    clearTimeout(저장타이머); 저장할것 = false;
    await 회원부르기('MEM_시나리오삭제', 지금안.id);
    안들 = 안들.filter(s => s.id !== 지금안.id);
    if (안들.length) 적용(안들[0]); else { 지금안 = null; $('안이름').value = 새이름(); 안탭그리기(); 표시(''); }
  } catch (e) { $('오류줄').textContent = '지우지 못했습니다. ' + e.message; }
});

/* ── 화면 탭 · 크기 ── */
document.querySelectorAll('.앱탭 [role=tab]').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.앱탭 [role=tab]').forEach(x => { const 나 = x === t; x.setAttribute('aria-selected', 나); $(x.getAttribute('aria-controls')).hidden = !나; });
  window.scrollTo(0, 0);
  if (t.id === '탭-시뮬' && 지난) { 쌓임그리기(); 폭포그리기(); }
}));
new ResizeObserver(() => { if (지난 && !$('시뮬판').hidden) { 쌓임그리기(); 폭포그리기(); } }).observe($('쌓임'));

/* ── 처음 — 기본 시술 표 · 안 목록을 같이 받는다. 토큰이 죽었으면 런처로 ── */
바꿈그리기();
(async () => {
  try {
    const [기본, 목록] = await Promise.all([회원부르기('MEM_기본시술'), 회원부르기('MEM_시나리오목록')]);
    SEPT_TOTAL = 기본.구월전체 || 0;
    기본.시술.forEach(x => DEF_SRC.set(x.name, x.src));
    안들 = 목록;
    if (안들.length) return 적용(안들[0]);   // 가장 최근에 고친 안
    ITEMS.splice(0, ITEMS.length, ...기본.시술.map(toItem));
  } catch (e) {
    if (e.풀림) { 회원토큰.지우기(); return location.replace('/sim/#membership'); }
    $('오류줄').textContent = '불러오지 못했습니다. ' + e.message;
  }
  $('안이름').value = 새이름(); 시술그리기(); 안탭그리기(); 계산();
})();

/* ── 로그아웃 · 다른 시뮬로(이름 메뉴 — 가기 전에 기다리던 저장을 마친다). 비밀번호 바꾸기는 런처 맨 아래(마스터 PIN, 10/15) ── */
$('로그아웃').addEventListener('click', () => 회원토큰.지우기());
시뮬메뉴('membership', () => 저장할것 ? 저장() : undefined);
