import { Helper } from "../utils/helper.js";
import logger from "../utils/logger.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";

export class API {
  constructor(url, proxy) {
    this.url = url;
    this.ua = Helper.randomUserAgent();
    this.proxy = this.proxy;
    if (this.proxy) {
      this.agent = new HttpsProxyAgent(this.proxy);
    } else {
      this.agent = undefined;
    }
  }

  generateHeaders(token) {
    const headers = {
      Accept: "*/*",
      "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
      "Content-Type": "application/json",
      "User-Agent": this.ua,
    };

    if (this.token) {
      headers.Authorization = token;
    }
    // console.log(headers);
    return headers;
  }

  async fetch(
    endpoint,
    method,
    token,
    body = {},
    cred = "include",
    additionalHeader = {},
    customUrl = undefined
  ) {
    try {
      const url = `${customUrl == undefined ? this.url : customUrl}${endpoint}`;
      let headers = this.generateHeaders(token);
      headers = Object.assign(headers, additionalHeader);
      const options = {
        cache: "default",
        credentials: cred,
        headers,
        method,
        mode: "cors",
        redirect: "follow",
        referrer: this.url,
        agent: this.agent,
        referrerPolicy: "strict-origin-when-cross-origin",
      };

      if (method !== "GET") {
        options.body = `${JSON.stringify(body)}`;
      }

      logger.info(`${method} : ${url}`);
      logger.info(`Request Header : ${JSON.stringify(headers)}`);
      logger.info(`Request Body : ${JSON.stringify(body)}`);

      const res = await fetch(url, options);

      logger.info(`Response : ${res.status} ${res.statusText}`);
      logger.info(``);

      if (res.ok || res.status == 400) {
        const data = await res.json();
        logger.info(`Response Data : ${JSON.stringify(data)}`);
        return data;
      } else {
        throw new Error(res.statusText);
      }
    } catch (err) {
      logger.error(`Error : ${err.message}`);
      throw err;
    }
  }
}
