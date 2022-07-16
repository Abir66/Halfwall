const Database = require('../database');
const database = new Database();


async function insertUser(user){
    const sql = `BEGIN
                    CREATE_USER(:user_id, :name, :email, :password, :department, 
                        :date_of_birth, :hall, :hall_attachment, :batch, 
                        :profile_picture, :street, :city, :post_code, :result);
                END;`;


    
    const binds={
        user_id : user.user_id,
        name : user.name,
        email : user.email,
        password : user.password,
        department : "css",
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

module.exports = {
    getUserById,
    getUserByEmail,
    insertUser
}