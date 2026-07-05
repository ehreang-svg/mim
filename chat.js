let chatInterval = null;
let lastChat = 0;
let fileDataSmt = { base64: "", nama: "" }; // Menyimpan file sementara sebelum dikirim

function getChatUser() {
    if (typeof currentUser !== 'undefined' && currentUser) {
        return currentUser;
    }
    const data = localStorage.getItem("user");
    if (!data) return {};
    try {
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

// Fungsi untuk menandai user online segera setelah login atau muat halaman (POST)
async function setUserOnlineAwal() {
    try {
        const user = getChatUser();
        if (!user.username) return;

        await fetch(CHAT_API, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "registerOnline",
                username: user.username,
                nama: user.nama || "",
                foto: user.foto || "" // Aman mengirim Base64 panjang via POST body
            })
        });
        console.log("Status online awal berhasil didaftarkan.");
    } catch (err) {
        console.error("Gagal mengaktifkan status online awal:", err);
    }
}

async function openChat() {
    nav("chatPage");
    if (chatInterval) {
        clearInterval(chatInterval);
    }
    await loadChat();
    // Polling berkala setiap 2 detik untuk mengambil data baru & deteksi heartbeat online
    chatInterval = setInterval(loadChatBaru, 2000);
}

function stopChat() {
    if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Otomatis daftarkan online jika user sudah dalam posisi login saat web dibuka
    setUserOnlineAwal();

    const input = document.getElementById("chatText");
    if (!input) return;
    input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            kirimChat();
        }
    });
});

// Fungsi menangani input file yang dipilih user
function handleFileSelected() {
    const fileInput = document.getElementById("chatFile");
    if (!fileInput || !fileInput.files[0]) return;
    const file = fileInput.files[0];

    // Proteksi batas ukuran file (Maksimal 2MB agar Apps Script lancar)
    if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file terlalu besar! Maksimal 2MB.");
        fileInput.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        fileDataSmt.base64 = e.target.result;
        fileDataSmt.nama = file.name;
        
        // Memperbarui UI info file terlampir
        const previewContainer = document.getElementById("filePreviewContainer");
        const previewName = document.getElementById("filePreviewName");
        if (previewContainer && previewName) {
            previewName.textContent = "Terpilih: " + file.name;
            previewContainer.style.display = "flex";
        }
    };
    reader.readAsDataURL(file);
}

function batalKirimFile() {
    fileDataSmt = { base64: "", nama: "" };
    const previewContainer = document.getElementById("filePreviewContainer");
    if (previewContainer) previewContainer.style.display = "none";
    const fileInput = document.getElementById("chatFile");
    if (fileInput) fileInput.value = "";
}

async function kirimChat() {
    const input = document.getElementById("chatText");
    const btn = document.getElementById("btnSend");
    try {
        const pesan = input.value.trim();
        // Cegah kirim jika teks kosong dan tidak ada file attachment
        if (!pesan && !fileDataSmt.base64) return;

        btn.disabled = true;
        btn.textContent = "...";

        const user = getChatUser();
        const body = {
            action: "kirimChat",
            username: user.username || "",
            nama: user.nama || "",
            foto: user.foto || "",
            pesan: pesan,
            fileBase64: fileDataSmt.base64,
            fileNama: fileDataSmt.nama
        };

        const res = await fetch(CHAT_API, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(body)
        });

        const text = await res.text();
        const json = JSON.parse(text);

        if (!json.status) {
            alert(json.message);
            return;
        }

        input.value = "";
        batalKirimFile();
        await loadChatBaru();
    } catch (err) {
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = "KIRIM";
    }
}

async function loadChat() {
    const box = document.getElementById("chatList");
    if (!box) return;
    box.innerHTML = '<div class="chatLoading">Sedang memuat pesan...</div>';

    try {
        const user = getChatUser();
        // GET Request murni hanya membawa parameter identifikasi ringan tanpa data base64 foto
        const url = CHAT_API + `?action=getChat&username=${encodeURIComponent(user.username || '')}`;
        const res = await fetch(url);
        const text = await res.text();
        const json = JSON.parse(text);

        if (!json.status) {
            box.innerHTML = `<div class="chatLoading">Gagal memuat: ${json.message}</div>`;
            return;
        }

        box.innerHTML = "";
        if (json.data && json.data.length > 0) {
            json.data.forEach(item => renderChat(item));
        } else {
            box.innerHTML = '<div class="chatLoading">Belum ada pesan di sini.</div>';
        }

        lastChat = json.last;
        box.scrollTop = box.scrollHeight;
        
        if (json.onlineUsers) {
            updateOnlineUsersList(json.onlineUsers);
        }
    } catch (err) {
        console.error("LOAD CHAT ERROR =", err);
        box.innerHTML = '<div class="chatLoading">Terjadi kesalahan koneksi.</div>';
    }
}

function renderChat(item) {
    const box = document.getElementById("chatList");
    if (!box) return;

    const user = getChatUser();
    const sendiri = item.username === user.username;
    const fotoProfil = item.foto && item.foto.trim() !== "" ? item.foto : "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    // Merender komponen file attachment jika tersedia
    let attachmentHtml = "";
    if (item.fileBase64 && item.fileBase64.trim() !== "") {
        if (item.fileBase64.startsWith("data:image/")) {
            // Preview instan untuk Gambar
            attachmentHtml = `
            <div class="chatImageWrapper" style="margin-top: 5px;">
                <img src="${item.fileBase64}" class="chatMediaGambar" style="max-width:200px; max-height:200px; border-radius:8px; cursor:pointer; display:block;" onclick="window.open('${item.fileBase64}')">
                <a href="${item.fileBase64}" download="${item.fileNama}" style="display:inline-block; font-size:11px; color:#25D366; font-weight:bold; text-decoration:none; margin-top:3px;">⬇️ Simpan Gambar</a>
            </div>`;
        } else {
            // Komponen download file dokumen umum
            attachmentHtml = `
            <div class="chatFileWrapper" style="margin-top:5px; padding:8px; background:rgba(0,0,0,0.06); border-radius:6px; display:flex; flex-direction:column; max-width:250px;">
                <span style="font-size:12px; font-weight:bold; word-break:break-all; color:#333;">📂 ${item.fileNama}</span>
                <a href="${item.fileBase64}" download="${item.fileNama}" style="font-size:11px; color:#007bff; font-weight:bold; text-decoration:none; margin-top:4px;">⬇️ Download File</a>
            </div>`;
        }
    }

    const html = `
    <div id="chat_${item.id}" class="chatItem ${sendiri ? "me" : ""}">
        <img class="chatFoto" src="${fotoProfil}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'">
        <div class="chatBubble">
            <div class="chatNama">${item.nama}</div>
            <div class="chatBody">
                <div class="chatPesan">${escapeHtml(item.pesan)}</div>
                ${attachmentHtml}
                <div class="chatWaktu">${formatWaktu(item.waktu)}</div>
            </div>
        </div>
    </div>`;
    box.insertAdjacentHTML("beforeend", html);
}

async function loadChatBaru() {
    try {
        const user = getChatUser();
        // PING berkala lewat GET hanya mengirim username & nama untuk efisiensi data URL
        const res = await fetch(
            CHAT_API + "?action=getChatBaru&last=" + lastChat +
            `&username=${encodeURIComponent(user.username || '')}` +
            `&nama=${encodeURIComponent(user.nama || '')}`
        );

        const text = await res.text();
        const json = JSON.parse(text);

        if (!json.status) return;

        if (json.onlineUsers) {
            updateOnlineUsersList(json.onlineUsers);
        }

        if (!json.data || !json.data.length) return;

        const box = document.getElementById("chatList");
        const autoScroll = box.scrollTop + box.clientHeight >= box.scrollHeight - 60;

        json.data.forEach(item => {
            if (!document.getElementById("chat_" + item.id)) {
                renderChat(item);
            }
        });

        lastChat = json.last;
        if (autoScroll) {
            box.scrollTop = box.scrollHeight;
        }
    } catch (err) {
        console.error("Chat Baru Error:", err);
    }
}

// URUTKAN SEMUA USER SESUAI WAKTU TERAKHIR ONLINE & PASANG STATUS RELATIF
function updateOnlineUsersList(users) {
    const container = document.getElementById("userOnlineList");
    const countSpan = document.getElementById("userOnlineCount");
    const countBadge = document.getElementById("userOnlineCountBadge");
    if (!container || !users) return;

    container.innerHTML = "";
    
    // 1. Hitung jumlah user yang saat ini benar-benar aktif (isOnline === true)
    const activeOnlineCount = users.filter(u => u.isOnline === true).length;
    if (countSpan) countSpan.textContent = activeOnlineCount;
    if (countBadge) countBadge.textContent = activeOnlineCount;

    // 2. ALGORITMA SORTING: Pengguna online bergeser ke atas, lalu urutkan berdasarkan lastSeen terbaru
    users.sort((a, b) => {
        let aOnline = a.isOnline ? 1 : 0;
        let bOnline = b.isOnline ? 1 : 0;
        
        if (aOnline !== bOnline) {
            return bOnline - aOnline; // Yang online (1) akan naik melebihi yang offline (0)
        }
        
        // Jika status onlinenya sama, urutkan berdasarkan waktu lastSeen terbaru
        let timeA = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
        let timeB = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
        return timeB - timeA; 
    });

    // 3. Render seluruh daftar user ke dalam komponen HTML
    users.forEach(u => {
        const foto = u.foto && u.foto.trim() !== "" ? u.foto : "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        
        // Memanfaatkan fungsi formatWaktuRelatif bawaan Anda untuk user yang offline
        let lastSeenText = u.isOnline ? "Sedang Aktif" : (u.lastSeen ? "Aktif " + formatWaktuRelatif(u.lastSeen) : "Offline");

        const html = `
        <div class="onlineUserItem">
            <div class="avatar-wrapper">
                <img class="userOnlineFoto" src="${foto}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'">
                <div class="statusDot ${u.isOnline ? 'active' : ''}"></div>
            </div>
            <div class="userMeta">
                <div class="userOnlineNama">${u.nama || u.username}</div>
                <div class="userLastSeen">${lastSeenText}</div>
            </div>
        </div>`;
        container.insertAdjacentHTML("beforeend", html);
    });
}

// Fungsi pembantu untuk mengubah objek timestamp Tanggal menjadi teks string relatif Indonesia
function formatWaktuRelatif(dateString) {
    try {
        const parsedDate = new Date(dateString);
        if (isNaN(parsedDate)) return dateString;
        const diffSeconds = Math.floor((new Date() - parsedDate) / 1000);
        
        if (diffSeconds < 60) return "baru saja";
        
        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
        
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} jam lalu`;
        
        return parsedDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    } catch (e) { 
        return dateString; 
    }
}

function formatWaktu(waktu) {
    if (!waktu) return "";
    if (waktu.includes("/")) return waktu;
    const d = new Date(waktu);
    return d.toLocaleString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function toggleSidebarMobile() {
    const sidebar = document.querySelector(".chatUserSidebar");
    const overlay = document.querySelector(".sidebar-overlay");
    if (sidebar && overlay) {
        const isOpen = sidebar.classList.toggle("mobile-open");
        if (isOpen) {
            overlay.style.display = "block";
            setTimeout(() => overlay.style.opacity = "1", 10);
        } else {
            overlay.style.opacity = "0";
            setTimeout(() => overlay.style.display = "none", 300);
        }
    }
}

window.addEventListener("beforeunload", () => { stopChat(); });
