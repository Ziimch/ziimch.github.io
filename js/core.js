/* ===== js/core.js =====
   Inti situs: utilitas keamanan, Firebase, render halaman publik, router, GitHub.
   Bergantung pada js/config.js (firebaseConfig, DATA_PORTOFOLIO, dll). */

/* ---------- State ---------- */
let db = null;
let cloudArticles = [], cloudProjects = [], cloudSiteContent = null;
let articlesLoaded = false, projectsLoaded = false;
let activeTagFilter = 'Semua', activeSearch = '';
let ghReposCache = null, activeGhLanguage = 'Semua', activeGhSearch = '', activeGhSort = 'updated';
let heroTypewriterTimer = null, _twKey = '';

/* ---------- Keamanan: escape & validasi tautan ---------- */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function safeUrl(url) {
    if (!url) return '#';
    const t = String(url).trim();
    return (/^https?:\/\//i.test(t) || /^mailto:/i.test(t) || t.startsWith('#') || t.startsWith('/')) ? t : '#';
}
function slugify(text, i) {
    const b = String(text || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return b || 'proyek-' + i;
}

/* ---------- Bantuan Firestore ---------- */
function withTimeout(promise, ms, msg) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(msg || 'Waktu tunggu habis (koneksi lambat/terputus).')), ms);
        promise.then(v => { clearTimeout(timer); resolve(v); }, e => { clearTimeout(timer); reject(e); });
    });
}
function firestoreErrorMessage(err) {
    if (!err) return 'Terjadi kesalahan tidak diketahui.';
    if (!navigator.onLine) return 'Kamu lagi offline. Cek koneksi internet lalu coba lagi.';
    const code = err.code || '';
    if (code === 'permission-denied') return 'Ditolak oleh Firestore Rules. Pastikan email admin di rules sudah benar & kamu sudah login.';
    if (code === 'unavailable') return 'Server Firestore tidak bisa dijangkau. Coba lagi sebentar.';
    return err.message || ('Gagal: ' + code);
}
function setCloudStatus(msg, show) {
    const el = document.getElementById('firebaseStatusProj'); if (!el) return;
    el.innerText = msg; el.classList.toggle('hidden', !show);
}

/* ---------- Init Firebase ---------- */
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    // Long-polling: beberapa jaringan seluler/proxy memblokir streaming Firestore secara diam-diam
    try { db.settings({ experimentalAutoDetectLongPolling: true, merge: true }); } catch (e) { console.warn(e); }
    try { db.enablePersistence({ synchronizeTabs: true }).catch(err => console.warn('Cache offline tidak aktif:', err.code)); } catch (e) {}
    initCloudListeners();
} catch (e) { console.warn('Sistem Cloud offline.', e); }

/* ---------- Konten situs (cloud menimpa default config.js) ---------- */
function getSiteContent() {
    const d = DATA_PORTOFOLIO, c = cloudSiteContent || {};
    const pick = k => (c[k] && c[k].length) ? c[k] : d[k];
    return {
        profil: { ...d.profil, ...(c.profil || {}) },
        statistik: pick('statistik'), prinsip: pick('prinsip'), keahlian: pick('keahlian'),
        pengalaman: pick('pengalaman'), testimoni: pick('testimoni'), sosial: pick('sosial')
    };
}

function initCloudListeners() {
    if (!db) { setCloudStatus('Firebase gagal diinisialisasi. Muat ulang halaman.', true); return; }
    setCloudStatus('Menghubungkan ke Cloud...', true);
    watchVisitorCounter(); bumpVisitorCounter();

    db.collection('site_content').doc('main').onSnapshot(snap => {
        cloudSiteContent = snap.exists ? snap.data() : null;
        renderSiteContent();
        if (!profilDraftsInitialized) { initAllDrafts(); profilDraftsInitialized = true; }
    }, err => console.error('Gagal memuat konten situs:', err));

    const listen = (col, assign, countId) => db.collection(col).orderBy('createdAt', 'desc').onSnapshot(snap => {
        assign(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        const el = document.getElementById(countId); if (el) el.innerText = snap.size;
        setCloudStatus('', false); syncAllViews();
    }, err => {
        console.error('Gagal memuat ' + col + ':', err);
        setCloudStatus('Gagal terhubung ke Cloud (' + (err.code || 'error') + '), mencoba lagi...', true);
    });
    listen('artikel', list => { cloudArticles = list; articlesLoaded = true; }, 'dashCountArt');
    listen('proyek', list => { cloudProjects = list; projectsLoaded = true; }, 'dashCountProj');
}

function getMergedProjects() {
    const defaults = DATA_PORTOFOLIO.proyekDefault.map((p, i) => ({ ...p, id: 'default-' + i, _slug: slugify(p.judul, i) }));
    return [...cloudProjects.map(p => ({ ...p, _slug: p.id })), ...defaults];
}

/* ---------- Render bagian publik yang bisa diedit admin ---------- */
function renderSiteContent() {
    const sc = getSiteContent(), P = sc.profil;
    const $ = id => document.getElementById(id);
    $('pageTitle').innerText = `${P.nama} — ${P.peran}`;
    $('heroName').innerText = P.nama; $('heroBio').innerText = P.ringkasan;
    $('aboutDetail').innerText = P.tentangDetail; $('heroBadgeText').innerText = P.statusBadge;
    $('mainEmailVal').innerText = P.email; $('heroEmailLabel').innerText = P.email;
    $('footerCopyright').innerText = P.copyright; $('navName').innerText = P.nama;

    $('socialLinksContainer').innerHTML = sc.sosial.map((s, i) => `
        <div class="flex items-center gap-2">
            <a href="${escapeHtml(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer" class="hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline">${escapeHtml(s.nama)}</a>
            ${i < sc.sosial.length - 1 ? '<span class="text-zinc-300 dark:text-zinc-700 mx-1">•</span>' : ''}
        </div>`).join('');

    $('testimonialsContainer').innerHTML = sc.testimoni.map(t => `
        <div class="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 space-y-3">
            <p class="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">"${escapeHtml(t.pesan)}"</p>
            <div class="text-xs font-mono"><div class="font-semibold text-zinc-900 dark:text-zinc-100">${escapeHtml(t.nama)}</div><div class="text-zinc-400">${escapeHtml(t.peran)}</div></div>
        </div>`).join('');

    $('statsContainer').innerHTML = sc.statistik.map(s => `
        <div class="space-y-0.5">
            <div class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 stat-value" data-full="${escapeHtml(s.nilai)}">0</div>
            <div class="text-[11px] sm:text-xs font-mono text-zinc-500 dark:text-zinc-400">${escapeHtml(s.label)}</div>
        </div>`).join('');
    initStatsCountUp();

    $('principlesContainer').innerHTML = sc.prinsip.map(p => `
        <div class="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 space-y-1.5">
            <h3 class="font-semibold text-zinc-900 dark:text-zinc-100">${escapeHtml(p.judul)}</h3>
            <p class="text-zinc-500 dark:text-zinc-400 leading-relaxed">${escapeHtml(p.deskripsi)}</p>
        </div>`).join('');

    $('skillsContainer').innerHTML = sc.keahlian.map(k => `
        <div class="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 space-y-3 hover:border-sky-500/40">
            <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full ${escapeHtml(k.warnaDot || 'bg-cyan-500')}"></span><span class="font-semibold text-zinc-900 dark:text-zinc-100">${escapeHtml(k.kategori)}</span></div>
            <div class="flex flex-wrap gap-1.5">${(k.item || []).map(i => `<span class="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-mono">${escapeHtml(i)}</span>`).join('')}</div>
        </div>`).join('');

    const DOTS = ['bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500'];
    $('experienceContainer').innerHTML = `<div class="relative pl-6 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-8">${sc.pengalaman.map((e, i) => `
        <div class="relative space-y-2">
            <span class="absolute left-[-1.8rem] top-1 w-3 h-3 rounded-full ${DOTS[i % DOTS.length]} ring-4 ring-zinc-50 dark:ring-zinc-950"></span>
            <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 class="font-semibold text-sm text-zinc-900 dark:text-zinc-100">${escapeHtml(e.posisi)} · <span class="font-normal text-zinc-500 dark:text-zinc-400">${escapeHtml(e.perusahaan)}</span></h3>
                <span class="text-xs font-mono text-zinc-400 whitespace-nowrap">${escapeHtml(e.periode)}</span>
            </div>
            <ul class="space-y-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside">${(e.poin || []).map(pt => `<li>${escapeHtml(pt)}</li>`).join('')}</ul>
        </div>`).join('')}</div>`;

    startHeroTypewriter(sc);
}

/* ---------- Hitung naik statistik ---------- */
function initStatsCountUp() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('.stat-value').forEach(el => {
        const full = el.dataset.full || '', m = full.match(/\d+(\.\d+)?/);
        if (!m || reduce || !('IntersectionObserver' in window)) { el.textContent = full; return; }
        const target = parseFloat(m[0]), dec = (m[0].split('.')[1] || '').length;
        const pre = full.slice(0, m.index), suf = full.slice(m.index + m[0].length);
        el.textContent = pre + (0).toFixed(dec) + suf;
        const io = new IntersectionObserver(entries => entries.forEach(en => {
            if (!en.isIntersecting) return;
            io.unobserve(el);
            const start = performance.now();
            (function frame(now) {
                const p = Math.min((now - start) / 1200, 1), e = 1 - Math.pow(1 - p, 3);
                el.textContent = pre + (target * e).toFixed(dec) + suf;
                if (p < 1) requestAnimationFrame(frame);
            })(start);
        }), { threshold: 0.4 });
        io.observe(el);
    });
}

/* ---------- Efek ketik di hero (tidak restart kalau teks sama) ---------- */
function startHeroTypewriter(sc) {
    const el = document.getElementById('heroRole'); if (!el) return;
    const phrases = [sc.profil.peran, ...sc.keahlian.slice(0, 3).map(k => 'Suka ngulik ' + k.kategori)].filter(Boolean);
    const key = phrases.join('|');
    if (key === _twKey) return;
    _twKey = key; clearTimeout(heroTypewriterTimer);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (phrases.length <= 1 || reduce) { el.textContent = phrases[0] || ''; return; }
    let p = 0, c = 0, del = false;
    (function tick() {
        const cur = phrases[p];
        c += del ? -1 : 1; el.textContent = cur.slice(0, c);
        if (!del && c === cur.length) { del = true; heroTypewriterTimer = setTimeout(tick, 1800); return; }
        if (del && c === 0) { del = false; p = (p + 1) % phrases.length; heroTypewriterTimer = setTimeout(tick, 300); return; }
        heroTypewriterTimer = setTimeout(tick, del ? 25 : 55);
    })();
}

/* ---------- Spotlight hero (desktop) ---------- */
(function () {
    const hero = document.getElementById('hero'), sp = document.getElementById('heroSpotlight');
    if (!hero || !sp || !window.matchMedia('(pointer: fine)').matches) return;
    hero.addEventListener('mousemove', e => {
        const r = hero.getBoundingClientRect();
        sp.style.setProperty('--x', (e.clientX - r.left) + 'px'); sp.style.setProperty('--y', (e.clientY - r.top) + 'px');
    });
})();

/* ---------- vCard ---------- */
function downloadVCard() {
    const P = getSiteContent().profil;
    const v = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${P.nama}`, `TITLE:${P.peran}`, `EMAIL;TYPE=INTERNET:${P.email}`,
        `NOTE:${(P.ringkasan || '').replace(/\n/g, ' ')}`, 'END:VCARD'].join('\n');
    const url = URL.createObjectURL(new Blob([v], { type: 'text/vcard;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = (P.nama || 'kontak').replace(/\s+/g, '-').toLowerCase() + '.vcf';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('✓ Kartu kontak diunduh!');
}

/* ---------- Penghitung pengunjung (opsional) ---------- */
function watchVisitorCounter() {
    if (!db) return;
    db.collection('stats').doc('visitors').onSnapshot(snap => {
        if (!snap.exists) return;
        document.getElementById('visitorCountVal').innerText = (snap.data().count || 0).toLocaleString('id-ID');
        document.getElementById('visitorCounter').classList.remove('hidden');
    }, () => {});
}
async function bumpVisitorCounter() {
    if (!db || sessionStorage.getItem('azim_visited')) return;
    try {
        const ref = db.collection('stats').doc('visitors');
        await withTimeout(db.runTransaction(async tx => {
            const d = await tx.get(ref);
            tx.set(ref, { count: (d.exists ? (d.data().count || 0) : 0) + 1, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        }), 10000);
        sessionStorage.setItem('azim_visited', '1');
    } catch (e) { console.warn('Penghitung pengunjung tidak aktif (opsional):', e); }
}

/* ---------- Kartu & daftar proyek ---------- */
function hashAccentColor(str) {
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899'];
    let s = 0; for (let i = 0; i < str.length; i++) s += str.charCodeAt(i);
    return colors[s % colors.length];
}
function projectCardHtml(proj, opts) {
    opts = opts || {};
    const link = opts.internalLink ? '#/proyek/' + encodeURIComponent(proj._slug) : safeUrl(proj.linkTautan);
    const target = opts.internalLink ? '' : 'target="_blank" rel="noopener noreferrer"';
    const tags = proj.tags || [];
    return `
        <a href="${escapeHtml(link)}" ${target} class="block p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 hover:border-sky-500/50 hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div class="flex justify-between gap-2"><div><h3 class="font-semibold text-sm flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" style="background:${hashAccentColor(proj.judul || 'x')}"></span>${escapeHtml(proj.judul)}</h3><p class="text-xs font-mono text-zinc-400 pl-[18px]">${escapeHtml(proj.subjudul)}</p></div><span class="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 whitespace-nowrap h-fit">${escapeHtml(proj.status)}</span></div>
            <p class="text-xs text-zinc-600 dark:text-zinc-400 mt-3">${escapeHtml(proj.deskripsi)}</p>
            <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs font-mono mt-3">
                <div class="flex gap-2 text-zinc-400">${tags.map((t, i) => `<span>${escapeHtml(t)}</span>${i < tags.length - 1 ? '<span>•</span>' : ''}`).join('')}</div>
                <span class="text-sky-600 dark:text-sky-400">${opts.internalLink ? 'Lihat Detail →' : 'Buka Tautan ↗'}</span>
            </div>
        </a>`;
}
function getAllTags(projects) {
    const set = new Set(); projects.forEach(p => (p.tags || []).forEach(t => set.add(t)));
    return ['Semua', ...set];
}
function renderProjectFilters(projects) {
    const el = document.getElementById('projectFilters'); if (!el) return;
    el.innerHTML = getAllTags(projects).map(tag => `
        <button class="filter-chip ${tag === activeTagFilter ? 'active' : ''} px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800" data-tag="${escapeHtml(tag)}" onclick="setTagFilter(this.dataset.tag)">${escapeHtml(tag)}</button>`).join('');
}
function setTagFilter(tag) { activeTagFilter = tag; syncAllViews(); }
function estimateReadingTime(text) { return Math.max(1, Math.round((text || '').trim().split(/\s+/).filter(Boolean).length / 130)); }

function syncAllViews() {
    const $ = id => document.getElementById(id);
    const allArticles = [...cloudArticles, ...DATA_PORTOFOLIO.artikelDefault];
    $('publicArticlesContainer').innerHTML = allArticles.map(a => `
        <a href="${escapeHtml(safeUrl(a.linkTautan))}" class="block p-4 -mx-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900/60 group">
            <div class="flex items-baseline justify-between gap-4"><h3 class="font-medium text-sm group-hover:underline">${escapeHtml(a.judul)}</h3><span class="text-xs font-mono text-zinc-400 whitespace-nowrap">${escapeHtml(a.tahun)}</span></div>
            <p class="text-xs text-zinc-500 mt-1">${escapeHtml(a.deskripsi)}</p>
            <p class="text-[10px] font-mono text-zinc-400 mt-1.5">⏱ ${estimateReadingTime(a.deskripsi)} menit baca</p>
        </a>`).join('');

    const all = getMergedProjects();
    $('teaserProjectsContainer').innerHTML = all.slice(0, 3).map(p => projectCardHtml(p, { internalLink: true })).join('');

    renderProjectFilters(all);
    let list = all;
    if (activeTagFilter !== 'Semua') list = list.filter(p => (p.tags || []).includes(activeTagFilter));
    const q = activeSearch.trim().toLowerCase();
    if (q) list = list.filter(p => (p.judul || '').toLowerCase().includes(q) || (p.subjudul || '').toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q)));
    $('projectsEmptyState').classList.toggle('hidden', list.length !== 0);
    $('fullProjectsContainer').innerHTML = list.map(p => projectCardHtml(p, { internalLink: true })).join('');

    if (window.location.hash.startsWith('#/proyek/')) renderProjectDetail(decodeURIComponent(window.location.hash.replace('#/proyek/', '')));

    const adminRow = (col, editFn, item, sub) => `
        <div class="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <div><h4 class="text-sm font-medium">${escapeHtml(item.judul)}</h4><p class="text-[11px] text-zinc-500 mt-0.5">${escapeHtml(sub)}</p></div>
            <div class="flex gap-2">
                <button onclick="${editFn}('${escapeHtml(item.id)}')" class="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-600 text-xs font-mono hover:bg-sky-500 hover:text-white">Edit</button>
                <button onclick="deleteCloudItem('${col}', '${escapeHtml(item.id)}')" class="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 text-xs font-mono hover:bg-rose-500 hover:text-white">Hapus</button>
            </div>
        </div>`;
    const empty = '<p class="text-xs text-zinc-500 font-mono">Data kosong</p>';
    $('adminArticleList').innerHTML = cloudArticles.length ? cloudArticles.map(a => adminRow('artikel', 'editArticle', a, a.tahun)).join('') : empty;
    $('adminProjectList').innerHTML = cloudProjects.length ? cloudProjects.map(p => adminRow('proyek', 'editProject', p, p.status)).join('') : empty;
}

/* ---------- Detail proyek ---------- */
function renderProjectDetail(slug) {
    const proj = getMergedProjects().find(p => p._slug === slug);
    const wrap = document.getElementById('detailContent'), crumb = document.getElementById('detailBreadcrumbTitle');
    if (!proj && !projectsLoaded) {
        crumb.innerText = 'Memuat...';
        wrap.innerHTML = '<div class="py-16 text-center animate-pulse space-y-3"><div class="h-6 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto"></div><p class="text-xs font-mono text-zinc-400">Memuat data project dari cloud...</p></div>';
        return;
    }
    if (!proj) {
        crumb.innerText = 'Tidak ditemukan';
        wrap.innerHTML = '<div class="py-16 text-center space-y-3"><div class="text-3xl">🔍</div><h1 class="text-xl font-bold">Project tidak ditemukan</h1><p class="text-sm text-zinc-500">Mungkin sudah dihapus atau tautannya salah.</p><a href="#/proyek" class="inline-block mt-2 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-xs font-mono font-semibold">← Semua Project</a></div>';
        return;
    }
    crumb.innerText = proj.judul;
    wrap.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-start justify-between gap-4 flex-wrap">
                <div class="space-y-1"><h1 class="text-2xl sm:text-3xl font-bold tracking-tight">${escapeHtml(proj.judul)}</h1><p class="text-sm font-mono text-zinc-500">${escapeHtml(proj.subjudul)}</p></div>
                <span class="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 whitespace-nowrap">${escapeHtml(proj.status)}</span>
            </div>
            <div class="flex flex-wrap gap-2">${(proj.tags || []).map(t => `<span class="text-[11px] font-mono px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-500">${escapeHtml(t)}</span>`).join('')}</div>
            <p class="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">${escapeHtml(proj.deskripsi)}</p>
            <div class="flex flex-wrap gap-3 pt-2">
                <a href="${escapeHtml(safeUrl(proj.linkTautan))}" target="_blank" rel="noopener noreferrer" class="px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-xs font-mono font-semibold hover:opacity-90">Buka Project ↗</a>
                <button onclick="copyProjectLink('${escapeHtml(proj._slug)}')" class="px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-mono hover:bg-zinc-100 dark:hover:bg-zinc-900">Salin Tautan Halaman</button>
                <a href="#/proyek" class="px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-mono hover:bg-zinc-100 dark:hover:bg-zinc-900">← Semua Project</a>
            </div>
        </div>`;
}
function copyProjectLink(slug) {
    const url = location.origin + location.pathname + '#/proyek/' + encodeURIComponent(slug);
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(() => showToast('✓ Tautan disalin!')).catch(() => showToast('Gagal menyalin tautan'));
    else showToast('Salin manual: ' + url);
}

/* ---------- Router (#/proyek, #/proyek/:slug, #/github, jalur admin) ---------- */
function route() {
    const hash = location.hash || '';
    const $ = id => document.getElementById(id);
    const home = $('mainHome'), footer = $('mainFooter');
    const subs = [$('pageProyekList'), $('pageProyekDetail'), $('pageGithub')];

    if (hash === ADMIN_ACCESS_HASH) {
        history.replaceState(null, '', location.pathname + location.search);
        handleLockIconClick(); route(); return;
    }
    const showSub = el => { home.classList.add('hidden'); footer.classList.add('hidden'); subs.forEach(s => s.classList.add('hidden')); el.classList.remove('hidden'); window.scrollTo({ top: 0 }); };

    if (hash.startsWith('#/proyek/')) { showSub($('pageProyekDetail')); renderProjectDetail(decodeURIComponent(hash.replace('#/proyek/', ''))); }
    else if (hash === '#/proyek') { showSub($('pageProyekList')); syncAllViews(); }
    else if (hash === '#/github') { showSub($('pageGithub')); loadGithubRepos(); }
    else {
        subs.forEach(s => s.classList.add('hidden'));
        home.classList.remove('hidden'); footer.classList.remove('hidden');
        if (hash.length > 1 && !hash.startsWith('#/')) {
            let target = null; try { target = document.querySelector(hash); } catch (e) {}
            if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
        }
    }
    const key = hash.startsWith('#/proyek') ? 'proyek' : hash === '#/github' ? 'github' : null;
    if (key) document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.section === key));
}

/* ---------- Halaman GitHub ---------- */
const GH_CACHE_KEY = 'azim_gh_repos_cache_v2', GH_CACHE_TTL_MS = 10 * 60 * 1000;

function formatRelativeDate(d) {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days <= 0) return 'hari ini'; if (days === 1) return 'kemarin';
    if (days < 30) return days + ' hari lalu'; if (days < 365) return Math.floor(days / 30) + ' bulan lalu';
    return Math.floor(days / 365) + ' tahun lalu';
}

async function loadGithubRepos() {
    document.getElementById('ghUsernameLabel').innerText = '@' + GITHUB_USERNAME;
    document.getElementById('ghProfileLink').href = 'https://github.com/' + GITHUB_USERNAME;
    try {
        const c = JSON.parse(localStorage.getItem(GH_CACHE_KEY) || 'null');
        if (c && c.username === GITHUB_USERNAME && Date.now() - c.savedAt < GH_CACHE_TTL_MS) { ghReposCache = c.repos; renderGithubRepos(); return; }
    } catch (e) {}
    if (ghReposCache) { renderGithubRepos(); return; }

    document.getElementById('ghLoadingState').classList.remove('hidden');
    document.getElementById('ghErrorState').classList.add('hidden');
    try {
        const res = await withTimeout(fetch(`https://api.github.com/users/${encodeURIComponent(GITHUB_USERNAME)}/repos?sort=updated&per_page=100`, { headers: { Accept: 'application/vnd.github+json' } }), 15000, 'Waktu tunggu GitHub API habis.');
        if (res.status === 404) throw new Error(`Akun GitHub "${GITHUB_USERNAME}" tidak ditemukan.`);
        if (res.status === 403) throw new Error('Batas permintaan GitHub API tercapai. Coba lagi beberapa menit lagi.');
        if (!res.ok) throw new Error('GitHub API merespon status ' + res.status);
        const data = await res.json();
        ghReposCache = data.filter(r => !r.fork && !GH_HIDDEN_REPOS.some(h => h.toLowerCase() === r.name.toLowerCase()))
            .map(r => ({ name: r.name, description: r.description, url: r.html_url, language: r.language, stars: r.stargazers_count, forks: r.forks_count, updatedAt: r.pushed_at }));
        try { localStorage.setItem(GH_CACHE_KEY, JSON.stringify({ username: GITHUB_USERNAME, savedAt: Date.now(), repos: ghReposCache })); } catch (e) {}
        renderGithubRepos();
    } catch (err) {
        document.getElementById('ghLoadingState').classList.add('hidden');
        const el = document.getElementById('ghErrorState');
        el.innerText = '✗ ' + (err.message || 'Gagal memuat repositori.') + ` Kamu tetap bisa lihat langsung di github.com/${GITHUB_USERNAME}`;
        el.classList.remove('hidden');
    }
}

function renderGithubRepos() {
    const $ = id => document.getElementById(id);
    $('ghLoadingState').classList.add('hidden'); $('ghErrorState').classList.add('hidden');
    const repos = ghReposCache || [];
    const langCount = {}; repos.forEach(r => { if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1; });
    const topLang = Object.keys(langCount).sort((a, b) => langCount[b] - langCount[a])[0] || '—';
    const stat = (v, l) => `<div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 text-center"><div class="text-xl font-bold">${v}</div><div class="text-[10px] font-mono text-zinc-500">${l}</div></div>`;
    $('ghStatsBar').innerHTML = stat(repos.length, 'Repositori') + stat('★ ' + repos.reduce((s, r) => s + (r.stars || 0), 0), 'Total Bintang') + stat(escapeHtml(topLang), 'Bahasa Utama');

    const langs = ['Semua', ...new Set(repos.map(r => r.language).filter(Boolean))];
    $('ghLangFilters').innerHTML = langs.map(l => `<button class="filter-chip ${l === activeGhLanguage ? 'active' : ''} px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800" data-lang="${escapeHtml(l)}" onclick="setGhLanguageFilter(this.dataset.lang)">${escapeHtml(l)}</button>`).join('');

    let list = repos;
    if (activeGhLanguage !== 'Semua') list = list.filter(r => r.language === activeGhLanguage);
    const q = activeGhSearch.trim().toLowerCase();
    if (q) list = list.filter(r => (r.name || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q));
    list = list.slice().sort((a, b) => activeGhSort === 'stars' ? (b.stars || 0) - (a.stars || 0) : activeGhSort === 'name' ? a.name.localeCompare(b.name) : new Date(b.updatedAt) - new Date(a.updatedAt));

    $('ghEmptyState').classList.toggle('hidden', list.length !== 0);
    $('ghReposContainer').innerHTML = list.map(r => `
        <a href="${escapeHtml(safeUrl(r.url))}" target="_blank" rel="noopener noreferrer" class="block p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 hover:border-sky-500/50 space-y-2">
            <div class="flex items-start justify-between gap-2"><h3 class="font-semibold text-sm">📦 ${escapeHtml(r.name)}</h3>${r.stars > 0 ? `<span class="text-xs font-mono text-amber-500">★ ${r.stars}</span>` : ''}</div>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">${escapeHtml(r.description || 'Belum ada deskripsi.')}</p>
            <div class="flex items-center justify-between gap-2 pt-1 text-[11px] font-mono text-zinc-400"><span>${r.language ? escapeHtml(r.language) : '—'}${r.forks ? ' · ⑂ ' + r.forks : ''}</span><span>Diperbarui ${formatRelativeDate(r.updatedAt)}</span></div>
        </a>`).join('');
}
function setGhLanguageFilter(lang) { activeGhLanguage = lang; renderGithubRepos(); }

/* ---------- Pencarian & urutan ---------- */
document.getElementById('projectSearch').addEventListener('input', e => { activeSearch = e.target.value; syncAllViews(); });
document.getElementById('ghSearch').addEventListener('input', e => { activeGhSearch = e.target.value; renderGithubRepos(); });
document.getElementById('ghSortSelect').addEventListener('change', e => { activeGhSort = e.target.value; renderGithubRepos(); });

/* ---------- Start ---------- */
document.addEventListener('DOMContentLoaded', () => {
    renderSiteContent(); syncAllViews(); initScrollFeatures();
    window.addEventListener('hashchange', route); route();
});
