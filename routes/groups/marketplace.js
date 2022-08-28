require('dotenv').config();
const router = require('express').Router();
const { verify } = require('../../middlewares/user-verification.js');
const utils = require('../../routerControllers/utils.js');
const constant_values = require('../../db-codes/constant_values.js');
const DB_marletplace = require('../../db-codes/groups/db-marketplace-api.js');




router.get('/', verify, async(req, res) => {

    
    res.locals.middle = [{type : "create-post", location : "posts/create_post"}]
    
    const search_data = {}
    if(req.query.group_post_search_term  || req.query.group_post_filter || req.query.group_post_sort_by ) {
        search_data.searched = true;
        search_data.search_term = req.query.group_post_search_term.trim();
        search_data.group_post_filter = utils.to_array(req.query.group_post_filter);
        search_data.sort_by = req.query.group_post_sort_by;
    }

    const posts = await DB_marletplace.getPosts(req.user.user_id, search_data);
    res.locals.middle.push({type : "posts", data : posts})

    

    res.render('index', {
        type : "group",
        currentUser : req.user,
        group: {GROUP_ID : constant_values.marketplace_group_id, GROUP_NAME : "Marketplace"},
        title :  "Halfwall | Marketplace",
        left : ['left-profile', 'sidebar'],
        right : [{location : 'marketplace-search', data : search_data}],
    });


})


module.exports = router;