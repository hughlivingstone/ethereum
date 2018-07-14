import React, { Component } from 'react'
import GameHubContract from '../build/contracts/GameHub.json'
import RpsContact from '../build/contracts/RockPaperScissors.json'
import getWeb3 from './utils/getWeb3'

import CreateGame from './CreateGame.jsx'
import GameTable from './GameTable.jsx'
import MyGames from './PlayGame.jsx'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'
import { join } from 'path';

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      gameHubInstance: null,
      user: null,
      web3: null,
      player1: '',
      player2: '',
      cost: 0,
      games: null,
      myGames: {},
    }
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
      .then(results => {
        this.setState({
          web3: results.web3
        })

        // Instantiate contract once web3 provided.
        this.instantiateContract()
      })
      .catch(() => {
        console.log('Error finding web3.')
      })

    const GAMES = [
      // { address: '12345', player1: 'Tash', player2: "Hugh", cost: '100000' },
      // { address: 'sxxxx', player1: 'Josh', player2: "AMy", cost: '100000' },
      // { address: '78910', player1: 'Ella', player2: "Theo", cost: '100000' }
    ];

    const PLAYERS = [
      { address: '0x111111', joined: "Yes", secretMove: "0xS3cR3T", revealedMove: 'ROCK' },
      { address: '0x123456', joined: '', secretMove: "", revealedMove: '' }
    ];

    this.setState({
      games: GAMES,
      players: PLAYERS
    })
  }

  instantiateContract() {
    /*
     * SMART CONTRACT EXAMPLE
     *
     * Normally these functions would be called in the context of a
     * state management library, but for convenience I've placed them here.
     */

    const contract = require('truffle-contract')
    const gameHubContract = contract(GameHubContract)
    gameHubContract.setProvider(this.state.web3.currentProvider)
    // hardcoded for using ganache test rpc
    gameHubContract.defaults({
      gas: 2100000,
      gasPrice: 20000000000,
    })
    // Declaring this for later so we can chain functions on gameHubContract.
    // var gameHubInstance;

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      this.setState({ user: accounts[0] });

      gameHubContract.deployed().then((instance) => {
        this.setState({ gameHubInstance: instance });
        console.log("deployed GameHub: " + instance);

        // start watching for games
        // event LogGameCreated(address indexed gameAddress, address indexed playerOne, address indexed playerTwo, uint cost);
        var gameCreatedEvent = instance.LogGameCreated({}, { fromBlock: 0, toBlock: 'latest' });

        gameCreatedEvent.watch((error, result) => {
          if (!error) {
            // Do something whenever the event happens
            var gameCreated = {};
            gameCreated.address = result.args.gameAddress;
            gameCreated.player1 = result.args.playerOne;
            gameCreated.player2 = result.args.playerTwo;
            gameCreated.cost = result.args.cost.toString(10);

            var currentGames = this.state.games;
            currentGames.push(gameCreated);
            this.setState({ games: currentGames });

            if (gameCreated.player1 === this.state.user || gameCreated.player2 === this.state.user) {
              var player1 = { address: gameCreated.player1, joined: false, secretMove: "", revealedMove: "" }
              var player2 = { address: gameCreated.player2, joined: false, secretMove: "", revealedMove: "" }
              var playersArr = [player1, player2];
              var myNewGame = { address: gameCreated.address, players: playersArr, user: this.user, cost: gameCreated.cost };
              var myGamesMap = this.state.myGames;
              myGamesMap[gameCreated.address] = myNewGame;
              this.setState({ myGames: myGamesMap });
              console.log("populated mygames");

              // TODO watch for play move, reveal move events
              const contract = require('truffle-contract')
              const gameContract = contract(RpsContact)
              gameContract.setProvider(this.state.web3.currentProvider)
              // hardcoded for using ganache test rpc
              gameContract.defaults({
                gas: 2100000,
                gasPrice: 20000000000,
              })

              var gameInstance = gameContract.at(gameCreated.address);
              var playMoveEvent = gameInstance.LogPlayerMove({}, { fromBlock: 0, toBlock: 'latest' });
              playMoveEvent.watch((error, result) => {
                if (!error) {
                  console.log("play move event: " + JSON.stringify(result.args));
                  var gameAdd = result.args.game;
                  var playerAdd = result.args.player;
                  var secretMove = result.args.secretMove;

                  var gameMap = this.state.myGames;
                  var game = gameMap[gameAdd];

                  // game is undefined
                  var players = game.players;

                  players.forEach(element => {
                    if (element.address == playerAdd) {
                      element.secretMove = secretMove;
                      this.setState({ myGames: gameMap });
                    }
                  });
                }
              });

              var revealMoveEvent = gameInstance.LogRevealMove({}, { fromBlock: 0, toBlock: 'latest' });
              revealMoveEvent.watch((error, result) => {
                if (!error) {
                  console.log("Reveled move event: " + JSON.stringify(result.args));
                  var gameAdd = result.args.game;
                  var playerAdd = result.args.player;
                  var revealedMove = result.args.move;

                  var gameMap = this.state.myGames;
                  var game = gameMap[gameAdd];

                  // game is undefined
                  var players = game.players;

                  players.forEach(element => {
                    if (element.address == playerAdd) {
                      element.revealedMove = Number(revealedMove);
                      this.setState({ myGames: gameMap });
                    }
                  });
                }
              });
            }
          }
        })

        var gameJoinedEvent = instance.LogPlayerJoined({}, { fromBlock: 0, toBlock: 'latest' });
        gameJoinedEvent.watch((error, result) => {
          if (!error) {
            console.log("game joined " + JSON.stringify(result));
            var joinLog =
            {
              address: result.args.gameAddress,
              player: result.args.player
            };
            var gameMap = this.state.myGames;
            var gameAddr = joinLog.address;
            var game = gameMap[gameAddr];

            console.log("Game: " + JSON.stringify(game));
            // game is undefined
            var players = game.players;
            console.log("PLayers: " + JSON.stringify(players));

            players.forEach(element => {
              console.log("checking joined: add " + element.address + ", joinLog " + joinLog.player)
              if (element.address == joinLog.player) {
                console.log("Setting joined true")
                element.joined = true;
                this.setState({ myGames: gameMap });
              }
            });
            console.log("game joined: " + JSON.stringify(joinLog));
          }
        });
        var gameResultEvent = instance.LogGameResult({}, { fromBlock: 0, toBlock: 'latest' });

        gameResultEvent.watch((error, result) => {
  
          if (!error) {
            console.log("Got game result event: " + JSON.stringify(result));
            if (result.args.playerOne === this.state.user || result.args.playerTwo === this.state.user) {
              var myGamesMap = this.state.myGames;
              var game = myGamesMap[result.args.gameAddress];
              if (game) {
                game.complete = true;
                game.result = result.args.result;
                game.winningAmount = result.args.winningAmount;
              }
              myGamesMap[result.args.gameAddress] = game;
              console.log('Saving game result: ' + JSON.stringify(myGamesMap[result.args.gameAddress]));
              this.setState({ myGames: myGamesMap });
            }
          }
        })
      })
    })
  }

  handleCreateGame = (player1, player2, cost) => {
    this.setState({ player1: player1 });
    this.setState({ player2: player2 });
    this.setState({ cost: cost }, () => {
      console.log(`Create the game! ${this.state.player1}, ${this.state.player2}, ${this.state.cost}!  user ${this.state.user}!`);
      return this.state.gameHubInstance.createRockPaperScissorsGame(this.state.player1, this.state.player2, this.state.cost, { from: this.state.user })
        .then(txObj => {
          var gameys = [
            {
              address: txObj.logs[0].args.gameAddress,
              player1: txObj.logs[0].args.playerOne,
              player2: txObj.logs[0].args.playerTwo,
              cost: txObj.logs[0].args.cost.toString(10)
            }];

          this.setState({ games: gameys });
        });
    });
  }

  handleJoinClick = (gameAddress, cost) => {
    alert('Game address: ' + gameAddress + " " + cost);
    this.state.gameHubInstance.joinGame(gameAddress, { from: this.state.user, value: cost })
  }

  handlePlayMove = (gameAddress, move, password) => {
    console.log("handlePlayMove: " + gameAddress + "Play move: " + move + ", password: " + password);

    const contract = require('truffle-contract')
    const gameContract = contract(RpsContact)
    gameContract.setProvider(this.state.web3.currentProvider)
    // hardcoded for using ganache test rpc
    gameContract.defaults({
      gas: 2100000,
      gasPrice: 20000000000,
    })

    var rps = gameContract.at(gameAddress);

    // Create the secret move with the constant contract function and use the hashed result as the secret
    rps.createSecretMove(this.state.user, move, password).then((result) => {
      console.log("result: " + JSON.stringify(result));
      rps.playMove(result, { from: this.state.user }).then((txObj) => {
        console.log("playMove success");
      });
    })
  }

  handleRevealMove = (gameAddress, move, password) => {
    console.log("GA: " + gameAddress + " Reveal move: " + move + ", password: " + password);

    const contract = require('truffle-contract')
    const gameContract = contract(RpsContact)
    gameContract.setProvider(this.state.web3.currentProvider)
    // hardcoded for using ganache test rpc
    gameContract.defaults({
      gas: 2100000,
      gasPrice: 20000000000,
    })

    var rps = gameContract.at(gameAddress);
    rps.revealMove(move, password, { from: this.state.user }).then((result) => {
      console.log("result: " + JSON.stringify(result));
    }).catch((error) => {
      alert('Transaction failed -Unable to reveal move: ' + error);
    })
  }

  // TODO 
  // 1. Create UI component for Game,
  //    - dropdown for move, button to play move
  //    - button to reveal move
  // 2. Result table - game - winning address - winning amount
  //    
  render() {
    return (
      <div>
        <div className="App">
          <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">Rock Paper Scissors</a>
          </nav>
          <main className="container">
            <div className="pure-g">
              <div className="pure-u-1-1">
                <CreateGame
                  onCreateClick={this.handleCreateGame}
                />
                <h2>My Games</h2>
                <MyGames myGames={this.state.myGames}
                  user={this.state.user}
                  onJoinClick={this.handleJoinClick}
                  onPlayMoveClick={this.handlePlayMove}
                  onRevealMoveClick={this.handleRevealMove} />
              </div>
            </div>
            <h2>All Games</h2>
            <GameTable
              games={this.state.games}
              onJoinClick={this.handleJoinClick}
            />
          </main>
        </div>
      </div >
    );
  }
}

export default App
