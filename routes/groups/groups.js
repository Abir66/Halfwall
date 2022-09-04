require('dotenv').config();
const router = require('express').Router();
const { verify } = require('../../middlewares/user-verification.js');
const { group_header } = require('../../middlewares/group-header.js');
const { verifyAdmin } = require('../../middlewares/group-verification.js');
const DB_user = require('../../db-codes/users/db-user-api');
const DB_group = require('../../db-codes/groups/db-group-api.js');
const DB_group_member = require('../../db-codes/groups/db-group-member-api.js');
const utils = require('../../routerControllers/utils.js');
const { group_cover_upload } = require('../../middlewares/file-upload.js');
const default_values = require('../../db-codes/default_values');



router.get('/create-group', verify, async(req, res) => {

    res.render('index', {
        type : "group",
        currentUser : req.user,
        title : 'Halfwall | Create Group',
        left : ['left-profile', 'sidebar'],
        right : [],
        middle : [{type : 'createGroup', location : 'groups/create-group'}]
    });
})

router.get('/group_id=:group_id/edit-group', verify, verifyAdmin, async(req, res) => {

    res.render('index', {
        type : "group",
        currentUser : req.user,
        title : 'Halfwall | Create Group',
        left : ['left-profile', 'sidebar'],
        right : [],
        middle : [{type : 'createGroup', location : 'groups/edit-group'}]
    });
})

router.post('/create-group', verify, async(req, res) => {
    const group = {
        name : req.body.group_name,
        description : req.body.group_description,
        privacy : req.body.group_privacy
    }

    const result = await DB_group.createGroup(group, req.user.USER_ID);
    if(result.result == 'success') res.redirect('/groups/group_id=' + result.group_id);
    else res.send(result.result);
});

router.post('/group_id=:group_id/edit-group', verify, verifyAdmin, async(req, res) => {
    const group = {
        group_id : req.params.group_id,
        name : req.body.group_name,
        description : req.body.group_description,
        privacy : req.body.group_privacy,
        cover_photo : req.body.group_cover_photo
    }

    await DB_group.updateGroup(group);
    res.redirect('/groups/group_id=' + req.params.group_id + '/about');
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
        search_data.search_term = req.query.group_members_search_term.trim();
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


router.get('/group_id=:group_id/user/user_id=:user_id', verify, group_header, async(req,res) => {

    
    const group_id = req.params.group_id;

    if(group_id == 1 || group_id == 2) {
        res.redirect('/user/user_id=' + req.params.user_id);
        return;
    }


    const privacy = await DB_group.getGroupPrivacy(group_id);
    const isAdmin = res.locals.isAdmin;
    const isMember = res.locals.isMember;
    const user_id = req.params.user_id;

    if(!isMember && privacy == 'PRIVATE' && user_id != req.user.USER_ID) {
        
        res.send('okay');
        return;
    }

    let user = await DB_group_member.getMemberinGroup(group_id, user_id);
    if(!user) {
        user = await DB_user.getUserMiniData(user_id);
        user.STATUS = 'Not a current member of this group';
    }

    if(!user) {
        res.status(404).send('Nothing found');
        return;
    }

    res.locals.middle.push({type : "group_user_profile", location : "groups/group-user-profile"});

    const search_data = {post_user_id : req.params.user_id}
    if(req.query.group_post_search_term  || req.query.group_post_sort_by ) {
        search_data.searched = true;
        search_data.search_term = req.query.group_post_search_term.trim();
        search_data.sort_by = req.query.group_post_sort_by;
    }


    const posts = await DB_group.getGroupPosts(group_id, req.user.USER_ID, search_data);

    // if user not in group
    if(!user && posts.length == 0) {
        res.status(404).send('Nothing found');
        return;
    }



    res.locals.middle.push({type : "posts", data : posts})

    res.render('index', {
        type : "group",
        currentUser : req.user,
        user : user,
        title :  res.locals.group.GROUP_NAME,
        left : ['left-profile', 'sidebar'],
        right : [{location : 'groups/group-user-posts-search', data : search_data}],
    });

})

router.get('/group_id=:group_id/posts', verify, group_header, async(req, res) => {

    res.locals.middle[0].data.active = 'Posts';
    
    const group_id = req.params.group_id;
    const privacy = res.locals.group.GROUP_PRIVACY;
    const isAdmin = res.locals.isAdmin;
    const isMember = res.locals.isMember;

    
    if(isMember) res.locals.middle.push({type : "create-post", location : "posts/create_post"})
    
    const search_data = {}
    if(req.query.group_post_search_term  || req.query.group_post_filter || req.query.group_post_sort_by ) {
        search_data.searched = true;
        search_data.search_term = req.query.group_post_search_term.trim();
        search_data.group_post_filter = utils.to_array(req.query.group_post_filter);
        search_data.sort_by = req.query.group_post_sort_by;
    }

    
    // get posts

    let posts;
    if(privacy == 'PRIVATE' && !isMember) {
        search_data.post_user_id = req.user.USER_ID;
        posts = await DB_group.getGroupPosts(group_id, req.user.USER_ID, search_data);
        res.locals.middle.push({location : "groups/private-group-own-post"})
        res.locals.middle.push({type : "posts", data : posts})
    }

    else{
        posts = await DB_group.getGroupPosts(group_id, req.user.USER_ID, search_data);
        res.locals.middle.push({type : "posts", data : posts})
    }
    

    res.render('index', {
        type : "group",
        currentUser : req.user,
        title :  res.locals.group.GROUP_NAME,
        left : ['left-profile', 'sidebar'],
        right : [{location : 'groups/group-posts-search', data : search_data}],
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
        search_data.search_term = req.query.group_search_term.trim();
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

router.post('/group_id=:group_id/join-group', verify, async(req, res) => {
    const group_id = req.params.group_id;
    const result = await DB_group_member.joinGroup(group_id, req.user.USER_ID);
    return res.send(result);
})


router.post('/group_id=:group_id/leave-group', verify, async(req, res) => {
    const group_id = req.params.group_id;
    const result = await DB_group_member.leaveGroup(group_id, req.user.USER_ID);
    return res.send(result);
})


router.post('/group_id=:group_id/update-group-cover', verify, verifyAdmin, group_cover_upload.single('group_cover'), async(req, res) => {

    
    if(req.body.action === 'remove-group-cover'){
       
        if(res.locals.group.COVER_PHOTO === default_values.default_group_cover){
            res.send("Can't remove default cover");
            return;
        }
        await DB_group.updateGroupCover(req.params.group_id);
        res.send('success');
        return;
    }

    let file_path = undefined;
    if(!req.file){
        res.send('No file uploaded');
        return;
    }

    if(req.file) {
        file_path = req.file.path.replace(/\\/g, '/');
        file_path = file_path.substring(file_path.indexOf('/'));
    }

    await DB_group.updateGroupCover(req.params.group_id, file_path);
    res.send('success');
})

module.exports = router;