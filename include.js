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
        if (typeof initAntiBackExit === "function") {
            initAntiBackExit();
        }

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
