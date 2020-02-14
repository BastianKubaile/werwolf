# Werwolf Bot for Discord with NodeJS

## Running your own bot

cd to the directory you want to have this bot then run

```bash
git clone https://github.com/BastianKubaile/werwolf
cd werwolf
npm install
touch secrets.js
```

First you will need to create a bot user. See this [tutorial](https://github.com/PapyrusThePlant/MusicPanda/wiki/Creating-a-bot-account).
To run the bot on your own Server, you need to put the token into the secrests.js file:

```js
module.exports =  {
    token: /*Your client token as a string*/
}
```

Now you can run the bot:

```bash
npm start
```

The bot currently saves all the games in memory, meaning that if it restarts all the game stats will be lost. In the future there may be MongoDB support with permament saving of the game.