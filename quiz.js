/* =========================================================================
   FITUR UTAMA KUIS & TATAP MUKA SISWA (DURASI & PROTEKSI KEAMANAN)
   ========================================================================= */

// Deklarasi variabel global aman
if (typeof window.dataSiswaQuiz === 'undefined') { window.dataSiswaQuiz = null; }
if (typeof window.dataSoal === 'undefined') { window.dataSoal = []; }
if (typeof window.mataPelajaranTerpilih === 'undefined') { window.mataPelajaranTerpilih = ""; }
if (typeof window.masterDaftarNilai === 'undefined') { window.masterDaftarNilai = []; }

// State Tatap Muka & Timer Ujian
if (typeof window.soalAktifIndex === 'undefined') { window.soalAktifIndex = 0; }
if (typeof window.jawabanSiswa === 'undefined') { window.jawabanSiswa = {}; }
if (typeof window.statusRagu === 'undefined') { window.statusRagu = {}; }
if (typeof window.timerInterval === 'undefined') { window.timerInterval = null; }
if (typeof window.durasiUjianDetik === 'undefined') { window.durasiUjianDetik = 60 * 60; } // Default: 60 Menit
if (typeof window.pelanggaranCount === 'undefined') { window.pelanggaranCount = 0; }

// 1. Ambil daftar kelas untuk halaman Kuis Utama
async function loadKelas() {
    try {
        const selectKelas = document.getElementById("selectKelas");
        if (!selectKelas) return;

        const urlAPI = window.Quiz_API;
        if (!urlAPI) {
            console.error("window.Quiz_API belum terdefinisi.");
            return;
        }
        
        const res = await fetch(urlAPI + "?aksi=getKelas", { method: "GET", redirect: "follow" });
        if (!res.ok) return;

        const data = await res.json();
        selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
        
        let listKelas = data.kelas || [];
        if (listKelas.length > 0) {
            listKelas.forEach(kelas => {
                let opt = document.createElement("option");
                opt.value = kelas;
                opt.textContent = kelas;
                selectKelas.appendChild(opt);
            });
        }
    } catch (err) {
        console.error("Gagal memuat kelas kuis:", err);
    }
}

// Trigger gabungan saat kelas diubah
function AksiPilihKelas() {
    loadSiswa();
    loadPelajaran();
} 

// 2. Ambil daftar siswa berdasarkan kelas
async function loadSiswa() {
    const selectKelasEl = document.getElementById("selectKelas");
    const selectSiswa = document.getElementById("selectSiswa");
    if (!selectKelasEl || !selectSiswa) return;

    const kelas = selectKelasEl.value;
    if (!kelas) { 
        selectSiswa.innerHTML = '<option value="">-- Pilih Nama --</option>'; 
        selectSiswa.disabled = true; 
        return; 
    }
    
    try {
        const res = await fetch(window.Quiz_API + "?aksi=getSiswaByKelas&kelas=" + encodeURIComponent(kelas), { method: "GET", redirect: "follow" });
        const data = await res.json();
        selectSiswa.innerHTML = '<option value="">-- Pilih Nama --</option>';
        
        let listSiswa = data.siswa || [];
        if (listSiswa.length > 0) {
            listSiswa.forEach(s => {
                let opt = document.createElement("option");
                opt.value = s.nisn;
                opt.textContent = s.nama;
                selectSiswa.appendChild(opt);
            });
        }
        selectSiswa.disabled = false;
    } catch (err) { 
        console.error("Gagal memuat siswa kuis:", err); 
    }
}

// 3. Ambil mata pelajaran berdasarkan kelas
async function loadPelajaran() {
    const selectKelasEl = document.getElementById("selectKelas");
    const selectPelajaran = document.getElementById("selectPelajaran");
    if (!selectKelasEl || !selectPelajaran) return;

    const kelas = selectKelasEl.value;
    if (!kelas) { 
        selectPelajaran.innerHTML = '<option value="">-- Pilih Pelajaran --</option>'; 
        selectPelajaran.disabled = true; 
        return; 
    }

    try {
        const res = await fetch(window.Quiz_API + "?aksi=getPelajaranByKelas&kelas=" + encodeURIComponent(kelas), { method: "GET", redirect: "follow" });
        const data = await res.json();
        selectPelajaran.innerHTML = '<option value="">-- Pilih Pelajaran --</option>';
        
        let listPelajaran = data.pelajaran || [];
        if (listPelajaran.length > 0) {
            listPelajaran.forEach(p => {
                let opt = document.createElement("option");
                opt.value = p;
                opt.textContent = p;
                selectPelajaran.appendChild(opt);
            });
        }
        selectPelajaran.disabled = false;
    } catch (err) { 
        console.error("Gagal memuat pelajaran kuis:", err); 
    }
}

// 4. Proses Login & Memulai Ujian
async function mulai() {
    const selectSiswa = document.getElementById("selectSiswa");
    const selectPelajaran = document.getElementById("selectPelajaran");
    const passwordNisn = document.getElementById("passwordNisn").value.trim();
    
    const nisnTerpilih = selectSiswa.value;
    window.mataPelajaranTerpilih = selectPelajaran.value;

    if (!nisnTerpilih || !window.mataPelajaranTerpilih || !passwordNisn) {
        alert("Semua kolom pilihan dan password wajib diisi!");
        return;
    }
    
    if (String(passwordNisn) !== String(nisnTerpilih)) {
        alert("Password (NISN) salah untuk siswa yang Anda pilih!");
        return;
    }

    document.getElementById("siswa").innerHTML = "<p>Memuat lembar soal kuis...</p>";

    try {
        const res = await fetch(window.Quiz_API + `?aksi=loginQuiz&nisn=${encodeURIComponent(passwordNisn)}&pelajaran=${encodeURIComponent(window.mataPelajaranTerpilih)}`, { method: "GET", redirect: "follow" });
        const data = await res.json();
        
        if (data.error) { alert(data.message || data.error); return; }

        window.dataSiswaQuiz = data.siswa;
        window.dataSoal = data.soal; 
        
        // Custom Durasi dari Server jika ada, default ke 60 menit
        if (data.durasiMenit && !isNaN(data.durasiMenit)) {
            window.durasiUjianDetik = parseInt(data.durasiMenit) * 60;
        } else {
            window.durasiUjianDetik = 60 * 60;
        }

        // Reset state
        window.soalAktifIndex = 0;
        window.jawabanSiswa = {};
        window.statusRagu = {};
        window.pelanggaranCount = 0;

        // Aktifkan Pengaman Ujian & Layar Penuh
        aktifkanProteksiKeamanan();
        mintaLayarPenuh();

        tampilSiswaQuiz();
        tampilSoalTKA();
        mulaiTimerUjian();
    } catch (err) { 
        alert("Gagal menyambung ke server kuis."); 
    }
}

function tampilSiswaQuiz(){
    document.getElementById("areaLogin").classList.add("hidden");
    document.getElementById("areaKuis").classList.remove("hidden");
    document.getElementById("siswa").innerHTML = `
        <div class="cardQuizSiswa" style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 12px 18px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="${window.dataSiswaQuiz.foto || 'https://via.placeholder.com/150'}" alt="Foto Siswa" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover;">
                <div>
                    <h3 style="margin: 0; font-size: 15px;">${window.dataSiswaQuiz.nama || '-'}</h3>
                    <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">${window.dataSiswaQuiz.kelas} | Mapel: <b>${window.mataPelajaranTerpilih}</b></p>
                </div>
            </div>
            <!-- Wadah Timer Hitung Mundur -->
            <div style="background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; padding: 6px 14px; border-radius: 6px; text-align: center;">
                <div style="font-size: 10px; font-weight: bold; text-transform: uppercase;">Sisa Waktu</div>
                <div id="displayTimer" style="font-size: 18px; font-weight: bold; font-family: monospace;">00:00:00</div>
            </div>
        </div>
    `;
}

/* =========================================================================
   PROTEKSI KEAMANAN UJIAN (ANTI-CURANG / SECURE EXAM)
   ========================================================================= */

function aktifkanProteksiKeamanan() {
    // 1. Blokir Klik Kanan (Context Menu)
    document.addEventListener("contextmenu", hentikanAksiKeamanan);

    // 2. Blokir Kombinasi Tombol Salin/Tempel/Inspect (Ctrl+C, Ctrl+V, F12, Ctrl+Shift+I)
    document.addEventListener("keydown", function(e) {
        if (
            e.key === "F12" || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
            (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'a' || e.key === 'A'))
        ) {
            hentikanAksiKeamanan(e);
        }
    });

    // 3. Matikan Seleksi Teks (Copy text) via CSS
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    // 4. Deteksi Pindah Tab / Pindah Aplikasi (Visibility Change / Blur)
    window.addEventListener("blur", catatPelanggaran);
    document.addEventListener("visibilitychange", function() {
        if (document.hidden) {
            catatPelanggaran();
        }
    });
}

function matikanProteksiKeamanan() {
    document.removeEventListener("contextmenu", hentikanAksiKeamanan);
    window.removeEventListener("blur", catatPelanggaran);
    document.body.style.userSelect = "auto";
    document.body.style.webkitUserSelect = "auto";
}

function hentikanAksiKeamanan(e) {
    e.preventDefault();
    e.stopPropagation();
    alert("⚠️ Aksi ini dilarang selama ujian berlangsung!");
    return false;
}

function catatPelanggaran() {
    // Jalankan deteksi jika ujian masih aktif
    if (document.getElementById("areaKuis") && !document.getElementById("areaKuis").classList.contains("hidden")) {
        window.pelanggaranCount++;
        if (window.pelanggaranCount >= 3) {
            alert("🚨 Anda terdeteksi keluar dari layar ujian sebanyak 3 kali! Ujian Anda otomatis dihentikan.");
            koreksi(true); // Paksa selesai & kirim
        } else {
            alert(`⚠️ PERINGATAN (${window.pelanggaranCount}/3): Dilarang meninggalkan halaman ujian! Ujian akan otomatis terkirim jika Anda melanggar ${3 - window.pelanggaranCount} kali lagi.`);
        }
    }
}

function mintaLayarPenuh() {
    let elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

/* =========================================================================
   SISTEM TIMER HITUNG MUNDUR
   ========================================================================= */

function mulaiTimerUjian() {
    clearInterval(window.timerInterval);
    
    updateDisplayTimer();
    
    window.timerInterval = setInterval(() => {
        window.durasiUjianDetik--;
        updateDisplayTimer();

        if (window.durasiUjianDetik <= 0) {
            clearInterval(window.timerInterval);
            alert("⏰ Waktu ujian telah habis! Jawaban Anda akan otomatis dikirim.");
            koreksi(true); // Kirim otomatis saat waktu habis
        }
    }, 1000);
}

function updateDisplayTimer() {
    const el = document.getElementById("displayTimer");
    if (!el) return;

    let totalDetik = Math.max(0, window.durasiUjianDetik);
    let jam = Math.floor(totalDetik / 3600);
    let menit = Math.floor((totalDetik % 3600) / 60);
    let detik = totalDetik % 60;

    let formatWaktu = 
        String(jam).padStart(2, '0') + ":" + 
        String(menit).padStart(2, '0') + ":" + 
        String(detik).padStart(2, '0');

    el.textContent = formatWaktu;
}

/* =========================================================================
   TAMPILAN TATAP MUKA SISWA (MODEL TKA / CAT)
   ========================================================================= */

function tampilSoalTKA() {
    if (!window.dataSoal || window.dataSoal.length === 0) {
        document.getElementById("quiz").innerHTML = `<div class="rbm-empty-state">Belum tersedia soal untuk mata pelajaran ini.</div>`;
        return;
    }

    let totalSoal = window.dataSoal.length;
    let idx = window.soalAktifIndex;
    let s = window.dataSoal[idx];
    let nomorSoal = idx + 1;

    // Render Gambar Soal
    let gambarHtml = "";
    if (s.gambar && s.gambar.trim() !== "") {
        gambarHtml = `
            <div class="soal-gambar-container" style="margin: 15px 0; text-align: center;">
                <img src="${s.gambar}" alt="Gambar Soal ${nomorSoal}" style="max-width: 100%; max-height: 280px; border-radius: 6px; border: 1px solid #ddd;">
            </div>
        `;
    }

    // Render Input Jawaban (PG / Isian)
    let inputHtml = "";
    let jawSimpan = window.jawabanSiswa[idx] || "";

    if (s.jenis === "ISIAN" || s.type === "isian" || !s.A) {
        inputHtml = `
            <div style="margin-top: 15px;">
                <label style="display:block; margin-bottom: 5px; font-weight:bold;">Jawaban Singkat Anda:</label>
                <input type="text" id="inputIsianTKA" value="${jawSimpan}" onchange="simpanJawabanIsian(this.value)" placeholder="Ketik jawaban di sini..." style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 15px; box-sizing: border-box;">
            </div>
        `;
    } else {
        function renderOpsiTKA(huruf, teksOpsi, urlGambarOpsi) {
            let checked = (jawSimpan === huruf) ? "checked" : "";
            let imgOpsiHtml = "";
            if (urlGambarOpsi && urlGambarOpsi.trim() !== "") {
                imgOpsiHtml = `<div style="margin-top: 5px;"><img src="${urlGambarOpsi}" alt="Opsi ${huruf}" style="max-width: 120px; max-height: 100px; border-radius: 4px; border: 1px solid #ddd;"></div>`;
            }
            return `
            <label class="opsi-label" id="label-${idx}-${huruf}" style="display: block; margin-bottom: 10px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; background: ${checked ? '#eff6ff' : '#fff'};">
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <input type="radio" name="qTKA" value="${huruf}" ${checked} onchange="simpanJawabanPG('${huruf}')" style="margin-top: 3px;">
                    <div>
                        <span><b>${huruf}.</b> ${teksOpsi || ''}</span>
                        ${imgOpsiHtml}
                    </div>
                </div>
            </label>`;
        }

        inputHtml = `
            <div style="margin-top: 15px;">
                ${renderOpsiTKA('A', s.A, s.gambarA)}
                ${renderOpsiTKA('B', s.B, s.gambarB)}
                ${renderOpsiTKA('C', s.C, s.gambarC)}
                ${renderOpsiTKA('D', s.D, s.gambarD)}
            </div>
        `;
    }

    // Grid Nomor Soal
    let gridNomorHtml = window.dataSoal.map((_, i) => {
        let isAktif = i === idx ? 'border: 2px solid #2563eb; font-weight: bold;' : 'border: 1px solid #ccc;';
        let bgStatus = '#f3f4f6'; 
        let colorText = '#333';

        if (window.statusRagu[i]) {
            bgStatus = '#f59e0b';
            colorText = '#fff';
        } else if (window.jawabanSiswa[i] !== undefined && window.jawabanSiswa[i] !== "") {
            bgStatus = '#10b981';
            colorText = '#fff';
        }

        return `<button onclick="pindahSoal(${i})" style="width: 36px; height: 36px; margin: 3px; background: ${bgStatus}; color: ${colorText}; border-radius: 6px; cursor: pointer; ${isAktif}">${i + 1}</button>`;
    }).join("");

    let isRagu = window.statusRagu[idx] ? "checked" : "";

    let containerHtml = `
        <div class="tka-wrapper" style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; margin-top: 15px;">
            <!-- Lembar Soal Utama -->
            <div class="tka-soal-box" style="flex: 2; min-width: 280px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">
                    <span style="font-size: 16px; font-weight: bold; color: #1e293b;">Soal No. ${nomorSoal} / ${totalSoal}</span>
                </div>
                
                <div class="soal-teks" style="font-size: 15px; color: #334155; line-height: 1.6;">${s.soal}</div>
                ${gambarHtml}
                ${inputHtml}
                
                <div id="pembahasan${idx}" class="hidden" style="margin-top: 15px;"></div>

                <!-- Tombol Navigasi Ujian -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee;">
                    <button type="button" onclick="pindahSoal(${idx - 1})" ${idx === 0 ? 'disabled' : ''} style="background: #64748b; color: #fff; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; opacity: ${idx === 0 ? '0.5' : '1'};">
                        ⬅️ Sebelumnya
                    </button>
                    
                    <label style="display: inline-flex; align-items: center; gap: 6px; background: #fffbebf; padding: 6px 12px; border: 1px solid #fcd34d; border-radius: 6px; cursor: pointer; font-size: 13px;">
                        <input type="checkbox" onchange="toggleRagu(${idx})" ${isRagu}>
                        🟡 Ragu-Ragu
                    </label>

                    ${idx < totalSoal - 1 
                        ? `<button type="button" onclick="pindahSoal(${idx + 1})" style="background: #2563eb; color: #fff; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer;">Berikutnya ➡️</button>`
                        : `<button type="button" id="btnKirimQuiz" onclick="koreksi(false)" style="background: #059669; color: #fff; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">🚀 Selesai & Kirim</button>`
                    }
                </div>
            </div>

            <!-- Panel Navigasi Nomor Soal -->
            <div class="tka-nav-box" style="flex: 1; min-width: 240px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px;">
                <h4 style="margin: 0 0 10px 0; font-size: 14px; text-align: center; color: #475569;">Navigasi Soal</h4>
                <div style="display: flex; flex-wrap: wrap; justify-content: center;">
                    ${gridNomorHtml}
                </div>
                <div style="margin-top: 15px; font-size: 11px; color: #64748b; border-top: 1px solid #eee; padding-top: 10px;">
                    <span style="display:inline-block; width:10px; height:10px; background:#10b981; border-radius:2px;"></span> Sudah Dijawab<br>
                    <span style="display:inline-block; width:10px; height:10px; background:#f59e0b; border-radius:2px;"></span> Ragu-Ragu<br>
                    <span style="display:inline-block; width:10px; height:10px; background:#f3f4f6; border:1px solid #ccc; border-radius:2px;"></span> Belum Dijawab
                </div>
            </div>
        </div>
    `;

    document.getElementById("quiz").innerHTML = containerHtml;
}

function simpanJawabanPG(val) {
    window.jawabanSiswa[window.soalAktifIndex] = val;
    tampilSoalTKA();
}

function simpanJawabanIsian(val) {
    window.jawabanSiswa[window.soalAktifIndex] = val.trim();
}

function toggleRagu(idx) {
    window.statusRagu[idx] = !window.statusRagu[idx];
    tampilSoalTKA();
}

function pindahSoal(targetIndex) {
    if (targetIndex >= 0 && targetIndex < window.dataSoal.length) {
        window.soalAktifIndex = targetIndex;
        tampilSoalTKA();
    }
}

// 5. Cetak Hasil Latihan
function cetakHasilLatihan() {
    const areaSiswa = document.getElementById("siswa").innerHTML;
    const areaHasil = document.getElementById("hasil").innerHTML;
    const areaKuis = document.getElementById("quiz").innerHTML;

    const jw = window.open('', '_blank');
    if (!jw) {
        alert("Popup diblokir oleh browser. Izinkan popup untuk mencetak.");
        return;
    }

    jw.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Cetak Hasil Latihan Siswa - MI Miftahul Mubtadiin</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 15px; color: #000; font-size: 13px; background: #fff; }
                .kop-table { width: 100%; border-bottom: 4px double #000; padding-bottom: 8px; margin-bottom: 15px; }
                .kop-logo { width: 65px; height: auto; }
                .kop-text { text-align: center; }
                .kop-yayasan { font-size: 14px; font-weight: bold; text-transform: uppercase; margin: 0; }
                .kop-sekolah { font-size: 17px; font-weight: bold; color: #0056b3; text-transform: uppercase; margin: 2px 0; }
                .kop-alamat-1 { font-size: 12px; font-weight: bold; color: #d9534f; text-transform: uppercase; margin: 0; }
                .kop-alamat-2 { font-size: 12px; font-weight: bold; margin: 1px 0; }
                .kop-nsm { font-size: 10px; font-weight: bold; margin-top: 3px; }
                .kop-kontak { font-size: 10px; margin-top: 1px; }

                .cardQuizSiswa { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
                .cardQuizSiswa img { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
                .cardHasil { text-align: center; padding: 15px; border: 1px solid #ccc; border-radius: 8px; margin-top: 20px; background: #f9f9f9; }
                .score-big { font-size: 28px; font-weight: bold; }
                .badge-status { font-size: 14px; font-weight: bold; margin-top: 5px; }
                .benar-pilihan { background-color: #d1e7dd !important; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
                .salah-pilihan { background-color: #f8d7da !important; padding: 2px 6px; border-radius: 4px; text-decoration: line-through; }
                .pembahasan-box { background: #f8f9fa; padding: 6px; margin-top: 6px; font-size: 11px; border-left: 3px solid #0d6efd; }
                button, .tka-nav-box { display: none !important; }
            </style>
        </head>
        <body>
            <table class="kop-table">
                <tr>
                    <td style="width: 80px; vertical-align: middle; text-align: center;">
                        <img src="https://iili.io/CAZVdsj.png" class="kop-logo" alt="Logo">
                    </td>
                    <td class="kop-text">
                        <div class="kop-yayasan">YAYASAN FATAHILLAH</div>
                        <div class="kop-sekolah">MADRASAH IBTIDAIYAH MIFTAHUL MUBTADIIN</div>
                        <div class="kop-alamat-1">JAGAPURA WETAN KECAMATAN GEGESIK KABUPATEN CIREBON</div>
                        <div class="kop-alamat-2">TERAKREDITASI "B"</div>
                        <div class="kop-nsm">NSM : 111.2.32.09.0101 &nbsp;&nbsp; NPSN : 60708624 &nbsp;&nbsp; NO. IJOP Kd.10.09/4/PP.00.4/227/2010</div>
                        <div class="kop-kontak">Alamat : Jl. Raya Jagapura Wetan No. 105 Gegesik - Cirebon Telp. (0234) 484760 Kode Pos 45164</div>
                    </td>
                </tr>
            </table>

            <h4 style="text-align: center; margin-bottom: 15px; text-decoration: underline;">LEMBAR HASIL LATIHAN / UJIAN SISWA</h4>
            
            ${areaSiswa}
            <div>${areaKuis}</div>
            ${areaHasil}
            
            <script>
                setTimeout(function() {
                    window.print();
                }, 1000);
            </script>
        </body>
        </html>
    `);
    jw.document.close();
}

// 6. Fungsi Koreksi Nilai & Selesai Ujian
async function koreksi(isOtomatis = false){
    if (!isOtomatis && !confirm("Apakah Anda yakin ingin menyelesaikan dan mengirim jawaban?")) {
        return;
    }

    // Hentikan Timer & Matikan Proteksi
    clearInterval(window.timerInterval);
    matikanProteksiKeamanan();

    let benarPG = 0;
    let benarIsian = 0;
    
    let soalPG = window.dataSoal.filter(s => s.type !== "isian" && s.A);
    let soalIsian = window.dataSoal.filter(s => s.type === "isian" || !s.A);

    window.dataSoal.forEach((s, index) => {
        let isIsian = s.type === "isian" || !s.A;
        let jawabanUser = String(window.jawabanSiswa[index] || "").trim().toLowerCase();
        let kunciJawaban = String(s.jawaban).trim().toLowerCase();

        if (isIsian) {
            if (jawabanUser !== "" && jawabanUser === kunciJawaban) {
                benarIsian++;
            }
        } else {
            if (jawabanUser === kunciJawaban) {
                benarPG++;
            }
        }
    });

    let totalPG = soalPG.length;
    let totalIsian = soalIsian.length;
    let nilai = 0;
    let bobotTotal = (totalPG * 1) + (totalIsian * 2);

    if (bobotTotal > 0) {
        let poinPG = benarPG * 1;
        let poinIsian = benarIsian * 2;
        nilai = Math.round(((poinPG + poinIsian) / bobotTotal) * 100);
    }

    let isLulus = nilai >= 75;
    let status = isLulus ? "LULUS" : "BELUM LULUS";
    
    document.getElementById("hasil").innerHTML = `
        <div class="cardHasil ${isLulus ? 'lulus' : 'gagal'}">
            <div class="score-big ${isLulus ? 'lulus' : 'gagal'}">${nilai}</div>
            <div class="badge-status ${isLulus ? 'lulus' : 'gagal'}">${status}</div>
            <div style="margin-top: 10px; font-size: 13px; color: #555;">
                Detail Benar: <b>PG (${benarPG}/${totalPG})</b> | <b>Isian (${benarIsian}/${totalIsian})</b>
            </div>
            <br>
            <button onclick="cetakHasilLatihan()" style="background: #0d9488; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                🖨️ Cetak Hasil Latihan (Dengan Kop Surat)
            </button>
        </div>`;
    
    document.getElementById("hasil").scrollIntoView({ behavior: 'smooth' });

    try {
        await fetch(window.Quiz_API, {
            method: "POST",
            body: JSON.stringify({
                nisn: window.dataSiswaQuiz.nisn,
                nama: window.dataSiswaQuiz.nama,
                kelas: window.dataSiswaQuiz.kelas,
                pelajaran: window.mataPelajaranTerpilih,
                nilai: nilai,
                status: status
            })
        });
    } catch(e) {
        console.error("Gagal mengirim hasil ujian:", e);
    }
}

/* =========================================================================
   FITUR REKAP NAMA, KELAS, DAN MAPEL
   ========================================================================= */

function ambilDataNilai() {
  const selectKelas = document.getElementById("filterDaftarKelas");
  if(selectKelas) selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
  
  resetDropdownMapel();
  resetDropdownSiswa();

  fetch(`${window.Quiz_API}?aksi=getDaftarNilai`, { method: "GET", redirect: "follow" })
    .then(res => res.json())
    .then(data => {
      window.masterDaftarNilai = data.nilaiSiswa || [];
      return fetch(`${window.Quiz_API}?aksi=getKelas`, { method: "GET", redirect: "follow" });
    })
    .then(res => res.json())
    .then(data => {
      const selectKelas = document.getElementById("filterDaftarKelas");
      if (!selectKelas) return;

      if (!data || !data.kelas || data.kelas.length === 0) {
        selectKelas.innerHTML = '<option value="">-- Kelas Tidak Ditemukan --</option>';
        return;
      }

      data.kelas.forEach(kelas => {
        selectKelas.innerHTML += `<option value="${kelas}">${kelas}</option>`;
      });
      
      tampilkanNilaiSpesifik();
    })
    .catch(err => console.error("Gagal memuat rekap nilai:", err));
}

function handleKelasChange() {
  const kelasPilihan = document.getElementById("filterDaftarKelas").value;
  
  resetDropdownMapel();
  resetDropdownSiswa();

  if (!kelasPilihan) {
    tampilkanNilaiSpesifik();
    return;
  }

  fetch(`${window.Quiz_API}?aksi=getPelajaranByKelas&kelas=${encodeURIComponent(kelasPilihan)}`)
    .then(res => res.json())
    .then(data => {
      const selectMapel = document.getElementById("filterDaftarMapel");
      if(!selectMapel) return;
      selectMapel.disabled = false;
      
      data.pelajaran.forEach(mapel => {
        selectMapel.innerHTML += `<option value="${mapel}">${mapel}</option>`;
      });
    })
    .catch(err => console.error("Gagal memuat pelajaran rekap:", err));

  tampilkanNilaiSpesifik();
}

function handleMapelChange() {
  const kelasPilihan = document.getElementById("filterDaftarKelas").value;
  const mapelPilihan = document.getElementById("filterDaftarMapel").value;
  
  resetDropdownSiswa();

  if (!mapelPilihan) {
    tampilkanNilaiSpesifik();
    return;
  }

  fetch(`${window.Quiz_API}?aksi=getSiswaByKelas&kelas=${encodeURIComponent(kelasPilihan)}`)
    .then(res => res.json())
    .then(data => {
      const selectSiswa = document.getElementById("filterDaftarSiswa");
      if(!selectSiswa) return;
      selectSiswa.disabled = false;
      
      data.siswa.forEach(siswa => {
        selectSiswa.innerHTML += `<option value="${siswa.nisn}">${siswa.nama}</option>`;
      });

      tampilkanNilaiSpesifik();
    })
    .catch(err => console.error("Gagal memuat daftar siswa rekap:", err));
}

function handleSiswaChange() {
  tampilkanNilaiSpesifik();
}

function resetDropdownSiswa() {
  const s = document.getElementById("filterDaftarSiswa");
  if(s) { s.innerHTML = '<option value="">-- Pilih Nama --</option>'; s.disabled = true; }
}

function resetDropdownMapel() {
  const m = document.getElementById("filterDaftarMapel");
  if(m) { m.innerHTML = '<option value="">-- Pilih Mapel --</option>'; m.disabled = true; }
}

function tampilkanNilaiSpesifik() {
  const kelasPilihan = document.getElementById("filterDaftarKelas").value;
  const nisnPilihan = document.getElementById("filterDaftarSiswa").value;
  const mapelPilihan = document.getElementById("filterDaftarMapel").value;
  
  const bodyTabel = document.getElementById("bodyTabelNilai");
  if (!bodyTabel) return;

  if (!kelasPilihan) {
    bodyTabel.innerHTML = `<tr><td colspan="6" class="text-center data-kosong">Silahkan pilih filter kelas untuk menampilkan data.</td></tr>`;
    return;
  }

  let dataTersaring = window.masterDaftarNilai.filter(item => {
    let cocokKelas = !kelasPilihan || String(item.kelas) === String(kelasPilihan);
    let cocokSiswa = !nisnPilihan || String(item.nisn) === String(nisnPilihan);
    let cocokMapel = !mapelPilihan || String(item.pelajaran).trim().toLowerCase() === String(mapelPilihan).trim().toLowerCase();
    return cocokKelas && cocokSiswa && cocokMapel;
  });

  if (dataTersaring.length === 0) {
    bodyTabel.innerHTML = `<tr><td colspan="6" class="text-center data-kosong">Tidak ada rekap data nilai yang cocok dengan filter.</td></tr>`;
    return;
  }

  bodyTabel.innerHTML = "";
  dataTersaring.forEach(item => {
    let kelasBadge = String(item.status).toLowerCase() === "lulus" ? "badge-sukses" : "badge-bahaya";
    
    bodyTabel.innerHTML += `
      <tr>
        <td><strong>${item.nisn}</strong></td>
        <td>${item.nama}</td>
        <td>${item.kelas}</td>
        <td>${item.pelajaran}</td>
        <td><strong>${item.nilai}</strong></td>
        <td><span class="badge ${kelasBadge}">${String(item.status).toUpperCase()}</span></td>
      </tr>
    `;
  });
}

function initApp() {
    const selectKelasKuis = document.getElementById("selectKelas");

    if (selectKelasKuis) {
        loadKelas();
    } else {
        setTimeout(() => { if(document.getElementById("selectKelas")) loadKelas(); }, 500);
    }
}

if (document.readyState === "complete" || document.readyState === "interactive") {
    initApp();
} else {
    window.addEventListener("load", initApp);
}

// Export fungsi global
window.tampilkanNilaiSpesifik = tampilkanNilaiSpesifik;
window.cetakHasilLatihan = cetakHasilLatihan;
window.pindahSoal = pindahSoal;
window.simpanJawabanPG = simpanJawabanPG;
window.simpanJawabanIsian = simpanJawabanIsian;
window.toggleRagu = toggleRagu;
window.koreksi = koreksi;

function cetakRekapNilai() {
    const kelasPilihan = document.getElementById("filterDaftarKelas").value;
    const mapelPilihan = document.getElementById("filterDaftarMapel").value;
    const isiTabel = document.getElementById("bodyTabelNilai").innerHTML;

    if (!kelasPilihan) {
        alert("Silakan pilih kelas terlebih dahulu sebelum mencetak rekap nilai!");
        return;
    }

    const jw = window.open('', '_blank');
    if (!jw) {
        alert("Popup diblokir oleh browser. Izinkan popup untuk mencetak.");
        return;
    }

    jw.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Cetak Rekap Nilai Latihan - MI Miftahul Mubtadiin</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #000; font-size: 13px; background: #fff; }
                .kop-table { width: 100%; border-bottom: 4px double #000; padding-bottom: 8px; margin-bottom: 20px; }
                .kop-logo { width: 65px; height: auto; }
                .kop-text { text-align: center; }
                .kop-yayasan { font-size: 14px; font-weight: bold; text-transform: uppercase; margin: 0; }
                .kop-sekolah { font-size: 17px; font-weight: bold; color: #0056b3; text-transform: uppercase; margin: 2px 0; }
                .kop-alamat-1 { font-size: 12px; font-weight: bold; color: #d9534f; text-transform: uppercase; margin: 0; }
                .kop-alamat-2 { font-size: 12px; font-weight: bold; margin: 1px 0; }
                .kop-nsm { font-size: 10px; font-weight: bold; margin-top: 3px; }
                .kop-kontak { font-size: 10px; margin-top: 1px; }

                h3 { text-align: center; margin-bottom: 5px; text-transform: uppercase; }
                .info-filter { text-align: center; font-size: 12px; margin-bottom: 15px; color: #555; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #333; padding: 8px 10px; font-size: 12px; text-align: left; }
                th { background-color: #f2f2f2; text-align: center; }
                .text-center { text-align: center; }
                
                .badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; display: inline-block; }
                .badge-sukses, .badge.badge-sukses { background-color: #d1e7dd; color: #0f5132; }
                .badge-bahaya, .badge.badge-bahaya { background-color: #f8d7da; color: #842029; }
            </style>
        </head>
        <body>
            <table class="kop-table">
                <tr>
                    <td style="width: 80px; vertical-align: middle; text-align: center;">
                        <img src="https://iili.io/CAZVdsj.png" class="kop-logo" alt="Logo">
                    </td>
                    <td class="kop-text">
                        <div class="kop-yayasan">YAYASAN FATAHILLAH</div>
                        <div class="kop-sekolah">MADRASAH IBTIDAIYAH MIFTAHUL MUBTADIIN</div>
                        <div class="kop-alamat-1">JAGAPURA WETAN KECAMATAN GEGESIK KABUPATEN CIREBON</div>
                        <div class="kop-alamat-2">TERAKREDITASI "B"</div>
                        <div class="kop-nsm">NSM : 111.2.32.09.0101 &nbsp;&nbsp; NPSN : 60708624 &nbsp;&nbsp; NO. IJOP Kd.10.09/4/PP.00.4/227/2010</div>
                        <div class="kop-kontak">Alamat : Jl. Raya Jagapura Wetan No. 105 Gegesik - Cirebon Telp. (0234) 484760 Kode Pos 45164</div>
                    </td>
                </tr>
            </table>

            <h3>REKAPITULASI NILAI LATIHAN / UJIAN SISWA</h3>
            <div class="info-filter">
                Kelas: <b>${kelasPayloadText(kelasPilihan)}</b> | Mata Pelajaran: <b>${mapelPilihan || 'Semua Mata Pelajaran'}</b>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 15%;">NISN</th>
                        <th style="width: 35%;">Nama Siswa</th>
                        <th style="width: 15%;">Kelas</th>
                        <th style="width: 20%;">Mata Pelajaran</th>
                        <th style="width: 7%;">Nilai</th>
                        <th style="width: 8%;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${isiTabel}
                </tbody>
            </table>

            <script>
                setTimeout(function() {
                    window.print();
                }, 800);
            </script>
        </body>
        </html>
    `);
    jw.document.close();
}

function kelasPayloadText(val) {
    return val ? val : "-";
}

window.cetakRekapNilai = cetakRekapNilai;
