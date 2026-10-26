/* ===== js/config.js =====
   Semua data yang sering kamu ubah ada di sini.
   Urutan <script> di index.html: config.js DULU, baru app.js. */

/* Config Firebase memang publik by design. Yang menjaga datamu adalah
   Firestore Rules + Authentication + pembatasan API key (lihat catatan di chat). */
const firebaseConfig = {
    apiKey: "AIzaSyBEo067vVnWeqKrDzN56Xjm0dDIrzw9Img",
    authDomain: "portofolio-63f79.firebaseapp.com",
    projectId: "portofolio-63f79",
    storageBucket: "portofolio-63f79.firebasestorage.app",
    messagingSenderId: "1002746551885",
    appId: "1:1002746551885:web:abe5dfafb6346ce694c604"
};

/* Jalur rahasia buka panel admin (ketik di address bar). Ganti ke path acak milikmu.
   INI BUKAN PENGAMAN, cuma menyembunyikan pintu. Pengamannya Firebase Auth + Rules. */
const ADMIN_ACCESS_HASH = '#/gerbang-masuk-azim';

const GITHUB_USERNAME = 'ziimch';
const GH_HIDDEN_REPOS = ['ziimch.github.io'];

/* Email disusun dari potongan supaya tidak mudah dipanen bot scraper.
   Ini obfuscation, bukan enkripsi: browser tetap harus bisa membacanya. */
const EMAIL_KONTAK = ['teanppu', 'gmail.com'].join('@');

/* Tujuan form kontak. Setelah formsubmit.co mengaktifkan emailmu, ganti dengan
   token acak dari email aktivasinya (contoh: 'a1b2c3...') supaya alamat emailmu
   tidak terlihat di Network tab. Selama belum, pakai EMAIL_KONTAK. */
const FORM_ENDPOINT_ID = EMAIL_KONTAK;

const INFO = {
    nama: "Azim",
    sekolah: "SMKN 1 Sidayu",
    jurusan: "TKJ",
    tahunMasuk: "2024" // GANTI sesuai tahun masukmu
};

const DATA_PORTOFOLIO = {
    profil: {
        nama: INFO.nama, inisial: "AZ",
        peran: "Siswa TKJ • Network & Web Enthusiast",
        statusBadge: "Lagi cari PKL & project seru",
        ringkasan: "Anak TKJ yang suka ngulik jaringan, Linux, sama bikin web. Masih belajar, tapi gas terus 🚀",
        tentangDetail: `Aku siswa jurusan ${INFO.jurusan} di ${INFO.sekolah}. Suka ngulik jaringan, nyetting server Linux, dan bikin web kecil-kecilan. Sering error, sering debugging sampai malem, tapi seru banget!`,
        fotoProfil: "1000003180.jpg",
        email: EMAIL_KONTAK,
        copyright: `© 2026 ${INFO.nama} — ${INFO.sekolah} (${INFO.jurusan}). Dibuat pakai ☕ dan banyak error.`
    },
    statistik: [
        { nilai: "1+ Thn", label: "Belajar TKJ" }, { nilai: "10+", label: "Project Iseng" },
        { nilai: "100%", label: "Semangat" }, { nilai: "∞", label: "Kopi & Mie Instan" }
    ],
    prinsip: [
        { judul: "Rapi Dulu, Keren Belakangan", deskripsi: "Konfigurasi dan kode dicatat rapi biar nggak pusing sendiri pas dibuka lagi." },
        { judul: "Belajar Terus", deskripsi: "Nggak malu nanya, rajin baca dokumentasi, dan berani nyoba walau sering gagal dulu." },
        { judul: "Jujur & Komunikatif", deskripsi: "Kalau belum bisa bilang belum bisa, kalau udah jadi langsung kabarin." }
    ],
    // GANTI skill sesuai yang beneran kamu kuasai
    keahlian: [
        { kategori: "Jaringan", warnaDot: "bg-cyan-500", item: ["Mikrotik", "Cisco Packet Tracer", "Subnetting / IP Address"] },
        { kategori: "Server & Linux", warnaDot: "bg-emerald-500", item: ["Debian / Ubuntu Server", "DNS & DHCP", "Web Server (Apache/Nginx)"] },
        { kategori: "Web", warnaDot: "bg-indigo-500", item: ["HTML & CSS", "JavaScript", "Tailwind CSS"] },
        { kategori: "Tools", warnaDot: "bg-amber-500", item: ["Git & GitHub", "VS Code", "Wireshark"] }
    ],
    pengalaman: [
        { posisi: "Siswa TKJ", perusahaan: INFO.sekolah, periode: `${INFO.tahunMasuk} — Sekarang`,
          poin: ["Belajar administrasi jaringan, server Linux, dan dasar pemrograman web.", "Praktik konfigurasi jaringan di lab dan bikin project tugas."] },
        { posisi: "Project Mandiri", perusahaan: "Belajar sendiri", periode: "2025 — Sekarang",
          poin: ["Ngulik bikin web dan tools kecil sendiri.", "Rajin push ke GitHub biar progress kelihatan."] }
    ],
    proyekDefault: [
        { judul: "Web Portofolio Ini", subjudul: "Portofolio Pribadi", status: "Live",
          deskripsi: "Website portofolio buatan sendiri, lengkap sama panel admin biar gampang update konten.",
          tags: ["HTML", "Tailwind", "Firebase"], linkTautan: "#" }
    ],
    artikelDefault: [
        { judul: "Catatan Pertama: Kenapa Aku Pilih TKJ", deskripsi: "Cerita singkat awal mula kenal jaringan dan hal-hal yang bikin ketagihan.", tahun: "2026", linkTautan: "#artikel" }
    ],
    // GANTI dengan testimoni asli, atau kosongkan: testimoni: []
    testimoni: [
        { nama: "Temen Sebangku", peran: "Teman Sekelas TKJ", pesan: "Kalau jaringan lab error dan nggak ketemu sebabnya, larinya ke Azim. Sabar banget ngejelasinnya!" },
        { nama: "Guru Produktif", peran: "Guru TKJ", pesan: "Rajin nyoba hal baru di luar materi kelas dan hasilnya rapi. Ditunggu project selanjutnya." }
    ],
    sosial: [
        { nama: "GitHub", url: "https://github.com/ziimch" }, { nama: "LinkedIn", url: "https://linkedin.com" },
        { nama: "Instagram", url: "https://instagram.com" }, { nama: "X (Twitter)", url: "https://twitter.com" }
    ]
};
