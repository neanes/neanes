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
:root {
  --zoom: 1;

  --btn-color-selected: lightsteelblue;
}

@media print {
  :root {
    --zoom: 1 !important;
  }
}

@page {
  margin: 0;
}

@font-face {
  font-family: Neanes;
  src: url('~@/assets/fonts/Neanes.otf');
}

@font-face {
  font-family: Omega;
  src: url('~@/assets/fonts/EZ Omega.ttf');
}

@font-face {
  font-family: Athonite;
  src: url('~@/assets/fonts/Athonite.ttf');
}

@font-face {
  font-family: PFGoudyInitials;
  src: url('~@/assets/fonts/PFGoudyInitials.ttf');
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

.ok-btn {
  padding: 0.5rem;
  border: none;
  background-color: rgb(66, 139, 202);
  color: white;
  border-radius: 4px;
}

.ok-btn:hover {
  background-color: rgb(81, 157, 223);
}

.neutral-btn,
.cancel-btn {
  padding: 0.5rem;
  border: 1px solid black;
  background-color: white;
  border-radius: 4px;
}

.neutral-btn:hover,
.cancel-btn:hover {
  background-color: #f8fbff;
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
