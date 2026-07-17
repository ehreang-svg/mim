let mataPelajaranTerpilih = ""; // Menyimpan mapel secara global saat ujian berlangsung
let dataSiswaQuiz = null;
// Pastikan variabel ini terinisialisasi di atas

// Jalankan saat halaman pertama dimuat
document.addEventListener("DOMContentLoaded", function() {
    loadKelas();
});

// Fungsi navigasi perpindahan halaman
function bukaHalamanQuiz() {
    const halamanQuiz = document.getElementById("loginQuiz");
    if (halamanQuiz) {
        halamanQuiz.classList.remove("hidden");
    }
    loadKelas(); 
}

// 1. Fungsi mengambil daftar kelas dari spreadsheet
async function loadKelas() {
    try {
        const selectKelas = document.getElementById("selectKelas");
        if (!selectKelas) {
            console.error("Elemen dengan ID 'selectKelas' tidak ditemukan di HTML.");
            return;
        }

        // PERBAIKAN: Gunakan window.Quiz_API secara eksplisit agar URL terbaca sempurna
        const urlAPI = window.Quiz_API;
        if (!urlAPI) {
            console.error("window.Quiz_API belum terdefinisi. Pastikan urutan script sudah benar.");
            return;
        }

        console.log("Memanggil URL:", urlAPI + "?aksi=getKelas");
        
        const res = await fetch(urlAPI + "?aksi=getKelas", { 
            method: "GET", 
            redirect: "follow" 
        });
        
        if (!res.ok) {
            console.error("Respon server bermasalah. Status:", res.status);
            return;
        }

        const data = await res.json();
        console.log("Data mentah dari Apps Script:", data);

        selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
        
        // Memastikan ekstraksi list kelas aman baik dari properti objek maupun array langsung
        let listKelas = [];
        if (data && data.kelas && Array.isArray(data.kelas)) {
            listKelas = data.kelas;
        } else if (Array.isArray(data)) {
            listKelas = data;
        }
        
        if (listKelas.length > 0) {
            listKelas.forEach(kelas => {
                let opt = document.createElement("option");
                opt.value = kelas;
                opt.textContent = kelas;
                selectKelas.appendChild(opt);
            });
            console.log("Dropdown kelas sukses diisi.");
        } else {
            console.warn("Koneksi sukses, tetapi list kelas kosong dari spreadsheet.");
        }
    } catch (err) {
        console.error("Gagal total memuat kelas akibat kendala sistem:", err);
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
        const res = await fetch(Quiz_API + "?aksi=getSiswaByKelas&kelas=" + encodeURIComponent(kelas), { method: "GET", redirect: "follow" });
        const data = await res.json();
        selectSiswa.innerHTML = '<option value="">-- Pilih Nama --</option>';
        
        let listSiswa = [];
        if (data && data.siswa && Array.isArray(data.siswa)) {
            listSiswa = data.siswa;
        } else if (Array.isArray(data)) {
            listSiswa = data;
        }

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

// 3. Ambil mata pelajaran yang tersedia
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
        
        let listPelajaran = [];
        if (data && data.pelajaran && Array.isArray(data.pelajaran)) {
            listPelajaran = data.pelajaran;
        } else if (Array.isArray(data)) {
            listPelajaran = data;
        }

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
        const res = await fetch(Quiz_API + `?aksi=loginQuiz&nisn=${passwordNisn}&pelajaran=${encodeURIComponent(mataPelajaranTerpilih)}`, { method: "GET", redirect: "follow" });
        const data = await res.json();
        
        if (data.error) { alert(data.error); return; }

        dataSiswaQuiz = data.siswa;
        dataSoal = data.soal;
        
        tampilSiswaQuiz();
        tampilSoal();
    } catch (err) { 
        alert("Gagal menyambung ke server."); 
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
        await fetch(Quiz_API, {
            method: "POST",
            body: JSON.stringify({
                nisn: dataSiswaQuiz.nisn,
                nama: dataSiswaQuiz.nama,
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
        const response = await fetch(Quiz_API, {
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
