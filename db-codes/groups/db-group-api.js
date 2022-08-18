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
    const sql = `SELECT G.GROUP_ID, G.GROUP_NAME, G.GROUP_PRIVACY, G.COVER_PHOTO, (SELECT COUNT(*) FROM GROUP_MEMBERS G2 WHERE G2.GROUP_ID = G.GROUP_ID AND G2.STATUS <> 'PENDING' ) AS GROUP_MEMBER_COUNT
                FROM GROUPS G WHERE GROUP_ID = :group_id`;
    const binds = {
        group_id : group_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return result;
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

async function getGroupsForUser(user_id, search_data){

    let group_privacy_str = '', group_membership_str = '', group_name_str = '';
    
    // GROUP_PRIVACY
    if(search_data.group_privacy.length > 0) group_privacy_str = `AND G.group_privacy IN ('${search_data.group_privacy.join("','")}')`;
    
    // GROUP_MEMBERSHIP
    if(!(search_data.group_membership.length == 0 || search_data.group_membership.includes('all_groups'))) {
        let subquery = '';
        for(let i = 0; i <  search_data.group_membership.length; i++){
            if(search_data.group_membership[i] == 'member') subquery += `SELECT GROUP_ID FROM GROUP_MEMBERS WHERE USER_ID = :user_id AND (STATUS = 'MEMBER' OR STATUS = 'ADMIN')`;
            else if(search_data.group_membership[i] == 'pending') subquery += `SELECT GROUP_ID FROM GROUP_MEMBERS WHERE USER_ID = :user_id AND STATUS = 'PENDING' `
            else if(search_data.group_membership[i] == 'admin') subquery += `SELECT GROUP_ID FROM GROUP_MEMBERS WHERE USER_ID = :user_id AND STATUS = 'ADMIN' ` 

            if(i < search_data.group_membership.length - 1) subquery += 'UNION ';
        }

        group_membership_str = `AND G.GROUP_ID IN (${subquery})`;
    }

    if(search_data.search_term && search_data.search_term.length > 0) group_name_str = `AND UPPER(G.GROUP_NAME) LIKE UPPER('%${search_data.search_term}%')`;

    const sql = `SELECT G.GROUP_ID, G.GROUP_NAME, G.GROUP_PRIVACY, G.COVER_PHOTO, (SELECT COUNT(*) FROM GROUP_MEMBERS G2 WHERE G2.GROUP_ID = G.GROUP_ID AND G2.STATUS <> 'PENDING' ) AS GROUP_MEMBER_COUNT, GROUP_MEMBERSHIP_STATUS(G.GROUP_ID, :user_id) AS GROUP_MEMBERSHIP_STATUS
                FROM GROUPS G
                WHERE G.GROUP_ID > 100
                ${group_name_str}
                ${group_privacy_str}
                ${group_membership_str}

                `;
    const binds = {
        user_id : user_id
    };

    const result = (await database.execute(sql, binds)).rows;
    return result;


}

async function getGroupAbout(group_id){

    const sql = `SELECT GROUP_DESCRIPTION, TIME_OF_CREATION, (SELECT COUNT(*) AS POST_COUNT FROM POSTS P WHERE P.GROUP_ID = :group_id) AS POST_COUNT
                FROM GROUPS WHERE GROUP_ID = :group_id`;
    const binds = {
        group_id : group_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return result;
   

}


// export
module.exports = {
    createGroup,
    deleteGroup,
    getGroup,
    getGroupPrivacy,
    getGroupsForUser,
    getGroupAbout
}

