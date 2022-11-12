module.exports = class GxpController {

    Request;

    RAIDER_URL = 'https://jbm6m3eptm.us-east-1.awsapprunner.com/raiders/?active=true';

    RaiderPages;
    Raiders;   
    Store; 
    
    static IsUpdating = false;
    static ExitUpdate = false;
    static WaitCount = 0;
    static DataStore;

    constructor(config)
    {
        const { request } = require('undici');
        const DataStore = require('./DataStore.js');
        this.Request = request
        this.RaiderPages = [];
        this.Raiders = [];
        this.Store = new DataStore(config.mysql);        
    }

    getRaiderPages()
    {
        return this.RaiderPages;
    }

    async updateRaidersGxp(url)
    {
        
        this.IsUpdating = true;

        if(url === null)
        {
            console.log("Started GXP Update");
            url = this.RAIDER_URL;        
            this.RaiderPages = [];
        }
            

        let requestResult = await this.Request(url);
        let raiderObj = await requestResult.body.json();        
        this.RaiderPages.push(raiderObj);

        if(raiderObj.next !== null && raiderObj.next.length > 0)  
            return await this.updateRaidersGxp(raiderObj.next);

        this.IsUpdating = false;
        console.log("Ended GXP Update");
    }

    async updateRaidersMySql(dataStore)
    {   
        console.log("Starting MySQL Update");

        this.WaitCount = 0;

        while(this.IsUpdating === true && this.ExitUpdate === false)
        {
            await new Promise(r => setTimeout(r, 1000));
            this.WaitCount++;
            if(this.WaitCount > 30) //30sec
                this.ExitUpdate = true;
            if(this.ExitUpdate && this.RaiderPages.length == 0)
                console.log("GXP Update timed out at 30s server is down");
            else if(this.RaiderPages.length > 0)
                console.log("GXP Update timed out at 30s server is slow, data may be missing");
        }


        //console.log(this.RaiderPages)

        this.RaiderPages.forEach(async (item, index) => {
            item.results.forEach(async (i, x) => {
                let data = {
                    Id: i.id,
                    Name: i.name,
                    JoinDate: i.join_timestamp,
                    TotalWeeks: i.totalWeeks,
                    Experience: i.experience,
                    CurrentRank: i.experienceLevel.name,
                    Active: i.active
                };
                
                await this.Store.updateRaider(data);
            });
        });

        console.log("Finished MySQL Update");
    }
}