async function mulai(){
const nisn =
document.getElementById("nisn").value;
const res =
await fetch(Quiz_API+"?nisn="+nisn);
const data =
await res.json();
console.log(data);
if(data.error){
alert(data.error);
return;
}
dataSiswaQuiz=data.siswa;
dataSoal=data.soal;
tampilSiswaQuiz();
tampilSoal();
}
function tampilSiswaQuiz(){

    console.log(dataSiswaQuiz);

    if(!dataSiswaQuiz){
        console.error("Data siswa tidak ditemukan");
        return;
    }

    document.getElementById("siswa").innerHTML = `
        <div class="cardQuiz">
            <img src="${dataSiswaQuiz.foto || ''}">
            <h3>${dataSiswaQuiz.nama || '-'}</h3>
            <p>NISN : ${dataSiswaQuiz.nisn || '-'}</p>
            <p>Kelas : ${dataSiswaQuiz.kelas || '-'}</p>
        </div>
    `;
}
function tampilSoal(){
let html="";
dataSoal.forEach((s,index)=>{
html+=`
<div class="cardQuiz" style="text-align:left";>
<p>
<b>${s.no}. ${s.soal}</b>
</p>
<label>
<input type="radio"
name="q${index}"
value="A">
${s.A}
</label><br>
<label>
<input type="radio"
name="q${index}"
value="B">
${s.B}
</label><br>
<label>
<input type="radio"
name="q${index}"
value="C">
${s.C}
</label><br>
<label>
<input type="radio"
name="q${index}"
value="D">
${s.D}
</label>
</div>
`;
});
html+=`
<button type="button"
onclick="koreksi()">
Kirim Jawaban
</button>
`;
document.getElementById("quiz")
.innerHTML=html;
}
async function koreksi(){
let benar=0;
dataSoal.forEach((s,index)=>{
let jwb=
document.querySelector(
`input[name=q${index}]:checked`
);
if(jwb &&
jwb.value===s.jawaban){
benar++;
}
});
let nilai=
Math.round(
(benar/dataSoal.length)*100
);
let status=
nilai>=70
? "LULUS"
: "TIDAK LULUS";
document.getElementById("hasil")
.innerHTML=
`
<h2>Nilai : ${nilai}</h2>
<h2>Status : ${status}</h2>
`;
await fetch(Quiz_API,{
method:"POST",
body:JSON.stringify({
nisn:dataSiswaQuiz.nisn,
nama:dataSiswaQuiz.nama,
nilai:nilai,
status:status
})
});
}
