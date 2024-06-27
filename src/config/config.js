import { addressList } from "./address_list.js";

export class Config {
  static sendAmount = 0.0001; //amount to send in sol
  static maxErrorCount = 3; //max error retry
  static destAddress = addressList; //address destination list
}
