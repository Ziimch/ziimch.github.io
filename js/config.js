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
        peran: "Siswa TKJ | Administrasi Jaringan & Pengembangan Web",
        statusBadge: "Terbuka untuk kesempatan kerja dan PKL",
        ringkasan: "Siswa Teknik Komputer dan Jaringan dengan minat pada administrasi jaringan, server Linux, dan pengembangan web. Terbiasa mendokumentasikan konfigurasi dengan rapi dan siap belajar langsung di lingkungan kerja.",
        tentangDetail: `Saya siswa jurusan ${INFO.jurusan} di ${INFO.sekolah}. Selama belajar, saya terbiasa mengonfigurasi jaringan, menyiapkan server Linux, dan membuat situs web sederhana. Saya menelusuri sumber masalah secara bertahap, mencatat solusinya, dan terus memperdalam kemampuan teknis saya.`,
        fotoProfil: "1000003180.jpg",
        email: EMAIL_KONTAK,
        copyright: `© 2026 ${INFO.nama} | ${INFO.sekolah} (${INFO.jurusan})`
    },
    statistik: [
        { nilai: INFO.jurusan, label: "Jurusan" },
        { nilai: INFO.tahunMasuk, label: "Tahun masuk" },
        { nilai: "4", label: "Bidang keahlian" },
        { nilai: "GitHub", label: "Kode terbuka untuk ditinjau" }
    ],
    prinsip: [
        { judul: "Rapi dan terdokumentasi", deskripsi: "Setiap konfigurasi dan kode dicatat agar mudah dipahami, dipelihara, dan dilanjutkan oleh orang lain." },
        { judul: "Mau belajar", deskripsi: "Aktif bertanya, membaca dokumentasi resmi, dan mencoba hal baru untuk memperluas kemampuan." },
        { judul: "Jujur dan komunikatif", deskripsi: "Menyampaikan kemajuan pekerjaan dan kendala secara terbuka kepada tim." }
    ],
    keahlian: [
        { kategori: "Jaringan", warnaDot: "bg-cyan-500", item: ["Mikrotik", "Cisco Packet Tracer", "Subnetting dan pengalamatan IP"] },
        { kategori: "Server dan Linux", warnaDot: "bg-emerald-500", item: ["Debian / Ubuntu Server", "DNS dan DHCP", "Web server (Apache / Nginx)"] },
        { kategori: "Pengembangan web", warnaDot: "bg-indigo-500", item: ["HTML dan CSS", "JavaScript", "Tailwind CSS"] },
        { kategori: "Perangkat kerja", warnaDot: "bg-amber-500", item: ["Git dan GitHub", "VS Code", "Wireshark"] }
    ],
    pengalaman: [
        { posisi: "Siswa TKJ", perusahaan: INFO.sekolah, periode: `${INFO.tahunMasuk} sampai sekarang`,
          poin: ["Mempelajari administrasi jaringan, server Linux, dan dasar pemrograman web.", "Mengerjakan praktik konfigurasi jaringan di laboratorium serta proyek tugas."] },
        { posisi: "Proyek mandiri", perusahaan: "Pembelajaran mandiri", periode: "2025 sampai sekarang",
          poin: ["Membuat situs web dan perangkat bantu berukuran kecil.", "Mengunggah hasil kerja secara rutin ke GitHub sebagai catatan perkembangan."] }
    ],
    proyekDefault: [
        { judul: "Situs Portofolio", subjudul: "Portofolio pribadi", status: "Aktif",
          deskripsi: "Situs portofolio yang dibuat sendiri, dilengkapi panel admin untuk memperbarui konten dengan mudah.",
          tags: ["HTML", "Tailwind", "Firebase"], linkTautan: "#" }
    ],
    artikelDefault: [
        { judul: "Alasan Saya Memilih Jurusan TKJ", deskripsi: "Cerita singkat tentang awal ketertarikan saya pada jaringan komputer.", tahun: "2026", linkTautan: "#artikel" }
    ],
    // Ganti dengan testimoni asli dari orang yang bersedia dicantumkan namanya, atau kosongkan: testimoni: []
    testimoni: [
        { nama: "Teman sekelas", peran: "Siswa TKJ", pesan: "Saat jaringan laboratorium bermasalah, Azim membantu mencari penyebabnya dan menjelaskannya dengan sabar." },
        { nama: "Guru produktif", peran: "Guru TKJ", pesan: "Azim rajin mencoba hal baru di luar materi kelas, dan hasil kerjanya rapi." }
    ],
    sosial: [
        { nama: "GitHub", url: "https://github.com/ziimch" }, { nama: "LinkedIn", url: "https://linkedin.com" },
        { nama: "Instagram", url: "https://instagram.com" }, { nama: "X (Twitter)", url: "https://twitter.com" }
    ]
};
