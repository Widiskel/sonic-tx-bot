# SONIC TX BOT

Sonic TX bot for adding more tx on chain

## BOT FEATURE

- Support PK and SEED
- Proxy Support
- Auto Check In
- Auto TX until 100 Times
- Auto Claim TX Milestone
- Auto Opening Mystery Box
- Support on testnet-v1

## PREREQUISITE

- Git
- Node JS > v18

## SETUP

- run `git clone https://github.com/Widiskel/sonic-tx-bot.git`
- run `cd sonic-tx-bot`
- run `npm install`
- run `cp account_tmp.js account.js && cp proxy_list_tmp.js proxy_list.js` 
- fill up account.js `nano account.js` fill with your account private key
- fill up proxy_list.js `nano proxy_list.js` fill with your proxy list
- npm run start

## CONFIGURATION

im adding config file for you to configure, open `src config/config.js` and adjust config. Here some configurable variables.

```js
export class Config {
  static sendAmount = 0.0001; //amount to send in sol
  static destAddress = addressList; //address destination list
  static maxRetry = 3; // max error retry for claiming
}
```

to configure destination address list, open `src config/address_list.js` adjust the list with yours. the bot will pick random destination address from that list to send token or it will send to its own wallet address.

## HOW TO UPDATE

to update just run `git pull` or if it failed because of unstaged commit, just run `git stash` and then `git pull`. after that do `npm install` or `npm update`.

## CONTRIBUTE

Feel free to fork and contribute adding more feature thanks.

## NOTE

Bot running using twister, so if you run multiple account maybe some account not showed on your terminal because it depens on your windows screen, but it still running. you can check on `app.log`.

## SUPPORT

want to support me for creating another bot ?
buy me a coffee on

EVM : `0x0fd08d2d42ff086bf8c6d057d02d802bf217559a`

SOLANA : `3tE3Hs7P2wuRyVxyMD7JSf8JTAmEekdNsQWqAnayE1CN`
