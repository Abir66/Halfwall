require('dotenv').config();
const router = require('express').Router();
const { verify } = require('../../middlewares/user-verification.js');
const utils = require('../../routerControllers/utils.js');
const constant_values = require('../../db-codes/constant_values.js');
const DB_tuition = require('../../db-codes/groups/db-tuition-api');
const DB_user = require('../../db-codes/users/db-user-api');


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

    

    const posts = await DB_tuition.getPosts(req.user.user_id, search_data);
    
   
    res.locals.middle.push({type : "posts", data : posts})
    
    res.render('index', {
        type : "group",
        currentUser : req.user,
        location : search_data.location,
        group: {GROUP_ID : constant_values.tuition_group_id, GROUP_NAME : "Tuition"},
        title :  "Halfwall | Tuition-e",
        left : ['left-profile', 'sidebar'],
        right : [{location : 'tuition-notification', data : {}},{location : 'tuition-search', data : search_data}],
    });


})


router.get('/notification/user-notification-data', verify, async(req, res) => {

    
    const notification_data = await DB_tuition.getTuitionNotificationData(req.user.USER_ID);
    notification_data.result = 'success';
    console.log(notification_data);
    res.send(notification_data);

})


router.post('/notification/save-tuition-notification' , verify, async(req, res) => {

    console.log(req.body);
    const notification_data = await DB_tuition.saveNotificationData(req.user.USER_ID, req.body);

})

module.exports = router;