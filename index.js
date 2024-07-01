import { account } from "./account.js";
import { Config } from "./src/config/config.js";
import { Solana } from "./src/core/solana.js";
import { Helper } from "./src/utils/helper.js";
import logger from "./src/utils/logger.js";

async function operation(acc) {
  try {
    const solana = new Solana(acc);
    await solana.connectWallet();
    await solana.connect();
    console.log();

    console.log(`================= WALLET CONNECTED =============`);
    console.log(`Wallet Address  : ${solana.address}`);
    await solana.checkBalance();
    console.log(`Balance         : ${solana.balance} SOL`);
    await solana.getDailyTx();
    console.log(`Daily TX        : ${solana.dailyTx.total_transactions}`);
    await solana.getRewardInfo();
    console.log(`Rings           : ${solana.reward.ring}`);
    console.log(`Mystery Box     : ${solana.reward.ring_monitor}`);

    console.log();
    await solana.checkIn();

    console.log();
    if (100 - solana.dailyTx.total_transactions > 0) {
      console.log(`Begin Mass TX ${100 - solana.dailyTx.total_transactions} x`);
      console.log();
      while (solana.dailyTx.total_transactions <= 105) {
        await solana.sendSolToAddress();

        console.log(`Balance         : ${solana.balance} SOL`);
        console.log(`Daily Tx        : ${solana.dailyTx.total_transactions}`);

        const randWait = Helper.random(2000, 5000);
        console.log(`Delaying for ${randWait / 1000} Second`);
        console.log();
        await Helper.delay(randWait);
      }
    }
    await solana.getDailyTx();
    console.log(`Daily TX        : ${solana.dailyTx.total_transactions}`);
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
    console.log();
    // console.log(`Opening ${solana.reward.ring_monitor} Mystery box`);
    // console.log(`Opening Mystery BOX`);
    // logger.info(`Opening Mystery BOX`);
    // for (let x = 0; x < solana.reward.ring_monitor; x++) {
    //   await solana.claimMysteryBox();
    // }

    console.log();
  } catch (error) {
    if (currentError != maxError) {
      currentError += 1;
      console.info(`Retrying using Account ${account.indexOf(acc) + 1}...`);
      logger.info(`Retrying using Account ${account.indexOf(acc) + 1}...`);
      console.error(error);
      logger.error(error);
      console.log();
      await operation(acc);
    } else {
      throw error;
    }
  }
}

const maxError = Config.maxErrorCount;
var currentError = 0;
/** Processing Bot */
async function processBot() {
  logger.info(`SONIC AUTO TX BOT STARTED`);
  for (const acc of account) {
    currentError = 0;
    try {
      await operation(acc);
    } catch (error) {
      console.error(
        `Error processing Accoung ${
          account.indexOf(acc) + 1
        } & Max Error Reached : `,
        error
      );
      logger.error(
        `Error processing Accoung ${
          account.indexOf(acc) + 1
        } & Max Error Reached : ${JSON.stringify(error)}`
      );
      continue;
    }
    console.log(`Completed, continue using next account`);
    logger.info(`Completed, continue using next account`);
    logger.info(``);
  }
  console.log(`All account processed`);
  logger.info(`SONIC AUTO TX BOT FINISHED`);
}

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection :", reason);
  console.error("Unhandled Rejection :", reason);
});

(async () => {
  console.log("Sonic Bot");
  console.log("By : Widiskel");
  console.log("Note : Don't forget to run git pull to keep up-to-date");
  console.log();
  await processBot();
})();
