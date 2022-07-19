const form = document.getElementById('submit');
const message_field = document.getElementById('hidden_message');

let error_message;

form.addEventListener('click', (e) => {
    console.log("hello world");
    e.preventDefault();
    signup();
})

function check_inputs(email, studentId, name, password1, password2){
    
    if(email === '' || studentId === '' || name === '' || password1 === '' || password2 === '') return false;
    if(password1 != password2){
        error_message = "Passwords do not match";
        return false;
    }
    if(studentId.length != 7 || studentId.includes('.') || isNaN(studentId)){
        error_message = "invalid studentId";
        return false;
    }
    else return true;
}


async function signup(){
    const email = document.getElementById('email').value.replace(/ +(?= )/g,'');
    const studentId = document.getElementById('studentID').value.replace(/ +(?= )/g,'');
    const name = document.getElementById('name').value.replace(/ +(?= )/g,'');
    const password1= document.getElementById('pass1').value.replace(/ +(?= )/g,'');
    const password2= document.getElementById('pass2').value.replace(/ +(?= )/g,'');
    console.log(email+" "+studentId+" "+name+" "+password1);
    
    if(!check_inputs(email, studentId, name, password1, password2)){
        message_field.innerHTML = error_message;
        message_field.setAttribute('visibility','visible');
        return;
    }

    const data = {
        student_id : studentId,
        email : email,
        name : name,
        password : password1
    }
    const res = await axios.post("/auth/signup", data)
    
    message_field.innerHTML = res.data;
    message_field.setAttribute('visibility','visible');

}
