const Database = require('../database');
const database = new Database();



async function getJoinedGroups(user_id){
    const sql = `SELECT G.*, (SELECT COUNT(*) FROM GROUP G2 WHERE G2.GROUP_ID = G.GROUP_ID) AS GROUP_MEMBER_COUNT 
                FROM GROUPS G WHERE G.GROUP_ID IN (SELECT GROUP_ID FROM GROUP_MEMBERS WHERE USER_ID = :user_id AND STATUS <> 'PENDING')
                ORDER BY GROUP_MEMBER_COUNT DESC`;
    
    const binds = {
        user_id : user_id
    }
    const result = (await database.execute(sql, binds)).rows;
    return result;
}


async function getPendingGroups(user_id){
    const sql = `SELECT G.*, (SELECT COUNT(*) FROM GROUP G2 WHERE G2.GROUP_ID = G.GROUP_ID) AS GROUP_MEMBER_COUNT
                FROM GROUPS G WHERE G.GROUP_ID IN (SELECT GROUP_ID FROM GROUP_PENDING WHERE USER_ID = :user_id)`;
    const binds = {
        user_id : user_id
    }
    const result = (await database.execute(sql, binds)).rows;
    return result;
}


async function joinGroupRequest(group_id, user_id){
    const sql = `BEGIN
                    JOIN_GROUP(:group_id, :user_id, :result);
                END;`;
    const binds={
        group_id : group_id,
        user_id : user_id,
        result: {
            dir: oracledb.BIND_OUT, 
            type: oracledb.VARCHAR2
        }
    }
    return (await database.execute(sql, binds)).outBinds;
}


async function getGroupMembers(group_id, status = 'ADMIN', search_data = {}){

    let order_by = 'TIMESTAMP DESC', search_str = '', followings = '';
    // sortings
    if(search_data.sort_by == 'time_asc'){ order_by = 'TIMESTAMP ASC'; }
    if(search_data.sort_by == 'name'){ order_by = 'U.NAME';}
    if(search_data.sort_by == 'student_id'){ order_by = 'U.STUDENT_ID';}

    // string search
    if(search_data.search_term && search_data.search_term.length > 0) search_str = `AND (UPPER(U.NAME) LIKE UPPER('%${search_data.search_term}%') OR U.STUDENT_ID LIKE '%${search_data.search_term}%')`;

    // followings only
    if(search_data.followings && search_data.followings.includes('followings')) followings = `AND GM.USER_ID IN (SELECT FOLLOWEE_ID FROM FOLLOWS WHERE FOLLOWER_ID = ${search_data.user_id})`;

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

// export
module.exports = {
    getJoinedGroups,
    getPendingGroups,
    joinGroupRequest,
    getGroupMembers,
    processGroupMember,
    isAdmin,
    isMember
}

