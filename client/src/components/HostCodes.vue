<template>
  <v-flex class="d-flex flex-column">
    <v-dialog v-if="currentCode" v-model="dialog2" max-width="500px">
      <v-card @keyup="hndlModalKeyUp">
        <v-card-title>
          Host code
        </v-card-title>

        <!-- <pre>
          {{ JSON.stringify(currentCode, null, 3) }}
        </pre> -->

        <v-card-text>
          <v-text-field
            :value="currentCode.paramName"
            label="Parameter"
          ></v-text-field>
          <!-- </v-card-text>

          <v-card-text> -->
          <v-text-field
            v-model="currentCode.hostCode"
            label="Host code"
            autofocus
            id="parameterHostCode"
          ></v-text-field>
        </v-card-text>

        <v-checkbox
          v-model="currentCode.upload"
          label="Upload"
          color="indigo darken-3"
          class="ml-5 mt-n3"
          hide-details
        ></v-checkbox>
        <v-checkbox
          v-model="currentCode.download"
          label="Download"
          color="indigo darken-3"
          class="ml-5 mb-5"
          hide-details
        ></v-checkbox>
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

    <v-card color="indigo darken-2" dark height="125" class="flex-shrink-0">
      <v-card-title class="headline indigo darken-1">
        Host codes for {{ device.deviceName }}
      </v-card-title>
      <div class="d-flex flex-row">
        <v-card-text style="flex: 0 0 50%; margin-top: -1rem">
          <v-autocomplete
            v-model="model"
            :items="items"
            :loading="isLoading"
            :search-input.sync="search"
            color="white"
            hide-no-data
            hide-selected
            item-text="Description"
            item-value="API"
            label="Test parameters"
            placeholder="Start typing to Search"
            prepend-icon="mdi-database-search"
            return-object
          ></v-autocomplete>
        </v-card-text>
        <v-col cols="12" md="6" style="padding: 0">
          <v-text-field
            class="english"
            filleds
            v-model="crit"
            @input="filter"
            label="Filter Tests"
            md="12"
          ></v-text-field>
        </v-col>
      </div>
      <v-divider></v-divider>
    </v-card>

    <div class="d-flex flex-column flex-grow-1" red>
      <v-simple-table class="flex-grow-1">
        <template v-slot:default>
          <thead>
            <tr>
              <!-- <th class="text-left"></th> -->
              <th class="text-left">ID</th>
              <th class="text-left">Parameter</th>
              <th class="text-left">Code</th>
              <th class="text-left">Upload / download</th>
              <th class="text-left d-md-table-cell d-xs-none"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(param, index) in pages[page - 1]" :key="index">
              <td>{{ param.paramId }}</td>
              <td>{{ param.paramName }}</td>
              <td>
                <v-icon color="indigo" class="mr-2" @click="editCode(param)"
                  >mdi-pencil</v-icon
                >{{ param.hostCode }}
              </td>
              <td>
                <v-icon
                  :color="`red ${param.upload ? 'darken-4' : 'lighten-4'}`"
                  @click="editUpload(param)"
                  class="mr-2"
                  >mdi-arrow-up-bold-circle</v-icon
                >
                <v-icon
                  :color="`indigo ${param.download ? 'darken-4' : 'lighten-4'}`"
                  @click="editDownload(param)"
                  >mdi-arrow-down-bold-circle</v-icon
                >
              </td>
              <td
                style="cursor: pointer;"
                class="text-left d-md-table-cell d-xs-none"
              >
                <v-icon color="red accent-4" @click="deleteCode(param)"
                  >mdi-delete</v-icon
                >
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>

      <div style="flex: 0 0 1rem; background: #0f62fe69">
        <v-pagination
          v-model="page"
          total-visible="5"
          :length="pages.length"
        ></v-pagination>
      </div>
    </div>
  </v-flex>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import uuidv1 from "uuid/v1";
import axios from "axios";

export default {
  data: () => ({
    crit: "",
    page: 0,
    pages: [],
    currentCode: null,
    dialog2: false,
    descriptionLimit: 60,
    entries: [],
    isLoading: false,
    model: null,
    search: null,
    parameters: [],
    device: {
      deviceName: "",
      deviceCodes: []
    }
  }),

  computed: {
    ...mapGetters(["params"]),

    fields() {
      if (!this.model) return [];

      return Object.keys(this.model).map((key) => {
        return {
          key,
          value: this.model[key] || "n/a",
        };
      });
    },
    items() {
      console.log("****PARAMS****", this.params)
      return this.params.map((entry) => {
      // return this.params.parameters.map((entry) => {
        // const Description = entry.Description.length > this.descriptionLimit
        //   ? entry.Description.slice(0, this.descriptionLimit) + '...'
        //   : entry.Description

        const Description = entry.parameterName;

        return Object.assign({}, entry, { Description });
      });
      // return this.entries.map(entry => {
      //   const Description = entry.Description.length > this.descriptionLimit
      //     ? entry.Description.slice(0, this.descriptionLimit) + '...'
      //     : entry.Description

      //   return Object.assign({}, entry, { Description })
      // })
    },
  },

  watch: {
    // params() {
    //   for ( let code of this.device.deviceCodes ) {
    //     let fltered = this.params.parameters.find( x => x.parameterID == code.paramId );
    //     if ( fltered ) code.paramName = fltered.parameterName;
    //   }

    //   this.$forceUpdate();
    //   alert();
    //   console.log(this.params.parameters);
    // },

    async model() {
      if (this.model) {
        // createdAt: "2019-10-24T00:16:37.507Z"
        // deviceId: 3
        // download: true
        // hostCode: "WBC"
        // id: 6
        // paramId: "20"
        // updatedAt: "2019-10-24T00:17:00.692Z"
        // upload: true


        // {parameterID: 5, parameterName: "HCO3 (act)", testID: 1, unitId: 11, unitName: "[mmol/L]"}

        let code = {
          id: 0,
          uid: uuidv1(),
          deviceId: this.device.id,
          download: true,
          upload: true,
          hostCode: "",
          paramId: this.model.parameterID,
          paramName: this.model.parameterName,
        };

        this.setBusy(true);
        let temp = await axios.post(
          `${process.env.VUE_APP_API_URL}devices/code/${this.device.id}`,
          code
        );
        this.setBusy(false);

        this.device.deviceCodes = [temp.data, ...this.device.deviceCodes];

        this.editCode(temp.data);

        // this.parameters = [...this.parameters, JSON.parse(JSON.stringify(this.model))];
        setTimeout(() => (this.model = null), 10);

        this.assignPages();
      }
    },

    // params() {
    //   console.log(this.params);
    // },

    search() {
      // Items have already been loaded
      if (this.items.length > 0) return;

      // Items have already been requested
      if (this.isLoading) return;

      this.isLoading = true;

      // Lazily load input items
      fetch("https://api.publicapis.org/entries")
        .then((res) => res.json())
        .then((res) => {
          const { count, entries } = res;
          this.count = count;
          this.entries = entries;
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => (this.isLoading = false));
    },
  },

  methods: {
    ...mapActions(["setBusy"]),

    hndlModalKeyUp(event) {
      if (event.key == "Enter") this.closeDialog(true);
    },

    filter() {
      this.device.deviceCodes = this.device._codes.filter((x) => {
        return (
          x.paramId
            .toString()
            .toLowerCase()
            .includes(this.crit.toLowerCase()) ||
          x.paramName.toLowerCase().includes(this.crit.toLowerCase())
        );
      });
      this.assignPages();
      // console.log(this.device.deviceCodes);
    },

    assignPages() {
      // let lines = this.device.deviceCodes;
      let lines = this.device.deviceCodes;
      this.pages = [];
      let i,
        j,
        chunk = 7;
      for (i = 0, j = lines.length; i < j; i += chunk) {
        this.pages = [...this.pages, lines.slice(i, i + chunk)];
      }

      if (this.pages.length) this.page = 1;
      else this.page = 0;
    },

    editCode(code) {
      // this.currentRun = run;
      this.currentCode = code;
      this.dialog2 = true;
      console.log(code);

      setTimeout(() => {
        document.querySelector("#parameterHostCode").focus();
        document.querySelector("#parameterHostCode").select();
      }, 100);
    },

    async deleteCode(code) {
      this.setBusy(true);
      await axios.delete(
        `${process.env.VUE_APP_API_URL}devices/code/${code.id}`
      );

      this.device.deviceCodes = this.device.deviceCodes.filter(
        (x) => x.id != code.id
      );

      this.assignPages();

      this.setBusy(false);
    },

    async closeDialog(saveFlag = false) {
      if (saveFlag) {
        this.setBusy(true);
        await axios.put(
          `${process.env.VUE_APP_API_URL}devices/code`,
          this.currentCode
        );
        this.setBusy(false);
      }

      this.dialog2 = false;
    },

    editUpload(param) {
      param.upload = !param.upload;
    },

    editDownload(param) {
      param.download = !param.download;
    },
  },

  async created() {
    const ret = await axios.get(
      `${process.env.VUE_APP_API_URL}devices/${this.$route.params.deviceId}`
    );
    this.device = ret.data;

    this.device._codes = JSON.parse(JSON.stringify(this.device.deviceCodes));

    console.log(uuidv1());

    // TestCode: "FMLAB-9591"
    // TestID: 1115
    // TestName: "METHOTREXATE"
    // id: 1354

    // parameterID: 5
    // parameterName: "HCO3 (act)"
    // TestID: 1
    // UnitId: 11
    // UnitName: "[mmol/L]"
    // id: 1

    console.log(this.params.tests);

    this.assignPages();
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
