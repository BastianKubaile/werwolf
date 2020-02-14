const discord = require("discord.js");
const commander = require("commander");
const client = new discord.Client();

const messages = require("./services/messages");
const create_game = require("./services/create_game");
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
    let accept_re = /^werwolf.*/g;
    if(!accept_re.exec(text)){
        return;
    }
    
    let game_id = `${msg.guild.id}@${msg.channel.id}`;
    let game_present = global.games[game_id]? true: false; 
    let game = game_present? global.games[game_id] : undefined; 
    
    program
        .option("-c, --creategame", "create a new game in this Channel on this Server")
        .option("-i, --info", "get some information")
        .option("-p, --show-players", "show all the players in the game")
        .option("-r, --show-roles", "show all the roles currently selected")
        .option("-d, --deal-cards", "deals the cards to the players in the current game. The cards are sent via private message.")
        .option("-u, --update-master", "updates the master via private message with the current information about the game.")
        .option("--add-edition <name>", "adds the edition with the name")
        .option("--remove-edition <name>", "removes the edition with the name")
    program.command("add-roles <args>")
        .description("Adds the roles, listed in a comma seperated List. ").action((args) => {
            roleutils.addRole(msg, game, roles.lookup_table, args)
        });
    let split_args = text.split(" ");

    split_args.splice(0, 1);
    split_args = ["", ""].concat(split_args);
    program.parse(split_args);
    
    if(program.info){
        messages.commands_info(msg);
    }else if (program.creategame){
        if(game_present && !parsed.force  ){
            messages.game_present(msg);
            return;
        }
        var [[id], created_game] = create_game(msg);
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
    }else if(program.addRole){
        let roles_added = [];
        let role = program.addRole;
        if(roles.lookup_table[role] === undefined){
            messages.role_not_found(msg, role);
        }else{
            if(game.state.selected_roles.indexOf(role) < 0){
                //Role not already present
                game.state.selected_roles.push(role);
                roles_added.push(role);
            }
        }
        messages.added_roles(msg, roles_added)
    }else{
    }
});

client.login(secrets.token);