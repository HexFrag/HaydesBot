
module.exports = class DataStore {

    mysql;
    config;
    pool;

    constructor(config, mysql){
        this.config = config;
        this.mysql = mysql;

        this.pool = this.mysql.createPool(config);
        
    }

    query(sql)
    {
        this.pool.getConnection(function(err)
        {
            if (err) throw err;
            console.log("Connected " + this.conn.threadId);
            conn.query(sql, (err, result) => {
                connection.release();
                if(err) throw err;   
                
                return result;
            })
        });
    }

}





