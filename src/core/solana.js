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
import nacl from "tweetnacl";
import { API } from "../api/api.js";
import logger from "../utils/logger.js";

export class Solana extends API {
  constructor(pk) {
    const apiUrl = "https://odyssey-api.sonic.game";
    super(apiUrl);
    this.pk = pk;
    this.connection = new Connection("https://devnet.sonic.game");
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

  async connect() {
    console.log(`Connecting to Sonic Odyssey`);
    logger.info(`Connecting to Sonic Odyssey`);
    await this.fetch(
      `/auth/sonic/challenge?wallet=${this.address}`,
      "GET",
      undefined,
      null,
      "omit"
    )
      .then(async (challangeRes) => {
        const message = challangeRes.data;
        const messageBytes = new TextEncoder().encode(message);
        const signature = nacl.sign.detached(
          messageBytes,
          this.wallet.secretKey
        );
        const signatureBase64 = Buffer.from(signature).toString("base64");
        const addressEncoded = Buffer.from(
          this.wallet.publicKey.toBytes()
        ).toString("base64");
        const requestBody = {
          address: this.address.toBase58(),
          address_encoded: addressEncoded,
          signature: signatureBase64,
        };

        await this.fetch(
          `/auth/sonic/authorize`,
          "POST",
          undefined,
          requestBody,
          "omit"
        )
          .then((authorizeRes) => {
            if (authorizeRes.code == 0) {
              this.token = authorizeRes.data.token;
              console.log(`Connected to Sonic Odyssey`);
              logger.info(`Connected to Sonic Odyssey`);
            } else {
              throw new Error(authorizeRes.message);
            }
          })
          .catch((err) => {
            throw err;
          });
      })
      .catch((err) => {
        throw err;
      });
  }

  async checkBalance() {
    try {
      this.balance =
        (await this.connection.getBalance(this.address)) / LAMPORTS_PER_SOL;
    } catch (error) {
      throw error;
    }
  }

  /** @param {Transaction} trans  */
  async doTx(trans) {
    logger.info(`Execute Transaction ${JSON.stringify(trans)}`);
    const tx = await sendAndConfirmTransaction(this.connection, trans, [
      this.wallet,
    ]);
    console.log(`Tx Url: https://explorer.sonic.game/tx/${tx}`);
    logger.info(`Tx Url: https://explorer.sonic.game/tx/${tx}`);
  }

  async sendSolToAddress() {
    try {
      const destAddress =
        Config.destAddress[Helper.random(0, Config.destAddress.length - 1)] ??
        this.address;
      const amount = Config.sendAmount;
      console.log(`Sending ${amount} to ${destAddress}`);
      logger.info(`Sending ${amount} to ${destAddress}`);
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: this.address,
        toPubkey: destAddress,
        lamports: amount * LAMPORTS_PER_SOL,
      });
      const transaction = new Transaction().add(transferInstruction);
      await this.doTx(transaction)
        .then(async () => {
          await this.checkBalance();
        })
        .catch((err) => {
          throw err;
        });
      this.dailyTx.total_transactions += 1;
    } catch (error) {
      throw error;
    }
  }

  async checkIn() {
    console.log(`Try to Check-in`);
    logger.info(`Try to Check-in`);
    const response = await this.fetch(
      `/user/check-in/transaction`,
      "GET",
      this.token,
      null
    )
      .then(async (data) => {
        if (data.code == 0) {
          const transactionBuffer = Buffer.from(data.data.hash, "base64");
          const transaction = Transaction.from(transactionBuffer);

          await this.doTx(transaction);
          console.log(
            `Check-in Transaction Executed Successfully, continue with post check in process`
          );
          logger.info(
            `Check-in Transaction Executed Successfully, continue with post check in process`
          );
          this.dailyTx.total_transactions += 1;
          await this.postCheckIn(tx);
        } else {
          console.log(data.message);
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  async postCheckIn(tx) {
    const response = await this.fetch(`/user/check-in`, "POST", this.token, {
      hash: tx,
    })
      .then((data) => {
        if (data.code != 0) {
          throw new Error(data.message);
        } else {
          console.log("Checked in Successfully");
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  async getDailyTx() {
    try {
      const response = await this.fetch(
        `/user/transactions/state/daily`,
        "GET",
        this.token,
        null
      )
        .then((data) => {
          if (data.code != 0) {
            throw new Error(data.message);
          } else {
            this.dailyTx = data.data;
          }
        })
        .catch((err) => {
          throw err;
        });
    } catch (error) {
      throw error;
    }
  }

  async claimTxMilestone(stage) {
    console.log(`Claiming Tx Milestone Stage ${stage}`);
    logger.info(`Claiming Tx Milestone Stage ${stage}`);
    const response = await this.fetch(
      `/user/transactions/rewards/claim`,
      "POST",
      this.token,
      { stage: stage }
    )
      .then((data) => {
        if (data.code != 0) {
          console.log(`Tx milestone Stage ${stage} Already Claimed`);
        } else {
          console.log(`Tx milestone Stage ${stage} Claimed Successfully`);
        }
      })
      .catch((err) => {
        throw err;
      });
  }
}