const aplikasi = {
  masterData: [],
  isFirstLoad: true,

  init: function() {
    this.isFirstLoad = true;
    this.muatDataDariSheets();
  },

  showLoading: function(status) {
    const el = document.getElementById('loadingStatus');
    if (!el) return; 
    if (status) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  },

  muatDataDariSheets: function() {
    this.showLoading(true);
    if (window.KBM_API) {
      fetch(`${window.KBM_API}?action=getMateriData`)
        .then(res => res.json())
        .then(response => {
          if(response.success && response.data) {
            aplikasi.masterData = response.data;
            console.log("Data berhasil dimuat, jumlah:", aplikasi.masterData.length);
            aplikasi.filterDanTampilkan();
          } else {
            alert("Gagal memuat data: " + response.error);
          }
          aplikasi.showLoading(false);
        })
        .catch(err => {
          alert("Sistem Error API: " + err);
          aplikasi.showLoading(false);
        });
    } else {
      console.warn("API KBM tidak ditemukan, menggunakan data simulasi...");
      setTimeout(() => {
        this.masterData = [
          { rowNumber: 2, kelas: "Kelas 1", pelajaran: "Matematika", materi: "Mengenal Angka 1-20 (Simulasi)", status: "🔴 Belum", catatan: "" }
        ];
        this.filterDanTampilkan();
        this.showLoading(false);
      }, 500);
    }
  },

  filterDanTampilkan: function(elementYangDiklik) {
    // 1. Ambil nilai default dari DOM terlebih dahulu
    let fKelas = document.getElementById('filterKelas') ? document.getElementById('filterKelas').value : "Semua";
    let fPelajaran = document.getElementById('filterPelajaran') ? document.getElementById('filterPelajaran').value : "Semua";
    let fStatus = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : "Semua";

    // 2. JIKA fungsi ini dipicu oleh klik user (elementYangDiklik ada isinya), 
    // paksa timpa nilainya secara akurat berdasarkan ID elemen yang memicunya!
    if (elementYangDiklik && elementYangDiklik.id) {
      if (elementYangDiklik.id === "filterKelas") fKelas = elementYangDiklik.value;
      if (elementYangDiklik.id === "filterPelajaran") fPelajaran = elementYangDiklik.value;
      if (elementYangDiklik.id === "filterStatus") fStatus = elementYangDiklik.value;
    }

    // Pembersihan nilai jika kosong/undefined
    if (!fKelas || fKelas.trim() === "" || fKelas === "undefined") fKelas = "Semua";
    if (!fPelajaran || fPelajaran.trim() === "" || fPelajaran === "undefined") fPelajaran = "Semua";
    if (!fStatus || fStatus.trim() === "" || fStatus === "undefined") fStatus = "Semua";

    console.log(`[Pemicu Aktual] Menjalankan filter -> Kelas: ${fKelas}, Mapel: ${fPelajaran}, Status: ${fStatus}`);

    let filtered = this.masterData.filter(item => {
      // A. Ekstrak angka kelas saja dari spreadsheet
      const angkaKelasSaja = String(item.kelas || '').replace(/\D/g, '').trim(); 
      const matchKelas = (fKelas === "Semua" || angkaKelasSaja === fKelas);
      
      // B. Filter Pelajaran
      const mapelTarget = String(item.pelajaran || '').toLowerCase().trim();
      const mapelFilter = fPelajaran.toLowerCase().trim();
      const matchPelajaran = (fPelajaran === "Semua" || mapelTarget.includes(mapelFilter) || mapelFilter.includes(mapelTarget));
      
      // C. Filter Status Belajar
      let matchStatus = false;
      if (fStatus === "Semua") {
        matchStatus = true;
      } else {
        const itemStatus = String(item.status || '').toLowerCase();
        if (fStatus.includes("Belum") && (itemStatus.includes("belum") || itemStatus.includes("🔴"))) matchStatus = true;
        if (fStatus.includes("Proses") && (itemStatus.includes("proses") || itemStatus.includes("dibaca") || itemStatus.includes("🟡"))) matchStatus = true;
        if (fStatus.includes("Selesai") && (itemStatus.includes("selesai") || itemStatus.includes("paham") || itemStatus.includes("🟢"))) matchStatus = true;
      }

      
      return matchKelas && matchPelajaran && matchStatus;
    });

    // Jalankan sistem normal filter (Bypass dimatikan jika user mengubah filter secara sadar)
    if (this.isFirstLoad && filtered.length === 0 && this.masterData.length > 0) {
      filtered = this.masterData;
    }
    this.isFirstLoad = false;

    // Perbarui Angka Statistik
    const total = filtered.length;
    const selesai = filtered.filter(i => {
      const s = String(i.status || '').toLowerCase();
      return s.includes("selesai") || s.includes("paham") || s.includes("🟢");
    }).length;
    
    const proses = filtered.filter(i => {
      const s = String(i.status || '').toLowerCase();
      return s.includes("proses") || s.includes("dibaca") || s.includes("🟡");
    }).length;
    
    const persen = total > 0 ? Math.round((selesai / total) * 100) : 0;

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statSelesai').innerText = selesai;
    document.getElementById('statProses').innerText = proses;
    document.getElementById('statPersen').innerText = persen + "%";

    const tbody = document.getElementById('tabelMateriBody');
    const emptyState = document.getElementById('emptyState');
    
    if(!tbody) return;
    tbody.innerHTML = "";

    if (filtered.length === 0) {
      if(emptyState) emptyState.classList.remove('hidden');
      return;
    } else {
      if(emptyState) emptyState.classList.add('hidden');
    }

    // Render baris data ke tabel HTML
    filtered.forEach((item) => {
      const tr = document.createElement('tr');
      const sStr = String(item.status || '').toLowerCase();
      
      const isBelum = sStr.includes('belum') || sStr.includes('🔴');
      const isProses = sStr.includes('proses') || sStr.includes('dibaca') || sStr.includes('🟡');
      const isSelesai = sStr.includes('selesai') || sStr.includes('paham') || sStr.includes('🟢');

      tr.innerHTML = `
        <td class="text-center font-bold text-slate-600 py-3 px-4">${item.kelas || '-'}</td>
        <td class="font-semibold text-slate-700 py-3 px-4">${item.pelajaran || '-'}</td>
        <td class="text-slate-800 font-medium py-3 px-4">${item.materi || '-'}</td>
        <td class="text-center py-3 px-4">
          <select onchange="aplikasi.ubahStatus(${item.rowNumber}, this.value)" class="w-full text-sm rounded border border-slate-300 p-1 bg-white">
            <option value="🔴 Belum" ${isBelum ? 'selected' : ''}>🔴 Belum</option>
            <option value="🟡 Proses" ${isProses ? 'selected' : ''}>🟡 Proses</option>
            <option value="🟢 Selesai" ${isSelesai ? 'selected' : ''}>🟢 Selesai</option>
          </select>
        </td>
        <td class="py-3 px-4">
          <input type="text" value="${item.catatan || ''}" placeholder="Tambahkan link / catatan..." 
                 onchange="aplikasi.ubahCatatan(${item.rowNumber}, this.value)" class="w-full text-xs p-1.5 border border-slate-200 rounded">
        </td>
      `;
      tbody.appendChild(tr);
    });
  },
  
  ubahStatus: function(rowNumber, newStatus) {
    this.showLoading(true);
    if (window.KBM_API) {
      fetch(`${window.KBM_API}?action=updateStatusMateri&rowNumber=${rowNumber}&newStatus=${encodeURIComponent(newStatus)}`)
        .then(res => res.json())
        .then(res => {
          if(res.success) {
            const idx = this.masterData.findIndex(item => item.rowNumber === rowNumber);
            if(idx !== -1) this.masterData[idx].status = newStatus;
            this.filterDanTampilkan();
          } else {
            alert("Gagal merubah status: " + res.error);
          }
          this.showLoading(false);
        })
        .catch(err => {
          alert("Gagal menyimpan ke server: " + err);
          this.showLoading(false);
        });
    }
  },

  ubahCatatan: function(rowNumber, newCatatan) {
    this.showLoading(true);
    if (window.KBM_API) {
      fetch(`${window.KBM_API}?action=updateCatatanMateri&rowNumber=${rowNumber}&newCatatan=${encodeURIComponent(newCatatan)}`)
        .then(res => res.json())
        .then(res => {
          if(res.success) {
            const idx = this.masterData.findIndex(item => item.rowNumber === rowNumber);
            if(idx !== -1) this.masterData[idx].catatan = newCatatan;
          } else {
            alert("Gagal menyimpan catatan: " + res.error);
          }
          this.showLoading(false);
        })
        .catch(err => {
          alert("Gagal menyimpan ke server: " + err);
          this.showLoading(false);
        });
    }
  }
};

const siswaAplikasi = {
  masterData: [],

  init: function() {
    // Siswa Kelas 1 sebagai default load awal agar tidak kepenuhan 87 data langsung
    const elKelas = document.getElementById('siswaFilterKelas');
    if (elKelas && elKelas.value === "Semua") {
      elKelas.value = "1"; 
    }
    this.muatDataSiswa();
  },

  showLoading: function(status) {
    const el = document.getElementById('siswaLoadingStatus');
    if (!el) return;
    if (status) el.classList.remove('hidden');
    else el.classList.add('hidden');
  },

  muatDataSiswa: function() {
    this.showLoading(true);
    if (window.KBM_API) {
      fetch(`${window.KBM_API}?action=getMateriData`)
        .then(res => res.json())
        .then(response => {
          if (response.success && response.data) {
            this.masterData = response.data;
            this.filterDanRender();
          }
          this.showLoading(false);
        })
        .catch(err => {
          console.error("Gagal memuat modul belajar:", err);
          this.showLoading(false);
        });
    }
  },

  filterDanRender: function() {
    const fKelas = document.getElementById('siswaFilterKelas').value;
    const kataKunci = document.getElementById('siswaKataKunci').value.toLowerCase().trim();
    const grid = document.getElementById('siswaGridMateri');
    const emptyState = document.getElementById('siswaEmptyState');

    if (!grid) return;
    grid.innerHTML = "";

    const filtered = this.masterData.filter(item => {
      // 1. Filter Kelas
      const angkaKelas = String(item.kelas || '').replace(/\D/g, '').trim();
      const matchKelas = (fKelas === "Semua" || angkaKelas === fKelas);

      // 2. Filter Pencarian Teks (Cari di Judul Materi atau Mata Pelajaran sekaligus)
      const mapel = String(item.pelajaran || '').toLowerCase();
      const materi = String(item.materi || '').toLowerCase();
      const matchTeks = !kataKunci || mapel.includes(kataKunci) || materi.includes(kataKunci);

      return matchKelas && matchTeks;
    });

    // Handle Tampilan Jika Kosong
    if (filtered.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    } else {
      if (emptyState) emptyState.classList.add('hidden');
    }

// Ganti bagian filtered.forEach di file siswa-kbm.js Anda pada blok ini:
filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = "bg-white rounded-xl shadow-sm border border-slate-100 hover:border-blue-400 p-5 flex flex-col justify-between transition duration-200 transform hover:-translate-y-1 hover:shadow-md";
      
      // Deteksi Warna Badge Berdasarkan Nama Mapel Secara Otomatis
      let badgeColor = "bg-slate-100 text-slate-700";
      const mapelLower = String(item.pelajaran).toLowerCase();
      if (mapelLower.includes("matematika")) badgeColor = "bg-rose-50 text-rose-700 border border-rose-100";
      else if (mapelLower.includes("indonesia")) badgeColor = "bg-amber-50 text-amber-700 border border-amber-100";
      else if (mapelLower.includes("ipa") || mapelLower.includes("ipas")) badgeColor = "bg-emerald-50 text-emerald-700 border border-emerald-100";
      else if (mapelLower.includes("ips")) badgeColor = "bg-indigo-50 text-indigo-700 border border-indigo-100";

      // Buat Elemen Link Buku/Materi jika ada tautan valid
      const punyaLink = item.catatan && (item.catatan.includes('http://') || item.catatan.includes('https://'));
      const tombolBelajar = punyaLink 
        ? `<a href="${item.catatan}" target="_blank" class="w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg block transition shadow-sm">📖 Mulai Belajar Sekarang</a>`
        : `<button disabled class="w-full text-center bg-slate-100 text-slate-400 text-xs font-medium py-2.5 px-4 rounded-lg block cursor-not-allowed">Materi teks/Buku belum disematkan</button>`;

      card.innerHTML = `
        <div>
          <div class="flex justify-between items-start gap-2 mb-3">
            <span class="text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor}">${item.pelajaran}</span>
            <span class="text-xs font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border">Kls ${String(item.kelas).replace(/\D/g, '')}</span>
          </div>
          <h3 class="text-base font-bold text-slate-800 leading-snug mb-2">${item.materi}</h3>
          
          ${(!punyaLink && item.catatan) ? `<p class="text-xs bg-yellow-50 text-yellow-800 p-2 rounded-md mb-4 border border-yellow-100">📌 <b>Catatan Guru:</b> ${item.catatan}</p>` : ''}
        </div>
        
        <div class="mt-4 pt-3 border-t border-slate-50">
          ${tombolBelajar}
        </div>
      `;
      grid.appendChild(card);
    });
  }
};

function submitMateriBaru() {
  // 1. Cari container form input materi baru
  const form = document.getElementById('formInputMateri') || document.querySelector('form');
  
  if (!form) {
    alert("🛑 Sistem Error: Form pengisian materi tidak ditemukan di HTML.");
    return;
  }

  // 2. Ambil semua elemen input di dalam form tersebut secara spesifik
  const elKelas = form.querySelector('[id*="Kelas"]') || form.querySelector('[name*="kelas"]') || form.querySelectorAll('select, input')[0];
  const elPelajaran = form.querySelector('[id*="Pelajar"]') || form.querySelector('[id*="Mapel"]') || form.querySelector('[name*="pelajaran"]') || form.querySelectorAll('select, input')[1];
  const elMateri = form.querySelector('[id*="Materi"]') || form.querySelector('[id*="Teks"]') || form.querySelector('textarea') || form.querySelectorAll('select, input, textarea')[2];
  const elStatus = form.querySelector('[id*="Status"]') || form.querySelector('[name*="status"]') || form.getElementById('inputStatus');
  const elCatatan = form.querySelector('[id*="Catatan"]') || form.querySelector('[name*="catatan"]') || form.getElementById('inputCatatan');

  // 3. Ekstrak Nilai
  const kelas = elKelas ? elKelas.value.trim() : "";
  const pelajaran = elPelajaran ? elPelajaran.value.trim() : "";
  const materi = elMateri ? elMateri.value.trim() : "";
  const status = elStatus ? elStatus.value.trim() : "🔴 Belum";
  const catatan = elCatatan ? elCatatan.value.trim() : "";

  // Log ke console untuk Anda cek (Tekan F12 -> tab Console)
  console.log("Mencoba Membaca Form:", { kelas, pelajaran, materi });

  // 4. Validasi Data
  if (!kelas || kelas === "Semua" || !pelajaran || pelajaran === "Semua" || !materi) {
    alert(`⚠️ Input Gagal Dibaca!
---------------------------------------
Penyebab: Data masih kosong atau bernilai "Semua".

Hasil scan form:
- Kelas Terbaca: "${kelas || 'KOSONG'}"
- Pelajaran Terbaca: "${pelajaran || 'KOSONG'}"
- Isi Materi Terbaca: "${materi ? '✅ Terisi' : 'KOSONG'}"`);
    return;
  }

  // 5. Jalankan Proses Loading
  if (typeof aplikasi !== "undefined" && typeof aplikasi.showLoading === "function") {
    aplikasi.showLoading(true);
  }

  // 6. Kirim ke Google Sheets API via GET
  if (window.KBM_API) {
    const urlTambahkan = `${window.KBM_API}?action=tambahMateriBaru` +
                          `&kelas=${encodeURIComponent(kelas)}` +
                          `&pelajaran=${encodeURIComponent(pelajaran)}` +
                          `&materi=${encodeURIComponent(materi)}` +
                          `&status=${encodeURIComponent(status)}` +
                          `&catatan=${encodeURIComponent(catatan)}`;

    fetch(urlTambahkan, { method: "GET", redirect: "follow" })
      .then(res => res.json())
      .then(response => {
        if (response.success) {
          alert("🎉 Data materi baru berhasil masuk ke Google Sheets!");
          form.reset(); // Reset form otomatis
          
          if (typeof goBack === "function") goBack(); 
          if (typeof aplikasi !== "undefined" && typeof aplikasi.init === "function") {
            aplikasi.init(); // Refresh tabel admin
          }
        } else {
          alert("❌ Gagal menyimpan ke Sheets: " + response.error);
        }
        if (typeof aplikasi !== "undefined" && typeof aplikasi.showLoading === "function") {
          aplikasi.showLoading(false);
        }
      })
      .catch(err => {
        alert("⚠️ Gangguan Jaringan Server: " + err.message);
        if (typeof aplikasi !== "undefined" && typeof aplikasi.showLoading === "function") {
          aplikasi.showLoading(false);
        }
      });
  } else {
    alert("🛑 Konfigurasi Gagal: URL window.KBM_API belum diset.");
  }
}
