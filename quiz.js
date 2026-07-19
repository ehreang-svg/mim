// 1. DEFINISI URL GLOBAL (Letakkan paling atas script Anda)
const Quiz_API = "https://script.google.com/macros/s/AKfycbwGySXrBY2dmNZDS-bf-pCB6tDukp0PO_RttP2XaENv4dk4FmfRWq95CBsWqQukB2jX/exec"; 
window.Quiz_API = Quiz_API; // Mengunci ke global window objek

let mataPelajaranTerpilih = ""; 
let dataSiswaQuiz = null;
let dataSoal = [];
let masterDaftarNilai = []; 

// Jalankan saat halaman pertama dimuat
document.addEventListener("DOMContentLoaded", function() {
    loadKelas();
});

// Fungsi Navigasi / Pembukaan Halaman Kuis
function bukaHalamanQuiz() {
    const halamanQuiz = document.getElementById("loginQuiz");
    if (halamanQuiz) {
        halamanQuiz.classList.remove("hidden");
    }
    loadKelas(); 
}

// ==========================================
// FUNGSI-FUNGSI HALAMAN UTAMA (KUIS SISWA)
// ==========================================

async function loadKelas() {
    try {
        const selectKelas = document.getElementById("selectKelas");
        if (!selectKelas) return;

        console.log("Memanggil URL:", Quiz_API + "?aksi=getKelas");
        
        const res = await fetch(Quiz_API + "?aksi=getKelas", { method: "GET", redirect: "follow" });
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
        console.error("Gagal memuat kelas:", err);
    }
}

function AksiPilihKelas() {
    loadSiswa();
    loadPelajaran();
} 

async function loadSiswa() {
    const kelas = document.getElementById("selectKelas").value;
    const selectSiswa = document.getElementById("selectSiswa");
    if (!kelas) { 
        selectSiswa.innerHTML = '<option value="">-- Pilih Nama --</option>'; 
        selectSiswa.disabled = true; 
        return; 
    }
    
    try {
        const res = await fetch(Quiz_API + "?aksi=getSiswaByKelas&kelas=" + encodeURIComponent(kelas), { method: "GET", redirect: "follow" });
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
        console.error("Gagal memuat siswa:", err); 
    }
}

async function loadPelajaran() {
    const kelas = document.getElementById("selectKelas").value;
    const selectPelajaran = document.getElementById("selectPelajaran");
    if (!kelas) { 
        selectPelajaran.innerHTML = '<option value="">-- Pilih Pelajaran --</option>'; 
        selectPelajaran.disabled = true; 
        return; 
    }

    try {
        const res = await fetch(Quiz_API + "?aksi=getPelajaranByKelas&kelas=" + encodeURIComponent(kelas), { method: "GET", redirect: "follow" });
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
        console.error("Gagal memuat pelajaran:", err); 
    }
}

// [Fungsi mulai(), tampilSiswaQuiz(), tampilSoal(), koreksi(), dan simpanSoalBaru() Anda tetap sama dan tidak bermasalah]

// ==========================================
// FUNGSI-FUNGSI HALAMAN REKAP DAFTAR NILAI
// ==========================================

function ambilDataNilai() {
  document.getElementById("filterDaftarKelas").innerHTML = '<option value="">-- Pilih Kelas --</option>';
  resetDropdownSiswa();
  resetDropdownMapel();
  sembunyikanHasil();

  // Menggunakan variabel global Quiz_API yang konsisten
  fetch(`${Quiz_API}?aksi=getDaftarNilai`)
    .then(res => res.json())
    .then(data => {
      masterDaftarNilai = data.nilaiSiswa || [];
      return fetch(`${Quiz_API}?aksi=getKelas`);
    })
    .then(res => res.json())
    .then(data => {
      const selectKelas = document.getElementById("filterDaftarKelas");
      if (!data || !data.kelas || data.kelas.length === 0) {
        selectKelas.innerHTML = '<option value="">-- Kelas Tidak Ditemukan --</option>';
        return;
      }
      data.kelas.forEach(kelas => {
        selectKelas.innerHTML += `<option value="${kelas}">${kelas}</option>`;
      });
    })
    .catch(err => console.error("Gagal mengambil data awal:", err));
}

function handleKelasChange() {
  const kelasPilihan = document.getElementById("filterDaftarKelas").value;
  resetDropdownSiswa();
  resetDropdownMapel();
  sembunyikanHasil();

  if (!kelasPilihan) return;

  fetch(`${Quiz_API}?aksi=getSiswaByKelas&kelas=${encodeURIComponent(kelasPilihan)}`)
    .then(res => res.json())
    .then(data => {
      const selectSiswa = document.getElementById("filterDaftarSiswa");
      selectSiswa.disabled = false;
      data.siswa.forEach(siswa => {
        selectSiswa.innerHTML += `<option value="${siswa.nisn}">${siswa.nama}</option>`;
      });
    })
    .catch(err => console.error("Gagal memuat daftar siswa:", err));
}

function handleSiswaChange() {
  const kelasPilihan = document.getElementById("filterDaftarKelas").value;
  const nisnPilihan = document.getElementById("filterDaftarSiswa").value;
  
  resetDropdownMapel();
  sembunyikanHasil();

  if (!nisnPilihan) return;

  fetch(`${Quiz_API}?aksi=getPelajaranByKelas&kelas=${encodeURIComponent(kelasPilihan)}`)
    .then(res => res.json())
    .then(data => {
      const selectMapel = document.getElementById("filterDaftarMapel");
      selectMapel.disabled = false;
      data.pelajaran.forEach(mapel => {
        selectMapel.innerHTML += `<option value="${mapel}">${mapel}</option>`;
      });
    })
    .catch(err => console.error("Gagal memuat daftar pelajaran:", err));
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
    badge.innerText = dataCocok.status;
    badge.className = String(dataCocok.status).toLowerCase() === 'lulus' ? "badge bg-success px-4 py-2 fs-6" : "badge bg-danger px-4 py-2 fs-6";

    document.getElementById("boxHasilNilai").classList.remove("d-none");
    document.getElementById("boxInfoKosong").classList.add("d-none");
  } else {
    document.getElementById("boxHasilNilai").classList.add("d-none");
    document.getElementById("boxInfoKosong").className = "text-center text-danger py-5 fw-bold";
    document.getElementById("boxInfoKosong").innerText = "Siswa belum memiliki rekap nilai untuk mata pelajaran ini.";
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
