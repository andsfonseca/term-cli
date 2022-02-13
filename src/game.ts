import { BRISPELL, IWordleValidation, UNVERSEDV2, Word } from "@andsfonseca/palavras-pt-br";
import { View } from "./view";
import { homedir }  from "os"

const storage = require('node-persist');

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
    private static triedWordsValidated: IWordleValidation[][] = []
    private static currentLetters: string[] = []
    private static keyboard: { [name: string]: (text: string) => string } = {}
    private static boardSize : number= 5;
    private static isOver = false;

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
            if(!this.isOver)
                this.onDetectAnyKeyDuringGame(key)
            else{
                process.exit();
            }
        })
    }

    
    private static onDetectAnyKeyDuringGame(key: Buffer){
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
                if(validations.every(v => v.exact === true)){
                    this.isOver = true
                    win = true
                }
                //Estado de Perda
                else if (this.currentAttempt == this.ATTEMPTS){
                    this.isOver = true
                }
                else{
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
        
        if(this.isOver){
            this.final(win, this.currentAttempt).then( () => {
                console.log("Clique em qualquer tecla para sair...")
            })
        }
    }
    
    private static loadBoard(additionalWarning : string = "", clearBeforeRender = false, renderCleanTry = true){
        if(clearBeforeRender)
        View.clearLine(this.boardSize)
        
        this.boardSize = 4
        
        View.renderWarning("Tentativas restantes: " + (this.ATTEMPTS - this.currentAttempt), 1)
        for(let i = 0; i< this.currentAttempt; i++, this.boardSize++){
            View.renderStatus(this.triedWords[i], this.triedWordsValidated[i])
        }
        if(renderCleanTry){
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
        View.renderSection(this.tips)
        
        //Carrega a Base de Dados
        this.loadDatabase();
        
        //Cria o teclado
        this.createKeyboard();
        
        //Carrega o tabuleiro
        this.loadBoard()
        
        //Game Loop
        this.gameLoop()
    }
    
    private static async final(win: boolean, position : number = 6){
        await storage.init({dir: homedir + "/.term-cli"})

        let count : number | undefined = await storage.getItem('count')
        
        if(count == undefined){
            console.log("")
            await this.resetStats();
            count = 0
        }

        let wins = await storage.getItem('wins') as number
        let stats = await storage.getItem('stats') as number[]
        let date = await storage.getItem('lastGame') as Date

        if(win){
            wins++
        }
        count++

        stats[position]++
        date = new Date()

        await storage.setItem("count", count);
        await storage.setItem("wins", wins);
        await storage.setItem("stats", stats)
        await storage.setItem("lastGame", date)

        View.renderStaticts(count, wins, stats)
        View.renderBoard(this.triedWordsValidated)
        View.renderWarning("Estatísticas do jogo copiadas para a área de transferência")
    }

    private static async resetStats(store:any = undefined){

        if(store == undefined){
            storage.init({dir: homedir + "/.term-cli"}).then( (_: any) => {
                this.resetStats(storage)
            })
        }
        else{
            await storage.setItem("count", 0);
            await storage.setItem("wins", 0);
            await storage.setItem("stats", [0,0,0,0,0,0,0])
            let d = new Date()
            d.setDate(d.getDate() - 5)
            await storage.setItem("lastGame", d)
        }

    }
    
    
    
    
    
}