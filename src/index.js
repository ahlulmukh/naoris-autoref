const { prompt, logMessage, rl } = require("./utils/logger");
const naorisProtocol = require("./classes/naorisProtocol");
const { generateDeviceHash } = require("./utils/generator");
const { getRandomProxy, loadProxies } = require("./classes/proxy");
const chalk = require("chalk");
const fs = require("fs");

async function main() {
  console.log(
    chalk.cyan(`
░█▀█░█▀█░█▀█░█▀▄░▀█▀░█▀▀
░█░█░█▀█░█░█░█▀▄░░█░░▀▀█
░▀░▀░▀░▀░▀▀▀░▀░▀░▀▀▀░▀▀▀
 By : El Puqus Airdrop
 github.com/ahlulmukh
  `)
  );

  const refCode = await prompt(chalk.yellow("Enter Referral Code: "));
  const count = parseInt(await prompt(chalk.yellow("How many do you want? ")));
  const proxiesLoaded = loadProxies();
  if (!proxiesLoaded) {
    logMessage(null, null, "No Proxy. Using default IP", "warning");
  }

  let successful = 0;
  const accountNaoris = fs.createWriteStream("accounts.txt", { flags: "a" });

  let accounts = [];
  if (fs.existsSync("accounts.json")) {
    const data = fs.readFileSync("accounts.json", "utf8");
    accounts = JSON.parse(data);
  }

  try {
    for (let i = 0; i < count; i++) {
      console.log(chalk.white("-".repeat(85)));
      logMessage(i + 1, count, "Processing register wallet", "process");

      const currentProxy = await getRandomProxy(i + 1, count);
      const naoris = new naorisProtocol(refCode, currentProxy, i + 1, count);

      try {
        const hashId = generateDeviceHash();
        const encryptWallet = await naoris.createEncryptedWallet();
        const account = await naoris.registerWallet(encryptWallet);
        if (account) {
          logMessage(i + 1, count, "Register Account Success", "success");
          const token = await naoris.getToken();
          logMessage(i + 1, count, `Get Token Done`, "success");
          const wallet = naoris.getWallet();
          successful++;
          accountNaoris.write(`Adress : ${wallet.address}\n`);
          accountNaoris.write(`Mnomic Phrase: ${wallet.mnemonic.phrase}\n`);
          accountNaoris.write("-".repeat(85) + "\n");

          accounts.push({
            walletAddress: wallet.address,
            deviceHash: Number(hashId),
          });
        } else {
          logMessage(i + 1, count, "Register Account Failed", "error");
        }
      } catch (error) {
        logMessage(i + 1, count, `Error: ${error.message}`, "error");
      }
    }
  } finally {
    accountNaoris.end();
    fs.writeFileSync("accounts.json", JSON.stringify(accounts, null, 2));

    console.log(chalk.magenta("\n[*] Dono bang!"));
    console.log(
      chalk.green(`[*] Account dono ${successful} dari ${count} akun`)
    );
    console.log(chalk.magenta("[*] Result in accounts.txt and accounts.json"));
    rl.close();
  }
}

module.exports = { main };
