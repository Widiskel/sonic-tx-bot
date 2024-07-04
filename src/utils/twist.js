import { Twisters } from "twisters";
import { account } from "../../account.js";
import { Solana } from "../core/solana.js";

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
  log(msg = "", acc = "", solana = new Solana(acc)) {
    const address = solana.address ?? "-";
    const balance = solana.balance ?? "-";
    const reward = solana.reward ?? {};
    const ring = reward.ring ?? "-";
    const ring_monitor = reward.ring_monitor ?? "-";
    const dailyTx = solana.dailyTx ?? {};
    const total_transactions = dailyTx.total_transactions ?? "-";

    this.twisters.put(acc, {
      text: `
================= Account ${account.indexOf(acc) + 1} =============
Wallet Address     : ${address}
Balance            : ${balance} SOL
Mystery Box        : ${ring_monitor}
Daily TX           : ${total_transactions}
Status : ${msg}`,
    });
  }

  clear() {
    this.twisters.flush();
  }
}
export default new Twist();
