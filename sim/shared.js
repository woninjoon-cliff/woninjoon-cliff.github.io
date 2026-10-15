/* 시뮬레이터 셋(런처 · 마케팅 · 회원권)이 같이 쓰는 것 — 시뮬 목록 · 토큰 없는 서버 부르기 · 위 막대 시뮬 바꾸기 메뉴.
   메뉴는 10/15 사용자 ①A: 왼쪽 위 이름을 누르면 열리고, 로그인된 시뮬은 바로, 아니면 메뉴 안에서 그 시뮬 비밀번호.
   시안 https://claude.ai/artifact/AnmhbgAXePD2yURUNi8ndz */
export const RPC = location.hostname === 'localhost' ? '/rpc' : 'https://koulrgvigntnqpwgpgzt.supabase.co/functions/v1/rpc';
/* 저장소가 막힌 브라우저(사생활 창 등)에서도 화면은 돈다 */
export const 보관 = {
  읽기: k => { try { return localStorage.getItem(k); } catch { return null; } },
  쓰기: (k, v) => { try { localStorage.setItem(k, v); } catch { /* 기억만 못 한다 */ } }
};
const 선 = d => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
export const 시뮬 = {
  marketing: { 이름: '마케팅 시뮬레이터', 주소: '/sim/marketing/', 앞: 'MKT', 토큰: 'mkt-token',
    그림: 선('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>') },
  membership: { 이름: '회원권 손익 시뮬레이터', 주소: '/sim/membership/', 앞: 'MEM', 토큰: 'mem-token',
    그림: 선('<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 11v2M13 17v2"/>') }
};
export const 화살 = 선('<path d="M5 12h14M13 6l6 6-6 6"/>');

/* 토큰 없이 부르는 것(login · 비밀번호처음 · 비밀번호바꾸기 · 마스터PIN처음) */
export async function 부르기(fn, ...args) {
  const r = await fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-sim-token': '' }, body: JSON.stringify({ fn, args }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.err) throw new Error(j.err || `서버 응답 ${r.status}`);
  return j.ok;
}

/* 위 막대 이름(#시뮬메뉴) → 메뉴(#시뮬목록). 떠나기전 = 고치던 것 저장(마케팅 저장하기 · 회원권 저장) */
export function 시뮬메뉴(지금, 떠나기전) {
  const $ = id => document.getElementById(id), 단추 = $('시뮬메뉴'), 목록 = $('시뮬목록');
  let 갈 = null;
  const 닫기 = () => { 목록.hidden = true; 단추.setAttribute('aria-expanded', 'false'); };
  const 가기 = async 키 => { 보관.쓰기('sim-last', 키); await 떠나기전(); location.assign(시뮬[키].주소); };
  function 그리기() {
    목록.innerHTML = '<p class="시뮬목록글">시뮬레이터</p>' + Object.entries(시뮬).map(([키, s]) =>
      `<button type="button" class="시뮬줄" data-시뮬="${키}"${키 === 지금 ? ' aria-current="page"' : ''}><span class="작타일">${s.그림}</span><span class="시뮬이름">${s.이름}</span>` +
      `<span class="꼬리">${키 === 지금 ? 선('<path d="M20 6 9 17l-5-5"/>') : 보관.읽기(s.토큰) ? '바로 열기' : '비밀번호 필요'}</span></button>`).join('') +
      `<form class="시뮬비번" id="시뮬비번" hidden novalidate><p class="시뮬비번글" id="시뮬비번글"></p>
        <div class="시뮬알칸"><input id="시뮬비번칸" type="password" autocomplete="current-password" placeholder="비밀번호"><button type="submit" id="시뮬비번단추" disabled aria-label="들어가기">${화살}</button></div>
        <p class="시뮬비번오류" id="시뮬비번오류" role="alert"></p></form>`;
  }
  단추.addEventListener('click', e => {
    e.stopPropagation();
    if (!목록.hidden) return 닫기();
    갈 = null; 그리기(); 목록.hidden = false; 단추.setAttribute('aria-expanded', 'true');
  });
  목록.addEventListener('click', e => {
    e.stopPropagation();
    const 줄 = e.target.closest('.시뮬줄'); if (!줄) return;
    const 키 = 줄.dataset.시뮬;
    if (키 === 지금) return 닫기();
    if (보관.읽기(시뮬[키].토큰)) return 가기(키);
    갈 = 키;
    $('시뮬비번글').textContent = `${시뮬[키].이름} 비밀번호를 넣어 주세요`;
    $('시뮬비번칸').setAttribute('aria-label', 시뮬[키].이름 + ' 비밀번호');
    $('시뮬비번').hidden = false; $('시뮬비번칸').focus();
  });
  목록.addEventListener('input', () => { $('시뮬비번오류').textContent = ''; $('시뮬비번단추').disabled = !$('시뮬비번칸').value; });
  목록.addEventListener('submit', async e => {
    e.preventDefault();
    const s = 시뮬[갈]; $('시뮬비번단추').disabled = true;
    try {
      const r = await 부르기(s.앞 + '_login', $('시뮬비번칸').value);
      if (r.처음) { await 떠나기전(); return location.assign('/sim/#' + 갈); }   // 비밀번호를 아직 안 정한 시뮬 — 정하는 곳은 런처
      보관.쓰기(s.토큰, r.토큰);
      await 가기(갈);
    } catch (err) {
      $('시뮬비번오류').textContent = err instanceof TypeError ? '서버에 닿지 못했습니다 — 인터넷을 확인해 주세요.' : err.message;
      $('시뮬비번칸').select(); $('시뮬비번단추').disabled = false;
    }
  });
  document.addEventListener('click', () => { if (!목록.hidden) 닫기(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !목록.hidden) { 닫기(); 단추.focus(); } });
}
