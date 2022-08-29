const Database = require('../database');
const database = new Database();
const fs = require('fs')

async function storageCleanup(){

    const sql = `SELECT * FROM STORAGE_DUMP`;
    const binds = {};
    const files = (await database.execute(sql, binds)).rows;

    if(files.length == 0) return;

    const sql2 = `DELETE FROM STORAGE_DUMP`;
    const binds2 = {};
    (await database.execute(sql2, binds2)).rows;
    

    // delete files from storage
    files.forEach(async (file) => {
        fs.unlink('./public' + file.FILE_PATH, (err) => {
            if (err) { console.error(err); return;}
        })
    });

}


module.exports = {
    storageCleanup
};