let mapelTerakhir = "";

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

async function loadJadwalSekarang(){
    try{
        const res = await fetch(JADWAL_API + "?action=jadwalSekarang");
        const data = await res.json();
        
        if(!data.status || data.data.length === 0){ 
            jadwalSekarang.innerHTML = "Tidak ada jadwal"; 
            mapelTerakhir = ""; 
            return; 
        }
        
        // --- FILTER JADWAL SESUAI KELAS USER YANG LOGIN ---
        // Mengambil kelas user saat ini (di-trim dan disamakan formatnya)
        const kelasUser = (currentUser && currentUser.kelas) ? String(currentUser.kelas).trim().toUpperCase() : "";
        
        // Filter data agar hanya menampilkan jadwal yang kelasnya cocok
        const dataSesuaiKelas = data.data.filter(r => String(r.kelas).trim().toUpperCase() === kelasUser);

        if(dataSesuaiKelas.length === 0){
            jadwalSekarang.innerHTML = `Tidak ada jadwal untuk kelas ${kelasUser || '-'}`;
            mapelTerakhir = "";
            return;
        }
        
        // Tampilkan tabel jadwal yang sudah difilter
        let html = `<table><tr><th>Kelas</th><th>Mapel</th><th>Guru</th><th>Jam</th></tr>`;
        dataSesuaiKelas.forEach(r => { 
            html += `<tr><td>${r.kelas}</td><td>${r.mapel}</td><td>${r.guru}</td><td>${r.jamMulai} - ${r.jamSelesai}</td></tr>`; 
        });
        html += `</table>`;
        jadwalSekarang.innerHTML = html;

        // Ambil jadwal aktif pertama hasil filter untuk pengumuman suara
        const jadwalAktif = dataSesuaiKelas[0]; 
        
        if (jadwalAktif.mapel !== mapelTerakhir) {
            mapelTerakhir = jadwalAktif.mapel; 

            // --- OPTIMASI TEKS AGAR SUARA LEBIH NATURAL ---
            const formatJamSuara = (jamStr) => {
                const p = jamStr.replace('.', ':').split(':');
                const jam = parseInt(p[0], 10);
                const menit = parseInt(p[1], 10);
                return `${jam} ${menit > 0 ? 'lewat ' + menit : ''}`;
            };

            const jamMulaiSuara = formatJamSuara(jadwalAktif.jamMulai);
            const jamSelesaiSuara = formatJamSuara(jadwalAktif.jamSelesai);

            // Menyusun kalimat pengumuman suara
            const teksPengumuman = `saatnya masuk pelajaran ${jadwalAktif.mapel}, untuk kelas ${jadwalAktif.kelas}. yang di ampu oleh ${jadwalAktif.guru}, sampai jam ${jamSelesaiSuara}.`;
            
            panggilPesanSuara(teksPengumuman);
        }

    }catch(err){ 
        console.log(err); 
    }
}

// --- FUNGSI SUARA YANG DISESUAIKAN (LEBIH JERNIH) ---
function panggilPesanSuara(teks) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Hentikan suara yang tumpang tindih

        const ucapan = new SpeechSynthesisUtterance(teks);
        ucapan.lang = 'id-ID'; 
        ucapan.rate = 0.71; // Sedikit diperlambat dari sebelumnya (0.9 -> 0.85) agar artikulasinya jelas
        ucapan.pitch = 1.02;  // Nada suara normal (tidak terlalu cempreng/ngebas)

        // Fungsi internal untuk mengunci suara Bahasa Indonesia terbaik di perangkat
        const setSuaraIndonesia = () => {
            const daftarSuara = window.speechSynthesis.getVoices();
            // Prioritaskan suara Google Indonesia atau Microsoft Ardi/Gadis jika menggunakan Windows/Android
            const suaraIndo = daftarSuara.find(voice => voice.lang.includes('id-ID') || voice.lang.includes('id_ID')) 
                              || daftarSuara.find(voice => voice.lang.toLowerCase().includes('id'));
            
            if (suaraIndo) {
                ucapan.voice = suaraIndo;
            }
            window.speechSynthesis.speak(ucapan);
        };

        // Atasi bug browser Chrome/Edge yang sering lambat memuat daftar suara di awal
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = setSuaraIndonesia;
        } else {
            setSuaraIndonesia();
        }

    } else {
        console.log("Browser Anda tidak mendukung fitur pesan suara.");
    }
}

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
        if(menuName === "latihan") return true;
        if(menuName === "materi") return submenuName.includes("mulai belajar");
        if(menuName === "tabungan") return submenuName.includes("lihat tabungan");
        if(menuName === "absensi") return (submenuName.includes("rekap siswa") || submenuName.includes("rekap absensi siswa"));
        return false;
    }
    return false;
}
