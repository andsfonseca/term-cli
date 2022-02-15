import { homedir } from "os"
import { BRISPELL, IWordleValidation, UNVERSEDV2, Word } from "@andsfonseca/palavras-pt-br";
import { View } from "./view";
import chalk from "chalk";

const clipboardy = require('clipboardy');
const storage = require('node-persist');

export abstract class Game {

    private static readonly WORD_SIZE: number = 5
    private static readonly ATTEMPTS: number = 6
    private static readonly ALLOWED_LETTERS: string[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]
    private static readonly DEFAULT_TEXT = (s: string) => { return s }

    private static words: string[] = []
    private static wordsWithoutAccents: string[] = []
    private static dailyWord: string = ""
    private static currentAttempt = 0
    private static triedWords: string[][] = []
    private static triedWordsValidated: IWordleValidation[][] = []
    private static currentLetters: string[] = []
    private static keyboard: { [name: string]: (text: string) => string } = {}
    private static boardSize: number = 5;
    private static isOver = false;

    public static title: string = "Game"

    private static loadDatabase() {
        Word.library = [...BRISPELL, ...UNVERSEDV2]
        this.words = Word.getAllWords(this.WORD_SIZE, false, false, false, false)
        Word.library = this.words
        this.wordsWithoutAccents = Word.getAllWords(this.WORD_SIZE, true)
        Word.library = this.wordsWithoutAccents
        this.dailyWord = Word.getDailyWord()
    }

    private static createKeyboard() {
        for (let i = 0; i < this.ALLOWED_LETTERS.length; i++) {
            this.keyboard[this.ALLOWED_LETTERS[i]] = this.DEFAULT_TEXT
        }
    }

    private static gameLoop() {
        let stdin = process.stdin;

        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');

        stdin.on('data', (key) => {
            if (!this.isOver)
                this.onDetectAnyKeyDuringGame(key)
            else {
                process.exit();
            }
        })
    }


    private static onDetectAnyKeyDuringGame(key: Buffer) {
        let warning = ""
        let win = false

        let keyAsString = key.toString()
        // ctrl-c -> Sair do Jogo
        //@ts-ignore
        if (key === '\u0003') {
            process.exit();
        }

        // backspace ou delete -> Apagar Palavra
        //@ts-ignore
        else if (key === '\b' || key == '\x1B[3~') {
            this.currentLetters.pop()
        }
        //Se Enter -> Próximo estado
        //@ts-ignore
        else if (key === '\r') {
            let word = this.currentLetters.join('').toLowerCase()

            if (this.currentLetters.length != 5) {
                warning = "Letra(s) faltando!"
            }
            else if (!Word.checkValid(word)) {
                warning = "Esta palavra não existe!"
            }
            else {
                let validations = Word.wordleValidator(this.dailyWord, word)

                this.triedWords.push(this.currentLetters)
                this.triedWordsValidated.push(validations)
                this.currentAttempt++

                //Estado de Win
                if (validations.every(v => v.exact === true)) {
                    this.isOver = true
                    win = true
                }
                //Estado de Perda
                else if (this.currentAttempt == this.ATTEMPTS) {
                    this.isOver = true
                }
                else {
                    this.currentLetters = []
                }
                View.renderKeyboard(this.keyboard, validations, this.WORD_SIZE, false)
            }

        }

        //Se ainda pode escrever faça
        else if (this.currentLetters.length < this.WORD_SIZE && this.ALLOWED_LETTERS.indexOf(keyAsString.toUpperCase()) > -1) {
            this.currentLetters.push(keyAsString.toUpperCase())
        }
        else {
            return;
        }

        this.loadBoard(warning, true, !this.isOver)

        if (this.isOver) {
            if (win) this.currentAttempt--
            this.final(win, this.currentAttempt).then(() => {
                console.log("Clique em qualquer tecla para sair...")
            })
        }
    }

    private static loadBoard(additionalWarning: string = "", clearBeforeRender = false, renderCleanTry = true) {
        if (clearBeforeRender)
            View.clearLine(this.boardSize)

        this.boardSize = 4

        View.renderWarning("Tentativas restantes: " + (this.ATTEMPTS - this.currentAttempt), 1)
        for (let i = 0; i < this.currentAttempt; i++, this.boardSize++) {
            View.renderStatus(this.triedWords[i], this.triedWordsValidated[i])
        }
        if (renderCleanTry) {
            View.renderStatus(this.currentLetters)
            this.boardSize++
        }

        View.renderWarning(additionalWarning)
        View.renderKeyboard(this.keyboard)

    }

    public static start() {
        //Visualização Inicial
        View.clear()
        View.renderTitle(this.title)
        this.loadTips()

        //Carrega a Base de Dados
        this.loadDatabase();

        //Cria o teclado
        this.createKeyboard();

        //Carrega o tabuleiro
        this.loadBoard()

        //Game Loop
        this.gameLoop()
    }


    private static async final(win: boolean, position: number = 6) {
        await storage.init({ dir: homedir + "/.term-cli" })

        let count: number | undefined = await storage.getItem('count')

        if (count == undefined) {
            console.log("")
            await this.resetStats();
            count = 0
        }

        let wins = await storage.getItem('wins') as number
        let stats = await storage.getItem('stats') as number[]
        let date = await storage.getItem('lastGame') as Date

        if (win) {
            wins++
        }
        count++

        stats[position]++
        date = new Date()

        await storage.setItem("count", count);
        await storage.setItem("wins", wins);
        await storage.setItem("stats", stats)
        await storage.setItem("lastGame", date)

        await this.textToClipboard("Joguei term-cli! " + (position == 6 ? "❌" : (position + 1) + "/6"), this.renderBoard(this.triedWordsValidated))
        View.renderStaticts(count, wins, stats)

        View.renderWarning("Estatísticas do jogo copiadas para a área de transferência")
    }

    private static getBoardEmoction(validation: IWordleValidation) {
        if (validation.exact)
            return "🟩"
        if (validation.contains)
            return "🟨"
        return "🟥"
    }

    private static renderBoard(validations: IWordleValidation[][], size: number = 5): string {
        let s: string = ""

        for (let i = 0, len = validations.length; i < len; i++) {
            for (let j = 0; j < 5; j++) {
                s += this.getBoardEmoction(validations[i][j])
            }
            s += "\n"
        }

        return s
    }

    private static async textToClipboard(message: string, board: string) {
        let s: string = message + "\n\n" + board
        await clipboardy.write(s);
    }

    public static async resetStats(store: any = undefined) {

        if (store == undefined) {
            await storage.init({ dir: homedir + "/.term-cli" })
            store = storage
        }
        await store.setItem("count", 0);
        await store.setItem("wins", 0);
        await store.setItem("stats", [0, 0, 0, 0, 0, 0, 0])
        let d = new Date()
        d.setDate(d.getDate() - 5)
        await store.setItem("lastGame", d)
    }

    private static loadTips() {
        View.renderSection("O objetivo é descobrir qual é a palavra correta em apenas 6 tentativas.", false)
        View.renderSection("A cada letra digitada que faz parte da palavra correta dicas serão exibidas, de acordo com as cores das letras, veja abaixo:", false)
        View.renderStatus(["P", "A", "L", "C", "O"], [{ exact: false, contains: false, word: "" }, { exact: true, contains: false, word: "A" }, { exact: false, contains: false, word: "" }, { exact: false, contains: false, word: "" }, { exact: false, contains: false, word: "" }])
        View.renderSection("A letra " + chalk.green("A") + " está na posição correta.", false)
        View.renderStatus(["C", "E", "S", "T", "O"], [{ exact: false, contains: true, word: "C" }, { exact: false, contains: false, word: "" }, { exact: false, contains: false, word: "" }, { exact: false, contains: false, word: "" }, { exact: false, contains: false, word: "" }])
        View.renderSection("A letra " + chalk.yellow("C") + " contém na palavra, mas em outra posição.", false)
        View.renderStatus(["L", "E", "I", "T", "E"], [{ exact: false, contains: false, word: "" }, { exact: false, contains: false, word: "" }, { exact: false, contains: false, word: "" }, { exact: false, contains: false, word: "T" }, { exact: false, contains: false, word: "" }])
        View.renderSection("A letra " + chalk.red("T") + " não contém na palavra.", false)
        View.renderSection("Os acentos não são considerados nas dicas.")
    }





}