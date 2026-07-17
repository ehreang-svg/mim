async function loadPages() {
    const app = document.getElementById("app");
    
    try {
        // 1. Ambil file HTML eksternal dan suntikkan ke aplikasi
        const res = await fetch("page.html");
        app.innerHTML = await res.text();
        
        // 2. Pasang event listener tombol Login
        const loginBtn = document.getElementById("loginBtn");
        if (loginBtn) {
            loginBtn.addEventListener("click", () => {
                nav("loginPage");
            });
        }

        // 3. DAFTAR MODUL YANG AKAN DIMUAT SECARA AMAN
        const modules = [
            "navigation.js", // File ini memuat fungsi show() dan nav()
            "auth.js",
            "dashboard.js",
            "tabungan.js",
            "absensi.js",
            "quiz.js",
            "kbm.js",
            "chat.js",
            "buatJadwal.js"
        ];

        // Memuat semua skrip terlebih dahulu secara berurutan
        for (const src of modules) {
            await new Promise((resolve) => {
                const script = document.createElement("script");
                script.src = src;
                script.async = false; // Menjaga urutan eksekusi tetap sekuensial
                script.onload = () => resolve();
                script.onerror = () => {
                    console.warn(`Gagal memuat modul: ${src}. Melanjutkan alur...`);
                    resolve();
                };
                document.body.appendChild(script);
            });
        }
        
        // ========================================================
        // SEKARANG SELESAI DIMUAT, BARU FUNGSI show() & nav() BISA DIPANGGIL
        // ========================================================
        
        // 4. Tampilkan Splash Screen
        if (typeof show === "function") {
            show("splash");
        } else {
            console.error("Fungsi show() gagal dimuat dari navigation.js");
        }

        // 5. Ambil data user dari penyimpanan lokal
        const user = JSON.parse(localStorage.getItem("user"));

        // 6. Berikan jeda waktu Splash Screen sebelum pindah ke HomePage / Cek Login
        setTimeout(() => {
            if (user && typeof cekLogin === "function") {
                cekLogin();
            } else if (typeof nav === "function") {
                nav("homePage");
            } else {
                console.error("Fungsi nav() gagal dimuat.");
            }
        }, 2500);

    } catch (error) {
        console.error("Gagal menginisialisasi sistem halaman:", error);
    }
}

window.onload = loadPages;
