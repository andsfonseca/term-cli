"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const palavras_pt_br_1 = require("@andsfonseca/palavras-pt-br");
const view_1 = require("./view");
class Game {
    static loadDatabase() {
        palavras_pt_br_1.Word.library = [...palavras_pt_br_1.BRISPELL, ...palavras_pt_br_1.UNVERSEDV2];
        this.words = palavras_pt_br_1.Word.getAllWords(this.WORD_SIZE, false, false, false, false);
        palavras_pt_br_1.Word.library = this.words;
        this.wordsWithoutAccents = palavras_pt_br_1.Word.getAllWords(this.WORD_SIZE, true);
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
            this.OnKeyDetect(key);
        });
    }
    static OnKeyDetect(key) {
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
            this.currentLetters.pop();
            view_1.View.clearLine(3);
        }
        //Se Enter -> Próximo estado
        //@ts-ignore
        else if (key === '\r') {
            let word = this.currentLetters.join('').toLowerCase();
            if (this.currentLetters.length != 5) {
                warning = "Letra(s) faltando!";
                view_1.View.clearLine(3);
            }
            else if (!palavras_pt_br_1.Word.checkValid(word)) {
                warning = "Esta palavra não existe!";
                view_1.View.clearLine(3);
            }
            else {
                let validations = palavras_pt_br_1.Word.wordleValidator(this.dailyWord, word);
                view_1.View.clearLine(3);
                view_1.View.renderStatus(this.currentLetters, validations);
                view_1.View.renderKeyboard(this.keyboard, validations, this.WORD_SIZE, false);
                this.currentLetters = [];
            }
        }
        //Se ainda pode escrever faça
        else if (this.currentLetters.length < this.WORD_SIZE && this.ALLOWED_LETTERS.indexOf(keyAsString.toUpperCase()) > -1) {
            this.currentLetters.push(keyAsString.toUpperCase());
            view_1.View.clearLine(3);
        }
        else {
            return;
        }
        view_1.View.renderStatus(this.currentLetters);
        view_1.View.renderWarning(warning);
        view_1.View.renderKeyboard(this.keyboard);
    }
    static start() {
        //Visualização Inicial
        view_1.View.clear();
        view_1.View.renderTitle(this.title);
        view_1.View.renderSection(this.tips);
        //Carrega a Base de Dados
        this.loadDatabase();
        //Cria o teclado
        this.createKeyboard();
        //Parte Inicial do Jogo
        view_1.View.renderStatus(this.currentLetters);
        view_1.View.renderWarning("");
        view_1.View.renderKeyboard(this.keyboard);
        //Game Loop
        this.gameLoop();
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
Game.currentLetters = [];
Game.keyboard = {};
Game.title = "Game";
Game.tips = "Dicas";
