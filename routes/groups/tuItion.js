require('dotenv').config();
const router = require('express').Router();
const { verify } = require('../../middlewares/user-verification.js');
const utils = require('../../routerControllers/utils.js');
const constant_values = require('../../db-codes/constant_values.js');
const DB_tuition = require('../../db-codes/groups/db-tuition-api');


router.get('/:user_id?', verify, async(req, res) => {

   
    res.locals.middle = [{type : "create-post", location : "posts/create_post"}]
    
    const search_data = {}
    // if((req.query.marketplace_search_term && req.query.marketplace_search_term != "")
    //     || (req.query.marketplace_search_price_min && req.query.marketplace_search_price_min != "")
    //     || (req.query.marketplace_search_price_max && req.query.marketplace_search_price_max != "")
    //     || req.query.marketplace_condition
    //     || req.query.marketplace_available
    //     || req.query.marketplace_catagory
    //     || req.query.marketplace_sort_by) {
    //     search_data.searched = true;
    //     search_data.search_term = req.query.marketplace_search_term.trim();
    //     search_data.min_price = isNaN(req.query.marketplace_search_price_min.trim()) ? undefined : req.query.marketplace_search_price_min.trim();
    //     search_data.max_price = isNaN(req.query.marketplace_search_price_max.trim()) ? undefined : req.query.marketplace_search_price_max.trim();
    //     search_data.catagory = utils.to_array(req.query.marketplace_catagory);
    //     search_data.condition = req.query.marketplace_condition;
    //     search_data.available = req.query.marketplace_available;
    //     search_data.sort_by = req.query.marketplace_sort_by;
    // }

    if(req.params.user_id) {search_data.user_id = req.params.user_id;}

    

    const posts = await DB_tuition.getPosts(req.user.user_id, search_data);
   
    res.locals.middle.push({type : "posts", data : posts})
    res.render('index', {
        type : "group",
        currentUser : req.user,
        group: {GROUP_ID : constant_values.tuition_group_id, GROUP_NAME : "Tution"},
        title :  "Halfwall | Tution-e",
        left : ['left-profile', 'sidebar'],
        right : [],
    });


})


module.exports = router;