const Discord = require('discord.js');

const client = new Discord.Client({ partials: ['USER', 'MESSAGE', 'CHANNEL', 'REACTION', 'GUILD_MEMBER'] });

const { prefix, token, clientId, clientSecret} = require('./config.json');

const WELCOME_MESSAGE = "Welcome to the Gather Your Allies community.  To learn everything you need to know please check out our ";
const BOT_TESTING_CHANNEL_ID = "858914306736259103";
const GUILD_ROLE_LEDGER = "914727707550552124";
const WELCOME_FAQ_CHANNEL_ID = "907852726287884319";

client.once('ready', () => {
	console.log('Ready!');
});

client.login(token);



client.on('messageReactionAdd', async(reaction, user) => {
   
    
    if(reaction.partial){
        try{
            await reaction.fetch();
        }
        catch(error){
            console.error('Something went wrong when fetching the message: ', error);
			// Return as `reaction.message.author` may be undefined/null
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
   
    

    let msg = `Role Update on ${newMember.displayName} `;

    let welcomeMsg = WELCOME_MESSAGE + `<#${WELCOME_FAQ_CHANNEL_ID}>`;

    let somethingChanged = false;

    if(oldMember.roles.cache.size > newMember.roles.cache.size)
    {
        oldMember.roles.cache.forEach(role => {
            if(!newMember.roles.cache.has(role.id)){
                somethingChanged = true;
                msg += `removed role ${role.name}`;
            }
        });
    }
    else if(oldMember.roles.cache.size < newMember.roles.cache.size)
    {       
        newMember.roles.cache.forEach(role => {
            if(!oldMember.roles.cache.has(role.id)){
                somethingChanged = true;
                msg += `added role ${role.name}`; 
                if(!newMember.user.bot && role.name == "Member")                
                    newMember.send(welcomeMsg);                
                else if(newMember.user.bot && role.name == "Member")                
                    client.channels.cache.get(BOT_TESTING_CHANNEL_ID).send(welcomeMsg);
                
            }
        });
    }

    if(somethingChanged)
    {
        client.channels.cache.get(GUILD_ROLE_LEDGER).send(msg);
        //console.log(msg);
    }
});

client.on('message', message => {
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
    
    
});

