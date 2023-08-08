<template>
    <v-flex class="d-flex flex-column">

        <!-- <v-btn
          fixed
          dark
          fab
          bottom
          right       
          color="pink"
          v-on="on"
          @click="dialog2 = true"
          
      >
          <v-icon>mdi-plus</v-icon>
      </v-btn> -->


      
    <v-dialog
        v-if="currentTest"
        v-model="dialog2"
        max-width="750px"
      >
        <v-card>



          <v-card-title>
            ( {{ currentTest.TestName}} ) Scheduling
          </v-card-title>

          <v-row align="center" class="mr-4 ml-4" v-if="currentTest.scheduling">
            <v-card-text class="d-flex flex-row">

                    <v-checkbox
                        v-model="currentTest.scheduling.byRun"
                        class="shrink mr-2 mt-0"
                        @change="hndlByRunCheckChange($event)"
                    ></v-checkbox>

                    <v-select
                        v-model="currentTest.scheduling.runId"
                        item-value="id"
                        item-text="text"
                        :items="schedules.runs.map( x => ({id: x.id, text: x.runName}) )"
                        :disabled="!currentTest.scheduling.byRun"
                        @change="hndlRunChange($event)"
                        label="Run Name"
                        class="ma-0 pa-0"
                    ></v-select>

{{ defaultSelected }}
            </v-card-text>
          </v-row>

          <v-row align="center" class="mr-4 ml-4" v-if="currentTest.scheduling">
            <v-card-text class="d-flex flex-row">

                    <v-checkbox
                        v-model="currentTest.scheduling.byHour"
                        class="shrink mr-2 mt-0"
                        @change="hndlByHourCheckChange($event)"
                    ></v-checkbox>
                    <v-text-field
                        class="ma-0 pa-0"
                        :disabled="!currentTest.scheduling.byHour"
                        v-model="currentTest.scheduling.hours"
                        type="number"
                        width="250"
                        label="Hours Lag"
                    ></v-text-field>

            </v-card-text>
          </v-row>

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


        <v-form
            ref="form"
            class="flex-grow-0 mb-4"
        >
            <v-text-field
                v-model="crit"
                @keyup="throttledMethod($event)"
                autofocus
            ></v-text-field>

        <v-btn
            color="indigo"
            class="mr-4 white--text"
            @click="search"
        >
        Search Tests
        </v-btn>

        </v-form>

        <v-simple-table>
            <!-- <thead>
                <tr>
                <th class="text-left"></th>
                <th class="text-left">Name</th>
                </tr>
            </thead> -->
            <tbody>
                <tr v-for="(test, index) in tests" :key="index">
                    <td style="cursor: pointer;" width="50" @click="editTest(test)"><v-icon color="indigo">mdi-pencil</v-icon></td>
                    <td>{{ test.TestName }}</td>
                </tr>
            </tbody>
        </v-simple-table>

    </v-flex>
</template>

<script>
import axios from 'axios';
import _ from 'lodash'
import { mapActions } from 'vuex';

export default {
    data: () => ({
        defaultSelected: 0,

        schedules: {
            runs: [],
            shifts: []
        },

        types: [
            'cards',
            'images',
        ],

        crit: '',
        tests: [],
        dialog2: false,
        currentTest: null,
        enabled: false
    }),

    methods: {

        ...mapActions(['setBusy']),

        async hndlRunChange(event) {
            this.currentTest.scheduling.runId  = event;
            this.$forceUpdate();
        },

        async hndlByRunCheckChange(event){
            if (event) {
                this.currentTest.scheduling.byHour = false;
                this.currentTest.scheduling.byShift = false;
            } else if ( !this.currentTest.scheduling.byHour ) {
                this.currentTest.scheduling.byShift = true;
            }

            this.$forceUpdate();
        },

        async hndlByHourCheckChange(event){
            if (event) {
                this.currentTest.scheduling.byRun = false;
                this.currentTest.scheduling.byShift = false;
            } else if ( !this.currentTest.scheduling.byRun ) {
                this.currentTest.scheduling.byShift = true;
            }

            this.$forceUpdate();
        },

        // async hndlCheckChange(){
        //     console.log(this.currentTest);

        //     this.$forceUpdate();
            
        //     if ( this.currentTest.scheduling.byHour ) {
        //         this.currentTest.scheduling.byRun = false;
        //         this.currentTest.scheduling.byShift = false;
        //     } else if ( this.currentTest.scheduling.byRun ) {
        //         this.currentTest.scheduling.byHour = false;
        //         this.currentTest.scheduling.byShift = false;
        //     } else {
        //         this.currentTest.scheduling.byShift = true;
        //     }

        //     this.$forceUpdate();
        // },
        
        async hndlKeyup(event){
            if ( event.key == 'Enter' ) this.search();
        },

        async editTest(test) {
            // this.setBusy(true);
            // const testData = await axios.get(`${process.env.VUE_APP_API_URL}parameters/test/${test.TestID}`);
            // console.log(testData.data);

            // test.scheduling = testData.data;
            if ( !test.scheduling ) 
                test.scheduling = {
                    id: 0,
                    testID: test.TestID, 
                    testName: test.TestName, 
                    byRun: false, 
                    byShift: true,
                    byHour: false,
                    shiftId: 0,
                    runId: 0,
                    hours: 24,
                }
            
            // this.setBusy(false);

            this.currentTest = test;

            this.$forceUpdate();

            this.dialog2 = true
        },

        throttledMethod: _.debounce( function() {
            if( this.crit.trim().length > 2 ) this.search();
        }, 750),

        async closeDialog( saveFlag = false ) {
        
            if ( saveFlag ) {

                // alert(this.currentTest.scheduling.byHour);

                this.setBusy(true);
                if ( this.currentTest.scheduling.id == 0 ) {
                    const ret = await axios.post(`${process.env.VUE_APP_API_URL}scheduling/test`, this.currentTest.scheduling);
                    this.currentTest.scheduling = ret.data;
                } else await axios.put(`${process.env.VUE_APP_API_URL}scheduling/test/${this.currentTest.scheduling.id}`, this.currentTest.scheduling);

                this.setBusy(false);
            }

            this.dialog2 = false;
        },

        async search() {

            this.setBusy(1);

            const ret = await axios.get(`${process.env.VUE_APP_API_URL}sgh/tests/${this.crit}`);
            let tests = ret.data;
            // schedules-list
            const schedulesRet = await axios.post(`${process.env.VUE_APP_API_URL}scheduling/schedules-list`,
                tests.map( x => x.TestID )
            );

            schedulesRet.data.forEach( (element, index) => {
                tests[index].scheduling = element;
            });

            console.log(schedulesRet);

            this.tests = tests;

            this.setBusy(0);
        }
    },

    async created() {
        const ret = await axios.get(`${process.env.VUE_APP_API_URL}parameters/schedules`);
        this.schedules = ret.data;
    }
}
</script>

<style scoped>
  th, td {
    color: black!important;
    font-size: .95rem!important;
  }
</style>
