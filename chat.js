/* ===========================
   CHAT
=========================== */

let chatInterval = null;

/* ===========================
   USER LOGIN
=========================== */

function getChatUser() {

    if (currentUser) return currentUser;

    const user = localStorage.getItem("user");

    if (user) {

        try {

            return JSON.parse(user);

        } catch (e) {}

    }

    return {};

}

/* ===========================
   BUKA CHAT
=========================== */

function openChat() {

    nav("chatPage");

    loadChat();

    if (chatInterval) {

        clearInterval(chatInterval);

    }

chatInterval=setInterval(loadChatBaru,2000);

}

/* ===========================
   TUTUP CHAT
=========================== */

function stopChat() {

    if (chatInterval) {

        clearInterval(chatInterval);

        chatInterval = null;

    }

}

/* ===========================
   ENTER = KIRIM
=========================== */

document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("chatText");

    if (!input) return;

    input.addEventListener("keydown", e => {

        if (e.key === "Enter") {

            e.preventDefault();

            kirimChat();

        }

    });

});

/* ===========================
   KIRIM CHAT
=========================== */

async function kirimChat() {

    try {

        const input = document.getElementById("chatText");

        const pesan = input.value.trim();

        if (!pesan) return;

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

        loadChat();

    } catch (err) {

        console.error(err);

        alert(err.message);

    }

}

/* ===========================
   LOAD CHAT
=========================== */

async function loadChat() {

    try {

        const res = await fetch(

            CHAT_API + "?action=getChat"

        );

        const text = await res.text();

        const json = JSON.parse(text);

        if (!json.status) return;

        const box = document.getElementById("chatList");

        const user = getChatUser();

        box.innerHTML="";

json.data.forEach(renderChat);

lastChat=json.data.length;

box.scrollTop=box.scrollHeight;

            box.innerHTML += `

<div class="chatItem ${sendiri ? "me" : ""}">

<img class="chatFoto" src="${foto}">

<div class="chatBubble">

<div class="chatNama">

${item.nama}

</div>

<div class="chatPesan">

${item.pesan}

</div>

<div class="chatWaktu">

${item.waktu}

</div>

</div>

</div>

`;

        });

        box.scrollTop = box.scrollHeight;

    } catch (err) {

        console.error(err);

    }

}
let lastChat = 0;
function renderChat(item){

    const box=document.getElementById("chatList");

    const user=getChatUser();

    const sendiri=item.username===user.username;

    const foto=item.foto ||

    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    const html=`

<div class="chatItem ${sendiri?"me":""}">

<img class="chatFoto" src="${foto}">

<div class="chatBubble">

<div class="chatNama">

${item.nama}

</div>

<div class="chatPesan">

${item.pesan}

</div>

<div class="chatWaktu">

${item.waktu}

</div>

</div>

</div>

`;

    box.insertAdjacentHTML("beforeend",html);

}
async function loadChatBaru(){

try{

const res=await fetch(

CHAT_API+
"?action=getChatBaru"+
"&last="+lastChat

);

const result=await res.json();

if(!result.status) return;

if(result.data.length){

const box=document.getElementById("chatList");

const autoScroll=

box.scrollTop+box.clientHeight>=
box.scrollHeight-50;

result.data.forEach(renderChat);

lastChat=result.last;

if(autoScroll){

box.scrollTop=box.scrollHeight;

}

}

}catch(err){

console.log(err);

}

}
