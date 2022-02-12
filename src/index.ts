import { Command } from "commander"
import chalk from "chalk"
import figlet from "figlet"
import { IWordleValidation, Word, BRISPELL, UNVERSEDV2 } from "@andsfonseca/palavras-pt-br"

import PROJECT_SETTINGS from "./Strings.json"


const WORD_SIZE = 5
Word.library = [...BRISPELL, ...UNVERSEDV2]
const WORDS = Word.getAllWords(WORD_SIZE, false, false, false, false)
Word.library = WORDS
const WORDS_WITHOUT_ACCENTS = Word.getAllWords(WORD_SIZE, true)
Word.library = WORDS_WITHOUT_ACCENTS

const TRYS = 6

const BANNER: string = chalk.green(figlet.textSync('term-cli', { horizontalLayout: 'full' }))

const ALLOWED_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

const 

const ClearLine = (count = 1) => {
    for (let i = 0; i < count; i++) {
        process.stdout.moveCursor(0, -1)
        process.stdout.clearLine(1)
    }
}



const RenderSeparator = () => {
    const line = '-'.repeat(process.stdout.columns)
    console.log(line)
}

const RenderTitleInterface = () => {
    console.clear()
    console.log(BANNER)
    RenderSeparator()
    console.log()
}

const RenderTips = () => {

    console.log("Dicas")
    console.log()
    RenderSeparator()
    console.log()
}

const RenderStatus = (letters: string[], validations: IWordleValidation[] | null = null) => {
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
            if(validation.exact)
                return chalk.green
            else if (validation.contains)
                return chalk.yellow
            else
                return chalk.red
        })
    }
    for (; i < len; i++)
        string += ". " + setColor[i](letters[i]) + " "

    for (; i < WORD_SIZE; i++)
        string += ". " + "-" + " "

    string += "."

    console.log(string)
}

const RenderWarning = (text: string) => {
    console.log(chalk.blue(text))
}
const RenderKeyboard = (keyboard: { [name: string]: (text: string) => void }, validations: IWordleValidation[] | null = null, render = true) => {

    if (validations != null){
        for(let i = 0; i< WORD_SIZE; i++){
            let letter = validations[i].word.toUpperCase()
            if(validations[i].exact){
                keyboard[letter] = chalk.bgGreen
            }
            else if(validations[i].contains){
                if (keyboard[letter] != chalk.bgGreen)
                    keyboard[letter] = chalk.bgYellow
            }
            else{
                if (keyboard[letter] != chalk.bgGreen && keyboard[letter] != chalk.bgYellow)
                    keyboard[letter] = chalk.bgRed
            }
        }
    }

    let string = ""
    for (let key in keyboard) {
        string += keyboard[key](key) + " ";
    }

    if(render)
        console.log(string)
}


const Game = () => {

    let dailyWord = Word.getDailyWord()
    let lastTries = []
    let letters: string[] = []

    let currentTry = 0

    let keyboard: { [name: string]: (text: string) => string } = {}

    for (let i = 0; i < ALLOWED_LETTERS.length; i++) {
        keyboard[ALLOWED_LETTERS[i]] = (s: string) => { return s }
    }

    let stdin = process.stdin;

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    // Para cada dado enviado faça
    stdin.on('data', function (key) {
        let warning = ""
        let keyAsString = key.toString()
        // ctrl-c -> Sair do Jogo
        //@ts-ignore
        if (key === '\u0003') {
            process.exit();
        }

        // backspace ou delete -> Apagar Palavra
        //@ts-ignore
        else if (key === '\b' || key == '\x1B[3~') {
            letters.pop()
            ClearLine(3)
        }
        //Se Enter -> Próximo estado
        //@ts-ignore
        else if (key === '\r') {
            let word = letters.join('').toLowerCase()

            if (letters.length != 5) {
                warning = "Letra(s) faltando!"
                ClearLine(3)
            }
            else if (!Word.checkValid(word)) {
                warning = "Esta palavra não existe!"
                ClearLine(3)
            }
            else {
                let validations = Word.wordleValidator(dailyWord, word)
                ClearLine(3)
                RenderStatus(letters, validations)
                RenderKeyboard(keyboard, validations, false)
                letters = []
                
            }

        }

        //Se ainda pode escrever faça
        else if (letters.length < WORD_SIZE && ALLOWED_LETTERS.indexOf(keyAsString.toUpperCase()) > -1) {
            letters.push(keyAsString.toUpperCase())
            ClearLine(3)
        }
        else {
            return;
        }

        RenderStatus(letters)
        RenderWarning(warning)
        RenderKeyboard(keyboard)

    });

    RenderStatus(letters)
    RenderWarning("")
    RenderKeyboard(keyboard)
}


const main = () => {

    RenderTitleInterface()
    RenderTips()

    Game()




}


const cli = () => {

    let commander = new Command()

    let program = commander.version(PROJECT_SETTINGS.version)
        .name('term-cli')
        .description(PROJECT_SETTINGS.description)
        .action((args) => {
            main()
        })

    program.addHelpText('before', BANNER);

    program.parse(process.argv)
}

cli();
