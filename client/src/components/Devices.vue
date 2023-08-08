<template>
  <v-card class="d-flex flex-column flex-grow-1" color="white">
    <v-container
      id="dropdown-example"
      class="d-flex flex-row flex-wrap justify-start"
      style="justify-content: space-around;"
    >
      <v-dialog
        v-model="dialog"
        fullscreen
        hide-overlay
        transition="dialog-bottom-transition"
      >
        <template v-slot:activator="{ on }">
          <!-- <v-btn color="primary" dark v-on="on">Open Dialog</v-btn> -->
          <v-btn
            fixed
            dark
            fab
            bottom
            right
            color="indigo"
            @click="addDevice()"
            v-on="on"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </template>
        <v-card>
          <v-toolbar dark color="primary">
            <v-btn icon dark @click="dialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-toolbar-title>Device Data</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items>
              <v-btn dark text @click="hndlSave()">Save</v-btn>
            </v-toolbar-items>
          </v-toolbar>

          <v-flex pa-5>
            <v-avatar size="75" fill>
              <img :src="currentDevice.deviceImage" alt="device image" fill />
            </v-avatar>

            <v-text-field
              v-model="currentDevice.deviceId"
              label="Device Id"
              required
            ></v-text-field>

            <v-text-field
              v-model="currentDevice.deviceName"
              label="Device Name"
              required
            ></v-text-field>

            <v-textarea
              v-model="currentDevice.deviceImage"
              label="Image Uri"
              required
            ></v-textarea>
          </v-flex>

          <v-divider></v-divider>
        </v-card>
      </v-dialog>

      <v-card
        class="mx-auto ma-md-5 mb-sm-4 flex-grow-1 mb-2"
        max-width="400"
        width="325"
        max-height="500"
        v-for="device in devices"
        :key="device.id"
        elevation="2"
      >
        <v-img
          class="white--text align-end"
          height="200px"
          :src="device.deviceImage"
          contain
          style="background-color:#3f718"
        >
        </v-img>

        <v-card-text class="text--primary"
          ><div>Device ID: {{ device.deviceId }}</div></v-card-text
        >

        <v-card-title class="black--text"
          >Device Name: {{ device.deviceName }}</v-card-title
        >

        <v-divider></v-divider>

        <v-chip
          class="ma-2 pa-4"
          color="indigo"
          text-color="white"
          @click="hostCodes(device)"
        >
          <v-avatar left>
            <v-icon>mdi-pencil</v-icon>
          </v-avatar>
          Codes
        </v-chip>
        <v-chip
          class="ma-2 pa-4"
          color="red"
          text-color="white"
          @click="edit(device)"
        >
          <v-avatar left>
            <v-icon>mdi-settings</v-icon>
          </v-avatar>
          Edit
        </v-chip>

        <v-chip
          class="ma-2 pa-4"
          color="orange"
          text-color="white"
          @click="edit(device)"
        >
          <v-avatar left>
            <!-- <v-icon>mdi-eye-off</v-icon> -->
            <v-icon>mdi-eye</v-icon>
          </v-avatar>
          Monitor
        </v-chip>
      </v-card>

      <!-- <v-alert width="100" height="100" border="left" colored-border color="deep-purple accent-4" elevation="2">111111</v-alert>
      <v-alert width="100" height="100" border="left" colored-border color="deep-purple accent-4" elevation="2">111111</v-alert>
      <v-alert width="100" height="100" border="left" colored-border color="deep-purple accent-4" elevation="2">111111</v-alert>
      <v-alert width="100" height="100" border="left" colored-border color="deep-purple accent-4" elevation="2">111111</v-alert>
      <v-alert width="100" height="100" border="left" colored-border color="deep-purple accent-4" elevation="2">111111</v-alert>
      <v-alert width="100" height="100" border="left" colored-border color="deep-purple accent-4" elevation="2">111111</v-alert>
      <v-alert width="100" height="100" border="left" colored-border color="deep-purple accent-4" elevation="2">111111</v-alert>
      <v-alert width="100" height="100" border="left" colored-border color="deep-purple accent-4" elevation="2">111111</v-alert>
      <v-alert width="100" height="100" border="left" colored-border color="deep-purple accent-4" elevation="2">111111</v-alert>
      <v-alert width="100" height="100" border="left" colored-border color="deep-purple accent-4" elevation="2">111111</v-alert>
      <v-alert width="100" height="100" border="left" colored-border color="deep-purple accent-4" elevation="2">111111</v-alert>
      <v-alert width="100" height="100" border="left" colored-border color="deep-purple accent-4" elevation="2">111111</v-alert> -->
    </v-container>
  </v-card>
</template>

<script>
import axios from "axios";

export default {
  data: () => ({
    devices: [],
    dialog: false,
    // deviceModel: {
    //   deviceCodes: [],
    //   deviceId: 0,
    //   deviceImage: "",
    //   deviceName: "New_device_name",
    //   id: 0
    // },
    currentDevice: null,
  }),

  async created() {
    this.currentDevice = {
      deviceCodes: [],
      deviceId: 0,
      deviceImage: "",
      deviceName: "New_device_name",
      id: 0,
    };

    const ret = await axios.get(`${process.env.VUE_APP_API_URL}devices`);
    const data = ret.data;

    this.devices = data;
  },

  methods: {
    async edit(device) {
      this.currentDevice = device;
      this.dialog = true;
    },

    async hostCodes(device) {
      this.$router.push(`device/codes/${device.id}`);
      // device/codes/:deviceId
    },

    async addDevice() {
      this.currentDevice = {
        deviceCodes: [],
        deviceId: 0,
        deviceImage: "",
        deviceName: "New_device_name",
        id: 0,
      };
    },

    async hndlSave() {
      let ret;
      if (this.currentDevice.id == 0)
        ret = await axios.post(
          `${process.env.VUE_APP_API_URL}devices`,
          this.currentDevice
        );
      else
        ret = await axios.put(
          `${process.env.VUE_APP_API_URL}devices`,
          this.currentDevice
        );

      const data = ret.data;

      if (this.currentDevice.id == 0) this.devices = [...this.devices, data];

      this.dialog = false;
    },

    async newDevice() {
      alert();
    },
  },
};
</script>
