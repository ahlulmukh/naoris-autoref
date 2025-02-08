const { logMessage } = require("../utils/logger");
const { Wallet } = require("ethers");
const CryptoJS = require("crypto-js");
const { RequestBuilder } = require("ts-curl-impersonate");

class naorisProtocol {
  constructor(refCode, proxy = null, currentNum, total) {
    this.refCode = refCode;
    this.proxy = proxy ? this.parseProxy(proxy) : null;
    this.currentNum = currentNum;
    this.total = total;
    this.aeskey = "X7KKHhJ67hE9ITXoGa89r74hMEPgysMwbuRRiJKFCIfxdKT9G8";
    this.wallet = Wallet.createRandom();
  }

  getWallet() {
    return this.wallet;
  }

  parseProxy(proxyString) {
    if (!proxyString) return null;
    try {
      const url = new URL(proxyString);
      return {
        host: url.hostname,
        port: parseInt(url.port),
        username: url.username || null,
        password: url.password || null,
      };
    } catch (error) {
      console.error("Invalid proxy format:", error);
      return {};
    }
  }

  async createEncryptedWallet() {
    const encryptedAddress = CryptoJS.AES.encrypt(
      JSON.stringify(this.wallet.address),
      this.aeskey
    ).toString();
    return encryptedAddress;
  }

  async registerWallet(encryptedWallet) {
    const sendData = {
      wallet_address: encryptedWallet,
      referrer_code: this.refCode,
    };

    const headers = {
      "User-Agent": this.userAgent,
      origin: "chrome-extension://dbgibbbeebmbmmhmebogidfbfehejgfo",
      Accept: "application/json, text/plain, */*",
      Connection: "keep-alive",
      "Content-Type": "application/json",
    };

    const proxyOptions = this.proxy ? { flag: ["--proxy", this.proxy] } : {};
    try {
      const response = await new RequestBuilder()
        .url(`https://naorisprotocol.network/sec-api/api/create-wallet`)
        .method("POST")
        .headers(headers)
        .body(JSON.stringify(sendData))
        .send({ ...proxyOptions });
      const jsonResponse =
        typeof response.response === "string"
          ? JSON.parse(response.response)
          : response.response;
      return jsonResponse;
    } catch (error) {
      logMessage(
        this.currentNum,
        this.total,
        `Failed to register wallet ${error.message}`,
        "error"
      );
    }
  }
}

module.exports = naorisProtocol;
