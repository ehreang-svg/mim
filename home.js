
let autoplayTimer = null;

function initHomeSlider() {
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
    const AUTOPLAY_INTERVAL = 5000;

    // Seleksi elemen dilakukan tepat saat fungsi ini dipanggil
    const titleEl = document.querySelector('.slider-title');
    const descEl = document.querySelector('.slider-desc');
    const tagsContainer = document.querySelector('.slider-tags');
    const dots = document.querySelectorAll('.s-dot');
    
    const nextBtn = document.getElementById('nextSlide');
    const prevBtn = document.getElementById('prevSlide');

    function renderSlide(index) {
        if (!titleEl || !descEl || !dots || dots.length === 0) return;

        const data = slidesData[index];
        titleEl.textContent = data.title;
        descEl.textContent = data.desc;
        
        if (tagsContainer) {
            tagsContainer.innerHTML = '';
        }

        dots.forEach(d => { if (d) d.classList.remove('active'); });
        if (dots[index]) {
            dots[index].classList.add('active');
        }
    }

    function startAutoplay() {
        stopAutoplay();
        autoplayTimer = setInterval(() => {
            currentActiveIndex = (currentActiveIndex + 1) % slidesData.length;
            renderSlide(currentActiveIndex);
        }, AUTOPLAY_INTERVAL);
    }

    function stopAutoplay() {
        if (autoplayTimer) clearInterval(autoplayTimer);
    }

    // Pasang Event Listeners (Diproteksi agar aman jika elemen null)
    if (nextBtn) {
        nextBtn.onclick = () => {
            stopAutoplay();
            currentActiveIndex = (currentActiveIndex + 1) % slidesData.length;
            renderSlide(currentActiveIndex);
            startAutoplay();
        };
    }

    if (prevBtn) {
        prevBtn.onclick = () => {
            stopAutoplay();
            currentActiveIndex = (currentActiveIndex - 1 + slidesData.length) % slidesData.length;
            renderSlide(currentActiveIndex);
            startAutoplay();
        };
    }

    dots.forEach(dot => {
        if (dot) {
            dot.onclick = (e) => {
                stopAutoplay();
                const index = parseInt(e.target.getAttribute('data-index'), 10);
                if (!isNaN(index)) {
                    currentActiveIndex = index;
                    renderSlide(currentActiveIndex);
                }
                startAutoplay();
            };
        }
    });

    // Jalankan inisialisasi tampilan awal & putar otomatis
    renderSlide(currentActiveIndex);
    startAutoplay();
}
