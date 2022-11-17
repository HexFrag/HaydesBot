
module.exports = class DataStore {

    mysql;
    config;
    pool;   
    RaiderPool;
    ExpLevelPool;
    
    static EventEmitter;
   

    OnRaiderPoolUpdated = "OnRaiderPoolUpdated";
    OnExistingRaiderFound = "OnExistingRaiderFound";
    OnNewRaiderFound = "OnNewRaiderFound";
    OnExpLevelPoolUpdated = "OnExpLevelPoolUpdated";
    OnNewExpLevelFound = "OnNewExpLevelFound";
    OnExistingExpLevelFound = "OnExistingExpLevelFound";

    TABLE_GxpRaiders = "GXP_Raiders";
    TABLE_GxpExpLevels = "GXP_Levels";

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
        this.EventEmitter.addListener(this.OnExpLevelPoolUpdated, this.prepareExpLevelData);
        this.EventEmitter.addListener(this.OnNewExpLevelFound, this.insertExpLevel);
        this.EventEmitter.addListener(this.OnExistingExpLevelFound, this.updateGxpLevel);
    }

    insertExpLevel(context)
    {
        let sql = `INSERT INTO GXP_Levels (Id, Name, ExperienceRequired ) VALUES (?)`;
        let params = [];
        params.push([
            data.Id,                 
            data.Name,            
            data.ExperienceRequired
        ]);

        context.query(sql, params);
    }

    updateGxpLevel(context)
    {

    }

    prepareExpLevelData(context)
    {
        console.log(`SQL Prep for ${context.ExpLevelPool.length} levels`);
            for(let i = 0; i < context.ExpLevelPool.length; i++)
                context.find(context.TABLE_GxpExpLevels, i, context);
    }

    

    prepareRaiderData(context)
    {        
        console.log(`SQL Prep for ${context.RaiderPool.length} raiders`);
        for(let i = 0; i < context.RaiderPool.length; i++)
            context.find(context.TABLE_GxpRaiders, i, context);
               
            
    }

    find(table ,index, context)
    {

        context.pool.getConnection(function(err, connection)
        {
            if (err) throw err;
            
            let item = context.RaiderPool[index];            

            let sql = `SELECT iid, Id FROM ${table} WHERE Id = ?`;
            connection.query(sql, item.Id, (err, result) => {
                connection.release();
                if(err) throw err;  
                if(result.length > 0)
                {
                    switch(table)
                    {
                        case context.TABLE_GxpRaiders:
                            console.log(`Existing ${table} ${item.Name} - ${item.Id}`);
                            context.EventEmitter.emit(context.OnExistingRaiderFound, result[0], context);
                        break;
                        case context.TABLE_GxpExpLevels:
                            console.log(`Existing ${table} ${item.Name} - ${item.Id}`);
                            context.EventEmitter.emit(context.OnExistingExpLevelFound, result[0], context);
                        break;
                    }
                    
                } 
                else
                {
                    switch(table)
                    {
                        case context.TABLE_GxpRaiders:
                            console.log(`New ${table} ${item.Name} - ${item.Id}`);
                            context.EventEmitter.emit(context.OnNewRaiderFound, item, context);
                        break;
                        case context.TABLE_GxpExpLevels:
                            console.log(`New ${table} ${item.Name} - ${item.Id}`);
                            context.EventEmitter.emit(context.OnNewExpLevelFound, item, context);
                        break;
                    }
                }
                    
            });
             
        });
    }

    requestRaiderUpdate(raiders)
    {       
        console.log(`SQL Update Requested with ${raiders.length} raiders`);
        this.RaiderPool = raiders; 
        this.EventEmitter.emit(this.OnRaiderPoolUpdated, this);
    }

    requestExpLevelUpdate(expLevels)
    {
        console.log(`SQL Update Requested with ${expLevels.length} Exp Levels`);
        this.ExpLevelPool = expLevels;
        this.EventEmitter.emit(this.OnExpLevelPoolUpdated, this);
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

    expLevelUpdate(context)
    {
        
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





