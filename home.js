/**
 * home.js - Manajemen Slider & Interaksi Halaman Depan
 * MIS Miftahul Mubtadiin
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Data Konten Slider
    const slidesData = [
        {
            title: "Materi Berbasis Digital",
            desc: "Tersedia berbagai materi pelajaran berbasis digital yang dapat diunduh untuk referensi pembelajaran siswa di luar sekolah.",
            tags: []
        },
        {
            title: "Kuis Latihan Berbasis Digital",
            desc: "Tersedia berbagai kuis latihan dari berbagai mata pelajaran berbasis digital yang dapat dikerjakan langsung untuk meningkatkan kecakapan siswa dalam mengerjakan soal berbasis digital.",
            tags: []
        },
        {
            title: "Pembiasaan Siswa",
            desc: "Pada setiap pagi, para siswa melakukan berbagai pembiasaan sebagai perangsang otak siswa ketika hendak memulai pembelajaran di kelas.",
            tags: []
        }
    ];

    let currentActiveIndex = 0;
    let autoplayTimer = null;
    const AUTOPLAY_INTERVAL = 5000; // Waktu pergantian slide (5 detik)

    // 2. DOM Elements Selection
    const titleEl = document.querySelector('.slider-title');
    const descEl = document.querySelector('.slider-desc');
    const tagsContainer = document.querySelector('.slider-tags');
    const dots = document.querySelectorAll('.s-dot');
    
    const nextBtn = document.getElementById('nextSlide');
    const prevBtn = document.getElementById('prevSlide');
    const loginBtn = document.getElementById('loginBtn');

    // 3. Fungsi Render Slide
   function renderSlide(index) {
    // 1. Validasi batas indeks data agar tidak out-of-bounds
    if (index < 0 || index >= slidesData.length) return;
    
    // 2. Validasi ketersediaan elemen teks utama
    if (!titleEl || !descEl) return;

    const data = slidesData[index];
    titleEl.textContent = data.title;
    descEl.textContent = data.desc;
    
    // 3. Render Tags (jika ada)
    if (tagsContainer) {
        tagsContainer.innerHTML = '';
        if (data.tags && data.tags.length > 0) {
            data.tags.forEach(tag => {
                const a = document.createElement('a');
                a.href = '#';
                a.textContent = tag;
                tagsContainer.appendChild(a);
            });
        }
    }

    // 4. Perbaikan Pembaruan Dots (Diproteksi agar tidak bikin macet)
    if (dots && dots.length > 0) {
        dots.forEach(d => {
            if (d) d.classList.remove('active');
        });
        
        // Pastikan elemen dot pada indeks ini benar-benar ada sebelum ditambah kelas 'active'
        if (dots[index]) {
            dots[index].classList.add('active');
        }
    }
}
    // 4. Manajemen Autoplay (Slider Berjalan Otomatis)
    function startAutoplay() {
        stopAutoplay(); // Reset timer yang sudah ada untuk menghindari tumpang tindih
        autoplayTimer = setInterval(() => {
            currentActiveIndex = (currentActiveIndex + 1) % slidesData.length;
            renderSlide(currentActiveIndex);
        }, AUTOPLAY_INTERVAL);
    }

    function stopAutoplay() {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
        }
    }

    // 5. Event Listeners Navigasi Slider
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            stopAutoplay();
            currentActiveIndex = (currentActiveIndex + 1) % slidesData.length;
            renderSlide(currentActiveIndex);
            startAutoplay(); // Jalankan kembali setelah interaksi manual
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            stopAutoplay();
            currentActiveIndex = (currentActiveIndex - 1 + slidesData.length) % slidesData.length;
            renderSlide(currentActiveIndex);
            startAutoplay();
        });
    }

    // Event Listener untuk Indikator Titik (Dots)
    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            stopAutoplay();
            const index = parseInt(e.target.getAttribute('data-index'), 10);
            if (!isNaN(index)) {
                currentActiveIndex = index;
                renderSlide(currentActiveIndex);
            }
            startAutoplay();
        });
    });

    // 6. Event Listener Tombol Login
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            // Tempatkan logika pemindahan halaman atau pemanggilan modal login Anda di sini
            alert('Membuka Portal Gerbang Login Madrasah...');
        });
    }

    // 7. Inisialisasi Pertama
    renderSlide(currentActiveIndex);
    startAutoplay();
});
