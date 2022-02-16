"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const os_1 = require("os");
const palavras_pt_br_1 = require("@andsfonseca/palavras-pt-br");
const view_1 = require("./view");
const chalk_1 = __importDefault(require("chalk"));
const discord_rpc_1 = require("discord-rpc");
const clipboardy = require('clipboardy');
const storage = require('node-persist');
class Game {
    static loadDatabase() {
        palavras_pt_br_1.Word.library = [...palavras_pt_br_1.BRISPELL, ...palavras_pt_br_1.UNVERSEDV2];
        this.words = palavras_pt_br_1.Word.getAllWords(this.WORD_SIZE, false, false, false, false);
        palavras_pt_br_1.Word.library = this.words;
        this.wordsWithoutAccents = this.words.map(a => a.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
        palavras_pt_br_1.Word.library = this.wordsWithoutAccents;
        this.dailyWord = palavras_pt_br_1.Word.getDailyWord();
    }
    static createKeyboard() {
        for (let i = 0; i < this.ALLOWED_LETTERS.length; i++) {
            this.keyboard[this.ALLOWED_LETTERS[i]] = this.DEFAULT_TEXT;
        }
    }
    static gameLoop() {
        let stdin = process.stdin;
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');
        stdin.on('data', (key) => {
            if (!this.isOver)
                this.onDetectAnyKeyDuringGame(key);
            else {
                process.exit();
            }
        });
    }
    static onDetectAnyKeyDuringGame(key) {
        let warning = "";
        let win = false;
        let keyAsString = key.toString();
        // ctrl-c -> Sair do Jogo
        //@ts-ignore
        if (key === '\u0003') {
            process.exit();
        }
        // backspace ou delete -> Apagar Palavra
        //@ts-ignore
        else if (key === '\b' || key == '\x1B[3~') {
            this.currentLetters.pop();
        }
        //Se Enter -> Próximo estado
        //@ts-ignore
        else if (key === '\r') {
            let word = this.currentLetters.join('').toLowerCase();
            if (this.currentLetters.length != 5) {
                warning = "Letra(s) faltando!";
            }
            else if (!palavras_pt_br_1.Word.checkValid(word)) {
                warning = "Esta palavra não existe!";
            }
            else {
                let validations = palavras_pt_br_1.Word.wordleValidator(this.dailyWord, word);
                let withAccent = this.words[this.wordsWithoutAccents.indexOf(word)];
                this.triedWords.push(withAccent.toUpperCase().split(""));
                this.triedWordsValidated.push(validations);
                this.currentAttempt++;
                //Estado de Win
                if (validations.every(v => v.exact === true)) {
                    this.isOver = true;
                    win = true;
                }
                //Estado de Perda
                else if (this.currentAttempt == this.ATTEMPTS) {
                    this.isOver = true;
                }
                else {
                    this.currentLetters = [];
                }
                this.UpdateRichPresence(this.currentAttempt + 1, this.renderBoard([validations], 5, false), this.isOver);
                view_1.View.renderKeyboard(this.keyboard, validations, this.WORD_SIZE, false);
            }
        }
        //Se ainda pode escrever faça
        else if (this.currentLetters.length < this.WORD_SIZE && this.ALLOWED_LETTERS.indexOf(keyAsString.toUpperCase()) > -1) {
            this.currentLetters.push(keyAsString.toUpperCase());
        }
        else {
            return;
        }
        this.loadBoard(warning, true, !this.isOver);
        if (this.isOver) {
            if (win)
                this.currentAttempt--;
            this.final(win, this.currentAttempt).then(() => {
                console.log("Clique em qualquer tecla para sair...");
            });
        }
    }
    static loadBoard(additionalWarning = "", clearBeforeRender = false, renderCleanTry = true) {
        if (clearBeforeRender)
            view_1.View.clearLine(this.boardSize);
        this.boardSize = 4;
        view_1.View.renderWarning("Tentativas restantes: " + (this.ATTEMPTS - this.currentAttempt), 1);
        for (let i = 0; i < this.currentAttempt; i++, this.boardSize++) {
            view_1.View.renderStatus(this.triedWords[i], this.triedWordsValidated[i]);
        }
        if (renderCleanTry) {
            view_1.View.renderStatus(this.currentLetters);
            this.boardSize++;
        }
        view_1.View.renderWarning(additionalWarning);
        view_1.View.renderKeyboard(this.keyboard);
    }
    static start() {
        this.EnableRichPresence();
        //Visualização Inicial
        view_1.View.clear();
        view_1.View.renderTitle(this.title);
        this.loadTips();
        //Carrega a Base de Dados
        this.loadDatabase();
        //Cria o teclado
        this.createKeyboard();
        //Carrega o tabuleiro
        this.loadBoard();
        //Game Loop
        this.gameLoop();
    }
    static final(win, position = 6) {
        return __awaiter(this, void 0, void 0, function* () {
            yield storage.init({ dir: os_1.homedir + "/.term-cli" });
            let count = yield storage.getItem('count');
            if (count == undefined) {
                yield this.resetStats();
                count = 0;
            }
            //Recupera as variavéis
            let wins = yield storage.getItem('wins');
            let stats = yield storage.getItem('stats');
            let lastGameString = yield storage.getItem('lastGame');
            let lastWinString = yield storage.getItem('lastWin');
            let lastGameDate = (lastGameString) ? new Date(new Date(lastGameString).toLocaleString("en-US", { timeZone: 'America/Recife' })) : new Date(2020, 0, 1);
            let lastWinDate = (lastWinString) ? new Date(lastWinString) : new Date(2020, 0, 1);
            //Condições para salvar as estatistícas
            //1. O ultimo jogo não deve ter sido jogado no mesmo dia
            let currentDate = new Date();
            if (lastGameDate == undefined ||
                lastGameDate.getDate() != currentDate.getDate() ||
                lastGameDate.getMonth() != currentDate.getMonth() ||
                lastGameDate.getFullYear() != currentDate.getFullYear()) {
                lastGameDate = currentDate;
                yield storage.setItem("lastGame", lastGameDate.toDateString());
                if (win) {
                    wins++;
                    lastWinDate = lastGameDate;
                    yield storage.setItem("lastWin", lastWinDate.toDateString());
                }
                count++;
                stats[position]++;
                yield storage.setItem("count", count);
                yield storage.setItem("wins", wins);
                yield storage.setItem("stats", stats);
            }
            let auxLastWin = "";
            if (lastWinString) {
                auxLastWin = lastWinDate.toLocaleDateString('pt-Br', { dateStyle: 'short' });
            }
            let wordWithAccents = this.words[this.wordsWithoutAccents.indexOf(this.dailyWord)];
            yield this.textToClipboard("Joguei term-cli! " + (position == 6 ? "❌" : (position + 1) + "/6"), this.renderBoard(this.triedWordsValidated));
            view_1.View.renderStaticts(count, wins, stats, lastGameDate.toLocaleDateString('pt-Br', { dateStyle: 'short' }), auxLastWin, wordWithAccents);
            view_1.View.renderWarning("Estatísticas do jogo copiadas para a área de transferência");
        });
    }
    static getBoardEmoction(validation) {
        if (validation.exact)
            return "🟩";
        if (validation.contains)
            return "🟨";
        return "🟥";
    }
    static renderBoard(validations, size = 5, includeSpaceOnFinal = true) {
        let s = "";
        for (let i = 0, len = validations.length; i < len; i++) {
            for (let j = 0; j < 5; j++) {
                s += this.getBoardEmoction(validations[i][j]);
            }
            if (i == len - 1 && !includeSpaceOnFinal)
                continue;
            s += "\n";
        }
        return s;
    }
    static textToClipboard(message, board) {
        return __awaiter(this, void 0, void 0, function* () {
            let s = message + "\n\n" + board + "\n\nInstale também em: https://www.npmjs.com/package/@andsfonseca/term-cli";
            yield clipboardy.write(s);
        });
    }
    static resetStats(store = undefined) {
        return __awaiter(this, void 0, void 0, function* () {
            if (store == undefined) {
                yield storage.init({ dir: os_1.homedir + "/.term-cli" });
                store = storage;
            }
            yield store.setItem("count", 0);
            yield store.setItem("wins", 0);
            yield store.setItem("stats", [0, 0, 0, 0, 0, 0, 0]);
            yield store.setItem("lastGame", undefined);
            yield store.setItem("lastWin", undefined);
        });
    }
    static loadTips() {
        view_1.View.renderSection("O objetivo é descobrir qual é a palavra correta em apenas 6 tentativas.", false);
        view_1.View.renderSection("A cada letra digitada que faz parte da palavra correta dicas serão exibidas, de acordo com as cores das letras, veja abaixo:", false);
        view_1.View.renderStatus(["P", "A", "L", "C", "O"], [{ exact: false, contains: false, word: "" }, { exact: true, contains: false, word: "A" }, { exact: false, contains: false, word: "" }, { exact: false, contains: false, word: "" }, { exact: false, contains: false, word: "" }]);
        view_1.View.renderSection("A letra " + chalk_1.default.green("A") + " está na posição correta.", false);
        view_1.View.renderStatus(["C", "E", "S", "T", "O"], [{ exact: false, contains: true, word: "C" }, { exact: false, contains: false, word: "" }, { exact: false, contains: false, word: "" }, { exact: false, contains: false, word: "" }, { exact: false, contains: false, word: "" }]);
        view_1.View.renderSection("A letra " + chalk_1.default.yellow("C") + " contém na palavra, mas em outra posição.", false);
        view_1.View.renderStatus(["L", "E", "I", "T", "E"], [{ exact: false, contains: false, word: "" }, { exact: false, contains: false, word: "" }, { exact: false, contains: false, word: "" }, { exact: false, contains: false, word: "T" }, { exact: false, contains: false, word: "" }]);
        view_1.View.renderSection("A letra " + chalk_1.default.red("T") + " não contém na palavra.", false);
        view_1.View.renderSection("Os acentos não são considerados nas dicas.");
    }
    static EnableRichPresence() {
        this.discordClient = new discord_rpc_1.Client({ transport: "ipc" });
        this.discordCurrentActivity = {
            details: "Tentando a palavra diária [1/6]",
            state: "Pensando...",
            assets: {
                large_image: "term-cli",
                large_text: "term-cli",
            },
            timestamps: { start: Date.now() },
            instance: true
        };
        this.discordClient.on("ready", () => {
            this.discordClientIsReady = true;
            this.discordClient.request("SET_ACTIVITY", { pid: process.pid, activity: this.discordCurrentActivity });
        });
        this.discordClient.login({ clientId: "943272235521675306" });
    }
    static UpdateRichPresence(attempt, board, isOver = false) {
        if (this.discordClientIsReady) {
            if (!isOver)
                this.discordCurrentActivity.details = "Tentando a palavra diária [" + attempt + "/6]";
            else
                this.discordCurrentActivity.details = "Vendo as estatísticas...";
            this.discordCurrentActivity.state = board,
                this.discordClient.request("SET_ACTIVITY", { pid: process.pid, activity: this.discordCurrentActivity });
        }
    }
}
exports.Game = Game;
Game.WORD_SIZE = 5;
Game.ATTEMPTS = 6;
Game.ALLOWED_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
Game.DEFAULT_TEXT = (s) => { return s; };
Game.words = [];
Game.wordsWithoutAccents = [];
Game.dailyWord = "";
Game.currentAttempt = 0;
Game.triedWords = [];
Game.triedWordsValidated = [];
Game.currentLetters = [];
Game.keyboard = {};
Game.boardSize = 5;
Game.isOver = false;
Game.title = "Game";
