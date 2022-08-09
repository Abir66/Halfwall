const Database = require('../database');
const database = new Database();



async function getJoinedGroups(user_id){
    const sql = `SELECT G.*, (SELECT COUNT(*) FROM GROUP G2 WHERE G2.GROUP_ID = G.GROUP_ID) AS GROUP_MEMBER_COUNT 
                FROM GROUPS G WHERE G.GROUP_ID IN (SELECT GROUP_ID FROM GROUP_MEMBERS WHERE USER_ID = :user_id)
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


async function processPendingGroupmEMBER(group_id, user_id, action){
    const sql = `BEGIN
                    PROCESS_PENDING_GROUP_MEMBER(:group_id, :user_id, :action, :result);
                END;`;
    const binds={
        group_id : group_id,
        user_id : user_id,
        action : action,
        result: {
            dir: oracledb.BIND_OUT,
            type: oracledb.VARCHAR2
        }
    }
    return (await database.execute(sql, binds)).outBinds;
}


async function getGroupMembers(group_id){
    const sql = `SELECT U.USER_ID, U.STUDENT_ID, U.NAME, U.PROFILE_PIC
                FROM USERS U WHERE U.USER_ID IN (SELECT USER_ID FROM GROUP_MEMBERS WHERE GROUP_ID = :group_id)`;
    const binds = {
        group_id : group_id
    }
    const result = (await database.execute(sql, binds)).rows;
    console.log(result);
    return result;
}





// export
module.exports = {
    getJoinedGroups,
    getPendingGroups,
    joinGroupRequest,
    processPendingGroupmEMBER,
    getGroupMembers

}

