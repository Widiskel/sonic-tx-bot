import bs58 from "bs58";

export class Helper {
  static base58decoder(base58PrivateKey) {
    try {
      const privateKeyBuffer = bs58.decode(base58PrivateKey);
      return privateKeyBuffer;
    } catch (error) {
      throw error;
    }
  }

  static async delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  static random(min, max) {
    const rand = Math.floor(Math.random() * (max - min + 1)) + min;
    return rand;
  }
}
