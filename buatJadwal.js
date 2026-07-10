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
  if (!btn) return;
  
  btn.disabled = true;
  btn.textContent = "⏳ MENYIAPKAN DOKUMEN CORAK...";

  // Gunakan URL JADWAL_API yang mengarah ke Apps Script Anda
  fetch(`${JADWAL_API}?action=getJadwalKolektif`)
    .then(response => {
      if (!response.ok) throw new Error("Respons jaringan tidak OK");
      return response.json();
    })
    .then(res => {
      btn.disabled = false;
      btn.textContent = "🖨️ CETAK JADWAL KOLEKTIF (KLS 1-6)";
      
      if (!res.status || !res.data || res.data.length === 0) {
        alert("Gagal memuat data jadwal atau data masih kosong.");
        return;
      }
      
      prosesDanCetak(res.data);
    })
    .catch(err => {
      console.error(err);
      alert("Koneksi gagal saat mengambil data cetak. Pastikan Web App sudah di-deploy ulang sebagai 'New Version'.");
      btn.disabled = false;
      btn.textContent = "🖨️ CETAK JADWAL KOLEKTIF (KLS 1-6)";
    });
}

function prosesDanCetak(data) {
  const listHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const listKelas = ["1", "2", "3", "4", "5A", "5B", "6"];
  let htmlBarisJadwal = "";

  const maps = databaseMaps || { mapGuru: {}, mapMapel: {} };

  // ================= 1. GENERATE BARIS JADWAL (KIRI) =================
  listHari.forEach(hari => {
    let dataHariIni = data.filter(d => d.hari && d.hari.toLowerCase() === hari.toLowerCase());
    if (dataHariIni.length === 0) return;

    // Ambil list jam unik berdasarkan format "mulai-selesai"
    let listJam = [...new Set(dataHariIni.map(d => `${d.mulai}-${d.selesai}`))];
    listJam.sort((a, b) => {
      let jamA = parseInt(a.split("-")[0].replace(":", ""), 10);
      let jamB = parseInt(b.split("-")[0].replace(":", ""), 10);
      return jamA - jamB;
    });

    let totalJamHariIni = listJam.length;
    let counterJP = 1; // Penghitung urutan JP murni dinamis

    listJam.forEach((jamStr, index) => {
      let [mulai, selesai] = jamStr.split("-");
      // Cari sampel data berdasarkan jam mulai dan selesai yang cocok
      let sampelData = dataHariIni.find(d => d.mulai === mulai && d.selesai === selesai);
      
      let isIstirahat = sampelData && sampelData.mapel.toUpperCase() === "ISTIRAHAT";
      let isKegiatanAwal = sampelData && (sampelData.mapel.toUpperCase() === "UPACARA" || sampelData.mapel.toUpperCase() === "PEMBIASAAN");

      htmlBarisJadwal += `<tr>`;
      
      // KOLOM HARI: Muncul di baris pertama tiap hari
      if (index === 0) {
        htmlBarisJadwal += `<td rowspan="${totalJamHariIni}" class="text-tengah fw-bold nama-hari-kolom">${hari.toUpperCase()}</td>`;
      }

      if (isIstirahat) {
        htmlBarisJadwal += `
          <td class="text-tengah abu-bg">-</td>
          <td class="text-tengah abu-bg fw-bold" style="font-size: 9px; white-space: nowrap;">${jamStr}</td>
          <td colspan="${listKelas.length}" class="text-tengah istirahat-cell">☕ ISTIRAHAT</td>
        `;
      } else {
        // Logika penomoran JP murni (Upacara/Pembiasaan dicatat sebagai '-')
        let nomorTampil = "-";
        if (!isKegiatanAwal) {
          nomorTampil = counterJP;
          counterJP++;
        }

        htmlBarisJadwal += `
          <td class="text-tengah fw-bold">${nomorTampil}</td>
          <td class="text-tengah text-muted fw-bold" style="font-size: 9px; color: #000; white-space: nowrap;">${jamStr}</td>
        `;
        
        listKelas.forEach(kelas => {
          let cocok = dataHariIni.find(d => d.mulai === mulai && d.selesai === selesai && String(d.kelas) === String(kelas));
          if (cocok) {
            let mapel = cocok.mapel.toUpperCase();
            
            if (mapel === "KOSONG") {
              htmlBarisJadwal += `<td class="text-tengah teks-kosong">-</td>`;
            } else if (mapel === "UPACARA" || mapel === "PEMBIASAAN") {
              htmlBarisJadwal += `<td class="text-tengah kegiatan-wajib">${mapel.substring(0, 3)}</td>`;
            } else {
              const kGuru = maps.mapGuru[cocok.guru.toLowerCase()] || "";
              const kMapel = maps.mapMapel[cocok.mapel.toLowerCase()] || "";
              const kodeTampil = kGuru && kMapel ? (kGuru + kMapel) : "-";

              htmlBarisJadwal += `<td class="text-tengah fw-bold cell-kode">${kodeTampil}</td>`;
            }
          } else {
            // Otomatis abu-abu jika Kelas 1 & 2 sudah pulang setelah JP ke-7
            htmlBarisJadwal += `<td class="text-tengah abu-bg"></td>`;
          }
        });
      }
      htmlBarisJadwal += `</tr>`;
    });
  });

  // ================= 2. GENERATE LEGENDA KODE (KANAN) =================
  let htmlLegendaGuru = "";
  Object.keys(maps.mapGuru).forEach(namaKey => {
    const kode = maps.mapGuru[namaKey];
    const namaFormat = namaKey.replace(/\b\w/g, c => c.toUpperCase());
    htmlLegendaGuru += `<tr><td class="text-tengah fw-bold">${kode}</td><td>${namaFormat}</td></tr>`;
  });

  let htmlLegendaMapel = "";
  Object.keys(maps.mapMapel).forEach(mapelKey => {
    const kode = maps.mapMapel[mapelKey];
    htmlLegendaMapel += `<tr><td class="text-tengah fw-bold">${kode}</td><td>${mapelKey.toUpperCase()}</td></tr>`;
  });

  // ================= 3. RENDER KE JENDELA CETAK BARU =================
  const jendelaCetak = window.open("", "_blank", "width=1200,height=750");
  if (!jendelaCetak) {
    alert("Pop-up diblokir browser! Harap izinkan pop-up.");
    return;
  }
  
  const tanggalHariIni = new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
  const thKelasHTML = listKelas.map(k => `<th style="width: 11%;">KLS ${k}</th>`).join('');

  jendelaCetak.document.write(`
    <html>
    <head>
      <title>Cetak Jadwal Kolektif F4</title>
      <style>
        @page { size: 21.59cm 33.02cm; margin: 0.6cm 0.4cm 0.4cm 0.4cm; }
        body { font-family: Arial, sans-serif; color: #000; padding: 0; margin: 0; background: #fff; line-height: 1.1; }
        
        .cetak-header { text-align: center; margin-bottom: 8px; }
        .cetak-header h2 { margin: 0; font-size: 13px; font-weight: bold; text-transform: uppercase; }
        .cetak-header h3 { margin: 1px 0 0 0; font-size: 10px; color: #444; }
        
        .kontainer-utama { display: flex; gap: 8px; align-items: flex-start; }
        .area-jadwal { width: 80%; }
        .area-legenda { width: 20%; font-size: 7.5px; }
        
        table { border-collapse: collapse; width: 100%; font-size: 8.5px; }
        th, td { border: 1px solid #000; padding: 2px 1px; vertical-align: middle; }
        th { background-color: #e5e5e5 !important; font-weight: bold; text-align: center; }
        
        .nama-hari-kolom { background-color: #f5f5f5 !important; font-size: 9px; width: 6%; text-transform: uppercase; }
        .text-tengah { text-align: center; }
        .fw-bold { font-weight: bold; }
        .abu-bg { background-color: #eeeeee; }
        .teks-kosong { color: #ccc; }
        .cell-kode { font-size: 9.5px; color: #000; }
        .istirahat-cell { background-color: #dddddd !important; font-size: 7.5px; font-weight: bold; letter-spacing: 1px; color: #333; }
        .kegiatan-wajib { background-color: #fff3cd !important; font-size: 7.5px; font-weight: bold; }
        
        .judul-legenda { font-weight: bold; background: #333; color: #fff; text-align: center; padding: 2px 0; margin-top: 4px; margin-bottom: 1px; font-size: 8px; }
        .tabel-legenda td { padding: 1.5px 2px; font-size: 7.5px; }
        
        .cetak-footer { margin-top: 10px; float: right; text-align: center; width: 180px; font-size: 9px; }
        .cetak-footer .jabatan { margin-bottom: 35px; }
        
        @media print {
          body { margin: 0; padding: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      </style>
    </head>
    <body>
      <div class="cetak-header">
        <h2>JADWAL PELAJARAN MIS MIFTAHUL MUBTADIIN</h2>
        <h3>SEMESTER GANJIL TAHUN AJARAN 2026/2027</h3>
      </div>
      
      <div class="kontainer-utama">
        <div class="area-jadwal">
          <table>
            <thead>
              <tr>
                <th>HARI</th>
                <th style="width: 4%;">JP</th>
                <th style="width: 12%;">WAKTU</th>
                ${thKelasHTML}
              </tr>
            </thead>
            <tbody>
              ${htmlBarisJadwal}
            </tbody>
          </table>
        </div>
        
        <div class="area-legenda">
          <div class="judul-legenda">KODE GURU</div>
          <table class="tabel-legenda">
            <thead>
              <tr>
                <th style="width: 25%;">KODE</th>
                <th>NAMA GURU</th>
              </tr>
            </thead>
            <tbody>
              ${htmlLegendaGuru}
            </tbody>
          </table>
          
          <div class="judul-legenda">KODE MAPEL</div>
          <table class="tabel-legenda">
            <thead>
              <tr>
                <th style="width: 25%;">KODE</th>
                <th>PELAJARAN</th>
              </tr>
            </thead>
            <tbody>
              ${htmlLegendaMapel}
            </tbody>
          </table>
        </div>
      </div>

      <div class="cetak-footer">
        <div>Cirebon, ${tanggalHariIni}</div>
        <div class="jabatan">Kepala Sekolah,</div>
        <div>( Mudasir, M.Pd )</div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        };
      </script>
    </body>
    </html>
  `);
  jendelaCetak.document.close();
}
