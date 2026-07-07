/* ==========================================
   STATE & CONFIGURATION
   ========================================== */
let databaseMaps = null;

/**
 * Fungsi Inisialisasi Utama (Lifecycle Hook)
 * Dipanggil hanya saat user membuka halaman buatJadwalPage
 */
function initBuatJadwalPage() {
  const loaderEl = document.getElementById("loader");
  const tableBody = document.getElementById("logTableBody");
  const formAreaEl = document.getElementById("formArea");
  const hasilBoxEl = document.getElementById("hasilBox");
  const kelasSelect = document.getElementById("kelasSelect"); // Ambil elemen kelas
  
  // Reset tampilan form ke kondisi awal
  if (loaderEl) loaderEl.style.display = "block";
  if (formAreaEl) formAreaEl.style.display = "none";
  if (hasilBoxEl) hasilBoxEl.style.display = "none";
  
  // Reset dropdown kelas ke opsi default jika elemen ditemukan
  if (kelasSelect) kelasSelect.value = "";

  if (tableBody) {
    // Diubah menjadi colspan="3" karena sekarang ada kolom Kelas di tabel log
    tableBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-2">Memuat riwayat...</td></tr>`;
  }

  // Ambil data Guru & Mapel dari Apps Script
  fetch(`${JADWAL_API}?action=getMapData`)
    .then(response => response.json())
    .then(data => { 
      inisialisasiDropdown(data); 
    })
    .catch(err => { 
      const loader = document.getElementById("loader");
      if (loader) {
        loader.innerHTML = `<span class="text-danger">Gagal memuat database internal: ${err.message}</span>`; 
      }
    });
    
  // Ambil data tabel log
  muatDataLog();
}

/**
 * Mengisi opsi pilihan dropdown secara dinamis dan aman
 */
function inisialisasiDropdown(maps) {
  databaseMaps = maps;
  const guruSelect = document.getElementById("guruSelect");
  const mapelSelect = document.getElementById("mapelSelect");
  const loaderEl = document.getElementById("loader");
  const formAreaEl = document.getElementById("formArea");

  if (!guruSelect || !mapelSelect) return;

  // Bersihkan data lama untuk mencegah duplikasi jika user bolak-balik halaman
  guruSelect.innerHTML = '<option value="">-- Pilih Nama Guru --</option>';
  mapelSelect.innerHTML = '<option value="">-- Pilih Pelajaran --</option>';

  // Isi data Guru
  Object.keys(maps.mapGuru).forEach(namaKey => {
    const namaFormat = namaKey.replace(/\b\w/g, c => c.toUpperCase());
    let opt = document.createElement("option");
    opt.value = namaKey; 
    opt.textContent = namaFormat; 
    guruSelect.appendChild(opt);
  });

  // Isi data Mapel
  Object.keys(maps.mapMapel).forEach(mapelKey => {
    let opt = document.createElement("option");
    opt.value = mapelKey; 
    opt.textContent = mapelKey.toUpperCase(); 
    mapelSelect.appendChild(opt);
  });

  if (loaderEl) loaderEl.style.display = "none";
  if (formAreaEl) formAreaEl.style.display = "block";
}

/**
 * Mengecek kombinasi kode guru dan mapel secara real-time
 */
function cekKombinasi() {
  const kelasSelect = document.getElementById("kelasSelect"); // Mengambil dropdown kelas
  const guruSelect = document.getElementById("guruSelect");
  const mapelSelect = document.getElementById("mapelSelect");
  const hasilBox = document.getElementById("hasilBox");
  const kodeDisplay = document.getElementById("kodeDisplay");
  const infoDetail = document.getElementById("infoDetail");
  const btnSimpan = document.getElementById("btnSimpan");

  if (!guruSelect || !mapelSelect || !hasilBox || !kodeDisplay || !infoDetail || !btnSimpan) return;

  const kelasVal = kelasSelect ? kelasSelect.value : "Aktif";
  const guruVal = guruSelect.value;
  const mapelVal = mapelSelect.value;

  // Tombol simpan hanya akan aktif jika Kelas, Guru, dan Mapel sudah dipilih semua
  if (!kelasVal || !guruVal || !mapelVal) { 
    hasilBox.style.display = "none"; 
    return; 
  }

  const kodeGuru = databaseMaps?.mapGuru[guruVal] || "";
  const kodeMapel = databaseMaps?.mapMapel[mapelVal] || "";

  if (kodeGuru && kodeMapel) {
    hasilBox.style.display = "block";
    kodeDisplay.textContent = kodeGuru + kodeMapel;
    infoDetail.textContent = `Kelas: ${kelasVal} | Guru: ${kodeGuru} | Mapel: ${kodeMapel}`;
    btnSimpan.disabled = false; 
    btnSimpan.textContent = "Simpan ke Spreadsheet";
  } else {
    hasilBox.style.display = "block"; 
    kodeDisplay.textContent = "??";
    infoDetail.textContent = "Kombinasi kode tidak valid."; 
    btnSimpan.disabled = true;
  }
}

/**
 * Menyimpan data log pencarian ke spreadsheet (POST)
 */
function simpanKeSpreadsheet() {
  const kelasSelect = document.getElementById("kelasSelect");
  const guruSelect = document.getElementById("guruSelect");
  const mapelSelect = document.getElementById("mapelSelect");
  const btnSimpan = document.getElementById("btnSimpan");
  const kodeDisplay = document.getElementById("kodeDisplay");
  
  if (!kelasSelect || !guruSelect || !mapelSelect || !btnSimpan || !kodeDisplay) return;

  const namaKelas = kelasSelect.value;
  const namaGuru = guruSelect.options[guruSelect.selectedIndex].text;
  const namaMapel = mapelSelect.options[mapelSelect.selectedIndex].text;
  const kodeGabungan = kodeDisplay.textContent;

  if (!namaKelas) {
    alert("Silakan pilih kelas terlebih dahulu!");
    return;
  }

  btnSimpan.disabled = true; 
  btnSimpan.textContent = "Menyimpan...";

  // Mengirim payload lengkap terintegrasi dengan variabel data kelas
  fetch(JADWAL_API, {
    method: "POST",
    body: JSON.stringify({ kelas: namaKelas, guru: namaGuru, mapel: namaMapel, kode: kodeGabungan })
  })
  .then(response => response.json())
  .then(res => {
    if(res.status) { 
      btnSimpan.textContent = "Tersimpan ✅"; 
      muatDataLog(); 
    } else { 
      alert("Gagal: " + res.message); 
      btnSimpan.disabled = false; 
      btnSimpan.textContent = "Simpan ke Spreadsheet";
    }
  })
  .catch(err => { 
    alert("Koneksi bermasalah."); 
    btnSimpan.disabled = false; 
    btnSimpan.textContent = "Simpan ke Spreadsheet";
  });
}

/**
 * Memuat riwayat data log dari spreadsheet ke tabel (GET)
 */
function muatDataLog() {
  const tableBody = document.getElementById("logTableBody");
  if (!tableBody) return;

  fetch(`${JADWAL_API}?action=getLogData`)
    .then(response => response.json())
    .then(res => {
      if (res.status && res.data.length > 0) {
        tableBody.innerHTML = "";
        res.data.forEach(item => {
          let row = document.createElement("tr");
          // Ditambahkan info badge Kelas (${item.kelas}) di baris informasi log
          row.innerHTML = `
            <td>
              <span class="badge bg-secondary mb-1" style="font-size:10px;">Kelas ${item.kelas}</span>
              <div class="fw-semibold">${item.guru}</div>
              <div class="text-kecil text-muted">${item.mapel}</div>
            </td>
            <td class="text-center fw-bold text-success bg-light" style="vertical-align: middle;">${item.kode}</td>
          `;
          tableBody.appendChild(row);
        });
      } else {
        tableBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-2">Belum ada riwayat.</td></tr>`;
      }
    })
    .catch(() => {
      tableBody.innerHTML = `<tr><td colspan="3" class="text-center text-danger py-2">Gagal memuat log data.</td></tr>`;
    });
}

/**
 * Memicu mesin algoritma pembuat jadwal anti-bentrok di backend
 */
function prosesGenerateJadwal() {
  const btn = document.getElementById("btnGenerate");
  if (!btn) return;
  
  if(!confirm("Apakah Anda yakin ingin men-generate ulang jadwal pelajaran? Jadwal lama pada sheet 'Jadwal Pelajaran' akan ditimpa.")) return;

  btn.disabled = true;
  btn.textContent = "⏳ SEDANG MEMPROSES GENERATE...";

  fetch(`${JADWAL_API}?action=generateJadwal`)
    .then(response => response.json())
    .then(res => {
      if(res.status) {
        alert("Sukses! " + res.message);
      } else {
        alert("Gagal memproses pembuatan jadwal: " + res.message);
      }
      btn.disabled = false;
      btn.textContent = "⚡ GENERATE JADWAL PELAJARAN";
    })
    .catch(err => {
      alert("Terjadi kesalahan jaringan atau skrip batas waktu pengerjaan.");
      btn.disabled = false;
      btn.textContent = "⚡ GENERATE JADWAL PELAJARAN";
    });
}
