async function loadKelas() {
    try {
        const selectKelas = document.getElementById("selectKelas");
        if (!selectKelas) return;

        // Panggil API
        const res = await fetch(Quiz_API + "?aksi=getKelas", { 
            method: "GET", 
            redirect: "follow" // Wajib ada agar tidak memicu silent-blocked
        });
        
        const data = await res.json();
        selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
        
        let listKelas = data.kelas || [];
        if (listKelas.length > 0) {
            listKelas.forEach(kelas => {
                let opt = document.createElement("option");
                opt.value = kelas;
                opt.textContent = kelas;
                selectKelas.appendChild(opt);
            });
        }
    } catch (err) {
        console.error("Gagal memuat kelas:", err);
    }
}
