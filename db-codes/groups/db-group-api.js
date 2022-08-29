const Database = require('../database');
const database = new Database();

// require defaults
const default_values = require('../default_values');


async function createGroup(group, admin_id){
    const sql = `BEGIN
                    CREATE_GROUP(:group_name, :admin_id, :description, :cover_photo, :privacy, :result, :group_id);
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
        },
        group_id: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER
        }
    }
    console.log(binds);
    const result =  (await database.execute(sql, binds)).outBinds;
    return result;
}

async function updateGroup(group){
    const sql = `UPDATE GROUPS SET 
                GROUP_NAME = :group_name, 
                GROUP_PRIVACY = :group_privacy, 
                GROUP_DESCRIPTION = :group_description, 
                COVER_PHOTO = :cover_photo 
                WHERE GROUP_ID = :group_id`;
    const binds = {
        group_name : group.name,
        group_privacy : group.privacy,
        group_description : group.description,
        cover_photo : group.cover_photo,
        group_id : group.group_id
    }

    await database.execute(sql, binds);
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
    const sql = `SELECT G.GROUP_ID, G.GROUP_NAME, G.GROUP_PRIVACY, NVL(G.COVER_PHOTO, '${default_values.default_group_cover}') "COVER_PHOTO", (SELECT COUNT(*) FROM GROUP_MEMBERS G2 WHERE G2.GROUP_ID = G.GROUP_ID AND G2.STATUS <> 'PENDING' ) AS GROUP_MEMBER_COUNT
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

    const sql = `SELECT G.GROUP_ID, G.GROUP_NAME, G.GROUP_PRIVACY,  NVL(G.COVER_PHOTO, '${default_values.default_group_cover}') "COVER_PHOTO", (SELECT COUNT(*) FROM GROUP_MEMBERS G2 WHERE G2.GROUP_ID = G.GROUP_ID AND G2.STATUS <> 'PENDING' ) AS GROUP_MEMBER_COUNT, GROUP_MEMBERSHIP_STATUS(G.GROUP_ID, :user_id) AS GROUP_MEMBERSHIP_STATUS
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

    const sql = `SELECT GROUP_ID, GROUP_NAME, GROUP_PRIVACY,
                GROUP_DESCRIPTION, TO_CHAR(TIME_OF_CREATION, 'HH:MM DD-MON-YYYY') "TIME_OF_CREATION",
                NVL(COVER_PHOTO, '${default_values.default_group_cover}') "COVER_PHOTO",
                (SELECT COUNT(*) AS POST_COUNT FROM POSTS P WHERE P.GROUP_ID = :group_id) AS POST_COUNT
                FROM GROUPS WHERE GROUP_ID = :group_id`;
    const binds = {
        group_id : group_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return result;
   

}

async function getGroupPosts(group_id, user_id, search_data = {}){

    let orderby = '', search_term_str = '', admin_posts = '', followings = '', post_user = ''
    
    // sorting
    orderby = ` ORDER BY P.TIMESTAMP DESC`;
    if(search_data.sort_by == 'popularity') orderby = ` ORDER BY LIKES_COUNT DESC`;

    if(search_data.search_term && search_data.search_term.length > 0) 
        search_term_str = `AND (UPPER(P.TEXT) LIKE UPPER('%${search_data.search_term}%') 
                            OR UPPER(U.NAME) LIKE UPPER('%${search_data.search_term}%')
                            OR UPPER(U.STUDENT_ID) = '${search_data.search_term}' )`;
    
    if(search_data.group_post_filter && search_data.group_post_filter.includes('admin_posts'))
        admin_posts = ` AND P.USER_ID IN (SELECT USER_ID FROM GROUP_MEMBERS WHERE GROUP_ID = :group_id AND STATUS = 'ADMIN')`;

    if(search_data.group_post_filter && search_data.group_post_filter.includes('followings'))
        followings = ` AND P.USER_ID IN (SELECT FOLLOWEE_ID FROM FOLLOWS WHERE FOLLOWER_ID = :user_id)`;

    if(search_data.post_user_id){
        post_user = ` AND P.USER_ID = ${search_data.post_user_id}`;
        admin_posts = '';
        followings = '';
    }
    
    const sql = `SELECT P.POST_ID, P.USER_ID, P.GROUP_ID, P.TEXT, TO_CHAR(P.TIMESTAMP, 'HH:MM DD-MON-YYYY') "TIMESTAMP",
                INITCAP(U.NAME) "USERNAME", NVL(U.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC",
                LIKE_COUNT(P.POST_ID) "LIKES_COUNT", USER_LIKED_THIS_POST(:user_id, P.POST_ID) "USER_LIKED",
                COMMENT_COUNT(P.POST_ID) "COMMENT_COUNT",
                G.GROUP_ID, G.GROUP_NAME, G.GROUP_PRIVACY,
                CURSOR(SELECT FILE_TYPE, FILE_LOCATION FROM POST_FILES PF WHERE PF.POST_ID = P.POST_ID) "FILES"
                FROM POSTS P LEFT JOIN USERS U ON P.USER_ID = U.USER_ID LEFT JOIN GROUPS G ON P.GROUP_ID = G.GROUP_ID
                WHERE P.GROUP_ID = :group_id
                ${post_user}
                ${admin_posts}
                ${followings}
                ${search_term_str}
                ${orderby}
                `;

    const binds ={
        group_id : group_id,
        user_id : user_id
    };

    result = (await database.execute(sql,binds)).rows;
    return result;
}


async function updateGroupCover(group_id, cover_photo){
    console.log(group_id, cover_photo);
    const sql = `UPDATE GROUPS 
                SET COVER_PHOTO = :cover_photo 
                WHERE GROUP_ID = :group_id`;
    const binds = {
        group_id : group_id,
        cover_photo : cover_photo
    }

    
    const result = (await database.execute(sql, binds)).rows;
    return result;
}


// export
module.exports = {
    createGroup,
    deleteGroup,
    getGroup,
    getGroupPrivacy,
    getGroupsForUser,
    getGroupAbout,
    getGroupPosts,
    updateGroup,
    updateGroupCover
}

