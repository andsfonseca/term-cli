"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
const palavras_pt_br_1 = require("@andsfonseca/palavras-pt-br");
const Strings_json_1 = __importDefault(require("./Strings.json"));
const WORD_SIZE = 5;
palavras_pt_br_1.Word.library = [...palavras_pt_br_1.BRISPELL, ...palavras_pt_br_1.UNVERSEDV2];
const WORDS = palavras_pt_br_1.Word.getAllWords(WORD_SIZE, false, false, false, false);
palavras_pt_br_1.Word.library = WORDS;
const WORDS_WITHOUT_ACCENTS = palavras_pt_br_1.Word.getAllWords(WORD_SIZE, true);
palavras_pt_br_1.Word.library = WORDS_WITHOUT_ACCENTS;
const TRYS = 6;
const BANNER = chalk_1.default.green(figlet_1.default.textSync('term-cli', { horizontalLayout: 'full' }));
const ALLOWED_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
const ClearLine = (count = 1) => {
    for (let i = 0; i < count; i++) {
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(1);
    }
};
const RenderSeparator = () => {
    const line = '-'.repeat(process.stdout.columns);
    console.log(line);
};
const RenderTitleInterface = () => {
    console.clear();
    console.log(BANNER);
    RenderSeparator();
    console.log();
};
const RenderTips = () => {
    console.log("Dicas");
    console.log();
    RenderSeparator();
    console.log();
};
const RenderStatus = (letters, validations = null) => {
    let len = letters.length;
    let i = 0;
    let string = "";
    let setColor = [];
    if (validations == null)
        setColor = letters.map((_) => {
            return (s) => { return s; };
        });
    else {
        setColor = validations.map((validation) => {
            if (validation.exact)
                return chalk_1.default.green;
            else if (validation.contains)
                return chalk_1.default.yellow;
            else
                return chalk_1.default.red;
        });
    }
    for (; i < len; i++)
        string += ". " + setColor[i](letters[i]) + " ";
    for (; i < WORD_SIZE; i++)
        string += ". " + "-" + " ";
    string += ".";
    console.log(string);
};
const RenderWarning = (text) => {
    console.log(chalk_1.default.blue(text));
};
const RenderKeyboard = (keyboard, validations = null, render = true) => {
    if (validations != null) {
        for (let i = 0; i < WORD_SIZE; i++) {
            let letter = validations[i].word.toUpperCase();
            if (validations[i].exact) {
                keyboard[letter] = chalk_1.default.bgGreen;
            }
            else if (validations[i].contains) {
                if (keyboard[letter] != chalk_1.default.bgGreen)
                    keyboard[letter] = chalk_1.default.bgYellow;
            }
            else {
                if (keyboard[letter] != chalk_1.default.bgGreen && keyboard[letter] != chalk_1.default.bgYellow)
                    keyboard[letter] = chalk_1.default.bgRed;
            }
        }
    }
    let string = "";
    for (let key in keyboard) {
        string += keyboard[key](key) + " ";
    }
    if (render)
        console.log(string);
};
const Game = () => {
    let dailyWord = palavras_pt_br_1.Word.getDailyWord();
    let lastTries = [];
    let letters = [];
    let currentTry = 0;
    let keyboard = {};
    for (let i = 0; i < ALLOWED_LETTERS.length; i++) {
        keyboard[ALLOWED_LETTERS[i]] = (s) => { return s; };
    }
    let stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    // Para cada dado enviado faça
    stdin.on('data', function (key) {
        let warning = "";
        let keyAsString = key.toString();
        // ctrl-c -> Sair do Jogo
        //@ts-ignore
        if (key === '\u0003') {
            process.exit();
        }
        // backspace ou delete -> Apagar Palavra
        //@ts-ignore
        else if (key === '\b' || key == '\x1B[3~') {
            letters.pop();
            ClearLine(3);
        }
        //Se Enter -> Próximo estado
        //@ts-ignore
        else if (key === '\r') {
            let word = letters.join('').toLowerCase();
            if (letters.length != 5) {
                warning = "Letra(s) faltando!";
                ClearLine(3);
            }
            else if (!palavras_pt_br_1.Word.checkValid(word)) {
                warning = "Esta palavra não existe!";
                ClearLine(3);
            }
            else {
                let validations = palavras_pt_br_1.Word.wordleValidator(dailyWord, word);
                ClearLine(3);
                RenderStatus(letters, validations);
                RenderKeyboard(keyboard, validations, false);
                letters = [];
            }
        }
        //Se ainda pode escrever faça
        else if (letters.length < WORD_SIZE && ALLOWED_LETTERS.indexOf(keyAsString.toUpperCase()) > -1) {
            letters.push(keyAsString.toUpperCase());
            ClearLine(3);
        }
        else {
            return;
        }
        RenderStatus(letters);
        RenderWarning(warning);
        RenderKeyboard(keyboard);
    });
    RenderStatus(letters);
    RenderWarning("");
    RenderKeyboard(keyboard);
};
const main = () => {
    RenderTitleInterface();
    RenderTips();
    Game();
};
const cli = () => {
    let commander = new commander_1.Command();
    let program = commander.version(Strings_json_1.default.version)
        .name('term-cli')
        .description(Strings_json_1.default.description)
        .action((args) => {
        main();
    });
    program.addHelpText('before', BANNER);
    program.parse(process.argv);
};
cli();
