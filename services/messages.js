module.exports.commands_info = (msg) => {
    msg.reply(`
    **Werwolf Bot**
    Mit diesem Bot könnt ihr Werwolf spielen. Folgende Kommandos sind möglich:

    > werwolf create-game 
    Erzeugt ein Neues Werwolf Spiel, bei standardmäßig alle Spieler aus dem Channel teilnehmen. 
    
    > werwolf deal-cards
    Teilt zufällig Karten an alle Spieler per Direct Message aus. Die Karten hängen von den ausgewählten Rollen ab.
    
    > werwolf show-roles
    Zeigt alle Rollen, die momentan ausgewählt sind.
    
    > werwolf add_edition edition_name
    Fügt die Edition edition_name hinzu. Verfügbare Editionen sind Grundspiel, Neumond, "Die Gemeinde" (Argumente mit Leerzeichen müssen in Anführungszeichen übergeben werden), Charaktere.

    > werwolf remove_addition edition_name
    Löscht die entsprechende Edition.

    > werwolf show-players
    Zeigt eine Liste mit allen Spielern an.
    
    > werwolf -r discord_name
    Löscht den Spieler mit dem Name discord_name. Mehreren mit Leerzeichen getrennte Name sind möglich.

    > werwolf -a discord_name
    Fügt den Spieler mit discord_name hinzu, nur möglich wenn der Spieler auch in dem channel ist.
    `);
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
    let txt = "Folgend Rollen wurden hinzugefügt: \n";
    txt = added_roles.reduce((acc, value) => acc + value + "\n", txt)
    if(added_roles.length > 0){
        msg.reply(txt);
    }else{
        msg.reply("Es wurden keine Rollen hinzugefügt.")
    }
}

module.exports.no_roles_added = (msg) => {
    msg.reply("Es wurden keine Rollen hinzugefügt.")
}

module.exports.removed_roles= (msg, removed_roles) => {
    let txt = "Folgend Rollen wurden gelöscht: \n";
    txt = removed_roles.reduce((acc, value) => acc + value + "\n", txt)
    msg.reply(txt);
}

module.exports.no_roles_removed = (msg) => {
    msg.reply("Es wurden keine Rollen gelöscht.");
}

module.exports.role_not_found = (msg, role) => {
    msg.reply(`Konnte nicht die Rolle ${role} finden.`)
}
