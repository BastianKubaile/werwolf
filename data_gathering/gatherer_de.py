import re
import json

f = open("./roles_de.txt", "r", encoding="utf-8")
w = open("../services/de/roles.js", "w", encoding="utf-8")

roles = {}
editions = ["Grundspiel", "Neumond", "Die Gemeinde", "Charaktere"]
editions_i = 0
for edition in editions:
    roles[edition] = [];  
roles["lookup_table"] = {}

for line in f:
    roles_edition = roles[editions[editions_i]]
    if(line == "\n"):
        editions_i = editions_i + 1
        continue
    name = re.findall("^.{0,40}:", line)[0][:-1] #Matches starting of String folowed by up to 40 chars and a :
    description = line[len(name)+2:]
    roles_edition.append({"name": name, "description": description})
    roles["lookup_table"][name] = description

w.write("module.exports = " + json.dumps(roles, ensure_ascii=False).encode("utf-8").decode("utf-8"))