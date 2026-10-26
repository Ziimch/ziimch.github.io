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
window.addEventListener('offline', () => showToast('⚠️ Kamu lagi offline. Perubahan nggak akan tersimpan ke Cloud.'));
window.addEventListener('online', () => showToast('✓ Koneksi kembali online.'));

/* ---------- Tema (tersimpan) ---------- */
try {
    const t = localStorage.getItem('azim_theme');
    if (t === 'light') document.documentElement.classList.remove('dark');
    else if (t === 'dark') document.documentElement.classList.add('dark');
} catch (e) {}
document.getElementById('themeToggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    try { localStorage.setItem('azim_theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light'); } catch (e) {}
});

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
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(email).then(() => showToast('✓ Email disalin!')).catch(() => fallbackCopy(email));
    else fallbackCopy(email);
}
function fallbackCopy(text) {
    const d = document.createElement('textarea');
    d.value = text; d.style.position = 'fixed'; d.style.opacity = '0';
    document.body.appendChild(d); d.focus(); d.select();
    try { document.execCommand('copy'); showToast('✓ Email disalin!'); } catch (e) { showToast('Gagal menyalin email'); }
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
    if (honey && honey.value.trim() !== '') { showToast('✗ Pesan tidak dapat dikirim.'); return; }
    const now = Date.now();
    if (now - lastContactSubmit < 20000) { showToast('Sabar dulu ya, tunggu sebentar sebelum kirim lagi.'); return; }

    const name = document.getElementById('fName').value.trim(), email = document.getElementById('fEmail').value.trim(), msg = document.getElementById('fMessage').value.trim();
    const v1 = validateField('fName', name.length >= 2 && name.length <= 100, 'Nama minimal 2 karakter.');
    const v2 = validateField('fEmail', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Masukkan email yang valid.');
    const v3 = validateField('fMessage', msg.length >= 10 && msg.length <= 2000, 'Pesan minimal 10 karakter.');
    if (!v1 || !v2 || !v3) return;

    const btn = document.getElementById('submitBtn');
    btn.innerText = 'Mengirim...'; btn.disabled = true;
    const fd = new FormData(form);
    fd.delete('_honey'); fd.append('_subject', `Pesan Baru dari Portofolio — ${name}`); fd.append('_captcha', 'false'); fd.append('_template', 'table');
    try {
        const res = await fetch(`https://formsubmit.co/ajax/${FORM_ENDPOINT_ID}`, { method: 'POST', headers: { Accept: 'application/json' }, body: fd });
        const json = await res.json().catch(() => ({}));
        // formsubmit membalas HTTP 200 walau email belum diaktifkan, jadi cek isi balasannya juga
        if (!res.ok || String(json.success) === 'false') throw new Error(json.message || 'Gagal mengirim pesan');
        lastContactSubmit = now;
        document.getElementById('formSuccess').classList.remove('hidden'); form.reset();
    } catch (err) {
        console.error('Gagal mengirim form:', err);
        showToast('✗ Pesan belum terkirim. Coba lagi sebentar ya.');
    }
    btn.innerText = 'Kirim Pesan'; btn.disabled = false;
}

/* ---------- Bagikan ---------- */
function sharePortfolio() {
    const url = location.origin + location.pathname;
    if (navigator.share) navigator.share({ title: document.title, text: 'Lihat portofolio ini:', url }).catch(() => {});
    else if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(() => showToast('✓ Tautan portofolio disalin!'));
    else showToast('Salin manual: ' + url);
}

/* ---------- Command Palette (Ctrl+K / Cmd+K, atau tombol "k") ---------- */
const CMD_LIST = [
    { label: '🏠 Ke Beranda', hint: 'Home', action: () => go('#hero') },
    { label: '👤 Tentang Aku', hint: 'Section', action: () => go('#tentang') },
    { label: '🛠 Skill', hint: 'Section', action: () => go('#keahlian') },
    { label: '💼 Perjalanan Belajar', hint: 'Section', action: () => go('#pengalaman') },
    { label: '🚀 Semua Project', hint: 'Halaman', action: () => go('#/proyek') },
    { label: '📦 Repositori GitHub', hint: 'Halaman', action: () => go('#/github') },
    { label: '📝 Catatan Belajar', hint: 'Section', action: () => go('#artikel') },
    { label: '💬 Testimoni', hint: 'Section', action: () => go('#testimoni') },
    { label: '✉️ Kontak', hint: 'Section', action: () => go('#kontak') },
    { label: '📇 Unduh Kartu Kontak (vCard)', hint: 'Aksi', action: () => { closeCmdPalette(); downloadVCard(); } },
    { label: '🖨️ Cetak / Simpan PDF', hint: 'Aksi', action: () => { closeCmdPalette(); window.print(); } },
    { label: '🔗 Bagikan Portofolio', hint: 'Aksi', action: () => { closeCmdPalette(); sharePortfolio(); } },
    { label: '📋 Salin Email', hint: 'Aksi', action: () => { closeCmdPalette(); salinEmailAzim(); } },
    { label: '🌗 Ganti Tema', hint: 'Aksi', action: () => { closeCmdPalette(); document.getElementById('themeToggle').click(); } }
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
            <span>${escapeHtml(c.label)}</span><span class="cmd-hint text-[10px] font-mono text-zinc-400">${escapeHtml(c.hint)}</span>
        </button>`).join('') : '<p class="px-4 py-6 text-center text-xs font-mono text-zinc-400">Nggak ada hasil.</p>';
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

/* ---------- Easter egg 🥚 ---------- */
(function () {
    const style1 = 'font-size:18px;font-weight:bold;color:#0ea5e9;', style2 = 'font-size:12px;color:#71717a;';
    console.log('%c👋 Halo, sesama anak IT!', style1);
    console.log('%cLagi ngintip kode ya? Ketik "azim" di halaman ini buat kejutan kecil 😉', style2);

    let buffer = '';
    document.addEventListener('keydown', e => {
        if (!e.key || e.key.length !== 1 || isBusyTarget(e)) return;
        buffer = (buffer + e.key.toLowerCase()).slice(-4);
        if (buffer === 'azim') { buffer = ''; fireConfetti(); showToast('✨ Easter egg ketemu!'); }
    });

    const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let pos = 0;
    document.addEventListener('keydown', e => {
        if (!e.key || isBusyTarget(e)) return;
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        pos = key === seq[pos] ? pos + 1 : (key === seq[0] ? 1 : 0);
        if (pos === seq.length) { pos = 0; fireConfetti(2200); showToast('🎮 Konami Code! Niat banget ya kamu.'); }
    });

    // Ketuk foto profil 5x
    let taps = 0, timer = null;
    const avatar = document.getElementById('heroAvatar');
    if (avatar) {
        avatar.style.cursor = 'pointer';
        avatar.addEventListener('click', () => {
            taps++; clearTimeout(timer); timer = setTimeout(() => { taps = 0; }, 1500);
            avatar.style.transition = 'transform 0.4s ease'; avatar.style.transform = `rotate(${taps * 72}deg)`;
            if (taps >= 5) {
                taps = 0; avatar.style.transform = 'rotate(360deg) scale(1.1)';
                setTimeout(() => { avatar.style.transform = ''; }, 400);
                showToast('🐱 Meong! (iya, itu foto kucing)'); fireConfetti(1200);
            }
        });
    }
})();

function fireConfetti(duration) {
    duration = duration || 1500;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = document.getElementById('confettiCanvas');
    canvas.classList.remove('hidden'); canvas.width = innerWidth; canvas.height = innerHeight;
    const ctx = canvas.getContext('2d'), colors = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];
    const pieces = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width, y: -20 - Math.random() * canvas.height * 0.5, r: 4 + Math.random() * 5,
        c: colors[Math.floor(Math.random() * colors.length)], vy: 2 + Math.random() * 3, vx: -2 + Math.random() * 4,
        rot: Math.random() * 360, vr: -6 + Math.random() * 12
    }));
    const start = performance.now();
    (function frame(now) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            p.x += p.vx; p.y += p.vy; p.rot += p.vr;
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
            ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6); ctx.restore();
        });
        if (now - start < duration) requestAnimationFrame(frame);
        else { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.classList.add('hidden'); }
    })(start);
}

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
