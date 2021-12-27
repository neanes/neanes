<template>
  <div id="app">
    <!-- <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div> -->
    <router-view />
  </div>
</template>

<style>
@page {
  margin: 0;
}

@font-face {
  font-family: Psaltica;
  src: url('~@/assets/EZ Psaltica.ttf');
  /* src: url('~@/assets/KANewStathisMain-Regular.ttf'); */
}

@font-face {
  font-family: Omega;
  src: url('~@/assets/EZ Omega.ttf');
}

@font-face {
  font-family: Athonite;
  src: url('~@/assets/Athonite.ttf');
}

@font-face {
  font-family: EzSpecial1;
  src: url('~@/assets/EZ Special-I.ttf');
}

@font-face {
  font-family: EzSpecial2;
  src: url('~@/assets/EZ Special-II.ttf');
}

@font-face {
  font-family: EzFthora;
  src: url('~@/assets/EZ Fthora.ttf');
}

@font-face {
  font-family: Oxeia;
  src: url('~@/assets/EZ Oxeia.ttf');
}

html {
  height: 100vh;
}

body {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;

  font-size: 16px;
}
</style>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  flex: 1;

  height: 100%;
}
</style>
