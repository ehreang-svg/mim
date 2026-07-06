async function loadDashboard(user){

currentUser = user;

nav("dashboard");

if(window.nama)
    nama.innerText = user.nama;

if(window.kelas)
    kelas.innerText = user.kelas || "";

const statusEl =
    document.getElementById("status");

if(statusEl)
    statusEl.textContent =
        user.status || "-";

const targetFoto =
    document.getElementById("foto");

if(targetFoto){

    targetFoto.src =
        user.foto ||
        "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    targetFoto.onerror = function(){

        this.src =
            "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    };
}

let res =
    await fetch(API_URL + "?action=getMenus");

let data =
    await res.json();

menuBox.innerHTML = "";

data.menus
    .filter(m =>
        canShowMenu(
            m.name,
            (user.status || "")
        )
    )
    .forEach(m => {

        menuBox.innerHTML += `
        <div class="menu-card"
             onclick="openMenu('${m.id}','${m.name}')">
            <img src="${m.icon}">
            <div>${m.name}</div>
        </div>`;
    });

loadJadwalSekarang();

}
/* ================= LOAD JADWAL SEKARANG & SUARA ================= */
async function loadJadwalSekarang() {
    try {
        const response = await fetch(ABSEN_API + "?action=jadwalSekarang");
        const result = await response.json();
        
        const container = document.getElementById("jadwalSekarang");
        if (!container) return;

        if (result.status && result.data.length > 0) {
            let html = "<ul>";
            let teksSuara = "Jadwal saat ini adalah ";

            result.data.forEach(j => {
                html += `<li><b>Kelas ${j.kelas}</b>: ${j.mapel} oleh ${j.guru} (${j.jamMulai} - ${j.jamSelesai})</li>`;
                // Rakit teks yang akan dibacakan oleh robot suara
                teksSuara += `Mata pelajaran ${j.mapel} di kelas ${j.kelas} bersama ${j.guru}. `;
            });

            html += "</ul>";
            container.innerHTML = html;

            // --- JALANKAN PESAN SUARA DI SINI KARENA ADA NILAINYA ---
            putarPesanSuara(teksSuara);

        } else {
            container.innerHTML = "<p>Tidak ada jadwal saat ini.</p>";
            // Opsional: bunyikan jika kosong
            // putarPesanSuara("Tidak ada jadwal pelajaran saat ini.");
        }
    } catch (err) {
        console.error("Gagal memuat jadwal:", err);
    }
}

// Panggil fungsi ini di dalam DOMContentLoaded atau interval waktu berkala
document.addEventListener("DOMContentLoaded", () => {
    // Kode Anda yang lain...
    
    // Panggil jika element jadwalSekarang ada di page aktif
    if(document.getElementById("jadwalSekarang")){
        loadJadwalSekarang();
    }
});

async function loadJadwalHariIni(){
    try{
        const kelas = document.getElementById("pilihKelas").value;
        if(!kelas){ jadwalHariIni.innerHTML = "Pilih kelas terlebih dahulu"; return; }
        const res = await fetch(JADWAL_API + "?action=jadwalHariIni&kelas=" + encodeURIComponent(kelas));
        const data = await res.json();
        if(!data.status || data.data.length===0){ jadwalHariIni.innerHTML = "Tidak ada jadwal"; return; }
        let html = `<table><tr><th>Jam</th><th>Mapel</th><th>Guru</th></tr>`;
        data.data.forEach(r=>{ html += `<tr><td>${r.jamMulai} - ${r.jamSelesai}</td><td>${r.mapel}</td><td>${r.guru}</td></tr>`; });
        html += "</table>";
        jadwalHariIni.innerHTML = html;
    }catch(err){ console.log(err); }
}
/* ================= TEXT TO SPEECH (SUARA) ================= */
function putarPesanSuara(teks) {
    if ('speechSynthesis' in window) {
        // Batalkan suara yang sedang berjalan agar tidak bertumpuk
        window.speechSynthesis.cancel(); 
        
        const utterance = new SpeechSynthesisUtterance(teks);
        utterance.lang = 'id-ID'; // Menggunakan pengaturan suara Bahasa Indonesia
        utterance.rate = 1.0;     // Kecepatan bicara (normal)
        utterance.pitch = 1.0;    // Nada suara
        
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn("Browser ini tidak mendukung pesan suara (Web Speech API).");
    }
}

/* ================= MENU CONTROL ================= */
async function openMenu(id,name){
    if(name.toUpperCase() === "DATA SISWA"){

        nav("dataSiswaPage");

        loadDataSiswaPage();

        return;
    }
    currentMenuName = name;
    nav("submenuPage");
    menuTitle.innerText = name;
    let res = await fetch(API_URL + "?action=getSubmenu&menu_id=" + id);
    let data = await res.json();
    subBox.innerHTML = "";
    const user = JSON.parse(localStorage.getItem("user"));
    data.submenu.filter(s => canShowSubmenu(currentMenuName, s.name, (user.status || ""))).forEach(s=>{
        const card = document.createElement("div");
        card.className = "menu-card";
        card.innerHTML = `<img src="${s.icon || ''}"><div>${s.name}</div>`;
        card.onclick = () => { handleSubmenu(s.type, s.value, s.name); };
        subBox.appendChild(card);
    });
}

async function handleSubmenu(type, value, title) {
    nav(value);

    const user = JSON.parse(localStorage.getItem("user"));

    if (value === "absenGuruPage")
        absenNama.value = user.nama || "";

    if (value === "absenSiswaPage")
        loadDataSiswa();

    if (value === "rekapPage")
        loadRekap();

    if (value === "loginQuiz")
        mulai();

    if (value === "rekapSiswaPage") {
        await loadKelasRekap();
        loadFilterNamaSiswa();
        loadRekapSiswa();
    }

    if (value === "tabunganPage"){
        loadKelasTabungan();
    }

    if (value === "rekapTabunganPage") {
        loadFilterKelasTabungan();
        loadRekapTabungan();
    }

    if (type === "link") {
        window.open(value, "_blank");
        return;
    }

    if (type === "content") {
        nav("contentPage");
        contentTitle.innerText = title;
        contentBody.innerHTML = value;
        return;
    }
}


function canShowMenu(menuName, status){
    menuName = menuName.toLowerCase(); status = status.toLowerCase();
    if(status === "admin"||status==="kepala sekolah") return true;
    if(status === "guru"|| status === "wali kelas") return ["absensi","materi","latihan"].includes(menuName);
    if(status === "siswa") return ["tabungan","materi","latihan","absensi"].includes(menuName);
    return false;
}

function canShowSubmenu(menuName, submenuName, status){
    menuName = menuName.toLowerCase(); submenuName = submenuName.toLowerCase(); status = status.toLowerCase();
    if(status === "admin" || status === "kepala sekolah") return true;
    if(status === "guru"||status === "wali kelas"){
        if(menuName === "materi" || menuName === "latihan") return true;
        if(menuName === "absensi") return (submenuName.includes("absen guru") ||submenuName.includes("absen siswa") ||submenuName.includes("rekap siswa") || submenuName.includes("rekap absensi"));
        return false;
    }
    if(status === "siswa"){
        if(menuName === "latihan") return submenuName.includes("mulai");
        if(menuName === "materi") return submenuName.includes("mulai belajar");
        if(menuName === "tabungan") return submenuName.includes("lihat tabungan");
        if(menuName === "absensi") return (submenuName.includes("rekap siswa") || submenuName.includes("rekap absensi siswa"));
        return false;
    }
    return false;
}


