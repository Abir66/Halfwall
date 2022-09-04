let error_message = "";


function onPasswordChange() {
    const new_password = document.querySelector('input[name=new-password]');
    const confirm = document.querySelector('input[name=confirm-password]');
    if (confirm.value === new_password.value) {
      confirm.setCustomValidity('');
    } else {
      confirm.setCustomValidity('Passwords do not match');
    }
}


function check_inputs(email, studentId, name) {
    
    if (studentId.length != 7 || studentId.includes('.') || isNaN(studentId)) {
        error_message = "* Invalid StudentId";
        return false;
    }
    if (!email.match(
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )) {
        error_message = "* Invalid Email Format";
        return false;
    }
    return true;
}


async function editProfile(user_id) {
    const email = document.getElementById('edit-profile-email').value.replace(/ +(?= )/g, '').trim();
    const studentId = document.getElementById('edit-profile-student_id').value.replace(/ +(?= )/g, '');
    const name = document.getElementById('edit-profile-name').value.replace(/ +(?= )/g, '');
    const dof = document.getElementById('edit-profile-dof').value;
    console.log(dof);
    const hall = document.getElementById('edit-profile-hall').value.replace(/ +(?= )/g, '').trim();
    const attachment = document.getElementById('edit-profile-attachment').value.replace(/ +(?= )/g, '').trim();
    const street = document.getElementById('edit-profile-street').value.replace(/ +(?= )/g, '').trim();
    const city = document.getElementById('edit-profile-city').value.replace(/ +(?= )/g, '').trim();
    const postcode = document.getElementById('edit-profile-postcode').value.replace(/ +(?= )/g, '').trim();
    const message = document.getElementById('edit-profile-hidden_message');
    
    const new_password = document.getElementById('edit-profile-new-password').value
    const current_password = document.getElementById('edit-profile-current-password').value
    const alert = document.getElementById('edit-no-success');

    
    if (!check_inputs(email, studentId, name)) {
        message.innerHTML = error_message;
        message.setAttribute('visibility', 'visible');
        message.setAttribute('color', 'red');
        return;
    }

    const data = {
        student_id: studentId,
        email: email,
        name: name,
        dof: dof,
        hall: hall,
        attachment: attachment,
        street: street,
        city: city,
        postcode: postcode,
        new_password : new_password,
        password : current_password
    }

    const res = await axios.post("/user/editProfile", data);
    if (res.data === "success") {
        window.location.replace('/user/user_id=' + user_id);
    } else {

        alert.innerHTML = `<div class="alert alert-warning alert-dismissible" id="edit-profile-alert" margin-top: 1rem;">
            ${res.data}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`
        // alert.setAttribute('visibility', 'visible');
        // console.log(res.data)
        // message.innerHTML = "* " + res.data;
        // message.setAttribute('visibility', 'visible');

       
    }
}