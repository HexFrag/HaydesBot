module.exports = class GxpController {

    Request;

    RAIDER_URL = 'https://jbm6m3eptm.us-east-1.awsapprunner.com/raiders/';

    RaiderPages = [];
    Raiders = [];   
    Store; 
    EventEmitter;  
    
    OnGxpUpdated = "OnGxpUpdated";
    

    

    constructor(config)
    {
        const { request } = require('undici');
        const DataStore = require('./DataStore.js');
        const Events = require('events');
        this.EventEmitter = new Events.EventEmitter();
        this.Request = request
        this.RaiderPages = [];
        this.Raiders = [];
        this.Store = new DataStore(config.mysql);
        
    }

    async requestGxpUpdate()
    {
        this.EventEmitter.addListener(this.OnGxpUpdated, this.consolidateRaiderData);
        await this.updateRaidersGxp(null);
    }
    

    async updateRaidersGxp(url)
    {
        if(url === null)
        {
            console.log("Started GXP Update");
            url = this.RAIDER_URL;        
            this.RaiderPages = [];
        }
            

        let requestResult = await this.Request(url);
        let raiderObj = await requestResult.body.json();        
        this.RaiderPages.push(raiderObj);

        if(raiderObj.next)  
            return await this.updateRaidersGxp(raiderObj.next);

        console.log(`Ended GXP Update with ${this.RaiderPages.length} pages`);        
        this.EventEmitter.emit(this.OnGxpUpdated, this);
        
        
    }

    consolidateRaiderData(context)
    {   
        console.log(`Starting consolidateRaiderData with ${context.RaiderPages.length} pages`);

        const raiders = [];

        for(let x = 0; x < context.RaiderPages.length; x++)
        {  
            for(let i = 0; i < context.RaiderPages[x].results.length; i++)
            {
                let raider = context.RaiderPages[x].results[i];
                raiders.push({
                    iid: 0,
                    Id: raider.id,
                    Name: raider.name,
                    TotalRaids: raider.totalRaids,
                    TotalWeeks: raider.totalWeeks,
                    Experience: raider.experience,
                    CurrentRank: raider.experienceLevel?.name ?? "No Rank",
                    Active: raider.active
                });
            }
        }
        console.log(`Created ${raiders.length} raiders`);
        context.Store.requestUpdate(raiders);
        //context.EventEmitter.removeListener(context.OnGxpUpdated);
    }

    requestGxpInfoLookup(name, channel)
    {
        this.Store.processInfoRequest(name, channel, this.gxpRequestResponse);
    }

    gxpRequestResponse(gxpInfo, channel)
    {
        if(!gxpInfo)
            channel.send("GXP Info is not cached for this user");
        //console.log(gxpInfo);
       //https://discordjs.guide/popular-topics/embeds.html#embed-preview
        const embed = {
            color: 0x24e50a, //green 0x24e50a  blue 0x0b34ef  purple 0x6f00ab
            title: gxpInfo.Name,
            url: 'http://guildxp.com/',                        
            fields: [
            {
                name: 'Rank',
                value:  gxpInfo.CurrentRank,
                inline: true,
            },            
            {
                name: 'Exp',
                value: `${Math.round(gxpInfo.Experience)}`,
                inline: true,
            },
            {
                name: 'Raids',
                value: `${gxpInfo.TotalRaids}`,
                inline: true,
            },
            {
                name: 'Weeks',
                value: `${gxpInfo.TotalWeeks}`,
                inline: true,
            },
            ],        
            timestamp: new Date().toISOString()            
        };
        
        channel.send({ embed: embed });
    }

    
}