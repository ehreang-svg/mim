/* =====================================================
   CHAT.JS
   BAGIAN A
===================================================== */

let chatInterval = null;
let lastChat = 0;

/* =====================================================
   AMBIL USER LOGIN
===================================================== */

function getChatUser() {

    if (currentUser) {
        return currentUser;
    }

    const data = localStorage.getItem("user");

    if (!data) {
        return {};
    }

    try {

        return JSON.parse(data);

    } catch (e) {

        return {};

    }

}

/* =====================================================
   BUKA CHAT
===================================================== */

async function openChat() {

    nav("chatPage");

    if (chatInterval) {
        clearInterval(chatInterval);
    }

    await loadChat();

    chatInterval = setInterval(loadChatBaru, 2000);

}
/* =====================================================
   TUTUP CHAT
===================================================== */

function stopChat() {

    if (chatInterval) {

        clearInterval(chatInterval);

        chatInterval = null;

    }

}

/* =====================================================
   ENTER UNTUK KIRIM
===================================================== */

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

/* =====================================================
   KIRIM CHAT
===================================================== */

async function kirimChat() {

    const input = document.getElementById("chatText");
    const btn = document.getElementById("btnSend");

    try {

        const pesan = input.value.trim();

        if (!pesan) return;

        btn.disabled = true;
        btn.textContent = "Mengirim pesan...";

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

            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },

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

        alert(err.message);

    } finally {

        btn.disabled = false;
        btn.textContent = "Kirim";

    }

}
/* =====================================================
   LOAD CHAT PERTAMA
===================================================== */

async function loadChat() {

    const box = document.getElementById("chatList");

    box.innerHTML = `
        <div class="chatLoading">
            Sedang memuat pesan...
        </div>
    `;

    try {

        const res = await fetch(
            CHAT_API + "?action=getChat"
        );

        const text = await res.text();

        const json = JSON.parse(text);

        if (!json.status) {

            box.innerHTML = `
                <div class="chatLoading">
                    Tidak ada pesan.
                </div>
            `;

            return;

        }

        box.innerHTML = "";

        json.data.forEach(item => {

            renderChat(item);

        });

        lastChat = json.last;

        box.scrollTop = box.scrollHeight;

    } catch (err) {

        console.error("Load Chat :", err);

        box.innerHTML = `
            <div class="chatLoading">
                Gagal memuat pesan.
            </div>
        `;

    }

}
/* =====================================================
   RENDER CHAT
===================================================== */

function renderChat(item) {

    const box = document.getElementById("chatList");

    if (!box) return;

    const user = getChatUser();

    const sendiri = item.username === user.username;

    const foto =
        item.foto && item.foto.trim() !== ""
        ? item.foto
        : "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    const html = `

<div id="chat_${item.id}" class="chatItem ${sendiri ? "me" : ""}">

    <img class="chatFoto"
         src="${foto}"
         onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'">

    <div class="chatBubble">

        <div class="chatNama">
            ${item.nama}
        </div>

        <div class="chatPesan">
            ${escapeHtml(item.pesan)}
        </div>

        <div class="chatWaktu">
            ${formatWaktu(item.waktu)}
        </div>

    </div>

</div>

`;

    box.insertAdjacentHTML("beforeend", html);

}
/* =====================================================
   LOAD CHAT BARU
===================================================== */

async function loadChatBaru() {

    try {

        const res = await fetch(

            CHAT_API +
            "?action=getChatBaru&last=" +
            lastChat

        );

        const text = await res.text();

        const json = JSON.parse(text);

        if (!json.status) return;

        if (!json.data.length) return;

        const box = document.getElementById("chatList");

        const autoScroll =
            box.scrollTop + box.clientHeight >=
            box.scrollHeight - 50;

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
/* =====================================================
   FORMAT WAKTU
===================================================== */

function formatWaktu(waktu) {

    if (!waktu) return "";

    if (waktu.includes("/")) {

        return waktu;

    }

    const d = new Date(waktu);

    return d.toLocaleString("id-ID", {

        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"

    });

}

/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(text) {

    if (!text) return "";

    return text

        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

/* =====================================================
   KELUAR HALAMAN
===================================================== */

window.addEventListener("beforeunload", function () {

    stopChat();

});
