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

        const url = CHAT_API + "?action=getChat";

        console.log(url);

        const res = await fetch(url);

        console.log("Status :", res.status);

        const text = await res.text();

        console.log(text);

    } catch (err) {

        console.error(err);

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
