const Database = require('../database');
const database = new Database();


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
    console.log("result : ", result)
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
    console.log("result : ", result)
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

async function getFollowerCount(user_id){
    const sql = `SELECT count(*) as follower_count FROM follows 
                WHERE followee_id = :user_id`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0];
}

async function getFollowingCount(user_id){
    const sql = `SELECT count(*) as following_count FROM follows 
                WHERE follower_id = :user_id`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0];
}

async function followedUser(follower_id, followee_id){
    const sql = `SELECT * FROM follows
                WHERE follower_id = :follower_id AND followee_id = :followee_id`;
    const binds ={
        follower_id : follower_id,
        followee_id : followee_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0];
}

async function getUserProfilePosts(user_id){

    const sql = `SELECT *
                FROM POSTS
                WHERE USER_ID = :user_id
                ORDER BY TIMESTAMP DESC `;
    const binds ={
        user_id : user_id
    };
                // posts
    // will have to add likes, dislikes and comments later
    result = (await database.execute(sql,binds)).rows;
    console.log("db profile api js :", result);
    return result;
}


module.exports = {
    getUserById,
    getUserByStudentId,
    getUserByEmail,
    insertUser,
    getPostCount,
    getFollowerCount,
    getFollowingCount,
    getUserProfilePosts,
    followedUser
}