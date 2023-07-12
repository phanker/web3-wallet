<script setup>
import { computed, defineProps, ref } from "vue";
import { ActionSheet, closeDialog, showDialog, showConfirmDialog } from "vant";
import store2 from "store2";
import Web3 from "web3";
import Tx from "ethereumjs-tx";

// the accounts from the parent module
const props = defineProps(["wallet-info"]);
const currentAccount = ref();
//current account info
currentAccount.value = store2.get("currentAccount");
var web3 = new Web3(
  Web3.givenProvider ||
    "wss://sepolia.infura.io/ws/v3/f7111f8fbbf1414f8610728102a2adc7"
);

// show currentAccount balance .
const balance = ref();

const showAccountBalance = async () => {
  console.log("currentAccount,", currentAccount.value);
  balance.value = await web3.eth.getBalance(currentAccount.value);
  balance.value = web3.utils.fromWei(balance.value, "ether");
  //monitor the the lastest change of block for currentAccount;
  web3.eth.subscribe("newBlockHeaders", async (error, result) => {
    if (!error) {
      const ball = await web3.eth.getBalance(currentAccount.value);
      balance.value = web3.utils.fromWei(ball, "ether");
    }
  });
};

showAccountBalance();

const accountInfos = {};

const initData = computed(() => {
  let accounts = [];
  props.walletInfo.forEach(async (element) => {
    const newEle = {};
    newEle.name = element.address;

    const accountInfo = {};
    accountInfo.address = element.address;
    accountInfo.privateKey = element.privateKey;
    accountInfo.password = element.password;
    accountInfos[element.address] = accountInfo;

    //get the balace for current address from the lastest block
    web3.eth.getBalance(element.address, "latest").then((res) => {
      const balance = web3.utils.fromWei(res, "ether");
      console.log(element.address);
      console.log(balance);
    });
    accounts.push(newEle);
  });

  return accounts;
});

const showIt = ref(false);

const clickIt = () => {
  showIt.value = true;
};

const onSelect = (item) => {
  showIt.value = false;
  // showToast(item.name);
  currentAccount.value = item.name;
  store2.set("currentAccount", item.name);
  showAccountBalance();
  //request the smart contract to reload the homepage
};

const transferForm = ref(false);
const toTransfer = () => {
  transferForm.value = true;
};

const toAddress = ref();
const toAmount = ref();
const walletPassword = ref();

const startTransfer = () => {
  console.log("startTransfer.. verify the password if it's correct");

  const accountInfo = accountInfos[currentAccount.value];

  if (walletPassword.value === accountInfo.password) {
    console.log("password is correct..");
    transfer(
      currentAccount.value,
      toAddress.value,
      toAmount.value,
      accountInfo.privateKey
    );
  } else {
    showDialog({
      title: "Invalid Password",
      message:
        "Please text the correct password,The password you inputed was wrong.",
      theme: "round-button",
    }).then(() => {
      // on close
    });
  }
};

//define this function to implement the logic for tranfer account
const transfer = async (
  transferAccount,
  receiptAccount,
  transferAmount,
  privateKey
) => {
  console.log("transferAccount:", transferAccount);
  console.log("receiptAccount:", receiptAccount);
  console.log("transferAmount:", transferAmount);
  console.log("privateKey:", privateKey);

  //get the current account's nonce
  const nonce = await web3.eth.getTransactionCount(transferAccount);
  //estimate the price for gas
  const gasPrice = await web3.eth.getGasPrice();

  const value = web3.utils.toWei(transferAmount);
  console.log("value:", value);

  //1. define the structure of tranfer,that includs the essential parameters.
  const rawTX = {
    from: transferAccount,
    value,
    to: receiptAccount,
    nonce,
    gasPrice,
    //this is a standarad tokens from ERC20
    data: "0x00",
  };

  /**
   * 2.serialize detail of transfer
   */
  //2.1 change the private key and slice the first two numbers by the hex encrypt
  const priKey = Buffer(privateKey.slice(2), "hex");

  const gas = await web3.eth.estimateGas(rawTX);
  //2.2 the limit for gas
  rawTX.gas = gas;

  //2.3 use private key to sign with the original data of transfer
  const tx = new Tx(rawTX, { chain: "Sepolia" });
  tx.sign(priKey);
  //2.4 get serializeTx , it's the fina formatter for publishing the block chain net.
  const serializedTx = `0x${tx.serialize().toString("hex")}`;
  console.log(serializedTx);

  /**
   * 3. start to publish data
   */
  const trans = web3.eth.sendSignedTransaction(serializedTx);
  //1.this is a callback function for looking up the id.
  trans.on("transactionHash", (txid) => {
    console.log(`The transaction id is : ${txid}`);
  });

  //2.when the tranfer is comfirmed by the lastest block. we can see the state of the transaction
  trans.on("receipt", (rec) => {
    //at there we can close the form of transfer,because the transaction was successful.
    transferForm.value = false;
    console.log(`Receipted data :${rec}`);
  });

  trans.on("confirmation", (confirmation) => {
    console.log(`the transaction was confired :${confirmation}`);
  });
};
</script>

<template>
  <van-cell is-link title="Transfer Account" @click="clickIt" />
  <van-action-sheet
    v-model:show="showIt"
    :actions="initData"
    @select="onSelect"
  />

  <van-divider content-position="left">
    Current Account:{{ currentAccount }}</van-divider
  >
  <van-divider content-position="right">Balance :{{ balance }} ETH</van-divider>

  <van-button
    round
    color="linear-gradient(to right, #ff6034, #ee0a24)"
    @click="toTransfer"
    >Transfer Accounts</van-button
  >

  <van-dialog
    v-model:show="transferForm"
    title="Transfer Amounts"
    :showConfirmButton="false"
    :show-cancel-button="true"
  >
    <van-form @submit="startTransfer">
      <van-cell-group inset>
        <van-field
          v-model="toAddress"
          name="Receiptor"
          label="Receiptor"
          placeholder="Receiptor"
          :rules="[
            {
              required: true,
              message: `Please fill in the Receiptor's address`,
            },
          ]"
        />
        <van-field
          v-model="toAmount"
          name="Amount"
          label="Amount"
          placeholder="Amount"
          :rules="[
            {
              required: true,
              message: `Please fill in the Amount for this transfer`,
            },
          ]"
        />

        <van-field
          v-model="walletPassword"
          name="WalletPassword"
          type="password"
          label="WalletPassword"
          placeholder="WalletPassword"
          :rules="[
            {
              required: true,
              message: `Please fill in wallet password`,
            },
          ]"
        />
      </van-cell-group>
      <div style="margin: 16px">
        <van-button round block type="primary" native-type="submit">
          Commit
        </van-button>
      </div>
    </van-form>
  </van-dialog>
</template>

<style lang="less"></style>
