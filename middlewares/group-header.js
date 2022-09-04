require('dotenv').config();
const jwt = require('jsonwebtoken');
const DB_user = require('../db-codes/users/db-user-api');
const DB_group = require('../db-codes/groups/db-group-api');
const DB_group_member = require('../db-codes/groups/db-group-member-api');
const constant_values = require('../db-codes/constant_values');

async function group_header(req,res,next){
    
    const group_id = req.params.group_id;

    if(group_id == constant_values.marketplace_group_id){
        res.redirect('/marketplace/' + req.params.user_id);
        return;
    }

    if(group_id == constant_values.tuition_group_id){
        res.redirect('/tuition/' + req.params.user_id);
        return;
    }

    const group = await DB_group.getGroup(req.params.group_id);

    if(!group){
        res.status(404).send('Group not found');
        return;
    }


    const isMember = await DB_group_member.isMember(group_id, req.user.USER_ID);
    const isAdmin = await DB_group_member.isAdmin(group_id, req.user.USER_ID);
    const isPending = await DB_group_member.isPending(group_id, req.user.USER_ID);

    res.locals.group = group;
    res.locals.isMember = isMember;
    res.locals.isAdmin = isAdmin;
    res.locals.isPending = isPending;

    res.locals.middle = []
    res.locals.middle.push({
        type : 'group-header',
        location : 'groups/group-header',
        data : {}
    });

    next()
}


module.exports = {
    group_header
}