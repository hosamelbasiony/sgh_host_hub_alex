<template>
  <v-flex class="flex-grow-1">
    <Settings :barcode="barcode" @updated="settingsUpdated" />

    <div class="d-flex">
      <v-text-field
        v-model="fromdate"
        class="mr-1"
        label="From Date"
        type="date"
        @keyup="hndlOrderIdKeyup($event)"
      ></v-text-field>

      <v-text-field
        v-model="todate"
        class="ml-1"
        label="To Date"
        type="date"
        @keyup="hndlOrderIdKeyup($event)"
      ></v-text-field>
    </div>

    <v-text-field v-model="id" label="Id Crit" @keyup="hndlOrderIdKeyup($event)" autofocus></v-text-field>

    <v-btn class="mr-md-3 mr-xs-1" tile color="indigo" dark @click="byOrderId()">Order Id</v-btn>
    <v-btn class="mr-md-3 mr-xs-1" tile color="teal" dark @click="byPatientId()">Patient Id</v-btn>
    <v-btn class="mr-md-3 mr-xs-1" tile color="orange" dark @click="byLabNumber()">Lab Number</v-btn>
    <!-- <v-btn class="ml-4 mr-md-3 mr-xs-1" tile color="green" dark @click="byLabNumber()">Print Labels</v-btn>
    <v-btn class="ml-4 mr-md-3 mr-xs-1" tile color="green" dark @click="byLabNumber()">Print Receipt</v-btn>-->

    <v-btn color="blue-grey" class="ma-2 white--text" fab small @click="printBarcodes()">
      <v-icon dark>mdi-barcode</v-icon>
    </v-btn>

    <v-btn class="ma-2 white--text" fab small color="error" @click="printReceipts()">
      <v-icon dark>mdi-receipt</v-icon>
    </v-btn>

    <v-card
      class="mx-auto mt-3"
      outlined
      elevation="2"
      v-for="(order, index) in orders"
      :key="index"
    >
      <v-list-item three-line>
        <v-list-item-content>
          <!-- <div class="overline mb-4">Order id: {{ order.OrderID }}</div> -->
          <!-- <span>{{moment(date).format('YYYY-MM-DD')}}</span> -->

          <v-list-item-subtitle color="red" class="font-weight-black">Order id: {{ order.OrderID }}</v-list-item-subtitle>
          <v-list-item-subtitle class="font-weight-black">Lab Number: {{ order.LabNumber }}</v-list-item-subtitle>
          <v-list-item-subtitle
            class="font-weight-black"
          >Date of collection: {{ moment(order.DateTimeCollected).format('dddd YYYY-MM-DD hh:mm A') }}</v-list-item-subtitle>
          <v-list-item-title class="headline mb-1">{{ order.PatientName }}</v-list-item-title>

          <!-- <v-chip color="#06508c" class="white--text" v-for="test in order.tests" :key="test.TestID"> -->
          <v-chip
            color="blue darken-3 white--text pa-2 pl-5 mt-1"
            v-for="test in order.tests"
            :key="test.TestID"
          >
            <!-- <v-icon left color="white"> -->
            <v-icon left>mdi-flask</v-icon>
            {{ test.TestName }}
          </v-chip>

          <!-- <v-list-item-subtitle class="font-weight-medium" v-for="test in order.tests" :key="test.TestID">{{ test.TestName }}</v-list-item-subtitle> -->
        </v-list-item-content>

        <!-- <v-list-item-avatar
          tile
          size="80"
          color="grey"
        ></v-list-item-avatar>-->
      </v-list-item>

      <v-divider class="mt-6 mx-4"></v-divider>

      <v-card-text>
        <v-chip class="mr-2 pl-4" @click="printReceipt(order)">
          <v-icon left>mdi-receipt</v-icon>Print receipt
        </v-chip>
        <v-chip class="pl-4" @click="printBarcode(order)">
          <v-icon left>mdi-barcode</v-icon>Print labels
        </v-chip>
      </v-card-text>
    </v-card>
  </v-flex>
</template>

<script>
import axios from "axios";
import { mapGetters, mapActions } from "vuex";
import { PrintSubject } from "@/globals";

import { barcode, getAge } from "@/globals";
import Settings from "@/components/dialogs/Settings";

export default {
  data: () => ({
    tests: [],
    PrintSubject,
    barcode: null,

    fromdate: "",
    todate: "",

    activeBtn: true,
    valid: true,
    id: "", //349136,
    orders: [],

    dropdown_font: ["Arial", "Calibri", "Courier", "Verdana"],
    dropdown_icon: [
      { text: "list", callback: () => console.log("list") },
      { text: "favorite", callback: () => console.log("favorite") },
      { text: "delete", callback: () => console.log("delete") }
    ],
    dropdown_edit: [
      { text: "100%" },
      { text: "75%" },
      { text: "50%" },
      { text: "25%" },
      { text: "0%" }
    ]
  }),

  computed: mapGetters(["params"]),

  components: {
    Settings
  },

  methods: {
    ...mapActions(["setBusy", "setReceipt"]),

    settingsUpdated(settings) {
      console.log(settings);
      this.barcode.settings = settings;
      localStorage["barcode_settings"] = JSON.stringify(settings);
    },

    printReceipts() {
      let order = {
        PatientName: this.orders[0].PatientName,
        LabNumber: "",
        tests: this.orders.reduce(
          (total, currentValue) => [...total, ...currentValue.tests],
          []
        )
      };
      this.setReceipt(order);
      PrintSubject.next(order);
      // setTimeout( () => window.print(), 100);
    },

    printReceipt(order) {
      this.setReceipt(order);
      PrintSubject.next(order);
      // setTimeout( () => window.print(), 100);
    },

    printBarcodes() {
      for (let order of this.orders) this.printBarcode(order);
    },

    printBarcode(order) {
      // patient.ageString = this.globals.getAgeString(patient.age);
      // this.globals.getAge(patient.DOB);

      // alert(order.PatientName);

      let tempname = "";
      for (var x = 0; x < order.PatientName.length; x++)
        tempname += order.PatientName.charCodeAt(x) + "^";

      const msg = {
        text: {
          function: "print label wide",
          grouped: "1",
          printer: this.barcode.settings.barcodePrinter,
          labno: order.LabNumber,
          patno: order.PatientID,
          barcode: order.LabNumber,
          bid: "", //order.HospitalCode,
          name: tempname,
          age: order.age.ageString,
          gender: order.Gendar,
          sample: "",
          unit: order.HospitalCode,
          date: this.moment(order.tests[0].DateTimeCollected).format(
            "dd YYYY-MM-DD hh:mm A"
          ),
          line1: "",
          line2: "",
          spare: "0",
          top: this.barcode.settings.topMargin,
          left: this.barcode.settings.leftMargin,
          labelsize: this.barcode.settings.labelsize,
          referral: ""
        }
      };

      let tests = [];
      let Tests = [];
      for (let testId of order.tests.map(x => x.TestID)) {
        // let testId = test.TestID;
        if (!Tests.includes(testId)) Tests = [...Tests, testId];
      }

      for (let testId of Tests) {
        tests = [
          ...tests,
          ...this.tests.filter(x => x.TestID == testId).map(x => x.TestName)
        ];
      }

      console.log(order);
      console.log(Tests);
      console.log(tests);

      msg.text.line1 = tests.length + "# ";
      if (tests[0]) msg.text.line1 += tests[0];
      if (tests[1]) {
        if (msg.text.line1.length < 15) msg.text.line1 += ", " + tests[1];
        else msg.text.line2 = tests[1];
      }
      for (let x = 2; x < tests.length; x += 1) {
        if (msg.text.line2.length) msg.text.line2 += ", " + tests[x];
        else msg.text.line2 = tests[x];
      }

      // alert(msg.text.line1);
      // alert(msg.text.line2);

      // let tests = [];

      // let Tests = [];
      //     for ( let testId of patient.Tests ) {
      //     if ( !Tests.includes(testId) ) Tests = [...Tests, testId];
      // }

      // patient.Tests = Tests;

      // for ( let testId of patient.Tests ) {
      // tests = [...tests, ...this.globals.tests.filter ( x => x.id == testId ).map( x => x.name )];
      // }

      // console.log(tests);

      // msg.text.line1 = tests.length + '# ';
      // if ( tests[0] ) msg.text.line1 += tests[0];
      // if ( tests[1] ) {
      // if( msg.text.line1.length < 15 ) msg.text.line1 += ', ' + tests[1];
      // else msg.text.line2 = tests[1];
      // }
      // for ( let x = 2; x<tests.length; x+=1 ) {
      // if ( msg.text.line2.length ) msg.text.line2 += ', ' + tests[x];
      // else msg.text.line2 = tests[x];
      // }

      // let d = new Date(patient.DateTimeCollected.toString());
      // msg.text.date = d.toDateString() + ' ' + d.getHours() + ':' + d.getMinutes();

      console.log(msg);
      this.barcode.send(msg);
    },

    hndlOrderIdKeyup(event) {
      if (event.key == "Enter") {
        // this.byOrderId(event.target.value);
        this.load(
          `${process.env.VUE_APP_API_URL}sgh/by-patient-id/${this.id}/${this.fromdate}/${this.todate}`
        );
      }
    },

    byLabNumber() {
      this.load(
        `${process.env.VUE_APP_API_URL}sgh/by-lab-id/${this.id}/${this.fromdate}/${this.todate}`
      );
    },

    byPatientId() {
      this.load(
        `${process.env.VUE_APP_API_URL}sgh/by-patient-id/${this.id}/${this.fromdate}/${this.todate}`
      );
    },

    byOrderId() {
      this.load(
        `${process.env.VUE_APP_API_URL}sgh/by-order-id/${this.id}/${this.fromdate}/${this.todate}`
      );
    },

    async load(url) {
      this.orders = [];

      this.setBusy(true);

      let ret = await axios.get(url);
      let orders = ret.data;

      for (let order of orders) {
        order.age = getAge(order.DOB);

        let tests = order.tests.map(test => {
          /////////////////////////////////////////////////////////////////////////////////////////
          ///////////// FOR TESTING PURPOSE ///////////////////////////////////////////////////////
          /////////////////////////////////////////////////////////////////////////////////////////
          // const getRandomInt = (min, max) => Math.floor((Math.random() * Math.floor(max-min))+min);

          // let idx = getRandomInt(0, this.params.tests.length - 1);
          // test.TestID = this.params.tests[idx].TestID;
          /////////////////////////////////////////////////////////////////////////////////////////

          let filtered = this.params.tests.filter(x => x.TestID == test.TestID);

          if (filtered.length) test.TestName = filtered[0].TestName;
          else test.TestName = test.TestID;

          return test;
        });

        order.tests = tests;
        // order.DateTimeCollected = tests[0].DateTimeCollected;
        order.DateTimeCollected = this.moment(
          tests[0].DateTimeCollected
        ).subtract(2, "hours");

        order.testNames = order.tests.map(x => x.TestName).join(", ");
      }

      this.orders = orders;

      console.log(orders);

      this.setBusy(false);
    }
  },

  async created() {
    const ret = await axios.get(`${process.env.VUE_APP_API_URL}sgh/tests`);
    this.tests = ret.data;
    // console.log(tests);

    window["tests"] = this.tests;

    this.fromdate = this.moment(new Date()).format("YYYY-MM-DD");
    this.todate = this.moment(new Date()).format("YYYY-MM-DD");

    window["moment"] = this.moment;

    this.barcode = new barcode();

    this.barcode.createObservableSocket().subscribe(msg => {
      //console.log('websocket next msg:', msg)
      let printers = msg.split(String.fromCharCode(29));
      this.barcode.settings.printers = printers.filter(x => x != "");
      console.log("printers:", printers);
    });

    // this.barcode.send(msg);
  }
};
</script>

<style>
</style>
