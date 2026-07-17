async function loadPages() {
    const app = document.getElementById("app");
    
    // 1. Ambil file HTML eksternal
    const res = await fetch("page.html");
    app.innerHTML = await res.text(); // <-- HTML disuntikkan ke aplikasi di sini
    
    // ==========================================
    // DI SINI TEMPAT MELETAKKAN KODE TOMBOL LOGIN:
    // ==========================================
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            nav("loginPage");
        });
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
            nav("homePage"); // Diarahkan ke homePage setelah splash
        }
    }, 2500);
}
