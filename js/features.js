/* ===== js/features.js =====
   Fitur interaktif: toast, tema, menu mobile, salin email, form kontak,
   command palette (Ctrl+K), bagikan, easter egg, efek scroll. */

/* ---------- Toast (timer tidak saling tabrak) ---------- */
let _toastTimer;
function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastText').innerText = msg;
    toast.classList.remove('translate-y-20', 'opacity-0'); toast.classList.add('translate-y-0', 'opacity-100');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => { toast.classList.remove('translate-y-0', 'opacity-100'); toast.classList.add('translate-y-20', 'opacity-0'); }, 2500);
}
window.addEventListener('offline', () => showToast('Perangkat sedang offline. Perubahan tidak akan tersimpan.'));
window.addEventListener('online', () => showToast('Koneksi kembali tersambung.'));

/* ---------- Tema (tersimpan) + animasi gelombang warna ---------- */
const THEME_BG = { light: '#FFFCF8', dark: '#0D0910' };
function applyTheme(mode) {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    const m = document.getElementById('metaTheme'); if (m) m.content = mode === 'dark' ? '#17111C' : '#FDE2E4';
    try { localStorage.setItem('azim_theme', mode); } catch (e) {}
}
(function initTheme() {
    let t = null; try { t = localStorage.getItem('azim_theme'); } catch (e) {}
    if (!t && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) t = 'dark';
    applyTheme(t === 'dark' ? 'dark' : 'light');
})();

let themeBusy = false;
function toggleThemeAnimated() {
    if (themeBusy) return;
    const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !document.documentElement.animate) { applyTheme(next); return; }

    themeBusy = true;
    const btn = document.getElementById('themeToggle'), r0 = btn.getBoundingClientRect();
    const x = r0.left + r0.width / 2, y = r0.top + r0.height / 2;
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 8;
    const colors = ['#FDE2E4', '#FAD2E1', '#BEE1E6', '#C1F4C5', '#FFFFD1', THEME_BG[next]];
    const wave = document.createElement('div'); wave.id = 'themeWave';
    const rings = colors.map(c => {
        const el = document.createElement('div'); el.className = 'ring';
        el.style.cssText = `background:${c};width:${R * 2}px;height:${R * 2}px;left:${x - R}px;top:${y - R}px;`;
        wave.appendChild(el); return el;
    });
    document.body.appendChild(wave);

    const ease = 'cubic-bezier(.7,0,.25,1)', IN = 620, OUT = 560, GAP = 75;
    const grow = rings.map((el, i) => el.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: IN, delay: i * GAP, easing: ease, fill: 'forwards' }));
    const peak = IN + (rings.length - 1) * GAP;
    grow[grow.length - 1].finished.then(() => {
        document.documentElement.classList.add('theme-switching');
        applyTheme(next);
        btn.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 700, easing: 'cubic-bezier(.34,1.56,.64,1)' });
        requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('theme-switching')));
        const shrink = rings.slice().reverse().map((el, i) => el.animate([{ transform: 'scale(1)' }, { transform: 'scale(0)' }], { duration: OUT, delay: 120 + i * GAP, easing: ease, fill: 'forwards' }));
        shrink[shrink.length - 1].finished.then(() => { wave.remove(); themeBusy = false; });
    });
}
document.getElementById('themeToggle').addEventListener('click', toggleThemeAnimated);

/* ---------- Menu mobile ---------- */
const mobileMenuBtn = document.getElementById('mobileMenuBtn'), mobileMenu = document.getElementById('mobileMenu');
mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', () => mobileMenu.classList.add('hidden')));
document.addEventListener('click', e => {
    if (!mobileMenu.classList.contains('hidden') && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) mobileMenu.classList.add('hidden');
});

/* ---------- Salin email ---------- */
function salinEmailAzim() {
    const email = getSiteContent().profil.email;
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(email).then(() => showToast('Email disalin')).catch(() => fallbackCopy(email));
    else fallbackCopy(email);
}
function fallbackCopy(text) {
    const d = document.createElement('textarea');
    d.value = text; d.style.position = 'fixed'; d.style.opacity = '0';
    document.body.appendChild(d); d.focus(); d.select();
    try { document.execCommand('copy'); showToast('Email disalin'); } catch (e) { showToast('Email gagal disalin'); }
    document.body.removeChild(d);
}

/* ---------- Form kontak ---------- */
let lastContactSubmit = 0;
function validateField(id, ok, message) {
    const input = document.getElementById(id), err = input.parentElement.querySelector('.field-error');
    if (!ok) { err.innerText = message; err.classList.remove('hidden'); input.classList.add('border-rose-500'); return false; }
    err.classList.add('hidden'); input.classList.remove('border-rose-500'); return true;
}
['fName', 'fEmail', 'fMessage'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => validateField(id, true, ''));
});

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const honey = form.querySelector('[name="_honey"]');
    if (honey && honey.value.trim() !== '') { showToast('Pesan tidak dapat dikirim.'); return; }
    const now = Date.now();
    if (now - lastContactSubmit < 20000) { showToast('Mohon tunggu sebentar sebelum mengirim pesan lagi.'); return; }

    const name = document.getElementById('fName').value.trim(), email = document.getElementById('fEmail').value.trim(), msg = document.getElementById('fMessage').value.trim();
    const v1 = validateField('fName', name.length >= 2 && name.length <= 100, 'Nama minimal 2 karakter.');
    const v2 = validateField('fEmail', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Masukkan email yang valid.');
    const v3 = validateField('fMessage', msg.length >= 10 && msg.length <= 2000, 'Pesan minimal 10 karakter.');
    if (!v1 || !v2 || !v3) return;

    const btn = document.getElementById('submitBtn');
    btn.innerText = 'Mengirim...'; btn.disabled = true;
    const fd = new FormData(form);
    fd.delete('_honey'); fd.append('_subject', `Pesan baru dari portofolio: ${name}`); fd.append('_captcha', 'false'); fd.append('_template', 'table');
    try {
        const res = await fetch(`https://formsubmit.co/ajax/${FORM_ENDPOINT_ID}`, { method: 'POST', headers: { Accept: 'application/json' }, body: fd });
        const json = await res.json().catch(() => ({}));
        // formsubmit membalas HTTP 200 walau email belum diaktifkan, jadi cek isi balasannya juga
        if (!res.ok || String(json.success) === 'false') throw new Error(json.message || 'Gagal mengirim pesan');
        lastContactSubmit = now;
        document.getElementById('formSuccess').classList.remove('hidden'); form.reset();
    } catch (err) {
        console.error('Gagal mengirim form:', err);
        showToast('Pesan belum terkirim. Silakan coba lagi.');
    }
    btn.innerText = 'Kirim pesan'; btn.disabled = false;
}

/* ---------- Bagikan ---------- */
function sharePortfolio() {
    const url = location.origin + location.pathname;
    if (navigator.share) navigator.share({ title: document.title, text: 'Portofolio Azim, siswa TKJ SMKN 1 Sidayu:', url }).catch(() => {});
    else if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(() => showToast('Tautan portofolio disalin'));
    else showToast('Salin manual: ' + url);
}

/* ---------- Command Palette (Ctrl+K / Cmd+K, atau tombol "k") ---------- */
const CMD_LIST = [
    { label: 'Beranda', hint: 'Beranda', action: () => go('#hero') },
    { label: 'Tentang saya', hint: 'Bagian', action: () => go('#tentang') },
    { label: 'Keahlian', hint: 'Bagian', action: () => go('#keahlian') },
    { label: 'Pendidikan dan pengalaman', hint: 'Bagian', action: () => go('#pengalaman') },
    { label: 'Semua proyek', hint: 'Halaman', action: () => go('#/proyek') },
    { label: 'Repositori GitHub', hint: 'Halaman', action: () => go('#/github') },
    { label: 'Catatan belajar', hint: 'Bagian', action: () => go('#artikel') },
    { label: 'Testimoni', hint: 'Bagian', action: () => go('#testimoni') },
    { label: 'Kontak', hint: 'Bagian', action: () => go('#kontak') },
    { label: 'Unduh kartu kontak (vCard)', hint: 'Aksi', action: () => { closeCmdPalette(); downloadVCard(); } },
    { label: 'Cetak / simpan PDF', hint: 'Aksi', action: () => { closeCmdPalette(); window.print(); } },
    { label: 'Bagikan portofolio', hint: 'Aksi', action: () => { closeCmdPalette(); sharePortfolio(); } },
    { label: 'Salin email', hint: 'Aksi', action: () => { closeCmdPalette(); salinEmailAzim(); } },
    { label: 'Ganti tema', hint: 'Aksi', action: () => { closeCmdPalette(); document.getElementById('themeToggle').click(); } }
];
let cmdActiveIndex = 0, cmdFiltered = CMD_LIST;

function go(hash) { location.hash = hash; closeCmdPalette(); }
function openCmdPalette() {
    document.getElementById('cmdPaletteOverlay').classList.add('open');
    const input = document.getElementById('cmdPaletteInput');
    input.value = ''; renderCmdResults(''); setTimeout(() => input.focus(), 10);
}
function closeCmdPalette() { document.getElementById('cmdPaletteOverlay').classList.remove('open'); }
function runCmd(i) { if (cmdFiltered[i]) cmdFiltered[i].action(); }

function renderCmdResults(query) {
    const q = query.trim().toLowerCase();
    cmdFiltered = CMD_LIST.filter(c => c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q));
    cmdActiveIndex = 0;
    const box = document.getElementById('cmdPaletteResults');
    box.innerHTML = cmdFiltered.length ? cmdFiltered.map((c, i) => `
        <button type="button" onclick="runCmd(${i})" class="cmd-item ${i === 0 ? 'active' : ''} w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <span>${escapeHtml(c.label)}</span><span class="cmd-hint text-xs text-zinc-400">${escapeHtml(c.hint)}</span>
        </button>`).join('') : '<p class="px-4 py-6 text-center text-sm text-zinc-500">Tidak ada hasil.</p>';
}
function updateCmdActive() {
    document.querySelectorAll('.cmd-item').forEach((el, i) => { el.classList.toggle('active', i === cmdActiveIndex); if (i === cmdActiveIndex) el.scrollIntoView({ block: 'nearest' }); });
}
const cmdInput = document.getElementById('cmdPaletteInput');
cmdInput.addEventListener('input', e => renderCmdResults(e.target.value));
cmdInput.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); cmdActiveIndex = Math.min(cmdActiveIndex + 1, cmdFiltered.length - 1); updateCmdActive(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); cmdActiveIndex = Math.max(cmdActiveIndex - 1, 0); updateCmdActive(); }
    else if (e.key === 'Enter') { e.preventDefault(); runCmd(cmdActiveIndex); }
    else if (e.key === 'Escape') closeCmdPalette();
});

/* Pintasan keyboard. Huruf polos ("k" atau "/") diabaikan saat mengetik,
   di dropdown, atau saat panel admin / login terbuka. */
function isBusyTarget(e) {
    const t = e.target;
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable ||
        !document.getElementById('adminDashboard').classList.contains('hidden') ||
        !document.getElementById('adminLoginModal').classList.contains('hidden');
}
document.addEventListener('keydown', e => {
    if (!e.key) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'k') { e.preventDefault(); openCmdPalette(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || isBusyTarget(e)) return;
    if (k === 'k') { e.preventDefault(); openCmdPalette(); }
    else if (e.key === '/') {
        const s = ['projectSearch', 'ghSearch'].map(id => document.getElementById(id)).find(el => el && el.offsetParent !== null);
        if (s) { e.preventDefault(); s.focus(); }
    }
    else if (e.key === 'Escape' && document.getElementById('cmdPaletteOverlay').classList.contains('open')) closeCmdPalette();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCmdPalette(); });

/* ---------- Efek scroll: progress bar, tombol ke atas, nav aktif, reveal ---------- */
function initScrollFeatures() {
    const bar = document.getElementById('scrollProgress'), top = document.getElementById('backToTop');
    const links = document.querySelectorAll('.nav-link');
    const sections = Array.from(document.querySelectorAll('#mainHome section[id]'));

    function onScroll() {
        const y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
        bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
        top.classList.toggle('hidden', y < 400); top.classList.toggle('flex', y >= 400);
        if (document.getElementById('mainHome').classList.contains('hidden')) return;
        let current = null;
        for (const s of sections) { const r = s.getBoundingClientRect(); if (r.top <= 120 && r.bottom > 120) { current = s.id; break; } }
        links.forEach(l => l.classList.toggle('active', l.dataset.section === current));
    }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); } }), { threshold: 0.12 });
        reveals.forEach(el => io.observe(el));
    } else reveals.forEach(el => el.classList.add('in-view'));
}
