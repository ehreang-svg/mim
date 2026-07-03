let chatInterval = null;

async function kirimChat() {

    try {

        const pesan = document
            .getElementById("chatText")
            .value
            .trim();

        if (!pesan) return;

        const user =
            currentUser ||
            JSON.parse(localStorage.getItem("user") || "{}");

        const params = new URLSearchParams({

            action: "kirimChat",
            username: user.username || "",
            nama: user.nama || "",
            foto: user.foto || "",
            pesan: pesan

        });

        const res = await fetch(

            CHAT_API + "?" + params.toString()

        );

        const result = await res.json();

        if (!result.status) {

            alert(result.message);
            return;

        }

        document.getElementById("chatText").value = "";

        loadChat();

    } catch (err) {

        console.error(err);

        alert(err.message);

    }

}

async function loadChat() {

    try {

        const res = await fetch(CHAT_API + "?action=getChat");

        const text = await res.text();

        console.log("Response:", text);

        const result = JSON.parse(text);

        if (!result.status) return;

        const box = document.getElementById("chatList");

        box.innerHTML = "";

        result.data.forEach(item => {

            box.innerHTML += `
                <div class="chatItem">
                    <img src="${item.foto || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
                    <div>
                        <div class="chatNama">${item.nama}</div>
                        <div class="chatPesan">${item.pesan}</div>
                    </div>
                </div>
            `;

        });

    } catch (err) {

        console.error("Load Chat Error:", err);

    }

}

function openChat() {

    nav("chatPage");

    loadChat();

    if (chatInterval) {

        clearInterval(chatInterval);

    }

    chatInterval = setInterval(loadChat, 2000);

}

function stopChat() {

    if (chatInterval) {

        clearInterval(chatInterval);

        chatInterval = null;

    }

}
