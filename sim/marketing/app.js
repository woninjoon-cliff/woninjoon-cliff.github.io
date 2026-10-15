/* 마케팅 시뮬레이터 화면 (v5) — 과거로 배우는 예상 (시안 https://claude.ai/artifact/E9ZFH4XQELbmznTT7hZ51J) · v4 달마다 한 장 · 안 여러 개 · 저절로 저장.
   달 줄에서 달을 고른다(12달 전까지). 한 달 = 실적 하나 + 계획 여러 개(A안 · B안 …). 계획의 기준 = 고른 기간(지난달 · 최근 3달 · 최근 6달)의 실적 평균.
   예상 ① 이 안의 숫자로 · ② 과거 실적 달들의 마케팅비 ↔ 매출 추세로. 목표를 넣으면 숫자마다 필요한 값을 과거 범위와 견준다.
   고치면 0.7초 뒤 차례대로 서버에 쓴다 — [저장] · 이름 짓기 없음. 생김새는 ERP 토큰(v3).
   ERP 는 월별 실적 탭 · 월 매출 그래프 · 월 목표에만(MKT_집계). spec docs/superpowers/specs/2026-10-13-marketing-sim-design.md ★ v5 · 셈은 calc.js · 서버는 mkt.ts */
import { 원, 만, 억, 퍼, 수, 달더하기, 빈안, 안꼴, 셈, 실적에서계획, 기준실적들, 기준만들기, 직접기준, 기준칸, 평균에서계획, 추세, 판정, 셋맞추기, 다음이름, 안분, 증감 } from './calc.js';
import { 시뮬메뉴 } from '../shared.js';

const RPC = location.hostname === 'localhost' ? '/rpc' : 'https://koulrgvigntnqpwgpgzt.supabase.co/functions/v1/rpc';
const $ = id => document.getElementById(id);
/* 서버에서 온 글자(안 이름 · 항목 이름 · 병원 이름)는 innerHTML 에 넣기 전에 늘 막는다 */
const 막기 = t => String(t).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
/* 사생활 창 · 막힌 저장소에서는 읽기가 null, 쓰기는 조용히 넘어간다 */
const 보관 = {
  읽기: (k, 세션) => { try { return (세션 ? sessionStorage : localStorage).getItem(k); } catch { return null; } },
  쓰기: (k, v, 세션) => { try { const s = 세션 ? sessionStorage : localStorage; v == null ? s.removeItem(k) : s.setItem(k, v); } catch { /* 없음 */ } }
};
const 베낌 = a => JSON.parse(JSON.stringify(a));

/* ── 용어 ⓘ — 헷갈릴 말마다 회색 i, 올리거나 누르면 풀이(ERP 공통_도움 꼴). 풀이는 여기 글만 — 사람이 친 글자는 들어가지 않는다 ── */
const 용어 = {
  종류: ['계획 · 실적', '계획 = 이 달에 이렇게 해 보면 어떨까 하는 숫자(여러 안). 실적 = 그 달에 실제로 나온 결과(쓴 돈 · 들어온 DB · 상담 · 매출) — 다음 달 계획의 기준이 된다.'],
  실적: ['실적', '그 달에 실제로 나온 숫자를 그대로 적는다. 넣으면 전환율 · 상담단가 · CPA 가 저절로 나오고, 다음 달 계획의 기준이 된다.'],
  기준: ['기준', '고른 기간(지난달 · 최근 3달 · 최근 6달)의 실적 평균. 바꿔 보기 표의 ‘기준’ 열과 슬라이더의 검은 눈금, [최근 N달 실적 평균으로 시작] 이 이 평균을 쓴다. [직접] 을 누르면 기준 숫자를 직접 넣는다 — 그 달의 모든 안이 같이 본다(과거 점 · 추세 · 판정 범위는 실적 그대로).'],
  비교: ['과거 실적과 견주기', '가로 = 마케팅비, 세로 = 매출. 회색 점 = 과거 달 실적, 회색 선 = 과거 추세(옅은 띠 = 흔들림 범위), 보라 점 = 이 달 안들. 같은 돈이면 위에 있는 안이 효율이 좋고, 안이 추세선보다 위면 과거보다 효율이 좋다고 가정한 안이다. 축은 점이 있는 범위만 보인다.'],
  바꿔보기: ['바꿔 보기', '숫자를 끌거나 칸에 직접 치면 예상 매출 · 그래프 · 목표까지 메우려면이 바로 바뀐다. 검은 눈금 = 기준(실적 평균) 값, 변화 = 기준보다 얼마나 바꿨나. 회색 칸 = 자동(DB 비용 셋 중 나머지 둘로 셈).'],
  월매출: ['월 매출', '회색 = ERP 에 기록된 실제 매출(VAT 제외, 진행 중인 달은 흐리게). 진한 막대 = 이 안의 예상. 점선 = 월 목표.'],
  메우기: ['목표까지 메우려면', '예상 매출이 목표에 모자랄 때, 숫자 하나만 바꾼다면 얼마나 바꿔야 하는지와 그게 과거 실적(지난 12달) 안에서 해 본 수준인지. 주황 표시 ▲ 최고 = 과거 최고보다 그만큼 높아야, ▼ 최저 = 과거 최저보다 그만큼 낮아야(CPA) 해서 그 숫자 하나로는 어렵다. 줄마다 따로 본 것이라 여러 줄을 같이 바꾸면 덜 바꿔도 된다(셀팅 시트의 안분표).'],
  목표: ['매출 목표', '이 계획의 매출 목표(상담 매출 + 상담 외 매출). 매출은 상담 기준으로 따진다. 비우면 고른 달의 ERP 월 목표로 견준다.'],
  마케팅비: ['마케팅비', '마케팅에 쓰는 돈 전부. DB 비용(연락처를 모으는 돈 — 금액 · DB · CPA 중 둘을 넣으면 나머지가 저절로)과 그 밖 비용(브랜딩 · 촬영 · 인건비 등 — 금액만).'],
  게더링: ['DB 비용', '광고 등으로 상담받을 사람의 연락처(DB)를 모으는 돈 — 예: 메타 리드 광고, DB 업체. 금액 · DB · CPA 셋이 이어져 둘을 넣으면 나머지가 저절로 나온다(회색 = 자동). 실적은 보통 금액 + DB, 계획은 금액 + CPA.'],
  그밖: ['그 밖 비용', 'DB 를 직접 만들지 않는 돈 — 브랜딩 · 촬영 · 인건비 등. 예상 ①(비율)에는 안 들어가고, 마케팅비 합과 예상 ②(과거 추세)에 들어간다.'],
  추세: ['과거 추세로 보면', '과거 실적 달들의 마케팅비 ↔ 매출을 한 줄로 맞춘 값(실적 3달 이상). 그 밖 비용 효과까지 담기지만 계절 · 이벤트 · 가격 변화가 섞여 참고용 — 범위로 본다. 달이 쌓일수록 믿을 만해진다.'],
  영업일: ['영업일', '목표의 하루 매출에 쓰이고, 기준 영업일보다 많거나 적으면 원내 · 문의(인) 상담이 그만큼 늘고 준다. 광고로 모은 아웃 DB 상담은 그대로.'],
  DB: ['DB', '상담받을 가능성이 있는 사람의 연락처 한 건. DB 비용 줄은 금액 ÷ CPA 로 DB 수가 나오고, DB 를 넣으면 CPA 가 나온다.'],
  CPA: ['CPA', 'DB 1개를 얻는 데 든 돈. 게더링비 1,000만 원으로 DB 200개면 CPA 5만 원.'],
  아웃DB: ['아웃 DB', '병원이 먼저 전화를 걸어야 하는 DB(아웃바운드) — 광고에 연락처만 남긴 사람. 게더링 DB + 추가 아웃 DB.'],
  추가아웃DB: ['추가 아웃 DB', '광고 게더링 말고 다른 데서 생긴 아웃 DB — LMS 문자 · 테스트 광고 · 심의 · 브랜딩 등.'],
  인DB: ['인 DB', '고객이 먼저 연락해 온 DB(인바운드) — 전화 · 카톡 · 홈페이지 문의 등.'],
  아웃상담: ['아웃 상담', '아웃 DB(병원이 연락한 사람) 중 실제로 와서 상담받은 수.'],
  인상담: ['인 상담', '인 DB(먼저 연락해 온 사람) 중 실제로 와서 상담받은 수.'],
  원내: ['원내 상담', 'DB 없이 온 상담 — 재방문 · 소개 · 지나가다 들른 손님 등.'],
  아웃전환율: ['아웃 내원 전환율', '아웃 DB 중 실제로 와서 상담까지 받은 비율. 아웃 상담 ÷ 아웃 DB. 예: DB 500개 중 120명 → 24%.'],
  인전환율: ['인 전환율', '인 DB 중 상담까지 온 비율. 인 상담 ÷ 인 DB.'],
  상담단가: ['상담단가', '상담 1건당 매출(VAT 제외). 매출 ÷ 상담 수.'],
  예상매출: ['예상 매출', '① 이 안의 숫자로 셈: 예상 상담 × 상담단가. 예상 상담 = 아웃 DB × 아웃 전환율 + (인 DB × 인 전환율 + 원내) × 영업일 비율. ② 는 과거 추세로 본 참고값.'],
  결제율: ['결제율', '상담 중 결제까지 한 비율(ERP 티케팅 성공 · 빈칸).'],
  객단가: ['객단가', '결제 1건당 매출(VAT 제외). 매출 ÷ 결제 수.']
};
const 도움 = 키 => `<button type="button" class="도움" data-도움="${키}" aria-label="${용어[키][0]} 설명" aria-describedby="풀이창">i</button>`;

let 토큰 = 보관.읽기('mkt-token'), 병원ID = 보관.읽기('mkt-hosp'), 처음 = false, 다시할일 = null;
/* 자료병원ID = 지금 화면에 그려진 자료의 병원. 쓰기(안 · 임시 저장)는 늘 이 병원으로 —
   고르기(병원ID)는 응답이 오기 전에 바뀌므로, 그쪽으로 쓰면 옛 병원 숫자가 새 병원에 들어간다 */
let 자료병원ID = null, 조회번호 = 0;
let 월별 = { 오늘: '', 달: [], 목표: {} };   // MKT_집계 — 월별 실적 탭 · 월 매출 그래프 · ERP 월 목표
let 안들 = [];                              // [{ id, 이름, 값 }] — 화면은 값을 바로 고친다(저절로 저장)
let 고른달 = '', 쪽 = '계획', 보는안 = 0;    // 보는안 = 계획 쪽에서 고른 안ID (0 = 첫 안)
let 지금 = null;                            // 보는 안의 값(안들 안의 그 객체) — 없으면 빈 상태
let 지우는중 = false, 탭 = 'sim';
let 기간 = [1, 3, 6].includes(+보관.읽기('mkt-기간')) ? +보관.읽기('mkt-기간') : 3;   // 기준 = 최근 N달 실적 평균(보는 사람 브라우저에 기억)
const 최근편집 = new WeakMap();                     // DB 비용 줄 → 마지막으로 고친 칸(셋 잇기)

/* ── 서버 ── */
async function 부르기(fn, ...args) {
  let r;
  try {
    r = await fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-sim-token': 토큰 || '' }, body: JSON.stringify({ fn, args }) });
  } catch { throw new Error('ERP 에 닿지 못했습니다 — 인터넷을 확인해 주세요.'); }
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) { 잠그기(); throw Object.assign(new Error('다시 로그인해 주세요.'), { 잠김: true }); }
  if (!r.ok || j.err) throw new Error(j.err || `ERP 응답 ${r.status}`);
  return j.ok;
}

function 잠그기() {
  /* 하던 숫자는 다시 들어오면 돌려놓는다 (spec §10) — 저절로 저장이 401 을 만나도 여기로 온다 */
  const a = 고친안 && 안들.includes(고친안) ? 고친안 : 보는것();
  if (자료병원ID && a) 보관.쓰기('mkt-draft', JSON.stringify({ 병원ID: 자료병원ID, 안ID: a.id, 지금: a.값 }), true);
  clearTimeout(저장시계); 저장시계 = null; 저장할 = null;
  토큰 = null; 보관.쓰기('mkt-token', null);
  $('잠금').hidden = false; $('비번1').focus();
}
function 처음모드() {
  처음 = true;
  $('잠금풀이').textContent = '처음이라 비밀번호를 정합니다. 8자 이상으로 두 번 넣어 주세요.';
  $('비번2칸').hidden = false; $('비번1').autocomplete = 'new-password';
  $('잠금단추').textContent = '비밀번호 정하기'; $('비번2').focus();
}
function 오류줄(글, 다시) { $('오류줄').hidden = !글; $('오류글').textContent = 글 || ''; 다시할일 = 다시 || null; }

async function 시작() {
  try {
    const 병원들 = await 부르기('MKT_병원목록');
    if (!병원들.some(h => h.병원ID === 병원ID)) 병원ID = 병원들[0]?.병원ID ?? null;
    $('병원고르기').innerHTML = 병원들.map(h => `<option value="${막기(h.병원ID)}"${h.병원ID === 병원ID ? ' selected' : ''}>${막기(h.병원명)}</option>`).join('');
    await 불러오기();
  } catch (e) { if (!e.잠김) 오류줄(e.message, 시작); }
}
async function 불러오기() {
  const 요청 = ++조회번호, 병원 = 병원ID;
  let 집, 저장안;
  try {
    [집, 저장안] = await Promise.all([부르기('MKT_집계', 병원), 부르기('MKT_안목록', 병원)]);
  } catch (e) {
    if (요청 === 조회번호 && 자료병원ID) { 병원ID = 자료병원ID; $('병원고르기').value = 자료병원ID; }
    throw e;
  }
  if (요청 !== 조회번호) return;   // 그사이 다른 병원을 골랐다 — 늦게 온 옛 응답은 버린다
  /* 보던 달 · 안은 병원이 실제로 바뀌었을 때만 놓는다 — 바꾸다 실패하면 옛 병원 화면 그대로 */
  if (병원 !== 자료병원ID) { 고른달 = ''; 보는안 = 0; 지우는중 = false; }
  보관.쓰기('mkt-hosp', 병원);
  const 복구 = 자료넣기(집, 저장안, 병원);
  자료병원ID = 병원;
  오류줄(null);
  모두그리기();
  if (복구) 저장예약(복구);
}
/* 자료를 넣고, 401 로 잠기기 전 하던 숫자가 있으면 그 안에 돌려놓는다(돌려놓은 안을 돌려준다 — 다시 저장한다) */
function 자료넣기(집, 저장안, 병원) {
  월별 = 집;
  안들 = 저장안.map(a => ({ id: a.안ID, 이름: a.이름, 값: 안꼴(a.값) }));
  let 임시 = null;
  try { 임시 = JSON.parse(보관.읽기('mkt-draft', true) || 'null'); } catch { /* 깨진 값은 버린다 */ }
  보관.쓰기('mkt-draft', null, true);
  const a = 임시?.병원ID === 병원 ? 안들.find(x => x.id === 임시.안ID) : null;
  if (a) { a.값 = 안꼴(임시.지금); 고른달 = a.값.달 || 진행달(); 쪽 = a.값.종류 === '실적' ? '실적' : '계획'; if (a.값.종류 === '계획') 보는안 = a.id; return a; }
  if (!고른달) { 고른달 = 진행달(); 쪽 = '계획'; }
  return null;
}

/* ── 달 · 안 ── */
const 달이름 = m => m ? `${+m.slice(5)}월` : '';
const 달글 = m => m.slice(0, 4) === 진행달().slice(0, 4) ? 달이름(m) : m.slice(2, 4) + '년 ' + 달이름(m);   // 해가 다르면 해까지
const 진행달 = () => (월별.오늘 || new Date().toISOString()).slice(0, 7);
const 달안들 = m => 안들.filter(a => a.값.달 === m);
const 실적안 = m => 달안들(m).find(a => a.값.종류 === '실적') || null;
const 계획안들 = m => 달안들(m).filter(a => a.값.종류 === '계획').sort((a, b) => a.이름.localeCompare(b.이름, 'ko'));
const 보는것 = () => 쪽 === '실적' ? 실적안(고른달) : (계획안들(고른달).find(a => a.id === 보는안) || 계획안들(고른달)[0] || null);
/* 기준 = 고른 기간의 실적 평균(바꿔 보기 기준 · 눈금 · 실적 기준으로 시작) · 과거 = 지난 12달 실적(그래프 · 추세 · 판정 범위) */
/* 직접 넣은 기준 = 그 달 공용 안(종류 기준, 사용 이 켜져 있을 때) — 안 탭 · 복사 목록엔 안 나온다 */
const 기준안 = m => 달안들(m).find(a => a.값.종류 === '기준') || null;
const 직접중 = () => 기준안(고른달)?.값.사용 === true;
const 기준 = () => 쪽 !== '계획' ? null : 직접중() ? 직접기준(기준안(고른달).값) : 기준만들기(기준실적들(안들, 고른달, 기간));
const 과거실적들 = () => 기준실적들(안들, 고른달, 12);
const 기간글 = 기 => !기 ? '' : 기.직접 ? '직접 넣은 기준' : 기.개수 === 1 ? `${달이름(기.달들[0])} 실적` : `최근 ${기.개수}달 실적 평균`;
/* 견줄 목표 — 이 안의 매출 목표, 비면 그 달 ERP 월 목표 */
function 목표() {
  const r = 셈(지금);
  if (r.총매출 > 0) return { 값: r.총매출, 출처: '이 안 매출 목표' };
  const 달목표 = 월별.목표[고른달];
  return 달목표 ? { 값: 달목표, 출처: `${달이름(고른달)} ERP 월 목표` } : null;
}
/* 달 줄 — 이번 달 12달 전 · 뒤 2달(과거 실적을 넣으러), 자료가 있는 달은 더 넓혀서 */
function 달목록() {
  let 앞 = 달더하기(진행달(), -12), 뒤 = 달더하기(진행달(), 2);
  for (const a of 안들) if (a.값.달) { if (a.값.달 < 앞) 앞 = a.값.달; if (a.값.달 > 뒤) 뒤 = a.값.달; }
  const 목록 = [];
  for (let m = 앞; m <= 뒤 && 목록.length < 36; m = 달더하기(m, 1)) 목록.push(m);
  return 목록;
}

/* ── 저절로 저장 — 고치면 0.7초 뒤, 차례대로(앞 저장이 끝나야 다음). 달 · 안 · 병원을 바꾸기 전엔 바로 ── */
let 저장시계 = null, 저장할 = null, 저장줄 = Promise.resolve(), 고친안 = null;   // 고친안 = 마지막으로 고친 안(401 때 임시 저장할 것)
function 표시(글, 꼴) { const el = $('저장표시'); if (!el) return; el.textContent = 글; el.className = '저장표시' + (꼴 ? ' ' + 꼴 : ''); }
function 저장예약(a = 보는것()) {
  if (!a || !자료병원ID) return;
  고친안 = a;
  if (저장할 && 저장할.a !== a) 저장하기();   // 다른 안이 기다리고 있으면 그것부터
  저장할 = { 병원: 자료병원ID, a };
  표시('저장 중…');
  clearTimeout(저장시계); 저장시계 = setTimeout(저장하기, 700);
}
function 저장하기() {
  clearTimeout(저장시계); 저장시계 = null;
  const 할 = 저장할; 저장할 = null;
  if (!할) return 저장줄;
  const 값 = 베낌(할.a.값);
  저장줄 = 저장줄.then(() => 부르기('MKT_안저장', 할.병원, 할.a.id, 할.a.이름, 값))
    .then(() => { if (!저장할) 표시('저절로 저장됨', '됨'); })
    .catch(e => { if (!e.잠김) 표시('저장 못 함 — ' + e.message, '못'); });
  return 저장줄;
}
async function 안만들기(값, 이름, 옮기기 = true) {   // 옮기기 = 만든 안을 본다(기준 안은 안 옮긴다)
  $('안알림').textContent = '';
  await 저장하기();
  try {
    const r = await 부르기('MKT_안저장', 자료병원ID, null, 이름, 값);
    const a = { id: r.안ID, 이름, 값: 안꼴(값) };
    안들.push(a);
    if (옮기기) { 쪽 = a.값.종류; if (쪽 === '계획') 보는안 = a.id; }
    지우는중 = false;
    모두그리기(); 표시('저절로 저장됨', '됨');
  } catch (e) { if (!e.잠김) $('안알림').textContent = e.message; }
}
async function 안지우기() {
  const a = 보는것(); if (!a) return;
  $('안알림').textContent = '';
  await 저장하기();
  try {
    await 부르기('MKT_안삭제', 자료병원ID, a.id);
    안들 = 안들.filter(x => x !== a); 보는안 = 0; 지우는중 = false;
    모두그리기();
  } catch (e) { if (!e.잠김) $('안알림').textContent = e.message; }
}
async function 고르기(바꿀) { await 저장하기(); 바꿀(); 지우는중 = false; $('안알림').textContent = ''; 모두그리기(); }

/* ── 달 줄 · 제목 줄 · 안 탭 — 구조가 바뀔 때만 그린다(치는 동안 다시 그리면 칸 · 클릭을 잃는다) ── */
function 달줄그리기() {
  $('달줄').innerHTML = 달목록().map(m => {
    const 실 = 실적안(m), 계 = 계획안들(m).length;
    const 상태 = [실 ? '실적 ✓' : '', 계 ? `계획 ${계}안` : ''].filter(Boolean).join(' · ') || '비어 있음';
    return `<button type="button" role="tab" data-달="${m}" aria-selected="${m === 고른달}"><b>${달글(m)}</b><small>${m === 진행달() ? '이번 달 · ' : ''}${상태}</small></button>`;
  }).join('');
  /* 고른 달을 줄 가운데로 — 줄 안에서 가로로만. scrollIntoView 는 페이지 세로까지 끌어올렸다(바꿔 보기에서 안을 바꾸면 맨 위로) */
  const 줄 = $('달줄'), 고른 = 줄.querySelector('[aria-selected="true"]');
  if (고른) 줄.scrollLeft += 고른.getBoundingClientRect().left + 고른.offsetWidth / 2 - 줄.getBoundingClientRect().left - 줄.clientWidth / 2;
}
function 제목줄그리기() {
  const a = 보는것(), 지울글 = 쪽 === '실적' ? '이 실적 지우기' : '이 안 지우기';
  $('제목줄').innerHTML = `<h2>${달이름(고른달)}</h2>
    <span class="가름" role="group" aria-label="계획 · 실적"><button type="button" data-쪽="계획" aria-pressed="${쪽 === '계획'}">계획</button><button type="button" data-쪽="실적" aria-pressed="${쪽 === '실적'}">실적</button></span>${도움('종류')}
    ${a && 쪽 === '계획' ? `<label class="메모칸">${막기(a.이름)} 메모 ${칸글('메모', '글', a.이름 + ' 메모', ' placeholder="예: 광고 늘림"')}</label>` : ''}
    ${a ? '<span class="저장표시 됨" id="저장표시">저절로 저장됨</span>' : ''}
    <span class="끝">${a ? (지우는중
      ? `<span class="새이름">‘${막기(a.이름)}’ 을 지울까요?<button type="button" class="단추 주" data-안지우기="예">지우기</button><button type="button" class="단추" data-안지우기="아니">취소</button></span>`
      : `<button type="button" class="단추 글" data-안지우기="열기">${지울글}</button>`) : ''}</span>`;
}
function 안탭그리기() {
  const 계획들 = 계획안들(고른달), a = 보는것();
  $('안탭').hidden = 쪽 !== '계획' || !계획들.length;
  $('안탭').innerHTML = 계획들.map(x => `<button type="button" role="tab" class="탭" data-안="${x.id}" aria-selected="${x === a}">${막기(x.이름)}<small data-탭글="${x.id}"></small></button>`).join('') +
    (계획들.length < 26 ? '<button type="button" class="단추" data-다른안="1">+ 다른 안</button>' + 복사고르기('가져오기', '다른 달 안 가져오기…') : '');
  /* 바꿔 보기 머리에도 안 바꾸기 — 아래로 내려온 채 안을 오간다(사용자 10/14). 누르면 위 탭과 같은 data-안 */
  $('바꿈안').innerHTML = 쪽 === '계획' && 계획들.length > 1 ? `<span class="가름" role="group" aria-label="안 바꾸기">${계획들.map(x => `<button type="button" data-안="${x.id}" aria-pressed="${x === a}">${막기(x.이름)}</button>`).join('')}</span>` : '';
  탭글쓰기();
}
function 탭글쓰기() { for (const x of 계획안들(고른달)) { const el = document.querySelector(`[data-탭글="${x.id}"]`); if (el) el.textContent = [x.값.메모, 억(셈(x.값).매출)].filter(Boolean).join(' · '); } }
/* 다른 달의 안 · 실적 고르기 — 실적에서 가져오면 비율로, 안에서 가져오면 숫자 그대로 */
function 복사고르기(id, 첫글) {
  const 다른 = 안들.filter(a => a.값.종류 !== '기준' && a.값.달 && a.값.달 !== 고른달).sort((a, b) => b.값.달.localeCompare(a.값.달) || a.이름.localeCompare(b.이름, 'ko'));
  if (!다른.length) return '';
  const 달들 = [...new Set(다른.map(a => a.값.달))];
  return `<select id="${id}" aria-label="${첫글}"><option value="">${첫글}</option>${달들.map(m => `<optgroup label="${달글(m)}">${다른.filter(a => a.값.달 === m).map(a => `<option value="${a.id}">${a.값.종류 === '실적' ? '실적' : 막기(a.이름)}${a.값.메모 ? ' · ' + 막기(a.값.메모) : ''}</option>`).join('')}</optgroup>`).join('')}</select>`;
}
function 빈판그리기() {
  const 이름 = 달이름(고른달);
  if (쪽 === '계획') {
    const 기 = 기준(), 앞달 = 달더하기(고른달, -1), 앞안 = 계획안들(앞달)[0];
    $('빈판').innerHTML = `<span>${이름} 계획이 아직 없습니다 — 무엇에서 시작할까요?</span><span class="단추줄">` +
      (기 ? `<button type="button" class="단추 주" data-계획시작="평균">${기간글(기)}으로 시작</button>` : '') +
      (앞안 ? `<button type="button" class="단추" data-계획시작="앞안">${달이름(앞달)} ${막기(앞안.이름)} 복사</button>` : '') +
      복사고르기('복사고르기', '다른 안에서 복사…') +
      `<button type="button" class="단추${기 || 앞안 ? '' : ' 주'}" data-계획시작="빈">빈 계획</button></span>` +
      (기 ? '' : '<small class="흐">앞 달 실적이 없어 비율을 채울 수 없습니다 — 지난 달에서 실적을 넣으면 그 비율로 시작할 수 있습니다.</small>');
  } else {
    const erp = 월별.달.find(x => x.연월 === 고른달);
    $('빈판').innerHTML = `<span>${이름} 실적이 아직 없습니다 — ${erp ? `ERP 매출 ${억(erp.매출)} 를 미리 채웁니다. 마케팅비 줄과 상담 나눔만 넣으면 됩니다.` : '그 달 실제로 나온 숫자를 넣으면 다음 달 계획의 기준이 됩니다.'}</span><button type="button" class="단추 주" data-실적넣기="1">${이름} 실적 넣기</button>`;
  }
}

/* ── 칸 묶기 — data-경로 하나로 숫자 칸 · 슬라이더가 같은 값을 본다 (항목.0.금액 · 전환.아웃률 …) ── */
/* '@기준.매출' 은 그 달 기준 안(직접 넣은 기준)의 칸, 나머지는 보는 안의 칸 */
const 뿌리 = 경로 => 경로.startsWith('@기준.') ? [기준안(고른달)?.값.기준값, 경로.slice(4)] : [지금, 경로];
const 읽기 = 경로 => { const [o, p] = 뿌리(경로); return p.split('.').reduce((x, k) => x?.[k], o); };
const 쓰기 = (경로, v) => { const [o, p] = 뿌리(경로), ks = p.split('.'), 끝 = ks.pop(); ks.reduce((x, k) => x[k], o)[끝] = v; };
const 보기 = (꼴, v) => 꼴 === '퍼' ? String(Math.round(v * 10000) / 100) : 꼴 === '글' ? v : 원(v);
const 읽어 = (꼴, 글) => 꼴 === '퍼' ? 수(글) / 100 : 꼴 === '글' ? String(글).slice(0, 30) : 수(글);
const 칸글 = (경로, 꼴, 이름, 더 = '', 꾸밈 = '') => `<input class="칸글${꼴 === '글' ? ' 이름칸' : ''}${꾸밈 ? ' ' + 꾸밈 : ''}" type="text" data-경로="${경로}" data-꼴="${꼴}" ${꼴 === '글' ? 'maxlength="30"' : 'inputmode="decimal"'} value="${막기(보기(꼴, 읽기(경로)))}" aria-label="${막기(이름)}"${더}>`;
const 칸 = (경로, 꼴, 이름, 단 = '', 풀이 = '', 키) => `<div class="칸"><label>${이름}${키 ? 도움(키) : ''}</label><div class="줄">${칸글(경로, 꼴, 이름)}${단 ? `<span class="단">${단}</span>` : ''}</div>${풀이 ? `<small>${풀이}</small>` : ''}</div>`;
const 자동칸 = (id, 이름) => `<div class="칸"><label>${이름}</label><span class="자동값" id="${id}"></span><small id="${id}-풀이"></small></div>`;
const 값칸 = (이름, 값, 갈림, 키) => `<div${갈림 ? ' class="갈림"' : ''}><span class="이름">${이름}${키 ? 도움(키) : ''}</span><span class="값">${값}</span></div>`;
/* 기준(평균) 줄 — 비율줄과 같은 아홉 칸 */
const 평균줄 = 기 => 값칸('매출', 억(기.매출)) + 값칸('상담', 원(기.상담) + '건') + 값칸('마케팅비', 억(기.마케팅비)) + 값칸('아웃 DB', 원(기.아웃DB), false, '아웃DB') + 값칸('인 DB', 원(기.인DB), true) +
  값칸('CPA', Number.isFinite(기.CPA) ? 원(기.CPA) + '원' : '—', false, 'CPA') + 값칸('아웃 전환율', 퍼(기.아웃률), false, '아웃전환율') + 값칸('인 전환율', 퍼(기.인률), false, '인전환율') + 값칸('상담단가', Number.isFinite(기.단가) ? 억(기.단가) : '—', false, '상담단가');
/* 실적 비율 · 기준 줄 — 같은 아홉 칸 */
const 비율줄 = (a, r) => 값칸('매출', 억(r.매출)) + 값칸('상담', 원(r.상담) + '건') + 값칸('마케팅비', 억(r.마케팅비)) + 값칸('아웃 DB', 원(r.아웃DB), false, '아웃DB') + 값칸('인 DB', 원(a.인DB), true) +
  값칸('CPA', r.CPA ? 원(r.CPA) + '원' : '—', false, 'CPA') + 값칸('아웃 전환율', 퍼(r.아웃률), false, '아웃전환율') + 값칸('인 전환율', 퍼(r.인률), false, '인전환율') + 값칸('상담단가', Number.isFinite(r.단가) ? 억(r.단가) : '—', false, '상담단가');

/* 바꿔 보기 줄 — DB 비용 줄마다 금액 · DB · CPA, 그 밖 비용 줄마다 금액, 그다음 DB · 전환 · 영업일 · 목표. 기준 = 실적 평균(같은 이름 줄) */
function 손잡이들() {
  const 기 = 기준(), 유 = v => Number.isFinite(v) ? v : undefined, 줄평 = 이름 => 기?.항목.get(이름);
  return [
    ...지금.항목.flatMap((x, i) => x.종류 === 'DB' ? [
      { 경로: `항목.${i}.금액`, 이름: `${x.이름} 금액`, 키: '게더링', 단: '원', 기본: 5e7, 기준: 유(줄평(x.이름)?.금액), 셋: '금액' },
      { 경로: `항목.${i}.db`, 이름: `${x.이름} DB`, 키: 'DB', 단: '개', 기본: 2000, 기준: 유(줄평(x.이름)?.db), 셋: 'db' },
      { 경로: `항목.${i}.cpa`, 이름: `${x.이름} CPA`, 키: 'CPA', 단: '원', 기본: 1e5, 기준: 유(줄평(x.이름)?.cpa), 셋: 'cpa' }
    ] : [{ 경로: `항목.${i}.금액`, 이름: `${x.이름} 금액`, 키: '그밖', 단: '원', 기본: 3e7, 기준: 유(줄평(x.이름)?.금액) }]),
    { 경로: '추가DB', 이름: '추가 아웃 DB', 키: '추가아웃DB', 단: '개', 기본: 500, 기준: 유(기?.추가DB) },
    { 경로: '전환.아웃률', 이름: '아웃 내원 전환율', 키: '아웃전환율', 단: '%', 퍼: true, 기준: 유(기?.아웃률) },
    { 경로: '인DB', 이름: '인 DB', 키: '인DB', 단: '개', 기본: 1000, 기준: 유(기?.인DB) },
    { 경로: '전환.인률', 이름: '인 전환율', 키: '인전환율', 단: '%', 퍼: true, 기준: 유(기?.인률) },
    { 경로: '전환.원내', 이름: '원내 추가 상담', 키: '원내', 단: '건', 기본: 200, 기준: 유(기?.원내) },
    { 경로: '전환.단가', 이름: '상담단가', 키: '상담단가', 단: '원', 기본: 4e6, 기준: 유(기?.단가) },
    { 경로: '영업일', 이름: '영업일', 키: '영업일', 단: '일', 끝: 31, 기준: 유(기?.영업일) },
    { 경로: '시술', 이름: '상담 매출 목표', 키: '목표', 단: '원', 기본: 1e9, 기준: 유(기?.매출) },
    { 경로: '외', 이름: '상담 외 매출 목표', 키: '목표', 단: '원', 기본: 1e8 }
  ];
}
/* 슬라이더 끝 — 기준 · 지금 값의 두 배를 넉넉한 수로 올림(비율은 60% ~ 100%). 끄는 동안 바뀌지 않게 그릴 때 한 번 정한다 */
function 끝값(s, 값) {
  if (s.끝) return s.끝;
  const 큰 = Math.max(값 || 0, s.기준 || 0) * 2;
  if (s.퍼) return Math.min(1, Math.max(0.6, 큰));
  const v = Math.max(s.기본, 큰), 자리 = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / 자리) * 자리;
}
/* DB 비용 셋 잇기 — 경로가 항목.N.(금액|db|cpa) 면 그 줄 · 셈칸 */
const 셋경로 = 경로 => { const m = /^항목\.(\d+)\.(금액|db|cpa)$/.exec(경로); return m && 지금.항목[+m[1]]?.종류 === 'DB' ? { i: +m[1], 칸: m[2], x: 지금.항목[+m[1]] } : null; };
const 셋칸이 = 경로 => 셋경로(경로)?.x.셈칸;
/* 한 줄의 셋 칸(글 · 슬라이더)을 값에 맞추고, 자동 칸을 회색으로 */
function 셋동기(i, 빼고) {
  const x = 지금.항목[i];
  for (const k of ['금액', 'db', 'cpa']) for (const el of document.querySelectorAll(`[data-경로="항목.${i}.${k}"]`)) {
    if (el.type !== 'range') el.classList.toggle('자동', x.셈칸 === k);
    if (el === 빼고) continue;
    if (el.type === 'range') { if (x[k] > +el.max) el.max = 끝값({ 기본: 0 }, x[k]); el.value = x[k]; 칠(el, x[k]); } else el.value = 보기(el.dataset.꼴, x[k]);
  }
}
const 칠 = (el, v) => el.style.setProperty('--p', Math.min(100, Math.max(0, v / +el.max * 100)) + '%');
function 바꿈그리기() {
  const 줄들 = 손잡이들(), 게더링없음 = !지금.항목.some(x => x.종류 === 'DB');
  $('바꿈').innerHTML = `<thead><tr><th>항목</th><th>기준</th><th>이 안</th><th>변화</th><th style="text-align:left">끌어서 바꾸기</th></tr></thead><tbody>` +
    (게더링없음 ? '<tr><td class="묶음" colspan="5">DB 비용 줄이 없습니다 — 아래 마케팅비에서 [+ DB 비용] 으로 더하면 금액 · DB · CPA 줄이 생깁니다</td></tr>' : '') +
    줄들.map(s => {
      const 꼴 = s.퍼 ? '퍼' : '원', 값 = 읽기(s.경로), 끝 = 끝값(s, 값), 단계 = s.퍼 ? 0.001 : Math.max(1, 끝 / 400 >= 1e4 ? Math.round(끝 / 400 / 1e4) * 1e4 : Math.round(끝 / 400));
      return `<tr><td><span data-줄이름="${s.경로}">${막기(s.이름)}</span>${도움(s.키)}</td><td class="흐" data-기준칸="${s.경로}"></td>
        <td>${칸글(s.경로, 꼴, s.이름, '', s.셋 && 셋칸이(s.경로) === s.셋 ? '자동' : '')}<span class="단">${s.단}</span></td><td class="변" data-변="${s.경로}"></td>
        <td><div class="끌틀"><input type="range" data-경로="${s.경로}" min="0" max="${끝}" step="${단계}" value="${값}" aria-label="${막기(s.이름)} 끌기"><span class="눈금" data-눈금="${s.경로}" title="기준 값" hidden></span></div></td></tr>`;
    }).join('') + '</tbody>';
  $('바꿈').querySelectorAll('input[type=range]').forEach(el => 칠(el, +el.value));
}
function 변화쓰기() {
  for (const s of 손잡이들()) {
    const el = $('바꿈').querySelector(`[data-변="${s.경로}"]`);
    if (!el) continue;
    const 기칸 = $('바꿈').querySelector(`[data-기준칸="${s.경로}"]`), 눈 = $('바꿈').querySelector(`[data-눈금="${s.경로}"]`), 끌 = 눈?.previousElementSibling;
    기칸.textContent = s.기준 === undefined ? '—' : 보기(s.퍼 ? '퍼' : '원', s.기준) + (s.퍼 ? '%' : '');
    눈.hidden = s.기준 === undefined;
    if (!눈.hidden) 눈.style.left = `calc(8px + (100% - 16px) * ${Math.min(1, Math.max(0, s.기준 / +끌.max)).toFixed(4)})`;
    /* 목표 0 = 비움(ERP 월 목표로 견줌) — −100% 가 아니다 */
    const d = s.기준 === undefined || (s.키 === '목표' && !읽기(s.경로)) ? null : 증감(읽기(s.경로), s.기준, s.퍼);
    el.className = '변' + (d === null ? ' 같음' : '');
    el.textContent = d === null ? '—' : `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}${s.퍼 ? '%p' : '%'}`;
  }
}

/* ── 입력 칸 — 그릴 때 한 번만 만든다(치는 중에 다시 그리면 커서를 잃는다). 셈 결과는 갱신()이 따로 ── */
function 입력그리기() {
  const 없음 = !지금, 실적 = 쪽 === '실적';
  $('빈판').hidden = !없음;
  $('실적판').hidden = 없음 || !실적;
  for (const id of ['기준판', '결과판', '비교판', '계획둘', '목표판']) $(id).hidden = 없음 || 실적;
  $('마케팅비판').hidden = 없음;
  /* 숨긴 쪽 칸은 비운다 — 같은 경로의 숨은 칸이 남으면 동기 · 검사가 엉뚱한 칸을 본다 */
  for (const id of 없음 ? ['바꿈', '목표칸', '실적칸', '실적비율', '항목표'] : 실적 ? ['바꿈', '목표칸'] : ['실적칸', '실적비율']) $(id).innerHTML = '';
  if (없음) return 빈판그리기();
  if (실적) {
    /* 매출은 상담 기준(사용자 10/14) — 저장 키는 옛 이름 시술 · 외 그대로 */
    $('실적칸').innerHTML = 칸('영업일', '원', '영업일', '일') + 칸('시술', '원', '상담 매출', '원', 'VAT 제외') + 칸('외', '원', '상담 외 매출', '원') +
      칸('상담.아웃', '원', '아웃 상담', '건', '아웃 DB 에서 온 상담', '아웃상담') + 칸('상담.인', '원', '인 상담', '건', '인 DB 에서 온 상담', '인상담') + 칸('상담.원내', '원', '원내 상담', '건', '재방문 · 소개 등', '원내') +
      칸('인DB', '원', '인 DB', '개', '인바운드로 들어온 DB', '인DB') + 칸('추가DB', '원', '추가 아웃 DB', '개', 'LMS · 테스트 · 심의 · 브랜딩 등', '추가아웃DB');
    const erp = 월별.달.find(x => x.연월 === 고른달);
    $('실적안내').hidden = !erp;
    $('실적안내').textContent = erp ? `ERP ${달이름(고른달)}: 매출 ${억(erp.매출)} · 상담 ${원(erp.상담)}건 — 상담은 아웃 · 인 · 원내로 나눠 넣으세요(상담 매출은 ERP 에서 채웠고 고칠 수 있습니다).` : '';
  } else {
    const 직접 = 직접중();
    $('기간고르기').innerHTML = `<span class="가름" role="group" aria-label="기준">${[[1, '지난달'], [3, '최근 3달'], [6, '최근 6달'], ['직접', '직접']].map(([n, 글]) => `<button type="button" data-기간="${n}" aria-pressed="${직접 ? n === '직접' : n === 기간}">${글}</button>`).join('')}</span>`;
    기준판그리기();
    $('목표칸').innerHTML = 칸('영업일', '원', '영업일', '일') + 칸('시술', '원', '상담 매출 목표', '원') + 칸('외', '원', '상담 외 매출 목표', '원') + 자동칸('자동-총매출', '총 매출 목표');
    바꿈그리기();
  }
  $('마케팅비풀이').textContent = 실적 ? '그 달 실제로 쓴 돈 — DB 비용은 금액과 DB 를 넣으면 CPA 가 나온다' : '이 안에서 쓸 돈 — DB 비용은 금액 · DB · CPA 중 둘을 넣으면 나머지가 저절로(회색)';
  $('항목표').innerHTML = !지금.항목.length
    ? '<tbody><tr><td class="빈항목">아직 항목이 없습니다 — [+ DB 비용] 이나 [+ 그 밖 비용] 으로 시작합니다.</td></tr></tbody>'
    : `<thead><tr><th>항목</th><th style="width:150px">금액 (원)</th><th style="width:110px">DB${도움('DB')}</th><th style="width:120px">CPA (원)${도움('CPA')}</th><th style="width:70px">비중</th><th style="width:36px"></th></tr></thead><tbody>` +
      지금.항목.map((x, i) => `<tr><td><span class="종류표">${x.종류 === 'DB' ? 'DB 비용' : '그 밖'}</span>${칸글(`항목.${i}.이름`, '글', '항목 이름')}</td>
        <td>${칸글(`항목.${i}.금액`, '원', x.이름 + ' 금액', '', x.종류 === 'DB' && x.셈칸 === '금액' ? '자동' : '')}</td>
        <td>${x.종류 === 'DB' ? 칸글(`항목.${i}.db`, '원', x.이름 + ' DB', '', x.셈칸 === 'db' ? '자동' : '') : '<span class="흐">—</span>'}</td>
        <td>${x.종류 === 'DB' ? 칸글(`항목.${i}.cpa`, '원', x.이름 + ' CPA', '', x.셈칸 === 'cpa' ? '자동' : '') : '<span class="흐">—</span>'}</td>
        <td data-비중="${i}"></td><td><button type="button" class="지움" data-지움="${i}" aria-label="${막기(x.이름)} 지우기">×</button></td></tr>`).join('') +
      '</tbody><tfoot><tr><td>마케팅비 합계</td><td id="합-금액"></td><td id="합-DB"></td><td></td><td id="합-비율"></td><td></td></tr></tfoot>';
}

/* 기준 판 — 평균이면 값 줄, 직접이면 칸 줄(그 달 공용 기준 안의 '@기준.' 칸) */
const 기준칸꼴 = { 매출: ['매출', '원', '원'], 상담: ['상담', '원', '건'], 마케팅비: ['마케팅비', '원', '원'], 아웃DB: ['아웃 DB', '원', '개', '아웃DB'], 인DB: ['인 DB', '원', '개', '인DB'],
  추가DB: ['추가 아웃 DB', '원', '개', '추가아웃DB'], CPA: ['CPA', '원', '원', 'CPA'], 아웃률: ['아웃 전환율', '퍼', '%', '아웃전환율'], 인률: ['인 전환율', '퍼', '%', '인전환율'],
  원내: ['원내 상담', '원', '건', '원내'], 단가: ['상담단가', '원', '원', '상담단가'], 영업일: ['영업일', '원', '일'] };
function 기준판그리기() {
  const 기 = 기준(), 직접 = 직접중();
  $('기준제목').innerHTML = (기 ? `기준 · ${기간글(기)}` : '기준 없음') + 도움('기준');
  $('기준풀이').textContent = 직접 ? '직접 넣은 값 — 이 달의 모든 안이 같이 본다' : '고른 기간 실적의 평균 — 바꿔 보기 표의 기준 열 · 눈금이 된다';
  $('기준줄').innerHTML = 직접 ? `<div class="칸줄">${기준칸.map(k => { const [이름, 꼴, 단, 키] = 기준칸꼴[k]; return 칸('@기준.' + k, 꼴, 이름, 단, '', 키); }).join('')}</div>`
    : 기 ? `<div class="값줄">${평균줄(기)}</div>`
    : `<p class="빈글">${달이름(고른달)} 앞의 실적이 없습니다 — 지난 달에서 실적을 넣으면 그 평균이 기준 열 · 눈금이 되고, 비교 그래프에 과거 점이 생깁니다. [직접] 으로 기준 숫자를 넣어도 됩니다.</p>`;
}

/* ── 셈 결과 (치는 동안 계속 다시 그린다) ── */
function 결과그리기() {
  if (!지금) return;
  const r = 셈(지금);
  if (쪽 === '실적') { $('실적비율').innerHTML = 비율줄(지금, r); return; }
  const 기 = 기준(), 과거 = 과거실적들(), 추 = 추세(과거);
  const 변 = 기 ? 증감(r.매출, 기.매출) : null, 목 = 목표(), 추값 = 추 ? 추.값(r.마케팅비) : NaN, 추폭 = 추 ? 추.폭(r.마케팅비) : NaN;
  $('결과').innerHTML = `
    <div><span class="이름">① ${달이름(고른달)} 예상 매출${도움('예상매출')}</span><span class="큰값">${억(r.매출)}</span>
      <span class="풀이">${기 ? `${기간글(기)} ${억(기.매출)}${변 === null ? '과 같음' : `보다 ${변 > 0 ? '+' : '−'}${Math.abs(변).toFixed(1)}%`}` : '기준 실적 없음'}</span>
      ${목 ? `<span class="진행"><span class="막"><i style="width:${Math.min(100, r.매출 / 목.값 * 100)}%"></i></span>${목.출처} ${억(목.값)}의 ${퍼(r.매출 / 목.값, 0)}</span>` : '<span class="풀이">목표 없음 — 매출 목표를 넣으면 견줍니다</span>'}</div>
    <div><span class="이름">② 과거 추세로 보면${도움('추세')}</span>${추 ? `<span class="큰값" id="추세값">${억(Math.max(0, 추값))}</span><span class="풀이">${억(Math.max(0, 추값 - 추폭))} ~ ${억(추값 + 추폭)} · 과거 ${추.n}달 기준</span>`
      : `<span class="값 흐">—</span><span class="풀이">실적이 3달 이상 쌓이면 보입니다(지금 ${과거.length}달)</span>`}</div>
    <div><span class="이름">예상 상담</span><span class="값">${원(r.상담)}건</span><span class="풀이">아웃 ${원(r.아웃상담)} · 인 ${원(r.인상담)} · 원내 ${원(r.원내)}</span></div>
    <div><span class="이름">마케팅비</span><span class="값">${억(r.마케팅비)}</span><span class="풀이">예상 매출의 ${퍼(r.매출 ? r.마케팅비 / r.매출 : NaN)}</span></div>
    <div><span class="이름">DB</span><span class="값">${원(r.총DB)}건</span><span class="풀이">아웃 ${원(r.아웃DB)} · 인 ${원(지금.인DB)}</span></div>`;
  $('자동-총매출').textContent = 원(r.총매출) + '원';
  $('자동-총매출-풀이').textContent = `하루 ${Number.isFinite(r.하루) ? 원(r.하루) + '원' : '—'}`;
  변화쓰기();
  그래프그리기(r, 목);
  안분그리기(r, 목, 추);
}
/* 월 매출 — ERP 실제(진행 중인 달은 흐리게) + 이 안 예상 한 막대, 목표는 달마다 점선 */
function 그래프그리기(r, 목) {
  const 진행 = 진행달(), 달들 = Array.from({ length: 13 }, (_, i) => 달더하기(진행, i - 12)), 맵 = Object.fromEntries(월별.달.map(x => [x.연월, x.매출]));
  const 막대들 = [...달들.map(m => ({ m, v: 맵[m] ?? 0, 목: 월별.목표[m] })), { m: 고른달, v: r.매출, 목: 목?.값, 예: true }];
  const W = 560, H = 220, L = 40, R = 8, T = 18, B = 26, 최대값 = Math.max(...막대들.map(x => Math.max(x.v || 0, x.목 || 0)), 1);
  const 눈간 = 10 ** Math.floor(Math.log10(최대값 / 3)) * ([1, 2, 5].find(k => 10 ** Math.floor(Math.log10(최대값 / 3)) * k * 4 >= 최대값) || 10);
  const 최대 = Math.ceil(최대값 / 눈간) * 눈간, 띠 = (W - L - R) / 막대들.length, 폭 = Math.min(18, 띠 * 0.42);
  const y = v => T + (H - T - B) * (1 - v / 최대), x = i => L + 띠 * i + (띠 - 폭) / 2;
  let s = '';
  for (let g = 0; g <= 최대 + 1; g += 눈간) s += `<line x1="${L}" x2="${W - R}" y1="${y(g)}" y2="${y(g)}" stroke="var(--stroke2)" stroke-width="1"/><text x="${L - 6}" y="${y(g) + 4}" text-anchor="end">${억(g, 0)}</text>`;
  막대들.forEach((d, i) => {
    const v = Math.max(d.v || 0, 0);
    s += `<rect x="${x(i).toFixed(1)}" y="${y(v).toFixed(1)}" width="${폭.toFixed(1)}" height="${(y(0) - y(v)).toFixed(1)}" fill="${d.예 ? 'var(--chart)' : 'var(--barReal)'}"${d.m === 진행 && !d.예 ? ' opacity="0.5"' : ''}/>`;
    if (d.목) s += `<line x1="${(x(i) - 4).toFixed(1)}" x2="${(x(i) + 폭 + 4).toFixed(1)}" y1="${y(d.목).toFixed(1)}" y2="${y(d.목).toFixed(1)}" stroke="var(--fg2)" stroke-width="1" stroke-dasharray="3 2"/>`;
    const [yy, mm] = d.m.split('-');
    /* 예상 막대 밑은 '예상' — 계획 달이 진행 중인 달과 같으면 같은 달 글자가 둘이 된다. 달은 값 글에 붙인다 */
    s += `<text x="${(x(i) + 폭 / 2).toFixed(1)}" y="${H - B + 16}" text-anchor="middle"${d.예 ? ' style="fill:var(--fg1);font-weight:600"' : ''}>${d.예 ? '예상' : mm === '01' ? yy.slice(2) + '.1' : +mm}</text>`;
    if (d.예) s += `<text x="${(x(i) + 폭).toFixed(1)}" y="${(Math.min(y(v), d.목 ? y(d.목) : y(v)) - 6).toFixed(1)}" text-anchor="end" style="fill:var(--fg1);font-weight:600" data-예상>${달이름(d.m)} ${억(d.v)}</text>`;
    else if (d.m === 진행) s += `<text x="${(x(i) + 폭 / 2).toFixed(1)}" y="${(y(v) - 5).toFixed(1)}" text-anchor="middle">진행 중</text>`;
  });
  $('그래프').innerHTML = s;
}
function 안분그리기(r, 목, 추) {
  if (!목) { $('안분').innerHTML = '<p class="안분글">견줄 목표가 없습니다 — 매출 목표를 넣거나 ERP 월 목표가 있는 달을 고르면 보입니다.</p>'; return; }
  const 분 = 안분(지금, r, 목.값);
  if (!분.줄.length) {
    $('안분').innerHTML = 분.모자람 > 0 ? '<p class="안분글">상담단가가 없어 셈할 수 없습니다.</p>'
      : `<p class="안분글">예상 매출이 ${목.출처} ${억(목.값)}를 <b>${억(-분.모자람)}</b> 넘습니다 — 부족한 것이 없습니다.</p>`;
    return;
  }
  const 과거 = 기준만들기(과거실적들()), 범위 = 과거?.범위 ?? null;
  const 꼴 = x => v => x.퍼 ? 퍼(v) : Math.abs(v) >= 1e7 ? 억(v) : 원(v);   // 큰 돈은 만 · 억 — 판정 열까지 한 화면에
  const 판들 = 분.줄.map(x => ({ x, 판: 판정(x, 범위) }));
  const 이름들 = 판 => 판들.filter(p => p.판 === 판).map(p => p.x.이름).join(' · ');
  const 판글 = { 해봄: '해 본 수준', 못: '이것만으론 못 메움', 모름: '과거 실적 없음' };
  /* 과거보다 더 — 주황으로 채운 표시에 최고 · 최저와 넘는 정도, 넘은 줄은 바탕까지(사용자 10/14 "구분이 안 된다" → 10/15 "잘 안 보인다 — 바로 눈에 띄게", 시안 A) */
  const 넘침 = (x, 범) => { const 퍼센트 = Math.round(x.낮게 ? (1 - x.필요 / 범[0]) * 100 : (x.필요 / 범[1] - 1) * 100);
    return Number.isFinite(퍼센트) ? (x.낮게 ? `▼ 최저 −${퍼센트}%` : `▲ 최고 +${퍼센트}%`) : (x.낮게 ? '▼ 최저보다 낮게' : '▲ 최고보다 높게'); };
  const 끝 = (이름, 값, 넘) => 넘 ? `<span class="끝 넘">${이름} ${값}</span>` : `${이름} ${값}`;
  const 추필요 = 추 ? 추.필요(목.값) : NaN;
  $('안분').innerHTML = `<div class="안분글"><span>${목.출처} ${억(목.값)}까지 <b>${억(분.모자람)}</b> 모자랍니다 — 상담으로 <b>${원(분.더상담)}건</b> 더.</span>` +
    (범위 ? `<span>과거에 해 본 수준으로 메울 수 있는 길: <b>${이름들('해봄') || '없음'}</b>${이름들('어려움') ? ` · 과거보다 더 해야 하는 것: <b>${이름들('어려움')}</b>` : ''}</span>` : '<span>과거 실적을 넣으면 숫자마다 해 본 수준인지 판정합니다.</span>') +
    (Number.isFinite(추필요) && 추필요 > 0 ? `<span>과거 추세로 보면 목표 ${억(목.값)} 에는 마케팅비가 약 <b>${억(추필요)}</b> 필요합니다(지금 이 안 ${억(r.마케팅비)}).</span>` : '') + '</div>' +
    `<div class="표틀"><table class="표" id="안분표"><thead><tr><th>하나만 바꾼다면</th><th>이 안</th><th>필요</th><th>과거 범위${과거 ? ` (${달이름(과거.달들[0])}~${달이름(과거.달들.at(-1))})` : ''}</th><th>판정${도움('메우기')}</th></tr></thead><tbody>` +
    판들.map(({ x, 판 }) => { const 범 = 범위?.[x.키], 넘 = 판 === '어려움';
      return `<tr${넘 ? ' class="넘음"' : ''}><td>${x.이름}</td><td>${Number.isFinite(x.지금) ? 꼴(x)(x.지금) : '—'}</td><td class="필">${Number.isFinite(x.필요) ? 꼴(x)(x.필요) : '—'}</td><td class="흐">${범 ? `${끝('최저', 꼴(x)(범[0]), 넘 && x.낮게)} ~ ${끝('최고', 꼴(x)(범[1]), 넘 && !x.낮게)}` : '—'}</td>
        <td>${넘 ? `<span class="판표">${넘침(x, 범)}</span>` : `<span class="점판 ${판}">${판글[판]}</span>`}</td></tr>`; }).join('') + '</tbody></table></div>';
}
function 항목그리기() {
  if (!지금) return;
  const r = 셈(지금);
  /* 구성 — 항목마다 다른 색 금지("난잡하다"): 큰 것부터 ERP 차트색 진하게, 여섯째부터는 회색 */
  const 순 = 지금.항목.filter(x => x.금액 > 0).sort((a, b) => b.금액 - a.금액);
  $('구성').innerHTML = !순.length ? '' : `<div class="구성막대">${순.map((x, n) => `<div class="층${Math.min(n, 5)}" style="flex:${x.금액}" title="${막기(x.이름)} ${원(x.금액)}원">${x.금액 / r.마케팅비 > 0.08 ? 막기(x.이름) : ''}</div>`).join('')}</div>
    <div class="구성설명">${순.map((x, n) => `<span><i class="층${Math.min(n, 5)}"></i>${막기(x.이름)} ${퍼(x.금액 / r.마케팅비)}</span>`).join('')}</div>`;
  지금.항목.forEach((x, i) => { document.querySelector(`[data-비중="${i}"]`).textContent = 퍼(x.금액 / r.마케팅비); });
  if ($('합-금액')) { $('합-금액').textContent = 원(r.마케팅비); $('합-DB').textContent = 원(r.게더링DB); $('합-비율').textContent = 쪽 === '실적' ? `매출의 ${퍼(r.비율)}` : `목표의 ${퍼(r.비율)}`; }
}

/* ── 과거 실적과 견주기 — 마케팅비(가로) 대비 매출(세로). 과거 달 = 회색 점, 추세선 · 띠, 이 달 안 = ERP 차트색, 보는 안은 굵은 이름 ── */
let 비교줄 = [];
function 비교그리기() {
  if (!지금 || 쪽 !== '계획') return;
  const 기 = 기준(), a = 보는것(), 목 = 목표(), 과거 = 과거실적들(), 추 = 추세(과거);
  const 과거점 = 과거.map(x => ({ 지난: true, 이름: 달이름(x.값.달) + ' 실적', 짧은: 달이름(x.값.달), 메모: '', ...셈(x.값) })).filter(d => d.마케팅비 > 0 || d.매출 > 0);
  const 안점 = 계획안들(고른달).map(x => ({ 보는: x === a, 이름: x.이름, 메모: x.값.메모, ...셈(x.값) }));
  비교줄 = [...안점, ...과거점];
  $('비교표').innerHTML = `<thead><tr><th>구분</th><th>마케팅비</th><th>① 예상 매출</th><th>② 과거 추세로</th><th>마케팅비 1원당 매출</th><th>DB</th><th>상담</th><th>${기 ? '기준 대비' : '—'}</th></tr></thead><tbody>` +
    (기 ? `<tr class="흐"><td>기준 · ${기간글(기)}</td><td>${억(기.마케팅비)}</td><td>${억(기.매출)}</td><td>—</td><td>${기.마케팅비 ? (기.매출 / 기.마케팅비).toFixed(1) + '원' : '—'}</td><td>${원(기.아웃DB + 기.인DB)}</td><td>${원(기.상담)}건</td><td>기준</td></tr>` : '') +
    안점.map(d => { const 변 = 기 ? 증감(d.매출, 기.매출) : null;
      return `<tr><td>${d.보는 ? '<b>' : ''}${막기(d.이름)}${d.메모 ? ' · ' + 막기(d.메모) : ''}${d.보는 ? '</b>' : ''}</td><td>${억(d.마케팅비)}</td><td>${억(d.매출)}</td><td>${추 ? 억(Math.max(0, 추.값(d.마케팅비))) : '—'}</td><td>${d.마케팅비 ? (d.매출 / d.마케팅비).toFixed(1) + '원' : '—'}</td><td>${원(d.총DB)}</td><td>${원(d.상담)}건</td><td>${변 === null ? (기 ? '같음' : '—') : (변 > 0 ? '+' : '−') + Math.abs(변).toFixed(1) + '%'}</td></tr>`; }).join('') + '</tbody>';
  /* 축 — 점이 있는 범위만(0 에서 시작하지 않음), 깨끗한 눈금 */
  const W = 860, H = 320, L = 56, R = 110, T = 20, B = 42;
  const 범 = (값들, 여유) => { const 작 = Math.min(...값들), 큰 = Math.max(...값들), 폭 = (큰 - 작) || 큰 * 0.2 || 1; return [Math.max(0, 작 - 폭 * 여유), 큰 + 폭 * 여유]; };
  const 눈 = 폭 => { const 거친 = 폭 / 4, 자리 = 10 ** Math.floor(Math.log10(거친 || 1)); return [1, 2, 2.5, 5, 10].map(k => k * 자리).find(k => k >= 거친); };
  const [x0, x1] = 범(비교줄.map(d => d.마케팅비), 0.35), [y0, y1] = 범([...비교줄.map(d => d.매출), ...(목 ? [목.값] : [])], 0.25);
  const xs = 눈(x1 - x0), ys = 눈(y1 - y0), xa = Math.floor(x0 / xs) * xs, xb = Math.ceil(x1 / xs) * xs, ya = Math.floor(y0 / ys) * ys, yb = Math.ceil(y1 / ys) * ys;
  const x = v => L + (W - L - R) * (v - xa) / ((xb - xa) || 1), y = v => T + (H - T - B) * (1 - (v - ya) / ((yb - ya) || 1));
  let s = `<defs><clipPath id="비교안쪽"><rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}"/></clipPath></defs>`;
  for (let g = ya; g <= yb + ys / 2; g += ys) s += `<line x1="${L}" x2="${W - R}" y1="${y(g).toFixed(1)}" y2="${y(g).toFixed(1)}" stroke="var(--stroke2)"/><text x="${L - 8}" y="${(y(g) + 4).toFixed(1)}" text-anchor="end">${억(g)}</text>`;
  for (let g = xa; g <= xb + xs / 2; g += xs) s += `<text x="${x(g).toFixed(1)}" y="${H - B + 18}" text-anchor="middle">${억(g)}</text>`;
  s += `<text x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">마케팅비 →</text>`;
  /* 추세 — 띠 · 선은 그림 안으로 자른다 */
  if (추) {
    const 점들 = Array.from({ length: 41 }, (_, i) => xa + (xb - xa) * i / 40);
    s += `<g clip-path="url(#비교안쪽)" data-추세><path d="M${점들.map(v => `${x(v).toFixed(1)},${y(추.값(v) + 추.폭(v)).toFixed(1)}`).join('L')}L${점들.slice().reverse().map(v => `${x(v).toFixed(1)},${y(추.값(v) - 추.폭(v)).toFixed(1)}`).join('L')}Z" fill="var(--band)"/>` +
      `<line x1="${x(xa).toFixed(1)}" x2="${x(xb).toFixed(1)}" y1="${y(추.값(xa)).toFixed(1)}" y2="${y(추.값(xb)).toFixed(1)}" stroke="var(--past)" stroke-width="2"/></g>`;
  }
  if (목) s += `<line x1="${L}" x2="${W - R}" y1="${y(목.값).toFixed(1)}" y2="${y(목.값).toFixed(1)}" stroke="var(--fg2)" stroke-dasharray="4 3"/><text class="테" x="${W - R + 6}" y="${(y(목.값) + 4).toFixed(1)}">목표 ${억(목.값)}</text>`;
  /* 점 먼저, 이름표는 안 먼저 — 다른 이름표 · 점과 안 겹치는 첫 자리 */
  const 놓인 = 비교줄.map(d => ({ x: x(d.마케팅비) - 8, y: y(d.매출) - 8, w: 16, h: 16 }));
  const 겹침 = (p, q) => p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h;
  /* 과거 점을 먼저 깔고 안 점을 위에 — 실적에서 가져온 안은 그 달 점과 같은 자리라 가려졌다 */
  [...비교줄.entries()].sort(([, p], [, q]) => (q.지난 ? 1 : 0) - (p.지난 ? 1 : 0)).forEach(([i, d]) => { s += `<g class="점" data-점="${i}"><circle cx="${x(d.마케팅비).toFixed(1)}" cy="${y(d.매출).toFixed(1)}" r="14" fill="transparent"/><circle cx="${x(d.마케팅비).toFixed(1)}" cy="${y(d.매출).toFixed(1)}" r="${d.지난 ? 5 : 6}" fill="${d.지난 ? 'var(--past)' : 'var(--plan)'}" stroke="var(--bg1)" stroke-width="2"/></g>`; });
  비교줄.forEach(d => {
    const cx = x(d.마케팅비), cy = y(d.매출), 메모 = d.메모.length > 10 ? d.메모.slice(0, 10) + '…' : d.메모, 글 = d.지난 ? d.짧은 : d.이름 + (메모 ? ' · ' + 메모 : ''), w = 글.length * 7.4 + 4, h = 16;
    const 자리 = [[10, -20], [10, 4], [-10 - w, -20], [-10 - w, 4], [-w / 2, -28], [-w / 2, 12], [14, -8], [-14 - w, -8]].map(([dx, dy]) => ({ x: cx + dx, y: cy + dy, w, h }))
      .find(p => !놓인.some(o => 겹침(p, o)) && p.x > L && p.x + p.w < W - 4 && p.y > T - 4) || { x: cx + 10, y: cy - 20, w, h };
    놓인.push(자리);
    s += `<text class="${d.지난 ? '' : '이름글 '}테${d.보는 ? ' 보는' : ''}" x="${(자리.x + 2).toFixed(1)}" y="${(자리.y + 12).toFixed(1)}">${막기(글)}</text>`;
  });
  $('비교그래프').innerHTML = s;
  비교추세 = 추;
}
/* 점 풀이 — 사람이 친 글자(이름 · 메모)는 막아서 넣는다 */
let 비교추세 = null;
function 점풀이(i, e) {
  const d = 비교줄[i], 창 = $('풀이창'); if (!d) return;
  창.innerHTML = `<b>${막기(d.이름)}</b>${d.메모 ? ' · ' + 막기(d.메모) : ''}<br>${d.지난 ? '실제 매출' : '① 예상 매출'} ${억(d.매출)}${!d.지난 && 비교추세 ? ` · ② 추세로 ${억(Math.max(0, 비교추세.값(d.마케팅비)))}` : ''}<br>마케팅비 ${억(d.마케팅비)} · 1원당 매출 ${d.마케팅비 ? (d.매출 / d.마케팅비).toFixed(1) + '원' : '—'}<br>DB ${원(d.총DB)} · 상담 ${원(d.상담)}건`;
  창.hidden = false;
  창.style.left = Math.min(e.clientX + 14, innerWidth - 창.offsetWidth - 8) + 'px';
  창.style.top = Math.min(e.clientY + 14, innerHeight - 창.offsetHeight - 8) + 'px';
}

/* ── 월별 실적 — ERP 병원 전체 ── */
function 추이선(vals) {
  const w = 90, h = 24, 유 = vals.filter(v => v != null);
  if (유.length < 2) return '';
  const 최대 = Math.max(...유), 최소 = Math.min(...유), 폭 = 최대 - 최소 || 1;
  const pts = vals.map((v, i) => v == null ? null : `${(i / (vals.length - 1) * w).toFixed(1)},${(h - 2 - (v - 최소) / 폭 * (h - 4)).toFixed(1)}`).filter(Boolean);
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts.join(' ')}" fill="none" stroke="var(--chart)" stroke-width="1.5"/></svg>`;
}
function 격자그리기() {
  if (!월별.오늘) { $('격자').innerHTML = ''; return; }
  const 진행 = 진행달(), 달들 = Array.from({ length: 13 }, (_, i) => 달더하기(진행, i - 12));
  const 맵 = Object.fromEntries(월별.달.map(r => [r.연월, r])), 목표값 = m => 월별.목표[m] || null;
  const 줄정의 = [
    ['매출', o => o ? o.매출 : null, v => 억(v)],
    ['상담', o => o ? o.상담 : null, 원],
    [`결제율${도움('결제율')}`, o => o && o.상담 ? o.결제 / o.상담 : null, v => 퍼(v)],
    [`객단가${도움('객단가')}`, o => o && o.결제 ? o.매출 / o.결제 : null, 만],
    [`상담단가${도움('상담단가')}`, o => o && o.상담 ? o.매출 / o.상담 : null, 만]
  ];
  const 칸 = (m, v, 꼴) => `<td class="${m === 진행 ? '진행열' : ''} ${v == null ? '빈' : ''}">${v == null ? '—' : 꼴(v)}</td>`;
  const 줄 = (이름, vals, 꼴, 선 = true) => `<tr><td class="이름칸">${이름}</td><td class="선칸">${선 ? 추이선(vals.slice(0, 12)) : ''}</td>${vals.map((v, i) => 칸(달들[i], v, 꼴)).join('')}</tr>`;
  $('격자').innerHTML = `<thead><tr><th class="이름칸">지표</th><th style="text-align:left">12달 추이</th>${달들.map(m => `<th class="${m === 진행 ? '진행열' : ''}">${m.slice(2).replace('-', '.')}${m === 진행 ? ' 진행 중' : ''}</th>`).join('')}</tr></thead><tbody>` +
    줄정의.map(([이름, f, 꼴]) => 줄(이름, 달들.map(m => f(맵[m])), 꼴)).join('') +
    줄('월 목표', 달들.map(목표값), v => 억(v), false) +
    줄('달성률', 달들.map(m => 목표값(m) ? (맵[m]?.매출 || 0) / 목표값(m) : null), v => 퍼(v), false) + '</tbody>';
}

/* ── 탭 · 전체 ── */
function 탭바꾸기(t) {
  탭 = t;
  $('탭-sim').setAttribute('aria-selected', t === 'sim');
  $('탭-hist').setAttribute('aria-selected', t === 'hist');
  $('판-sim').hidden = t !== 'sim';
  $('판-hist').hidden = t !== 'hist';
  if (t === 'hist') 격자그리기();
}
/* 갱신 = 치는 동안(셈 결과만) · 모두그리기 = 달 · 쪽 · 안이 바뀔 때(칸까지) */
function 갱신() { 결과그리기(); 항목그리기(); 비교그리기(); 탭글쓰기(); }
function 모두그리기() { 지금 = 보는것()?.값 ?? null; 달줄그리기(); 제목줄그리기(); 안탭그리기(); 입력그리기(); 갱신(); if (탭 === 'hist') 격자그리기(); }

/* ── 용어 풀이 상자 — 하나를 i 옆(밑, 모자라면 위)에 화면 안으로 띄운다 ── */
let 연도움 = null, 고정 = false;
function 풀이열기(b) {
  const 창 = $('풀이창');
  창.textContent = 용어[b.dataset.도움]?.[1] ?? ''; 창.hidden = false;
  if (연도움 && 연도움 !== b) 연도움.removeAttribute('aria-expanded');
  연도움 = b; b.setAttribute('aria-expanded', 'true');
  const r = b.getBoundingClientRect(), 폭 = 창.offsetWidth, 높이 = 창.offsetHeight;
  창.style.left = Math.max(8, Math.min(r.left - 6, innerWidth - 폭 - 8)) + 'px';
  창.style.top = (r.bottom + 8 + 높이 <= innerHeight ? r.bottom + 8 : Math.max(8, r.top - 8 - 높이)) + 'px';
}
function 풀이닫기() { $('풀이창').hidden = true; 연도움?.removeAttribute('aria-expanded'); 연도움 = null; 고정 = false; }
let 점열림 = false;
document.addEventListener('mouseover', e => {
  const 점 = e.target.closest?.('.점');
  if (점) { if (연도움 && !고정) 풀이닫기(); 점열림 = true; return 점풀이(+점.dataset.점, e); }
  if (점열림) { 점열림 = false; $('풀이창').hidden = true; }
  const b = e.target.closest?.('.도움');
  if (b) { if (b !== 연도움) { 고정 = false; 풀이열기(b); } } else if (연도움 && !고정 && document.activeElement !== 연도움) 풀이닫기();
});
document.addEventListener('mousemove', e => { if (점열림) { const 점 = e.target.closest?.('.점'); if (점) 점풀이(+점.dataset.점, e); } });
document.addEventListener('focusin', e => { if (e.target.classList?.contains('도움')) 풀이열기(e.target); });
document.addEventListener('focusout', e => { if (e.target === 연도움 && !고정) 풀이닫기(); });
addEventListener('scroll', () => { if (연도움) 풀이닫기(); }, true);

/* ── 이벤트 ── */
document.addEventListener('click', e => {
  const 도움단추 = e.target.closest('.도움');
  if (도움단추) { if (고정 && 연도움 === 도움단추) 풀이닫기(); else { 풀이열기(도움단추); 고정 = true; } return; }
  if (고정) 풀이닫기();
  const t = e.target.closest('button'); if (!t) return;
  if (t.id === '탭-sim') return 탭바꾸기('sim');
  if (t.id === '탭-hist') return 탭바꾸기('hist');
  if (t.id === '다시시도') return 다시할일?.();
  /* 나가기는 토큰을 지우고 런처로. 다른 시뮬로는 이름 메뉴(shared.js), 비밀번호 바꾸기는 런처 맨 아래(마스터 PIN, 10/15) */
  if (t.id === '나가기') { 자료병원ID = null; 잠그기(); return location.assign('/sim/#marketing'); }
  if (t.dataset.달) return 고르기(() => { 고른달 = t.dataset.달; 보는안 = 0; 쪽 = 고른달 < 진행달() ? '실적' : '계획';   /* 지난 달은 실적을 넣으러, 이번 달 · 다음 달은 계획을 짜러 */ });
  if (t.dataset.쪽) return 고르기(() => { 쪽 = t.dataset.쪽; });
  if (t.dataset.안) return 고르기(() => { 보는안 = +t.dataset.안; });
  if (t.dataset.계획시작) {
    const 이름 = 다음이름(계획안들(고른달));
    if (t.dataset.계획시작 === '평균') {
      const 바탕 = 기준실적들(안들, 고른달, 1)[0]?.값 ?? 빈안();
      return 안만들기(평균에서계획(기준(), 바탕, 고른달), 이름);
    }
    if (t.dataset.계획시작 === '앞안') { const 앞 = 계획안들(달더하기(고른달, -1))[0]; return 안만들기({ ...베낌(앞.값), 달: 고른달 }, 이름); }
    return 안만들기({ ...빈안(), 달: 고른달 }, 이름);
  }
  if (t.dataset.다른안) {
    const a = 보는것(); if (!a) return;
    return 안만들기({ ...베낌(a.값), 메모: (a.값.메모 ? a.값.메모 + ' 사본' : '사본').slice(0, 30) }, 다음이름(계획안들(고른달)));
  }
  if (t.dataset.실적넣기) {
    /* 매출은 ERP 월별 실적에서 미리 채운다(고칠 수 있음). 줄은 그 달 계획(없으면 가장 가까운 앞 실적)의 이름 · 종류만 — 금액 · DB 는 실제로 쓴 돈 · 들어온 DB 를 넣는다 */
    const erp = 월별.달.find(x => x.연월 === 고른달), 틀 = 계획안들(고른달)[0] || 기준실적들(안들, 고른달, 1)[0];
    const 항목 = (틀?.값.항목 ?? []).map(x => ({ 이름: x.이름, 종류: x.종류, 금액: 0, db: 0, cpa: x.종류 === 'DB' ? 0 : null, 셈칸: 'cpa' }));
    return 안만들기({ ...빈안(), 종류: '실적', 달: 고른달, 시술: erp ? Math.round(erp.매출) : 0, 항목 }, `${달이름(고른달)} 실적`);
  }
  if (t.dataset.기간) {
    const b = 기준안(고른달);
    if (t.dataset.기간 === '직접') {
      if (b) { b.값.사용 = true; 모두그리기(); return 저장예약(b); }
      /* 처음이면 지금 기준(평균)을 채워 그 달 공용 기준 안을 만든다 — 보는 안은 그대로 */
      const 기 = 기준(), 기준값 = Object.fromEntries(기준칸.map(k => [k, Number.isFinite(기?.[k]) ? (k === '아웃률' || k === '인률' ? 기[k] : Math.round(기[k])) : 0]));
      return 안만들기({ 종류: '기준', 달: 고른달, 사용: true, 기준값 }, `${달이름(고른달)} 기준`, false);
    }
    기간 = +t.dataset.기간; 보관.쓰기('mkt-기간', String(기간));
    if (b?.값.사용) { b.값.사용 = false; 모두그리기(); return 저장예약(b); }   // 넣은 값은 두고 끄기만
    return 모두그리기();
  }
  if (t.dataset.안지우기 === '열기') { 지우는중 = true; return 제목줄그리기(); }
  if (t.dataset.안지우기 === '아니') { 지우는중 = false; return 제목줄그리기(); }
  if (t.dataset.안지우기 === '예') return 안지우기();
  if (t.dataset.되돌리기) {
    /* 목표는 그대로(되돌릴 것은 마케팅 숫자) · DB 비용 셋은 평균을 쓴 뒤 다시 잇는다 */
    for (const s of 손잡이들()) if (s.기준 !== undefined && s.키 !== '목표') 쓰기(s.경로, s.기준);
    const a = 보는것(); a.값 = 안꼴(a.값);
    모두그리기(); return 저장예약();
  }
  if (t.dataset.추가) {
    if (!지금) return;
    if (지금.항목.length >= 50) { $('안알림').textContent = '항목은 50개까지입니다.'; return; }
    지금.항목.push(t.dataset.추가 === '게더링' ? { 이름: '새 DB 비용', 종류: 'DB', 금액: 0, db: 0, cpa: 0, 셈칸: 쪽 === '실적' ? 'cpa' : 'db' } : { 이름: '새 그 밖 비용', 종류: '그밖', 금액: 0, db: 0, cpa: null, 셈칸: 'db' });
    모두그리기(); 저장예약();
    const 이름칸들 = document.querySelectorAll('[data-경로$=".이름"]');
    이름칸들[이름칸들.length - 1]?.select();
    return;
  }
  if (t.dataset.지움) { 지금.항목.splice(+t.dataset.지움, 1); 모두그리기(); return 저장예약(); }
});
/* 치는 동안 · 끄는 동안 — 값을 쓰고, 같은 경로의 다른 칸 · 슬라이더를 맞추고, 결과만 다시 그린다 (칸은 그대로) */
document.addEventListener('input', e => {
  const el = e.target, 경로 = el.dataset.경로;
  if (!경로) return;
  쓰기(경로, el.type === 'range' ? +el.value : 읽어(el.dataset.꼴, el.value));
  const 셋 = 셋경로(경로);
  if (셋) { 최근편집.set(셋.x, 셋맞추기(셋.x, 셋.칸, 최근편집.get(셋.x))); 셋동기(셋.i, el); if (el.type === 'range') 칠(el, +el.value); 갱신(); return 저장예약(); }
  for (const 짝 of document.querySelectorAll(`[data-경로="${경로}"]`)) {
    if (짝 === el) continue;
    if (짝.type === 'range') { 짝.value = 읽기(경로); 칠(짝, 읽기(경로)); } else 짝.value = 보기(짝.dataset.꼴, 읽기(경로));
  }
  if (el.type === 'range') 칠(el, +el.value);
  갱신(); 저장예약(경로.startsWith('@기준.') ? 기준안(고른달) : undefined);
});
/* 칸을 떠나면 꼴을 맞춘다 — 슬라이더 끝보다 큰 값이면 끝을 늘린다(표를 다시 그리지 않는다: 다음 칸으로 가는 포커스를 잃는다) */
document.addEventListener('change', e => {
  const el = e.target;
  if ((el.id === '복사고르기' || el.id === '가져오기') && el.value) {
    const 원본 = 안들.find(a => a.id === +el.value); if (!원본) return;
    /* 실적에서 가져오면 비율로(그 실적 → 계획), 안에서 가져오면 숫자 그대로 */
    const 값 = 원본.값.종류 === '실적' ? { ...실적에서계획(원본.값, 원본.id), 달: 고른달 } : { ...베낌(원본.값), 달: 고른달 };
    return 안만들기(값, 다음이름(계획안들(고른달)));
  }
  const 경로 = el.dataset.경로;
  if (!경로 || el.type === 'range') return;
  /* 이름 — 제목 줄은 다시 그리지 않는다: 이 change 는 다른 단추를 누르는 순간에 돌아, 다시 그리면 그 클릭이 사라진다 */
  /* 이름 · 메모 — 칸이 있는 곳(제목 줄 · 바꿔 보기 표)은 다시 그리지 않는다: 이 change 는 다른 칸을 누르는 순간에 돌아,
     다시 그리면 누른 칸이 사라지고 다음 글자가 엉뚱한 칸에 들어간다(메모에 금액이 붙었다). 바꿔 보기 줄 이름만 글자로 바꾼다 */
  if (el.dataset.꼴 === '글') {
    쓰기(경로, el.value.trim().slice(0, 30) || (경로 === '메모' ? '' : '이름 없음')); el.value = 읽기(경로);
    const 항 = /^항목\.(\d+)\.이름$/.exec(경로);
    if (항) for (const [끝, 붙임] of [['금액', ' 금액'], ['db', ' DB'], ['cpa', ' CPA']]) { const 이름칸 = document.querySelector(`[data-줄이름="항목.${항[1]}.${끝}"]`); if (이름칸) 이름칸.textContent = 읽기(경로) + 붙임; }
    갱신(); return 저장예약();
  }
  el.value = 보기(el.dataset.꼴, 읽기(경로));
  const 끌 = $('바꿈').querySelector(`input[type=range][data-경로="${경로}"]`);
  if (끌 && 읽기(경로) > +끌.max) { 끌.max = 끝값({ 기본: 0, 퍼: el.dataset.꼴 === '퍼' }, 읽기(경로)); 끌.value = 읽기(경로); 칠(끌, 읽기(경로)); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && 연도움) 풀이닫기(); });
async function 병원바꾸기(id) {
  병원ID = id; $('병원고르기').value = id;
  await 저장하기();   // 고치던 것은 옛 병원에 먼저 쓴다
  try { await 불러오기(); } catch (err) { if (!err.잠김) 오류줄(err.message, () => 병원바꾸기(id)); }
}
$('병원고르기').addEventListener('change', e => 병원바꾸기(e.target.value));
$('잠금폼').addEventListener('submit', async e => {
  e.preventDefault();
  const 비번 = $('비번1').value;
  $('잠금오류').textContent = '';
  try {
    let r;
    if (처음) {
      if (비번 !== $('비번2').value) throw new Error('두 칸이 다릅니다.');
      r = await 부르기('MKT_비밀번호처음', 비번);
    } else {
      r = await 부르기('MKT_login', 비번);
      if (r.처음) return 처음모드();
    }
    토큰 = r.토큰; 보관.쓰기('mkt-token', 토큰);
    처음 = false; $('비번2칸').hidden = true; $('잠금').hidden = true;
    $('비번1').value = $('비번2').value = '';
    await 시작();
  } catch (err) { $('잠금오류').textContent = err.message; }
});

시뮬메뉴('marketing', 저장하기);   // 다른 시뮬로 가기 전에 고치던 것을 쓴다
if (토큰) { $('잠금').hidden = true; 시작(); } else 잠그기();
