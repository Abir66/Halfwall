require('dotenv').config();
const router = require('express').Router();
const DB_user = require('../../db-codes/users/db-user-api');
const DB_follow = require('../../db-codes/users/db-follow-api');
const jwt = require('jsonwebtoken');
const { verify } = require('../../middlewares/user-verification.js');
const { response } = require('express');

router.get('/searchProfile',verify,async(req,res)=>{
    res.render("middle/searchProfile/searchProfile");
})

router.post('/searchProfile',verify,async(req,res)=>{
    console.log(req.body);
    matches = req.body.user_input.match(/(\d+)/);
    let userId = 0;
    let text = "";
    let hall = "";
    if(matches === null){
        ;
    }else if(matches[0].length === 7){
        userId = matches[0];
    }
    const user = await DB_user.searchProfile(req.body.user_input,parseInt(userId),req.body.hall_name,req.body.attachment,req.body.city);
    res.send(user);
})

module.exports = router;