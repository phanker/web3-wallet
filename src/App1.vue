<script setup>
import RegirstButtonVue from "./components/wallet/RegirstButton.vue";
import AccountInfoVue from "./components/wallet/AccountInfo.vue";
import store2 from "store2";
import { onMounted, ref } from "vue";
const walletInfo = ref([]);
onMounted(() => {
  walletInfo.value = store2.has("walletInfo") ? store2.get("walletInfo") : [];
});
</script>

<template>
  <RegirstButtonVue></RegirstButtonVue>
  <AccountInfoVue :wallet-info="walletInfo"></AccountInfoVue>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
