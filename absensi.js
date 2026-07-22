/* ================= ABSENSI GURU & SISWA ================= */

const SEKOLAH_LAT = -6.542478333333334;
const SEKOLAH_LNG = 108.431605;

const ABSEN_API = window.ABSEN_API || "";
const SCRIPT_URL = ABSEN_API;

// Inisialisasi variabel global
const HARI_LIBUR = window.HARI_LIBUR || []; // Cegah error jika HARI_LIBUR tidak didefinisikan
let rekapGuruData = [];
let dataSiswa = [];

/* ================= UTILS & HELPER ================= */

// Hitung jarak Haversine (meter)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Convert file ke Base64
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = err => reject(err);
    });
}

function showLoading(state, text = "Loading...") {
    const el = document.getElementById("loading");
    if (!el) return;
    el.innerText = text;
    el.style.display = state ? "block" : "none";
}

function showNotif(msg) {
    const n = document.getElementById("notif");
    if (!n) return;
    n.innerText = msg;
    n.style.display = "block";
    setTimeout(() => { n.style.display = "none"; }, 3000);
}

/* ================= ABSENSI GURU ================= */

async function submitAbsen() {
    try {
        const now = new Date();
        const today = now.toISOString().split("T")[0];

        if (now.getDay() === 0) {
            alert("Hari libur");
            return;
        }

        if (HARI_LIBUR.includes(today)) {
            alert("Hari libur nasional");
            return;
        }

        const jenisEl = document.getElementById("jenisAbsen");
        const fotoEl = document.getElementById("fotoAbsen");
        const jenis = jenisEl ? jenisEl.value : "";
        const file = fotoEl && fotoEl.files ? fotoEl.files[0] : null;

        if (jenis === "MASUK" && !file) {
            alert("Foto wajib diisi");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const jarak = getDistance(lat, lng, SEKOLAH_LAT, SEKOLAH_LNG);

                if (jarak > 100) {
                    alert("Diluar radius sekolah");
                    return;
                }

                const lokasiStatus = document.getElementById("lokasiStatus");
                if (lokasiStatus) {
                    lokasiStatus.innerHTML = "Jarak ke sekolah: " + Math.round(jarak) + " meter";
                }

                const statusKehadiran = (now.getHours() > 7 || (now.getHours() === 7 && now.getMinutes() > 15))
                    ? "TERLAMBAT"
                    : "TEPAT WAKTU";

                let foto = "";
                if (jenis === "MASUK" && file) {
                    foto = await toBase64(file);
                }

                const namaEl = document.getElementById("absenNama");
                const kehadiranEl = document.getElementById("kehadiran");

                const payload = {
                    action: "absenGuru",
                    jenis: jenis,
                    hari: now.toLocaleDateString("id-ID", { weekday: "long" }),
                    tanggal: now.getDate(),
                    bulan: now.toLocaleDateString("id-ID", { month: "long" }),
                    nama: namaEl ? namaEl.value : "",
                    kehadiran: kehadiranEl ? kehadiranEl.value : "",
                    masuk: jenis === "MASUK" ? now.toLocaleTimeString("id-ID") : "",
                    pulang: jenis === "PULANG" ? now.toLocaleTimeString("id-ID") : "",
                    statusKehadiran: statusKehadiran,
                    foto: foto
                };

                const response = await fetch(ABSEN_API, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                alert(data.message);

                if (data.status && fotoEl) {
                    fotoEl.value = "";
                }

            } catch (err) {
                alert("Error\n" + err);
            }
        },
        err => alert("GPS gagal\n" + err.message),
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        });

    } catch (err) {
        alert(err);
    }
}

/* ================= REKAP GURU ================= */

async function loadRekap() {
    const loading = document.getElementById("loadingRekap");
    const tbody = document.getElementById("rekapBody");
    const filterBulan = document.getElementById("filterBulan");

    if (!tbody) {
        console.error("rekapBody tidak ditemukan");
        return;
    }

    try {
        if (loading) loading.classList.remove("hidden");
        tbody.innerHTML = "";

        const bulan = filterBulan ? filterBulan.value : "";
        const response = await fetch(`${ABSEN_API}?action=getRekap&bulan=${encodeURIComponent(bulan)}`);
        const data = await response.json();

        if (!data.status) {
            tbody.innerHTML = `<tr><td colspan="7">Gagal memuat data</td></tr>`;
            return;
        }

        rekapGuruData = data.rekap;
        renderRekapTable(rekapGuruData);

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="7">Terjadi kesalahan</td></tr>`;
    } finally {
        if (loading) loading.classList.add("hidden");
    }
}

function renderRekapTable(data) {
    const tbody = document.getElementById("rekapBody");
    const filterBulan = document.getElementById("filterBulan");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">Tidak ada data</td></tr>`;
        return;
    }

    const bulanVal = filterBulan ? filterBulan.value : "";

    data.forEach((guru, index) => {
        const persen = Math.min(100, Math.max(0, Math.round((guru.hadir / 22) * 100)));

        let badge = "badge-green";
        if (persen < 90) badge = "badge-orange";
        if (persen < 75) badge = "badge-red";

        tbody.innerHTML += `
        <tr>
            <td>${index + 1}</td>
            <td><b>${guru.nama}</b></td>
            <td>${guru.hadir}</td>
            <td>${guru.terlambat}</td>
            <td>${guru.tidakMasuk}</td>
            <td>
                <span class="badge ${badge}">${persen}%</span>
                <div class="progress">
                    <div class="progress-bar" style="width:${persen}%"></div>
                </div>
            </td>
            <td>
                <button class="btn-primary" onclick="cetakGuru('${guru.nama}','${bulanVal}')">
                    📄 Cetak
                </button>
            </td>
        </tr>`;
    });
}

async function cetakGuru(nama, bulan) {
    try {
        const res = await fetch(ABSEN_API, {
            method: "POST",
            body: new URLSearchParams({
                action: "exportGuruPDF",
                nama: nama,
                bulan: bulan
            })
        });
        const data = await res.json();
        if (data.status) {
            window.open(data.url, "_blank");
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert("Gagal mencetak: " + err);
    }
}

async function exportPDF() {
    const filterBulan = document.getElementById("filterBulan");
    const bulan = filterBulan ? filterBulan.value : "";

    try {
        const res = await fetch(ABSEN_API, {
            method: "POST",
            body: new URLSearchParams({
                action: "exportRekapPDF",
                bulan: bulan
            })
        });
        const data = await res.json();
        if (data.status) {
            window.open(data.url, "_blank");
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert("Gagal melakukan export: " + err);
    }
}

/* ================= ABSENSI SISWA ================= */

async function loadDataSiswa() {
    try {
        const res = await fetch(ABSEN_API + "?action=getDataSiswa");
        const result = await res.json();

        if (!result.status) {
            alert(result.message);
            return;
        }

        dataSiswa = result.data;

        const kelasSelect = document.getElementById("kelasFilter");
        const namaSelect = document.getElementById("namaSiswa");
        const kelasInput = document.getElementById("kelasSiswa");

        if (kelasSelect) {
            kelasSelect.innerHTML = '<option value="">Pilih Kelas</option>';
            [...new Set(dataSiswa.map(x => x.kelas))]
                .sort()
                .forEach(k => {
                    kelasSelect.innerHTML += `<option value="${k}">${k}</option>`;
                });
        }

        if (namaSelect) namaSelect.innerHTML = '<option value="">Pilih Nama Siswa</option>';
        if (kelasInput) kelasInput.value = "";

    } catch (err) {
        console.error("Gagal memuat data siswa:", err);
    }
}

function filterKelas() {
    const kelasSelect = document.getElementById("kelasFilter");
    const namaSelect = document.getElementById("namaSiswa");
    const kelasInput = document.getElementById("kelasSiswa");

    if (!kelasSelect || !namaSelect) return;

    const kelas = kelasSelect.value;
    namaSelect.innerHTML = '<option value="">Pilih Nama Siswa</option>';
    if (kelasInput) kelasInput.value = "";

    dataSiswa
        .filter(x => x.kelas === kelas)
        .sort((a, b) => a.nama.localeCompare(b.nama))
        .forEach(x => {
            namaSelect.innerHTML += `<option value="${x.nama}">${x.nama}</option>`;
        });
}

function pilihSiswa() {
    const namaSelect = document.getElementById("namaSiswa");
    const kelasInput = document.getElementById("kelasSiswa");
    if (!namaSelect || !kelasInput) return;

    const siswa = dataSiswa.find(x => x.nama === namaSelect.value);
    kelasInput.value = siswa ? siswa.kelas : "";
}

async function submitAbsenSiswa() {
    const namaSelect = document.getElementById("namaSiswa");
    const kelasInput = document.getElementById("kelasSiswa");
    const kehadiranSelect = document.getElementById("kehadiranSiswa");

    if (!namaSelect || !namaSelect.value) {
        alert("Pilih siswa.");
        return;
    }

    const sekarang = new Date();

    try {
        const res = await fetch(ABSEN_API, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "absenSiswa",
                hari: sekarang.toLocaleDateString("id-ID", { weekday: "long" }),
                tanggal: sekarang.getDate(),
                bulan: sekarang.toLocaleDateString("id-ID", { month: "long" }),
                nama: namaSelect.value,
                kelas: kelasInput ? kelasInput.value : "",
                kehadiran: kehadiranSelect ? kehadiranSelect.value : "HADIR",
                masuk: sekarang.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
                pulang: "",
                statusKehadiran: ""
            })
        });

        const result = await res.json();
        alert(result.message);

    } catch (err) {
        alert("Gagal menyimpan absensi siswa: " + err);
    }
}

/* ================= REKAP SISWA ================= */

async function loadRekapSiswa() {
    try {
        const filterBulan = document.getElementById("filterBulanSiswa");
        const kelasPilihan = document.getElementById("filterKelas") ? document.getElementById("filterKelas").value : "";
        const namaPilihan = document.getElementById("filterNamaSiswaRekap") ? document.getElementById("filterNamaSiswaRekap").value : "";
        const bulan = filterBulan ? filterBulan.value : "";

        const res = await fetch(`${ABSEN_API}?action=getRekapSiswa&bulan=${encodeURIComponent(bulan)}`);
        const result = await res.json();

        if (!result.status) {
            alert(result.message);
            return;
        }

        let dataTerfilter = result.rekap || [];

        if (kelasPilihan) {
            dataTerfilter = dataTerfilter.filter(x => x.kelas === kelasPilihan);
        }

        if (namaPilihan) {
            dataTerfilter = dataTerfilter.filter(x => x.nama === namaPilihan);
        }

        tampilRekapSiswa(dataTerfilter);

    } catch (err) {
        alert("Gagal memuat rekap siswa: " + err);
    }
}

function tampilRekapSiswa(data) {
    const rekapBox = document.getElementById("rekapSiswaBox");
    const filterBulan = document.getElementById("filterBulanSiswa");
    if (!rekapBox) return;

    if (!data || data.length === 0) {
        rekapBox.innerHTML = "<p>Tidak ada data rekap siswa.</p>";
        return;
    }

    const bulanVal = filterBulan ? filterBulan.value : "";

    let html = `
    <table class="table">
        <thead>
            <tr>
                <th>No</th>
                <th>Nama</th>
                <th>Kelas</th>
                <th>Hadir</th>
                <th>Izin</th>
                <th>Sakit</th>
                <th>Terlambat</th>
                <th>%</th>
                <th>Aksi</th>
            </tr>
        </thead>
        <tbody>
    `;

    data.forEach((x, i) => {
        const persen = Math.round((x.hadir / 22) * 100);

        html += `
        <tr>
            <td>${i + 1}</td>
            <td><b>${x.nama}</b></td>
            <td>${x.kelas}</td>
            <td>${x.hadir}</td>
            <td>${x.izin}</td>
            <td>${x.sakit}</td>
            <td>${x.terlambat}</td>
            <td>${persen}%</td>
            <td>
                <button onclick="cetakSiswa('${x.nama}', '${bulanVal}')">
                    📄 Cetak
                </button>
            </td>
        </tr>
        `;
    });

    html += `
        </tbody>
    </table>`;

    rekapBox.innerHTML = html;
}

function gantiKelasRekap() {
    const kelasSelect = document.getElementById("filterKelas");
    const namaSelect = document.getElementById("filterNamaSiswaRekap");
    if (!namaSelect) return;

    const kelas = kelasSelect ? kelasSelect.value : "";

    namaSelect.innerHTML = '<option value="">Semua Siswa</option>';

    dataSiswa
        .filter(x => !kelas || x.kelas === kelas)
        .sort((a, b) => a.nama.localeCompare(b.nama))
        .forEach(x => {
            namaSelect.innerHTML += `<option value="${x.nama}">${x.nama}</option>`;
        });

    loadRekapSiswa();
}

async function loadKelasRekap() {
    await loadDataSiswa();

    const select = document.getElementById("filterKelas");
    if (!select) return;

    select.innerHTML = '<option value="">Semua Kelas</option>';

    [...new Set(dataSiswa.map(x => x.kelas))]
        .sort()
        .forEach(k => {
            select.innerHTML += `<option value="${k}">${k}</option>`;
        });
}

function loadFilterNamaSiswa() {
    const namaSelect = document.getElementById("filterNamaSiswaRekap");
    if (!namaSelect) return;

    namaSelect.innerHTML = '<option value="">Semua Siswa</option>';

    dataSiswa.forEach(x => {
        namaSelect.innerHTML += `<option value="${x.nama}">${x.nama}</option>`;
    });
}

async function cetakSiswa(nama, bulan) {
    try {
        const res = await fetch(ABSEN_API, {
            method: "POST",
            body: new URLSearchParams({
                action: "exportSiswaPDF",
                nama: nama,
                bulan: bulan
            })
        });

        const data = await res.json();
        if (data.status) {
            window.open(data.url, "_blank");
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert("Gagal cetak siswa: " + err);
    }
}

async function exportPDFSiswa() {
    const bulan = document.getElementById("filterBulanSiswa") ? document.getElementById("filterBulanSiswa").value : "";
    const kelas = document.getElementById("filterKelas") ? document.getElementById("filterKelas").value : "";

    try {
        const res = await fetch(ABSEN_API, {
            method: "POST",
            body: new URLSearchParams({
                action: "exportRekapSiswaPDF",
                bulan: bulan,
                kelas: kelas
            })
        });

        const data = await res.json();
        if (data.status) {
            window.open(data.url, "_blank");
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert("Gagal export PDF siswa: " + err);
    }
}

/* ================= ABSENSI KOLEKTIF ================= */

function renderTabelAbsenKolektif() {
    const kelasSelect = document.getElementById("kelasFilter");
    const container = document.getElementById("containerAbsenKolektif");
    if (!container || !kelasSelect) return;

    const kelas = kelasSelect.value;

    if (!kelas) {
        container.innerHTML = "<p>Pilih kelas terlebih dahulu.</p>";
        return;
    }

    const siswaKelas = dataSiswa
        .filter(x => x.kelas === kelas)
        .sort((a, b) => a.nama.localeCompare(b.nama));

    if (siswaKelas.length === 0) {
        container.innerHTML = "<p>Tidak ada siswa di kelas ini.</p>";
        return;
    }

    let html = `
    <table class="table align-middle">
        <thead>
            <tr>
                <th>No</th>
                <th>Nama Siswa</th>
                <th>Status Kehadiran</th>
            </tr>
        </thead>
        <tbody>
    `;

    siswaKelas.forEach((s, idx) => {
        html += `
        <tr>
            <td>${idx + 1}</td>
            <td><strong>${s.nama}</strong></td>
            <td>
                <select class="form-select status-kehadiran-siswa" data-nama="${s.nama}" data-kelas="${s.kelas}">
                    <option value="HADIR" selected>HADIR</option>
                    <option value="IZIN">IZIN</option>
                    <option value="SAKIT">SAKIT</option>
                    <option value="ALPA">ALPA / TIDAK HADIR</option>
                </select>
            </td>
        </tr>
        `;
    });

    html += `
        </tbody>
    </table>
    <button type="button" class="btn btn-primary mt-3" onclick="submitAbsenSiswaKolektif()">
        Simpan Absensi Kolektif
    </button>
    `;

    container.innerHTML = html;
}

async function submitAbsenSiswaKolektif() {
    const selectElements = document.querySelectorAll(".status-kehadiran-siswa");

    if (selectElements.length === 0) {
        alert("Pilih kelas dan tampilkan data siswa terlebih dahulu.");
        return;
    }

    const listSiswa = [];
    selectElements.forEach(el => {
        listSiswa.push({
            nama: el.getAttribute("data-nama"),
            kelas: el.getAttribute("data-kelas"),
            kehadiran: el.value
        });
    });

    const sekarang = new Date();

    try {
        const res = await fetch(ABSEN_API, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "absenSiswaKolektif",
                hari: sekarang.toLocaleDateString("id-ID", { weekday: "long" }),
                tanggal: sekarang.getDate(),
                bulan: sekarang.toLocaleDateString("id-ID", { month: "long" }),
                masuk: sekarang.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
                pulang: "",
                listSiswa: listSiswa
            })
        });

        const result = await res.json();
        alert(result.message);

    } catch (err) {
        alert("Terjadi kesalahan: " + err);
    }
}

/* ================= DOM READY ================= */

document.addEventListener("DOMContentLoaded", () => {
    const jenisAbsen = document.getElementById("jenisAbsen");
    const fotoGroup = document.getElementById("fotoGroup");

    if (jenisAbsen && fotoGroup) {
        function toggleFoto() {
            fotoGroup.style.display = (jenisAbsen.value === "PULANG") ? "none" : "block";
        }
        jenisAbsen.addEventListener("change", toggleFoto);
        toggleFoto();
    }

    const rekapPage = document.getElementById("rekapGuruPage");
    if (rekapPage) {
        loadRekap();
    }
});
