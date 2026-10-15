/* 시뮬레이터 런처 — 아래 타일 줄에서 시뮬을 고르고 그 시뮬의 비밀번호로 들어간다(맥 로그인 창 꼴).
   둘 다 ERP Edge — 마케팅 MKT_login → mkt-token, 회원권 MEM_login → mem-token(각 화면이 그대로 쓴다). 비밀번호 · 토큰은 시뮬마다 따로.
   처음(비밀번호 미정)이면 여기서 두 번 받아 정한다(_비밀번호처음 — 서버의 처음허용이 켜져 있을 때만).
   맨 아래 가운데 [비밀번호 바꾸기] — 지금 비밀번호 대신 마스터 PIN(사용자 10/15 "나만 아는 것을 넣어야만"). 시뮬 화면에는 없다.
   스펙 docs/superpowers/specs/2026-10-14-simulator-launcher-design.md */
import { 시뮬, 보관, 부르기, 화살 } from './shared.js';
const $ = id => document.getElementById(id);
const 해시 = location.hash.slice(1), 지난 = 보관.읽기('sim-last');
let 고른 = 시뮬[해시] ? 해시 : 시뮬[지난] ? 지난 : 'marketing';
const 로그인됨 = { marketing: !!보관.읽기('mkt-token'), membership: !!보관.읽기('mem-token') };
const 처음 = { marketing: false, membership: false };   // 서버가 "처음"이라 하면 비밀번호를 두 번 받는다

function 그리기() {
  const s = 시뮬[고른], 됨 = 로그인됨[고른], 처 = 처음[고른] && !됨, 단추 = $('단추');
  document.querySelectorAll('[data-시뮬]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.시뮬 === 고른)));
  document.querySelectorAll('[data-그림]').forEach(g => { g.hidden = g.dataset.그림 !== 고른; });
  $('로그인됨').hidden = $('다른').hidden = !됨;
  $('칸1').hidden = $('도움').hidden = 됨; $('칸2').hidden = !처; $('안내').hidden = !처;
  $('안내').textContent = `처음이라 ${s.이름} 비밀번호를 정합니다 — 8자 이상`;
  $('비번').placeholder = 처 ? '새 비밀번호' : '비밀번호';
  $('비번').setAttribute('aria-label', `${s.이름} ${$('비번').placeholder}`);
  $('도움').textContent = 처 ? '두 칸이 같으면 정해지고 바로 들어갑니다' : '비밀번호는 시뮬레이터마다 따로입니다';
  /* 들어가기는 하나 — 마지막 칸 안 동그라미, 로그인돼 있으면 칸 없이 흰 알약 */
  if (됨) $('칸2').after(단추); else (처 ? $('칸2') : $('칸1')).append(단추);
  단추.classList.toggle('넓게', 됨);
  단추.innerHTML = (됨 ? s.이름 + ' 들어가기 ' : '') + 화살;
  단추.setAttribute('aria-label', s.이름 + ' 들어가기');
  $('오류').textContent = '';
  켜기();
}
/* 넣기 전엔 꺼진 단추(처음이면 두 칸 다) — 꺼진 단추면 Enter 도 안 보낸다 */
function 켜기() { $('단추').disabled = !로그인됨[고른] && !($('비번').value && (!처음[고른] || $('비번2').value)); }

const 닿지못함 = err => err instanceof TypeError ? '서버에 닿지 못했습니다 — 인터넷을 확인해 주세요.' : err.message;
/* 들어가기 — 토큰을 받으면 true. 처음이면 두 번째 칸을 열고 false */
async function 들어가기(s, 비번) {
  if (처음[고른]) {
    if (비번 !== $('비번2').value) throw new Error('두 칸이 다릅니다 — 같은 비밀번호를 두 번 넣어 주세요.');
    보관.쓰기(s.토큰, (await 부르기(s.앞 + '_비밀번호처음', 비번)).토큰);
    return true;
  }
  const r = await 부르기(s.앞 + '_login', 비번);
  if (r.처음) { 처음[고른] = true; 그리기(); $('비번2').focus(); return false; }
  보관.쓰기(s.토큰, r.토큰);
  return true;
}

document.querySelectorAll('[data-시뮬]').forEach(b => b.addEventListener('click', () => {
  if (고른 !== b.dataset.시뮬) $('비번').value = $('비번2').value = '';   // 한 시뮬 비밀번호를 다른 시뮬로 보내지 않게
  고른 = b.dataset.시뮬; 보관.쓰기('sim-last', 고른);
  그리기();
  if (!로그인됨[고른]) $('비번').focus();
}));
$('다른').addEventListener('click', () => { 로그인됨[고른] = false; 그리기(); $('비번').focus(); });
$('폼').addEventListener('input', () => { $('오류').textContent = ''; 켜기(); });
$('폼').addEventListener('submit', async e => {
  e.preventDefault();
  const s = 시뮬[고른];
  if (로그인됨[고른]) return location.assign(s.주소);
  $('단추').disabled = true; $('오류').textContent = '';
  try {
    if (!(await 들어가기(s, $('비번').value))) return;
    보관.쓰기('sim-last', 고른);
    location.assign(s.주소);
  } catch (err) {
    $('오류').textContent = 닿지못함(err);
    $('비번').select();
  } finally { 켜기(); }
});

/* ── 비밀번호 바꾸기 — 마스터 PIN 으로. PIN 이 아직 없으면(서버 {처음}) 두 번 받아 정하고 이어서 바꾼다 ── */
const 바꾸기기본 = '바꾸면 이 시뮬레이터에 로그인해 있던 사람은 모두 다시 로그인합니다.';
let 바꿀 = 고른, PIN처음 = false;
function 바꾸기그리기() {
  document.querySelectorAll('[data-바꿀]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.바꿀 === 바꿀)));
  $('핀2칸').hidden = $('핀안내').hidden = !PIN처음;
}
$('비번바꾸기').addEventListener('click', () => {
  바꿀 = 고른; PIN처음 = false; $('바꾸기폼').reset();   // PIN 이 아직 없는지는 서버가 다시 알려 준다 $('바꾸기오류').textContent = ''; $('바꾸기글').textContent = 바꾸기기본;
  바꾸기그리기(); $('바꾸기창').showModal(); $('핀').focus();
});
document.querySelectorAll('[data-바꿀]').forEach(b => b.addEventListener('click', () => { 바꿀 = b.dataset.바꿀; 바꾸기그리기(); }));
$('바꾸기닫기').addEventListener('click', () => $('바꾸기창').close());
$('바꾸기폼').addEventListener('input', () => { $('바꾸기오류').textContent = ''; });
$('바꾸기폼').addEventListener('submit', async e => {
  e.preventDefault();
  const s = 시뮬[바꿀], pin = $('핀').value, 새것 = $('새비번').value;
  $('바꾸기오류').textContent = ''; $('바꾸기단추').disabled = true;
  try {
    if (새것 !== $('새비번2').value) throw new Error('새 비밀번호 두 칸이 다릅니다.');
    if (PIN처음) {
      if (pin !== $('핀2').value) throw new Error('마스터 PIN 두 칸이 다릅니다.');
      await 부르기(s.앞 + '_마스터PIN처음', pin);
      PIN처음 = false;
    }
    const r = await 부르기(s.앞 + '_비밀번호바꾸기', pin, 새것);
    if (r.처음) { PIN처음 = true; 바꾸기그리기(); $('핀2').focus(); return; }
    /* 바꾼 사람은 새 토큰으로 그 시뮬에 로그인돼 있다 — 옛 토큰은 서버에서 끊겼다 */
    보관.쓰기(s.토큰, r.토큰); 로그인됨[바꿀] = true;
    $('바꾸기폼').reset(); 바꾸기그리기(); 그리기();
    $('바꾸기글').textContent = `${s.이름} 비밀번호를 바꿨습니다. 로그인해 있던 사람은 모두 다시 로그인합니다.`;
  } catch (err) { $('바꾸기오류').textContent = 닿지못함(err); }
  finally { $('바꾸기단추').disabled = false; }
});

그리기();
