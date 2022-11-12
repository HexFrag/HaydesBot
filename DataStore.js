
module.exports = class DataStore {

    mysql;
    config;
    pool;
   

    

    constructor(config){
        this.config = config;
        const mysql = require('mysql');
        this.mysql = mysql;       
        this.pool = this.mysql.createPool(config);        
    }

    async query(sql)
    {
        this.pool.getConnection(async function(err, connection)
        {
            if (err) throw err;
            //console.log("Connected " + connection.threadId);
            await connection.query(sql, (err, result) => {
                connection.release();
                if(err) throw err;   
                
                return result;
            })
        });
    }

    async updateRaider(data)
    {
        let sql = `SELECT iid FROM GXP_Raiders WHERE id = '${data.Id}'`;
        let iid = await this.query(sql);
        if(iid === undefined || iid === 0)
        {
            let smallts = Math.floor(data.JoinDate / 1000);
            sql = `INSERT INTO GXP_Raiders (Id, Name, JoinDate, TotalWeeks, Experience, CurrentRank, Active) VALUES ('${data.Id}', '${data.Name}', FROM_UNIXTIME(${smallts}), ${data.TotalWeeks}, '${data.Experience}', '${data.CurrentRank}', ${data.Active ? 1 : 0})`;
            await this.query(sql);
        }
        else
        {
            let smallts = Math.floor(data.JoinDate / 1000);
            sql = `UPDATE GXP_Raiders SET Name = '${data.Name}', JoinDate = FROM_UNIXTIME(${smallts}), TotalWeeks = '${data.TotalWeeks}', Experience = '${data.Experience}', CurrentRank = '${data.CurrentRank}', Active = '${data.Active}' WHERE iid = ${iid}`;
            await this.query(sql);
        } 
    }
}





