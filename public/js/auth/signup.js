const form = document.getElementById('submit');
const message_field = document.getElementById('hidden_message');

let error_message;

form.addEventListener('click', (e) => {
    console.log("hello world");
    e.preventDefault();
    signup();
})

function check_inputs(email, userId, name, password1, password2){
    
    if(email === '' || userId === '' || name === '' || password1 === '' || password2 === '') return false;
    if(password1 != password2){
        error_message = "Passwords do not match";
        return false;
    }
    if(userId.length != 7 || userId.includes('.') || isNaN(userId)){
        error_message = "invalid userId";
        return false;
    }
    else return true;
}

async function signup(){


    const email = document.getElementById('email').value.replace(/ +(?= )/g,'');
    const userId = document.getElementById('userID').value.replace(/ +(?= )/g,'');
    const name = document.getElementById('name').value.replace(/ +(?= )/g,'');
    const password1= document.getElementById('pass1').value.replace(/ +(?= )/g,'');
    const password2= document.getElementById('pass2').value.replace(/ +(?= )/g,'');
    console.log(email+" "+userId+" "+name+" "+password1);
    
    if(!check_inputs(email, userId, name, password1, password2)){
        message_field.innerHTML = error_message;
        message_field.setAttribute('visibility','visible');
        return;
    }

    const data = {
        user_id : userId,
        email : email,
        name : name,
        password : password1
    }
    const res = await axios.post("/auth/signup", data)
    
    message_field.innerHTML = res.data;
    message_field.setAttribute('visibility','visible');

}






// function checkInputs(){   
//     const email = document.getElementById('email').value;
//     const userId = document.getElementById('userID').value;
//     const name = document.getElementById('studentName').value.trim();
//     const pass1= document.getElementById('pass1').value;
//     const pass2 = document.getElementById('pass2').value;
    
//     const message = document.getElementById('hidden_message');
//     let str = ""

//     //hudai check marsi
//     if(userId.length!=7){
//         str = "Id must be a 7 digit number ex.1901001";
//     }else if(pass1 != pass2){
//         str = "Passwords didn't match";
//     }
//     else{
//         message.setAttribute('visibility','hidden');
        
//         const xhr = new XMLHttpRequest();
        
//         xhr.open('POST','https://reqres.in/api/users',true);
//         xhr.getResponseHeader('Content-type','application/json');
        
//         xhr.onload = function(){
//             if(this.status === 200){
//                 console.log(this.responseText) //this sends me a response
//             }else{
//                 console.error("some error occured"); 
//             }
            
//         }

//         // params = { eda edit kore nis
//         //     "USERID":userId,
//         //     "NAME":name,
//         //     "DEPARTMENT":dept,
//         //     "BATCH":batch,
//         //     "EMAIL_ADDRESS":email,
//         //     "HALL":hall,
//         //     "PASSWORD":pass1
//         // };
//         params = {
//             "name": "morpheusss",
//             "job": "leader"
//         }

//         xhr.send(JSON.stringify(params));
//         //xhr.send(params);
//     }
//     message.innerHTML = str;
//     message.setAttribute('visibility','visible');
// }