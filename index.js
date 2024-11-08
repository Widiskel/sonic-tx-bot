import { account } from "./account.js";
import { proxyList } from "./proxy_list.js";
import { Solana } from "./src/core/solana.js";
import { Helper } from "./src/utils/helper.js";
import logger from "./src/utils/logger.js";

async function operation(acc, proxy) {
  const solana = new Solana(acc, proxy);
  try {
    await solana.connectWallet();
    await solana.checkBalance();
    if (solana.balance < 0.01) {
      throw Error("You need at least 0.01 SOL To Use This BOT");
    }
    await solana.connect();
    await Helper.delay(500, acc, `Getting Wallet Balance Information`, solana);
    await solana.getRewardInfo();
    await solana.getDailyTx();
    await solana.checkIn();
    await Helper.delay(500, acc, `Starting Mass Tx`, solana);

    if (100 - solana.dailyTx.total_transactions > 0) {
      while (solana.dailyTx.total_transactions <= 100) {
        await solana.sendSolToAddress(acc);
        const randWait = Helper.random(1000, 3000);
        await Helper.delay(randWait, acc, "Delaying before do next tx", solana);
      }
    }

    await solana.getDailyTx();

    const claimableStage = [];
    if (solana.dailyTx.total_transactions >= 10) {
      claimableStage.push(1);
    }
    if (solana.dailyTx.total_transactions >= 50) {
      claimableStage.push(2);
    }
    if (solana.dailyTx.total_transactions >= 100) {
      claimableStage.push(3);
    }

    for (const stage of claimableStage) {
      await solana.claimTxMilestone(stage);
    }

    await solana.getRewardInfo();
    await Helper.delay(
      500,
      acc,
      `Opening ${solana.reward.ring_monitor} Mystery box`,
      solana
    );

    while (solana.reward.ring_monitor != 0) {
      await solana.claimMysteryBox().catch(async (err) => {
        if (err.message.includes("custom program error")) {
          await Helper.delay(
            3000,
            acc,
            `Error while claiming mystery box, possible Sonic program error, skipping open box`,
            solana
          );
        }
      });
      await solana.getRewardInfo();
    }

    await Helper.delay(
      60000 * 60 * 24,
      acc,
      `Account Processing Complete, Delaying for 24 H`,
      solana
    );
  } catch (error) {
    let msg = error.message;
    if (msg.includes("<!DOCTYPE html>")) {
      msg = msg.split("<!DOCTYPE html>")[0];
    }
    await Helper.delay(
      500,
      acc,
      `Error ${msg}, Retrying using Account ${
        account.indexOf(acc) + 1
      } after 10 Second...`,
      solana
    );

    logger.info(`Retrying using Account ${account.indexOf(acc) + 1}...`);
    logger.error(error);
    await Helper.delay(10000);
    await operation(acc, proxy);
  }
}

process.on("unhandledRejection", (reason) => {
  throw Error("Unhandled Exception : " + reason);
});

async function startBot() {
  return new Promise(async (resolve, reject) => {
    try {
      logger.info(`BOT STARTED`);
      if (account.length == 0)
        throw Error("Please input your account first on account.js file");

      if (proxyList.length != account.length && proxyList.length != 0)
        throw Error(
          `You Have ${account.length} Accounts But Provide ${proxyList.length}`
        );

      const promiseList = [];

      for (const acc of account) {
        const accIdx = account.indexOf(acc);
        const proxy = proxyList[accIdx];
        promiseList.push(operation(acc, proxy));
      }

      await Promise.all(promiseList);
      resolve();
    } catch (error) {
      logger.info(`BOT STOPPED`);
      logger.error(JSON.stringify(error));
      reject(error);
    }
  });
}

(async () => {
  try {
    logger.clear();
    logger.info("");
    logger.info("Application Started");
    console.log("EVM TX DEPLOYER BOT");
    console.log();
    console.log("By : Widiskel");
    console.log("Follow On : https://github.com/Widiskel");
    console.log("Join Channel : https://t.me/skeldrophunt");
    console.log("Dont forget to run git pull to keep up to date");
    console.log();
    console.log();
    Helper.showSkelLogo();
    await startBot();
  } catch (error) {
    console.log("Error During executing bot", error);
    await startBot();
  }
})();
