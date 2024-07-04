import { account } from "./account.js";
import { Solana } from "./src/core/solana.js";
import { Helper } from "./src/utils/helper.js";
import logger from "./src/utils/logger.js";
import twist from "./src/utils/twist.js";

async function operation(acc) {
  const solana = new Solana(acc);
  try {
    await solana.connectWallet();
    await solana.checkBalance();
    await solana.connect();
    await Helper.delay(1000);
    twist.log(`Getting Wallet Balance Information`, acc, solana);
    await solana.getRewardInfo();
    await solana.getDailyTx();
    await solana.checkIn();
    twist.log(`Starting Mass Tx`, acc, solana);
    if (110 - solana.dailyTx.total_transactions > 0) {
      while (solana.dailyTx.total_transactions <= 110) {
        await solana.sendSolToAddress(acc);
        const randWait = Helper.random(2000, 5000);
        await Helper.delay(randWait);
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

    // console.log(`Opening ${solana.reward.ring_monitor} Mystery box`);
    // console.log(`Opening Mystery BOX`);
    // logger.info(`Opening Mystery BOX`);
    // for (let x = 0; x < solana.reward.ring_monitor; x++) {
    //   await solana.claimMysteryBox();
    // }
    twist.log(`Account Processing Complete`, acc, solana);
  } catch (error) {
    let msg = error.message;
    if (msg.includes("<!DOCTYPE html>")) {
      msg = msg.split("<!DOCTYPE html>")[0];
    }
    twist.log(
      `Error ${msg}, Retrying using Account ${account.indexOf(acc) + 1}...`,
      acc
    );

    logger.info(`Retrying using Account ${account.indexOf(acc) + 1}...`);
    logger.error(error);
    await Helper.delay(5000);
    await operation(acc);
  }
}

/** Processing Bot */
async function processBot() {
  logger.info(`SONIC AUTO TX BOT STARTED`);
  console.info(`SONIC AUTO TX BOT STARTED`);
  const allPromise = account.map(async (pk) => {
    await operation(pk);
  });

  await Promise.all(allPromise);

  logger.info();
  twist.clear();
  console.info(`SONIC AUTO TX BOT FINISHED`);
}

process.on("unhandledRejection", (reason) => {
  throw Error("Unhandled Exception : " + reason);
});

(async () => {
  console.log("Sonic Bot");
  console.log("By : Widiskel");
  console.log("Note : Don't forget to run git pull to keep up-to-date");
  console.log();
  await processBot();
})();
