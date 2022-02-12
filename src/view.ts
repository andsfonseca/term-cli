import { IWordleValidation } from "@andsfonseca/palavras-pt-br/dist/interfaces/wordleValidation"
import chalk from "chalk"

export abstract class View {

    static clear() {
        console.clear()
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

    static renderSection(section: string) {
        console.log(section)
        console.log()
        this.renderSeparator()
        console.log()
    }

    static renderWarning(text: string) {
        console.log(chalk.blue(text))
    }

    static renderStatus(letters: string[], validations: IWordleValidation[] | null = null, word_size = 5) {
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
                else
                    return chalk.red
            })
        }
        for (; i < len; i++)
            string += ". " + setColor[i](letters[i]) + " "

        for (; i < word_size; i++)
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

    static clearLine(count: number = 1) {
        for (let i = 0; i < count; i++) {
            process.stdout.moveCursor(0, -1)
            process.stdout.clearLine(1)
        }
    }

}