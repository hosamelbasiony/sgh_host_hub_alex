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
        disabled
        v-model="todate"
        class="ml-1"
        label="To Date"
        type="date"
        @keyup="hndlOrderIdKeyup($event)"
      ></v-text-field>
    </div>

    <v-text-field
      v-model="id"
      label="identification criteria"
      @keyup="hndlOrderIdKeyup($event)"
      autofocus
    ></v-text-field>

    <v-btn class="mr-md-3 mr-xs-1" tile color="indigo" dark @click="byOrderId()"
      >Order Id</v-btn
    >
    <v-btn class="mr-md-3 mr-xs-1" tile color="teal" dark @click="byPatientId()"
      >Patient Id</v-btn
    >
    <v-btn
      class="mr-md-3 mr-xs-1"
      tile
      color="orange"
      dark
      @click="byLabNumber()"
      >Lab Number</v-btn
    >
    <!-- <v-btn class="ml-4 mr-md-3 mr-xs-1" tile color="green" dark @click="byLabNumber()">Print Labels</v-btn>
    <v-btn class="ml-4 mr-md-3 mr-xs-1" tile color="green" dark @click="byLabNumber()">Print Receipt</v-btn>-->

    <v-btn
      color="blue-grey"
      class="ma-2 white--text"
      fab
      small
      @click="printBarcodes()"
    >
      <v-icon dark>mdi-barcode</v-icon>
    </v-btn>

    <v-btn
      class="ma-2 white--text"
      fab
      small
      color="error"
      @click="printReceipts()"
    >
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

          <v-list-item-subtitle color="red" class="font-weight-black"
            >Order id: {{ order.OrderID }}</v-list-item-subtitle
          >
          <v-list-item-subtitle class="font-weight-black"
            >Lab Number: {{ order.LabNumber }}</v-list-item-subtitle
          >
          <v-list-item-subtitle class="font-weight-black"
            >Date of collection:
            {{
              moment(order.DateTimeCollected).format("dddd YYYY-MM-DD hh:mm A")
            }}</v-list-item-subtitle
          >
          <v-list-item-title class="headline mb-1">{{
            order.PatientName
          }}</v-list-item-title>

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
    id: "", // "6965", // "715037", //349136,
    orders: [],

    dropdown_font: ["Arial", "Calibri", "Courier", "Verdana"],
    dropdown_icon: [
      { text: "list", callback: () => console.log("list") },
      { text: "favorite", callback: () => console.log("favorite") },
      { text: "delete", callback: () => console.log("delete") },
    ],
    dropdown_edit: [
      { text: "100%" },
      { text: "75%" },
      { text: "50%" },
      { text: "25%" },
      { text: "0%" },
    ],
  }),

  computed: mapGetters(["params"]),

  components: {
    Settings,
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
        ),
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
          function: "print label sgh",
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
          referral: "",
        },
      };

      let tests = [];
      let Tests = [];
      for (let testId of order.tests.map((x) => x.testID)) {
        if (!Tests.includes(testId)) Tests = [...Tests, testId];
      }

      console.log("***ALL TESTS***", this.tests);
      // [
      // {
      //   testCode,
      //   testID,
      //   testName,
      // }
      // ]

      for (let testId of Tests) {
        tests = [
          ...tests,
          ...this.tests
            .filter((x) => x.testID == testId)
            .map((x) => x.TestName),
        ];
      }

      console.log(order);
      console.log("**Tests***", Tests);
      console.log("**tests***", tests);

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

      console.log("*** TO PRINT ***", msg);
      this.barcode.send(msg);
    },

    hndlOrderIdKeyup(event) {
      // [
      //     {
      //         "orderID": 25,
      //         "labNumber": "864212",
      //         "hospitalCode": "EG01",
      //         "billNo": "5CS1",
      //         "patientID": 30000219,
      //         "patientName": "Maryam GAMAL   ABDEL NASSER morsy",
      //         "dob": "1986-01-15T00:00:00",
      //         "gendar": "Female",
      //         "patientType": "OP",
      //         "tests": [
      //             {
      //                 "testID": 7930,
      //                 "dateTimeCollected": "2023-09-24T19:10:39.660"
      //             }
      //         ]
      //     }
      // ]

      if (event.key == "Enter") {
        this.loadData(
          `${process.env.VUE_APP_ORDERS_API_URL}/OrderID/${this.id}`
        );

        // this.byOrderId(event.target.value);
        // this.load(
        //   `${process.env.VUE_APP_API_URL}sgh/by-patient-id/${this.id}/${this.fromdate}/${this.todate}`
        // );
      }
    },

    byLabNumber() {
      let duration = this.moment.duration(
        this.moment(this.todate).diff(this.moment(this.fromdate))
      );
      let days = parseInt(duration.asDays());

      this.loadData(
        `${process.env.VUE_APP_ORDERS_API_URL}/LastDays/${days}/LabNumber/${this.id}`
      );

      // this.load(
      //   `${process.env.VUE_APP_API_URL}sgh/by-lab-id/${this.id}/${this.fromdate}/${this.todate}`
      // );
    },

    byPatientId() {
      // router.get('/by-patient-id/:id/:fromdate/:todate', controller.byPatientId);
      let url = `${process.env.VUE_APP_ORDERS_API_URL}/PatientID/${this.id}`;
      if (process.env.NODE_ENV == "development")
        url = `${process.env.VUE_APP_API_URL}sgh/by-patient-id/${this.id}/2010-01-01/2100-01-01`;

      this.loadData(url);

      // this.load(
      //   `${process.env.VUE_APP_API_URL}sgh/by-patient-id/${this.id}/${this.fromdate}/${this.todate}`
      // );
    },

    byOrderId() {
      this.loadData(`${process.env.VUE_APP_ORDERS_API_URL}/OrderID/${this.id}`);

      // this.load(
      //   `${process.env.VUE_APP_API_URL}sgh/by-order-id/${this.id}/${this.fromdate}/${this.todate}`
      // );
    },

    async loadData(url) {
      this.orders = [];

      this.setBusy(true);

      try {
        let ret = await axios.get(url);
        let orders = ret.data;

        // {
        //     "LabNumber": "127547",
        //     "DOB": "1982-01-01T00:00:00.000Z",
        //     "Gendar": "Female",
        //     "OrderID": 1924,
        //     "PatientType": "OP",
        //     "HospitalCode": "EG01",
        //     "BillNo": "CS2689",
        //     "PatientID": 2618,
        //     "PatientName": "BOSY FATOH MOHAMED ABDELAL",
        //     "tests": [
        //         {
        //             "TestID": 3968,
        //             "DateTimeCollected": "2016-02-14T16:01:47.577Z"
        //         }
        //     ]
        // }

        for (let _order of orders) {
          if (_order.OrderID == null) {
            _order.OrderID = _order.orderID;
            _order.LabNumber = _order.labNumber;
            _order.HospitalCode = _order.hospitalCode;
            _order.BillNo = _order.billNo;
            _order.PatientID = _order.patientID;
            _order.PatientName = _order.patientName;
            _order.DOB = _order.dob;
            _order.Gendar = _order.gendar;
            _order.PatientType = _order.patientType;
            _order.tests = _order.tests.map((x) => ({
              ...x,
              TestID: x.testID,
              DateTimeCollected: x.dateTimeCollected,
            }));
          }

          _order.age = getAge(_order.DOB);

          console.log("refined order: ", _order)

          let tests = _order.tests.map((test) => {
            let filtered = this.tests.filter((x) => x.testID == test.TestID);

            if (filtered.length) test.TestName = filtered[0].testName;
            else test.TestName = test.TestID;

            return test;
          });

          // try {
          _order.tests = tests;
          if (tests.length) {
            _order.DateTimeCollected = this.moment(
              tests[0].DateTimeCollected
            ).subtract(2, "hours");
          } else {
            alert(`Lab Number: ${_order.labNumber} has no tests !`);
            _order.DateTimeCollected = "";
          }

          _order.testNames = _order.tests.map((x) => x.TestName).join(", ");
          // } catch (error) {
          //   console.log("error", _order)
          // }
        }

        this.orders = orders.filter((x) => x.tests.length);

        console.log(orders);
      } catch (error) {
        // TODO
        alert("ID NOT FOUND");
      }

      this.setBusy(false);
    },

    async load(url) {
      this.orders = [];

      this.setBusy(true);

      let ret = await axios.get(url);
      let orders = ret.data;

      for (let order of orders) {
        order.age = getAge(order.DOB);

        let tests = order.tests.map((test) => {
          let filtered = this.tests.filter((x) => x.testID == test.TestID);

          if (filtered.length) test.TestName = filtered[0].testName;
          else test.TestName = test.TestID;

          return test;
        });

        order.tests = tests;
        // order.DateTimeCollected = tests[0].DateTimeCollected;
        order.DateTimeCollected = this.moment(
          tests[0].DateTimeCollected
        ).subtract(2, "hours");

        order.testNames = order.tests.map((x) => x.TestName).join(", ");
      }

      this.orders = orders;

      console.log(orders);

      this.setBusy(false);
    },

    testOrders() {
      let orders = [
        {
          orderID: 110,
          labNumber: "10453",
          hospitalCode: "EG01",
          billNo: "CS46",
          patientID: 30000309,
          patientName: "elin mohamed MOHAMED ANWAR",
          dob: "2013-05-09T00:00:00",
          gendar: "Female",
          patientType: "OP",
          tests: [
            { testID: 8035, dateTimeCollected: "2023-10-15T10:13:25.400" },
          ],
        },
        {
          orderID: 110,
          labNumber: "138361",
          hospitalCode: "EG01",
          billNo: "CS46",
          patientID: 30000309,
          patientName: "elin mohamed MOHAMED ANWAR",
          dob: "2013-05-09T00:00:00",
          gendar: "Female",
          patientType: "OP",
          tests: [
            { testID: 7966, dateTimeCollected: "2023-10-15T10:13:21.143" },
          ],
        },
        {
          orderID: 110,
          labNumber: "346234",
          hospitalCode: "EG01",
          billNo: "CS46",
          patientID: 30000309,
          patientName: "elin mohamed MOHAMED ANWAR",
          dob: "2013-05-09T00:00:00",
          gendar: "Female",
          patientType: "OP",
          tests: [
            { testID: 8864, dateTimeCollected: "2023-10-15T15:02:47.250" },
          ],
        },
        {
          orderID: 110,
          labNumber: "864254",
          hospitalCode: "EG01",
          billNo: "CS46",
          patientID: 30000309,
          patientName: "elin mohamed MOHAMED ANWAR",
          dob: "2013-05-09T00:00:00",
          gendar: "Female",
          patientType: "OP",
          tests: [
            { testID: 7930, dateTimeCollected: "2023-10-15T10:13:29.013" },
          ],
        },
      ];

      //order.DateTimeCollected

      orders = [
        {
          orderID: 109,
          labNumber: "14298",
          hospitalCode: "EG01",
          billNo: "CR119",
          patientID: 331821,
          patientName: "HEKMAT FARAG ABDELKEREM MOUSA",
          dob: "1991-04-03T00:00:00",
          gendar: "Female",
          patientType: "OP",
          tests: [
            { testID: 7785, dateTimeCollected: "2023-10-15T09:38:02.160" },
            { testID: 8180, dateTimeCollected: "2023-10-15T09:38:02.160" },
            { testID: 8186, dateTimeCollected: "2023-10-15T09:38:09.520" },
            { testID: 8215, dateTimeCollected: "2023-10-15T09:38:09.520" },
          ],
        },
        {
          orderID: 109,
          labNumber: "181597",
          hospitalCode: "EG01",
          billNo: "CR119",
          patientID: 331821,
          patientName: "HEKMAT FARAG ABDELKEREM MOUSA",
          dob: "1991-04-03T00:00:00",
          gendar: "Female",
          patientType: "OP",
          tests: [],
        },
        {
          orderID: 109,
          labNumber: "185248",
          hospitalCode: "EG01",
          billNo: "CR119",
          patientID: 331821,
          patientName: "HEKMAT FARAG ABDELKEREM MOUSA",
          dob: "1991-04-03T00:00:00",
          gendar: "Female",
          patientType: "OP",
          tests: [
            { testID: 9699, dateTimeCollected: "2023-10-15T09:38:03.780" },
          ],
        },
        {
          orderID: 109,
          labNumber: "864253",
          hospitalCode: "EG01",
          billNo: "CR119",
          patientID: 331821,
          patientName: "HEKMAT FARAG ABDELKEREM MOUSA",
          dob: "1991-04-03T00:00:00",
          gendar: "Female",
          patientType: "OP",
          tests: [
            { testID: 7930, dateTimeCollected: "2023-10-15T09:38:05.837" },
          ],
        },
      ];

      for (let _order of orders) {
        _order.OrderID = _order.orderID;
        _order.LabNumber = _order.labNumber;
        _order.HospitalCode = _order.hospitalCode;
        _order.BillNo = _order.billNo;
        _order.PatientID = _order.patientID;
        _order.PatientName = _order.patientName;
        _order.DOB = _order.dob;
        _order.Gendar = _order.gendar;
        _order.PatientType = _order.patientType;
        _order.tests = _order.tests.map((x) => ({
          ...x,
          TestID: x.testID,
          DateTimeCollected: x.dateTimeCollected,
        }));

        _order.age = getAge(_order.DOB);

        let tests = _order.tests.map((test) => {
          let filtered = this.tests.filter((x) => x.testID == test.TestID);

          if (filtered.length) test.TestName = filtered[0].testName;
          else test.TestName = test.TestID;

          return test;
        });

        // try {
        _order.tests = tests;
        if (tests.length) {
          _order.DateTimeCollected = this.moment(
            tests[0].DateTimeCollected
          ).subtract(2, "hours");
        } else {
          alert(`Lab Number: ${_order.labNumber} has no tests !`);
          _order.DateTimeCollected = "";
        }

        _order.testNames = _order.tests.map((x) => x.TestName).join(", ");
        // } catch (error) {
        //   console.log("error", _order)
        // }
      }

      this.orders = orders.filter((x) => x.tests.length);

      console.log(orders);
    },
  },

  async created() {
    // let ret = await axios.get(`${process.env.VUE_APP_API_URL}sgh/tests`);
    // this.tests = ret.data;

    this.id = process.env.VUE_APP_TEMP_PATIENT_ID;
    
    this.fromdate = this.moment(new Date())
      .subtract(7, "days")
      .format("YYYY-MM-DD");
    this.todate = this.moment(new Date()).format("YYYY-MM-DD");

    window["moment"] = this.moment;

    this.barcode = new barcode();

    this.barcode.createObservableSocket().subscribe((msg) => {
      //console.log('websocket next msg:', msg)
      let printers = msg.split(String.fromCharCode(29));
      this.barcode.settings.printers = printers.filter((x) => x != "");
      console.log("printers:", printers);
    });

    // setTimeout(() => {
    //   this.testOrders();
    // }, 100);

    let ret = await axios.get(`${process.env.VUE_APP_TESTS_API_URL}`);
    this.tests = ret.data.map((x) => ({
      ...x,
      TestCode: x.testCode,
      TestID: x.testID,
      TestName: x.testName,
    }));

    // [
    // {
    //   testCode,
    //   testID,
    //   testName,
    // }
    // ]

    window["tests"] = this.tests;

    // alert(this.todate)

    // this.fromdate = this.moment(new Date())
    //   .subtract(7, "days")
    //   .format("YYYY-MM-DD");
    // this.todate = this.moment(new Date()).format("YYYY-MM-DD");

    // window["moment"] = this.moment;

    // this.barcode = new barcode();

    // this.barcode.createObservableSocket().subscribe(msg => {
    //   //console.log('websocket next msg:', msg)
    //   let printers = msg.split(String.fromCharCode(29));
    //   this.barcode.settings.printers = printers.filter(x => x != "");
    //   console.log("printers:", printers);
    // });

    // this.barcode.send(msg);
  },
};
</script>

<style></style>
