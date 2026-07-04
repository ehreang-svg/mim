let chatInterval = null;
let lastChat = 0;

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

async function openChat() {
    nav("chatPage");
    if (chatInterval) { clearInterval(chatInterval); }
    await loadChat(); // <-- Menunggu ini selesai
    chatInterval = setInterval(loadChatBaru, 2000); // <-- Baru jalankan ini
}

function stopChat() {
    if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // 1. Langsung set online jika data user sudah tersimpan di localStorage (sesudah login)
    setUserOnlineAwal();

    // 2. Listener input chat yang sudah ada sebelumnya
    const input = document.getElementById("chatText");
    if (!input) return;
    input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            kirimChat();
        }
    });
});

async function kirimChat() {
    const input = document.getElementById("chatText");
    const btn = document.getElementById("btnSend");
    try {
        const pesan = input.value.trim();
        if (!pesan) return;

        btn.disabled = true;
        btn.textContent = "...";

        const user = getChatUser();
        const body = {
            action: "kirimChat",
            username: user.username || "",
            nama: user.nama || "",
            foto: user.foto || "",
            pesan: pesan
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

        // LANGKAH 1: Daftarkan status online + FOTO via POST (Aman untuk Base64)
        try {
            await fetch(CHAT_API, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "registerOnline",
                    username: user.username || "",
                    nama: user.nama || "",
                    foto: user.foto || "" // Base64 dikirim lewat body POST, dijamin sukses
                })
            });
        } catch (postErr) {
            console.warn("Gagal register online awal:", postErr);
        }

        // LANGKAH 2: Ambil data chat menggunakan GET biasa (Tanpa membawa foto di URL)
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
    const foto = item.foto && item.foto.trim() !== "" ? item.foto : "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    const html = `
    <div id="chat_${item.id}" class="chatItem ${sendiri ? "me" : ""}">
        <img class="chatFoto" src="${foto}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'">
        <div class="chatBubble">
            <div class="chatNama">${item.nama}</div>
            <div class="chatBody">
                <div class="chatPesan">${escapeHtml(item.pesan)}</div>
                <div class="chatWaktu">${formatWaktu(item.waktu)}</div>
            </div>
        </div>
    </div>`;
    box.insertAdjacentHTML("beforeend", html);
}

async function loadChatBaru() {
    try {
        const user = getChatUser();
        
        // Cukup kirim username dan nama saja, hindari mengirim string foto yang panjang lewat GET URL
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
        console.error("Chat Baru :", err);
    }
}

function updateOnlineUsersList(users) {
    const container = document.getElementById("userOnlineList");
    const countSpan = document.getElementById("userOnlineCount");
    if (!container || !users) return;

    container.innerHTML = "";
    countSpan.textContent = users.length;

    users.forEach(u => {
        const foto = u.foto && u.foto.trim() !== "" ? u.foto : "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        const html = `
        <div class="onlineUserItem">
            <div class="statusDot"></div>
            <img class="userOnlineFoto" src="${foto}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'">
            <div class="userOnlineNama">${u.nama}</div>
        </div>`;
        container.insertAdjacentHTML("beforeend", html);
    });
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
// Fungsi untuk menandai user online segera setelah login atau muat halaman
async function setUserOnlineAwal() {
    try {
        const user = getChatUser();
        if (!user.username) return; // Batalkan jika data user belum ada/belum login

        await fetch(CHAT_API, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "registerOnline",
                username: user.username,
                nama: user.nama || "",
                foto: user.foto || ""
            })
        });
        console.log("Status online berhasil didaftarkan sejak login.");
    } catch (err) {
        console.error("Gagal mengaktifkan status online awal:", err);
    }
}

window.addEventListener("beforeunload", () => { stopChat(); });
