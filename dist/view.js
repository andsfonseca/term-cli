"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.View = void 0;
const chalk_1 = __importDefault(require("chalk"));
class View {
    static clear() {
        console.clear();
    }
    static clearLine(count = 1) {
        for (let i = 0; i < count; i++) {
            process.stdout.moveCursor(0, -1);
            process.stdout.clearLine(1);
        }
    }
    static renderTitle(title) {
        console.log(title);
        this.renderSeparator();
        console.log();
    }
    static renderSection(section, separate = true) {
        console.log(section);
        console.log();
        if (separate) {
            this.renderSeparator();
            console.log();
        }
    }
    static renderWarning(text, space = 0) {
        console.log(chalk_1.default.blue(text));
        for (let i = 0; i < space; i++)
            console.log();
    }
    static renderStatus(letters, validations = null, word_size = 5) {
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
        for (; i < word_size; i++)
            string += ". " + "-" + " ";
        string += ".";
        console.log(string);
    }
    static renderStaticts(games, wins, stats) {
        console.log();
        this.renderSeparator();
        console.log(chalk_1.default.blue("Jogos: " + games) + chalk_1.default.blue("\tVitórias: ") + chalk_1.default.green(wins) + chalk_1.default.blue("\tDerrotas: ") + chalk_1.default.red(games - wins) + chalk_1.default.blue("\t - ") + chalk_1.default.blue(Math.floor(wins / games * 100) + "% de vitórias"));
        console.log();
        let blocks = Math.floor(process.stdout.columns / 8);
        let s = "";
        let icons = ["1 ", "2 ", "3 ", "4 ", "5 ", "6 ", "❌"];
        for (let i = 0, len = stats.length; i < len; i++) {
            s += icons[i] + " ";
            let n_blocks = Math.floor((stats[i] / games) * blocks);
            s += '🟦'.repeat(n_blocks) + " - " + stats[i] + "\n";
        }
        console.log(s);
    }
}
exports.View = View;
View.renderSeparator = () => {
    const line = '-'.repeat(process.stdout.columns);
    console.log(line);
};
View.renderKeyboard = (keyboard, validations = null, word_size = 5, render = true) => {
    if (validations != null) {
        for (let i = 0; i < word_size; i++) {
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
