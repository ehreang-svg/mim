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
        // Kirim info tanpa foto agar URL tidak kepanjangan
        const url = CHAT_API + `?action=getChat&username=${encodeURIComponent(user.username || '')}&nama=${encodeURIComponent(user.nama || '')}`;
        
        // Tambahkan mode: "cors" untuk memastikan browser mengizinkan pengalihan dari Google
        const res = await fetch(url, {
            method: "GET",
            mode: "cors",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const text = await res.text();
        
        // Antisipasi jika response kosong atau bukan JSON valid
        if (!text || text.trim() === "") {
            throw new Error("Response dari server kosong");
        }

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
        // Kita filter jika chat sebenarnya muncul, abaikan tulisan error yang mengganggu di UI
        console.error("LOG INTERNAL ERROR =", err);
        
        // Jika box masih berisi tulisan "Sedang memuat", barulah ganti dengan pesan error
        if (box.innerHTML.includes("Sedang memuat")) {
            box.innerHTML = '<div class="chatLoading">Gagal memuat otomatis, mencoba menghubungkan kembali...</div>';
        }
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

window.addEventListener("beforeunload", () => { stopChat(); });
