const form = document.getElementById('submit');
const message_field = document.getElementById('hidden_message');

let error_message;

form.addEventListener('click', (e) => {
    e.preventDefault();
    signin();
})

function check_inputs(studentIdorEmail, password){
    if(studentIdorEmail === '' || password === '') return false;
    else return true;
}

async function signin(){
    const IDorEmail = document.getElementById('studentIDorEmail').value.replace(/ +(?= )/g,'');
    const pass= document.getElementById('pass').value.replace(/ +(?= )/g,'');
    
    if(!check_inputs(IDorEmail,pass)){
        message_field.innerHTML = error_message;
        message_field.setAttribute('visibility','visible');
        return;
    }
    const data = {
        student_id_or_email : IDorEmail,
        password : pass
    }
    // console.log(IDorEmail+" "+pass);
    const res = await axios.post("/auth/signin", data)
    if(res.data === "success"){
        window.location.replace("/message");
    }else{
        message_field.innerHTML = res.data;
        message_field.setAttribute('visibility','visible');
    }
}
