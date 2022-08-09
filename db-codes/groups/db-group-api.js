const Database = require('../database');
const database = new Database();


async function createGroup(group, admin_id){
    const sql = `BEGIN
                    CREATE_GROUP(:group_name, :admin_id, :description, :cover_photo, :privacy, :result);
                END;`;
    const binds={
        group_name : group.name,
        privacy : group.privacy,
        description : group.description,
        cover_photo: group.cover_photo,
        admin_id : admin_id,
        result: {
            dir: oracledb.BIND_OUT, 
            type: oracledb.VARCHAR2
        }
    }
    const result =  (await database.execute(sql, binds)).outBinds;
    return result.result;
}


async function deleteGroup(group_id){
    const sql = `DELETE FROM GROUPS WHERE GROUP_ID = :group_id`;
    const binds = {
        group_id : group_id
    }
    await database.execute(sql, binds);
}


// get group by group id
async function getGroup(group_id){
    const sql = `SELECT G.GROUP_ID, G.GROUP_NAME, G.GROUP_PRIVACY, G.COVER_PHOTO, (SELECT COUNT(*) FROM GROUP_MEMBERS G2 WHERE G2.GROUP_ID = G.GROUP_ID ) AS GROUP_MEMBER_COUNT
                FROM GROUPS G WHERE GROUP_ID = :group_id`;
    const binds = {
        group_id : group_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return result;
}


async function isAdmin(group_id, user_id){
    const sql = `SELECT COUNT(*) AS ROW_COUNT FROM GROUP_ADMINS WHERE GROUP_ID = :group_id AND USER_ID = :user_id`;
    const binds = {
        group_id : group_id,
        user_id : user_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return result.ROW_COUNT > 0;
}

async function isMember(group_id, user_id){
    const sql = `SELECT COUNT(*) AS ROW_COUNT FROM GROUP_MEMBERS WHERE GROUP_ID = :group_id AND USER_ID = :user_id`;
    const binds = {
        group_id : group_id,
        user_id : user_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return result.ROW_COUNT > 0;
}

// get group privacy
async function getGroupPrivacy(group_id){
    const sql = `SELECT GROUP_PRIVACY FROM GROUPS WHERE GROUP_ID = :group_id`;
    const binds = {
        group_id : group_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return result.GROUP_PRIVACY;
}




// export
module.exports = {
    createGroup,
    deleteGroup,
    getGroup,
    isAdmin,
    isMember,
    getGroupPrivacy
}

