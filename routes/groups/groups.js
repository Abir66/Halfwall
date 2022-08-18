require('dotenv').config();
const router = require('express').Router();
const { verify } = require('../../middlewares/user-verification.js');
const { group_header } = require('../../middlewares/group-header.js');
const DB_group = require('../../db-codes/groups/db-group-api.js');
const DB_group_member = require('../../db-codes/groups/db-group-member-api.js');
const utils = require('../../routerControllers/utils.js');


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
    res.send('group created');
});


router.get('/group_id=:group_id/members', verify, group_header,  async(req, res) => {

    res.locals.middle[0].data.active = 'Members';
    
    const group_id = req.params.group_id;
    const privacy = await DB_group.getGroupPrivacy(group_id);
    const isAdmin = res.locals.isAdmin;
    const isMember = res.locals.isMember;

    const search_data = {user_id : req.user.USER_ID};


    if(req.query.group_members_search_term || req.query.group_members_filter || req.query.group_members_sort_by ) {
        search_data.searched = true;
        search_data.search_term = req.query.group_members_search_term;
        search_data.member_filter = utils.to_array(req.query.group_members_filter);
        search_data.sort_by = req.query.group_members_sort_by;
    }



    if(!search_data.member_filter || search_data.member_filter.length == 0 || (search_data.member_filter.length == 1 && search_data.member_filter[0] == 'followings')) {
        search_data.member_filter = ['admins'];
        if(privacy == 'public' || isMember) search_data.member_filter.push('members');
    }


    let admins = [];
    let group_members = [];
    let pending_members = [];

    if(search_data.member_filter.includes('admins')) admins = await DB_group_member.getGroupMembers(req.params.group_id, 'ADMIN', search_data);
    if(search_data.member_filter.includes('members') && (privacy == 'public' || isMember)) group_members = await DB_group_member.getGroupMembers(req.params.group_id, 'MEMBER', search_data);
    if(search_data.member_filter.includes('pendings') && isAdmin) pending_members = await DB_group_member.getGroupMembers(req.params.group_id, 'PENDING', search_data);
    
    const data = {
        group_admins : admins,
        group_members : group_members || [],
        pending_members : pending_members || [],
    }

    res.locals.middle.push({
        type : 'group-members',
        location : 'groups/group-members',
        data : data
    })

    res.render('index', {
        type : "group",
        currentUser : req.user,
        title : 'Halfwall | ' + res.locals.group.GROUP_NAME,
        left : ['left-profile', 'sidebar'],
        right : [{location : 'groups/group-members', data : search_data}],
    });
});


router.get('/group_id=:group_id/about', verify, group_header, async(req, res) => {

    res.locals.middle[0].data.active = 'About';

    const group_id = req.params.group_id;
    const group_about = await DB_group.getGroupAbout(group_id);
    
    const group_about_data = {
        description : group_about.GROUP_DESCRIPTION,
        creation_date : group_about.TIME_OF_CREATION,
        post_count : group_about.POST_COUNT
    }

    res.locals.middle.push({
        type : 'group-about',
        location : 'groups/group-about',
        data : group_about_data
    })

    res.render('index', {
        type : "group",
        currentUser : req.user,
        title :  res.locals.group.GROUP_NAME,
        left : ['left-profile', 'sidebar'],
        right : [],
    });


})


router.post('/group_id=:group_id/delete-group', verify, async(req, res) => {
    // check if admin
    const isAdmin = await DB_group_member.isAdmin(req.params.group_id, req.user.USER_ID);
    if(!isAdmin) return res.send('not admin');
    await DB_group.deleteGroup(req.params.group_id);
    res.send('success');

})

router.get('/group_id=:group_id', verify, async(req, res) => {
    // is member
    const isMember = await DB_group_member.isMember(req.params.group_id, req.user.USER_ID);
    if(!isMember) res.redirect('/groups/group_id=' + req.params.group_id + '/about');
    else res.redirect('/groups/group_id=' + req.params.group_id + '/posts');
})



router.get('/', verify, async(req, res) => {


    const right = [];
    

    const search_data = {
        search_term : '',
        group_privacy : [],
        group_membership : [],
        sort_by : '',
    }


    if(req.query.group_search_term || req.query.group_privacy || req.query.group_membership || req.query.group_sort_by ) {
        search_data.searched = true;
        search_data.search_term = req.query.group_search_term;
        search_data.group_privacy = utils.to_array(req.query.group_privacy);
        search_data.group_membership = utils.to_array(req.query.group_membership);
        search_data.sort_by = req.query.group_sort_by;
    }


    const group_search = {
        type : "groups-search",
        location : 'groups/groups-search',
        data : search_data
    }

    right.push(group_search);

    groups = await DB_group.getGroupsForUser(req.user.USER_ID, search_data);
    
    
    res.render('index', {
        type : "group",
        currentUser : req.user,
        user : req.user, 
        title : 'Halfwall | Groups',
        left : ['left-profile', 'sidebar'],
        right : right,
        middle : [{type : 'group-thumbnail', location : 'groups/group-thumbnail', data : {groups : groups}}]
    });



})


router.post('/group_id=:group_id/process-group-member', verify, async(req, res) => {

    const group_id = req.params.group_id;
    const member_id = req.body.member_id;
    const action = req.body.action;
    const isAdmin = await DB_group_member.isAdmin(group_id, req.user.USER_ID);
    if(!isAdmin) return res.send('You are not an admin');
    const result = await DB_group_member.processGroupMember(group_id, req.user.USER_ID, member_id, action);
    return res.send(result);
    


})


module.exports = router;