/* ===== js/admin-ui.js =====
   Membuat markup panel admin di dalam <div id="adminRoot">.
   Semua id sama persis dengan versi lama, jadi js/admin.js & js/core.js langsung cocok. */
(function () {
    const root = document.getElementById('adminRoot');
    if (!root) return;

    const INPUT = 'w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none';
    const CARD = 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6';
    const BTN_GREEN = 'rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-semibold transition-colors';
    const BTN_LINE = 'rounded-lg border border-zinc-200 dark:border-zinc-800 font-mono';
    const TAB_BTN = 'admin-tab-btn w-full text-left px-4 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-xs font-semibold';

    /* Blok editor berulang (statistik, prinsip, dst.) dibuat dari satu fungsi */
    function repeaterBlock(key, icon, title, addLabel, saveLabel, gridClass) {
        return `
        <div class="${CARD} space-y-3">
            <h3 class="font-bold text-sm border-b border-zinc-200 dark:border-zinc-800 pb-2">${icon} ${title}</h3>
            <div id="editor_${key}" class="${gridClass}"></div>
            <div class="flex gap-2">
                <button type="button" onclick="addRepeaterItem('${key}')" class="px-4 py-2 ${BTN_LINE} text-xs">${addLabel}</button>
                <button type="button" id="btnSave_${key}" onclick="saveRepeaterSection('${key}')" class="px-5 py-2 ${BTN_GREEN} text-xs">${saveLabel}</button>
            </div>
        </div>`;
    }

    function profilField(id, label, key, type, rows) {
        const el = rows
            ? `<textarea id="adm_${id}" rows="${rows}" oninput="draftProfil.${key}=this.value" class="${INPUT}"></textarea>`
            : `<input type="${type || 'text'}" id="adm_${id}" oninput="draftProfil.${key}=this.value" class="${INPUT}">`;
        return `<div><label class="text-[10px] font-mono text-zinc-400">${label}</label>${el}</div>`;
    }

    root.innerHTML = `
    <div id="adminDashboard" class="fixed inset-0 z-[70] hidden bg-zinc-50 dark:bg-zinc-950 flex-col md:flex-row overflow-hidden">
        <div class="w-full md:w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between p-5 md:h-screen flex-shrink-0">
            <div>
                <div class="flex items-center gap-3 mb-8 px-2">
                    <div class="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-600 flex items-center justify-center font-bold">AZ</div>
                    <div>
                        <h2 class="text-sm font-bold text-zinc-900 dark:text-white">Admin Cloud</h2>
                        <p class="text-[10px] font-mono text-emerald-500 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> Secure Mode</p>
                    </div>
                </div>
                <nav class="space-y-2">
                    <button onclick="switchAdminTab('tabAnalitik')" id="btnTabAnalitik" class="admin-tab-btn w-full text-left px-4 py-2.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-xs font-semibold">📊 Ringkasan</button>
                    <button onclick="switchAdminTab('tabArtikel')" id="btnTabArtikel" class="${TAB_BTN}">📝 Kelola Catatan</button>
                    <button onclick="switchAdminTab('tabProyek')" id="btnTabProyek" class="${TAB_BTN}">🚀 Kelola Project</button>
                    <button onclick="switchAdminTab('tabProfil')" id="btnTabProfil" class="${TAB_BTN}">🧑 Profil & Konten</button>
                </nav>
            </div>
            <div class="space-y-2 mt-8 md:mt-0">
                <button onclick="closeAdminDashboard()" class="w-full px-4 py-2 ${BTN_LINE} text-zinc-600 text-xs hover:bg-zinc-100">Tutup Panel</button>
                <button onclick="handleAdminLogout()" class="w-full px-4 py-2 rounded-lg bg-rose-500/10 text-rose-600 font-mono text-xs hover:bg-rose-500/20">Logout</button>
            </div>
        </div>

        <div class="flex-1 h-screen overflow-y-auto p-6 md:p-10 relative">

            <!-- RINGKASAN -->
            <div id="tabAnalitik" class="admin-tab-content block max-w-4xl mx-auto space-y-8">
                <div><h1 class="text-2xl font-bold">Ringkasan Sistem</h1><p class="text-xs font-mono text-zinc-500">Koneksi database aktif</p></div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800"><div class="text-xs font-mono text-zinc-500 mb-2">Total Project Cloud</div><div id="dashCountProj" class="text-3xl font-bold text-emerald-500">0</div></div>
                    <div class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800"><div class="text-xs font-mono text-zinc-500 mb-2">Total Catatan Cloud</div><div id="dashCountArt" class="text-3xl font-bold text-sky-500">0</div></div>
                    <div class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800"><div class="text-xs font-mono text-zinc-500 mb-2">Pesan Masuk</div><div class="text-3xl font-bold text-amber-500">via email</div></div>
                </div>
                <div class="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-xl p-4 text-xs leading-relaxed space-y-1">
                    <p>✅ Login pakai Firebase Authentication. Pastikan Firestore Rules mensyaratkan email admin kamu untuk tulis/hapus.</p>
                    <p>✅ Teks di-escape sebelum ditampilkan (anti-XSS), tautan selain http/https/mailto diblokir.</p>
                    <p>✅ Simpan/hapus punya batas waktu, jadi tidak menggantung kalau koneksi lambat.</p>
                </div>
            </div>

            <!-- CATATAN / ARTIKEL -->
            <div id="tabArtikel" class="admin-tab-content hidden max-w-3xl mx-auto space-y-8">
                <div><h1 class="text-2xl font-bold">Kelola Catatan</h1><p class="text-xs font-mono text-zinc-500">Sinkron real-time ke Firebase</p></div>
                <div class="${CARD}">
                    <h3 id="artFormTitle" class="font-bold text-sm mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">➕ Tulis Catatan Baru</h3>
                    <form onsubmit="handleArticleUpload(event)" class="space-y-3 text-xs">
                        <input type="hidden" id="aEditId" value="">
                        <input type="text" id="aTitle" required maxlength="120" placeholder="Judul..." class="${INPUT}">
                        <div class="grid grid-cols-2 gap-3">
                            <input type="text" id="aYear" required value="2026" placeholder="Tahun" class="${INPUT}">
                            <input type="text" id="aLink" required value="#artikel" placeholder="Link URL" class="${INPUT}">
                        </div>
                        <textarea id="aDesc" rows="3" required maxlength="500" placeholder="Ringkasan singkat..." class="${INPUT}"></textarea>
                        <div class="flex gap-2">
                            <button type="submit" id="btnSubmitArt" class="px-5 py-2.5 ${BTN_GREEN}">Unggah ke Cloud</button>
                            <button type="button" id="btnCancelArtEdit" onclick="cancelArticleEdit()" class="hidden px-5 py-2.5 ${BTN_LINE}">Batal Edit</button>
                        </div>
                    </form>
                </div>
                <div>
                    <h3 class="font-bold text-sm mb-4">🗂 Data Cloud Catatan</h3>
                    <div id="adminArticleList" class="space-y-3"><div class="animate-pulse text-xs text-zinc-500 font-mono">Memuat database...</div></div>
                </div>
            </div>

            <!-- PROJECT -->
            <div id="tabProyek" class="admin-tab-content hidden max-w-3xl mx-auto space-y-8">
                <div><h1 class="text-2xl font-bold">Kelola Project</h1><p class="text-xs font-mono text-zinc-500">Sinkron real-time ke Firebase</p></div>
                <div class="${CARD}">
                    <h3 id="projFormTitle" class="font-bold text-sm mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">➕ Tambah Project Baru</h3>
                    <form onsubmit="handleProjectUpload(event)" class="space-y-3 text-xs">
                        <input type="hidden" id="pEditId" value="">
                        <input type="text" id="pTitle" required maxlength="120" placeholder="Judul project..." class="${INPUT}">
                        <input type="text" id="pSub" required maxlength="150" placeholder="Subjudul (cth: Konfigurasi Jaringan Lab)..." class="${INPUT}">
                        <div class="grid grid-cols-2 gap-3">
                            <select id="pStatus" class="${INPUT} text-zinc-500"><option value="Live">Live</option><option value="Production">Production</option><option value="Beta">Beta</option><option value="Open Source">Open Source</option></select>
                            <input type="text" id="pLink" required value="https://github.com" placeholder="Link tautan" class="${INPUT}">
                        </div>
                        <input type="text" id="pTags" required placeholder="Teknologi (pisah koma: Mikrotik, Linux, HTML)..." class="${INPUT}">
                        <textarea id="pDesc" rows="3" required maxlength="800" placeholder="Deskripsi fitur dan tantangannya..." class="${INPUT}"></textarea>
                        <div class="flex gap-2">
                            <button type="submit" id="btnSubmitProj" class="px-5 py-2.5 ${BTN_GREEN}">Unggah ke Cloud</button>
                            <button type="button" id="btnCancelProjEdit" onclick="cancelProjectEdit()" class="hidden px-5 py-2.5 ${BTN_LINE}">Batal Edit</button>
                        </div>
                    </form>
                </div>
                <div>
                    <h3 class="font-bold text-sm mb-4">🗂 Data Cloud Project</h3>
                    <div id="adminProjectList" class="space-y-3"><div class="animate-pulse text-xs text-zinc-500 font-mono">Memuat database...</div></div>
                </div>
            </div>

            <!-- PROFIL & KONTEN -->
            <div id="tabProfil" class="admin-tab-content hidden max-w-3xl mx-auto space-y-8 pb-20">
                <div>
                    <h1 class="text-2xl font-bold">Profil & Konten Halaman</h1>
                    <p class="text-xs font-mono text-zinc-500">Tersimpan ke Firestore (koleksi <code>site_content</code>) dan langsung tampil di halaman publik. Data di sini menimpa isi config.js.</p>
                </div>
                <div class="${CARD} space-y-3 text-xs">
                    <h3 class="font-bold text-sm border-b border-zinc-200 dark:border-zinc-800 pb-2">👤 Profil Utama</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        ${profilField('nama', 'Nama', 'nama')}
                        ${profilField('peran', 'Peran / Jabatan', 'peran')}
                    </div>
                    ${profilField('statusBadge', 'Badge Status', 'statusBadge')}
                    ${profilField('ringkasan', 'Bio Singkat (di bawah nama)', 'ringkasan', 'text', 2)}
                    ${profilField('tentangDetail', 'Detail "Tentang Aku"', 'tentangDetail', 'text', 2)}
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        ${profilField('email', 'Email Kontak', 'email', 'email')}
                        ${profilField('copyright', 'Teks Copyright Footer', 'copyright')}
                    </div>
                    <p class="text-[10px] text-zinc-400">Foto profil diatur lewat nama file gambar di kode (tidak ada upload di panel ini).</p>
                    <button type="button" id="btnSaveProfil" onclick="saveProfil()" class="px-5 py-2.5 ${BTN_GREEN}">💾 Simpan Profil</button>
                </div>
                ${repeaterBlock('statistik', '📈', 'Statistik (4 angka di bawah hero)', '+ Tambah', '💾 Simpan Statistik', 'grid grid-cols-1 sm:grid-cols-2 gap-3')}
                ${repeaterBlock('prinsip', '💡', 'Prinsip Kerja', '+ Tambah', '💾 Simpan Prinsip', 'space-y-3')}
                ${repeaterBlock('keahlian', '🛠', 'Skill', '+ Tambah Kategori', '💾 Simpan Skill', 'space-y-3')}
                ${repeaterBlock('pengalaman', '💼', 'Perjalanan Belajar / Pengalaman', '+ Tambah Pengalaman', '💾 Simpan Pengalaman', 'space-y-3')}
                ${repeaterBlock('testimoni', '💬', 'Testimoni', '+ Tambah Testimoni', '💾 Simpan Testimoni', 'space-y-3')}
                ${repeaterBlock('sosial', '🔗', 'Tautan Sosial Media', '+ Tambah Tautan', '💾 Simpan Sosial', 'space-y-3')}
            </div>
        </div>
    </div>`;
})();
