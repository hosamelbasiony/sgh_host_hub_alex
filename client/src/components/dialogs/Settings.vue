<template>
  <v-row justify="center">
    <v-dialog
      v-model="dialog"
      fullscreen
      hide-overlay
      transition="dialog-bottom-transition"
    >
      <template v-slot:activator="{ on }">
        <!-- <v-btn color="primary" dark v-on="on">Open Dialog</v-btn> -->
        <v-btn fixed dark fab bottom right color="pink" v-on="on">
          <v-icon>mdi-settings</v-icon>
        </v-btn>
      </template>
      <v-card>
        <v-toolbar dark color="primary">
          <v-btn icon dark @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>Barcode Settings</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-toolbar-items>
            <v-btn dark text @click="save()">Save</v-btn>
          </v-toolbar-items>
        </v-toolbar>

        <template>
          <v-form class="ma-4" ref="form" v-model="valid" lazy-validation>
            <v-select
              v-model="barcode.settings.barcodePrinter"
              :items="
                barcode.settings.printers.map(x => ({ value: x, text: x }))
              "
              label="Barcode Printer"
              required
            ></v-select>

            <v-select
              v-model="barcode.settings.labelsize"
              :items="labelSizes"
              label="Label Size"
              required
            ></v-select>

            <v-text-field
              v-model="barcode.settings.topMargin"
              label="Top Margin"
              type="number"
              required
            ></v-text-field>

            <v-text-field
              v-model="barcode.settings.leftMargin"
              label="Left Margin"
              type="number"
              required
            ></v-text-field>

            <v-text-field
              v-model="barcode.settings.websocketServerIP"
              label="Server Addresss"
              required
            ></v-text-field>

            <!-- <v-btn color="success" class="mr-4">
              Validate
            </v-btn>

            <v-btn color="error" class="mr-4">
              Reset Form
            </v-btn>

            <v-btn color="warning">
              Reset Validation
            </v-btn> -->
          </v-form>
        </template>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
export default {
  props: ["barcode"],

  data() {
    return {
      dialog: false,
      notifications: false,
      sound: true,
      widgets: false,
      labelSizes: [
        {
          value: 0,
          text: "Large"
        },
        {
          value: 1,
          text: "Medium"
        },
        {
          value: 2,
          text: "Small"
        }
      ]
    };
  },

  methods: {
    save() {
      this.dialog = false;
      this.$emit("updated", this.barcode.settings);
    }
  }
};
</script>
