import { BRISPELL, UNVERSEDV2, Word } from "@andsfonseca/palavras-pt-br";
import { View } from "./view";


export abstract class Game {

    private static readonly WORD_SIZE: number = 5
    private static readonly ATTEMPTS: number = 6
    private static readonly ALLOWED_LETTERS: string[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]
    private static readonly DEFAULT_TEXT =  (s: string) => { return s }

    private static words: string[] = []
    private static wordsWithoutAccents: string[] = []
    private static dailyWord: string = ""
    private static currentAttempt = 0
    private static triedWords: string[][] = []
    private static currentLetters: string[] = []
    private static keyboard: { [name: string]: (text: string) => string } = {}

    public static title: string = "Game"
    public static tips: string = "Dicas"

    private static loadDatabase() {
        Word.library = [...BRISPELL, ...UNVERSEDV2]
        this.words = Word.getAllWords(this.WORD_SIZE, false, false, false, false)
        Word.library = this.words
        this.wordsWithoutAccents = Word.getAllWords(this.WORD_SIZE, true)
        Word.library = this.wordsWithoutAccents
        this.dailyWord = Word.getDailyWord()
    }

    private static createKeyboard(){
        for (let i = 0; i < this.ALLOWED_LETTERS.length; i++) {
            this.keyboard[this.ALLOWED_LETTERS[i]] = this.DEFAULT_TEXT
        }
    }

    private static gameLoop(){
        let stdin = process.stdin;

        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');

        stdin.on('data',(key) => {
            this.OnKeyDetect(key)
        })
    }

    private static OnKeyDetect(key: Buffer){
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
            this.currentLetters.pop()
            View.clearLine(3)
        }
        //Se Enter -> Próximo estado
        //@ts-ignore
        else if (key === '\r') {
            let word = this.currentLetters.join('').toLowerCase()

            if (this.currentLetters.length != 5) {
                warning = "Letra(s) faltando!"
                View.clearLine(3)
            }
            else if (!Word.checkValid(word)) {
                warning = "Esta palavra não existe!"
                View.clearLine(3)
            }
            else {
                let validations = Word.wordleValidator(this.dailyWord, word)
                View.clearLine(3)
                View.renderStatus(this.currentLetters, validations)
                View.renderKeyboard(this.keyboard, validations, this.WORD_SIZE, false)
                this.currentLetters = []
                
            }

        }

        //Se ainda pode escrever faça
        else if (this.currentLetters.length < this.WORD_SIZE && this.ALLOWED_LETTERS.indexOf(keyAsString.toUpperCase()) > -1) {
            this.currentLetters.push(keyAsString.toUpperCase())
            View.clearLine(3)
        }
        else {
            return;
        }

        View.renderStatus(this.currentLetters)
        View.renderWarning(warning)
        View.renderKeyboard(this.keyboard)
    }

    public static start() {
        //Visualização Inicial
        View.clear()
        View.renderTitle(this.title)
        View.renderSection(this.tips)

        //Carrega a Base de Dados
        this.loadDatabase();

        //Cria o teclado
        this.createKeyboard();

        //Parte Inicial do Jogo
        View.renderStatus(this.currentLetters)
        View.renderWarning("")
        View.renderKeyboard(this.keyboard)
        
        //Game Loop
        this.gameLoop()
    }



}