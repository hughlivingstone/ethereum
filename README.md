# Ethereum projects

## Rock Paper Scissors Game (rps-game)
This is a sample rock paper scissors game written in solidity using React and pure-css for a basic UI.

### How to build/run
Firstly start up your ganache test blockchain.
Run the following commands:

- npm i 
- truffle migrate
-  npm start

Now start Mist browser from the command line with the following arguments to connect to your ganache blockchain where port 7545 is the ganache port:

- ./Mist -args --rpc http://127.0.0.1:7545'

In Mist, the URL of the DAPP should be: 

- http://localhost:3000/

Once you are on the webpage, choose an account to connect with via Mist and create a game in the UI.  

To play as the second player simply connect as the account you specified as the other player when creating the game.

### Tests
Javascript unit tests can be found in:
- /rps-game/test/GameHub.js  
