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
  constructor(pk, proxy) {
    const apiUrl = "https://odyssey-api-beta.sonic.game";
    super(apiUrl, proxy);
    this.pk = pk;
    this.draw = 0;
    this.lottery = 0;
    this.currentError = 0;
    this.connection = new Connection(
      "https://api.testnet.sonic.game",
      "confirmed"
    );
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
    logger.info(`Connecting to Sonic Odyssey`);
    await this.fetch(
      `/testnet-v1/auth/sonic/challenge?wallet=${this.address}`,
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
          `/testnet-v1/auth/sonic/authorize`,
          "POST",
          undefined,
          requestBody,
          "omit"
        )
          .then(async (authorizeRes) => {
            if (authorizeRes.code == 0) {
              this.token = authorizeRes.data.token;
              logger.info(`Connected to Sonic Odyssey`);
              await Helper.delay(
                1000,
                this.pk,
                `Connected to Sonic Odyssey`,
                this
              );
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

  /** @param {Transaction} trans */
  async doTx(trans) {
    try {
      logger.info(`Execute Transaction ${JSON.stringify(trans)}`);
      const tx = await sendAndConfirmTransaction(this.connection, trans, [
        this.wallet,
      ]);
      logger.info(`Tx Url: https://explorer.sonic.game/tx/${tx}`);
      await Helper.delay(
        1000,
        this.pk,
        `Tx Url: https://explorer.sonic.game/tx/${tx}`,
        this
      );
      return tx;
    } catch (error) {
      logger.error(`Transaction failed: ${error.message}`, error);
      throw error;
    }
  }

  /** @param {Transaction} trans */
  async doRawTx(trans) {
    try {
      logger.info(`Execute Raw Transaction ${JSON.stringify(trans)}`);
      const rawTransaction = trans.serialize();
      const tx = await this.connection.sendRawTransaction(rawTransaction);
      await this.confirmTx(tx);
      logger.info(`Tx Url: https://explorer.sonic.game/tx/${tx}`);
      await Helper.delay(
        1000,
        this.pk,
        `Tx Url: https://explorer.sonic.game/tx/${tx}`,
        this
      );
      return tx;
    } catch (error) {
      logger.error(`Transaction failed: ${error.message}`, error);
      throw error;
    }
  }

  /** @param {Transaction} trans */
  async confirmTx(signature) {
    try {
      logger.info(`Confirming Transaction...`);
      await Helper.delay(
        2000,
        this.pk,
        `Confirming Transaction, Estimated take 30 Seconds..`,
        this
      );
      await this.connection.confirmTransaction(signature, "finalized");

      logger.info(`Transaction Confirmed`);
      await Helper.delay(2000, this.pk, `Transaction Confirmed`, this);
    } catch (error) {
      logger.error(`Transaction failed: ${error.message}`, error);
      if (this.currentError < Config.maxRetry) {
        this.currentError += 1;
        await Helper.delay(
          2000,
          this.pk,
          `Transaction Not Confirmed after 30 Second, Retrying...`,
          this
        );
        await this.confirmTx(signature);
      } else {
        this.currentError = 0;
        await Helper.delay(
          2000,
          this.pk,
          `Transaction not confirmed and max retry reached`,
          this
        );
        throw Error("Transaction not confirmed and max retry reached");
      }
    }
  }

  async sendSolToAddress() {
    try {
      const destAddress =
        Config.destAddress[Helper.random(0, Config.destAddress.length - 1)] ??
        this.address;
      const amount = Config.sendAmount;
      logger.info(`Sending ${amount} to ${destAddress}`);
      await Helper.delay(
        1000,
        this.pk,
        `Sending ${amount} to ${destAddress}`,
        this
      );
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
    logger.info(`Try to Check-in`);
    await Helper.delay(1000, this.pk, `Try to Check-in`, this);
    await this.fetch(
      `/testnet-v1/user/check-in/transaction`,
      "GET",
      this.token,
      null
    )
      .then(async (data) => {
        if (data.code == 0) {
          const transactionBuffer = Buffer.from(data.data.hash, "base64");
          const transaction = Transaction.from(transactionBuffer);

          const tx = await this.doTx(transaction);

          logger.info(
            `Check-in Transaction Executed Successfully, continue with post check in process`
          );
          await Helper.delay(
            1000,
            this.pk,
            `Check-in Transaction Executed Successfully, continue with post check in process`,
            this
          );
          this.dailyTx.total_transactions += 1;
          await this.postCheckIn(tx);
        } else {
          await Helper.delay(1000, this.pk, data.message, this);
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  async postCheckIn(tx) {
    await Helper.delay(1000, this.pk, `Execute post check in process`, this);
    await this.fetch(`/testnet-v1/user/check-in`, "POST", this.token, {
      hash: tx,
    })
      .then(async (data) => {
        if (data.code != 0) {
          throw new Error(data.message);
        } else {
          await Helper.delay(1000, this.pk, "Checked in Successfully", this);
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  async getRewardInfo() {
    try {
      await Helper.delay(1000, this.pk, `Getting Reward Information`, this);
      await this.fetch("/testnet-v1/user/rewards/info", "GET", this.token)
        .then(async (data) => {
          if (data.code == 0) {
            this.reward = data.data;
            await Helper.delay(
              1000,
              this.pk,
              `Successfully Get User Reward Information`,
              this
            );
          } else {
            throw new Error("Unable to get user reward info");
          }
        })
        .catch((err) => {
          throw err;
        });
    } catch (error) {
      throw error;
    }
  }

  async getDailyTx() {
    try {
      await Helper.delay(1000, this.pk, `Getting Daily Tx Info`, this);
      await this.fetch(
        `/testnet-v1/user/transactions/state/daily`,
        "GET",
        this.token,
        null
      )
        .then(async (data) => {
          if (data.code != 0) {
            throw new Error(data.message);
          } else {
            this.dailyTx = data.data;
            await Helper.delay(
              1000,
              this.pk,
              `Successfully Get Daily Tx Information`,
              this
            );
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
    logger.info(`Claiming Tx Milestone Stage ${stage}`);
    await Helper.delay(
      1000,
      this.pk,
      `Claiming Tx Milestone Stage ${stage}`,
      this
    );
    await this.fetch(
      `/testnet-v1/user/transactions/rewards/claim`,
      "POST",
      this.token,
      {
        stage: stage,
      }
    )
      .then(async (data) => {
        if (data.code == 0) {
          await Helper.delay(1000, this.pk, `Claimed Successfully`, this);
        } else {
          await Helper.delay(1000, this.pk, data.message, this);
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  async claimMysteryBox() {
    await Helper.delay(
      1000,
      this.pk,
      `Build Tx for Claiming Mystery BOX`,
      this
    );
    logger.info(`Build Tx for Claiming Mystery BOX`);
    await this.fetch(
      "/testnet-v1/user/rewards/mystery-box/build-tx",
      "GET",
      this.token,
      undefined
    )
      .then(async (data) => {
        if (data.code == 0) {
          const transactionBuffer = Buffer.from(data.data.hash, "base64");
          const transaction = Transaction.from(transactionBuffer);
          transaction.partialSign(this.wallet);
          const tx = await this.doRawTx(transaction);
          await this.openMysteryBox(tx);
        } else {
          await Helper.delay(1000, this.pk, data.message, this);
          logger.error(data.message);
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  async openMysteryBox(hash) {
    await Helper.delay(1000, this.pk, `Opening Mystery Box`, this);
    logger.info(`Opening Mystery Box`);
    await this.fetch("/user/rewards/mystery-box/open", "POST", this.token, {
      hash: hash,
    })
      .then(async (data) => {
        if (data.code == 0) {
          await Helper.delay(
            3000,
            this.pk,
            `Successfully open mystery box got ${data.data.amount} RING`,
            this
          );
        } else {
          await Helper.delay(1000, this.pk, data.message, this);
          logger.error(data.message);
        }
      })
      .catch((err) => {
        throw err;
      });
  }
}
