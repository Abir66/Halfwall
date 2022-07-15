require('dotenv').config();
const router = require('express').Router();
const DB_user = require('../../DB-codes/users/DB-user-api');
const jwt = require('jsonwebtoken');
const {verify} = require('../../middlewares/user-verification.js');


router.post('/signin', async (req, res) => {
    let result = [], errors = [], userID, email;
    let { userIDorEmail, password } = req.body;

    if(userIDorEmail.length === 7 && !userIDorEmail.includes('.') && !isNaN(userIDorEmail)) userID = parseInt(userIDorEmail);
    else email = userIDorEmail;

    console.log(userID, email, password);

    if( userID ) result = await DB_user.getUserById(userID);
    else if (email) result = await DB_user.getUserByEmail(email);
    
    console.log(result);
    
    if(result === undefined || result.length === 0){
        errors.push("Email or userID not found");
    }

    else{

        if(result.PASSWORD !== password){
            errors.push("Password incorrect");
        }
        else{
            // do jwt token things
            const token = jwt.sign({ user_id: result.USER_ID }, process.env.JWT_ACCESS_TOKEN);
            let options = {
                maxAge: 1000 * 60 * 60 * 24 * 365, 
                httpOnly: true
            }
            res.cookie('auth-token', token, options);
        }
    }


    if(errors.length > 0){
        // redirect to login page with errors
        res.status(400).render('auth/signin', {error : errors[0]})
        console.log(errors);
    }

    else{
        // redirect to home page
        res.redirect('/newsfeed')
    }

})

router.get('/signout', verify ,(req,res)=>{
    //destroy token
    res.cookie('auth-token', '', { maxAge:1 });
    console.log("logged out");
    // redirect to login page
    //res.redirect('/auth/signin');
    res.send("signed out");
});


router.get('/signin', (req, res) => {
    console.log("signin");
    res.render('auth/signin');
})

// router.get('/verify', verify, (req, res) => {
//     res.send("all good")
// });


module.exports = router;