<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MIS MIFTAHUL MUBTADIIN</title>
    <style>
        /* --- CSS Dasar & Reset --- */
        * {
            box-sizing: border-box;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #ffffff;
            color: #333333;
            overflow-x: hidden;
        }
        ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        a {
            text-decoration: none;
            color: inherit;
        }

        /* --- Navbar / Header (Gambar 3 & 4) --- */
        header {
            background-color: #ffffff;
            height: 70px;
            width: 100%;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 999;
            border-bottom: 1px solid #eaeaea;
            padding: 0 40px;
        }
        .header-container {
            width: 100%;
            height: 100%;
            position: relative;
        }
        .logo-area {
            position: absolute;
            top: 50%;
            left: 0;
            transform: translateY(-50%);
        }
        .logo-area img {
            height: 32px;
            vertical-align: middle;
            margin-right: 8px;
        }
        .logo-area span {
            font-size: 18px;
            font-weight: 700;
            color: #0077b6;
            vertical-align: middle;
        }
        .nav-area {
            position: absolute;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
            text-align: right;
        }
        .btn-login {
            display: inline-block;
            background-color: #0fa47c;
            color: #ffffff;
            padding: 9px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            border: none;
            cursor: pointer;
            vertical-align: middle;
        }

        /* --- Pembungkus Utama Konten --- */
        .main-wrapper {
            margin-top: 70px;
            width: 100%;
        }

        /* --- Section 1: Hero Rumah Digital (Gambar 4) --- */
        .hero-section {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 80px 40px 60px 40px;
            position: relative;
        }
        .hero-left {
            display: inline-block;
            width: 50%;
            vertical-align: middle;
        }
        .hero-right {
            display: inline-block;
            width: 48%;
            vertical-align: middle;
            text-align: right;
        }
        .hero-title {
            font-size: 44px;
            font-weight: 800;
            color: #1a1a1a;
            line-height: 1.2;
            margin: 0 0 20px 0;
        }
        .hero-title span {
            color: #0076b6;
            display: block;
        }
        .hero-desc {
            font-size: 15px;
            color: #666666;
            line-height: 1.6;
            margin: 0;
        }
        .hero-image {
            max-width: 100%;
            height: auto;
        }

        .dots-decor-hero {
            position: absolute;
            top: 40px;
            right: 20px;
            width: 70px;
            opacity: 0.5;
        }

        /* --- Section 2: Banner Slide Integrasi EMIS (Gambar 3) --- */
        .slider-section {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 40px 60px 40px;
        }
        .slider-box {
            background: linear-gradient(135deg, #0288d1, #29b6f6);
            border-radius: 16px;
            width: 100%;
            padding: 50px 60px;
            position: relative;
            color: #ffffff;
            overflow: hidden;
        }
        .slider-content {
            width: 60%;
            display: inline-block;
            vertical-align: middle;
        }
        .slider-graphic {
            width: 35%;
            display: inline-block;
            vertical-align: middle;
            text-align: right;
        }
        .slider-title {
            font-size: 32px;
            font-weight: 700;
            margin: 0 0 15px 0;
        }
        .slider-desc {
            font-size: 15px;
            line-height: 1.6;
            opacity: 0.9;
            margin: 0 0 10px 0;
        }
        .slider-tags {
            margin-top: 10px;
        }
        .slider-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 36px;
            height: 36px;
            background-color: #ffffff;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            text-align: center;
            line-height: 36px;
            font-weight: bold;
            color: #333;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            z-index: 5;
        }
        .arrow-left { left: 15px; }
        .arrow-right { right: 15px; }
        
        .slider-dots {
            text-align: center;
            margin-top: 15px;
        }
        .s-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #cccccc;
            margin: 0 4px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .s-dot.active {
            background-color: #0288d1;
            transform: scale(1.25);
        }

        /* --- Section 3: Layanan GTK Sejahtera (Gambar 2) --- */
        .sejahtera-section {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 40px;
            position: relative;
        }
        .sejahtera-left {
            display: inline-block;
            width: 50%;
            vertical-align: top;
        }
        .sejahtera-right {
            display: inline-block;
            width: 48%;
            vertical-align: top;
            position: relative;
        }
        .brand-title-box {
            margin-bottom: 25px;
        }
        .brand-icon-orange {
            display: inline-block;
            width: 28px;
            height: 28px;
            background-color: #ffa726;
            border-radius: 6px;
            vertical-align: middle;
            margin-right: 12px;
        }
        .brand-title {
            display: inline-block;
            font-size: 26px;
            font-weight: 700;
            color: #111111;
            margin: 0;
            vertical-align: middle;
        }
        .checklist-item {
            margin-bottom: 16px;
            font-size: 15px;
            color: #444444;
        }
        .check-icon-green {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #0fa47c;
            border-left: 0;
            border-top: 0;
            transform: rotate(45deg);
            margin-right: 12px;
            vertical-align: middle;
            margin-top: -4px;
        }
        
        /* Tata Letak Kolase Gambar Sisi Kanan */
        .collage-container {
            position: relative;
            height: 380px;
            width: 100%;
        }
        .collage-photo {
            position: absolute;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
            background-color: #eee;
        }
        .collage-photo img {
            width: 100%;
            height: 100%;
            object-fit: cover; /* Memastikan foto terpotong rapi memenuhi kontainer */
            display: block;
        }
        .collage-1 { width: 140px; height: 260px; left: 0; top: 0; }
        .collage-2 { width: 160px; height: 180px; left: 155px; top: 0; }
        .collage-3 { width: 160px; height: 200px; left: 330px; top: 40px; }
        
        .dots-decor-left {
            position: absolute;
            left: -40px;
            top: 40%;
            width: 60px;
            opacity: 0.3;
        }
        .dots-decor-right {
            position: absolute;
            right: 10px;
            top: 10px;
            width: 65px;
            opacity: 0.4;
        }

        /* --- Section 4: Layanan GTK Profesional & Galeri (Gambar 1) --- */
        .profesional-section {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 60px 40px 100px 40px;
            position: relative;
        }
        .half-circle-bg {
            position: absolute;
            right: -150px;
            top: -50px;
            width: 600px;
            height: 600px;
            background-color: #e3f2fd;
            border-radius: 50%;
            opacity: 0.5;
            z-index: 1;
        }
        .profesional-container {
            position: relative;
            z-index: 2;
        }
        .profesional-left {
            display: inline-block;
            width: 48%;
            vertical-align: top;
            padding-top: 40px;
        }
        .profesional-right {
            display: inline-block;
            width: 50%;
            vertical-align: top;
            text-align: right;
        }
        .brand-icon-blue {
            display: inline-block;
            width: 28px;
            height: 28px;
            background-color: #29b6f6;
            border-radius: 6px;
            vertical-align: middle;
            margin-right: 12px;
        }
        
        /* Kolase Grid Foto Besar Sisi Kanan */
        .grid-photo-container {
            display: inline-block;
            width: 100%;
            max-width: 520px;
            text-align: left;
        }
        .photo-block {
            display: inline-block;
            border-radius: 8px;
            overflow: hidden;
            margin: 6px;
            vertical-align: top;
            box-shadow: 0 4px 12px rgba(0,0,0,0.06);
            background-color: #ddd;
        }
        .photo-block img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
        .pb-1 { width: 120px; height: 80px; }
        .pb-2 { width: 180px; height: 120px; }
        .pb-3 { width: 160px; height: 100px; }
        .pb-4 { width: 140px; height: 180px; margin-top: -40px; }
        .pb-5 { width: 140px; height: 130px; }
        .pb-6 { width: 180px; height: 150px; margin-top: -20px; }
        .pb-7 { width: 110px; height: 110px; margin-top: -70px; }

        /* --- Footer Resmi --- */
        footer {
            background-color: #ffffff;
            border-top: 1px solid #eeeeee;
            padding: 60px 0 40px 0;
            text-align: center;
            position: relative;
            z-index: 10;
        }
        .footer-logo {
            width: 48px;
            height: auto;
            margin-bottom: 15px;
        }
        .footer-company {
            font-size: 15px;
            font-weight: 700;
            color: #222222;
            margin: 0 0 4px 0;
        }
        .footer-sub {
            font-size: 13px;
            color: #555555;
            margin: 0 0 4px 0;
        }
        .footer-copy {
            font-size: 13px;
            color: #777777;
            margin: 15px 0 0 0;
        }
    </style>
</head>
<body>

    <header>
        <div class="header-container">
            <div class="logo-area">
                <img src="https://iili.io/CAZVdsj.png" alt="Logo EMISGTK">
                <span>MIS MIFTAHUL MUBTADIIN</span>
            </div>
            <div class="nav-area">
                <button class="btn-login" id="loginBtn">Login</button>
            </div>
        </div>
    </header>

    <div class="main-wrapper">

        <section class="hero-section">
            <svg class="dots-decor-hero" viewBox="0 0 60 40" fill="#ffa726"><circle cx="10" cy="10" r="2"/><circle cx="30" cy="10" r="2"/><circle cx="50" cy="10" r="2"/><circle cx="10" cy="30" r="2"/><circle cx="30" cy="30" r="2"/><circle cx="50" cy="30" r="2"/></svg>
            
            <div class="hero-left">
                <h1 class="hero-title">RUMAH DIGITAL <span>MIS MIFTAHUL MUBTADIIN</span></h1>
                <p class="hero-desc">Platform digital terpadu untuk pengelolaan administrasi MIS Miftahul Mubtadiin.</p>
            </div><div class="hero-right">
                <img class="hero-image" src="https://iili.io/CAZVdsj.png" alt="Laptop Mockup">
            </div>
        </section>

        <section class="slider-section">
            <div class="slider-box">
                <button class="slider-arrow arrow-left" id="prevSlide">&lt;</button>
                
                <div class="slider-content" id="slideText">
                    <h3 class="slider-title">Materi Berbasis digital</h3>
                    <p class="slider-desc">Tersedia berbagai materi pelajaran berbasis digital yang dapat di unduh untuk referensi pembelajaran siswa di luar sekolah.</p>
                    <div class="slider-tags"></div>
                </div><div class="slider-graphic">
                    <svg width="180" height="180" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="8"/>
                        <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="4"/>
                    </svg>
                </div>

                <button class="slider-arrow arrow-right" id="nextSlide">&gt;</button>
            </div>
            <div class="slider-dots">
                <span class="s-dot active" data-index="0"></span>
                <span class="s-dot" data-index="1"></span>
                <span class="s-dot" data-index="2"></span>
            </div>
        </section>

        <section class="sejahtera-section">
            <svg class="dots-decor-left" viewBox="0 0 40 60" fill="#0288d1"><circle cx="10" cy="10" r="2"/><circle cx="10" cy="30" r="2"/><circle cx="10" cy="50" r="2"/><circle cx="30" cy="10" r="2"/><circle cx="30" cy="30" r="2"/><circle cx="30" cy="50" r="2"/></svg>
            
            <div class="sejahtera-left">
                <div class="brand-title-box">
                    <div class="brand-icon-orange"></div>
                    <h2 class="brand-title">Guru profesional</h2>
                </div>
                <ul>
                    <li class="checklist-item"><span class="check-icon-green"></span>Tunjangan Profesi Guru</li>
                    <li class="checklist-item"><span class="check-icon-green"></span>Tunjangan Khusus</li>
                    <li class="checklist-item"><span class="check-icon-green"></span>Tunjangan Insentif</li>
                    <li class="checklist-item"><span class="check-icon-green"></span>Bantuan Pendidikan</li>
                    <li class="checklist-item"><span class="check-icon-green"></span>Bantuan KKG</li>
                </ul>
            </div><div class="sejahtera-right">
                <svg class="dots-decor-right" viewBox="0 0 60 40" fill="#7b1fa2"><circle cx="10" cy="10" r="2"/><circle cx="30" cy="10" r="2"/><circle cx="50" cy="10" r="2"/><circle cx="10" cy="30" r="2"/><circle cx="30" cy="30" r="2"/><circle cx="50" cy="30" r="2"/></svg>
                
                <!-- BAGIAN DIUBAH: Mengganti teks dengan tag foto asli -->
                <div class="collage-container">
                    <div class="collage-photo collage-1">
                        <img src="https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&auto=format&fit=crop&q=60" alt="Foto Sekolah Siswa">
                    </div>
                    <div class="collage-photo collage-2">
                        <img src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=400&auto=format&fit=crop&q=60" alt="Foto Ruang Komputer">
                    </div>
                    <div class="collage-photo collage-3">
                        <img src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=60" alt="Foto Diskusi Guru">
                    </div>
                </div>
            </div>
        </section>

        <section class="profesional-section">
            <div class="half-circle-bg"></div>
            
            <div class="profesional-container">
                <div class="profesional-left">
                    <div class="brand-title-box">
                        <div class="brand-icon-blue"></div>
                        <h2 class="brand-title">GTK Profesional</h2>
                    </div>
                    <ul>
                        <li class="checklist-item"><span class="check-icon-green"></span>Pengembangan Keprofesian Berkelanjutan</li>
                        <li class="checklist-item"><span class="check-icon-green"></span>Pendidikan Inklusif</li>
                        <li class="checklist-item"><span class="check-icon-green"></span>Pelatihan Laboran Dan Pustakawan</li>
                        <li class="checklist-item"><span class="check-icon-green"></span>Pelatihan B.Inggris</li>
                        <li class="checklist-item"><span class="check-icon-green"></span>Monitoring Guru oleh Pengawas</li>
                        <li class="checklist-item"><span class="check-icon-green"></span>Seleksi Kepala Madrasah</li>
                    </ul>
                </div><div class="profesional-right">
                    
                    <!-- BAGIAN DIUBAH: Mengganti block kosong grid menjadi foto edukasi -->
                    <div class="grid-photo-container">
                        <div class="photo-block pb-1"><img src="https://iili.io/Cjq5JVe.jpg" alt="Foto Kegiatan 1"></div>
                        <div class="photo-block pb-2"><img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=300&auto=format&fit=crop&q=60" alt="Foto Kegiatan 2"></div>
                        <div class="photo-block pb-3"><img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=60" alt="Foto Kegiatan 3"></div>
                        <div class="photo-block pb-4"><img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=300&auto=format&fit=crop&q=60" alt="Foto Kegiatan 4"></div>
                        <div class="photo-block pb-5"><img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&auto=format&fit=crop&q=60" alt="Foto Kegiatan 5"></div>
                        <div class="photo-block pb-6"><img src="https://iili.io/Cjq5JVe.jpg" alt="Foto Kegiatan 6"></div>
                        <div class="photo-block pb-7"><img src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=300&auto=format&fit=crop&q=60" alt="Foto Kegiatan 7"></div>
                    </div>
                    
                </div>
            </div>
        </section>

    </div>

    <footer>
        <img class="footer-logo" src="https://iili.io/CAZVdsj.png" alt="Logo Kemenag RI">
        <div class="footer-company">MIS MIFTAHUL MUBTADIIN</div>
        <div class="footer-sub">Jl.Raya Jagapura Wetan Desa Jagapura Wetan Kec. Gegesik Kab. Cirebon</div>
        <div class="footer-sub">Developer by | Hanip Anpal, S.Pd &copy; 2026</div>
    </footer>

    <script>
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
    </script>
</body>
</html>
