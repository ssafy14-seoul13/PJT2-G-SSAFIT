// assets/js/account.js

// 아바타 미리보기
const avatarInput = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');
avatarInput?.addEventListener('change', (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  avatarPreview.src = url;
});

// 삭제 동의 체크
const agree = document.getElementById('agree');
const delBtn = document.getElementById('confirmDelete');
agree?.addEventListener('change', () => delBtn.disabled = !agree.checked);

// 비밀번호 강도 (단순 버전)
const pwd = document.getElementById('pwd');
const pwdBar = document.getElementById('pwdBar');
function strength(p) {
  let s = 0;
  if (p.length >= 8) s += 30;
  if (/[A-Z]/.test(p)) s += 20;
  if (/[a-z]/.test(p)) s += 20;
  if (/[0-9]/.test(p)) s += 15;
  if (/[^A-Za-z0-9]/.test(p)) s += 15;
  return Math.min(s, 100);
}
pwd?.addEventListener('input', () => {
  const v = strength(pwd.value);
  pwdBar.style.width = v + '%';
  pwdBar.className = 'progress-bar' + (v < 40 ? ' bg-danger' : v < 70 ? ' bg-warning' : ' bg-success');
});
