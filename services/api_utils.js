var format = require("date-format");
var roles = require("../roles")
const config = require("../config");

module.exports.create_game = (msg) => {
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
    return [[this.get_game_id(msg)], temp]
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

module.exports.get_game_id = (msg) => {
    return `${msg.guild.id}@${msg.channel.id}`
}

module.exports.get_game = async (storage, game_id) => {
    if(config.mongodb){
        let game = await storage.findOne({_id: game_id})
        .then()
        .catch((err) => {
            console.log(err);
        });
        game = game === null? undefined: game.toObject();//The rest of the code depends on game being undefined when it's not present
        return game;
    }else{
        return storage[game_id]
    }
}

module.exports.save_game = async(storage, id, game) => {
    if(config.mongodb){
        game._id = id;
        let doc = await storage.findOne({_id: id});
        if(doc !== null){
            //Game already exists, so delete it
            doc.remove();
        }
        storage.create(game);
    }else{
        storage[id] = game;
    }
}