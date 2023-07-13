<script setup>
import { ref } from "vue";
import * as bip39 from "bip39";
import etherWallet, { hdkey } from "ethereumjs-wallet";
import Web3 from "web3";
import {useRouter} from "vue-router"
import { showDialog } from "vant";
import store2 from "store2";

//the function for get Mnemonic
const getMnemonic = () => {
  return bip39.generateMnemonic();
};
  const router = useRouter()

//the function to generate a wallet by a Mnemonic
const getWallet = async (mnemonic, deriveNum, walletPassword) => {
  // the first thing is generate a seed by the mnemonic

  const seed = await bip39.mnemonicToSeed(mnemonic);
  // then use the seed, we can develop the hdKey
  const hdKey = hdkey.fromMasterSeed(seed);
  //we can gain the root keypair to revert a wallet by derived algorithm and derived path
  //"m/44'/60'/0'/0/0"
  const keypair = hdKey.derivePath(`m/44'/60'/0'/0/${deriveNum}`);

  //use the keypair to revert or generate a wallet
  const wallet = keypair.getWallet();

  //this wallet is account info of current use,incuding private key , public key and address etc.

  // generate the key store
  const keyStore = await wallet.toV3String(walletPassword);
  const keyStore1 = await wallet.toV3(walletPassword);
  console.log("keyStore:", keyStore);
  console.log("keyStore1:", keyStore1);
  const walletInfo = {
    address: wallet.getAddressString(),
    privateKey: wallet.getPrivateKeyString(),
    publicKey: wallet.getPublicKeyString(),
    mnemonic,
    keyStore,
    password: walletPassword,
  };

  return walletInfo;
};

const username = ref("");
const password = ref("");

const show = ref(true);

const diagramShow = ref(false);

const toConfirmDiagramShow = ref(false);

const cunrrentMnemonic = ref();
const verifiedMnemonic = ref();

const confirmDialog = () => {
  toConfirmDiagramShow.value = true;
};

const verifyConfirmDialog = () => {
  if (cunrrentMnemonic.value === verifiedMnemonic.value) {
    // load the homepage
    show.value = false;
  } else {
    showDialog({
      message: "The Mnemonic you typed is wrong.",
    }).then(() => {
      // on close
    router.push('/info')
    });
  }
};

//create a new Account
const submit = async (values) => {
  //succeed to verify the form data,then going for generate the user's account.
  let mnemonic = "";

  if (store2.has("walletInfo")) {
    mnemonic = store2.get("walletInfo")[0].mnemonic;
  } else {
    mnemonic = getMnemonic();
  }
  let maxDerivedNum = 0;
  if (store2.has("maxDerivedNum")) {
    maxDerivedNum = store2.get("maxDerivedNum");
    console.log("current maxDerivedNum:", maxDerivedNum);
    maxDerivedNum++;
    console.log("modified maxDerivedNum:", maxDerivedNum);
  }
  //now we can use the default value for derived path
  const wallet = await getWallet(mnemonic, maxDerivedNum, values.password);
  // const account = wallet.address;
  const walletInfos = [];
  walletInfos.push(wallet);
  //need to remember the derive num ,it's convenient to create a new Account
  store2.add("maxDerivedNum", maxDerivedNum);
  store2.add("walletInfo", walletInfos);
  store2.add("currentAccount", wallet.address);
  show.value = false;
  diagramShow.value = true;
  
  cunrrentMnemonic.value = mnemonic;

  // store derived number and wallet in local.
  // use the encroypt algorithm is the best way to store

  //refer to username to execute the smart contract it is a specific function for regirstion
  // todo ..   createUser(string storage username);
};

// this function will clear the all information of wallets
const initData = () => {
  store2.clearAll();
};

//if useing the UTC file to login,it's not need to access the mnenomic logic,just create a wallet info
const importForLogin = (file, passwordOfAccount) => {
  const oldWallet = new Web3().eth.accounts.decrypt(file, passwordOfAccount);
  const walletInfo = {
    address: oldWallet.getAddressString(),
    privateKey: oldWallet.getPrivateKeyString(),
    publicKey: oldWallet.getPublicKeyString(),
  };
  store2.set("importedWallet", walletInfo);
};

//
</script>

<template>
  <!-- <van-button @click="regirst" type="primary">Sign in</van-button> -->
  <!-- <van-button @click="login" type="success">Login in</van-button> -->
  <van-form @submit="submit" v-show="show">
    <van-cell-group inset>
      <van-field
        v-model="username"
        name="NickName"
        label="NickName"
        placeholder="NickName"
        :rules="[{ required: true, message: 'Please fill in the nickname' }]"
      />
      <van-field
        v-model="password"
        type="password"
        name="password"
        label="Password"
        placeholder="Password"
        :rules="[{ required: true, message: 'Please fill in the password' }]"
      />
    </van-cell-group>
    <div style="margin: 16px">
      <van-button round block type="primary" native-type="submit">
        Sign in
      </van-button>
    </div>
  </van-form>

  <van-dialog
    v-model:show="diagramShow"
    title="Please store the Mnemoic.It's very important to resert your account."
    show-cancel-button
    @confirm="confirmDialog"
  >
    <van-cell-group inset>
      <van-field
        v-model="cunrrentMnemonic"
        rows="1"
        autosize
        label="Mnemonic"
        type="textarea"
      />
    </van-cell-group>
  </van-dialog>

  <van-dialog
    v-model:show="toConfirmDiagramShow"
    title="Please fill your Mnemonic in the text-box to access your homepage"
    show-cancel-button
    @confirm="verifyConfirmDialog"
  >
    <van-cell-group inset>
      <van-field
        v-model="verifiedMnemonic"
        rows="1"
        autosize
        label="Mnemonic"
        type="textarea"
      />
    </van-cell-group>
  </van-dialog>
</template>

<style lang="less"></style>
