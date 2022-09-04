require('dotenv').config();
const router = require('express').Router();
const { verify } = require('../../middlewares/user-verification.js');
const utils = require('../../routerControllers/utils.js');
const constant_values = require('../../db-codes/constant_values.js');
const DB_public_forum = require('../../db-codes/groups/db-public-forum-api');
const DB_user = require('../../db-codes/users/db-user-api');

router.get('/:user_id?', verify, async(req, res) => {

    
   
    res.locals.middle = [{type : "create-post", location : "posts/create_post"}]
    
    const search_data = {}
    
    if(req.query.public_forum_search_term || req.query.public_forum_sort_by){
        search_data.searched = true;
        search_data.search_term = req.query.public_forum_search_term.trim();
        search_data.sort_by = req.query.public_forum_sort_by;
    }

    if(req.params.user_id) {
        search_data.user_id = req.params.user_id;
        res.locals.user = await DB_user.getUserById(req.params.user_id);

        if(!res.locals.user){
            res.status(404).send('user not found');
            return;
        }
        res.locals.middle.push({type : "group_user_profile", location : "groups/group-user-profile"});
        res.locals.isAdmin = undefined;
    }

    

    const posts = await DB_public_forum.getPosts(req.user.USER_ID, search_data);
    res.locals.middle.push({type : "posts", data : posts})

    

    res.render('index', {
        type : "public-forum",
        currentUser : req.user,
        group: {GROUP_ID : constant_values.public_forum_group_id, GROUP_NAME : "Public Forum"},
        title :  "Halfwall | Public Forum",
        left : ['left-profile', 'sidebar'],
        right : [{location : 'public-forum-search', data : search_data}],
    });


})


module.exports = router;