let mapelTerakhir = "";
let currentUser = null; // Menyimpan data user yang sedang aktif secara global

async function loadDashboard(user){
    // 1. Amankan data user ke variabel global di urutan pertama
    currentUser = user;

    nav("dashboard");

    if(window.nama)
        nama.innerText = user.nama;

    if(window.kelas)
        kelas.innerText = user.kelas || "";

    const statusEl = document.getElementById("status");
    if(statusEl)
        statusEl.textContent = user.status || "-";

    const targetFoto = document.getElementById("foto");
    if(targetFoto){
        targetFoto.src = user.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        targetFoto.onerror = function(){
            this.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        };
    }

    // 2. Muat menu box dari database
    try {
        let res = await fetch(API_URL + "?action=getMenus");
        let data = await res.json();

        menuBox.innerHTML = "";
        data.menus
            .filter(m => canShowMenu(m.name, (user.status || "")))
            .forEach(m => {
                menuBox.innerHTML += `
                <div class="menu-card" onclick="openMenu('${m.id}','${m.name}')">
                    <img src="${m.icon}">
                    <div>${m.name}</div>
                </div>`;
            });
    } catch(err) {
        console.log("Gagal memuat menu:", err);
    }

    // 3. Jalankan fungsi jadwal setelah data currentUser dipastikan siap
    await loadJadwalSekarang();
}

async function loadJadwalSekarang(){
    try{
        const containerJadwal = document.getElementById("jadwalSekarang");
        if(!containerJadwal) return;

        const res = await fetch(JADWAL_API + "?action=jadwalSekarang");
        const data = await res.json();
        
        if(!data.status || !data.data || data.data.length === 0){ 
            containerJadwal.innerHTML = "Tidak ada jadwal sekolah saat ini"; 
            mapelTerakhir = ""; 
            return; 
        }
        
        // --- FILTER JADWAL SESUAI KELAS USER YANG LOGIN ---
        const kelasUser = (currentUser && currentUser.kelas) ? String(currentUser.kelas).trim().toUpperCase() : "";
        
        // Jika user tidak memiliki kelas (misal: Admin atau Kepala Sekolah), tampilkan semua jadwal saat ini tanpa filter
        let dataTampil = data.data;
        if (kelasUser) {
            dataTampil = data.data.filter(r => String(r.kelas).trim().toUpperCase() === kelasUser);
        }

        if(dataTampil.length === 0){
            containerJadwal.innerHTML = `Tidak ada jadwal untuk kelas ${kelasUser || '-'}`;
            mapelTerakhir = "";
            return;
        }
        
        // Tampilkan tabel jadwal hasil filter atau keseluruhan
        let html = `<table><tr><th>Kelas</th><th>Mapel</th><th>Guru</th><th>Jam</th></tr>`;
        dataTampil.forEach(r => { 
            html += `<tr><td>${r.kelas}</td><td>${r.mapel}</td><td>${r.guru}</td><td>${r.jamMulai} - ${r.jamSelesai}</td></tr>`; 
        });
        html += `</table>`;
        containerJadwal.innerHTML = html;

        // Ambil jadwal aktif pertama untuk keperluan pengumuman suara
        const jadwalAktif = dataTampil[0]; 
        
        if (jadwalAktif.mapel !== mapelTerakhir && jadwalAktif.mapel.toUpperCase() !== "ISTIRAHAT") {
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
        console.log("Error loadJadwalSekarang:", err);
        const containerJadwal = document.getElementById("jadwalSekarang");
        if(containerJadwal) containerJadwal.innerHTML = "Gagal memuat jadwal.";
    }
}

// --- FUNGSI SUARA ---
function panggilPesanSuara(teks) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 

        const ucapan = new SpeechSynthesisUtterance(teks);
        ucapan.lang = 'id-ID'; 
        ucapan.rate = 0.71; 
        ucapan.pitch = 1.02;  

        const setSuaraIndonesia = () => {
            const daftarSuara = window.speechSynthesis.getVoices();
            const suaraIndo = daftarSuara.find(voice => voice.lang.includes('id-ID') || voice.lang.includes('id_ID')) 
                              || daftarSuara.find(voice => voice.lang.toLowerCase().includes('id'));
            
            if (suaraIndo) {
                ucapan.voice = suaraIndo;
            }
            window.speechSynthesis.speak(ucapan);
        };

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
