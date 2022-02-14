import { Command } from "commander"
import chalk from "chalk"
import figlet from "figlet"

import PROJECT_SETTINGS from "./Strings.json"
import { Game } from "./game"

const BANNER: string = chalk.green(figlet.textSync('term-cli', { horizontalLayout: 'full' }))

const cli = () => {

    let commander = new Command()

    let program = commander.version(PROJECT_SETTINGS.version)
        .name('term-cli')
        .description(PROJECT_SETTINGS.description)
        .option('-r, --reset', 'Reinicializar estatísticas')
        .action((args) => {
            if(args.reset != undefined && args.reset){
                Game.resetStats().then(() => {
                    console.log("Estatistícas foram apagadas!")
                })
            }
            else{
                Game.title = BANNER
                Game.start()
            }
        })

    program.addHelpText('before', BANNER);

    program.parse(process.argv)
}

cli();
