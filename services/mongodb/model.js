const mongoose = require("mongoose");

var game_schema = new mongoose.Schema({
        _id: String,
        game_master: {id: String, status: String, name:String},
        state: {cards_dealed: Boolean, selected_roles: [String], used_roles: [String]},
        settings: {villager: Number, direwolf: Number, roles: Number },
        players: [{id: String, status: String, role: String, name: String}],
        date: Date,
})

mongoose.model("games", game_schema);