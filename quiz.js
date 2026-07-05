// Jalankan fungsi ini saat aplikasi pertama kali dimuat (misal di halaman utama/saat membuka menu quiz)
document.addEventListener("DOMContentLoaded", function() {
    loadKelas();
});

// 1. Fungsi mengambil daftar kelas dari spreadsheet
async function loadKelas() {
    try {
        const res = await fetch(Quiz_API + "?aksi=getKelas");
        const data = await res.json();
        const selectKelas = document.getElementById("selectKelas");
        
        // Kosongkan dan isi opsi kelas
        selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
        data.kelas.forEach(kelas => {
            let opt = document.createElement("option");
            opt.value = kelas;
            opt.textContent = kelas;
            selectKelas.appendChild(opt);
        });
    } catch (err) {
        console.error("Gagal memuat data kelas:", err);
    }
}

// 2. Fungsi mengambil daftar siswa setelah kelas dipilih
async function loadSiswa() {
    const kelas = document.getElementById("selectKelas").value;
    const selectSiswa = document.getElementById("selectSiswa");
    
    if (!kelas) {
        selectSiswa.innerHTML = '<option value="">-- Pilih Nama --</option>';
        selectSiswa.disabled = true;
        return;
    }
    
    selectSiswa.innerHTML = '<option value="">Memuat nama siswa...</option>';
    selectSiswa.disabled = true;

    try {
        const res = await fetch(Quiz_API + "?aksi=getSiswaByKelas&kelas=" + encodeURIComponent(kelas));
        const data = await res.json();
        
        selectSiswa.innerHTML = '<option value="">-- Pilih Nama --</option>';
        data.siswa.forEach(siswa => {
            let opt = document.createElement("option");
            opt.value = siswa.nisn; // Kita simpan NISN di value untuk dicocokkan nanti
            opt.textContent = siswa.nama;
            selectSiswa.appendChild(opt);
        });
        selectSiswa.disabled = false;
    } catch (err) {
        console.error("Gagal memuat data siswa:", err);
        selectSiswa.innerHTML = '<option value="">Gagal memuat data</option>';
    }
}

// 3. Fungsi Login / Mulai Quiz yang telah disesuaikan
async function mulai() {
    const selectSiswa = document.getElementById("selectSiswa");
    const passwordNisn = document.getElementById("passwordNisn").value;
    const nisnTerpilih = selectSiswa.value;

    if (!nisnTerpilih) {
        alert("Silakan pilih Nama Siswa terlebih dahulu!");
        return;
    }
    if (!passwordNisn) {
        alert("Silakan masukkan Password!");
        return;
    }
    
    // Validasi apakah password yang dimasukkan sama dengan NISN dari nama yang dipilih
    if (passwordNisn !== nisnTerpilih) {
        alert("Password (NISN) yang Anda masukkan salah untuk siswa tersebut!");
        return;
    }

    // Tampilkan efek loading jika diperlukan
    document.getElementById("siswa").innerHTML = "<p>Memvalidasi login & mengambil soal...</p>";

    try {
        // Ambil data siswa lengkap beserta soal berdasarkan NISN (Password) yang valid
        const res = await fetch(Quiz_API + "?aksi=loginQuiz&nisn=" + passwordNisn);
        const data = await res.json();
        
        if (data.error) {
            alert(data.error);
            document.getElementById("siswa").innerHTML = "";
            return;
        }

        dataSiswaQuiz = data.siswa;
        dataSoal = data.soal;
        
        // Bersihkan form input login agar rapi setelah sukses masuk
        document.getElementById("selectKelas").value = "";
        document.getElementById("selectSiswa").innerHTML = '<option value="">-- Pilih Nama --</option>';
        document.getElementById("selectSiswa").disabled = true;
        document.getElementById("passwordNisn").value = "";

        // Tampilkan profile siswa dan lembar soal
        tampilSiswaQuiz();
        tampilSoal();
    } catch (err) {
        alert("Terjadi kesalahan koneksi sistem.");
        console.error(err);
    }
}
function tampilSiswaQuiz(){

    console.log(dataSiswaQuiz);

    if(!dataSiswaQuiz){
        console.error("Data siswa tidak ditemukan");
        return;
    }

    document.getElementById("siswa").innerHTML = `
        <div class="cardQuiz">
            <img src="${dataSiswaQuiz.foto || ''}">
            <h3>${dataSiswaQuiz.nama || '-'}</h3>
            <p>NISN : ${dataSiswaQuiz.nisn || '-'}</p>
            <p>Kelas : ${dataSiswaQuiz.kelas || '-'}</p>
        </div>
    `;
}
function tampilSoal(){
let html="";
dataSoal.forEach((s,index)=>{
html+=`
<div class="cardQuiz" style="text-align:left";>
<p>
<b>${s.no}. ${s.soal}</b>
</p>
<label>
<input type="radio"
name="q${index}"
value="A">
${s.A}
</label><br>
<label>
<input type="radio"
name="q${index}"
value="B">
${s.B}
</label><br>
<label>
<input type="radio"
name="q${index}"
value="C">
${s.C}
</label><br>
<label>
<input type="radio"
name="q${index}"
value="D">
${s.D}
</label>
</div>
`;
});
html+=`
<button type="button"
onclick="koreksi()">
Kirim
</button>
`;
document.getElementById("quiz")
.innerHTML=html;
}
async function koreksi(){
let benar=0;
dataSoal.forEach((s,index)=>{
let jwb=
document.querySelector(
`input[name=q${index}]:checked`
);
if(jwb &&
jwb.value===s.jawaban){
benar++;
}
});
let nilai=
Math.round(
(benar/dataSoal.length)*100
);
let status=
nilai>=75
? "LULUS"
: "BELUM LULUS";
document.getElementById("hasil")
.innerHTML=
`
<h2>Nilai : ${nilai}</h2>
<h2>Status : ${status}</h2>
`;
await fetch(Quiz_API,{
method:"POST",
body:JSON.stringify({
nisn:dataSiswaQuiz.nisn,
nama:dataSiswaQuiz.nama,
nilai:nilai,
status:status
})
});
}
