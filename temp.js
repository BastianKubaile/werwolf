const program = require('commander');

program.command("--add-role <arg1>")
    .action((arg1) => {
        console.log(arg1);
    });

console.log(process.argv);
process.argv[0] = "";
process.argv[1] = "";
program.parse(process.argv);
