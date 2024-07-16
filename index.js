import { account } from "./account.js";
import { Config } from "./src/config/config.js";
import { Solana } from "./src/core/solana.js";
import { Helper } from "./src/utils/helper.js";
import logger from "./src/utils/logger.js";
import twist from "./src/utils/twist.js";
import input from "input";

let mode = 1;
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
    if (100 - solana.dailyTx.total_transactions > 0) {
      while (solana.dailyTx.total_transactions <= 100) {
        await solana.sendSolToAddress(acc);
        const randWait = Helper.random(1000, 3000);
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

    twist.log(`Opening ${solana.reward.ring_monitor} Mystery box`, acc, solana);

    const ringMonitor = new Array(solana.reward.ring_monitor);
    let claimError = false;
    for (const box of ringMonitor) {
      await solana.claimMysteryBox().catch(async (err) => {
        if (err.message.includes("custom program error")) {
          claimError = true;
          twist.log(
            `Error while claiming mystery box, posible Sonic program error, skipping open box`,
            acc,
            solana
          );
          await Helper.delay(3000);
        }
      });
      if (claimError) {
        break;
      }
    }

    if (Config.useLottery) {
      twist.log(`Drawing lottery for 10 Times`, acc, solana);
      const blockLottery = [];
      const drawLength = new Array(Config.drawAmount);
      for (const draw of drawLength) {
        const block = await solana.drawLottery();
        blockLottery.push(block);
      }
      logger.info(`Collected block ${blockLottery}`);

      twist.log(
        `Waiting And Claiming all lottery reward ${blockLottery}`,
        acc,
        solana
      );
      for (const block of blockLottery) {
        solana.lottery = 0;
        await solana.claimLottery(block).catch(() => {
          logger.info(`Error while claiming lottery, skipping claim`);

          twist.log(
            `Error while claiming lottery on block ${blockLottery}, skipping Claim`,
            acc,
            solana
          );
        });
      }
    }

    if (mode == 1) {
      twist.log(`Account Processing Complete`, acc, solana);
    } else {
      twist.log(
        `Account Processing Complete, Continue using next account after 3 Second delay`,
        acc,
        solana
      );
      await Helper.delay(3000);
    }
  } catch (error) {
    let msg = error.message;
    if (msg.includes("<!DOCTYPE html>")) {
      msg = msg.split("<!DOCTYPE html>")[0];
    }
    twist.log(
      `Error ${msg}, Retrying using Account ${
        account.indexOf(acc) + 1
      } after 10 Second...`,
      acc
    );

    logger.info(`Retrying using Account ${account.indexOf(acc) + 1}...`);
    logger.error(error);
    await Helper.delay(10000);
    await operation(acc);
  }
}

/** Processing Bot */
async function processBot() {
  logger.info(`SONIC AUTO TX BOT STARTED`);
  console.info(`SONIC AUTO TX BOT STARTED`);

  if (mode == 1) {
    const allPromise = account.map(async (pk) => {
      await operation(pk);
    });

    await Promise.all(allPromise);
    logger.info();
    twist.clear();
  } else {
    for (const pk of account) {
      await operation(pk);
      logger.info();
      twist.clear();
    }
  }

  console.info(`SONIC AUTO TX BOT FINISHED`);
}

process.on("unhandledRejection", (reason) => {
  throw Error("Unhandled Exception : " + reason);
});

async function onBoarding() {
  try {
    let ctx =
      "Welcome to Sonic TX Bot \nBy : Widiskel \n \nLets getting started.\n \nChoose Your Run Option:\n";
    ctx +=
      "\n \n1. Mass Runner. \n2. One By One Runner.\n \nInput your choice :";
    const choice = await input.text(ctx);
    if (choice == 1 || choice == 2) {
      mode = choice;
      console.log(mode);
      await processBot();
    } else {
      console.error("Invalid input, Please try again");
      await onBoarding();
    }
  } catch (error) {
    throw error;
  }
}

(async () => {
  logger.clear();
  console.log("Sonic Bot");
  console.log("By : Widiskel");
  console.log("Note : Don't forget to run git pull to keep up-to-date");
  console.log();
  await onBoarding();
})();
