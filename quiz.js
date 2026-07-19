/* =========================================================================
   FITUR UTAMA KUIS: AMBIL DATA DARI APP SCRIPT & RENDER KE HTML
   ========================================================================= */

// 1. Fungsi mengambil daftar kelas dari spreadsheet
async function loadKelas() {
    try {
        const selectKelas = document.getElementById("selectKelas");
        if (!selectKelas) return;

        const urlAPI = window.Quiz_API;
        if (!urlAPI) {
            console.error("window.Quiz_API belum terdefinisi. Periksa urutan file skrip Anda.");
            return;
        }

        console.log("Memanggil URL:", urlAPI + "?aksi=getKelas");
        
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
        console.error("Gagal total memuat kelas kuis:", err);
    }
}

// Trigger gabungan saat kelas diubah
function AksiPilihKelas() {
    loadSiswa();
    loadPelajaran();
} 

// 2. Ambil daftar siswa berdasarkan kelas
async function loadSiswa() {
    const kelas = document.getElementById("selectKelas").value;
    const selectSiswa = document.getElementById("selectSiswa");
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

// 3. Ambil mata pelajaran yang tersedia berdasarkan kelas
async function loadPelajaran() {
    const kelas = document.getElementById("selectKelas").value;
    const selectPelajaran = document.getElementById("selectPelajaran");
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

// 4. Proses Login Utama
async function mulai() {
    const selectSiswa = document.getElementById("selectSiswa");
    const selectPelajaran = document.getElementById("selectPelajaran");
    const passwordNisn = document.getElementById("passwordNisn").value;
    
    const nisnTerpilih = selectSiswa.value;
    mataPelajaranTerpilih = selectPelajaran.value;

    if (!nisnTerpilih || !mataPelajaranTerpilih || !passwordNisn) {
        alert("Semua kolom pilihan dan password wajib diisi!");
        return;
    }
    if (passwordNisn !== nisnTerpilih) {
        alert("Password (NISN) salah untuk siswa yang Anda pilih!");
        return;
    }

    document.getElementById("siswa").innerHTML = "<p>Memuat lembar soal kuis...</p>";

    try {
        const res = await fetch(window.Quiz_API + `?aksi=loginQuiz&nisn=${passwordNisn}&pelajaran=${encodeURIComponent(mataPelajaranTerpilih)}`, { method: "GET", redirect: "follow" });
        const data = await res.json();
        
        if (data.error) { alert(data.error); return; }

        dataSiswaQuiz = data.siswa;
        dataSoal = data.soal; // Langsung mengisi variabel global dari include.js tanpa 'let'
        
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
            <img src="${dataSiswaQuiz.foto || 'https://via.placeholder.com/150'}">
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
    dataSoal.forEach((s, index) => {
        html += `
        <div class="cardSoal">
            <span class="soal-teks">${s.no}. ${s.soal}</span>
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

async function simpanSoalBaru(event) {
    event.preventDefault();
    
    const btnSubmit = document.getElementById("btnSimpanSoal");
    if (!btnSubmit) return;
    
    const teksAsliTombol = btnSubmit.innerText;
    btnSubmit.disabled = true;
    btnSubmit.innerText = "⏳ Sedang Menyimpan...";

    const payload = {
        tipe: "tambahSoal",
        kelas: document.getElementById("inputKelas").value,
        pelajaran: document.getElementById("inputPelajaran").value,
        soal: document.getElementById("inputIsiSoal").value.trim(),
        A: document.getElementById("inputA").value.trim(),
        B: document.getElementById("inputB").value.trim(),
        C: document.getElementById("inputC").value.trim(),
        D: document.getElementById("inputD").value.trim(),
        jawaban: document.getElementById("inputJawaban").value,
        penjelasan: document.getElementById("inputPenjelasan").value.trim()
    };

    try {
        const response = await fetch(window.Quiz_API, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const hasil = await response.text();

        if (hasil === "OK_SOAL_TERSMPAN") {
            alert("🎉 Soal berhasil disimpan ke database!");
            document.getElementById("formInputSoal").reset();
        } else {
            alert("⚠️ Gagal menyimpan soal: " + hasil);
        }
    } catch (err) {
        console.error(err);
        alert("❌ Terjadi kesalahan jaringan / sistem gagal terhubung.");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = teksAsliTombol;
    }
}

/* =========================================================================
   FITUR REKAP NAMA, KELAS, DAN MAPEL DI HALAMAN REKAP NILAI SISWA
   ========================================================================= */

function ambilDataNilai() {
  const selectKelas = document.getElementById("filterDaftarKelas");
  if(selectKelas) selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
  
  resetDropdownSiswa();
  resetDropdownMapel();
  sembunyikanHasil();

  console.log("Menghubungi server Apps Script di URL:", window.Quiz_API);

  // PERBAIKAN: Menambahkan opsi redirect follow agar browser mengikuti pengalihan URL Google
  fetch(`${window.Quiz_API}?aksi=getDaftarNilai`, { method: "GET", redirect: "follow" })
    .then(res => {
      if (!res.ok) throw new Error("Respon jaringan tidak oke");
      return res.json();
    })
    .then(data => {
      masterDaftarNilai = data.nilaiSiswa || [];
      // PERBAIKAN: Menambahkan opsi redirect follow juga di sini
      return fetch(`${window.Quiz_API}?aksi=getKelas`, { method: "GET", redirect: "follow" });
    })
    .then(res => {
      if (!res.ok) throw new Error("Respon jaringan tidak oke");
      return res.json();
    })
    .then(data => {
      const selectKelas = document.getElementById("filterDaftarKelas");
      if (!selectKelas) return;

      if (!data || !data.kelas || data.kelas.length === 0) {
        console.warn("Peringatan: Tidak ditemukan list kelas di spreadsheet.");
        selectKelas.innerHTML = '<option value="">-- Kelas Tidak Ditemukan --</option>';
        return;
      }

      data.kelas.forEach(kelas => {
        selectKelas.innerHTML += `<option value="${kelas}">${kelas}</option>`;
      });
      console.log("Dropdown filter kelas berhasil diisi.");
    })
    .catch(err => {
      console.error("Gagal memuat data awal rekap nilai:", err);
    });
}
function handleKelasChange() {
  const kelasPilihan = document.getElementById("filterDaftarKelas").value;
  resetDropdownSiswa();
  resetDropdownMapel();
  sembunyikanHasil();

  if (!kelasPilihan) return;

  fetch(`${window.Quiz_API}?aksi=getSiswaByKelas&kelas=${encodeURIComponent(kelasPilihan)}`)
    .then(res => res.json())
    .then(data => {
      const selectSiswa = document.getElementById("filterDaftarSiswa");
      if(!selectSiswa) return;
      selectSiswa.disabled = false;
      
      data.siswa.forEach(siswa => {
        selectSiswa.innerHTML += `<option value="${siswa.nisn}">${siswa.nama}</option>`;
      });
    })
    .catch(err => console.error("Gagal memuat daftar siswa rekap:", err));
}

function handleSiswaChange() {
  const kelasPilihan = document.getElementById("filterDaftarKelas").value;
  const nisnPilihan = document.getElementById("filterDaftarSiswa").value;
  
  resetDropdownMapel();
  sembunyikanHasil();

  if (!nisnPilihan) return;

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
}

function tampilkanNilaiAkhir() {
  const nisnPilihan = document.getElementById("filterDaftarSiswa").value;
  const mapelPilihan = document.getElementById("filterDaftarMapel").value;

  if (!nisnPilihan || !mapelPilihan) {
    sembunyikanHasil();
    return;
  }

  const dataCocok = masterDaftarNilai.find(item => 
    String(item.nisn).trim() === String(nisnPilihan).trim() && 
    String(item.pelajaran).trim().toLowerCase() === String(mapelPilihan).trim().toLowerCase()
  );

  if (dataCocok) {
    document.getElementById("textNilaiAkhir").innerText = dataCocok.nilai;
    document.getElementById("textNamaSiswa").innerText = dataCocok.nama;
    document.getElementById("textDetailSiswa").innerText = `NISN: ${dataCocok.nisn} | Kelas: ${dataCocok.kelas} | Mapel: ${dataCocok.pelajaran}`;
    
    const badge = document.getElementById("badgeStatusAkhir");
    if(badge) {
        badge.innerText = dataCocok.status;
        badge.className = String(dataCocok.status).toLowerCase() === 'lulus' ? "badge bg-success px-4 py-2 fs-6" : "badge bg-danger px-4 py-2 fs-6";
    }

    document.getElementById("boxHasilNilai").classList.remove("d-none");
    document.getElementById("boxInfoKosong").classList.add("d-none");
  } else {
    document.getElementById("boxHasilNilai").classList.add("d-none");
    const boxKosong = document.getElementById("boxInfoKosong");
    if(boxKosong) {
        boxKosong.className = "text-center text-danger py-5 fw-bold";
        boxKosong.innerText = "Siswa yang dipilih belum memiliki rekap nilai untuk mata pelajaran ini.";
    }
  }
}

function resetDropdownSiswa() {
  const s = document.getElementById("filterDaftarSiswa");
  if(s) { s.innerHTML = '<option value="">-- Pilih Nama --</option>'; s.disabled = true; }
}

function resetDropdownMapel() {
  const m = document.getElementById("filterDaftarMapel");
  if(m) { m.innerHTML = '<option value="">-- Pilih Mapel --</option>'; m.disabled = true; }
}

function sembunyikanHasil() {
  const boxHasil = document.getElementById("boxHasilNilai");
  const boxKosong = document.getElementById("boxInfoKosong");
  if(boxHasil) boxHasil.classList.add("d-none");
  if(boxKosong) {
    boxKosong.className = "text-center text-muted py-5";
    boxKosong.innerText = "Silakan tentukan Kelas, Nama, dan Mata Pelajaran di atas untuk melihat nilai.";
  }
}
// Panggil fungsi ini setiap kali dropdown filter berubah nilainya
function tampilkanNilaiSpesifik() {
  const kelasPilihan = document.getElementById("filterDaftarKelas").value;
  const nisnPilihan = document.getElementById("filterDaftarSiswa").value;
  const mapelPilihan = document.getElementById("filterDaftarMapel").value;
  
  const bodyTabel = document.getElementById("bodyTabelNilai");
  if (!bodyTabel) return;

  // Saring data dari variabel masterDaftarNilai yang didapat dari sheet 'Hasil'
  let dataTersaring = masterDaftarNilai.filter(item => {
    let cocokKelas = !kelasPilihan || item.kelas == kelasPilihan;
    let cocokSiswa = !nisnPilihan || item.nisn == nisnPilihan;
    let cocokMapel = !mapelPilihan || item.pelajaran == mapelPilihan;
    return cocokKelas && cocokSiswa && cocokMapel;
  });

  // Jika tidak ada data cocok
  if (dataTersaring.length === 0) {
    bodyTabel.innerHTML = `<tr><td colspan="6" class="text-center data-kosong">Tidak ada rekap data nilai yang cocok dengan filter.</td></tr>`;
    document.getElementById("rekapStats").style.display = "none";
    return;
  }

  // Hitung data untuk ringkasan kartu statistik singkat
  let totalUjian = dataTersaring.length;
  let lulus = dataTersaring.filter(i => i.status.toLowerCase() === "lulus").length;
  let remedi = totalUjian - lulus;

  // Tampilkan & isi nilai kartu statistik
  document.getElementById("statTotal").innerText = totalUjian;
  document.getElementById("statLulus").innerText = lulus;
  document.getElementById("statRemedi").innerText = remedi;
  document.getElementById("rekapStats").style.display = "grid";

  // Masukkan baris data ke dalam tabel dengan badge status profesional
  bodyTabel.innerHTML = "";
  dataTersaring.forEach(item => {
    let kelasBadge = item.status.toLowerCase() === "lulus" ? "badge-sukses" : "badge-bahaya";
    
    bodyTabel.innerHTML += `
      <tr>
        <td><strong>${item.nisn}</strong></td>
        <td>${item.nama}</td>
        <td>${item.kelas}</td>
        <td>${item.pelajaran}</td>
        <td><strong>${item.nilai}</strong></td>
        <td><span class="badge ${kelasBadge}">${item.status.toUpperCase()}</span></td>
      </tr>
    `;
  });
}

// Tambahkan ini di bagian paling bawah kode JavaScript kamu
window.tampilkanNilaiSpesifik = tampilkanNilaiSpesifik;

// Pastikan fungsi ini dipanggil di ujung akhir rantai .then() milik ambilDataNilai(), handleKelasChange(), dan handleSiswaChange()
