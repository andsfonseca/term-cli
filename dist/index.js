"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
const Strings_json_1 = __importDefault(require("./Strings.json"));
const game_1 = require("./game");
const BANNER = chalk_1.default.green(figlet_1.default.textSync('term-cli', { horizontalLayout: 'full' }));
const cli = () => {
    let commander = new commander_1.Command();
    let program = commander.version(Strings_json_1.default.version)
        .name('term-cli')
        .description(Strings_json_1.default.description)
        .action((args) => {
        game_1.Game.title = BANNER;
        game_1.Game.start();
    });
    program.addHelpText('before', BANNER);
    program.parse(process.argv);
};
cli();
