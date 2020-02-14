const discord = require("discord.js");
const commander = require("commander");
const client = new discord.Client();

const messages = require("./services/messages");
const api_utils = require("./services/api_utils");
const roleutils = require("./services/roleutils");
const roles = require("./roles");
const secrets = require("./secrets");
const config = require("./config");

global.games = {};
/*Schema 
{
    id: {
        game_master: {id: String, status: String, name:String},
        state: {cards_dealed: Boolean, selected_roles: [String]},
        settings: {villager: Number, direwolf: Number, roles: Number }
        players: [{id: String, status: String, role: String, name: String}],
        date: {type: Date},
    }
}
*/

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
})

client.on("message", msg => {
    const program = new commander.Command();
    program.version("1.0.0");

    let text = msg.content;
    let accept_re = new RegExp("^" + config.command + ".*", "g");
    if(!accept_re.exec(text)){
        return;
    }
    
    let game_id = `${msg.guild.id}@${msg.channel.id}`;
    let game_present = global.games[game_id]? true: false; 
    let game = game_present? global.games[game_id] : undefined; 
    
    let explains = messages.commands_explainations;
    program
        .option("-c, --create-game", explains.createGame)
        .option("-i, --info", explains.info)
        .option("-p, --show-players", explains.showPlayers)
        .option("-s, --show-roles", explains.showRoles)
        .option("-d, --deal-cards", explains.dealCards)
        .option("-u, --update-master", explains.updateMaster)
        .option("--add-edition <name>", explains.addEdition)
        .option("--remove-edition <name>", explains.removeEdition)
        .option("-a, --add-role <name>", explains.addRole, collect, [])
        .option("-r, --remove-role <name>", explains.removeRole, collect, [])
        .option("-k, --remove-player <name>", explains.removePlayer, collect, [])
        .option("-l, --add-player <name>", explains.addPlayer, collect, []);

    let split_args = text.split(" ");

    split_args.splice(0, 1);
    split_args = ["", ""].concat(split_args);
    program.parse(split_args);
    
    if(program.info){
        messages.info(msg, program, config.command)
    }else if (program.createGame){
        if(game_present && !parsed.force  ){
            messages.game_present(msg);
            return;
        }
        var [[id], created_game] = api_utils.create_game(msg);
        global.games[id] = created_game;
        messages.game_created(msg);
        messages.game_master(msg.author, msg.channel.name, msg.guild.name);
        return;
    }else if (program.showPlayers){
        if(!game_present){
            messages.no_game_present(msg);
            return
        }
        let txt = `The host of the game is: \n ${game.game_master.name} \n The Following players are in the game right now:\n`;
        for(let player of game.players){
            txt += player.name + "\n";
        }
        msg.reply(txt);
    }else if (program.showRoles){
        if(!game_present){
            messages.no_game_present(msg);
            return;
        }
        let text = "Folgende Rollen sind momentan ausgewählt: \n"
        for(let role of game.state.selected_roles){
            text += role +  "\n"; 
        }
        msg.reply(text + "Mit einem Kommando(?) könnt ihr die Beschreibung zu einer Rolle erfahren.");
    }else if(program.dealCards){
        if(!game_present){
            messages.no_game_present(msg);
            return;
        }
        let s = game.settings;
        if((s.villager + s.direwolf + s.roles - 1.0) > 10e-4){
            messages.chances_dont_add_up(msg);
            return;
        }
        let villager = s.villager, direwolf = villager + s.direwolf;
        for(let player of game.players){
            let random = Math.random();
            let player_msg = msg.client.users.get(player.id);
            let private_msg = "";
            if(random < villager){
                //Give the player the role villager.
                player.role = "Bürger";
                private_msg = "Du bist Bürger.";
            }else if(random < direwolf){
                //Give the player the role direwolf
                player.role = "Werwolf";
                private_msg = "Du bist Werwolf.";
            }else{
                //Give the player a  role
                let selected_roles = game.state.selected_roles;
                player.role = selected_roles[Math.floor(Math.random() * selected_roles.length)];
                private_msg = `Du bist ${player.role}. ${roles.lookup_table[player.role]}`;
            }
            player_msg.send(private_msg).catch((err) => {
                console.log(err);
                if(err.message === "Cannot send messages to this user"){
                    //Delete the player, probably a bot
                    let game_id = `${msg.guild.id}@${msg.channel.id}`;
                    let game = global.games[game_id];
                    game.players = game.players.filter(curr_player => curr_player.id !== player.id);
                    messages.cant_send_message(msg, player.name);
                }
            });
        }

        //Notify the game Master about all the roles
        messages.update_master(msg, game, true);
    }else if (program.updateMaster){
        if(!game_present){
            messages.no_game_present(msg);
            return;
        }
        messages.update_master(msg, game);
    }else if (program.addEdition){
        if(!game_present){
            messages.no_game_present(msg);
            return;
        }
        let edition_name = program.addEdition;
        let edition = roles[edition_name];
        let added_roles = [];
        if(edition === undefined){
            messages.edition_not_found(msg, edition_name);
            return;
        }else{
            for(let role of edition){
                let name = role.name;
                if(game.state.selected_roles.indexOf(name) < 0){
                    // Role not already present
                    game.state.selected_roles.push(name);
                    added_roles.push(name);
                }
            }
        }
        if(added_roles.length === 0){
            messages.no_roles_added(msg);
        }else{
            messages.added_roles(msg, added_roles);
        }
    }else if(program.removeEdition){
        if(!game_present){
            messages.no_game_present(msg);
            return;
        }
        let edition_name = program.removeEdition;
        let edition = roles[edition_name];
        let removed_roles = [];
        if(edition === undefined){
            messages.edition_not_found(msg, edition_name);
            return;
        }else{
            for(let role of edition){
                let name = role.name;
                let idx = game.state.selected_roles.indexOf(name);
                if(idx >= 0){
                    // Role present
                    game.state.selected_roles.splice(idx, 1);
                    removed_roles.push(name);
                }
            }
        }
        if(removed_roles.length === 0){
            messages.no_roles_added(msg);
        }else{
            messages.removed_roles(msg, removed_roles);
        }
    }else if(program.addRole.length > 0){
        if(!game_present){
            messages.no_game_present(msg);
            return;
        }
        if(typeof program.addRole === "string" && program.addRole !== undefined) program.addRole = [program.addRole]
        let roles_added = [];
        let current_role = "";
        for(let i = 0; i < program.addRole.length; i++){
            current_role += program.addRole[i];
            if(roles.lookup_table[current_role] === undefined){
                //Maybe we need to  add more strings to get a valid role, so add a whitespace 
                current_role += " "
                continue;
            }else{
                if(game.state.selected_roles.indexOf(current_role) < 0){
                    //Role not present
                    game.state.selected_roles.push(current_role);
                    roles_added.push(current_role);
                }
                //Clear the current role, so the next iteration tries matching a new role
                current_role = "";
            }
        }
        if(current_role.length > 0){
            //Some role wasn't found 
            messages.role_not_found(msg, current_role)
        }
        messages.added_roles(msg, roles_added)
    }else if(program.removeRole.length > 0){
        if(!game_present){
            messages.no_game_present(msg);
            return;
        }
        if(typeof program.removeRole === "string") program.removeRole = [program.removeRole]
        let roles_removed = [];
        let current_role = "";
        for(let i = 0; i < program.removeRole.length; i++){
            current_role += program.removeRole[i];
            if(roles.lookup_table[current_role] === undefined){
                //Maybe we need to  add more strings to get a valid role, so add a whitespace 
                current_role += " "
                continue;
            }else{
                const idx = game.state.selected_roles.indexOf(current_role);
                if(idx >= 0){
                    //Role present
                    game.state.selected_roles.splice(idx, 1);
                    roles_removed.push(current_role);
                }
                //Clear the current role, so the next iteration tries matching a new role
                current_role = "";
            }
        }
        if(current_role.length > 0){
            //Some role wasn't found 
            messages.role_not_found(msg, current_role)
        }
        messages.removed_roles(msg, roles_removed);
    }else if(program.removePlayer.length > 0){
        if(!game_present){
            messages.no_game_present(msg);
            return;
        }
        let removed_players = [];
        OUTER_LOOP: for(let player of program.removePlayer){
            for(let i = 0; i < game.players.length; i++){
                let present_player = game.players[i];
                if(present_player.name === player){
                    game.players.splice(i, 1);
                    removed_players.push(player);
                }
            }
        }
        messages.removed_players(msg, removed_players);
    }else if(program.addPlayer.length > 0){
        if(!game_present){
            messages.no_game_present(msg);
            return;
        }
        let players_in_channel = api_utils.members_to_players(msg.channel.members);
        let players_added = [];
        for( let to_add of program.addPlayer){
            for(let player of players_in_channel){
                if(to_add === player.name){
                    game.players.push(player);
                    players_added(player.name);
                }
            }
        }
        messages.added_players(msg,players_added)
    }else{
    }
});

const collect = (previous, value) => {
    //This concats multiple arguments with the same flag for commander.js
    //See https://github.com/tj/commander.js/
    return value.concat([previous]);
}

client.login(secrets.token);