/* =========================================================================
   FITUR UTAMA KUIS: TATAP MUKA (TKA MODERN), TIMER, PROTEKSI, & PENGUNCIAN
   ========================================================================= */

// Deklarasi variabel global
if (typeof window.dataSiswaQuiz === 'undefined') { window.dataSiswaQuiz = null; }
if (typeof window.dataSoal === 'undefined') { window.dataSoal = []; }
if (typeof window.mataPelajaranTerpilih === 'undefined') { window.mataPelajaranTerpilih = ""; }
if (typeof window.masterDaftarNilai === 'undefined') { window.masterDaftarNilai = []; }

// State Ujian TKA
if (typeof window.soalAktifIndex === 'undefined') { window.soalAktifIndex = 0; }
if (typeof window.jawabanSiswa === 'undefined') { window.jawabanSiswa = {}; }
if (typeof window.statusRagu === 'undefined') { window.statusRagu = {}; }
if (typeof window.timerInterval === 'undefined') { window.timerInterval = null; }
if (typeof window.sisaDetik === 'undefined') { window.sisaDetik = 0; }
if (typeof window.isUjianSelesai === 'undefined') { window.isUjianSelesai = false; }
if (typeof window.jumlahPeringatanTab === 'undefined') { window.jumlahPeringatanTab = 0; }

// 1. Ambil daftar kelas
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

// 4. Proses Login Utama Ujian TKA
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

    document.getElementById("siswa").innerHTML = "<p>Memuat lembar soal TKA...</p>";

    try {
        const res = await fetch(window.Quiz_API + `?aksi=loginQuiz&nisn=${encodeURIComponent(passwordNisn)}&pelajaran=${encodeURIComponent(window.mataPelajaranTerpilih)}`, { method: "GET", redirect: "follow" });
        const data = await res.json();
        
        if (data.error) { alert(data.message || data.error); return; }

        if (data.sudahMengerjakan) {
            alert("Anda sudah menyelesaikan ujian mata pelajaran ini!");
            location.reload();
            return;
        }

        window.dataSiswaQuiz = data.siswa;
        window.dataSoal = data.soal; 
        
        window.soalAktifIndex = 0;
        window.jawabanSiswa = {};
        window.statusRagu = {};
        window.isUjianSelesai = false;
        window.jumlahPeringatanTab = 0;

        let durasiMenit = data.durasiMenit || 60; 
        window.sisaDetik = durasiMenit * 60;

        tampilSiswaQuiz();
        mulaiTimerUjian();
        mulaiProteksiKeamanan();
        tampilSoalTKA();
    } catch (err) { 
        alert("Gagal menyambung ke server kuis."); 
    }
}

function tampilSiswaQuiz(){
    document.getElementById("areaLogin").classList.add("hidden");
    document.getElementById("areaKuis").classList.remove("hidden");
    document.getElementById("siswa").innerHTML = `
        <div class="quiz-student-header">
            <div class="quiz-student-info">
                <img src="${window.dataSiswaQuiz.foto || 'https://via.placeholder.com/150'}" alt="Foto Siswa" class="quiz-student-avatar">
                <div>
                    <h3 class="quiz-student-name">${window.dataSiswaQuiz.nama || '-'}</h3>
                    <p class="quiz-student-meta">
                        <span>${window.dataSiswaQuiz.kelas}</span> • Mapel: <strong>${window.mataPelajaranTerpilih}</strong>
                    </p>
                </div>
            </div>
            <div id="boxTimerUjian" class="quiz-timer-badge">
                <span class="timer-icon">⏱️</span> 
                <span class="timer-text">Sisa Waktu: <strong id="textTimer">--:--</strong></span>
            </div>
        </div>
    `;
}

function mulaiTimerUjian() {
    if (window.timerInterval) clearInterval(window.timerInterval);

    window.timerInterval = setInterval(() => {
        if (window.sisaDetik <= 0) {
            clearInterval(window.timerInterval);
            alert("Waktu ujian telah habis! Sistem akan mengirim jawaban Anda secara otomatis.");
            koreksi(true);
            return;
        }

        window.sisaDetik--;
        let menit = Math.floor(window.sisaDetik / 60);
        let detik = window.sisaDetik % 60;

        let formatWaktu = `${String(menit).padStart(2, '0')}:${String(detik).padStart(2, '0')}`;
        let elTimer = document.getElementById("textTimer");
        if (elTimer) elTimer.textContent = formatWaktu;
    }, 1000);
}

function mulaiProteksiKeamanan() {
    document.addEventListener("visibilitychange", handleVisibilityChange);
}

function handleVisibilityChange() {
    if (document.hidden && !window.isUjianSelesai) {
        window.jumlahPeringatanTab++;
        if (window.jumlahPeringatanTab <= 3) {
            alert(`⚠️ PERINGATAN KEAMANAN (${window.jumlahPeringatanTab}/3)!\nAnda terdeteksi keluar dari halaman ujian!`);
        } else {
            alert("⚠️ Anda melanggar aturan keamanan berulang kali. Ujian Anda diserahkan otomatis!");
            koreksi(true);
        }
    }
}

function hentikanProteksiKeamanan() {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    if (window.timerInterval) clearInterval(window.timerInterval);
}

/* =========================================================================
   FUNGSI BANTUAN: MERAPIKAN FORMAT TEKS SOAL
   ========================================================================= */
function rapikanTeksSoal(teks) {
    if (!teks) return "";
    let bersih = String(teks).trim();
    
    // Memperbaiki spasi ganda
    bersih = bersih.replace(/\s+/g, ' ');
    
    // Memberikan spasi yang benar setelah tanda baca titik, koma, tanya, atau seru jika tertempel
    bersih = bersih.replace(/([.,?!])([^\s\d])/g, '$1 $2');
    
    // Merapikan format baris baru (jika ada string \n)
    bersih = bersih.replace(/\\n/g, '<br>');

    return bersih;
}

/* =========================================================================
   RENDER TATAP MUKA SISWA (SOAL & TIPE SOAL TKA)
   ========================================================================= */
function tampilSoalTKA() {
    if (window.isUjianSelesai) return;

    if (!window.dataSoal || window.dataSoal.length === 0) {
        document.getElementById("quiz").innerHTML = `<div class="rbm-empty-state">Belum tersedia soal untuk mata pelajaran ini.</div>`;
        return;
    }

    let totalSoal = window.dataSoal.length;
    let idx = window.soalAktifIndex;
    let s = window.dataSoal[idx];
    let nomorSoal = idx + 1;

    let jenisSoal = (s.jenis || s.type || "PG").toUpperCase();

    let jenisBadgeMap = {
        'PG': 'Pilihan Ganda',
        'PILGAN': 'Pilihan Ganda',
        'PGK_L1': 'Pilihan Ganda Kompleks (Centang)',
        'PGK_CENTANG': 'Pilihan Ganda Kompleks (Centang)',
        'PGK_BS': 'Benar / Salah',
        'PGK_TABEL': 'Benar / Salah',
        'BENAR_SALAH': 'Benar / Salah',
        'MENJODOHKAN': 'Menjodohkan',
        'ISIAN': 'Isian Singkat'
    };
    let labelJenis = jenisBadgeMap[jenisSoal] || jenisSoal;

    // Render Gambar Soal Utama dengan Inline Style Mutlak agar Tidak Terpotong
    let gambarHtml = "";
    if (s.gambar && s.gambar.trim() !== "") {
        gambarHtml = `
            <div class="quiz-media-container" style="overflow: visible !important; height: auto !important;">
                <img src="${s.gambar}" alt="Gambar Soal ${nomorSoal}" class="quiz-media-img" style="display: block !important; width: 100% !important; max-width: 100% !important; height: auto !important; max-height: none !important; object-fit: contain !important; margin: 0 auto !important;">
            </div>
        `;
    }

    let inputHtml = "";
    let jawSimpan = window.jawabanSiswa[idx];

    // --- 1. SOAL PILIHAN GANDA (PG) ---
    if (jenisSoal === "PG" || jenisSoal === "PILGAN") {
        let opsiList = ['A', 'B', 'C', 'D', 'E'];
        inputHtml = `<div class="quiz-options-wrapper">`;
        opsiList.forEach(huruf => {
            if (s[huruf] || s['gambar' + huruf]) {
                let checked = (jawSimpan === huruf) ? "checked" : "";
                let imgOpsiHtml = s['gambar' + huruf] ? `
                    <div class="quiz-option-img-box" style="overflow: visible !important; height: auto !important;">
                        <img src="${s['gambar' + huruf]}" class="quiz-option-img" style="display: block !important; width: 100% !important; max-width: 100% !important; height: auto !important; max-height: none !important; object-fit: contain !important; margin-top: 6px;">
                    </div>` : "";
                let teksOpsiRapi = rapikanTeksSoal(s[huruf] || '');
                inputHtml += `
                <label class="quiz-option-card ${checked ? 'active' : ''}">
                    <input type="radio" name="qTKA" value="${huruf}" ${checked} onchange="simpanJawabanPG('${huruf}')">
                    <span class="quiz-option-bullet">${huruf}</span>
                    <div class="quiz-option-content">
                        <span>${teksOpsiRapi}</span>
                        ${imgOpsiHtml}
                    </div>
                </label>`;
            }
        });
        inputHtml += `</div>`;
    }
    // --- 2. PILIHAN GANDA KOMPLEKS - CENTANG ---
    else if (jenisSoal === "PGK_L1" || jenisSoal === "PGK_CENTANG") {
        let arrJaw = Array.isArray(jawSimpan) ? jawSimpan : [];
        let opsiList = ['A', 'B', 'C', 'D', 'E'];
        
        inputHtml = `
            <div class="quiz-options-wrapper">
                <div class="quiz-instruction-banner">
                    📌 <strong>Petunjuk:</strong> Pilihlah satu atau beberapa jawaban yang Anda anggap benar.
                </div>
                <div class="quiz-options-list">`;
        
        opsiList.forEach(huruf => {
            if (s[huruf] || s['gambar' + huruf]) {
                let checked = arrJaw.includes(huruf) ? "checked" : "";
                let imgOpsiHtml = s['gambar' + huruf] ? `
                    <div class="quiz-option-img-box" style="overflow: visible !important; height: auto !important;">
                        <img src="${s['gambar' + huruf]}" class="quiz-option-img" style="display: block !important; width: 100% !important; max-width: 100% !important; height: auto !important; max-height: none !important; object-fit: contain !important; margin-top: 6px;">
                    </div>` : "";
                let teksOpsiRapi = rapikanTeksSoal(s[huruf] || '');
                
                inputHtml += `
                <label class="quiz-option-card checkbox-card ${checked ? 'active-checkbox' : ''}">
                    <input type="checkbox" value="${huruf}" ${checked} onchange="simpanJawabanPGKCentang('${huruf}', this.checked)">
                    <span class="quiz-option-bullet">${huruf}</span>
                    <div class="quiz-option-content">
                        <span>${teksOpsiRapi}</span>
                        ${imgOpsiHtml}
                    </div>
                </label>`;
            }
        });
        
        inputHtml += `</div></div>`;
    }
    // --- 3. PILIHAN GANDA KOMPLEKS - BENAR / SALAH ---
    else if (jenisSoal === "PGK_BS" || jenisSoal === "PGK_TABEL" || jenisSoal === "BENAR_SALAH") {
        let objJaw = (typeof jawSimpan === 'object' && jawSimpan !== null) ? jawSimpan : {};
        let pernyataanList = s.pernyataan || [];
        
        inputHtml = `
            <div class="quiz-table-wrapper">
                <div class="quiz-instruction-banner">
                    📌 <strong>Petunjuk:</strong> Tentukan status Benar atau Salah untuk setiap pernyataan berikut.
                </div>
                <table class="quiz-custom-table">
                    <thead>
                        <tr>
                            <th>Pernyataan</th>
                            <th class="text-center" style="width: 90px;">Benar</th>
                            <th class="text-center" style="width: 90px;">Salah</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        pernyataanList.forEach((p, pIdx) => {
            let val = objJaw[pIdx] || "";
            let pernyataanRapi = rapikanTeksSoal(p);
            inputHtml += `
                <tr>
                    <td class="quiz-table-statement">${pernyataanRapi}</td>
                    <td class="text-center">
                        <label class="quiz-table-radio">
                            <input type="radio" name="bs_${pIdx}" value="B" ${val === 'B' ? 'checked' : ''} onchange="simpanJawabanBS(${pIdx}, 'B')">
                            <span class="radio-custom-b">B</span>
                        </label>
                    </td>
                    <td class="text-center">
                        <label class="quiz-table-radio">
                            <input type="radio" name="bs_${pIdx}" value="S" ${val === 'S' ? 'checked' : ''} onchange="simpanJawabanBS(${pIdx}, 'S')">
                            <span class="radio-custom-s">S</span>
                        </label>
                    </td>
                </tr>`;
        });
        
        inputHtml += `</tbody></table></div>`;
    }
    // --- 4. MENJODOHKAN ---
    else if (jenisSoal === "MENJODOHKAN") {
        let objJaw = (typeof jawSimpan === 'object' && jawSimpan !== null) ? jawSimpan : {};
        let kiriList = s.soalKiri || [];
        let kananList = s.opsiKanan || [];

        inputHtml = `
            <div class="quiz-table-wrapper">
                <div class="quiz-instruction-banner">
                    📌 <strong>Petunjuk:</strong> Pasangkan item di sebelah kiri dengan pilihan yang tepat di sebelah kanan.
                </div>
                <table class="quiz-custom-table">
                    <thead>
                        <tr>
                            <th style="width:50%;">Pernyataan / Item</th>
                            <th style="width:50%;">Pasangan Jawaban</th>
                        </tr>
                    </thead>
                    <tbody>`;

        kiriList.forEach((kItem, kIdx) => {
            let val = objJaw[kIdx] || "";
            let selectOptions = `<option value="">-- Pilih Pasangan --</option>`;
            kananList.forEach((rItem, rIdx) => {
                let rItemRapi = rapikanTeksSoal(rItem);
                selectOptions += `<option value="${rIdx}" ${String(val) === String(rIdx) ? 'selected' : ''}>${rItemRapi}</option>`;
            });

            let kItemRapi = rapikanTeksSoal(kItem);
            inputHtml += `
                <tr>
                    <td class="quiz-table-statement"><strong>${kIdx + 1}.</strong> ${kItemRapi}</td>
                    <td>
                        <select class="quiz-select-match" onchange="simpanJawabanJodoh(${kIdx}, this.value)">
                            ${selectOptions}
                        </select>
                    </td>
                </tr>`;
        });

        inputHtml += `</tbody></table></div>`;
    }
    // --- 5. ISIAN / ESAI ---
    else {
        inputHtml = `
            <div class="quiz-essay-wrapper">
                <label class="quiz-essay-label">Jawaban Singkat Anda:</label>
                <textarea id="inputIsianTKA" class="quiz-essay-input" rows="3" oninput="simpanJawabanIsian(this.value)" placeholder="Ketik jawaban Anda secara singkat dan jelas di sini...">${jawSimpan || ''}</textarea>
            </div>
        `;
    }

    let gridNomorHtml = window.dataSoal.map((_, i) => {
        let isAktif = i === idx ? 'active-nav' : '';
        let statusClass = 'nav-unanswered';

        let jVal = window.jawabanSiswa[i];
        let terisi = false;
        if (Array.isArray(jVal)) terisi = jVal.length > 0;
        else if (typeof jVal === 'object' && jVal !== null) terisi = Object.keys(jVal).length > 0;
        else if (jVal !== undefined && jVal !== "") terisi = true;

        if (window.statusRagu[i]) {
            statusClass = 'nav-ragu';
        } else if (terisi) {
            statusClass = 'nav-answered';
        }

        return `<button onclick="pindahSoal(${i})" class="quiz-nav-btn ${statusClass} ${isAktif}">${i + 1}</button>`;
    }).join("");

    let isRagu = window.statusRagu[idx] ? "checked" : "";
    let teksSoalRapi = rapikanTeksSoal(s.soal);

    let containerHtml = `
        <div class="quiz-main-grid">
            <div class="quiz-question-card" style="overflow: visible !important;">
                <div class="quiz-question-header">
                    <div class="quiz-number-tag">
                        Soal No. <strong>${nomorSoal}</strong> <span class="quiz-total-count">/ ${totalSoal}</span>
                    </div>
                    <span class="quiz-type-badge">${labelJenis}</span>
                </div>
                
                <div class="quiz-question-body" style="overflow: visible !important;">
                    ${teksSoalRapi}
                </div>
                
                ${gambarHtml}
                ${inputHtml}

                <div class="quiz-footer-actions">
                    <button type="button" class="btn-quiz-prev" onclick="pindahSoal(${idx - 1})" ${idx === 0 ? 'disabled' : ''}>
                        ⬅️ Sebelumnya
                    </button>
                    
                    <label class="quiz-ragu-checkbox ${isRagu ? 'active-ragu' : ''}">
                        <input type="checkbox" onchange="toggleRagu(${idx})" ${isRagu}>
                        <span>🟡 Ragu-Ragu</span>
                    </label>

                    ${idx < totalSoal - 1 
                        ? `<button type="button" class="btn-quiz-next" onclick="pindahSoal(${idx + 1})">Berikutnya ➡️</button>`
                        : `<button type="button" id="btnKirimQuiz" class="btn-quiz-finish" onclick="koreksi(false)">🚀 Selesai & Kirim</button>`
                    }
                </div>
            </div>

            <div class="quiz-sidebar-card">
                <div class="quiz-sidebar-title">Navigasi Soal</div>
                <div class="quiz-nav-grid">
                    ${gridNomorHtml}
                </div>
                <div class="quiz-legend-box">
                    <div class="legend-item"><span class="legend-color legend-answered"></span> Sudah Dijawab</div>
                    <div class="legend-item"><span class="legend-color legend-ragu"></span> Ragu-Ragu</div>
                    <div class="legend-item"><span class="legend-color legend-unanswered"></span> Belum Dijawab</div>
                </div>
            </div>
        </div>
    `;

    document.getElementById("quiz").innerHTML = containerHtml;
}

function simpanJawabanPG(val) {
    if (window.isUjianSelesai) return;
    window.jawabanSiswa[window.soalAktifIndex] = val;
    tampilSoalTKA();
}

function simpanJawabanPGKCentang(val, checked) {
    if (window.isUjianSelesai) return;
    let idx = window.soalAktifIndex;
    let list = Array.isArray(window.jawabanSiswa[idx]) ? window.jawabanSiswa[idx] : [];
    
    if (checked) {
        if (!list.includes(val)) list.push(val);
    } else {
        list = list.filter(v => v !== val);
    }
    
    window.jawabanSiswa[idx] = list;
    tampilSoalTKA();
}

function simpanJawabanBS(pIdx, val) {
    if (window.isUjianSelesai) return;
    let idx = window.soalAktifIndex;
    let obj = (typeof window.jawabanSiswa[idx] === 'object' && window.jawabanSiswa[idx] !== null && !Array.isArray(window.jawabanSiswa[idx])) ? window.jawabanSiswa[idx] : {};
    obj[pIdx] = val;
    window.jawabanSiswa[idx] = obj;
}

function simpanJawabanJodoh(kIdx, val) {
    if (window.isUjianSelesai) return;
    let idx = window.soalAktifIndex;
    let obj = (typeof window.jawabanSiswa[idx] === 'object' && window.jawabanSiswa[idx] !== null && !Array.isArray(window.jawabanSiswa[idx])) ? window.jawabanSiswa[idx] : {};
    obj[kIdx] = val;
    window.jawabanSiswa[idx] = obj;
}

function simpanJawabanIsian(val) {
    if (window.isUjianSelesai) return;
    window.jawabanSiswa[window.soalAktifIndex] = val.trim();
}

function toggleRagu(idx) {
    if (window.isUjianSelesai) return;
    window.statusRagu[idx] = !window.statusRagu[idx];
    tampilSoalTKA();
}

function pindahSoal(targetIndex) {
    if (window.isUjianSelesai) return;
    if (targetIndex >= 0 && targetIndex < window.dataSoal.length) {
        window.soalAktifIndex = targetIndex;
        tampilSoalTKA();
    }
}

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
                #boxTimerUjian, button, .tka-nav-box { display: none !important; }
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

async function koreksi(isOtomatis = false) {
    if (window.isUjianSelesai) return;

    if (!isOtomatis) {
        if (!confirm("Apakah Anda yakin ingin menyelesaikan dan mengirim jawaban? Ujian akan dikunci secara permanen.")) {
            return;
        }
    }

    window.isUjianSelesai = true;
    hentikanProteksiKeamanan();

    let boxTimer = document.getElementById("boxTimerUjian");
    if(boxTimer) boxTimer.style.display = "none";

    let totalSkorDiperoleh = 0;
    let totalSkorMaksimal = 0;

    window.dataSoal.forEach((s, index) => {
        let jenisSoal = (s.jenis || s.type || "PG").toUpperCase();
        let jUser = window.jawabanSiswa[index];
        let bobot = s.bobot || 1;

        if (jenisSoal === "PG" || jenisSoal === "PILGAN") {
            totalSkorMaksimal += bobot;
            if (String(jUser).toLowerCase() === String(s.jawaban).toLowerCase()) {
                totalSkorDiperoleh += bobot;
            }
        } else if (jenisSoal === "PGK_L1" || jenisSoal === "PGK_CENTANG") {
            totalSkorMaksimal += bobot;
            let kunciArr = Array.isArray(s.jawaban) ? s.jawaban : String(s.jawaban).split(",");
            let userArr = Array.isArray(jUser) ? jUser : [];
            let benarSemua = kunciArr.length === userArr.length && kunciArr.every(v => userArr.includes(v));
            if (benarSemua) totalSkorDiperoleh += bobot;
        } else if (jenisSoal === "PGK_BS" || jenisSoal === "BENAR_SALAH") {
            let kunciObj = s.jawaban || {};
            let userObj = (typeof jUser === 'object' && jUser !== null) ? jUser : {};
            let totalPernyataaan = (s.pernyataan || []).length || 1;
            totalSkorMaksimal += bobot;

            let hitungBenar = 0;
            Object.keys(kunciObj).forEach(k => {
                if (userObj[k] === kunciObj[k]) hitungBenar++;
            });
            totalSkorDiperoleh += (hitungBenar / totalPernyataaan) * bobot;
        } else {
            totalSkorMaksimal += bobot;
            if (String(jUser).trim().toLowerCase() === String(s.jawaban).trim().toLowerCase()) {
                totalSkorDiperoleh += bobot;
            }
        }
    });

    let nilai = totalSkorMaksimal > 0 ? Math.round((totalSkorDiperoleh / totalSkorMaksimal) * 100) : 0;
    let isLulus = nilai >= 75;
    let status = isLulus ? "LULUS" : "BELUM LULUS";
    
    let rekapSoalSelesaiHtml = window.dataSoal.map((s, index) => {
        let jUser = window.jawabanSiswa[index];
        let teksUser = JSON.stringify(jUser) || "-";
        let soalRapiRekap = rapikanTeksSoal(s.soal);
        let penjelasanRapi = rapikanTeksSoal(s.penjelasan || '-');
        return `
            <div style="margin-bottom: 15px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; background: #fff;">
                <b>${index + 1}. ${soalRapiRekap}</b>
                <p style="margin: 5px 0 0 0; font-size: 13px; color: #333;">Jawaban Anda: <b>${teksUser}</b> | Kunci: <span style="color: green; font-weight: bold;">${JSON.stringify(s.jawaban)}</span></p>
                <div style="font-size: 12px; color: #555; margin-top: 4px;">💡 <b>Pembahasan:</b> ${penjelasanRapi}</div>
            </div>
        `;
    }).join("");

    document.getElementById("quiz").innerHTML = `
        <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:15px; margin-bottom:15px;">
            <h4 style="margin:0 0 10px 0; color:#1e293b;">🔒 Ujian Telah Dikunci & Selesai</h4>
            <p style="margin:0; font-size:13px; color:#475569;">Anda sudah mengirimkan lembar jawaban. Lembar soal di bawah ini bersifat arsip dan tidak dapat diubah kembali.</p>
        </div>
        ${rekapSoalSelesaiHtml}
    `;

    document.getElementById("hasil").innerHTML = `
        <div class="cardHasil ${isLulus ? 'lulus' : 'gagal'}">
            <div class="score-big ${isLulus ? 'lulus' : 'gagal'}">${nilai}</div>
            <div class="badge-status ${isLulus ? 'lulus' : 'gagal'}">${status}</div>
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

window.tampilkanNilaiSpesifik = tampilkanNilaiSpesifik;
window.cetakHasilLatihan = cetakHasilLatihan;
window.pindahSoal = pindahSoal;
window.simpanJawabanPG = simpanJawabanPG;
window.simpanJawabanPGKCentang = simpanJawabanPGKCentang;
window.simpanJawabanBS = simpanJawabanBS;
window.simpanJawabanJodoh = simpanJawabanJodoh;
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
