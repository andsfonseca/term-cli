import { homedir } from "os"
import { BRISPELL, IWordleValidation, UNVERSEDV2, Word } from "@andsfonseca/palavras-pt-br";
import { View } from "./view";
import chalk from "chalk";

import { Client } from "discord-rpc";

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
    private static discordClient: any;
    private static discordCurrentActivity: any;
    private static discordClientIsReady: boolean;

    public static title: string = "Game"

    private static loadDatabase() {
        Word.library = [...BRISPELL, ...UNVERSEDV2]
        this.words = Word.getAllWords(this.WORD_SIZE, false, false, false, false)
        Word.library = this.words
        this.wordsWithoutAccents = this.words.map(a => a.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
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

                let withAccent = this.words[this.wordsWithoutAccents.indexOf(word)]

                this.triedWords.push(withAccent.toUpperCase().split(""))
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
                this.UpdateRichPresence(this.currentAttempt + 1, this.renderBoard([validations], 5, false), this.isOver)
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

        this.EnableRichPresence()
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


    private static async final(win: boolean, position: number = 6,) {
        await storage.init({ dir: homedir + "/.term-cli" })

        let count: number | undefined = await storage.getItem('count')

        if (count == undefined) {
            await this.resetStats();
            count = 0
        }

        //Recupera as variavéis
        let wins = await storage.getItem('wins') as number
        let stats = await storage.getItem('stats') as number[]

        let lastGameString = await storage.getItem('lastGame') as string | undefined
        let lastWinString = await storage.getItem('lastWin') as string | undefined

        let lastGameDate = (lastGameString) ? new Date(new Date(lastGameString).toLocaleString("en-US", {timeZone: 'America/Recife'})) : new Date(2020, 0, 1)
        let lastWinDate = (lastWinString) ? new Date(lastWinString) : new Date(2020, 0, 1)

        //Condições para salvar as estatistícas
        //1. O ultimo jogo não deve ter sido jogado no mesmo dia
        let currentDate = new Date()

        if (lastGameDate == undefined || 
            lastGameDate.getDate() != currentDate.getDate() ||
            lastGameDate.getMonth() != currentDate.getMonth() ||
            lastGameDate.getFullYear() != currentDate.getFullYear()) {

            lastGameDate = currentDate

            await storage.setItem("lastGame", lastGameDate.toDateString())

            if (win) {
                wins++
                lastWinDate = lastGameDate
                await storage.setItem("lastWin", lastWinDate.toDateString())
            }

            count++
            stats[position]++
            await storage.setItem("count", count);
            await storage.setItem("wins", wins);
            await storage.setItem("stats", stats)
        }

        let auxLastWin = ""
        if (lastWinString) {
            auxLastWin = lastWinDate.toLocaleDateString('pt-Br', { dateStyle: 'short' })
        }

        let wordWithAccents = this.words[this.wordsWithoutAccents.indexOf(this.dailyWord)]

        await this.textToClipboard("Joguei term-cli! " + (position == 6 ? "❌" : (position + 1) + "/6"), this.renderBoard(this.triedWordsValidated))
        View.renderStaticts(count, wins, stats, lastGameDate.toLocaleDateString('pt-Br', { dateStyle: 'short' }), auxLastWin, wordWithAccents)

        View.renderWarning("Estatísticas do jogo copiadas para a área de transferência")
    }

    private static getBoardEmoction(validation: IWordleValidation) {
        if (validation.exact)
            return "🟩"
        if (validation.contains)
            return "🟨"
        return "🟥"
    }

    private static renderBoard(validations: IWordleValidation[][], size: number = 5, includeSpaceOnFinal = true): string {
        let s: string = ""

        for (let i = 0, len = validations.length; i < len; i++) {
            for (let j = 0; j < 5; j++) {
                s += this.getBoardEmoction(validations[i][j])
            }
            if (i == len - 1 && !includeSpaceOnFinal) continue;
            s += "\n"
        }

        return s
    }

    private static async textToClipboard(message: string, board: string) {
        let s: string = message + "\n\n" + board + "\n\nInstale também em: https://www.npmjs.com/package/@andsfonseca/term-cli"
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
        await store.setItem("lastGame", undefined)
        await store.setItem("lastWin", undefined)
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

    private static EnableRichPresence() {
        this.discordClient = new Client({ transport: "ipc" })

        this.discordCurrentActivity = {
            details: "Tentando a palavra diária [1/6]",
            state: "Pensando...",
            assets: {
                large_image: "term-cli",
                large_text: "term-cli",
            },
            timestamps: { start: Date.now() },
            instance: true
        }

        this.discordClient.on("ready", () => {
            this.discordClientIsReady = true
            this.discordClient.request("SET_ACTIVITY", { pid: process.pid, activity: this.discordCurrentActivity })
        })

        this.discordClient.login({ clientId: "943272235521675306" })
    }

    private static UpdateRichPresence(attempt: number, board: string, isOver: boolean = false) {
        if (this.discordClientIsReady) {
            if (!isOver)
                this.discordCurrentActivity.details = "Tentando a palavra diária [" + attempt + "/6]"
            else
                this.discordCurrentActivity.details = "Vendo as estatísticas..."

            this.discordCurrentActivity.state = board,

                this.discordClient.request("SET_ACTIVITY", { pid: process.pid, activity: this.discordCurrentActivity })
        }
    }




}