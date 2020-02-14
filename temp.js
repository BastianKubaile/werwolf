const program = require('commander');
const args = ["", "", "-a", "Der", "-a", "Alte"]

const collect = (value, previous) => {
    return previous.concat([value])
}

program.option("-a, --add-role <name>", "adds the roles", collect, []);
program.parse(args);

console.log(program.addRole);
