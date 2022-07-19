require('dotenv').config();
const router = require('express').Router();
const DB_user = require('../../db-codes/users/db-user-api');
const jwt = require('jsonwebtoken');
const { verify } = require('../../middlewares/user-verification.js');
const { validate } = require('uuid');
const { DATE } = require('oracledb');


router.post('/signin', async (req, res) => {
    let result = [], errors = [], userID, email;
    console.log("In the post routes!");
    let userIDorEmail = req.body.user_id_or_email;
    let password = req.body.password;
    if (userIDorEmail.length === 7 && !userIDorEmail.includes('.') && !isNaN(userIDorEmail)) userID = parseInt(userIDorEmail);
    else email = userIDorEmail;

    console.log(userID, email, password);


    if (userID) result = await DB_user.getUserById(userID);
    else if (email) result = await DB_user.getUserByEmail(email);





    if (result === undefined || result.length === 0) {
        errors.push("Email or UserID not found");
    }


    else {

        if (result.PASSWORD !== password) {
            errors.push("Password incorrect");
        }
        else {

            // do jwt token things
            const token = jwt.sign({ user_id: result.USER_ID }, process.env.JWT_ACCESS_TOKEN);
            let options = {
                maxAge: 1000 * 60 * 60 * 24 * 365,
                httpOnly: true
            }
            res.cookie('auth-token', token, options);
        }
    }

    console.log("in route");
    if (errors.length > 0) {
        // redirect to login page with errors
        res.send(errors[0]);
    }

    else {
        // redirect to home page
        res.send('done')
    }

})

router.get('/signout', verify, (req, res) => {
    //destroy token
    res.cookie('auth-token', '', { maxAge: 1 });
    console.log("logged out");
    // redirect to login page
    //res.redirect('/auth/signin');
    res.send("signed out");
});

router.get('/signin', (req, res) => {
    console.log("signin");
    res.render('auth/signin');
})


router.get('/signup', (req, res) => {
    console.log("signup");
    res.render('auth/signup');
})

function parseId(id){
    let yr = parseInt(id.slice(0,2));
    let today = new Date();
    let depts = ['NA','Arch','ChE','NA','CE','CSE','EEE','NA','IPE','NA','ME',
                 'MME','NAME','NA','NA','URP','WRE','NA','BME','NA','NA'];
    let dept = depts[parseInt(id.slice(2,4))];
    if(yr <= today.getFullYear()%1000){
        yr = Math.floor(today.getFullYear()/1000)*1000+yr;
    }else{
        yr = (Math.floor(today.getFullYear()/1000)-1)*1000+yr;
    }

    return {
        year : yr,
        department : dept,
    }
}

router.post('/signup', async (req, res) => {
    let user;
    let idInfo = parseId(req.body.user_id.replace(/ +(?= )/g, '').trim());
    try {
        user = {
            user_id: req.body.user_id.replace(/ +(?= )/g, '').trim(),
            name: req.body.name.replace(/\s+/g, " ").trim(),
            email: req.body.email.replace(/ +(?= )/g, '').trim(),
            password: req.body.password.replace(/ +(?= )/g, '').trim(),
            department: idInfo.department,
            batch: idInfo.year,

        }
    } catch (err) {
        console.log("yooo");
        res.send("Invalid input");
        return;
    }


    // validate data
    // will make a funtion to validate data later
    // upre likhsi


    result = await DB_user.insertUser(user);

    if (result != "success") {
        res.send(result);
        return;
    }

    // do jwt token things
    const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_ACCESS_TOKEN);
    let options = {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true
    }
    res.cookie('auth-token', token, options);


    // redirect to user profile page
    console.log("user created : ")
    res.send("user created");


})



// router.get('/verify', verify, (req, res) => {
//     res.send("all good")
// });


module.exports = router;