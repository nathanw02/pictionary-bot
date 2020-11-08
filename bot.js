const Discord = require('discord.js');
const Game = require('./Game.js');
require('dotenv').config();

const client = new Discord.Client();
const prefix = '!';

var games = new Map();

client.login(process.env.TOKEN);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('guildCreate', guild => {
    guild.channels.create('pictionary', {type: 'text'}).then(c => {
        c.send('How to use:\n- Make sure to have everyone in the server type something in chat so I can cache the users list before starting a game (only for first time game after adding the bot)\n- You should also mute this channel channel as there will be a lot of spam\n- Do not change this channel name\n`!start` : creates a pictionary game (react to messages to join/start game)\n`!end` : ends game');
    });
});

client.on('message', async msg => {
    if(msg.channel.id != client.channels.cache.find(ch => ch.name === 'pictionary').id) return;

    if(games.has(msg.channel.id)){
        let game = games.get(msg.channel.id);
        let players = [];
        game.players.forEach(player => {
            players.push(player.id);
        });
        if(!players.includes(msg.author.id)) return;
        if(msg.content == game.word){
            game.addScore(msg.author.id);
            game.endRound();
        } 
    }

    if (!msg.content.startsWith(prefix) || msg.author.bot) return;

    const args = msg.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();

    if(command === 'start'){
        const startMsg = await msg.channel.send('React with a ☑ to join the game then react with 🖌 to start the game');
        startMsg.react('☑').then(()=> startMsg.react('🖌'));
    }

    if(command === 'end'){
        if(games.has(msg.channel.id)){
            let game = games.get(msg.channel.id);
            game.end();
            return games.delete(msg.channel.id);
        }
    }

});

client.on('messageReactionAdd', (reaction, user) => {
    let msg = reaction.message;
    let id = reaction.message.channel.id;
    let emote = reaction.emoji;
    let u = user.id;
    
    if(u == '771953142777511936') return;

    if(emote.name == '☑'){
        if(!games.has(id)){
            let game = new Game(id, client);
            games.set(id, game);
            if(!game.players.includes(u)) game.addPlayer(u);
        }else{
            let game = games.get(id);
            if(!game.players.includes(u)) game.addPlayer(u);
        }
    }
    if(emote.name == '🖌'){
        if(!games.has(id)){
            return msg.edit('No players');
        }else{
            let game = games.get(id);
            if(game.started == false){
                game.start(msg);
                return msg.edit('Game starting...');
            }
        }
    }
 
});