import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  sendAndConfirmRawTransaction,
} from "@solana/web3.js";
import { Helper } from "../utils/helper.js";
import { Config } from "../config/config.js";
import nacl from "tweetnacl";
import { API } from "../api/api.js";
import logger from "../utils/logger.js";
import twist from "../utils/twist.js";
import { account } from "../../account.js";

export class Solana extends API {
  constructor(pk) {
    const apiUrl = "https://odyssey-api-beta.sonic.game";
    super(apiUrl, account.indexOf(pk) + 1);
    this.pk = pk;
    this.draw = 0;
    this.lottery = 0;
    this.connection = new Connection("https://devnet.sonic.game", 'confirmed');
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
    twist.log(`Connecting to Sonic Odyssey`, this.pk, this);
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
              logger.info(`Connected to Sonic Odyssey`);
              twist.log(`Connected to Sonic Odyssey`, this.pk, this);
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
      twist.log(`Executing Transaction..`, this.pk, this);
      const tx = await sendAndConfirmTransaction(this.connection, trans, [
        this.wallet,
      ]);
      logger.info(`Tx Url: https://explorer.sonic.game/tx/${tx}`);
      twist.log(`Tx Url: https://explorer.sonic.game/tx/${tx}`, this.pk, this);
      await Helper.delay(1000);
      return tx;
    } catch (error) {
      logger.error(`Transaction failed: ${error.message}`, error);
      throw error;
    }
  }

  async doRawTx(trans) {
    try {
      logger.info(`Execute Transaction ${JSON.stringify(trans)}`);
      twist.log(`Executing Transaction..`, this.pk, this);
      await trans.partialSign(this.wallet);
      const rawTransaction = trans.serialize();
      const tx = await this.connection.sendRawTransaction(rawTransaction);
      logger.info(`Tx Url: https://explorer.sonic.game/tx/${tx}`);
      twist.log(`Tx Url: https://explorer.sonic.game/tx/${tx}`, this.pk, this);
      await Helper.delay(1000);
      return tx;
    } catch (error) {
      logger.error(`Transaction failed: ${error.message}`, error);
      throw error;
    }
  }

  async sendSolToAddress() {
    try {
      const destAddress =
        Config.destAddress[Helper.random(0, Config.destAddress.length - 1)] ??
        this.address;
      const amount = Config.sendAmount;
      logger.info(`Sending ${amount} to ${destAddress}`);
      twist.log(`Sending ${amount} to ${destAddress}`, this.pk, this);
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
    twist.log(`Try to Check-in`, this.pk, this);
    await this.fetch(`/user/check-in/transaction`, "GET", this.token, null)
      .then(async (data) => {
        if (data.code == 0) {
          const transactionBuffer = Buffer.from(data.data.hash, "base64");
          const transaction = Transaction.from(transactionBuffer);

          const tx = await this.doTx(transaction);

          logger.info(
            `Check-in Transaction Executed Successfully, continue with post check in process`
          );
          twist.log,
            `Check-in Transaction Executed Successfully, continue with post check in process`,
            this.pk,
            this;
          this.dailyTx.total_transactions += 1;
          await this.postCheckIn(tx);
        } else {
          twist.log(data.message, this.pk, this);
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  async postCheckIn(tx) {
    twist.log(`Execute post check in process`, this.pk, this);
    await this.fetch(`/user/check-in`, "POST", this.token, {
      hash: tx,
    })
      .then((data) => {
        if (data.code != 0) {
          throw new Error(data.message);
        } else {
          twist.log("Checked in Successfully", this.pk, this);
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  async getRewardInfo() {
    try {
      twist.log(`Getting Reward Information`, this.pk, this);
      await this.fetch("/user/rewards/info", "GET", this.token)
        .then((data) => {
          if (data.code == 0) {
            this.reward = data.data;
            twist.log(
              `Successfully Get User Reward Information`,
              this.pk,
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
      twist.log(`Getting Daily Tx Info`, this.pk, this);
      await this.fetch(
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
            twist.log(`Successfully Get Daily Tx Information`, this.pk, this);
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
    twist.log(`Claiming Tx Milestone Stage ${stage}`, this.pk, this);
    await this.fetch(`/user/transactions/rewards/claim`, "POST", this.token, {
      stage: stage,
    })
      .then((data) => {
        if (data.code != 0) {
          twist.log(
            `Tx milestone Stage ${stage} Already Claimed`,
            this.pk,
            this
          );
        } else {
          twist.log(
            `Tx milestone Stage ${stage} Claimed Successfully`,
            this.pk,
            this
          );
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  async claimMysteryBox() {
    logger.info(`Building TX`);
    await this.fetch(
      "/user/rewards/mystery-box/build-tx",
      "GET",
      this.token,
      undefined
    )
      .then(async (data) => {
        if (data.code == 0) {
          const transactionBuffer = Buffer.from(data.data.hash, "base64");
          var transaction = Transaction.from(transactionBuffer);
          const tx = await this.doRawTx(transaction);
          await this.openMysteryBox(tx);
          await Helper.delay(1000);
        } else {
          twist.log(data.message, this.pk, this);
          logger.error(data.message);
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  async openMysteryBox(hash) {
    twist.log(`Opening Mystery Box`, this.pk, this);
    logger.info(`Opening Mystery Box`);
    await this.fetch("/user/rewards/mystery-box/open", "POST", this.token, {
      hash: hash,
    })
      .then(async (data) => {
        if (data.code == 0) {
          twist.log(`Successfully open mystery box got ${data.data.amount} RING`, this.pk, this);
          await Helper.delay(3000);
        } else {
          twist.log(data.message, this.pk, this);
          logger.error(data.message);
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  async drawLottery() {
    twist.log(`Prepare for Drawing Lottery`, this.pk, this);
    logger.info(`Prepare for Drawing Lottery`);
    try {
      const data = await this.fetch(
        "/user/lottery/build-tx",
        "GET",
        this.token
      );
      if (data.code == 0) {
        const transactionBuffer = Buffer.from(data.data.hash, "base64");
        const transaction = Transaction.from(transactionBuffer);
        let block;
        try {
          const tx = await this.doTx(transaction);
          block = await this.postDrawLottery(tx);
          return block; // Ensure the result is returned
        } catch (err) {
          twist.log(`Failed, Retrying...`, this.pk, this);
          return await this.drawLottery();
        }
      } else {
        twist.log(data.message, this.pk, this);
        logger.error(data.message);
        twist.log(`Failed, Retrying...`, this.pk, this);
        return await this.drawLottery();
      }
    } catch (err) {
      return await this.drawLottery();
    }
  }

  async postDrawLottery(hash) {
    twist.log(
      `Drawing Lottery for ${Config.drawAmount} Times, ${
        Config.drawAmount - this.draw
      } Left`,
      this.pk,
      this
    );
    logger.info(`Drawing Lottery With Hash ${hash}`);
    await Helper.delay(1000);
    try {
      const data = await this.fetch("/user/lottery/draw", "POST", this.token, {
        hash: hash,
      });
      if (data.code == 0) {
        twist.log(
          `Successfully draw lottery ${JSON.stringify(data.data)}`,
          this.pk,
          this
        );
        logger.info("Successfully draw lottery");
        this.draw += 1;
        return data.data.block_number;
      } else {
        twist.log(data.message, this.pk, this);
        logger.error(data.message);
        return await this.postDrawLottery(hash);
      }
    } catch (err) {
      twist.log(`Failed, Retrying...`, this.pk, this);
      await this.postDrawLottery(hash);
    }
  }

  async claimLottery(block) {
    twist.log(`Claim Lottery Reward for ${block}`, this.pk, this);
    logger.info(`Claim Lottery Reward for ${block}`);
    await Helper.delay(1000);
    await this.fetch(
      `/user/lottery/draw/winner?block_number=${block}`,
      "GET",
      this.token
    )
      .then(async (data) => {
        if (data.code == 0) {
          if (data.data.winner == null) {
            if (this.lottery <= Config.maxRetry) {
              logger.info(`Winner for block ${block} is not Announced`);
              twist.log(
                `Winner for block ${block} is not Announced, trying again after 5 Minutes`,
                this.pk,
                this
              );
              this.lottery += 1;
              await Helper.delay(60000 * 5);
              await this.claimLottery(block);
            } else {
              logger.info(`Winner for block ${block} is not Announced`);
              twist.log(
                `Winner for block ${block} not anounced after 15 minutes, skipping the claim`,
                this.pk,
                this
              );
            }
          } else {
            logger.info(
              `Lottery Reward: Got ${data.data.reward} RINGS and ${data.data.extra_rewards} RING`
            );
            twist.log(
              `Lottery Reward: Got ${data.data.reward} RINGS and ${data.data.extra_rewards} RING`,
              this.pk,
              this
            );
          }
        } else {
          twist.log(data.message, this.pk, this);
          logger.error(data.message);
          throw Error(data.message);
        }
      })
      .catch(async (err) => {
        throw err;
      });
  }
}
