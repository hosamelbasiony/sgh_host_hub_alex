<template>
  <v-card class="d-flex flex-column flex-grow-1" color="white">
    <v-container id="dropdown-example">
      <v-btn
        v-if="day"
        fixed
        dark
        fab
        bottom
        right
        color="pink"
        v-on="on"
        @click="newShift()"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>

      <v-row>
        <h1 class="font-weight-black flex-grow-1 ml-1 text-center">
          Shifts Setup
        </h1>

        <v-col cols="12" sm="12">
          <!-- <p>Week day</p> -->

          <v-overflow-btn
            class="my-2"
            :items="dropdown_icon"
            label="Week day"
            segmented
            target="#dropdown-example"
            @change="hndlDayChange($event)"
          ></v-overflow-btn>
        </v-col>
      </v-row>

      <!-- </v-container>
    
    <v-container> -->

      <v-simple-table v-if="shifts.length">
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left"></th>
              <th class="text-left">Collection</th>
              <th class="text-left">Reporting</th>
              <th class="text-left"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="shift in shifts" :key="shift.id">
              <td @click="editShift(shift)" style="cursor: pointer;">
                <v-icon color="indigo">mdi-pencil</v-icon>
              </td>
              <td>
                {{ moment(shift.collectionTime, "HH:mm:ss").format("hh:mm A") }}
              </td>
              <td>
                {{ moment(shift.reportingTime, "HH:mm:ss").format("hh:mm A") }}
              </td>
              <td style="cursor: pointer;" @click="deleteShift(shift)">
                <v-icon color="red accent-4">mdi-delete</v-icon>
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </v-container>

    <v-dialog v-model="dialog2" max-width="500px">
      <v-card>
        <v-card-title>
          Shift data setup
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="currentShift.collectionTime"
            type="time"
            label="Collection time to"
            required
          ></v-text-field>
        </v-card-text>
        <v-card-text>
          <v-text-field
            v-model="currentShift.reportingTime"
            type="time"
            label="Reporting time"
            required
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" text @click="closeDialog()">
            Close
          </v-btn>
          <v-btn color="primary" text @click="closeDialog(true)">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import axios from "axios";
import { mapActions } from "vuex";

export default {
  data: () => ({
    day: null,
    shifts: [],
    dialog2: false,
    currentShift: {},
  }),

  watch: {
    day() {
      // alert(`day: ${this.day}`);
    },
  },

  methods: {
    ...mapActions(["setBusy"]),

    async closeDialog(saveFlag = false) {
      if (saveFlag) {
        this.setBusy(true);
        await axios.put(
          `${process.env.VUE_APP_API_URL}scheduling/shifts`,
          this.currentShift
        );
        this.setBusy(false);
      }

      this.dialog2 = false;
    },

    async deleteShift(shift) {
      this.setBusy(true);
      await axios.delete(
        `${process.env.VUE_APP_API_URL}scheduling/shifts/${shift.id}`
      );
      this.shifts = this.shifts.filter((x) => x.id != shift.id);
      this.setBusy(false);
    },

    async editShift(shift) {
      this.currentShift = shift;
      this.dialog2 = true;
    },

    async hndlDayChange(day) {
      this.setBusy(true);

      this.day = day;
      const ret = await axios.get(
        `${process.env.VUE_APP_API_URL}scheduling/shifts/${day}`
      );
      const data = ret.data;

      this.shifts = data;

      this.setBusy(false);

      console.log(data);
    },

    async newShift() {
      this.setBusy(true);

      const ret = await axios.post(
        `${process.env.VUE_APP_API_URL}scheduling/shifts`,
        {
          day: this.day,
          collectionTime: "00:00:00", // this.moment("00:00:00").format('hh:mm:ss'),
          reportingTime: "00:00:00",
        }
      );

      const data = ret.data;

      this.shifts = [...this.shifts, data];
      console.log(data);

      this.setBusy(false);
    },
  },
  created() {
    window["moment"] = this.moment;

    this.dropdown_icon = this.moment
      .weekdays()
      .map((day) => ({ text: day, callback: () => (this.day = day) }));
  },
};
</script>

<style scoped>
th,
td {
  color: black !important;
  font-size: 1.05rem !important;
}
</style>
