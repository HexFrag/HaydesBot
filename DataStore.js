
module.exports = class DataStore {

    mysql;
    config;
    pool;   
    RaiderPool;
    
    static EventEmitter;
   

    OnRaiderPoolUpdated = "OnRaiderPoolUpdated";
    OnExistingRaiderFound = "OnExistingRaiderFound";
    OnNewRaiderFound = "OnNewRaiderFound";

    constructor(config){
        this.config = config; 
        const Events = require('events');
        this.EventEmitter = new Events.EventEmitter();    
        const mysql = require('mysql');
        this.mysql = mysql;       
        this.pool = this.mysql.createPool(config); 
        
        this.EventEmitter.addListener(this.OnRaiderPoolUpdated, this.prepareRaiderData);
        this.EventEmitter.addListener(this.OnExistingRaiderFound, this.updateRaider);
        this.EventEmitter.addListener(this.OnNewRaiderFound, this.insertRaider);
    }

    prepareRaiderData(context)
    {        
        console.log(`SQL Prep for ${context.RaiderPool.length} raiders`);
        for(let i = 0; i < context.RaiderPool.length; i++)
            context.findRaider(i, context);
               
            
    }

    findRaider(index, context)
    {

        this.pool.getConnection(function(err, connection)
        {
            if (err) throw err;
            
            let raider = context.RaiderPool[index];            

            let sql = `SELECT iid, Id FROM GXP_Raiders WHERE Id = ?`;
            connection.query(sql, raider.Id, (err, result) => {
                connection.release();
                if(err) throw err;  
                if(result.length > 0)
                {
                    console.log(`Existing Raider ${raider.Name} - ${raider.Id}`);
                    context.EventEmitter.emit(context.OnExistingRaiderFound, result[0], context);
                } 
                else
                {
                    console.log(`New Raider ${raider.Name} - ${raider.Id}`);
                    context.EventEmitter.emit(context.OnNewRaiderFound, raider, context);
                }
                    
            });
             
        });
    }

    requestUpdate(raiders)
    {       
        console.log(`SQL Update Requested with ${raiders.length} raiders`);
        this.RaiderPool = raiders; 
        this.EventEmitter.emit(this.OnRaiderPoolUpdated, this);
    }

    
    query(sql, params)
    {
        this.pool.getConnection(function(err, connection)
        {
            if (err) throw err;

            connection.query(sql, params, (err, result) => {
                connection.release();
                if(err) throw err;                              
                //console.log(result);
            });
             
        });
    }


    insertRaider(data, context)
    {
        let sql = `INSERT INTO GXP_Raiders (Id, Name, TotalWeeks, TotalRaids, Experience, CurrentRank, Active) VALUES (?)`;//(?, ?, FROM_UNIXTIME(?), ?, ?, ?, ?)
        let params = [];
        params.push([
            data.Id,                 
            data.Name,            
            data.TotalWeeks,
            data.TotalRaids,
            data.Experience,
            data.CurrentRank,
            (data.Active ? 1 : 0)
        ]);

        context.query(sql, params);
    }

    updateRaider(metaData, context)
    {   
        let raiderData = context.RaiderPool.filter(v => v.Id == metaData.Id)[0];
        let sql = `UPDATE GXP_Raiders 
                    SET 
                    Name = ${context.mysql.escape(raiderData.Name)},
                    TotalWeeks = ${raiderData.TotalWeeks},
                    TotalRaids = ${raiderData.TotalRaids}, 
                    Experience = ${raiderData.Experience}, 
                    CurrentRank = '${raiderData.CurrentRank}', 
                    Active = ${(raiderData.Active ? 1 : 0)} 
                    WHERE iid = ${metaData.iid}`;

        //strange errors something is not right with data.
        /*let params = [];                          
        params.push([
            raiderData.Name,            
            raiderData.TotalWeeks,
            raiderData.Experience,
            raiderData.CurrentRank,
            (raiderData.Active ? 1 : 0),
            metaData.iid
        ]);*/

        context.query(sql, null);
    }

    processInfoRequest(name, channel, callback)
    {
        this.pool.getConnection(function(err, connection)
        {
            if (err) throw err;

            let sql = `SELECT Name, TotalWeeks, TotalRaids, Experience, CurrentRank FROM GXP_Raiders WHERE Name = ?`;
            connection.query(sql, name, (err, result) => {
                connection.release();
                if(err) throw err;  
                
                callback(result[0], channel);
                    
            });
             
        });
    }

    
}





