/* ===========================
   DAFTAR HALAMAN
=========================== */

const pages = [
    "splash",
    "loginPage",
    "dashboard",
    "editAkun",
    "submenuPage",
    "contentPage",
    "absenGuruPage",
    "rekapGuruPage",
    "absenSiswaPage",
    "rekapSiswaPage",
    "tabunganPage",
    "rekapTabunganPage",
    "raportPage",
    "previewRaportPage",
    "kognitifPage",
    "previewKognitifPage",
    "loginQuiz",
    "cabutanPage",
    "identitasPage",
    "editIdentitasPage",
    "dataSiswaPage",
    "exportIdentitasPage",
   "materiPage",
   "ijazahPage",
   "ijazahMDPage",
   "siswaMateriPage",
   "tambahMateriPage",
   "inputSoalPage",
   "buatJadwalPage",
   "chatPage",
     "raportMDPage"
];
/* ===========================
   STATE NAVIGASI
=========================== */

const pageHistory = [];
let currentPage = "splash";

/* ===========================
   SHOW PAGE
=========================== */

function show(id) {
    pages.forEach(p => {
        const el = document.getElementById(p);
        if (el) el.classList.add("hidden");
    });

    const target = document.getElementById(id);

    if (!target) {
        console.error("Page tidak ditemukan:", id);
        return;
    }

    target.classList.remove("hidden");
}

/* ===========================
   NAVIGASI AMAN
=========================== */

function nav(id) {
    if (currentPage && currentPage !== id) {
        pageHistory.push(currentPage);
    }

    currentPage = id;
    show(id);

    /* =======================================================
       LIFECYCLE HOOKS (Hanya dijalankan jika halaman aktif)
    ======================================================= */
    
    // Pemicu halaman Buat Jadwal Otomatis
    if (id === "buatJadwalPage" && typeof initBuatJadwalPage === "function") {
        console.log("Membuka pengaturan Mesin Jadwal...");
        initBuatJadwalPage();
    }

    if (id === "siswaMateriPage" && typeof siswaAplikasi !== "undefined") {
        console.log("Siswa masuk ke Ruang Belajar Mandiri...");
        siswaAplikasi.init();
    }
   
    if (id === "materiPage" && typeof aplikasi !== "undefined" && typeof aplikasi.init === "function") {
        aplikasi.init();
    }

    if (id === "kognitifPage" && typeof loadKognitifSiswa === "function") {
        loadKognitifSiswa();
    }

    if (id === "raportPage" && typeof loadKelasRaport === "function") {
        loadKelasRaport();
    }

    if (id === "raportMDPage" && typeof loadKelasMD === "function") {
        loadKelasMD();
    }

    if (id === "loginQuiz" && typeof mulai === "function") {
        mulai();
    }

    if (id === "cabutanPage" && typeof loadKelasCabutan === "function") {
        loadKelasCabutan();
    }

    if (id === "tabunganPage" && typeof loadKelasTabungan === "function") {
        loadKelasTabungan();
    }

    if (id === "identitasPage" && typeof openIdentitasPage === "function") {
        openIdentitasPage();
    }

    if (id === "ijazahPage" && typeof loadKelasIjazah === "function") {
        loadKelasIjazah();
    }

    if (id === "ijazahMDPage" && typeof loadKelasIjazahMD === "function") {
        loadKelasIjazahMD();
    }

    if (id === "editIdentitasPage" && typeof loadKelasEditIdentitas === "function") {
        loadKelasEditIdentitas();
    }

    if (id === "dataSiswaPage" && typeof loadDataSiswaPage === "function") {
        loadDataSiswaPage();
    }
}

/* ===========================
   BACK BUTTON
=========================== */

function goBack() {

    if (currentPage === "chatPage") {

        stopChat();

    }

    if (!pageHistory.length) return;

    const last = pageHistory.pop();

    currentPage = last;

    show(last);

}
