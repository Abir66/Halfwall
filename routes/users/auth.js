require('dotenv').config();
const router = require('express').Router();
const DB_user = require('../../db-codes/users/db-user-api');
const jwt = require('jsonwebtoken');
const { verify } = require('../../middlewares/user-verification.js');
const DB_storage = require('../../db-codes/files/storage-files');
const DB_newsfeed = require('../../db-codes/posts/db-newsfeed-api');

router.post('/signin', async (req, res) => {
    let result = [], errors = [], studentID, email;
    let studentIDorEmail = req.body.student_id_or_email;
    let password = req.body.password;
    if (studentIDorEmail.length === 7 && !studentIDorEmail.includes('.') && !isNaN(studentIDorEmail)) studentID = parseInt(studentIDorEmail);
    else email = studentIDorEmail;



    if (studentID) result = await DB_user.getUserByStudentId(studentID);
    else if (email) result = await DB_user.getUserByEmail(email);


    if (result === undefined || result.length === 0) {
        res.send("Email or UserID not found");
        return;
    }

    const password_matched = await DB_user.checkPassword(result.USER_ID, password);
    
    if (!password_matched) {
        res.send("Password incorrect");
        return;
    }

    else {
        const token = jwt.sign({ user_id: result.USER_ID }, process.env.JWT_ACCESS_TOKEN);
        let options = {
            maxAge: 1000 * 60 * 60 * 24 * 365,
            httpOnly: true
        }
        res.cookie('auth-token', token, options);
        res.send("success");
        console.log(`user - ${result.USER_ID} - ${result.STUDENT_ID} signing in...`);
    }

})

router.get('/signout', verify, (req, res) => {
    res.cookie('auth-token', '', { maxAge: 1 });
    res.redirect('/auth/signin');
});

router.get('/signin', async(req, res) => {
    res.render('auth/signin');
})


router.get('/signup', async(req, res) => {
    res.render('auth/signup');
})

// have to move it to controller later
function parseId(id) {
    let yr = parseInt(id.slice(0, 2));
    let today = new Date();
    let depts = ['NA', 'Arch', 'ChE', 'NA', 'CE', 'CSE', 'EEE', 'NA', 'IPE', 'NA', 'ME',
        'MME', 'NAME', 'NA', 'NA', 'URP', 'WRE', 'NA', 'BME', 'NA', 'NA'];
    let dept = depts[parseInt(id.slice(2, 4))];
    if (yr <= today.getFullYear() % 1000) {
        yr = Math.floor(today.getFullYear() / 1000) * 1000 + yr;
    } else {
        yr = (Math.floor(today.getFullYear() / 1000) - 1) * 1000 + yr;
    }

    return {
        year: yr,
        department: dept,
    }
}

router.post('/signup', async (req, res) => {
    let user;
    let idInfo = parseId(req.body.student_id.replace(/ +(?= )/g, '').trim());
    try {
        user = {
            student_id: req.body.student_id.replace(/ +(?= )/g, '').trim(),
            name: req.body.name.replace(/\s+/g, " ").trim(),
            email: req.body.email.replace(/ +(?= )/g, '').trim(),
            password: req.body.password.replace(/ +(?= )/g, '').trim(),
            department: idInfo.department,
            batch: idInfo.year,
        }
    } catch (err) {
        
        res.send("Invalid input");
        return;
    }

    result = await DB_user.insertUser(user);

    if (result === 'Student ID or email already exists' || result === 'Something went wrong') {
        res.send(result);
        return;
    }

    // do jwt token things
    const token = jwt.sign({ user_id: result }, process.env.JWT_ACCESS_TOKEN);
    let options = {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true
    }
    res.cookie('auth-token', token, options);

    // redirect to user profile page
    console.log("user created")
    res.send("success");
})


// test route
router.get('/test', verify, async (req, res) => {

    let middle = [{type : "create-post", location : "posts/create_post"}];

    const search_data = {}
    
    if(req.query.newsfeed_search_term || req.query.newsfeed_sort_by){
        search_data.searched = true;
        search_data.search_term = req.query.newsfeed_search_term.trim();
        search_data.sort_by = req.query.newsfeed_sort_by;
    }

    const posts = await DB_newsfeed.getNewsFeedPostsForUserID2(req.user.USER_ID, search_data);
    

    middle.push({type : "posts", data : posts});
    

    res.render('index', {
        type : "newsfeed",
        currentUser : req.user,
        group: undefined,
        title : 'Newsfeed',
        left : ['left-profile', 'sidebar'],
        right : [{location : 'newsfeed-search', data : search_data}],
        middle : middle,
        
    });
    
});



module.exports = router;