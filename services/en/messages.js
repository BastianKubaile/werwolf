const config = require("../../config")

module.exports.info = (msg, program, command) => {
    let txt = `Usage: ${command} [options]\n \n Options: \n`;
    for(let option of program.options){
        txt += `\t ${option.flags} \t ${option.description} \n`
    }

    msg.reply(txt);
}

module.exports.game_present = (msg) => {
    msg.reply(`There is a game already in this channel & Discord Server. You can create a new game by forcibly overwriting the old game with ${config.command} --create-game force.`);
}

module.exports.game_created = (msg) => {
    msg.reply(`A new game has been created. You may now add players and deal cards. You can see a full list of availabe commands with ${config.command} info.`);
}

module.exports.game_master = (msg, channel_name, guild_name) => {
    msg.send(`You are the Game Master of the Channel ${channel_name} on the server ${guild_name}. Only you may run ${config.command} deal-cards which starts the game. Here is a guide on how to play: https://www.playwerewolf.co/rules`);
}

module.exports.no_game_present = (msg) => {
    msg.reply(`There is no game present in this channel and server. You may create a game with  ${config.command} create-game.`)
}

module.exports.chances_dont_add_up = (msg) => {
    msg.send("The probalities to become villager, direwolf or get a special role don't add up. You may change them with some(TODO) command.");
}

module.exports.cant_send_message = (msg, player_name) => {
    msg.reply(`Couldn't send player ${player_name} a private message. The player will now be removed from the game.`)
}

module.exports.update_master = (msg, game, explain_player_changes) => {
    explain_player_changes = explain_player_changes === undefined ? false: explain_player_changes; // Default: false 
    let txt = "The players got these roles: \n";
    for(let player of game.players){
        txt += `${player.name}: ${player.role} \n`;
    }
    if(explain_player_changes){
        txt += `If the bot can't send some players a private message describing their role they will be removed from the game. If this happens, there will be information in the channel ${msg.channel.name}. The game master may get a private list of all the current roles with ${config.command} update-master.`
    }
    msg.client.users.get(game.game_master.id).send(txt);
}

module.exports.edition_not_found = (msg, wrong_name) => {
    msg.reply(`Edition ${wrong_name} couldn't be found. Available Editions are (TODO: Make these english) Grundspiel, Neumond, Die Gemeinde, Charaktere.`)
}

module.exports.added_roles = (msg, added_roles) => {
    msg.reply(_something_changed("Roles", added_roles, true));
}

module.exports.no_roles_added = (msg) => {
    msg.reply(this._nothing_changed("Roles", true));
}

module.exports.removed_roles= (msg, removed_roles) => {
    msg.reply(_something_changed("Roles", removed_roles, false));
}

module.exports.no_roles_removed = (msg) => {
    msg.reply(_nothing_changed("Roles", false));
}

module.exports.removed_players = (msg, removed_players) => {
    msg.reply(_something_changed("Players", removed_players, false));
}

module.exports.added_players = (msg, added_players) => {
    msg.reply(_something_changed("Players", added_players, true));
}

const _something_changed = (name, things_that_changed, added) => {
    if(things_that_changed.length == 0) return _nothing_changed(name, added);
    let txt = `The following ${name} were ${added? "added": "removed"}: \n`;
    txt = things_that_changed.reduce((acc, value) => acc + value + "\n", txt);
    return txt;
}

const _nothing_changed = (name, wanted_to_add) =>{
    return `There were no ${name} ${wanted_to_add? "added": "removed"}`;
}

module.exports.role_not_found = (msg, role) => {
    msg.reply(`Couldn't find ${role}.`)
}

module.exports.invalid_expression = (msg, expression) => {
    msg.reply(`The expression ${expression} is not valid. The correct form is <shorthand1>to<shorthand2>. Valid shorthands are v for Villager, d for Direwolf and r for Role.`)
}

module.exports.inform_player = (role, lookup_table) =>{
    if(role === "Villager"){
        return "You are a villager."
    }else if(role === "Direwolf"){
        return "You are a direwolf.";
    }else{
        return `You are ${role}. \n ${lookup_table[role]}`;
    }
} 

module.exports.show_roles = (msg, selected_roles) => {
    let text = "The following roles are currently available: \n"
    for(let role of selected_roles){
        text += role +  "\n"; 
    }
    msg.reply(text + `You may get the description of a role with ${config.command} --explain-role <name>.`);
}

module.exports.show_players = (msg, master, players) => {
    let txt = `The host of the game is: \n ${master.name} \n The Following players are in the game right now:\n`;
    for(let player of players){
        txt += player.name + "\n";
    }
    msg.reply(txt);
}

module.exports.commands_explainations = {
    createGame: "Creates a new game in this channel on this server.",
    info: "Information about the available commands.",
    showPlayers: "Shows all players who are in the game right now.",
    showRoles: "Showes all the roles used at the moment in this game.",
    dealCards: "Gives all the players in the game cards, distributed randomly. The cards are send via DM privatly.",
    updateMaster: "Updates the game master with current information about this game via DM.",
    addEdition: "Adds all addition with <name>. The same percularities as with addRole apply.",
    removeEdition: "Removes the edition with <name>. The same percularities as with addRole apply.",
    addRole: "Adds the role with the name <name>. If there are whitespace in the role you want to add, then you will have to pass the name in different options each without whitespace: For example let name1 = s1 s2. To add name1 you need to run -a s1 -a s2. Multiple roles can be added with multiple options, each in the same format. Strings that are written wrong won't be matched by a role and will lead to the command not being processed correctly after the typo.",
    removeRole: "Removes the role with the name <name>. The same percularities as with addRole apply.",
    removePlayer: "Removes the player with the name <name>. The same percularities as with addRole apply.",
    addPlayer: "Adds the player with the name <name> hinzu.The same percularities as with addRole apply.",
    explainRole: "Explains the role with the name <name>. The same percularities as with addRole apply.",
    moveRole: "Changes the role of a random player, defined by <expression>. Every expression has the form <shorthand1>to<shorthand2>. The following shorthands are valid: d for direwolf, v for villager and r for role. I.e. dtow will turn a villager into a direwolf."
}