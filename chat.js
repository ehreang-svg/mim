async function kirimChat(){

try{

const pesan=document
.getElementById("chatText")
.value.trim();

if(!pesan) return;

const nama=localStorage.getItem("nama");

const foto=localStorage.getItem("foto");

await fetch(

CHAT_API+
"?action=kirimChat"+
"&nama="+encodeURIComponent(nama)+
"&foto="+encodeURIComponent(foto)+
"&pesan="+encodeURIComponent(pesan)

);

document
.getElementById("chatText")
.value="";

loadChat();

}catch(err){

alert(err);

}

}
async function loadChat(){

try{

const res=await fetch(

CHAT_API+
"?action=getChat"

);

const result=await res.json();

if(!result.status) return;

const box=document
.getElementById("chatList");

box.innerHTML="";

result.data.forEach(item=>{

box.innerHTML+=`

<div class="chatItem">

<img src="${item.foto}">

<div>

<div class="chatNama">

${item.nama}

</div>

<div class="chatPesan">

${item.pesan}

</div>

</div>

</div>

`;

});

}catch(err){

console.log(err);

}

}

let chatInterval = null;

function openChat(){

    nav("chatPage");

    loadChat();

    if(chatInterval){
        clearInterval(chatInterval);
    }

    chatInterval = setInterval(loadChat,2000);

}

function stopChat(){

    if(chatInterval){
        clearInterval(chatInterval);
        chatInterval = null;
    }

}
