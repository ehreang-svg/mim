/* =========================================================================
   FITUR UTAMA KUIS: AMBIL DATA DARI APP SCRIPT & RENDER KE HTML
   ========================================================================= */

// Variabel penampung data kuis global
let dataSiswaQuiz = null;
let mataPelajaranTerpilih = "";

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
            console.log("Dropdown kelas kuis sukses diisi.");
        }
    } catch (err) {
        console.error("Gagal memuat kelas kuis:", err);
    }
}

// Trigger gabungan saat kelas di halaman kuis diubah
function AksiPilihKelas() {
    loadSiswa();
    loadPelajaran();
} 

// 2. Ambil daftar siswa berdasarkan kelas (Halaman Kuis)
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

// 3. Ambil mata pelajaran berdasarkan kelas (Halaman Kuis)
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

// 4. Proses Login Utama Kuis
async function mulai() {
    const selectSiswa = document.getElementById("selectSiswa");
    const selectPelajaran = document.getElementById("selectPelajaran");
    const passwordNisn = document.getElementById("passwordNisn").value.trim();
    
    const nisnTerpilih = selectSiswa.value;
    mataPelajaranTerpilih = selectPelajaran.value;

    if (!nisnTerpilih || !mataPelajaranTerpilih || !passwordNisn) {
        alert("Semua kolom pilihan dan password wajib diisi!");
        return;
    }
    
    if (String(passwordNisn) !== String(nisnTerpilih)) {
        alert("Password (NISN) salah untuk siswa yang Anda pilih!");
        return;
    }

    document.getElementById("siswa").innerHTML = "<p>Memuat lembar soal kuis...</p>";

    try {
        const res = await fetch(window.Quiz_API + `?aksi=loginQuiz&nisn=${encodeURIComponent(passwordNisn)}&pelajaran=${encodeURIComponent(mataPelajaranTerpilih)}`, { method: "GET", redirect: "follow" });
        const data = await res.json();
        
        if (data.error) { alert(data.message || data.error); return; }

        dataSiswaQuiz = data.siswa;
        dataSoal = data.soal; 
        
        tampilSiswaQuiz();
        tampilSoal();
    } catch (err) { 
        alert("Gagal menyambung ke server kuis."); 
    }
}

function tampilSiswaQuiz(){
    document.getElementById("areaLogin").classList.add("hidden");
    document.getElementById("areaKuis").classList.remove("hidden");
    document.getElementById("siswa").innerHTML = `
        <div class="cardQuizSiswa">
            <img src="${dataSiswaQuiz.foto || 'https://via.placeholder.com/150'}" alt="Foto Siswa">
            <div>
                <h3>${dataSiswaQuiz.nama || '-'}</h3>
                <p>${dataSiswaQuiz.kelas} | Mapel: <b>${mataPelajaranTerpilih}</b></p>
            </div>
        </div>
    `;
}

function tampilSoal(){
    let html = "";
    if (!dataSoal || dataSoal.length === 0) {
        document.getElementById("quiz").innerHTML = `<div class="rbm-empty-state">Belum tersedia soal untuk mata pelajaran ini.</div>`;
        return;
    }
    
    // index dimulai dari 0, jadi kita gunakan (index + 1) agar penomoran selalu mulai dari 1
    dataSoal.forEach((s, index) => {
        let nomorSoalMandiri = index + 1; 
        
        html += `
        <div class="cardSoal">
            <span class="soal-teks">${nomorSoalMandiri}. ${s.soal}</span>
            <label class="opsi-label" id="label-${index}-A"><input type="radio" name="q${index}" value="A"><span><b>A.</b> ${s.A}</span></label>
            <label class="opsi-label" id="label-${index}-B"><input type="radio" name="q${index}" value="B"><span><b>B.</b> ${s.B}</span></label>
            <label class="opsi-label" id="label-${index}-C"><input type="radio" name="q${index}" value="C"><span><b>C.</b> ${s.C}</span></label>
            <label class="opsi-label" id="label-${index}-D"><input type="radio" name="q${index}" value="D"><span><b>D.</b> ${s.D}</span></label>
            <div id="pembahasan${index}" class="hidden"></div>
        </div>`;
    });
    html += `<button type="button" id="btnKirimQuiz" onclick="koreksi()">🚀 Kirim Jawaban</button>`;
    document.getElementById("quiz").innerHTML = html;
}

// 5. Fungsi Cetak Hasil Latihan
function cetakHasilLatihan() {
    const areaSiswa = document.getElementById("siswa").innerHTML;
    const areaHasil = document.getElementById("hasil").innerHTML;
    const areaKuis = document.getElementById("quiz").innerHTML;

    const jw = window.open('', '', 'width=800,height=600');
    jw.document.write(`
        <html>
        <head>
            <title>Cetak Hasil Latihan Siswa</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                .cardQuizSiswa { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
                .cardQuizSiswa img { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; }
                .cardHasil { text-align: center; padding: 15px; border: 1px solid #ccc; border-radius: 8px; margin-top: 20px; }
                .score-big { font-size: 32px; font-weight: bold; }
                .badge-status { font-size: 16px; font-weight: bold; margin-top: 5px; }
                .cardSoal { margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px; }
                .benar-pilihan { background-color: #d1e7dd; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
                .salah-pilihan { background-color: #f8d7da; padding: 2px 6px; border-radius: 4px; text-decoration: line-through; }
                .pembahasan-box { background: #f8f9fa; padding: 8px; margin-top: 8px; font-size: 12px; border-left: 3px solid #0d6efd; }
                button, #btnKirimQuiz { display: none !important; }
            </style>
        </head>
        <body>
            <h2>HASIL LATIHAN / UJIAN SISWA</h2>
            ${areaSiswa}
            <hr/>
            <div>${areaKuis}</div>
            ${areaHasil}
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `);
    jw.document.close();
}

async function koreksi(){
    let benar = 0;
    document.getElementById("btnKirimQuiz").classList.add("hidden");

    dataSoal.forEach((s, index) => {
        let pilihanUser = document.querySelector(`input[name=q${index}]:checked`);
        let nilaiPilihan = pilihanUser ? pilihanUser.value : null;
        let kunciJawaban = s.jawaban;

        document.querySelectorAll(`input[name=q${index}]`).forEach(r => r.disabled = true);

        if (nilaiPilihan === kunciJawaban) {
            benar++;
            document.getElementById(`label-${index}-${nilaiPilihan}`).classList.add("benar-pilihan");
        } else {
            if (nilaiPilihan) document.getElementById(`label-${index}-${nilaiPilihan}`).classList.add("salah-pilihan");
            document.getElementById(`label-${index}-${kunciJawaban}`).classList.add("benar-pilihan");
        }

        let boxPembahasan = document.getElementById(`pembahasan${index}`);
        boxPembahasan.innerHTML = `<div class="pembahasan-box"><b>💡 Pembahasan:</b> ${s.penjelasan || 'Tidak ada penjelasan.'}</div>`;
        boxPembahasan.classList.remove("hidden");
    });
    
    let nilai = Math.round((benar / dataSoal.length) * 100);
    let isLulus = nilai >= 75;
    let status = isLulus ? "LULUS" : "BELUM LULUS";
    
    document.getElementById("hasil").innerHTML = `
        <div class="cardHasil ${isLulus ? 'lulus' : 'gagal'}">
            <div class="score-big ${isLulus ? 'lulus' : 'gagal'}">${nilai}</div>
            <div class="badge-status ${isLulus ? 'lulus' : 'gagal'}">${status}</div>
            <br>
            <button onclick="cetakHasilLatihan()" style="background: #0d9488; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                🖨️ Cetak Hasil Latihan
            </button>
        </div>`;
    
    document.getElementById("hasil").scrollIntoView({ behavior: 'smooth' });

    try {
        await fetch(window.Quiz_API, {
            method: "POST",
            body: JSON.stringify({
                nisn: dataSiswaQuiz.nisn,
                nama: dataSiswaQuiz.nama,
                kelas: dataSiswaQuiz.kelas,
                pelajaran: mataPelajaranTerpilih,
                nilai: nilai,
                status: status
            })
        });
    } catch(e) {
        console.error("Gagal mengirim hasil ujian:", e);
    }
}

/* =========================================================================
   FITUR REKAP NAMA, KELAS, DAN MAPEL (URUTAN: KELAS -> MAPEL -> NAMA)
   ========================================================================= */

let masterDaftarNilai = []; 

function ambilDataNilai() {
  const selectKelas = document.getElementById("filterDaftarKelas");
  if(selectKelas) selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
  
  resetDropdownMapel();
  resetDropdownSiswa();

  fetch(`${window.Quiz_API}?aksi=getDaftarNilai`, { method: "GET", redirect: "follow" })
    .then(res => res.json())
    .then(data => {
      masterDaftarNilai = data.nilaiSiswa || [];
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

// 1. Ketika Kelas dipilih: Ambil Mapel dan aktifkan dropdown Mapel terlebih dahulu
function handleKelasChange() {
  const kelasPilihan = document.getElementById("filterDaftarKelas").value;
  
  resetDropdownMapel();
  resetDropdownSiswa();

  if (!kelasPilihan) {
    tampilkanNilaiSpesifik();
    return;
  }

  // Ambil pelajaran berdasarkan kelas
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

// 2. Ketika Mapel dipilih: Ambil data Siswa berdasarkan kelas dan aktifkan dropdown Nama
function handleMapelChange() {
  const kelasPilihan = document.getElementById("filterDaftarKelas").value;
  const mapelPilihan = document.getElementById("filterDaftarMapel").value;
  
  resetDropdownSiswa();

  if (!mapelPilihan) {
    tampilkanNilaiSpesifik();
    return;
  }

  // Ambil daftar siswa berdasarkan kelas
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

// 3. Ketika Nama/Siswa dipilih: Hanya menyaring tampilan tabel
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

  let dataTersaring = masterDaftarNilai.filter(item => {
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

// Inisialisasi DOM pencarian elemen dengan fallback anti-kosong
function initApp() {
    const selectKelasKuis = document.getElementById("selectKelas");

    if (selectKelasKuis) {
        loadKelas();
    } else {
        setTimeout(() => { if(document.getElementById("selectKelas")) loadKelas(); }, 500);
    }
}

// listener load halaman
if (document.readyState === "complete" || document.readyState === "interactive") {
    initApp();
} else {
    window.addEventListener("load", initApp);
}

window.tampilkanNilaiSpesifik = tampilkanNilaiSpesifik;
window.cetakHasilLatihan = cetakHasilLatihan;
