module.exports.info = (msg, program, command) => {
    let txt = `Verwendung: ${command} [options]\n \n Options: \n`;
    for(let option of program.options){
        txt += `\t ${option.flags} \t ${option.description} \n`
    }

    msg.reply(txt);
}

module.exports.game_present = (msg) => {
    msg.reply("Es gibt bereits ein Spiel in diesem Channel & Discord Server. Mit werwolf create-game -f kann ein neues Spiel erzeugt werden, dass das bekannte überschreibt.");
}

module.exports.game_created = (msg) => {
    msg.reply(`Ein neues Spiel wurde erzeugt. Nun können Spieler hinzugefügt/ entfernt werden und die Karten ausgewählt werden mit denen gespielt werden sollen. Mit werwolf info kann eine Liste aller möglichen Kommandos einsehen.`);
}

module.exports.game_master = (msg, channel_name, guild_name) => {
    msg.send(`Du bist der Game Master des Spiels im Channel ${channel_name} vom Server ${guild_name}. Nur du kannst werwolf deal-cards ausführen und damit das Spiel beginnen. Eine Spielleitung kannst du hier finden: https://de.wikipedia.org/wiki/Die_Werw%C3%B6lfe_von_D%C3%BCsterwald#Spielablauf`);
}

module.exports.no_game_present = (msg) => {
    msg.reply("In diesem Channel & Server ist kein Spiel. Mit werwolf create-game kannst du ein Spiel erzeugen.")
}

module.exports.chances_dont_add_up = (msg) => {
    msg.send("Die Wahrscheinlichkeit Bürger, Werwolf und eine Rolle zu werden addieren sich nicht zu eins. Bitte ändere die Einstellungen mit einem Kommand(?)");
}

module.exports.cant_send_message = (msg, player_name) => {
    msg.reply(`Spieler ${player_name} konnte keine private Nachricht gesendet werden. Deshalb wird dieser jetzt vom Spiel entfernt.`)
}

module.exports.update_master = (msg, game, explain_player_changes) => {
    explain_player_changes = explain_player_changes === undefined ? false: explain_player_changes; // Default: false 
    let txt = "Folgende Rollen haben die Spieler erhalten: \n";
    for(let player of game.players){
        txt += `${player.name}: ${player.role} \n`;
    }
    if(explain_player_changes){
        txt += `Es können Spieler noch entfernt werden, wenn diesen keine Nachricht gesendet werden kann. Geschieht dies, wird das in ${msg.channel.name} mitgeteilt. Mit werwolf update-master kannst du jederzeit eine private Liste mit allen Rollen erhalten.`
    }
    msg.client.users.get(game.game_master.id).send(txt);
}

module.exports.edition_not_found = (msg, wrong_name) => {
    msg.reply(`Edition ${wrong_name} konnte nicht gefunden werden. Verfügbare Editionen sind Grundspiel, Neumond, "Die Gemeinde" (Argumente mit Leerzeichen müssen in Anführungszeichen übergeben werden), Charaktere.`)
}

module.exports.added_roles = (msg, added_roles) => {
    msg.reply(_something_changed("Rollen", added_roles, true));
}

module.exports.no_roles_added = (msg) => {
    msg.reply(this._nothing_changed("Rollen", true));
}

module.exports.removed_roles= (msg, removed_roles) => {
    msg.reply(_something_changed("Rollen", removed_roles, false));
}

module.exports.no_roles_removed = (msg) => {
    msg.reply(_nothing_changed("Rollen", false));
}

module.exports.removed_players = (msg, removed_players) => {
    msg.reply(_something_changed("Spieler", removed_players, false));
}

module.exports.added_players = (msg, added_players) => {
    msg.reply(_something_changed("Spiler", added_players, true));
}

const _something_changed = (name, things_that_changed, added) => {
    if(things_that_changed.length == 0) return _nothing_changed(name, added);
    let txt = `Folgende ${name} wurden ${added? "hinzugefügt": "gelöscht"}: \n`;
    txt = things_that_changed.reduce((acc, value) => acc + value + "\n", txt);
    return txt;
}

const _nothing_changed = (name, wanted_to_add) =>{
    return `Es wurden keine ${name} ${wanted_to_add? "hinzugefügt": "gelöscht"}`;
}

module.exports.role_not_found = (msg, role) => {
    msg.reply(`Konnte nicht die Rolle ${role} finden.`)
}

module.exports.commands_explainations = {
    createGame: "Erzeugt ein neues Spiel in diesem Channel auf diesem Server.",
    info: "Information über diesen Bot.",
    showPlayers: "Zeigt alle Spieler in diesem Spiel an",
    showRoles: "Zeigt alle Rollen an die momentan in dem Spiel verwendet werden.",
    dealCards: "Verteilt die Karten an alle Spieler in diesem Spiel. Die Karten werden via DM privat gesendet.",
    updateMaster: "Updated den Game Master mit den aktuellen Informationen über das Spiel via DM.",
    addEdition: "Fügt die Edition mit dem Name <name> hinzu.",
    removeEdition: "Löscht die Edition mit dem Namen <name>.",
    addRole: "Fügt die Rolle mit dem Namen <name> hinzu. Wenn in der Rollen Leerzeichen entahlten sind, dann muss die Option vor jedem leerzeichen-freiem String stehen: Sei name1 = s1 s2. Um dann name1 hinzuzufügen muss dann -a s1 -a s2 ausgeführt werden. Mehrere Rollen können auch durch mehrfache Optionen hinzugefügt werden. Falschgeschriebene Strings führen dazu, dass das ganze Kommando ab diesem Punkt nicht verarbeitet werden kann.",
    removeRole: "Löscht die mit dem Name <name>. Die selben Besonderheiten wie bei addRole treten hier auf.",
    removePlayer: "Löscht den Spieler mit dem Name <name>. Die selben Besonderheiten wie bei addRole treten hier auf.",
    addPlayer: "Fügt den Spierl mit dem Namen <name> hinzu. Die selben Besonderheiten wie bei addRole treten hier auf."
}