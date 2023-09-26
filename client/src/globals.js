import { Subject, Observable } from "rxjs";
import moment from "moment";

export const listIconClick = new Subject();
export const PrintSubject = new Subject();

export const getAge = (dateStringFrom, dateStringTo = false) => {
  var a = moment(new Date());
  if (dateStringTo) a = moment(dateStringTo);

  let b = moment(dateStringFrom);

  let years = a.diff(b, "year");
  b.add(years, "years");

  let months = a.diff(b, "months");
  b.add(months, "months");

  let days = a.diff(b, "days");

  let age = { years, months, days, ageString: "" };

  if (age.years != 0) age.ageString += age.years + "Y";
  if (age.months != 0 && age.years <= 3)
    age.ageString += " - " + age.months + "M";
  if (age.days != 0 && age.months <= 6 && age.years < 1)
    age.ageString += " - " + age.days + "D";

  if (age.ageString.substring(0, 2) == " -")
    age.ageString = age.ageString.substring(3);

  return age;
};

export class barcode {
  constructor() {
    this.ws = WebSocket;
    this.settings = {};

    let _settings = localStorage.getItem("barcode_settings");

    if (_settings) {
      this.settings = JSON.parse(_settings);
    } else {
      this.settings = {
        //show_autocomplete_list: true
        autoprintReceipt: true,
        autoprintJoborder: true,
        autoprintBarcode: true,
        barcodePrinter: "",
        receiptPrinter: "",
        labelsize: 0,
        leftMargin: 0,
        topMargin: 0,
        printMethod: 0,
        printers: [],
        websocketServerIP: "127.0.0.1",
        show_autocomplete_list: true
      };

      localStorage.setItem("barcode_settings", JSON.stringify(this.settings));
    }
  }

  createObservableSocket = (url = "ws://127.0.0.1:8181/websession") => {
    try {
      this.ws = new WebSocket(url);
      return new Observable(observer => {
        this.ws.onmessage = event => observer.next(event.data);
        this.ws.onerror = event => observer.error(event);
        this.ws.onclose = () => observer.complete();
        this.ws.onopen = event => {
          console.log(event);
          this.send({ text: { function: "get printers" } });
        };

        return () => this.ws.close();
      });
    } catch (ex) {
      console.log(ex);
    }
  };

  send(message) {
    this.ws.send(JSON.stringify(message));
  }
}
