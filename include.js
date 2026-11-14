/* =========================================================================
   PROTEKSI MUTLAK TOMBOL BACK BAWAAN HP (ANTI-KELUAR WEBSITE)
   ========================================================================= */
function initAntiBackExit() {
    // 1. Inisialisasi state awal riwayat browser agar ada jejak di dalam web
    window.history.pushState({ page: "homeLocked" }, "", window.location.href);

    // 2. Tangkap setiap kali tombol Back HP ditekan
    window.addEventListener("popstate", function (event) {
        // Segera dorong kembali state agar history browser tidak pernah kosong/habis ke luar web
        window.history.pushState({ page: "homeLocked" }, "", window.location.href);

        // KONDISI 1: Jika siswa sedang mengerjakan ujian dan belum selesai
        if (typeof window.isUjianSelesai !== 'undefined' && 
            window.dataSiswaQuiz !== null && 
            !window.isUjianSelesai) {
            
            if (typeof window.soalAktifIndex !== 'undefined' && window.soalAktifIndex > 0) {
                pindahSoal(window.soalAktifIndex - 1); // Mundur ke soal sebelumnya
            } else {
                alert("⚠️ Anda sedang dalam sesi ujian! Selesaikan ujian terlebih dahulu.");
            }
            return;
        }

        // KONDISI 2: Jika fungsi navigasi 'nav' tersedia, arahkan kembali ke dashboard atau home secara aman
        if (typeof nav === "function") {
            const user = localStorage.getItem("user");
            
            if (user) {
                tampilkanToastBack("Gunakan menu navigasi di dalam aplikasi untuk berpindah halaman.");
            } else {
                nav("homePage");
            }
            return;
        }

        // KONDISI 3: Tampilkan peringatan Toast jika sudah di halaman utama
        tampilkanToastBack("Tekan tombol Home HP jika ingin keluar dari aplikasi.");
    });
}

// Fungsi Toast Notifikasi Elegan di Bawah Layar HP
function tampilkanToastBack(pesan) {
    let toast = document.getElementById("toastAntiBack");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toastAntiBack";
        toast.style.cssText = `
            position: fixed;
            bottom: 25px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.95);
            color: #fff;
            padding: 10px 20px;
            border-radius: 50px;
            font-size: 13px;
            font-family: sans-serif;
            z-index: 999999;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: opacity 0.3s ease;
            pointer-events: none;
            text-align: center;
            white-space: nowrap;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = pesan;
    toast.style.opacity = "1";

    clearTimeout(window.toastBackTimer);
    window.toastBackTimer = setTimeout(() => {
        toast.style.opacity = "0";
    }, 2200);
}


/* =========================================================================
   SISTEM UTAMA PEMUAT HALAMAN
   ========================================================================= */
async function loadPages() {
    const app = document.getElementById("app");
    
    try {
        const res = await fetch("page.html");
        app.innerHTML = await res.text();
        
        const loginBtn = document.getElementById("loginBtn");
        if (loginBtn) {
            loginBtn.addEventListener("click", () => {
                nav("loginPage");
            });
        }

        const modules = [
            "navigation.js", 
            "auth.js",
            "dashboard.js",
            "tabungan.js",
            "absensi.js",
            "quiz.js",
            "kbm.js",
            "chat.js",
            "home.js",
            "buatJadwal.js"
        ];

        for (const src of modules) {
            await new Promise((resolve) => {
                const script = document.createElement("script");
                script.src = src;
                script.async = false;
                script.onload = () => resolve();
                script.onerror = () => {
                    console.warn(`Gagal memuat modul: ${src}. Melanjutkan alur...`);
                    resolve();
                };
                document.body.appendChild(script);
            });
        }
        
        // ========================================================
        // AKTIFKAN PROTEKSI TOMBOL BACK HP DI SINI
        // ========================================================
        initAntiBackExit();

        if (typeof initHomeSlider === "function") {
            initHomeSlider();
        }
        
        if (typeof show === "function") {
            show("splash");
        }

        const user = JSON.parse(localStorage.getItem("user"));

        setTimeout(() => {
            if (user && typeof cekLogin === "function") {
                cekLogin();
            } else if (typeof nav === "function") {
                nav("homePage");
            }
        }, 2500);

    } catch (error) {
        console.error("Gagal menginisialisasi sistem halaman:", error);
    }
}

window.onload = loadPages;
