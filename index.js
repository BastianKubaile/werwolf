const discord = require("discord.js");
const commander = require("commander");
const client = new discord.Client();

const messages = require("./services/messages");
const api_utils = require("./services/api_utils");
const roleutils = require("./services/roleutils");
const roles = require("./roles");
const secrets = require("./secrets");
const config = require("./config");
const mongoose = require("mongoose");

require("./services/mongodb/model");

const mongodb = config.mongodb !== undefined;

if(mongodb){
    mongoose.Promise = global.Promise;
    mongoose.connect(config.mongodb.URI, {useNewUrlParser: true, useUnifiedTopology: true});
    global.storage = mongoose.model("games");
}else{
    global.storage = {};
}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
})

client.on("message", async msg => {
    const program = new commander.Command();
    program.version("1.0.0");

    let text = msg.content;
    let accept_re = new RegExp("^" + config.command + ".*", "g");
    if(!accept_re.exec(text)){
        return;
    }
    
    let game_id = api_utils.get_game_id(msg);
    let game = await api_utils.get_game(global.storage, game_id);
    let game_present = game !== undefined? true: false; 
    
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
        .option("-l, --add-player <name>", explains.addPlayer, collect, [])
        .option("-e, --explain-role <name>", explains.explainRole, collect, [])
        .option("-m, --move-role <expression>", explains.moveRole);
    let split_args = text.split(" ");

    split_args.splice(0, 1);
    split_args = ["", ""].concat(split_args);
    program.parse(split_args);
    
    if(program.info){
        messages.info(msg, program, config.command)
    }else if (program.createGame){
        if(game_present && ! (program.args.indexOf("force") >= 0)){
            messages.game_present(msg);
            return;
        }
        var [[id], created_game] = api_utils.create_game(msg);
        api_utils.save_game(global.storage, id, created_game);
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
        msg.reply(text + "Mit einem --explain-role <name> könnt ihr die Beschreibung zu einer Rolle erfahren.");
    }else if(program.dealCards){
        if(!game_present){
            messages.no_game_present(msg);
            return;
        }
        game.state.used_roles = [];
        let s = game.settings;
        if((s.villager + s.direwolf + s.roles - 1.0) > 10e-4){
            messages.chances_dont_add_up(msg);
            return;
        }
        let villager = s.villager, direwolf = villager + s.direwolf;
        for(let player of game.players){
            let random = Math.random();
            let player_msg = msg.client.users.get(player.id);
            if(random < villager){
                //Give the player the role villager.
                player.role = "Villager";
            }else if(random < direwolf){
                //Give the player the role direwolf
                player.role = "Direwolf";
            }else{
                //Give the player a  role
                player.role = select_role(game.state.selected_roles, game.state.used_roles);
                game.state.used_roles.push(player.role);
            }
            let private_msg = messages.inform_player(player.role, roles.lookup_table);
            player_msg.send(private_msg).catch(async (err) => {
                console.log(err);
                if(err.message === "Cannot send messages to this user"){
                    //Delete the player, probably a bot, since this is
                    let game_id = api_utils.get_game_id(msg);
                    let game = await api_utils.get_game(global.storage, game_id);
                    game.players = game.players.filter(curr_player => curr_player.id !== player.id);
                    let role_idx = game.state.used_roles.indexOf(player.role);
                    if(role_idx >= 0){
                        game.state.used_roles = game.state.used_roles.splice(idx, 1); 
                    }
                    api_utils.save_game(global.storage, game_id, game);
                    messages.cant_send_message(msg, player.name);
                }
            });
        }
        api_utils.save_game(global.storage, game_id, game);
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
        api_utils.save_game(global.storage, game_id, game);
        messages.added_roles(msg, added_roles);
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
        api_utils.save_game(global.storage, game_id, game);
        messages.removed_roles(msg, removed_roles);
    }else if(program.addRole.length > 0){
        if(!game_present){
            messages.no_game_present(msg);
            return;
        }
        if(typeof program.addRole === "string" && program.addRole !== undefined){
            program.addRole = [program.addRole];
        }
        let [added_roles, current_role] = iterate_role_args(program.addRole, roles.lookup_table);
        for(let role of added_roles){
            if(game.state.selected_roles.indexOf(role) < 0){
                //Role not present
                game.state.selected_roles.push(role);
            }
        }
        if(current_role.length > 0){
            //Some role wasn't found 
            messages.role_not_found(msg, current_role)
        }
        api_utils.save_game(global.storage, game_id, game);
        messages.added_roles(msg, roles_added)
    }else if(program.removeRole.length > 0){
        if(!game_present){
            messages.no_game_present(msg);
            return;
        }
        if(typeof program.removeRole === "string"){
             program.removeRole = [program.removeRole];
        }
        let [removed_roles, current_role] = iterate_role_args(program.removeRole, roles.lookup_table);
        for(let role of removed_roles){
            const idx = game.state.selected_roles.indexOf(role);
            if(idx >= 0){
                game.state.selected_roles.splice(idx, 1);
            }
        }
        if(current_role.length > 0){
            //Some role wasn't found 
            messages.role_not_found(msg, current_role)
        }
        api_utils.save_game(global.storage, game_id, game);
        messages.removed_roles(msg, removed_roles);
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
        api_utils.save_game(global.storage, game_id, game);
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
        api_utils.save_game(global.storage, game_id, game);
        messages.added_players(msg,players_added)
    }else if(program.explainRole.length > 0){
        let [requested_roles, not_matched] = iterate_role_args(program.explainRole, roles.lookup_table);
        let txt = "";
        for(let role of requested_roles){
            txt += `${role}: \t ${roles.lookup_table[role]} \n`;
        }
        msg.reply(txt);
    }else if(program.moveRole){
        let match_regex = /^(v|d|r)to(v|d|r)$/g;
        if(!match_regex.exec(program.moveRole)){
            messages.invalid_expression(msg, program.moveRole);
            return;
        }

        let from = program.moveRole.substring(0,1), to = program.moveRole.substring(3,4);
        let from_arr = [];
        if(from === "v"){
            from_arr = game.players.filter(player => player.role === "Villager");
        }else if(from === "d"){
            from_arr = game.players.filter(player => player.role === "Direwolf");
        }else{
            from_arr = game.players.filter(player => (player.role !== "Villager") && (player.role !== "Direwolf"));
        }
        let idx = Math.floor(Math.random() * from_arr.length);
        let id = from_arr[idx].id;
        for(let i = 0; i < game.players.length; i++){
            const player = game.players[i];
            if(player.id === id){
                //We have a match
                if(from === "r"){
                    //The role will be removed, so change this
                    game.state.used_roles.splice(game.state.used_roles.indexOf(player.role), 1)
                }
                if(to === "v"){
                    game.players[i].role = "Villager";
                }else if(to === "d"){
                    game.players[i].role = "Direwolf";
                }else{
                    game.players[i].role = select_role(game.state.selected_roles, game.state.used_roles);
                    game.state.used_roles.push(game.players[i].role);
                }
                let player_msg = msg.client.users.get(game.players[i].id);
                let private_msg = messages.inform_player(game.players[i].role, roles.lookup_table);
                player_msg.send(private_msg);
            }
        }
        api_utils.save_game(global.storage, game_id, game);
    }
    else{
    }
});

const collect = (previous, value) => {
    //This concats multiple arguments with the same flag for commander.js
    //See https://github.com/tj/commander.js/
    return value.concat([previous]);
}

const iterate_role_args = (args, lookup_table) => {
    //Iterates the args, where multiple strings may need to be concatenated to give a valid role name.Calls callback function role_found when such a valid name is found
    //Returns: (current_role [wasn't matched with anything], roles_found)
    let current_role = "";
    let roles_found = [];
    for(let i = 0; i < args.length; i++){
        current_role += args[i];
        if(lookup_table[current_role] === undefined){
            current_role += " ";
            continue;
        }else{
            roles_found.push(current_role);
            current_role = "";
        }
    }
    return [roles_found, current_role];
}

function select_role(selected_roles, used_roles) {
    let role = "";
    do {
        role = selected_roles[Math.floor(Math.random() * selected_roles.length)];
    } while (used_roles.indexOf(role) >= 0);
    return role;
}

client.login(secrets.token);