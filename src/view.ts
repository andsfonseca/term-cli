import { IWordleValidation } from "@andsfonseca/palavras-pt-br/dist/interfaces/wordleValidation"
import chalk from "chalk"

export abstract class View {
    
    static clear() {
        console.clear()
    }
    
    static clearLine(count: number = 1) {
        for (let i = 0; i < count; i++) {
            process.stdout.moveCursor(0, -1)
            process.stdout.clearLine(1)
        }
    }
    static renderSeparator = () => {
        const line = '-'.repeat(process.stdout.columns)
        console.log(line)
    }

    static renderTitle(title: string) {
        console.log(title)
        this.renderSeparator()
        console.log()
    }

    static renderSection(section: string, separate: boolean = true) {
        console.log(section)
        console.log()
        if (separate){
            this.renderSeparator()
            console.log()
        }
        
    }

    static renderWarning(text: string, space:number = 0) {
        console.log(chalk.blue(text))
        for (let i = 0; i < space; i++) console.log()
    }

    static renderStatus(letters: string[], validations: IWordleValidation[] | null = null, size :number = 5) {
        let len = letters.length
        let i = 0
        let string = ""

        let setColor: ((s: string) => string)[] = []

        if (validations == null)
            setColor = letters.map((_) => {
                return (s: string) => { return s }
            })

        else {
            setColor = validations.map((validation) => {
                if (validation.exact)
                    return chalk.green
                else if (validation.contains)
                    return chalk.yellow
                else if(validation.word == "")
                    return (s: string) => { return s }
                else
                    return chalk.red
            })
        }
        for (; i < len; i++)
            string += ". " + setColor[i](letters[i]) + " "

        for (; i < size; i++)
            string += ". " + "-" + " "

        string += "."

        console.log(string)
    }

    static renderKeyboard = (keyboard: { [name: string]: (text: string) => void }, validations: IWordleValidation[] | null = null, word_size = 5, render = true) => {

        if (validations != null) {
            for (let i = 0; i < word_size; i++) {
                let letter = validations[i].word.toUpperCase()
                if (validations[i].exact) {
                    keyboard[letter] = chalk.bgGreen
                }
                else if (validations[i].contains) {
                    if (keyboard[letter] != chalk.bgGreen)
                        keyboard[letter] = chalk.bgYellow
                }
                else {
                    if (keyboard[letter] != chalk.bgGreen && keyboard[letter] != chalk.bgYellow)
                        keyboard[letter] = chalk.bgRed
                }
            }
        }

        let string = ""
        for (let key in keyboard) {
            string += keyboard[key](key) + " ";
        }

        if (render)
            console.log(string)
    }

    static renderStaticts (games:  number, wins: number,  stats: number[], lastGameDateInfo: string, lastWinDateInfo: string, trueWord: string) {
        console.log()
        this.renderSeparator()
        console.log(chalk.blue("Jogos: " + games) + 
            chalk.blue("\tVitórias: ") + chalk.green(wins) + 
            chalk.blue("\tDerrotas: ") + chalk.red(games-wins) + chalk.blue("\t - ")  +
            chalk.blue(Math.floor(wins/games * 100) + "% de vitórias") +
            chalk.blue("\nÚltima Vitória: ") + chalk.yellow(lastWinDateInfo) +
            chalk.blue("\tÚltima Partida: ") + chalk.white(lastGameDateInfo) 
        )

        console.log()
        console.log("A palavra correta é " + chalk.green(trueWord) +"\n")
        let blocks = Math.floor(process.stdout.columns/8)
        let s = ""
        let icons = ["1 ","2 ","3 ","4 ","5 ","6 ","❌"]
        for(let i = 0, len = stats.length; i< len; i++){
                s += icons[i] +" "
            
            let n_blocks = Math.floor((stats[i]/games) * blocks)

            s += '🟦'.repeat(n_blocks) + " - " + stats[i] +"\n"
        }

        console.log(s)
    }
}