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
    static renderTitle(title) {
        console.log(title);
        this.renderSeparator();
        console.log();
    }
    static renderSection(section) {
        console.log(section);
        console.log();
        this.renderSeparator();
        console.log();
    }
    static renderWarning(text) {
        console.log(chalk_1.default.blue(text));
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
    static clearLine(count = 1) {
        for (let i = 0; i < count; i++) {
            process.stdout.moveCursor(0, -1);
            process.stdout.clearLine(1);
        }
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
