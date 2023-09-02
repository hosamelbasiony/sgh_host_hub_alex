<template>
  <div class="d-flex flex-row flex-grow-1 pa-2 mt-2">
    <v-navigation-drawer
      v-model="drawer"
      src="img/vbanner.jpg"
      style="position: fixed;"
      dark
      absolute
      temporary
      fill
    >
      <v-list-item @click="hndlClick('')">
        <v-list-item-avatar>
          <v-img src="/img/Untitled.png"></v-img>
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title>Tarqeem LIS</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list dense>
        <v-list-item
          v-for="(item, i) in items"
          :key="i"
          @click="hndlClick(item.action)"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.text }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-flex xs12 class="d-flex flex-grow-1 pa-2">
      <router-view></router-view>
    </v-flex>
  </div>
</template>

<script>
import { listIconClick } from "@/globals";

export default {
  data: () => ({
    listIconClickSubscribtion: false,
    listIconClick,

    drawer: null,

    item: 0,
    items: [
      { text: "Print", icon: "mdi-printer", action: "print" },
      // { text: 'Print', icon: 'mdi-printer', action: 'barcode' },
      // { text: 'Receipts', icon: 'mdi-receipt', action: 'receipt' },
      { text: "Shifts setup", icon: "mdi-clock", action: "shifts-setup" },
      { text: "Run setup", icon: "mdi-camera-timer", action: "run-setup" },
      { text: "Scheduling", icon: "mdi-spotlight", action: "schedules" },
      { text: "Devices", icon: "mdi-spotlight", action: "devices" },
      { text: "User setup", icon: "mdi-account" },
      // { text: 'Conversions', icon: 'mdi-flag' },
      // { text: 'Setup', icon: 'mdi-settings' },
    ],
  }),
  methods: {
    hndlClick(to) {
      this.$router.push(`/${to}`);
    },
  },
  created() {
    this.listIconClickSubscribtion = this.listIconClick.subscribe({
      next: () => {
        // this.$router.push('/reg/settings');
        this.drawer = !this.drawer;
      },
    });
  },
  destroyed: function() {
    this.listIconClickSubscribtion.unsubscribe();
  },
};
</script>

<style></style>
