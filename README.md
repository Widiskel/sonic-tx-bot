# SONIC TX BOT

Sonic TX bot for adding more tx on chain

## PREREQUISITE

- Git
- Node JS > v18

## SETUP

- run `git clone https://github.com/Widiskel/sonic-tx-bot.git`
- run `npm install`
- run `cp account_tmp.js account.js`

## CONFIGURATION

im adding config file for you to configure, open `src config/config.js` and adjust config. Here some configurable variables.

```js
sendAmount = 0.0001; //amount to send in sol
destAddress = addressList; //address destination list
massTxCount = 100; //tx count
repeat = false; // for keep repeating the boot after all account processed
```

to configure destination address list, open `src config/address_list.js` adjust the list with yours. the bot will pick random destination address from that list to send token.

## CONTRIBUTE

Feel free to fork and contribute adding more feature thanks.

## SUPPORT

want to support me for creating another bot ?
buy me a coffee on

EVM : `0x0fd08d2d42ff086bf8c6d057d02d802bf217559a`

SOLANA : `3tE3Hs7P2wuRyVxyMD7JSf8JTAmEekdNsQWqAnayE1CN`
