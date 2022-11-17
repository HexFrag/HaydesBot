const Discord = require('discord.js');
//const ytdl = require('ytdl-core');

const client = new Discord.Client({ partials: ['USER', 'MESSAGE', 'CHANNEL', 'REACTION', 'GUILD_MEMBER'] });

const DataStore = require('./DataStore.js');



const config = require('./config.json');

const GxpController = require('./GxpController.js');

const prefix = config.client.prefix;

const gxpController = new GxpController(config);

const WELCOME_MESSAGE = "Welcome to the <Gather Your Allies> community! To learn everything you need to know, please check out our #welcome-faq.";
const BOT_TESTING_CHANNEL_ID = "858914306736259103";
const GUILD_ROLE_LEDGER = "914727707550552124";
const WELCOME_FAQ_CHANNEL_ID = "907852726287884319";
const GENERAL_CHANNEL_ID = "857899639486545932";

client.once('ready', () => {
	console.log('Ready!');
    //gxpLookup("Aeires", client.channels.cache.get(BOT_TESTING_CHANNEL_ID));
    //updateGxp();
});

client.login(config.client.token);

/*
client.on('message', msg => {
  if (msg.content === '!play') {
    msg.channel.send('Playing audio from YouTube!');
    const stream = ytdl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { filter: 'audioonly' });
    const dispatcher = msg.connection.playStream(stream);
    dispatcher.on('end', () => {
      msg.channel.send('Audio playback finished.');
    });
  }
});
client.login('your-discord-bot-token-goes-here');
*/

client.on('messageReactionAdd', async(reaction, user) => {
   
    
    if(reaction.partial){
        try{
            await reaction.fetch();
        }
        catch(error){
            console.error('Something went wrong when fetching the message: ', error);			
			return;
        }
    }

    if(reaction.message.channel.name !== 'rules')
        return;    
    
    reaction.message.guild.members.fetch(user).then((member) =>{
        const initRole = reaction.message.guild.roles.cache.find(role => role.name === 'Visitor');
        member.roles.add(initRole)
        .then(() => 
        {
            console.log(`Added the role to ${member.displayName}`);
        });
    })
    .catch(console.error);

});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
   
    

    let msg = `${newMember.displayName} @action the rank of @role`;

    let welcomeMsg = WELCOME_MESSAGE + `<#${WELCOME_FAQ_CHANNEL_ID}>`;

    let somethingChanged = false;
    let announce = false;
    let roleName = '';
    let action = '';

    if(oldMember.roles.cache.size > newMember.roles.cache.size)
    {
        oldMember.roles.cache.forEach(role => {
            if(!newMember.roles.cache.has(role.id)){
                somethingChanged = true;
                //msg += `removed role ${role.name}`;

                roleName = role.name;
                action = 'has moved from';
                announce = (role.name == "Member" || 
                    role.name == "Raider" || 
                    role.name == "Core Raider" || 
                    role.name == "Officer"||
                    role.name == "Bot" );

            }
        });
    }
    else if(oldMember.roles.cache.size < newMember.roles.cache.size)
    {       
        newMember.roles.cache.forEach(role => {
            if(!oldMember.roles.cache.has(role.id)){
                somethingChanged = true;
                //msg += `added role ${role.name}`; 

                roleName = role.name;
                action = "has moved to";
                announce = (role.name == "Member" || 
                    role.name == "Raider" || 
                    role.name == "Core Raider" || 
                    role.name == "Officer" ||
                    role.name == "Bot" );

                if(!newMember.user.bot && role.name == "Allies")
                {
                    newMember.send(welcomeMsg);                
                }
            }
        });
    }

    if(somethingChanged)
    {
        msg = msg.replace("@role", roleName);
        msg = msg.replace("@action", action);       

        client.channels.cache.get(GUILD_ROLE_LEDGER).send(msg);
        //console.log("LEDGER: " + msg);
        if(announce)
        {
            client.channels.cache.get(GENERAL_CHANNEL_ID).send(msg);
            //console.log("ANNOUNCE: " + msg);
        }
        //console.log(msg);
    }
});

client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();
    
    if (!args.length) {

        //command to determine if the bot is active and works in the channel.
        if (command === 'ping')
        {
            if(!message.member.roles.cache.some(role => role.name === 'Admin'))
            {
                return message.reply('You do not have permission to use this command');
            }


            return message.reply(`Latency: ${Date.now() - message.createdTimestamp}ms | API Latency: ${Math.round(client.ws.ping)}ms`);
        }
        else if (command === 'gxp')
        {            
            let name = message.member.displayName;
            
            gxpLookup(name, message.channel);
            
            
        }
        else if(command === "gxpUpdate")
        {
            
            if(!message.member.roles.cache.some(role => role.name === 'Admin'))
            {
                return message.reply('You do not have permission to use this command');
            }
            
            message.reply('Attempting Update');
            updateGxp();
        }
    }    
    else if (command === 'prune') {

        if(!message.member.roles.cache.some(role => role.name === 'Admin'))
        {
            return message.reply('You do not have permission to use this command');
        }

        //Add one to include the command message.
		const amount = parseInt(args[0]) + 1;

		if (isNaN(amount)) {
			return message.reply('that doesn\'t seem to be a valid number.');
		}
        else if (amount < 2 || amount > 100) {
            return message.reply('you need to input a number between 2 and 100.');
        }

        message.channel.bulkDelete(amount, true).catch(err => {
            console.error(err);
            message.channel.send('there was an error trying to prune messages in this channel!');
        });
	}
    else if(command === 'gxp')
    {
        if(args.length > 1)
            message.channel.send('Too many arguments for gxp command');

        if(!args[0] || args[0].length == 0)
            message.channel.send('Invalid argument for command gxp');

        gxpLookup(args[0], message.channel);
    }
    

    
    
    
});


function gxpLookup(name, channel)
{
    gxpController.requestGxpInfoLookup(name, channel);    
}

function updateGxp()
{
    gxpController.requestGxpUpdate();
}

