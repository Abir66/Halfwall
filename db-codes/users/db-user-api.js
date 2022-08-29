const Database = require('../database');
const database = new Database();
const DB_follow = require('../../db-codes/users/db-follow-api');
const default_values = require('../default_values');


async function insertUser(user){
    const sql = `BEGIN
                    CREATE_USER(:student_id, :name, :email, :password, :department, 
                        :date_of_birth, :hall, :hall_attachment, :batch, 
                        :profile_picture, :street, :city, :post_code, :result);
                END;`;

    const binds={
        student_id : user.student_id,
        name : user.name,
        email : user.email,
        password : user.password,
        department : user.department,
        date_of_birth : user.date_of_birth,
        hall : user.hall,
        hall_attachment : user.hall_attachment,
        batch : user.batch,
        profile_picture : user.profile_picture,
        street : user.street,
        city : user.city,
        post_code : user.post_code, 

        result: {
            dir: oracledb.BIND_OUT, 
            type: oracledb.VARCHAR2
        }
    }
    const result =  (await database.execute(sql, binds)).outBinds;
    return result.result;
}

async function getUserByStudentId(student_id){
    const sql = `SELECT USER_ID, STUDENT_ID, NAME, EMAIL, DEPARTMENT, 
                DATE_OF_BIRTH, HALL, HALL_ATTACHMENT, BATCH, 
                STREET, CITY, POSTCODE,
                NVL(PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC"
                FROM USERS
                WHERE student_id = :student_id`;
    const binds ={
        student_id : student_id
    };
    const result = (await database.execute(sql, binds)).rows;
    // console.log("result : ", result)
    return result[0];
}

async function checkPassword(user_id, password){
    const sql = `SELECT 1 FROM users
                WHERE user_id = :user_id
                AND password = :password`;
    const binds ={
        user_id : user_id,
        password : password
    };
    const result = (await database.execute(sql, binds)).rows;
    return result.length > 0;
}

async function getUserById(user_id){
    const sql = `SELECT USER_ID, STUDENT_ID, NAME, EMAIL, DEPARTMENT, 
                DATE_OF_BIRTH, HALL, HALL_ATTACHMENT, BATCH, 
                STREET, CITY, POSTCODE,
                NVL(PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC" 
                FROM users
                WHERE user_id = :user_id`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0];
}

async function getUserByEmail(email){
    const sql = `SELECT USER_ID, STUDENT_ID, NAME, EMAIL, DEPARTMENT, 
                DATE_OF_BIRTH, HALL, HALL_ATTACHMENT, BATCH, 
                STREET, CITY, POSTCODE,
                NVL(PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC" 
                FROM users 
                WHERE email = :email`;
    const binds ={
        email : email
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0];
}

async function getPostCount(user_id){
    const sql = `SELECT count(*) as post_count FROM posts 
                WHERE user_id = :user_id`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0];
}

async function getUserProfilePosts(viewer_id, user_id, followed, search_data, sort_by, search_term, search_filter){


    // filtering
    let groups;
    const group_ids = { public : 1, private : 2} 
    
    if(!search_data.search_filter || search_data.search_filter.length == 2 || search_data.search_filter.length == 0){
        if(viewer_id == user_id || followed) groups = `${group_ids.public}, ${group_ids.private}`;
        else groups = `${group_ids.public}`;
    }

    else if(search_data.search_filter && search_data.search_filter.length == 1 && search_data.search_filter[0] == "public") 
        groups = `${group_ids.public}`;

    else{
        if(viewer_id == user_id || followed) groups = `${group_ids.private}`;
        else return [];
    }

    // sorting
    let order_by = "P.TIMESTAMP DESC", search_term_str = "";
    // HAVE TO IMPLEMENT A RANK FUNCTION LATER
    if(search_data.sort_by === "popularity") order_by = `LIKES_COUNT DESC, P.TIMESTAMP DESC`;

    // searching
    if(search_data.search_term && search_data.search_term.length > 0) 
    search_term_str = `AND (UPPER(P.TEXT) LIKE UPPER('%${search_data.search_term}%') 
                            OR UPPER(U.NAME) LIKE UPPER('%${search_data.search_term}%')
                            OR UPPER(U.STUDENT_ID) = '${search_data.search_term}' )`;
    

    const sql = `SELECT P.POST_ID, P.USER_ID, P.GROUP_ID, P.TEXT, TO_CHAR(P.TIMESTAMP, 'HH:MM DD-MON-YYYY') "TIMESTAMP",
                INITCAP(U.NAME) "USERNAME", NVL(U.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC",
                LIKE_COUNT(P.POST_ID) "LIKES_COUNT", USER_LIKED_THIS_POST(:viewer_id, P.POST_ID) "USER_LIKED", COMMENT_COUNT(P.POST_ID) "COMMENT_COUNT",
	            CURSOR(SELECT FILE_TYPE, FILE_LOCATION FROM POST_FILES PF WHERE PF.POST_ID = P.POST_ID) "FILES"    
                FROM POSTS P LEFT JOIN USERS U ON P.USER_ID = U.USER_ID
                WHERE P.USER_ID = :user_id
                AND P.GROUP_ID IN (${groups}) ${search_term_str}
                ORDER BY ${order_by}`;
    
    const binds ={
        user_id : user_id,
        viewer_id : viewer_id
    };
    
    result = (await database.execute(sql,binds)).rows;
    return result;
}


async function updateUser(user, user_id){
    const sql =`BEGIN
                    UPDATE_USER(:user_id, :student_id, :name, :email, :password,
                        :date_of_birth,  :hall, :hall_attachment,
                         :street, :city, :postcode,:result
                        );
                end;`;
    const binds={
        user_id : user_id,
        student_id : user.student_id,
        name: user.name,
        email: user.email,
        password : user.password,
        date_of_birth : user.dof,
        hall : user.hall,
        hall_attachment : user.attachment,
        street : user.street,
        city : user.city,
        postcode : user.post_code,
        result: {
            dir: oracledb.BIND_OUT, 
            type: oracledb.VARCHAR2
        }
    }
    return (await database.execute(sql, binds)).outBinds;
}

async function searchProfile(search_data){

    const sql = `SELECT USER_ID, STUDENT_ID, NAME, PROFILE_PIC, DEPARTMENT
                FROM users
                WHERE ((UPPER(NAME) LIKE UPPER('%'||:search_input||'%')
                OR UPPER(EMAIL) LIKE UPPER('%'||:search_input||'%'))
                OR STUDENT_ID = :student_id)
                AND NVL(HALL, ' ') like UPPER('%'||:hall ||'%')
                AND NVL(HALL_ATTACHMENT, ' ') like UPPER('%'||:hall_attachment ||'%')
                AND NVL(DEPARTMENT, ' ') like UPPER('%'||:department ||'%')
                AND NVL(CITY, ' ') like UPPER('%'||:city ||'%')
                `;
    const binds ={
        search_input : search_data.search_input,
        student_id : search_data.student_id,
        hall : search_data.hall,
        hall_attachment : search_data.hall_attachment,
        // batch : search_data.batch,
        department : search_data.department,
        city : search_data.city
    };
    
    result = (await database.execute(sql,binds)).rows;
    return result;
}


async function getUserMiniData(user_id){
    const sql = `SELECT USER_ID, STUDENT_ID, INITCAP(NAME) "NAME", NVL(PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC"
                FROM users  
                WHERE USER_ID = :user_id`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0];
}

async function updateProfilePicture(user_id, profile_pic){
    console.log(user_id, profile_pic);
    const sql = `UPDATE users
                SET PROFILE_PIC = :profile_pic
                WHERE USER_ID = :user_id`;
    const binds ={
        user_id : user_id,
        profile_pic : profile_pic
    };
    return (await database.execute(sql, binds)).rows;
}

async function test(){

    const sql = `SELECT U.NAME, 
                
                CURSOR(SELECT * FROM FOLLOWS 
                WHERE FOLLOWER_ID = U.USER_ID) as "FOLLOWINGS"
                
                FROM USERS U`
    
    const binds ={};
    const result = (await database.execute(sql, binds)).rows;

    console.dir(result, {depth : null});
}

module.exports = {
    getUserById,
    getUserByStudentId,
    getUserByEmail,
    insertUser,
    searchProfile,
    getPostCount,
    getUserProfilePosts,
    updateUser,
    getUserMiniData,
    test,
    checkPassword,
    updateProfilePicture
}