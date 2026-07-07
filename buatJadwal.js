 let databaseMaps = null;

    window.onload = function() {
      fetch(`${JADWAL_API}?action=getMapData`)
        .then(response => response.json())
        .then(data => { inisialisasiDropdown(data); })
        .catch(err => { document.getElementById("loader").innerHTML = `<span class="text-danger">Gagal memuat database internal.</span>`; });
      muatDataLog();
    };

    function inisialisasiDropdown(maps) {
      databaseMaps = maps;
      const guruSelect = document.getElementById("guruSelect");
      const mapelSelect = document.getElementById("mapelSelect");

      Object.keys(maps.mapGuru).forEach(namaKey => {
        const namaFormat = namaKey.replace(/\b\w/g, c => c.toUpperCase());
        let opt = document.createElement("option");
        opt.value = namaKey; opt.textContent = namaFormat; guruSelect.appendChild(opt);
      });

      Object.keys(maps.mapMapel).forEach(mapelKey => {
        let opt = document.createElement("option");
        opt.value = mapelKey; opt.textContent = mapelKey.toUpperCase(); mapelSelect.appendChild(opt);
      });

      document.getElementById("loader").style.display = "none";
      document.getElementById("formArea").style.display = "block";
    }

    function cekKombinasi() {
      const guruVal = document.getElementById("guruSelect").value;
      const mapelVal = document.getElementById("mapelSelect").value;
      const hasilBox = document.getElementById("hasilBox");
      const kodeDisplay = document.getElementById("kodeDisplay");
      const infoDetail = document.getElementById("infoDetail");
      const btnSimpan = document.getElementById("btnSimpan");

      if (!guruVal || !mapelVal) { hasilBox.style.display = "none"; return; }

      const kodeGuru = databaseMaps.mapGuru[guruVal] || "";
      const kodeMapel = databaseMaps.mapMapel[mapelVal] || "";

      if (kodeGuru && kodeMapel) {
        hasilBox.style.display = "block";
        kodeDisplay.textContent = kodeGuru + kodeMapel;
        infoDetail.textContent = `Guru: ${kodeGuru} | Mapel: ${kodeMapel}`;
        btnSimpan.disabled = false; btnSimpan.textContent = "Simpan ke Spreadsheet";
      } else {
        hasilBox.style.display = "block"; kodeDisplay.textContent = "??";
        infoDetail.textContent = "Kombinasi kode tidak valid."; btnSimpan.disabled = true;
      }
    }

    function simpanKeSpreadsheet() {
      const guruSelect = document.getElementById("guruSelect");
      const mapelSelect = document.getElementById("mapelSelect");
      const btnSimpan = document.getElementById("btnSimpan");
      
      const namaGuru = guruSelect.options[guruSelect.selectedIndex].text;
      const namaMapel = mapelSelect.options[mapelSelect.selectedIndex].text;
      const kodeGabungan = document.getElementById("kodeDisplay").textContent;

      btnSimpan.disabled = true; btnSimpan.textContent = "Menyimpan...";

      fetch(JADWAL_API, {
        method: "POST",
        body: JSON.stringify({ guru: namaGuru, mapel: namaMapel, kode: kodeGabungan })
      })
      .then(response => response.json())
      .then(res => {
        if(res.status) { btnSimpan.textContent = "Tersimpan ✅"; muatDataLog(); } 
        else { alert("Gagal: " + res.message); btnSimpan.disabled = false; }
      })
      .catch(err => { alert("Koneksi bermasalah."); btnSimpan.disabled = false; });
    }

    function muatDataLog() {
      const tableBody = document.getElementById("logTableBody");
      fetch(`${JADWAL_API}?action=getLogData`)
        .then(response => response.json())
        .then(res => {
          if (res.status && res.data.length > 0) {
            tableBody.innerHTML = "";
            res.data.forEach(item => {
              let row = document.createElement("tr");
              row.innerHTML = `<td><div class="fw-semibold">${item.guru}</div><div class="text-kecil">${item.mapel}</div></td><td class="text-center fw-bold text-success bg-light">${item.kode}</td>`;
              tableBody.appendChild(row);
            });
          } else {
            tableBody.innerHTML = `<tr><td colspan="2" class="text-center text-muted py-2">Belum ada riwayat.</td></tr>`;
          }
        });
    }

    // FUNGSI BARU UNTUK TOMBOL GENERATE JADWAL
    function prosesGenerateJadwal() {
      const btn = document.getElementById("btnGenerate");
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
