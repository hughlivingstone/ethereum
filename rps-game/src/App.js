import React, { Component } from 'react'
import GameHubContract from '../build/contracts/GameHub.json'
import RpsContact from '../build/contracts/RockPaperScissors.json'
import getWeb3 from './utils/getWeb3'

import CreateGame from './components/CreateGame.jsx'
import GameTable from './components/GameTable.jsx'
import MyGames from './components/PlayGame.jsx'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

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

    this.setState({
      games: [],
      players: []
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

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      this.setState({ user: accounts[0] });

      gameHubContract.deployed().then((instance) => {
        this.setupEventWatchers(instance);
      })
    })
  }

  setupEventWatchers(instance) {
    this.setState({ gameHubInstance: instance });
    console.log("deployed GameHub: " + instance);
    var gameCreatedEvent = instance.LogGameCreated({}, { fromBlock: 0, toBlock: 'latest' });
    gameCreatedEvent.watch((error, result) => {
      if (!error) {
        this.processGameCreatedEvent(result);
      }
    });
    var gameJoinedEvent = instance.LogPlayerJoined({}, { fromBlock: 0, toBlock: 'latest' });
    gameJoinedEvent.watch((error, result) => {
      if (!error) {
        this.processGameJoinEvent(result);
      }
    });
    var gameResultEvent = instance.LogGameResult({}, { fromBlock: 0, toBlock: 'latest' });
    gameResultEvent.watch((error, result) => {
      if (!error) {
        this.processGameResultEvent(result);
      }
    });
  }

  processGameCreatedEvent(result) {
    var gameCreated = {};
    gameCreated.address = result.args.gameAddress;
    gameCreated.player1 = result.args.playerOne;
    gameCreated.player2 = result.args.playerTwo;
    gameCreated.cost = result.args.cost.toString(10);
    var currentGames = this.state.games;
    currentGames.push(gameCreated);
    this.setState({ games: currentGames });
    if (gameCreated.player1 === this.state.user || gameCreated.player2 === this.state.user) {
      this.addGameCreatedToState(gameCreated);
      
      var gameInstance = this.getGameContractInstance(gameCreated.address);
      this.setupInGameEventWatchers(gameInstance);
    }
  }

  addGameCreatedToState(gameCreated) {
    var player1 = { address: gameCreated.player1, joined: false, secretMove: "", revealedMove: "" };
    var player2 = { address: gameCreated.player2, joined: false, secretMove: "", revealedMove: "" };
    var playersArr = [player1, player2];
    var myNewGame = { address: gameCreated.address, players: playersArr, user: this.user, cost: gameCreated.cost };
    var myGamesMap = this.state.myGames;
    myGamesMap[gameCreated.address] = myNewGame;
    this.setState({ myGames: myGamesMap });
  }

  getGameContractInstance(gameAddress) {
    const contract = require('truffle-contract');
    const gameContract = contract(RpsContact);
    gameContract.setProvider(this.state.web3.currentProvider);
    // hardcoded for using ganache test rpc
    gameContract.defaults({
      gas: 2100000,
      gasPrice: 20000000000,
    });
    return gameContract.at(gameAddress);
  }


  setupInGameEventWatchers(gameInstance) {
    var playMoveEvent = gameInstance.LogPlayerMove({}, { fromBlock: 0, toBlock: 'latest' });
    playMoveEvent.watch((error, result) => {
      if (!error) {
        this.processPlayMoveEvent(result);
      }
    });
    var revealMoveEvent = gameInstance.LogRevealMove({}, { fromBlock: 0, toBlock: 'latest' });
    revealMoveEvent.watch((error, result) => {
      if (!error) {
        this.processRevealMoveEvent(result);
      }
    });
  }

  processPlayMoveEvent(result) {
    console.log("play move event: " + JSON.stringify(result.args));
    var gameAdd = result.args.game;
    var playerAdd = result.args.player;
    var secretMove = result.args.secretMove;
    var gameMap = this.state.myGames;
    var game = gameMap[gameAdd];
    var players = game.players;
    players.forEach(element => {
      if (element.address == playerAdd) {
        element.secretMove = secretMove;
        this.setState({ myGames: gameMap });
      }
    });
  }

  processRevealMoveEvent(result) {
    console.log("Reveled move event: " + JSON.stringify(result.args));
    var gameAdd = result.args.game;
    var playerAdd = result.args.player;
    var revealedMove = result.args.move;
    var gameMap = this.state.myGames;
    var game = gameMap[gameAdd];
    var players = game.players;
    players.forEach(element => {
      if (element.address == playerAdd) {
        element.revealedMove = Number(revealedMove);
        this.setState({ myGames: gameMap });
      }
    });
  }

  processGameJoinEvent(result) {
    console.log("game joined " + JSON.stringify(result));
    var joinLog = {
      address: result.args.gameAddress,
      player: result.args.player
    };
    var gameMap = this.state.myGames;
    var gameAddr = joinLog.address;
    var game = gameMap[gameAddr];
    console.log("Game: " + JSON.stringify(game));
    // game is undefined
    var players = game.players;
    players.forEach(element => {
      console.log("checking joined: add " + element.address + ", joinLog " + joinLog.player);
      if (element.address == joinLog.player) {
        console.log("Setting joined true");
        element.joined = true;
        this.setState({ myGames: gameMap });
      }
    });
    console.log("game joined: " + JSON.stringify(joinLog));
  }

  processGameResultEvent(result) {
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
      this.setState({ myGames: myGamesMap });
    }
  }

  handleCreateGame = (player1, player2, cost) => {
    this.setState({ player1: player1 });
    this.setState({ player2: player2 });
    this.setState({ cost: cost }, () => {
      console.log(`Create the game! ${this.state.player1}, ${this.state.player2}, ${this.state.cost}!  user ${this.state.user}!`);
      return this.state.gameHubInstance.createRockPaperScissorsGame(this.state.player1, this.state.player2, this.state.cost, { from: this.state.user })
        .then(txObj => {
          console.log('Created game successful: ' + txObj.logs[0].args.gameAddress);
        }).catch((error) => {
          alert('Transaction failed - Unable to create game: ' + error);
        });;
    });
  }

  handleJoinClick = (gameAddress, cost) => {
    console.log('Game address: ' + gameAddress + " " + cost);
    this.state.gameHubInstance.joinGame(gameAddress, { from: this.state.user, value: cost }).then((tx) => {
      console.log("Join game success: " + gameAddress);
    }).catch((error) => {
      alert('Transaction failed - Unable to join game: ' + gameAddress + ", error: " + error);
    });
  }

  handlePlayMove = (gameAddress, move, password) => {
    console.log("handlePlayMove: " + gameAddress + "Play move: " + move + ", password: " + password);
    var gameInstance = this.getGameContractInstance(gameAddress);

    // Create the secret move with the constant contract function and use the hashed result as the secret
    gameInstance.createSecretMove(this.state.user, move, password).then((result) => {
      console.log("result: " + JSON.stringify(result));
      gameInstance.playMove(result, { from: this.state.user }).then((txObj) => {
        console.log("playMove success");
      }).catch((error) => {
        alert('Transaction failed - Unable to play move: ' + error);
      });
    })
  }

  handleRevealMove = (gameAddress, move, password) => {
    console.log("GA: " + gameAddress + " Reveal move: " + move + ", password: " + password);

    var gameInstance = this.getGameContractInstance(gameAddress);
    gameInstance.revealMove(move, password, { from: this.state.user }).then((result) => {
      console.log("result: " + JSON.stringify(result));
    }).catch((error) => {
      alert('Transaction failed - Unable to reveal move: ' + error);
    })
  }

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
              user={this.state.user}
              onJoinClick={this.handleJoinClick}
            />
          </main>
        </div>
      </div >
    );
  }
}

export default App
