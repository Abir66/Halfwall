require('dotenv').config();
const jwt = require('jsonwebtoken');
const DB_user = require('../db-codes/users/db-user-api');
const DB_group = require('../db-codes/groups/db-group-api');
const DB_group_member = require('../db-codes/groups/db-group-member-api');

async function group_header(req,res,next){
    
    const group_id = req.params.group_id;
    const group = await DB_group.getGroup(req.params.group_id);

    if(!group){
        res.status(404).send('Group not found');
        return;
    }

    const isMember = await DB_group_member.isMember(group_id, req.user.USER_ID);
    const isAdmin = await DB_group_member.isAdmin(group_id, req.user.USER_ID);
    const isPending = await DB_group_member.isPending(group_id, req.user.USER_ID);

    // const group_membership = await DB_group_member.getGroupMembership(group_id, req.user.USER_ID);
    // if(group_membership === 'ADMIN') {res.locals.isAdmin = true; res.locals.isMember = true;}
    // else if(group_membership === 'MEMBER') {res.locals.isMember = true;}
    // else if(group_membership === 'PENDING') {res.locals.isPending = true;}

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