var format = require("date-format");
var roles = require("../roles")

module.exports.create_game = (msg) => {
    let guild_id = msg.guild.id;
    let channel_id = msg.channel.id;
    let selected_roles = [];
    //Select the "Grundspiel" as default
    for(let role of roles.Grundspiel){
        selected_roles.push(role.name);
    }
    let temp = {
        game_master: userToPlayer(msg.author),
        players: membersToPlayer(msg.channel.members),
        state: {cards_dealed: false, selected_roles},
        settings: {
            //Default settings
            //Spawn range (as a float percenetage)
            direwolf: 0.3,
            roles: 0.4,
            villager: 0.3
        },
        date: format(new Date())
    }
    let idx = guild_id + "@" + channel_id
    return [[idx], temp]
}

const userToPlayer = (user) =>{
    return {
        id: user.id,
        name: user.username,
        status: user.presence.status,
        role: ""
    }
} 

const membersToPlayer = (member_arr) => {
    let result = [];
    for (let temp of member_arr){
        let id = temp[0];
        let user = temp[1].user;
        //TODO: Add the bot to this condition and remove the True ||
        if(true  || (id !== msg.author.id)){
            //The Author is the game master and musn't bet but in the plyer array
            result.push(userToPlayer(user));
        }

    }
    return result;
}

module.exports.members_to_players = membersToPlayer;