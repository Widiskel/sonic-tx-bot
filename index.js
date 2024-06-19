import { account } from "./account.js";
import { Config } from "./src/config/config.js";
import { Solana } from "./src/core/solana.js";
import { Helper } from "./src/utils/helper.js";

/** Processing Bot */
async function process() {
  for (const acc of account) {
    const solana = new Solana(acc);
    try {
      await solana.connectWallet();

      console.log(`================= WALLET CONNECTED =============`);
      console.log(`Wallet Address  : ${solana.address}`);
      await solana.checkBalance();
      console.log(`Balance         : ${solana.balance} SOL`);

      console.log();
      console.log(`Begin Mass TX ${Config.massTxCount} x`);
      console.log();
      for (let x = 0; x < Config.massTxCount; x++) {
        console.log(`-> ${x + 1} Tx of ${Config.massTxCount} Tx`);
        await solana.sendSolToAddress();

        const randWait = Helper.random(3000, 10000);
        console.log(`Delaying for ${randWait / 1000} Second`);
        console.log();
        await Helper.delay(randWait);
      }

      console.log();
    } catch (error) {
      console.error(error);
      break;
    }
    console.log(`Complete, continue using next account`);
  }
  console.log(`All account processed`);
  if (Config.repeat) {
    const randDelay = Helper.random(6 * 1000 * 10, 6 * 1000 * 20); //random delay 10-20 minutes
    console.log(`Restarting bot after ${randDelay / 10000} Minutes`);
    await process();
  }
}

(async () => {
  console.log("Sonic Bot");
  console.log("By : Widiskel");
  console.log();
  await process();
})();
