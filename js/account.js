// assets/js/account.js

// ===== 공통 상수/유틸 =====
const STORAGE_KEY = 'ssafit:user';       // 단일 사용자 저장
const SESSION_KEY = 'ssafit:session';    // 로그인 세션(이메일)
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function readUser() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}
function writeUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}
function removeUser() {
  localStorage.removeItem(STORAGE_KEY);
}
function nowISO() {
  return new Date().toISOString();
}

// 파일을 DataURL로 읽기 (아바타 저장용)
function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

// ===== DOM 참조 =====
const avatarInput   = $('#avatarInput');
const avatarPreview = $('#avatarPreview');
const nicknameEl    = $('#nickname');
const emailEl       = $('#email');
const pwdEl         = $('#pwd');
const pwd2El        = $('#pwd2');
const goalEl        = $('#goal');
const noticeEl      = $('#notice');
const agree         = $('#agree');
const delBtn        = $('#confirmDelete');
const deactivateBtn = $('#btnDeactivate');
const saveBtns      = $$('.btn-save');

const pwdBar        = $('#pwdBar');

// ===== 초기 데이터 주입 =====
function populateForm() {
  const u = readUser();
  if (!u) return; // 신규 사용자

  if (u.avatarDataURL) avatarPreview.src = u.avatarDataURL;
  if (u.nickname)      nicknameEl.value = u.nickname;
  if (u.email)         emailEl.value = u.email;
  if (u.goal)          goalEl.value = u.goal;
  if (typeof u.notice === 'boolean') noticeEl.checked = u.notice;

  // 비활성화 상태면 화면 경고
  if (u.isActive === false) {
    document.body.classList.add('opacity-75');
    console.warn('비활성화 상태의 계정입니다.');
  }
}

// ===== 비밀번호 강도 표시 =====
function strength(p) {
  let s = 0;
  if (p.length >= 8) s += 30;
  if (/[A-Z]/.test(p)) s += 20;
  if (/[a-z]/.test(p)) s += 20;
  if (/[0-9]/.test(p)) s += 15;
  if (/[^A-Za-z0-9]/.test(p)) s += 15;
  return Math.min(s, 100);
}
pwdEl?.addEventListener('input', () => {
  const v = strength(pwdEl.value);
  pwdBar.style.width = v + '%';
  pwdBar.className = 'progress-bar' + (v < 40 ? ' bg-danger' : v < 70 ? ' bg-warning' : ' bg-success');
});

// ===== 아바타 미리보기 + DataURL 저장 대비 =====
avatarInput?.addEventListener('change', async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  avatarPreview.src = url; // 미리보기
});

// ===== 삭제 동의 체크 =====
agree?.addEventListener('change', () => delBtn.disabled = !agree.checked);

// ===== 저장(등록/수정) 처리 =====
async function handleSave() {
  // 검증
  const email = emailEl.value.trim();
  const nickname = nicknameEl.value.trim();
  const pwd = pwdEl.value;
  const pwd2 = pwd2El.value;

  if (!nickname) return alert('닉네임을 입력하세요.');
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return alert('유효한 이메일을 입력하세요.');
  if (pwd || pwd2) {
    if (pwd.length < 8) return alert('비밀번호는 8자 이상이어야 합니다.');
    if (pwd !== pwd2)  return alert('비밀번호 확인이 일치하지 않습니다.');
  }

  // 기존/신규 사용자 머지
  const prev = readUser();
  const user = {
    id: prev?.id ?? crypto.randomUUID(),
    email,
    nickname,
    // 비번은 입력했을 때만 갱신 (미입력 시 기존 유지)
    password: pwd ? pwd : (prev?.password ?? ''),
    goal: goalEl.value,
    notice: !!noticeEl.checked,
    isActive: prev?.isActive ?? true,
    avatarDataURL: prev?.avatarDataURL ?? null,
    createdAt: prev?.createdAt ?? nowISO(),
    updatedAt: nowISO(),
  };

  // 아바타 파일이 있다면 DataURL로 저장
  const f = avatarInput?.files?.[0];
  if (f) {
    try {
      user.avatarDataURL = await fileToDataURL(f);
    } catch (e) {
      console.error(e);
      alert('아바타 저장 중 오류가 발생했습니다.');
    }
  }

  writeUser(user);
  // 세션도 갱신(로그인 간주)
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, at: nowISO() }));
  alert('계정 정보가 저장되었습니다.');
}

// 저장 버튼 모두에 바인딩
saveBtns.forEach(btn => btn.addEventListener('click', handleSave));

// ===== 비활성화 처리 =====
deactivateBtn?.addEventListener('click', () => {
  const u = readUser();
  if (!u) return alert('저장된 계정이 없습니다.');
  if (u.isActive === false) {
    if (!confirm('계정을 다시 활성화하시겠습니까?')) return;
    u.isActive = true;
  } else {
    if (!confirm('계정을 비활성화하시겠습니까?')) return;
    u.isActive = false;
  }
  u.updatedAt = nowISO();
  writeUser(u);
  alert(u.isActive ? '계정이 활성화되었습니다.' : '계정이 비활성화되었습니다.');
  location.reload();
});

// ===== 영구 삭제 =====
delBtn?.addEventListener('click', () => {
  removeUser();
  localStorage.removeItem(SESSION_KEY);
  alert('계정이 영구 삭제되었습니다.');
  // 필요 시 메인으로 이동
  // location.href = './index.html';
});

// ===== 최초 로딩 =====
document.addEventListener('DOMContentLoaded', populateForm);
