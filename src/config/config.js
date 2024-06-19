import { addressList } from "./address_list.js";

export class Config {
  static sendAmount = 0.0001; //amount to send in sol
  static destAddress = addressList; //address destination list
  static massTxCount = 100; //tx count
  static repeat = false; // for keep repeating the boot after all account processed
}
