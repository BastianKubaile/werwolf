module.exports.addRole = (game, args, lookup_table, msg, messages) => {
    let roles_added = [];
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
}