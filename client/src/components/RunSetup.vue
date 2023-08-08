<template>
  <v-card class="d-flex flex-column flex-grow-1" color="white">
    <v-container id="dropdown-example">

      <v-btn
          fixed
          dark
          fab
          bottom
          right       
          color="pink"
          v-on="on"
          @click="newRun()"
      >
          <v-icon>mdi-plus</v-icon>
      </v-btn>


      
    <v-dialog
        v-model="dialog2"
        max-width="500px"
      >
        <v-card>
          <v-card-title>
            Run data setup
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="currentRun.runName"
              label="Collection time to"
              required
            ></v-text-field>
          </v-card-text>
          <v-card-text>
            <v-text-field
              v-model="currentRun.collectionTime"
              type="time"
              label="Reporting time"
              required
            ></v-text-field>
          </v-card-text>
          <v-card-text>
            <v-text-field
              v-model="currentRun.reportingLag"
              label="Reporting delay hours"
              required
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              text
              @click="closeDialog()"
            >
              Close
            </v-btn>
            <v-btn
              color="primary"
              text
              @click="closeDialog(true)"
            >
              Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>


      <h1 class="font-weight-black flex-grow-1 ml-1 text-center">Runs Setup</h1>

      <!-- <div class="text-center">
        <v-chip 
          v-for="(day, index) in days"
          :key="index"
          class="ma-2 white--text"
          :color="day.status? 'indigo' : 'red' "
          @click="day.status = !day.status"
        >
          <v-icon left>mdi-account-circle-outline</v-icon>
          {{ day.text.substring(0,1) }}
        </v-chip>
      </div> -->

      <v-simple-table>
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left"></th>
              <th class="text-left">Name</th>
              <th class="text-left">Collection</th>
              <th class="text-left">Reporting</th>
              <!-- <th class="text-left">Days</th>               -->
              <th class="text-left">Days</th>              
              <th class="text-left"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="run in runs" :key="run.id">
              <td style="cursor: pointer;" @click="editRun(run)"><v-icon color="indigo">mdi-pencil</v-icon></td>
              <td>{{ run.runName }}</td>
              <td>{{ moment(run.collectionTime, "HH:mm:ss").format('hh:mm A') }}</td>
              <td>{{ run.reportingLag }}</td>
              <!-- <td>{{ run.days }}</td> -->
              <td>
                
          
                <v-chip 
                  v-for="(day, index) in run.days2"
                  :key="index"
                  small
                  class="ma-0 mr-1 white--text"
                  :color="day.status? 'indigo' : 'deep-orange' "
                  @click="hndlDayClick(run, day)"
                >
                  <!-- <v-icon left>mdi-account-circle-outline</v-icon> -->
                  {{ day.text.substring(0,1) }}
              </v-chip>
            

              </td>
              <td style="cursor: pointer;"><v-icon color="red accent-4" @click="deleteRun(run)">mdi-delete</v-icon></td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>

    </v-container>

    </v-card>
</template>

<script>
  import axios from 'axios';
  import { mapActions } from 'vuex';

  export default {
    data: () => ({
      dialog2: false,
      runs: [],
      days: [],
      status: 'indigo',
      currentRun: {
        runName: '',
        collectionTime: "00:00:00",
        reportingTime: "00:00:00"
      }
    }),

    async created() {     
      
      this.days = this.moment.weekdays().map( day => (
              { 
                status: 0, 
                text: day
              }))


      const ret = await axios.get(`${process.env.VUE_APP_API_URL}scheduling/runs`);
      this.runs = ret.data;

      this.runs = this.runs.map( x => ({
          ...x,
          days2: x.days.split('').map( (item, index) => ({
            index,
            text: this.days[index].text,
            status: item == 1 ? true : false
          }))
      }));

      console.log('this.runs', this.runs);
    },

    // watch: {
    //   runs() {
    //     this.runs = this.runs.map( x => ({
    //       ...x,
    //       days2: x.days.split('').map( (item, index) => ({
    //         index,
    //         day: this.days[index],
    //         status: item == 1 ? true : false
    //       }))
    //     }));
    //   }
    // },

 
    methods: {

      ...mapActions(['setBusy']),

      editRun(run) {
        this.currentRun = run;
        this.dialog2 = true;
      },

      hndlDayClick(run, day) {

        day.status = !day.status;        

        run.days = run.days2.map( d => (d.status ? '1':'0') ).join('');

        this.updateRun(run);
        
      },

      async closeDialog(saveFlag = false) {
        
        if ( saveFlag ) {
          this.setBusy(true);
          await axios.put(`${process.env.VUE_APP_API_URL}scheduling/runs`, this.currentRun);
          this.setBusy(false);
        }

        this.dialog2 = false;
      },

      async deleteRun(run) {

        this.setBusy(true);
        await axios.delete(`${process.env.VUE_APP_API_URL}scheduling/runs/${run.id}`);
        this.runs = this.runs.filter ( x => x.id != run.id );
        this.setBusy(false);

      },


      async newRun() {

        this.setBusy(true);

        const ret = await axios.post(`${process.env.VUE_APP_API_URL}scheduling/runs`, {
          // day: this.day,
          runName: 'New_Run_Name',
          collectionTime: "00:00:00", // this.moment("00:00:00").format('hh:mm:ss'),
          reportingTime: "00:00:00"
        });
        
        const data = ret.data;

        this.runs = [...this.runs, data];
        console.log(this.runs);

        this.setBusy(false);
      },

      async updateRun(run) {

        this.setBusy(true);

        await axios.put(`${process.env.VUE_APP_API_URL}scheduling/runs`, run);

        this.setBusy(false);
      }
    },
  }
</script>

<style scoped>
  th, td {
    color: black!important;
    font-size: 1.05rem!important;
  }
</style>