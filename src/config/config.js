import { addressList } from "./address_list.js";

export class Config {
  static sendAmount = 0.0001; //amount to send in sol
  static destAddress = addressList; //address destination list
  static drawAmount = 3; //lottery draw ammount
  static maxRetry = 3; // max error retry for claiming
  static useLottery = false; // if you want use lottery feature
}
