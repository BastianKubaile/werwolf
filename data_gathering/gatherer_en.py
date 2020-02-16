import re
import json

f = open("./roles_en.txt", "r", encoding="utf-8")
w = open("../services/en/roles.js", "w", encoding="utf-8")

roles = {}
editions = ["Basic Game", "New Moon", "The Village", "Characters"]
editions_i = 0
for edition in editions:
    roles[edition] = [];  
roles["lookup_table"] = {}

name = ""
description = ""
for line in f:
    roles_edition = roles[editions[editions_i]]
    if(line == "new edition"):
        editions_i = editions_i + 1
        continue
    if(line == "\n"):
        roles_edition.append({"name": name, "description": description})
        roles["lookup_table"][name] = description
        name = ""
        description = ""
    elif(name == ""):
        line = line[:line.index("\n")]
        if(line.find("/") >= 0):
            line = line[:line.index("/")]
        name = line
    else:
        line = line[:line.index("\n")]
        description = line 

w.write("module.exports = " + json.dumps(roles, ensure_ascii=False).encode("utf-8").decode("utf-8"))