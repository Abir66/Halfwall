require('dotenv').config();
const router = require('express').Router();
const { verify } = require('../../middlewares/user-verification.js');
const DB_group = require('../../db-codes/groups/db-group-api.js');


router.get('/', (req, res) => {

    res.send('groups/groups');
});


router.get('/group_id=:group_id', verify, (req, res) => {

    console.log(req.user)
    

    middle = []
    middle.push({
        type : 'group',
        content : req.params.group_id
    })
    
    res.render('index', {
        type : "group",
        currentUser : req.user,
        title : 'Groups',
        left : ['left-profile', 'sidebar'],
        right : [{location : 'group-menu'}],
        middle : middle
    });
});

router.get('/createGroup', verify, async(req, res) => {

    




})

router.post('/createGroup', verify, async(req, res) => {
   
    const group = {
        name : 'new_group_1',
        description : 'new_group_1_description',
        privacy : 'public'
    }

    // create group with db-group-api.js
    const result = await DB_group.createGroup(group, req.user.USER_ID);
    
    console.log(result)
    res.send('group created');
});



module.exports = router;