let mapelTerakhir = "";

async function loadDashboard(user){
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

    // --- ATUR OTOMATIS DROPDOWN JADWAL SEKARANG BERDASARKAN USER ---
    const dropSekarang = document.getElementById("pilihKelasSekarang");
    if(dropSekarang) {
        if(user.status && user.status.toLowerCase() === "siswa" && user.kelas) {
            // Jika siswa, kunci pilihan ke kelasnya sendiri
            dropSekarang.value = String(user.kelas).trim().toUpperCase();
        } else {
            // Jika guru/admin, default-kan ke "Semua Kelas" agar bisa memantau seluruhnya
            dropSekarang.value = "";
        }
    }

    // Muat menu box
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

    // Panggil fungsi jadwal
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
        
        // Ambil nilai filter dari dropdown yang dipilih
        const kelasFilter = document.getElementById("pilihKelasSekarang").value.trim().toUpperCase();
        
        // Saring data: Jika milih "Semua Kelas" (kosong), tampilkan semua. Jika milih kelas tertentu, lakukan filter.
        let dataTampil = data.data;
        if (kelasFilter) {
            dataTampil = data.data.filter(r => String(r.kelas).trim().toUpperCase() === kelasFilter);
        }

        if(dataTampil.length === 0){
            containerJadwal.innerHTML = `Tidak ada jadwal aktif untuk kelas ${kelasFilter || '-'}`;
            mapelTerakhir = "";
            return;
        }
        
        // Buat tabel output
        let html = `<table><tr><th>Kelas</th><th>Mapel</th><th>Guru</th><th>Jam</th></tr>`;
        dataTampil.forEach(r => { 
            html += `<tr><td><b>${r.kelas}</b></td><td>${r.mapel}</td><td>${r.guru}</td><td>${r.jamMulai} - ${r.jamSelesai}</td></tr>`; 
        });
        html += `</table>`;
        containerJadwal.innerHTML = html;

        // --- PENGUMUMAN SUARA OTOMATIS (HANYA AKTIF JIKA MEMILIH 1 KELAS SPESIFIK) ---
        if (kelasFilter && dataTampil.length > 0) {
            const jadwalAktif = dataTampil[0]; 
            
            if (jadwalAktif.mapel !== mapelTerakhir && jadwalAktif.mapel.toUpperCase() !== "ISTIRAHAT") {
                mapelTerakhir = jadwalAktif.mapel; 

                const formatJamSuara = (jamStr) => {
                    const p = jamStr.replace('.', ':').split(':');
                    return `${parseInt(p[0], 10)} ${parseInt(p[1], 10) > 0 ? 'lewat ' + parseInt(p[1], 10) : ''}`;
                };

                const teksPengumuman = `saatnya masuk pelajaran ${jadwalAktif.mapel}, untuk kelas ${jadwalAktif.kelas}. yang di ampu oleh ${jadwalAktif.guru}, sampai jam ${formatJamSuara(jadwalAktif.jamSelesai)}.`;
                panggilPesanSuara(teksPengumuman);
            }
        }

    }catch(err){ 
        console.log("Error loadJadwalSekarang:", err);
        document.getElementById("jadwalSekarang").innerHTML = "Gagal memuat jadwal.";
    }
}

// --- FUNGSI SUARA ---
// --- FUNGSI SUARA KHUSUS PEREMPUAN ---
// --- FUNGSI SUARA WAJIB PEREMPUAN (ANTI-LAKI-LAKI) ---
function panggilPesanSuara(teks) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Hentikan suara yang tumpang tindih

        const ucapan = new SpeechSynthesisUtterance(teks);
        ucapan.lang = 'id-ID'; 
        ucapan.rate = 0.71; 
        ucapan.pitch = 1.18; // Pitch dinaikkan ke 1.18 agar suara lebih feminin/cempreng khas perempuan

        const setSuaraWajibPerempuan = () => {
            const daftarSuara = window.speechSynthesis.getVoices();
            
            // 1. Saring semua suara bahasa Indonesia, tapi BUANG yang bernama laki-laki (david, ardi, male)
            const semuaSuaraIndoPerempuan = daftarSuara.filter(voice => {
                const namaSuara = voice.name.toLowerCase();
                const kodeLang = voice.lang.toLowerCase();
                
                const isIndo = kodeLang.includes('id-id') || kodeLang.includes('id_id') || kodeLang === 'id';
                const isLakiLaki = namaSuara.includes('male') || namaSuara.includes('david') || namaSuara.includes('ardi');
                
                return isIndo && !isLakiLaki;
            });

            // 2. Cari yang paling spesifik perempuan dari hasil saringan di atas
            let suaraTerpilih = semuaSuaraIndoPerempuan.find(voice => {
                const nama = voice.name.toLowerCase();
                return nama.includes('gadis') || nama.includes('google') || nama.includes('female') || nama.includes('zira');
            });

            // 3. Jika tidak ada yang spesifik, gunakan suara Indonesia non-laki-laki apa saja yang tersisa
            if (!suaraTerpilih && semuaSuaraIndoPerempuan.length > 0) {
                suaraTerpilih = semuaSuaraIndoPerempuan[0];
            }

            // Eksekusi suara jika ketemu
            if (suaraTerpilih) {
                ucapan.voice = suaraTerpilih;
            }
            
            window.speechSynthesis.speak(ucapan);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = setSuaraWajibPerempuan;
        } else {
            setSuaraWajibPerempuan();
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
    if (value === "absenGuruPage") absenNama.value = user.nama || "";
    if (value === "absenSiswaPage") loadDataSiswa();
    if (value === "rekapPage") loadRekap();
    if (value === "loginQuiz") mulai();
    if (value === "rekapSiswaPage") {
        await loadKelasRekap();
        loadFilterNamaSiswa();
        loadRekapSiswa();
    }
    if (value === "tabunganPage") loadKelasTabungan();
    if (value === "rekapTabunganPage") {
        loadFilterKelasTabungan();
        loadRekapTabungan();
    }
    if (type === "link") { window.open(value, "_blank"); return; }
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
    if(status === "guru"|| status === "wali kelas") return ["absensi","modul","latihan"].includes(menuName);
    if(status === "siswa") return ["modul","latihan","absensi"].includes(menuName);
    return false;
}

function canShowSubmenu(menuName, submenuName, status){
    menuName = menuName.toLowerCase(); submenuName = submenuName.toLowerCase(); status = status.toLowerCase();
    if(status === "admin" || status === "kepala sekolah") return true;
    if(status === "guru"||status === "wali kelas"){
        if(menuName === "modul" || menuName === "latihan") return true;
        if(menuName === "absensi") return (submenuName.includes("absen guru") ||submenuName.includes("absen siswa") ||submenuName.includes("rekap siswa") || submenuName.includes("rekap absensi"));
        return false;
    }
    if(status === "siswa"){
        if(menuName === "latihan") return true;
        if(menuName === "modul") return submenuName.includes("mulai belajar");
        if(menuName === "tabungan") return submenuName.includes("lihat tabungan");
        if(menuName === "absensi") return (submenuName.includes("rekap siswa") || submenuName.includes("rekap absensi siswa"));
        return false;
    }
    return false;
}
