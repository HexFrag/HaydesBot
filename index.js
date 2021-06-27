const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

const { prefix, token} = require('./config.json');

client.once('ready', () => {
	console.log('Ready!');
});

client.login(token);

Discord.Permissions

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
        const initRole = reaction.message.guild.roles.cache.find(role => role.name === 'Initiate');
        member.roles.add(initRole)
        .then(() => 
        {
            console.log(`Added the role to ${member.displayName}`);
        });
    })
    .catch(console.error);

    
    console.log(`${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`);
        // The reaction is now also fully available and the properties will be reflected accurately:
        console.log(`${reaction.count} user(s) have given the same reaction to this message!`);
});



client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    if(!message.member.roles.cache.some(role => role.name === 'Admin'))
    {
        return message.reply('You do not have permission to use this command');
    }

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();
    
    if (!args.length) {
        return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
    } else if (command === 'prune') {
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

