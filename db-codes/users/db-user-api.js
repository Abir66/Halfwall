const Database = require('../database');
const database = new Database();
const DB_follow = require('../../db-codes/users/db-follow-api');



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
    const sql = `SELECT * FROM users
                WHERE student_id = :student_id`;
    const binds ={
        student_id : student_id
    };
    const result = (await database.execute(sql, binds)).rows;
    console.log("result : ", result)
    return result[0];
}


async function getUserById(user_id){
    const sql = `SELECT * FROM users
                WHERE user_id = :user_id`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    console.log("in middlewire, verified user - ", result[0])
    return result[0];
}

async function getUserByEmail(email){
    const sql = `SELECT * FROM users 
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

async function getUserProfilePosts(viewer_id, user_id, followed, sort_by = "TIMESTAMP DESC", search_term = "", search_filter){


    // filtering
    let groups;
    const group_ids = { public : 1, private : 2} 
    if(!search_filter || search_filter.length == 2){
        if(viewer_id == user_id || followed) groups = `${group_ids.public}, ${group_ids.private}`;
        else groups = `${group_ids.public}`;
    }

    else if(search_filter == "public") groups = `${group_ids.public}`;

    else{
        if(viewer_id == user_id || followed) groups = `${group_ids.private}`;
        else return [];
    }

    // sorting
    let order_by = "TIMESTAMP DESC";
    // HAVE TO IMPLEMENT A RANK FUNCTION LATER
    if(sort_by === "popularity") order_by = `LIKES_COUNT DESC, TIMESTAMP DESC`;

    // searching
    let search_str = "";
    if(search_term && search_term.length > 0) search_str = `AND (UPPER(TEXT) LIKE UPPER('%${search_term}%') OR UPPER(GET_USER_NAME(USER_ID)) LIKE UPPER('%${search_term}%'))`;
    

    const sql = `SELECT POSTS.*, GET_USER_NAME(USER_ID) "USERNAME", GET_USER_PROFILE_PIC(USER_ID) "PROFILE_PIC", LIKE_COUNT(POST_ID) "LIKES_COUNT",
                USER_LIKED_THIS_POST(:viewer_id, POST_ID) "USER_LIKED"
        
                FROM POSTS
                WHERE POSTS.USER_ID = :user_id AND POSTS.GROUP_ID IN (${groups}) ${search_str}
                ORDER BY ${order_by}`
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

module.exports = {
    getUserById,
    getUserByStudentId,
    getUserByEmail,
    insertUser,
    getPostCount,
    getUserProfilePosts,
    updateUser
}