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
  const kelasSelect = document.getElementById("kelasSelect");
  const guruSelect = document.getElementById("guruSelect");
  const mapelSelect = document.getElementById("mapelSelect");
  const jpInput = document.getElementById("jpInput"); // Ambil input JP
  const hasilBox = document.getElementById("hasilBox");
  const kodeDisplay = document.getElementById("kodeDisplay");
  const infoDetail = document.getElementById("infoDetail");
  const btnSimpan = document.getElementById("btnSimpan");

  if (!guruSelect || !mapelSelect || !hasilBox || !kodeDisplay || !infoDetail || !btnSimpan || !jpInput) return;

  const kelasVal = kelasSelect ? kelasSelect.value : "Aktif";
  const guruVal = guruSelect.value;
  const mapelVal = mapelSelect.value;
  const jpVal = jpInput.value;

  // Validasi jika Kelas, Guru, Mapel, atau JP kosong
  if (!kelasVal || !guruVal || !mapelVal || !jpVal) { 
    hasilBox.style.display = "none"; 
    return; 
  }

  const kodeGuru = databaseMaps?.mapGuru[guruVal] || "";
  const kodeMapel = databaseMaps?.mapMapel[mapelVal] || "";

  if (kodeGuru && kodeMapel) {
    hasilBox.style.display = "block";
    kodeDisplay.textContent = kodeGuru + kodeMapel;
    // Tampilkan informasi JP di detail teks
    infoDetail.textContent = `Kelas: ${kelasVal} | Guru: ${kodeGuru} | Mapel: ${kodeMapel} | Beban: ${jpVal} JP`;
    btnSimpan.disabled = false; 
    btnSimpan.textContent = "Simpan ke Spreadsheet";
  } else {
    hasilBox.style.display = "block"; 
    kodeDisplay.textContent = "??";
    infoDetail.textContent = "Kombinasi kode tidak valid."; 
    btnSimpan.disabled = true;
  }
}

function simpanKeSpreadsheet() {
  const kelasSelect = document.getElementById("kelasSelect");
  const guruSelect = document.getElementById("guruSelect");
  const mapelSelect = document.getElementById("mapelSelect");
  const jpInput = document.getElementById("jpInput");
  const btnSimpan = document.getElementById("btnSimpan");
  const kodeDisplay = document.getElementById("kodeDisplay");
  
  if (!kelasSelect || !guruSelect || !mapelSelect || !jpInput || !btnSimpan || !kodeDisplay) return;

  const namaKelas = kelasSelect.value;
  const namaGuru = guruSelect.options[guruSelect.selectedIndex].text;
  const namaMapel = mapelSelect.options[mapelSelect.selectedIndex].text;
  const jumlahJP = jpInput.value;
  const kodeGabungan = kodeDisplay.textContent;

  if (!namaKelas || !jumlahJP) {
    alert("Silakan isi kelas dan jumlah JP terlebih dahulu!");
    return;
  }

  btnSimpan.disabled = true; 
  btnSimpan.textContent = "Menyimpan...";

  // Payload menyertakan variabel jp
  fetch(JADWAL_API, {
    method: "POST",
    body: JSON.stringify({ 
      kelas: namaKelas, 
      guru: namaGuru, 
      mapel: namaMapel, 
      jp: jumlahJP, 
      kode: kodeGabungan 
    })
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
function bukaJendelaCetak() {
  const btn = document.getElementById("btnCetak");
  btn.disabled = true;
  btn.textContent = "⏳ MENYIAPKAN DOKUMEN CORAK...";

  fetch(`${JADWAL_API}?action=getJadwalKolektif`)
    .then(response => response.json())
    .then(res => {
      btn.disabled = false;
      btn.textContent = "🖨️ CETAK JADWAL KOLEKTIF (KLS 1-6)";
      
      if (!res.status || res.data.length === 0) {
        alert("Gagal memuat data jadwal atau data masih kosong.");
        return;
      }
      
      prosesDanCetak(res.data);
    })
    .catch(err => {
      alert("Koneksi gagal saat mengambil data cetak.");
      btn.disabled = false;
      btn.textContent = "🖨️ CETAK JADWAL KOLEKTIF (KLS 1-6)";
    });
}

function prosesDanCetak(data) {
  const listHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const listKelas = ["1", "2", "3", "4", "5A", "5B", "6"];
  let htmlStruktur = "";

  // 1. Kelompokkan data berdasarkan Hari -> Jam Mulai -> Kelas
  listHari.forEach(hari => {
    // Filter data khusus hari ini
    let dataHariIni = data.filter(d => d.hari.toLowerCase() === hari.toLowerCase());
    if (dataHariIni.length === 0) return;

    // Dapatkan list jam unik pada hari tersebut, urutkan berdasarkan waktu murni
    let listJam = [...new Set(dataHariIni.map(d => `${d.mulai}-${d.selesai}`))];
    listJam.sort((a, b) => {
      let jamA = parseInt(a.split("-")[0].replace(":", ""));
      let jamB = parseInt(b.split("-")[0].replace(":", ""));
      return jamA - jamB;
    });

    // Buat Tabel per Hari
    htmlStruktur += `
      <div class="halaman-hari">
        <div class="nama-hari-judul">HARI: ${hari.toUpperCase()}</div>
        <table class="tabel-cetak-kolektif">
          <thead>
            <tr>
              <th rowspan="2" style="width: 5%;">JP</th>
              <th rowspan="2" style="width: 15%;">WAKTU</th>
              <th colspan="${listKelas.length}">KELAS</th>
            </tr>
            <tr>
              ${listKelas.map(k => `<th style="width: 11%;">${k}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    let nomorJP = 1;
    listJam.forEach(jamStr => {
      let [mulai, selesai] = jamStr.split("-");
      
      // Deteksi apakah ini jam istirahat berdasarkan data baris pertama kelas 1
      let sampelData = dataHariIni.find(d => d.mulai === mulai && d.selesai === selesai);
      let isIstirahat = sampelData && sampelData.mapel.toUpperCase() === "ISTIRAHAT";

      htmlStruktur += `<tr>`;
      if (isIstirahat) {
        htmlStruktur += `
          <td class="text-tengah abu-bg">-</td>
          <td class="text-tengah abu-bg"><strong>${mulai} - ${selesai}</strong></td>
          <td colspan="${listKelas.length}" class="text-tengah istirahat-cell">☕ I S T I R A H A T</td>
        `;
      } else {
        htmlStruktur += `
          <td class="text-tengah fw-bold">${nomorJP++}</td>
          <td class="text-tengah">${mulai} - ${selesai}</td>
        `;
        
        // Isi mapel per kelas
        listKelas.forEach(kelas => {
          let cocok = dataHariIni.find(d => d.mulai === mulai && d.selesai === selesai && d.kelas === kelas);
          if (cocok) {
            let mapel = cocok.mapel.toUpperCase();
            let guru = cocok.guru !== "-" ? cocok.guru : "";
            
            if (mapel === "KOSONG") {
              htmlStruktur += `<td class="text-tengah teks-kosong">-</td>`;
            } else if (mapel === "UPACARA" || mapel === "PEMBIASAAN") {
              htmlStruktur += `<td class="text-tengah kegiatan-wajib"><strong>${mapel}</strong></td>`;
            } else {
              htmlStruktur += `
                <td class="text-tengah cell-isi">
                  <div class="mapel-text">${mapel}</div>
                  <div class="guru-text">${guru}</div>
                </td>
              `;
            }
          } else {
            htmlStruktur += `<td class="text-tengah abu-bg"></td>`; // Jika kelas 1/2 sudah pulang duluan
          }
        });
      }
      htmlStruktur += `</tr>`;
    });

    htmlStruktur += `
          </tbody>
        </table>
      </div>
    `;
  });

  // 2. Kirim HTML terstruktur dan CSS Terisolasi ke Jendela Cetak Baru Browser
  const infoTemplate = document.getElementById("templateCetakSistem").innerHTML;
  const jendelaCetak = window.open("", "_blank", "width=1100,height=700");
  
  jendelaCetak.document.write(`
    <html>
    <head>
      <title>Cetak Jadwal Pelajaran Kolektif</title>
      <style>
        /* CSS Terisolasi Menggunakan Namespace Khusus */
        .cetak-jadwal-container {
          font-family: 'Arial', sans-serif;
          color: #333;
          padding: 10px;
          background: #fff;
        }
        .cetak-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 3px double #000;
          padding-bottom: 5px;
        }
        .cetak-header h2 { margin: 0; font-size: 20px; letter-spacing: 1px; }
        .cetak-header h3 { margin: 5px 0 0 0; font-size: 14px; font-weight: normal; }
        
        .nama-hari-judul {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 5px;
          background: #333;
          color: #fff;
          padding: 4px 10px;
          display: inline-block;
          border-radius: 3px;
        }
        
        .tabel-cetak-kolektif {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          font-size: 11px;
        }
        .tabel-cetak-kolektif th, .tabel-cetak-kolektif td {
          border: 1px solid #000;
          padding: 5px 3px;
          vertical-align: middle;
        }
        .tabel-cetak-kolektif th {
          background-color: #f2f2f2 !important;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
        }
        .text-tengah { text-align: center; }
        .fw-bold { font-weight: bold; }
        .abu-bg { background-color: #f9f9f9; }
        .teks-kosong { color: #ccc; }
        
        .istirahat-cell {
          background-color: #e9ecef !important;
          font-weight: bold;
          letter-spacing: 3px;
          font-size: 11px;
        }
        .kegiatan-wajib {
          background-color: #fff3cd !important;
          font-size: 10px;
        }
        .cell-isi { line-height: 1.2; }
        .mapel-text { font-weight: bold; color: #000; }
        .guru-text { font-size: 9.5px; color: #444; margin-top: 2px; font-style: italic;}
        
        .cetak-footer {
          margin-top: 30px;
          float: right;
          text-align: center;
          width: 250px;
          font-size: 12px;
        }
        .cetak-footer .jabatan { margin-bottom: 60px; }
        .cetak-footer .nama-pejabat { font-weight: bold; text-decoration: underline; }
        
        /* ATURAN KHUSUS ENGINE PRINTER BROWSER */
        @media print {
          body { margin: 0; padding: 0; background: #fff; }
          .cetak-jadwal-container { padding: 0; }
          .halaman-hari {
            page-break-after: always; /* 1 Hari dipaksa pas masuk 1 lembar A4 */
          }
          .halaman-hari:last-child { page-break-after: avoid; }
          /* Memastikan printer menarik background warna css */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      </style>
    </head>
    <body>
      <div class="cetak-jadwal-container">
        <div class="cetak-header">
          <h2>JADWAL PELAJARAN KOLEKTIF KELAS 1 - 6</h2>
          <h3>TAHUN AJARAN 2026/2027</h3>
        </div>
        
        <div id="areaTabelPerHari">${htmlStruktur}</div>
        
        <div class="cetak-footer">
          <div>Jakarta, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</div>
          <div class="jabatan">Kepala Sekolah,</div>
          <div class="nama-pejabat">( ___________________________ )</div>
        </div>
      </div>
      <script>
        // Jalankan eksekusi print otomatis saat jendela terbuka penuh
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        };
      <\/script>
    </body>
    </html>
  `);
  jendelaCetak.document.close();
}
