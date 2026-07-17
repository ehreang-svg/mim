 const slidesData = [
            {
                title: "Materi Berbasis Digital",
                desc: "Tersedia berbagai materi pelajaran berbasis digital yang dapat di unduh untuk referensi pembelajaran siswa di luar sekolah.",
                tags: []
            },
            {
                title: "Kuis Latihan Berbasis Digital",
                desc: "Tersedia berbagai kuis latihan dari berbagai mata pelajaran berbasis digital yang dapat di kerjakan langsung untuk meningkatkan kecakapan siswa dalam mengerjakan soal berbasis digital.",
                tags: []
            },
            {
                title: "Pembiasaan Siswa",
                desc: "Pada setiap pagi, para siswa melakukan berbagai pembiasaan sebagai perangsang otak siswa ketika hendak memulai pembelajaran di kelas.",
                tags: []
            }
        ];

        let currentActiveIndex = 0;
        
        const titleEl = document.querySelector('.slider-title');
        const descEl = document.querySelector('.slider-desc');
        const tagsContainer = document.querySelector('.slider-tags');
        const dots = document.querySelectorAll('.s-dot');

        function renderSlide(index) {
            const data = slidesData[index];
            titleEl.textContent = data.title;
            descEl.textContent = data.desc;
            
            tagsContainer.innerHTML = '';
            
            if (data.tags && data.tags.length > 0) {
                data.tags.forEach(tag => {
                    const a = document.createElement('a');
                    a.href = '#';
                    a.textContent = tag;
                    tagsContainer.appendChild(a);
                });
            }

            dots.forEach(d => d.classList.remove('active'));
            dots[index].classList.add('active');
        }

        document.getElementById('nextSlide').addEventListener('click', () => {
            currentActiveIndex = (currentActiveIndex + 1) % slidesData.length;
            renderSlide(currentActiveIndex);
        });

        document.getElementById('prevSlide').addEventListener('click', () => {
            currentActiveIndex = (currentActiveIndex - 1 + slidesData.length) % slidesData.length;
            renderSlide(currentActiveIndex);
        });

        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                currentActiveIndex = index;
                renderSlide(currentActiveIndex);
            });
        });

        document.getElementById('loginBtn').addEventListener('click', () => {
            alert('Membuka Portal Gerbang Login Madrasah...');
        });
