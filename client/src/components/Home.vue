<template>
  <v-card
    color="grey lighten-4"
    flat
    tile
    style="flex:1;"
    class="d-flex flex-column"
  >
    <v-toolbar
      class="flex-grow-0 flex-shrink-1"
      dense
      dark
      src="img/vbanner.jpg"
    >
      <v-app-bar-nav-icon @click="hndlPrint()"></v-app-bar-nav-icon>
      <!-- <v-btn icon>
        <router-link to="/login" tag="div">
          <v-icon @click="hndlPrint()">mdi-home</v-icon>
        </router-link>
      </v-btn> -->

      <v-toolbar-title @click="hndlClick('')" style="cursor: pointer;"
        >Tarqeem LIS</v-toolbar-title
      >

      <v-spacer></v-spacer>

      <!-- <v-btn icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-heart</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn> -->

      <v-btn icon @click="logout()">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-toolbar>
    <router-view></router-view>
  </v-card>
</template>

<script>
import { mapActions } from "vuex";

import { listIconClick } from "@/globals";

export default {
  data: () => ({
    listIconClick,
    extended: false,
    extendedSlot: false,
    prominent: false,
    dense: false,
    collapse: false,
    flat: false,
    bg: false,
    extensionHeight: 48,
  }),

  methods: {
    ...mapActions(["setBusy", "setAuth"]),

    hndlPrint: () => listIconClick.next({}),

    hndlClick(to) {
      this.$router.push(`/${to}`);
    },

    logout() {
      delete localStorage["auth_token"];
      this.$router.push("/login");
    },
  },

  created() {
    let authToken = localStorage["auth_token"];

    if (!authToken) this.$router.push("/login");

    let decoded = window.jwt_decode(authToken);

    window["auth"] = decoded;

    this.setAuth(decoded);
  },
};
</script>
