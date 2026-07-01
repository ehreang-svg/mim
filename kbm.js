const aplikasi = {
      masterData: [],

      init: function() {
        this.muatDataDariSheets();
      },

      showLoading: function(status) {
        const el = document.getElementById('loadingStatus');
        if(status) el.classList.remove('hidden');
        else el.classList.add('hidden');
      },

      muatDataDariSheets: function() {
        this.showLoading(true);
        // Memanggil fungsi Apps Script backend secara asinkronus
        google.script.run
          .withSuccessHandler((response) => {
            if(response.success) {
              this.masterData = response.data;
              this.filterDanTampilkan();
            } else {
              alert("Gagal memuat data: " + response.error);
            }
            this.showLoading(false);
          })
          .withFailureHandler((err) => {
            alert("Sistem Error: " + err);
            this.showLoading(false);
          })
          .getMateriData();
      },

      filterDanTampilkan: function() {
        const fKelas = document.getElementById('filterKelas').value;
        const fPelajaran = document.getElementById('filterPelajaran').value;
        const fStatus = document.getElementById('filterStatus').value;

        // Proses Penyaringan data
        const filtered = this.masterData.filter(item => {
          const matchKelas = (fKelas === "Semua" || String(item.kelas) === fKelas);
          const matchPelajaran = (fPelajaran === "Semua" || item.pelajaran === fPelajaran);
          const matchStatus = (fStatus === "Semua" || item.status === fStatus);
          return matchKelas && matchPelajaran && matchStatus;
        });

        // Hitung statistik berdasarkan data yang sedang terfilter
        const total = filtered.length;
        const selesai = filtered.filter(i => i.status === "🟢 Selesai").length;
        const proses = filtered.filter(i => i.status === "🟡 Proses").length;
        const persen = total > 0 ? Math.round((selesai / total) * 100) : 0;

        document.getElementById('statTotal').innerText = total;
        document.getElementById('statSelesai').innerText = selesai;
        document.getElementById('statProses').innerText = proses;
        document.getElementById('statPersen').innerText = persen + "%";

        // Render komponen ke tabel DOM HTML
        const tbody = document.getElementById('tabelMateriBody');
        const emptyState = document.getElementById('emptyState');
        tbody.innerHTML = "";

        if (filtered.length === 0) {
          emptyState.classList.remove('hidden');
          return;
        } else {
          emptyState.classList.add('hidden');
        }

        filtered.forEach((item, index) => {
          const tr = document.createElement('tr');
          tr.className = index % 2 === 0 ? 'bg-white hover:bg-slate-50 transition' : 'bg-slate-50/50 hover:bg-slate-50 transition';
          
          tr.innerHTML = `
            <td class="py-3 px-4 text-center font-bold text-slate-600">${item.kelas}</td>
            <td class="py-3 px-4 font-semibold text-slate-700">${item.pelajaran}</td>
            <td class="py-3 px-4 text-slate-800 font-medium">${item.materi}</td>
            <td class="py-3 px-4 text-center">
              <select onchange="aplikasi.ubahStatus(${item.rowNumber}, this.value)" class="w-full text-sm rounded border border-slate-300 p-1 bg-white focus:ring-1 focus:ring-blue-500">
                <option value="🔴 Belum" ${item.status === '🔴 Belum' ? 'selected':''}>🔴 Belum</option>
                <option value="🟡 Proses" ${item.status === '🟡 Proses' ? 'selected':''}>🟡 Proses</option>
                <option value="🟢 Selesai" ${item.status === '🟢 Selesai' ? 'selected':''}>🟢 Selesai</option>
              </select>
            </td>
            <td class="py-3 px-4">
              <input type="text" value="${item.catatan}" placeholder="Link materi / catatan kecil" 
                     onchange="aplikasi.ubahCatatan(${item.rowNumber}, this.value)"
                     class="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400">
            </td>
          `;
          tbody.appendChild(tr);
        });
      },

      ubahStatus: function(rowNumber, newStatus) {
        this.showLoading(true);
        // Sinkronisasi status ke baris sel di Google Sheet asli
        google.script.run
          .withSuccessHandler((res) => {
            if(res.success) {
              // Update state data lokal aplikasi agar visual sinkron
              const idx = this.masterData.findIndex(item => item.rowNumber === rowNumber);
              if(idx !== -1) this.masterData[idx].status = newStatus;
              this.filterDanTampilkan();
            } else {
              alert("Gagal merubah data di Google Sheets: " + res.error);
            }
            this.showLoading(false);
          })
          .updateStatusMateri(rowNumber, newStatus);
      },

      ubahCatatan: function(rowNumber, newCatatan) {
        this.showLoading(true);
        google.script.run
          .withSuccessHandler((res) => {
            if(res.success) {
              const idx = this.masterData.findIndex(item => item.rowNumber === rowNumber);
              if(idx !== -1) this.masterData[idx].catatan = newCatatan;
            } else {
              alert("Gagal menyimpan catatan: " + res.error);
            }
            this.showLoading(false);
          })
          .updateCatatanMateri(rowNumber, newCatatan);
      }
    };

    // Menjalankan inisialisasi aplikasi saat dokumen HTML siap
    window.onload = () => aplikasi.init();
