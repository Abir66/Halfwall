const Database = require('../database');
const database = new Database();



async function getGroupMembers(group_id, status = 'ADMIN', search_data = {}){

    let order_by = 'TIMESTAMP DESC', search_str = '', followings = '';
    // sortings
    if(search_data.sort_by == 'time_asc'){ order_by = 'TIMESTAMP ASC'; }
    if(search_data.sort_by == 'name'){ order_by = 'U.NAME';}
    if(search_data.sort_by == 'student_id'){ order_by = 'U.STUDENT_ID';}

    // string search
    if(search_data.search_term && search_data.search_term.length > 0) search_str = `AND (UPPER(U.NAME) LIKE UPPER('%${search_data.search_term}%') OR U.STUDENT_ID LIKE '%${search_data.search_term}%')`;

    // followings only
    if(search_data.member_filter && search_data.member_filter.includes('followings')) followings = `AND GM.USER_ID IN (SELECT FOLLOWEE_ID FROM FOLLOWS WHERE FOLLOWER_ID = ${search_data.user_id})`;

    const sql = `SELECT U.USER_ID, U.STUDENT_ID, U.NAME, U.PROFILE_PIC, GM.TIMESTAMP
                FROM GROUP_MEMBERS GM JOIN USERS U on GM.USER_ID = U.USER_ID
                WHERE GM.GROUP_ID = :group_id
                AND GM.STATUS = UPPER(:status)
                ${search_str} ${followings}
                ORDER BY ${order_by}`;
    const binds = {
        group_id : group_id,
        status : status
    }
    const result = (await database.execute(sql, binds)).rows;
    return result;
}

async function joinGroup(group_id, user_id){
    const sql = `INSERT INTO GROUP_MEMBERS (GROUP_ID, USER_ID, STATUS, TIMESTAMP) VALUES (:group_id, :user_id, 'PENDING', CURRENT_TIMESTAMP)`;
    const binds = {
        group_id : group_id,
        user_id : user_id
    }

    try{
        await database.execute(sql, binds)
        return 'success';
    }
    catch(err){
        return 'Something went wrong';
    }
}

async function leaveGroup(group_id, user_id){
    const sql = `BEGIN
                    LEAVE_GROUP(:group_id, :user_id, :result);
                END;`;
    const binds = {
        group_id : group_id,
        user_id : user_id,
        result : {type : oracledb.VARCHAR2, dir : oracledb.BIND_OUT}
    }
    const result = (await database.execute(sql, binds)).outBinds;
    console.log(result);
    return result.result;
}


async function processGroupMember(group_id, admin_id, user_id, action){

    const sql = `BEGIN
                    PROCESS_GROUP_MEMBER(:group_id, :admin_id, :user_id, :action, :result);
                END;`;
    const binds={
        group_id : group_id,
        admin_id : admin_id,
        user_id : user_id,
        action : action,
        result: {
            dir: oracledb.BIND_OUT,
            type: oracledb.VARCHAR2
        }
    }
    const result = (await database.execute(sql, binds)).outBinds;
    console.log(result);
    return result;

}

async function isAdmin(group_id, user_id){
    const sql = `SELECT STATUS FROM GROUP_MEMBERS WHERE GROUP_ID = :group_id AND USER_ID = :user_id`;
    const binds = {
        group_id : group_id,
        user_id : user_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return result && result.STATUS == 'ADMIN';
}

async function isMember(group_id, user_id){
    const sql = `SELECT STATUS FROM GROUP_MEMBERS WHERE GROUP_ID = :group_id AND USER_ID = :user_id`;
    const binds = {
        group_id : group_id,
        user_id : user_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return (result && (result.STATUS == 'MEMBER' || result.STATUS == 'ADMIN'));
}

async function isPending(group_id, user_id){
    const sql = `SELECT STATUS FROM GROUP_MEMBERS WHERE GROUP_ID = :group_id AND USER_ID = :user_id`;
    const binds = {
        group_id : group_id,
        user_id : user_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return result && result.STATUS == 'PENDING';
}

async function getGroupMembership(group_id, user_id){
    const sql = `SELECT STATUS FROM GROUP_MEMBERS WHERE GROUP_ID = :group_id AND USER_ID = :user_id`;
    const binds = {
        group_id : group_id,
        user_id : user_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return result && result.STATUS;
}

async function getMemberinGroup(group_id, user_id){

    const sql = `SELECT U.USER_ID, INITCAP(U.NAME) "NAME", U.STUDENT_ID, U.PROFILE_PIC, GM.STATUS, TO_CHAR(GM.TIMESTAMP, 'DD-MON-YYYY') "TIMESTAMP"
                FROM USERS U JOIN GROUP_MEMBERS GM ON U.USER_ID = GM.USER_ID
                WHERE U.USER_ID = :user_id AND GM.GROUP_ID = :group_id `;
    const binds = {
        group_id : group_id,
        user_id : user_id
    }

    const result = (await database.execute(sql, binds)).rows[0];
    return result;
}



// export
module.exports = {
    getGroupMembers,
    processGroupMember,
    getGroupMembership,
    isAdmin,
    isMember,
    isPending,
    getMemberinGroup,
    joinGroup,
    leaveGroup
}

