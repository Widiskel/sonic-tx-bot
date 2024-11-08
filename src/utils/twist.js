import { Twisters } from "twisters";
import { account } from "../../account.js";
import { Solana } from "../core/solana.js";
import logger from "./logger.js";

class Twist {
  constructor() {
    /** @type  {Twisters}*/
    this.twisters = new Twisters();
  }

  /**
   * @param {string} acc
   * @param {Solana} solana
   * @param {string} msg
   */
  log(msg = "", acc = "", solana = new Solana(acc), delay) {
    const accIdx = account.indexOf(acc);
    if (delay == undefined) {
      logger.info(`Account ${accIdx + 1} - ${msg}`);
      delay = "-";
    }

    const address = solana.address ?? "-";
    const balance = solana.balance ?? "-";
    const reward = solana.reward ?? {};
    const ring = reward.ring ?? "?";
    const ring_monitor = reward.ring_monitor ?? "-";
    const dailyTx = solana.dailyTx ?? {};
    const total_transactions = dailyTx.total_transactions ?? "-";

    this.twisters.put(acc, {
      text: `
================= Account ${account.indexOf(acc) + 1} =============
Wallet Address     : ${address}
Balance            : ${balance} SOL | ${ring} RING
Mystery Box        : ${ring_monitor}
Daily TX           : ${total_transactions}

Status             : ${msg}
Delay : ${delay}
==============================================
`,
    });
  }

  /**
   * @param {string} msg
   */
  info(msg = "") {
    this.twisters.put(2, {
      text: `
==============================================
Info : ${msg}
==============================================`,
    });
    return;
  }

  clearInfo() {
    this.twisters.remove(2);
  }

  clear(acc) {
    this.twisters.remove(acc);
  }
}
export default new Twist();
