<template>
  <div id="app">
    <!-- <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div> -->
    <router-view/>
  </div>
</template>

<style>
@font-face {
    font-family: Psaltica;
    src: url('~@/assets/EZ Psaltica.ttf');
  }

@font-face {
    font-family: Omega;
    src: url('~@/assets/EZ Omega.ttf');
}

@font-face {
    font-family: EzSpecial2;
    src: url('~@/assets/EZ Special-II.ttf');
}

body {
    font-size: 16px;
}
</style>
