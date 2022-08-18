require('dotenv').config();
const jwt = require('jsonwebtoken');
const DB_user = require('../db-codes/users/db-user-api');
const DB_group = require('../db-codes/groups/db-group-api');
const DB_group_member = require('../db-codes/groups/db-group-member-api');

async function group_header(req,res,next){
    
    const group_id = req.params.group_id;
    const group = await DB_group.getGroup(req.params.group_id);
    const isMember = await DB_group_member.isMember(group_id, req.user.USER_ID);
    const isAdmin = await DB_group_member.isAdmin(group_id, req.user.USER_ID);

    res.locals.group = group;
    res.locals.isMember = isMember;
    res.locals.isAdmin = isAdmin;

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