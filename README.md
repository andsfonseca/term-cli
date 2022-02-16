# Term-CLI
![npm](https://img.shields.io/npm/v/@andsfonseca/term-cli) ![npm](https://img.shields.io/npm/dt/@andsfonseca/term-cli) ![GitHub issues](https://img.shields.io/github/issues/andsfonseca/term-cli) ![Github Workflow](https://github.com/andsfonseca/term-cli/actions/workflows/release.yml/badge.svg) ![GitHub contributors](https://img.shields.io/github/contributors/andsfonseca/term-cli) ![GitHub](https://img.shields.io/github/license/andsfonseca/term-cli) 
```
  _                                              _   _ 
 | |_    ___   _ __   _ __ ___             ___  | | (_)
 | __|  / _ \ | '__| | '_ ` _ \   _____   / __| | | | |
 | |_  |  __/ | |    | | | | | | |_____| | (__  | | | |
  \__|  \___| |_|    |_| |_| |_|          \___| |_| |_|
```

O clássico jogo de adivinhação de palavras no estilo Wordle, agora para linha de comando. Uma nova palavra a cada dia!

![term-cli](https://media.giphy.com/media/aUrOVeOzcJzP4A14Ma/giphy.gif)

## Instalação

> Talvez você preciso do Node.js instalado na sua máquina. Você pode instalar a versão mais recente atráves do site [nodejs.org](https://nodejs.org/en/)

Instale o pacote globalmente do repositório [npmjs.com](npmjs.com) através do comando

```shell
npm i @andsfonseca/term-cli -g
```

## Uso
Abra o terminal e execute:

```shell
term-cli
```

Para reinicializar as estatistícas do jogo, execute:

```shell
term-cli -r
```
ou 
```shell
term-cli --reset
```

## Informações importantes

* As cores e fontes do jogo podem variar de acordo com tema e estilo do seu terminal

## Dicionário de palavras

As palavras foram retiradas da biblioteca [palavras-pt-br](https://github.com/andsfonseca/palavras-pt-br).

A biblioteca contém diversos listas de palavras de diferentes fontes, incluindo a possibilidade de mistura-las ou customiza-las.

## Customização

Para cria sua própria versão do term-cli, com mais opções de customização, faça uma cópia do projeto.

```shell
git clone https://github.com/andsfonseca/term-cli.git
```

Váriaveis de fácil acesso, como número de tentativas e tamanho da palavra podem ser facilmente modificadas no arquivos do jogo.

## Interface do jogo

### Dicas Iniciais

> Exibidas no ínicio de cada partida

![image](https://user-images.githubusercontent.com/7833466/154311322-9f3c5060-3166-48b1-bb8b-8d233b356216.png)

### Tabuleiro

> Exibida durante o jogo

![image](https://user-images.githubusercontent.com/7833466/154312470-ae017502-b27a-472d-a93c-8c1f1c2760b2.png)

### Estatísticas

> Apresenta as estatísticas diárias e copia um texto compartilhável na área de transferência

![image](https://user-images.githubusercontent.com/7833466/154313145-39586663-a574-4908-877d-021e04ec21a3.png)

```
Joguei term-cli! 3/6

🟨🟥🟥🟥🟥
🟥🟨🟩🟥🟨
🟩🟩🟩🟩🟩

Instale também em: https://www.npmjs.com/package/@andsfonseca/term-cli
```
## Issues

Sinta-se livre para contribuir com o projeto.

## Contribuições

1. Crie uma cópia do projeto (fork)
2. Crie uma _branch_ com sua modificação (`git checkout -b my-new-resource`)
3. Faça um commit _commit_ (`git commit -am 'Adding a new resource...'`)
4. _Push_ (`git push origin my-new-resource`)
5. Crie uma _Pull Request_ 
