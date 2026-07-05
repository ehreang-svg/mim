let mataPelajaranTerpilih = ""; // Menyimpan mapel secara global saat ujian berlangsung

// Trigger gabungan saat kelas diubah
function AksiPilihKelas() {
    loadSiswa();
    loadPelajaran();
}

// 1. Ambil daftar siswa berdasarkan kelas
async function loadSiswa() {
    const kelas = document.getElementById("selectKelas").value;
    const selectSiswa = document.getElementById("selectSiswa");
    if (!kelas) { selectSiswa.innerHTML = '<option value="">-- Pilih Nama --</option>'; selectSiswa.disabled = true; return; }
    
    try {
        const res = await fetch(Quiz_API + "?aksi=getSiswaByKelas&kelas=" + encodeURIComponent(kelas));
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

// 2. Ambil mata pelajaran yang tersedia di kelas tersebut
async function loadPelajaran() {
    const kelas = document.getElementById("selectKelas").value;
    const selectPelajaran = document.getElementById("selectPelajaran");
    if (!kelas) { selectPelajaran.innerHTML = '<option value="">-- Pilih Pelajaran --</option>'; selectPelajaran.disabled = true; return; }

    try {
        const res = await fetch(Quiz_API + "?aksi=getPelajaranByKelas&kelas=" + encodeURIComponent(kelas));
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
                <p>Kelas: ${dataSiswaQuiz.kelas} | Mapel: <b>${mataPelajaranTerpilih}</b></p>
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
