require('dotenv').config();
const router = require('express').Router();
const { verify } = require('../../middlewares/user-verification.js');
const DB_group = require('../../db-codes/groups/db-group-api.js');
const DB_group_member = require('../../db-codes/groups/db-group-member-api.js');


router.get('/create-group', verify, async(req, res) => {

    const currentUser = {
        USER_ID : req.user.USER_ID,
        STUDENT_ID : req.user.STUDENT_ID,
        NAME : req.user.NAME,
        DEPARTMENT: req.user.DEPARTMENT,
        DATE_OF_BIRTH: req.user.DATE_OF_BIRTH,
        HALL: req.user.HALL,
        HALL_ATTACHMENT: req.user.HALL_ATTACHMENT,
        BATCH: req.user.BATCH,
        STREET: req.user.STREET,
        CITY: req.user.CITY,
        POSTCODE: req.user.POSTCODE,
        PROFILE_PIC : '/images/pfp.jpg', // will change it later
    }


    res.render('index', {
        type : "group",
        currentUser : currentUser,
        title : 'Halfwall | Create Group',
        left : ['left-profile', 'sidebar'],
        right : [],
        middle : [{type : 'createGroup', location : 'groups/createGroup'}]
    });

})

router.post('/create-group', verify, async(req, res) => {
    const group = {
        name : req.body.group_name,
        description : req.body.group_description,
        privacy : req.body.group_privacy
    }

    const result = await DB_group.createGroup(group, req.user.USER_ID);
    console.log(result)
    res.send('group created');
});



router.get('/group_id=:group_id', verify, async(req, res) => {

    const group_id = req.params.group_id;
    const group = await DB_group.getGroup(group_id);
    console.log(group);

    const isAdmin = await DB_group.isAdmin(group_id, req.user.USER_ID);
    console.log(isAdmin);
    

    const group_header = {
        group_id : group.GROUP_ID,
        group_name : group.GROUP_NAME,
        group_privacy : group.GROUP_PRIVACY,
        group_member_count : group.GROUP_MEMBER_COUNT
    }

    middle = []
    middle.push({
        type : 'group-header',
        location : 'groups/group-header',
        data : group_header
    })

    res.render('index', {
        type : "group",
        currentUser : req.user,
        group : group,
        title : group.GROUP_NAME,
        left : ['left-profile', 'sidebar'],
        right : [{location : 'group-menu', data : {selected : 'about', isAdmin : true}}],
        middle : middle
    });
});



router.get('/group_id=:group_id/members', verify, async(req, res) => {


    const group_id = req.params.group_id;
    const privacy = await DB_group.getGroupPrivacy(group_id);
    const isMember = await DB_group.isMember(group_id, req.user.USER_ID);

    if(privacy == 'private' && !isMember){
        res.redirect('/groups/group_id=' + group_id);
    }
    
    const group = await DB_group.getGroup(group_id);
    const group_members = await DB_group_member.getGroupMembers(req.params.group_id);
    const isAdmin = await DB_group.isAdmin(group_id, req.user.USER_ID);

    
    const group_header = {
        group_id : group.GROUP_ID,
        group_name : group.GROUP_NAME,
        group_privacy : group.GROUP_PRIVACY,
        group_member_count : group.GROUP_MEMBER_COUNT
    }

    middle = []
    middle.push({
        type : 'group-header',
        location : 'groups/group-header',
        data : group_header
    })

    middle.push({
        type : 'group-members',
        location : 'groups/group-members',
        data : {group_members : group_members, isAdmin : isAdmin}
    })

    res.render('index', {
        type : "group",
        currentUser : req.user,
        group : group,
        title : group.GROUP_NAME,
        left : ['left-profile', 'sidebar'],
        right : [{location : 'group-menu', data : {selected : 'members', isAdmin : isAdmin}}],
        middle : middle
    });
});






module.exports = router;