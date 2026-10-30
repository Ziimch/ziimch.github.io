/* ===== js/admin.js =====
   Login admin (Firebase Auth), simpan/hapus artikel & proyek, editor profil & konten.
   Keamanan sebenarnya ada di Firebase Auth + Firestore Rules, bukan di file ini. */

let drafts = { statistik: [], prinsip: [], keahlian: [], pengalaman: [], testimoni: [], sosial: [] };
let draftProfil = {};
let profilDraftsInitialized = false;
let loginAttempts = 0, loginLockedUntil = 0, currentAdminUser = null;

/* ---------- Auth ---------- */
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(user => { currentAdminUser = user; if (!user) closeAdminDashboard(); });
}

/* Ketuk logo 5x dalam 2 detik = buka login admin (enak di HP) */
(function () {
    let taps = 0, timer = null;
    const logo = document.querySelector('header a[href="#hero"]'); if (!logo) return;
    logo.addEventListener('click', e => {
        taps++; clearTimeout(timer); timer = setTimeout(() => { taps = 0; }, 2000);
        if (taps >= 5) { taps = 0; clearTimeout(timer); e.preventDefault(); handleLockIconClick(); }
    });
})();

document.getElementById('adminFormLogin').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('loginSubmitBtn'), err = document.getElementById('loginError');
    if (Date.now() < loginLockedUntil) {
        err.innerText = `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil((loginLockedUntil - Date.now()) / 1000)} detik.`;
        err.classList.remove('hidden'); return;
    }
    btn.innerText = 'Memeriksa...'; btn.disabled = true; err.classList.add('hidden');
    try {
        await firebase.auth().signInWithEmailAndPassword(document.getElementById('adminUser').value.trim(), document.getElementById('adminPass').value);
        loginAttempts = 0; closeLoginModal(); showToast('✓ Akses diberikan'); e.target.reset(); openAdminDashboard();
    } catch (ex) {
        if (ex.code === 'auth/network-request-failed') err.innerText = 'Koneksi bermasalah. Cek internet lalu coba lagi.';
        else { err.innerText = 'Kredensial ditolak!'; loginAttempts++; }
        err.classList.remove('hidden');
        if (loginAttempts >= 5) { loginLockedUntil = Date.now() + 30000; loginAttempts = 0; err.innerText = 'Terlalu banyak percobaan. Coba lagi dalam 30 detik.'; }
    }
    btn.innerText = 'Verifikasi'; btn.disabled = false;
});

function handleLockIconClick() {
    if (currentAdminUser) openAdminDashboard();
    else { document.getElementById('adminLoginModal').classList.remove('hidden'); document.getElementById('adminUser').focus(); }
}
function closeLoginModal() { document.getElementById('adminLoginModal').classList.add('hidden'); document.getElementById('loginError').classList.add('hidden'); }
function handleAdminLogout() { firebase.auth().signOut(); closeAdminDashboard(); showToast('Sesi berakhir.'); }
function openAdminDashboard() {
    const d = document.getElementById('adminDashboard');
    d.classList.remove('hidden'); d.classList.add('flex'); document.body.style.overflow = 'hidden'; switchAdminTab('tabAnalitik');
}
function closeAdminDashboard() {
    const d = document.getElementById('adminDashboard');
    d.classList.add('hidden'); d.classList.remove('flex'); document.body.style.overflow = 'auto';
}
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!document.getElementById('adminLoginModal').classList.contains('hidden')) closeLoginModal();
    if (!document.getElementById('adminDashboard').classList.contains('hidden')) closeAdminDashboard();
});

function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => { el.classList.remove('block'); el.classList.add('hidden'); });
    document.querySelectorAll('.admin-tab-btn').forEach(b => { b.className = 'admin-tab-btn w-full text-left px-4 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-xs font-semibold'; });
    document.getElementById(tabId).classList.remove('hidden'); document.getElementById(tabId).classList.add('block');
    document.getElementById('btn' + tabId.charAt(0).toUpperCase() + tabId.slice(1)).className = 'admin-tab-btn w-full text-left px-4 py-2.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-xs font-semibold';
    if (tabId === 'tabProfil' && !profilDraftsInitialized) { initAllDrafts(); profilDraftsInitialized = true; }
}

/* ---------- Simpan helper: tombol kembali normal & pesan error jelas ---------- */
async function runSave(btn, busyLabel, task, okMsg) {
    const label = btn.innerText;
    btn.innerText = busyLabel; btn.disabled = true;
    try {
        if (!db) throw new Error('Firebase belum terhubung. Muat ulang halaman.');
        await task(); showToast(okMsg); return true;
    } catch (err) {
        console.error(err); showToast('✗ ' + firestoreErrorMessage(err)); return false;
    } finally { btn.innerText = label; btn.disabled = false; }
}
const TS = () => firebase.firestore.FieldValue.serverTimestamp();

/* ---------- Artikel / catatan ---------- */
async function handleArticleUpload(e) {
    e.preventDefault();
    const form = e.target, editId = document.getElementById('aEditId').value;
    const payload = {
        judul: document.getElementById('aTitle').value.trim().slice(0, 120),
        tahun: document.getElementById('aYear').value.trim().slice(0, 10),
        linkTautan: document.getElementById('aLink').value.trim(),
        deskripsi: document.getElementById('aDesc').value.trim().slice(0, 500)
    };
    const ok = await runSave(document.getElementById('btnSubmitArt'), 'Menyimpan...', async () => {
        if (!payload.judul || !payload.deskripsi) throw new Error('Judul dan deskripsi wajib diisi.');
        if (editId) await withTimeout(db.collection('artikel').doc(editId).update({ ...payload, updatedAt: TS() }), 30000);
        else await withTimeout(db.collection('artikel').add({ ...payload, createdAt: TS() }), 30000);
    }, editId ? '✓ Catatan diperbarui!' : '✓ Catatan tersimpan di cloud!');
    if (ok) { cancelArticleEdit(); form.reset(); document.getElementById('aYear').value = '2026'; document.getElementById('aLink').value = '#artikel'; }
}
function editArticle(id) {
    const a = cloudArticles.find(x => x.id === id); if (!a) return;
    document.getElementById('aEditId').value = id;
    document.getElementById('aTitle').value = a.judul || ''; document.getElementById('aYear').value = a.tahun || '2026';
    document.getElementById('aLink').value = a.linkTautan || '#artikel'; document.getElementById('aDesc').value = a.deskripsi || '';
    document.getElementById('artFormTitle').innerText = '✏️ Edit Catatan';
    document.getElementById('btnSubmitArt').innerText = 'Simpan Perubahan';
    document.getElementById('btnCancelArtEdit').classList.remove('hidden');
    document.getElementById('aTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function cancelArticleEdit() {
    document.getElementById('aEditId').value = '';
    document.getElementById('artFormTitle').innerText = '➕ Tulis Catatan Baru';
    document.getElementById('btnSubmitArt').innerText = 'Unggah ke Cloud';
    document.getElementById('btnCancelArtEdit').classList.add('hidden');
    document.getElementById('aTitle').closest('form').reset();
    document.getElementById('aYear').value = '2026'; document.getElementById('aLink').value = '#artikel';
}

/* ---------- Proyek ---------- */
async function handleProjectUpload(e) {
    e.preventDefault();
    const form = e.target, editId = document.getElementById('pEditId').value;
    const payload = {
        judul: document.getElementById('pTitle').value.trim().slice(0, 120),
        subjudul: document.getElementById('pSub').value.trim().slice(0, 150),
        status: document.getElementById('pStatus').value,
        linkTautan: document.getElementById('pLink').value.trim(),
        deskripsi: document.getElementById('pDesc').value.trim().slice(0, 800),
        tags: document.getElementById('pTags').value.split(',').map(t => t.trim()).filter(Boolean).slice(0, 12)
    };
    const ok = await runSave(document.getElementById('btnSubmitProj'), 'Menyimpan...', async () => {
        if (!payload.judul || !payload.deskripsi) throw new Error('Judul dan deskripsi wajib diisi.');
        if (editId) await withTimeout(db.collection('proyek').doc(editId).update({ ...payload, updatedAt: TS() }), 30000);
        else await withTimeout(db.collection('proyek').add({ ...payload, createdAt: TS() }), 30000);
    }, editId ? '✓ Project diperbarui!' : '✓ Project tersimpan di cloud!');
    if (ok) { cancelProjectEdit(); form.reset(); document.getElementById('pLink').value = 'https://github.com'; }
}
function editProject(id) {
    const p = cloudProjects.find(x => x.id === id); if (!p) return;
    document.getElementById('pEditId').value = id;
    document.getElementById('pTitle').value = p.judul || ''; document.getElementById('pSub').value = p.subjudul || '';
    document.getElementById('pStatus').value = p.status || 'Live'; document.getElementById('pLink').value = p.linkTautan || 'https://github.com';
    document.getElementById('pTags').value = (p.tags || []).join(', '); document.getElementById('pDesc').value = p.deskripsi || '';
    document.getElementById('projFormTitle').innerText = '✏️ Edit Project';
    document.getElementById('btnSubmitProj').innerText = 'Simpan Perubahan';
    document.getElementById('btnCancelProjEdit').classList.remove('hidden');
    document.getElementById('pTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function cancelProjectEdit() {
    document.getElementById('pEditId').value = '';
    document.getElementById('projFormTitle').innerText = '➕ Tambah Project Baru';
    document.getElementById('btnSubmitProj').innerText = 'Unggah ke Cloud';
    document.getElementById('btnCancelProjEdit').classList.add('hidden');
    document.getElementById('pTitle').closest('form').reset();
    document.getElementById('pLink').value = 'https://github.com';
}

async function deleteCloudItem(col, id) {
    if (!confirm('Hapus data ini secara permanen dari Cloud?')) return;
    try {
        if (!db) throw new Error('Firebase belum terhubung. Muat ulang halaman.');
        await withTimeout(db.collection(col).doc(id).delete(), 30000); showToast('✓ Data dihapus.');
    } catch (err) { console.error(err); showToast('✗ ' + firestoreErrorMessage(err)); }
}

/* ---------- Editor profil & konten ---------- */
function initAllDrafts() {
    const sc = getSiteContent();
    draftProfil = { ...sc.profil };
    ['nama', 'peran', 'statusBadge', 'ringkasan', 'tentangDetail', 'email', 'copyright'].forEach(k => {
        const el = document.getElementById('adm_' + k); if (el) el.value = draftProfil[k] || '';
    });
    Object.keys(REPEATER_CONFIGS).forEach(key => initRepeaterDraft(key, sc));
}

function saveProfil() {
    return runSave(document.getElementById('btnSaveProfil'), 'Menyimpan...', async () => {
        if (!draftProfil.nama || !draftProfil.email) throw new Error('Nama dan email wajib diisi.');
        await withTimeout(db.collection('site_content').doc('main').set({ profil: draftProfil, updatedAt: TS() }, { merge: true }), 30000);
    }, '✓ Profil tersimpan!');
}

const REPEATER_CONFIGS = {
    statistik: { fields: [{ key: 'nilai', label: 'Nilai', type: 'text', placeholder: '1+ Thn' }, { key: 'label', label: 'Label', type: 'text', placeholder: 'Belajar TKJ' }] },
    prinsip: { fields: [{ key: 'judul', label: 'Judul', type: 'text' }, { key: 'deskripsi', label: 'Deskripsi', type: 'textarea' }] },
    keahlian: {
        fields: [
            { key: 'kategori', label: 'Kategori', type: 'text', placeholder: 'Jaringan' },
            { key: 'warnaDot', label: 'Warna Penanda', type: 'select', options: ['bg-cyan-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500', 'bg-sky-500'] },
            { key: 'item', label: 'Daftar Skill (pisahkan koma)', type: 'text', placeholder: 'Mikrotik, Linux, DNS' }
        ],
        toDraft: x => ({ ...x, item: (x.item || []).join(', ') }),
        toSave: x => ({ kategori: x.kategori || '', warnaDot: x.warnaDot || 'bg-cyan-500', item: (x.item || '').split(',').map(s => s.trim()).filter(Boolean) })
    },
    pengalaman: {
        fields: [
            { key: 'posisi', label: 'Posisi', type: 'text' }, { key: 'perusahaan', label: 'Tempat / Instansi', type: 'text' },
            { key: 'periode', label: 'Periode', type: 'text', placeholder: '2024 — Sekarang' },
            { key: 'poin', label: 'Poin (satu baris = satu poin)', type: 'textarea' }
        ],
        toDraft: x => ({ ...x, poin: (x.poin || []).join('\n') }),
        toSave: x => ({ posisi: x.posisi || '', perusahaan: x.perusahaan || '', periode: x.periode || '', poin: (x.poin || '').split('\n').map(s => s.trim()).filter(Boolean) })
    },
    testimoni: { fields: [{ key: 'nama', label: 'Nama', type: 'text' }, { key: 'peran', label: 'Peran / Jabatan', type: 'text' }, { key: 'pesan', label: 'Pesan Testimoni', type: 'textarea' }] },
    sosial: { fields: [{ key: 'nama', label: 'Nama Platform', type: 'text', placeholder: 'GitHub' }, { key: 'url', label: 'URL', type: 'text', placeholder: 'https://github.com/username' }] }
};
function getRepeaterConfig(key) {
    const c = REPEATER_CONFIGS[key];
    return { fields: c.fields, toDraft: c.toDraft || (x => ({ ...x })), toSave: c.toSave || (x => ({ ...x })) };
}
function initRepeaterDraft(key, sc) {
    drafts[key] = (sc[key] || []).map(getRepeaterConfig(key).toDraft); renderRepeaterEditor(key);
}
function renderRepeaterEditor(key) {
    const box = document.getElementById('editor_' + key); if (!box) return;
    const cfg = getRepeaterConfig(key), items = drafts[key] || [];
    if (!items.length) { box.innerHTML = '<p class="text-xs text-zinc-400 font-mono">Belum ada item. Klik "+ Tambah" di bawah.</p>'; return; }
    box.innerHTML = items.map((item, idx) => `
        <div class="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 space-y-2">
            ${cfg.fields.map(f => repeaterFieldHtml(key, idx, f, item[f.key])).join('')}
            <button type="button" onclick="removeRepeaterItem('${key}', ${idx})" class="text-[11px] font-mono text-rose-500 hover:underline">🗑 Hapus item ini</button>
        </div>`).join('');
}
function repeaterFieldHtml(key, idx, f, value) {
    const val = escapeHtml(value || ''), ev = `updateRepeaterField('${key}', ${idx}, '${f.key}', this.value)`;
    const cls = 'w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none';
    const label = `<label class="text-[10px] font-mono text-zinc-400">${escapeHtml(f.label)}</label>`;
    const ph = escapeHtml(f.placeholder || '');
    if (f.type === 'textarea') return `<div>${label}<textarea rows="2" oninput="${ev}" placeholder="${ph}" class="${cls}">${val}</textarea></div>`;
    if (f.type === 'select') return `<div>${label}<select onchange="${ev}" class="${cls}">${f.options.map(o => `<option value="${o}" ${o === value ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
    return `<div>${label}<input type="text" value="${val}" oninput="${ev}" placeholder="${ph}" class="${cls}"></div>`;
}
function updateRepeaterField(key, idx, field, value) { if (drafts[key] && drafts[key][idx]) drafts[key][idx][field] = value; }
function addRepeaterItem(key) {
    const empty = {}; getRepeaterConfig(key).fields.forEach(f => empty[f.key] = f.type === 'select' ? f.options[0] : '');
    (drafts[key] = drafts[key] || []).push(empty); renderRepeaterEditor(key);
}
function removeRepeaterItem(key, idx) { drafts[key].splice(idx, 1); renderRepeaterEditor(key); }

function saveRepeaterSection(key) {
    return runSave(document.getElementById('btnSave_' + key), 'Menyimpan...', async () => {
        const data = (drafts[key] || []).map(getRepeaterConfig(key).toSave);
        await withTimeout(db.collection('site_content').doc('main').set({ [key]: data, updatedAt: TS() }, { merge: true }), 30000);
    }, '✓ Tersimpan!');
}
