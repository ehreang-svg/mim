let mataPelajaranTerpilih = ""; // Menyimpan mapel secara global saat ujian berlangsung
document.addEventListener("DOMContentLoaded", function() {
    loadKelas();
});

// 1. Fungsi mengambil daftar kelas dari spreadsheet
// 1. Fungsi mengambil daftar kelas dari spreadsheet
async function loadKelas() {
    try {
        // Ambil element select
        const selectKelas = document.getElementById("selectKelas");
        if (!selectKelas) return; // Pengaman jika element belum siap di DOM

        // Tambahkan opsi redirect agar fetch tidak mentok di sistem internal google
        const res = await fetch(Quiz_API + "?aksi=getKelas", { method: "GET", redirect: "follow" });
        const data = await res.json();
        
        // Kosongkan dan isi opsi kelas
        selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
        
        if (data.kelas && data.kelas.length > 0) {
            data.kelas.forEach(kelas => {
                let opt = document.createElement("option");
                opt.value = kelas;
                opt.textContent = kelas;
                selectKelas.appendChild(opt);
            });
        }
    } catch (err) {
        console.error("Gagal memuat data kelas:", err);
    }
}
// Contoh fungsi navigasi perpindahan halaman di aplikasi Anda
function bukaHalamanQuiz() {
    // 1. Munculkan halaman quiz dengan menghapus class hidden
    const halamanQuiz = document.getElementById("loginQuiz");
    halamanQuiz.classList.remove("hidden");
    
    // 2. PANGGIL fungsi memuat kelas DI SINI saat halaman aktif
    loadKelas(); 
}
function AksiPilihKelas() {
    loadSiswa();
    loadPelajaran();
}

// 2. Ambil daftar siswa berdasarkan kelas
async function loadSiswa() {
    const kelas = document.getElementById("selectKelas").value;
    const selectSiswa = document.getElementById("selectSiswa");
    if (!kelas) { selectSiswa.innerHTML = '<option value="">-- Pilih Nama --</option>'; selectSiswa.disabled = true; return; }
    
    try {
        // TAMBAHKAN BERIKUT: opsi redirect follow
        const res = await fetch(Quiz_API + "?aksi=getSiswaByKelas&kelas=" + encodeURIComponent(kelas), { method: "GET", redirect: "follow" });
        const data = await res.json();
        selectSiswa.innerHTML = '<option value="">-- Pilih Nama --</option>';
        data.siswa.forEach(s => {
            let opt = document.createElement("option");
            opt.value = s.nisn;
            opt.textContent = s.nama;
            selectSiswa.appendChild(opt);
        });
        selectSiswa.disabled = false;
    } catch (err) { console.error(err); }
}

// 3. Ambil mata pelajaran yang tersedia
async function loadPelajaran() {
    const kelas = document.getElementById("selectKelas").value;
    const selectPelajaran = document.getElementById("selectPelajaran");
    if (!kelas) { selectPelajaran.innerHTML = '<option value="">-- Pilih Pelajaran --</option>'; selectPelajaran.disabled = true; return; }

    try {
        // TAMBAHKAN BERIKUT: opsi redirect follow
        const res = await fetch(Quiz_API + "?aksi=getPelajaranByKelas&kelas=" + encodeURIComponent(kelas), { method: "GET", redirect: "follow" });
        const data = await res.json();
        selectPelajaran.innerHTML = '<option value="">-- Pilih Pelajaran --</option>';
        data.pelajaran.forEach(p => {
            let opt = document.createElement("option");
            opt.value = p;
            opt.textContent = p;
            selectPelajaran.appendChild(opt);
        });
        selectPelajaran.disabled = false;
    } catch (err) { console.error(err); }
}
// 3. Proses Login Utama
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
        const res = await fetch(Quiz_API + `?aksi=loginQuiz&nisn=${passwordNisn}&pelajaran=${encodeURIComponent(mataPelajaranTerpilih)}`);
        const data = await res.json();
        
        if (data.error) { alert(data.error); return; }

        dataSiswaQuiz = data.siswa;
        dataSoal = data.soal;
        
        tampilSiswaQuiz();
        tampilSoal();
    } catch (err) { alert("Gagal menyambung ke server."); }
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
    if (dataSoal.length === 0) {
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
}

async function simpanSoalBaru(event) {
    event.preventDefault(); // Mencegah reload halaman saat form disubmit
    
    const btnSubmit = document.getElementById("btnSimpanSoal");
    const teksAsliTombol = btnSubmit.innerText;
    
    btnSubmit.disabled = true;
    btnSubmit.innerText = "⏳ Sedang Menyimpan...";

    // Ambil semua value dari form input
    const payload = {
        tipe: "tambahSoal", // Penanda instruksi untuk sisi backend Google Apps Script
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
        // Mengirim data ke Google Apps Script menggunakan POST
        const response = await fetch(Quiz_API, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const hasil = await response.text();

        if (hasil === "OK_SOAL_TERSMPAN") {
            alert("🎉 Soal berhasil disimpan ke database!");
            document.getElementById("formInputSoal").reset(); // Kosongkan form kembali
        } else {
            alert("⚠️ Gagal menyimpan soal: " + hasil);
        }
    } catch (err) {
        console.error(err);
        alert("❌ Terjadi kesalahan jaringan / sistem gagal terhubung.");
    } finally {
        // Kembalikan status tombol seperti semula
        btnSubmit.disabled = false;
        btnSubmit.innerText = teksAsliTombol;
    }
}
