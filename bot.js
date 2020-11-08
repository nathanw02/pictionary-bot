const Discord = require('discord.js');
const Game = require('./Game.js');
require('dotenv').config();

const client = new Discord.Client();
const prefix = '!';

var games = new Map();

client.login(process.env.TOKEN);

var channels = [];

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Currently in ${client.guilds.cache.size} servers`);
    let c = client.channels.cache.array();
    for(channel of c){
        if(channel.name === 'pictionary'){
            channels.push(channel.id);
        }
    }

    process.on('unhandledRejection', () => {
        return;
    });

});

client.on('guildCreate', guild => {
    guild.channels.create('pictionary', {type: 'text'}).then(c => {
        c.send('How to use:\n- You should mute this channel channel as there will be a lot of spam\n- Do not change this channel name\n`!start` : creates a pictionary game (type `!join` to join the game)\n`!end` : ends game');
        client.channels.fetch(c.id);
        channels.push(c.id);
    });
});

client.on('message', async msg => {
    if(msg.author.bot) return;
    if(!channels.includes(msg.channel.id)) return;
    if(games.has(msg.channel.id)){
        let game = games.get(msg.channel.id);
        if(game.started == true){

            if(!game.getPlayers().includes(msg.author.id)) return;
    
            if(msg.content == game.word){
                game.endRound();
                game.addScore(msg.author.id);
            }    
        }
    }

    if (!msg.content.startsWith(prefix)) return;

    const args = msg.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    const id = msg.channel.id;
    const u = msg.member;

    if(command === 'start'){
        if(!games.has(id)){
            let game = new Game(id, client);
            games.set(id, game);
            const startMsg = await msg.channel.send('Type `!join` to join the game, and react with 🖌 to start the game.');
            startMsg.react('🖌');
        }else{
            return msg.channel.send('Game already created. Type `!join` to join');
        }        
    }
    
    if(command === 'join'){
        if(!games.has(id)){
            return msg.channel.send('No game has been started yet. Type `!start` to create a game.');
        }else{
            let game = games.get(id);
            if(game.started == true){
                return msg.channel.send('Game already started.');
            }else{
                if(!game.getPlayers().includes(u.id)){
                    game.addPlayer(u);
                    msg.channel.send(`${u.displayName} joined the game.`);
                }
            }
        } 
    }

    if(command === 'end'){
        if(games.has(id)){
            let game = games.get(id);
            
            if(!game.getPlayers().includes(msg.author.id)) return;

            game.endGame();
            return games.delete(id);
        }
    }

    if(command === 'help'){
        msg.channel.send('How to use:\n- You should mute this channel channel as there will be a lot of spam\n- Do not change this channel name\n`!start` : creates a pictionary game (type `!join` to join the game)\n`!end` : ends game');
    }

});

client.on('messageReactionAdd', (reaction, user) => {
    let msg = reaction.message;
    let id = reaction.message.channel.id;
    let emote = reaction.emoji;
    let u = user.id;
    
    if(u == '771953142777511936') return;

    if(emote.name == '🖌'){
        if(!games.has(id)){
            return msg.edit('No players');
        }else{
            let game = games.get(id);
            if(game.started == false){
                game.start(msg);
                let checkStatus = setInterval(()=>{
                    if(game.gameEnd == true){
                        games.delete(id);
                        clearInterval(checkStatus);
                    }
                }, 5000);
                return msg.edit('Game starting...');
            }
        }
    }
 
});