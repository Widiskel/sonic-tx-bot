import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Helper } from "../utils/helper.js";
import { Config } from "../config/config.js";

export class Solana {
  constructor(pk) {
    this.pk = pk;
    this.connection = new Connection("https://devnet.sonic.game");
    // console.log(this.connection);
    // this.connection;
    // console.log(this.connection);
  }

  async connectWallet() {
    try {
      const privateKeyBuffer = Helper.base58decoder(this.pk);
      /** @type {Keypair} */
      this.wallet = Keypair.fromSecretKey(privateKeyBuffer);
      /** @type {PublicKey} */
      this.address = new PublicKey(this.wallet.publicKey.toBase58());
    } catch (error) {
      throw error;
    }
  }

  async checkBalance() {
    try {
      this.balance =
        (await this.connection.getBalance(this.address)) / LAMPORTS_PER_SOL;
    } catch (error) {
      throw error;
    }
  }

  async sendSolToAddress() {
    try {
      const destAddress =
        Config.destAddress[Helper.random(0, Config.destAddress.length - 1)] ??
        this.address;
      const amount = Config.sendAmount;
      console.log(`Sending ${amount} to ${destAddress}`);
      const transferTransaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.address,
          toPubkey: destAddress,
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );
      // console.log("Signing TX");
      const tx = await sendAndConfirmTransaction(
        this.connection,
        transferTransaction,
        [this.wallet]
      );
      console.log(`Tx Url: https://explorer.sonic.game/tx/${tx}`);
    } catch (error) {
      throw error;
    }
  }
}
