async function loadPages() {
    const app = document.getElementById("app");
    
    // 1. Ambil file HTML eksternal
    const res = await fetch("page.html");
    app.innerHTML = await res.text(); // HTML berhasil disuntikkan
    
    // ==========================================
    // TOMBOL LOGIN
    // ==========================================
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            nav("loginPage");
        });
    }
    
    // ==========================================
    // SOLUSI: PICU ULANG FUNGSI YANG ERROR SETELAH HTML SIAP
    // ==========================================
    // Memanggil fungsi pencarian data identitas setelah HTML siap di DOM
    if (typeof loadDataIdentitas === "function") {
        try {
            await loadDataIdentitas();
        } catch (e) {
            console.log("Menunda inisialisasi identitas...");
        }
    }

    if (typeof loadKelas === "function") {
        try {
            loadKelas();
        } catch (e) {
            console.log("Menunda inisialisasi kelas...");
        }
    }
    // ==========================================
    
    // 2. Tampilkan Splash Screen terlebih dahulu
    show("splash");

    // 3. Ambil data user dari penyimpanan lokal
    const user = JSON.parse(localStorage.getItem("user"));

    // 4. Berikan jeda waktu Splash Screen
    setTimeout(() => {
        if (user && typeof cekLogin === "function") {
            cekLogin();
        } else {
            nav("homePage"); 
        }
    }, 2500);
}
