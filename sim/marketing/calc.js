/* 마케팅 시뮬레이터 — 순수 계산 · 숫자 꼴 (DOM 없음). 검사: node sim/test-calc.mjs
   spec docs/superpowers/specs/2026-10-13-marketing-sim-design.md ★ v5 — 실적 안에서 비율, 계획 안에서 예상, 과거 실적으로 기준 평균 · 추세 · 판정 */

/* ── 숫자 꼴 — 유한하지 않으면 '—' ── */
const 있나 = Number.isFinite;
export const 원 = n => 있나(n) ? Math.round(n).toLocaleString('ko-KR') : '—';
export const 만 = n => 있나(n) ? Math.round(n / 1e4).toLocaleString('ko-KR') + '만' : '—';
/* 소수점 뒤 0 만 지운다(시안은 10억을 1억으로 찍었다). 1억 아래는 만으로 — '0.45억' · '0억' 대신 '4,500만' (시안 A) */
export const 억 = (n, 자리 = 2) => !있나(n) ? '—' : n && Math.abs(n) < 1e8 ? 만(n)
  : (n / 1e8).toFixed(자리).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '') + '억';
export const 퍼 = (x, 자리 = 1) => 있나(x) ? (x * 100).toFixed(자리) + '%' : '—';

/* ── 한 안(시트의 한 열) — 실적 안은 그 달 실제 숫자(상담 아웃 · 인 · 원내), 계획 안은 목표 + 전환 숫자 ── */
export const 빈안 = () => ({
  종류: '계획', 달: '', 기준: null, 메모: '', 영업일: 0, 시술: 0, 외: 0, 항목: [], 인DB: 0, 추가DB: 0,
  상담: { 아웃: 0, 인: 0, 원내: 0 },
  전환: { 아웃률: 0, 인률: 0, 원내: 0, 단가: 0, 기준일: 0 }
});

/* 저장된 값 · 사람이 친 값을 한 안 모양으로 — 숫자는 0 이상 유한, 글자 30자, 항목 50개, 종류는 둘 중 하나, 달은 YYYY-MM, 기준은 양의 정수.
   서버(mkt.ts 안값)도 같은 규칙으로 다시 만든다 — 여기서는 옛 꼴 · 깨진 값으로 화면이 죽지 않게 */
export const 수 = v => { const n = Number(String(v ?? '').replace(/[,\s%]/g, '')); return 있나(n) && n > 0 ? n : 0; };
export const 달더하기 = (연월, n) => {
  const [y, m] = 연월.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
};
const 물건 = v => v && typeof v === 'object' ? v : {};
const 셋칸 = ['금액', 'db', 'cpa'];

/* ── 마케팅비 줄 — DB 비용(금액 · DB · CPA 셋이 이어짐) · 그 밖 비용(금액만) ──
   옛 꼴(종류 없음)은 CPA 가 있으면 DB 비용. DB 비용은 CPA 가 0 이어도 DB 비용으로 남는다(옛 버그: CPA 를 비우면 비용이 됐다) */
const DB인가 = x => x.종류 ? x.종류 === 'DB' : x.cpa > 0;
/* 셈칸(자동 칸)을 나머지 둘로 다시 센다 */
function 셋셈(x) {
  if (x.셈칸 === 'cpa') x.cpa = x.db > 0 ? x.금액 / x.db : 0;
  else if (x.셈칸 === '금액') x.금액 = Math.round(x.db * x.cpa);
  else x.db = x.cpa > 0 ? Math.floor(x.금액 / x.cpa) : x.db;
}
/* 칸 하나를 고친 뒤 — 마지막으로 고친 두 칸이 넣은 칸, 남은 하나가 자동. 자동 칸을 직접 고치면 자동이 남은 칸으로 옮겨 간다.
   돌려주는 값 = 이번에 고친 칸(다음 호출의 최근) */
export function 셋맞추기(x, 칸, 최근) {
  if (x.셈칸 === 칸) x.셈칸 = 셋칸.find(k => k !== 칸 && k !== 최근) || (칸 === 'db' ? 'cpa' : 'db');
  셋셈(x);
  return 칸;
}
function 줄꼴(x) {
  const 이름 = String(x.이름 ?? '').trim().slice(0, 30) || '이름 없음', 금액 = 수(x.금액);
  if (!DB인가({ 종류: x.종류 === 'DB' || x.종류 === '그밖' ? x.종류 : '', cpa: 수(x.cpa) })) return { 이름, 종류: '그밖', 금액, db: 0, cpa: null, 셈칸: 'db' };
  const 줄 = { 이름, 종류: 'DB', 금액, db: 수(x.db), cpa: 수(x.cpa), 셈칸: 셋칸.includes(x.셈칸) ? x.셈칸 : 'db' };
  셋셈(줄);
  return 줄;
}
/* 직접 넣은 기준(그 달 공용, 종류 기준) — 기준 판 칸 열둘. 비율(아웃률 · 인률)은 0~1 */
export const 기준칸 = ['매출', '상담', '마케팅비', '아웃DB', '인DB', '추가DB', 'CPA', '아웃률', '인률', '원내', '단가', '영업일'];
const 달꼴 = v => typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : '';
export function 안꼴(v) {
  const a = 물건(v), t = 물건(a.전환), c = 물건(a.상담);
  if (a.종류 === '기준') { const g = 물건(a.기준값); return { 종류: '기준', 달: 달꼴(a.달), 메모: '', 사용: a.사용 === true, 기준값: Object.fromEntries(기준칸.map(k => [k, 수(g[k])])) }; }
  return {
    종류: a.종류 === '실적' ? '실적' : '계획',
    달: 달꼴(a.달),
    기준: Number.isInteger(a.기준) && a.기준 > 0 ? a.기준 : null,
    메모: String(a.메모 ?? '').trim().slice(0, 30),
    영업일: 수(a.영업일), 시술: 수(a.시술), 외: 수(a.외),
    항목: (Array.isArray(a.항목) ? a.항목 : []).filter(x => x && typeof x === 'object').slice(0, 50).map(줄꼴),
    인DB: 수(a.인DB), 추가DB: 수(a.추가DB),
    상담: { 아웃: 수(c.아웃), 인: 수(c.인), 원내: 수(c.원내) },
    전환: { 아웃률: 수(t.아웃률), 인률: 수(t.인률), 원내: 수(t.원내), 단가: 수(t.단가), 기준일: 수(t.기준일) }
  };
}

/* 셈 — 실적이면 그 달 비율을, 계획이면 예상을 같은 이름의 칸으로 낸다(상담 · 매출 · 아웃률 · 인률 · 단가).
   DB 비용 DB = 줄의 db(종류 없는 옛 줄은 금액 ÷ CPA 내림 — 시트 조정안 1,309). 예상 상담 = 아웃 DB × 아웃 전환율 + (인 DB × 인 전환율 + 원내) × 일비.
   일비 = 이 안 영업일 ÷ 기준일 — 원내 · 문의 상담만 영업일만큼 (사용자 10/14). 기준일이 없으면 1 */
export function 셈(a) {
  const 나눔 = (x, y) => y ? x / y : NaN;
  const 총매출 = a.시술 + a.외, 마케팅비 = a.항목.reduce((s, x) => s + x.금액, 0);
  const 게더링 = a.항목.filter(DB인가), 게더링비 = 게더링.reduce((s, x) => s + x.금액, 0);
  const 게더링DB = 게더링.reduce((s, x) => s + (x.종류 ? x.db : Math.floor(x.금액 / x.cpa)), 0);
  const 아웃DB = 게더링DB + a.추가DB, 총DB = a.인DB + 아웃DB;
  const 공통 = {
    총매출, 하루: 나눔(총매출, a.영업일), 마케팅비, 비율: 나눔(마케팅비, 총매출),
    게더링비, 게더링DB, 아웃DB, 총DB, 인비율: 나눔(a.인DB, 총DB), CPA: 나눔(게더링비, 게더링DB)
  };
  if (a.종류 === '실적') {
    const { 아웃, 인, 원내 } = a.상담, 상담 = 아웃 + 인 + 원내;
    return { ...공통, 아웃상담: 아웃, 인상담: 인, 원내, 상담, 매출: 총매출, 아웃률: 나눔(아웃, 아웃DB), 인률: 나눔(인, a.인DB), 단가: 나눔(총매출, 상담), 일비: 1 };
  }
  const t = a.전환, 일비 = t.기준일 > 0 && a.영업일 > 0 ? a.영업일 / t.기준일 : 1;
  const 아웃상담 = 아웃DB * t.아웃률, 인상담 = a.인DB * t.인률 * 일비, 원내 = t.원내 * 일비, 상담 = 아웃상담 + 인상담 + 원내;
  return { ...공통, 아웃상담, 인상담, 원내, 상담, 매출: 상담 * t.단가, 아웃률: t.아웃률, 인률: t.인률, 단가: t.단가, 일비 };
}

/* ── 과거 실적으로 배우기 ── */
/* 고른 달 앞의 실적 안들, 최근 순으로 개수만큼 (v5: 기준 = 최근 N달 평균). 안들 = [{ id, 이름, 값 }] */
export function 기준실적들(안들, 달, 개수) {
  return 안들.filter(a => a.값.종류 === '실적' && a.값.달 && a.값.달 < 달).sort((a, b) => b.값.달.localeCompare(a.값.달)).slice(0, 개수);
}
export const 기준실적 = (안들, 달) => 기준실적들(안들, 달, 1)[0] || null;
/* 실적들의 평균 · 줄 이름별 평균 · 범위. 범위는 '과거에 해 본 수준' 판정에 쓴다. 줄 이름 찾기는 Map(프로토타입 키 함정 없음) */
export function 기준만들기(실적들) {
  if (!실적들.length) return null;
  const 줄 = 실적들.map(a => ({ v: a.값, r: 셈(a.값) }));
  const 값들 = f => 줄.map(f).filter(있나);
  const 평 = f => { const v = 값들(f); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : NaN; };
  const 범 = f => { const v = 값들(f); return v.length ? [Math.min(...v), Math.max(...v)] : null; };
  const 항목 = new Map();
  for (const 이름 of new Set(줄.flatMap(({ v }) => v.항목.map(x => x.이름)))) {
    const 들 = 줄.flatMap(({ v }) => v.항목.filter(x => x.이름 === 이름)), DB들 = 들.filter(x => DB인가(x));
    const db합 = DB들.reduce((s, x) => s + (x.종류 ? x.db : Math.floor(x.금액 / x.cpa)), 0), 금액합 = DB들.reduce((s, x) => s + x.금액, 0);
    항목.set(이름, { 금액: 들.reduce((s, x) => s + x.금액, 0) / 들.length, db: DB들.length ? db합 / DB들.length : NaN, cpa: db합 ? 금액합 / db합 : NaN });
  }
  const 게더링비합 = 줄.reduce((s, x) => s + x.r.게더링비, 0), 게더링DB합 = 줄.reduce((s, x) => s + x.r.게더링DB, 0);
  return {
    개수: 줄.length, 달들: 줄.map(x => x.v.달).sort(),
    매출: 평(x => x.r.매출), 상담: 평(x => x.r.상담), 마케팅비: 평(x => x.r.마케팅비), 게더링비: 평(x => x.r.게더링비),
    아웃DB: 평(x => x.r.아웃DB), 인DB: 평(x => x.v.인DB), 추가DB: 평(x => x.v.추가DB),
    아웃률: 평(x => x.r.아웃률), 인률: 평(x => x.r.인률), 단가: 평(x => x.r.단가), 원내: 평(x => x.v.상담.원내),
    영업일: 평(x => x.v.영업일 || NaN), CPA: 게더링DB합 ? 게더링비합 / 게더링DB합 : NaN, 항목,
    범위: {
      게더링비: 범(x => x.r.게더링비), CPA: 범(x => x.r.CPA), 아웃DB: 범(x => x.r.아웃DB), 아웃률: 범(x => x.r.아웃률),
      인DB: 범(x => x.v.인DB), 인률: 범(x => x.r.인률), 단가: 범(x => x.r.단가), 마케팅비: 범(x => x.r.마케팅비), 매출: 범(x => x.r.매출)
    }
  };
}
/* 기준(평균)으로 계획 만들기 — 바탕(가장 최근 실적)의 줄 · 금액은 그대로, DB 비용 CPA 는 그 줄 이름의 평균 CPA, 비율 · DB · 영업일은 평균. 못 낸 값은 0 */
export function 평균에서계획(기준, 바탕, 달) {
  const 유 = v => 있나(v) ? v : 0;
  return {
    ...빈안(), 달, 영업일: Math.round(유(기준.영업일)),
    항목: 바탕.항목.map(x => {
      if (!DB인가(x)) return { 이름: x.이름, 종류: '그밖', 금액: x.금액, db: 0, cpa: null, 셈칸: 'db' };
      const 평균CPA = 기준.항목.get(x.이름)?.cpa, 줄 = { 이름: x.이름, 종류: 'DB', 금액: x.금액, db: 0, cpa: 평균CPA > 0 ? 평균CPA : 기준.CPA > 0 ? 기준.CPA : x.cpa || 0, 셈칸: 'db' };
      셋셈(줄);
      return 줄;
    }),
    인DB: Math.round(유(기준.인DB)), 추가DB: Math.round(유(기준.추가DB)),
    전환: { 아웃률: 유(기준.아웃률), 인률: 유(기준.인률), 원내: Math.round(유(기준.원내)), 단가: 유(기준.단가), 기준일: Math.round(유(기준.영업일)) }
  };
}
/* 직접 넣은 기준 안 → 기준만들기 와 같은 꼴(줄마다 평균 · 과거 범위는 없다) */
export const 직접기준 = 안 => ({ 개수: 0, 달들: [], 직접: true, ...안.기준값, 게더링비: NaN, 항목: new Map(), 범위: null });
/* 실적 하나 → 다음 달 계획 (평균에서계획 의 한 달짜리) */
export function 실적에서계획(s, 실적ID) {
  return { ...평균에서계획(기준만들기([{ 값: s }]), s, s.달 ? 달더하기(s.달, 1) : ''), 기준: 실적ID };
}
/* 과거 추세 — 실적 달들의 마케팅비(가로) ↔ 매출(세로) 최소제곱 한 줄. 3달 미만이면 null.
   폭 = 그 마케팅비에서의 예측 흔들림(±1 표준오차). 계절 · 이벤트 · 가격이 섞인 추세라 참고용 */
export function 추세(실적들) {
  const 점 = 실적들.map(a => 셈(a.값)).filter(r => r.마케팅비 > 0 && r.매출 > 0).map(r => [r.마케팅비, r.매출]);
  const n = 점.length;
  if (n < 3) return null;
  const mx = 점.reduce((s, [x]) => s + x, 0) / n, my = 점.reduce((s, [, y]) => s + y, 0) / n;
  const sxx = 점.reduce((s, [x]) => s + (x - mx) ** 2, 0);
  if (!sxx) return null;
  const b = 점.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / sxx, a = my - b * mx;
  const se = Math.sqrt(점.reduce((s, [x, y]) => s + (y - (a + b * x)) ** 2, 0) / (n - 2));
  return { n, a, b, 값: x => a + b * x, 폭: x => se * Math.sqrt(1 + 1 / n + (x - mx) ** 2 / sxx), 필요: y => b > 0 ? (y - a) / b : NaN };
}
/* 판정 — 필요한 값이 과거 범위 안이면 '해봄', 밖이면 '어려움'(낮게 = 낮아야 하는 쪽, CPA), 필요가 없으면 '못', 과거가 없으면 '모름' */
export function 판정(줄, 범위) {
  if (!있나(줄.필요)) return '못';
  const r = 범위?.[줄.키];
  if (!r) return '모름';
  return (줄.낮게 ? 줄.필요 >= r[0] : 줄.필요 <= r[1]) ? '해봄' : '어려움';
}

/* 계획 이름 — 비어 있는 첫 글자 (A안을 지우면 다음 새 안은 다시 A안). 26개를 넘으면 숫자 */
export function 다음이름(계획들) {
  const 쓴 = new Set(계획들.map(a => a.이름));
  for (let i = 0; i < 26; i++) { const 이름 = String.fromCharCode(65 + i) + '안'; if (!쓴.has(이름)) return 이름; }
  return `안 ${계획들.length + 1}`;
}

/* 목표까지 메우려면(옛 안분표) — 목표까지 모자란 매출을 숫자 하나만 바꿔 메운다면. 셀팅 사진 안분표와 같은 식(test-calc).
   DB 비용이 여럿이면 합과 평균 CPA 로 본다. 인 DB 는 일비까지. 못 메우면 필요 = NaN (전환율 100% 넘김 · 전환율 0 등) */
export function 안분(a, r, 목표) {
  const 모자람 = 목표 - r.매출, t = a.전환;
  if (!(목표 > 0) || !(모자람 > 0) || !(t.단가 > 0)) return { 모자람, 더상담: 0, 줄: [] };
  const 더상담 = 모자람 / t.단가, 더DB = t.아웃률 > 0 ? 더상담 / t.아웃률 : NaN, 일비 = r.일비 || 1;
  const 전환필요 = r.아웃DB > 0 ? t.아웃률 + 더상담 / r.아웃DB : NaN;
  return {
    모자람, 더상담, 줄: [
      { 키: '게더링비', 이름: 'DB 비용 (합)', 지금: r.게더링비, 필요: r.게더링DB > 0 ? r.게더링비 + 더DB * r.CPA : NaN },
      { 키: 'CPA', 이름: '평균 CPA', 지금: r.CPA, 필요: r.게더링비 > 0 ? r.게더링비 / (r.게더링DB + 더DB) : NaN, 낮게: true },
      { 키: '아웃DB', 이름: '아웃 DB', 지금: r.아웃DB, 필요: r.아웃DB + 더DB },
      { 키: '아웃률', 이름: '아웃 내원 전환율', 지금: t.아웃률, 필요: 전환필요 <= 1 ? 전환필요 : NaN, 퍼: true },
      { 키: '인DB', 이름: '인 DB', 지금: a.인DB, 필요: t.인률 > 0 ? a.인DB + 더상담 / (t.인률 * 일비) : NaN },
      { 키: '단가', 이름: '상담단가', 지금: t.단가, 필요: r.상담 > 0 ? 목표 / r.상담 : NaN }
    ]
  };
}

/* 바로 앞 안 대비 — % (비율 줄은 %p). 못 내거나 0.05 보다 작으면 null (시트의 달성률 · 증감률 · 조정률) */
export function 증감(지금, 앞, 퍼센트p) {
  if (!있나(지금) || !있나(앞) || (!퍼센트p && !앞)) return null;
  const d = 퍼센트p ? (지금 - 앞) * 100 : (지금 / 앞 - 1) * 100;
  return Math.abs(d) < 0.05 ? null : d;
}
