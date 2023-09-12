<template>
  <v-app>
    <div class="report d-print-block">
      <Report />
    </div>

    <v-progress-circular
      v-if="busy"
      color="orange"
      class="d-print-none"
      :size="100"
      indeterminate
      style="position: absolute;top:calc(50% - 2.5rem);left:calc(50% - 2.5rem);z-index: 1000;height: 5rem;width: 5rem;"
    ></v-progress-circular>

    <v-flex class="d-print-none d-flex">
      <router-view></router-view>
    </v-flex>
  </v-app>
</template>

<script>
import axios from "axios";
import { mapGetters, mapActions } from "vuex";

import Report from "@/components/print/Report";

export default {
  name: "App",

  computed: mapGetters(["busy"]),

  components: {
    Report
  },

  data: () => ({
    //
  }),

  methods: {
    ...mapActions(["setBusy", "setParams", "setSchedulingData"])
  },

  async created() {
    // http://localhost:8003/api/sgh/by-order-id/8
    // axios.get(`${process.env.VUE_APP_API_URL}sgh/params`)

    try {
      let ret = await axios.get(`${process.env.VUE_APP_PARAMS_API_URL}`);
      let data = ret.data;

      data.parameters = data.map(x => ({
        ParameterID: x.parameterID,
        TestID: x.testID,
        UnitId: x.unitId,
        ParameterName: "",
        UnitName: ""
      }));
      
      this.setParams(data);
    } catch (error) {
      console.error(error);
      // axios
      //   .get(`${process.env.VUE_APP_API_URL}sgh/params`)
      //   .then(ret => {
      //     let data = ret.data;
      //     data.parameters = data.parameters.map(x => ({
      //       ParameterID: x.parameterID,
      //       TestID: x.testID,
      //       UnitId: x.unitId,
      //       ParameterName: x.parameterName,
      //       UnitName: x.unitName
      //     }));
      //     this.setParams(data);
      //   })
      //   .catch(ex => {
      //     this.setParams({ tests: [], parameters: [] });
      //     console.log(ex);
      //   });
    }

    axios
      .get(`${process.env.VUE_APP_API_URL}parameters/schedules-extended`)
      .then(ret => ret.data)
      .then(data => this.setSchedulingData(data));
  }
};
</script>

<style scoped>
html,
body {
  padding: 0px;
}
#app {
  height: 100%;
  height: calc(100% - 0.9rem);
  width: 100%;
  display: flex;
  flex-direction: column;
  /* border:1px red solid; */
  padding: 0px !important;
}
.ui.menu {
  /* margin-bottom: 0; */
}
.main {
  /* text-align:center;   */
  margin-bottom: 5px;
  height: calc(100% - 10px) !important;
  height: calc(100% - 0px) !important;

  display: flex !important;
  flex-direction: column !important;
}
.main-body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  align-items: center;
  padding-top: 1.5rem;
}
.btn-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 50%;
  align-items: start;
  justify-content: start;
  min-width: calc(180px * 3);
  align-content: space-evenly;
  zoom: 1.25;
}
.btn-container div {
  height: 35px;
  margin-bottom: 5px;
}
.ui.labeled.icon.button,
.ui.labeled.icon.buttons .button {
  width: 175px;
  margin-bottom: 5px;
  white-space: nowrap;
}

.logo {
  width: 50px;
  height: 57px;
  /* background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAA5CAYAAAB0+HhyAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAA7uSURBVGhD3VoJlJTVlf7+Wruq9266aZpNhJFtEEQQ4jJEokY8HszB6IxITE80Oo5hxiU5mswczaA5yTHRjOOocUQYFTjEUYeYoBHBJVFURFsB6Sb0BvS+VFfXvv/z3Vf1V1d3VS8IzJnMd87tf3v/e/e797177/urNZ3AGYTRvRw1TVPnAuM6896p4IwTycTwoU4nmTNGxBuN4ueH2lHn8qDCCnx7ZhWWTa5QzzKHNM5NJpM6flmcESJP13XjoX1tmJYHfBoMIORxA+4+zK7IR/3t16o2w8mcqmdOzQw58N/H3PiPWhfWTSnGhcUOzHba1Ciaw44jrd2Y9cjmVEveSykv3jjV6ZXlke5wEAPRCEwn0XE8kUC1Ix8FFitmb2/AyhILFpdacZjT6r86u9DZ14140Act5Ife3Y13vl+DFbNnot7TD2vmlBLP8HrkKaIjmtAxp7AkdT2ILCL3HfoQz7YcQb7FkrozNtzRMLYtXYmFBVPwld8cx9dLTbAghtoBF2o72xDxuWEKepAfCSLm86Jm+SI8WXMdSn67CcUWO72R6mgMiKJ94RB819ycvJGBrKmVb7Zigi0P5RQ6fFxi5l+zSUNvKI7WaBz7fFHs7PNgf78bZnpYC/tJIgAnz80k3elyqbHE62YR1ceg5BrDqpmUXiK5kOWRB+s+wbYTDUiQ/yvLr0A/Bx4LUU6tRSXlsOpWFL7QiCJbHNGwG5agC8H+Llj8LpRwaiESRr/fizuvXImf3bgGb3W3qqk11CG8GuYhIeuNRXFH7XscK46WVetSTwaRTaT+E2w9fhQRvtB05Y2pu+PH3JcacdwXgjXKSOXvg9/dDaevD4UkEqNRuto70f78Y5hUVpp6Y3wIx2OYtWs7PYZxEqFHttIjSSJr1b0/9bwCiym3S+OJEKaXXgabpUhddwcimLj5CzjNfuWRAIkU+vuR5/eho6cLP1h9GR6+6Zuq7fv7anH4SBOs1sH1mLleotEY5p5zNi664Dx4GIDm735RTb2WVdkGzl7RORbe2w13Is8iFsx+GIr14bpFe1CWIlLJcNv+7XlYsv0TtEdlEZoR5zAdHj9+WfPXuPPqS9N54+nnXsQLTzIcO53q3SwEArjx72oUkbGQnUeG+CeJfFsVnLZKSkWWyDNRNhOTCuxou+VCrJ/mgMVmhmfAC33rL9IkDJSWFMNaXYXi6oko4XG4yLPS0qSBxsJpXyOZuG/7G3iiuRu+hibozz7AO7qkijROJgkOTq3ca2QEj8gA4x9kJHACIZaQs6F9ie0MOXnk1iubSA5opbNRNHMZZfmoIu32fvxZ6q0k4mnDEDwX5Y3SRMQf6cLz+8/Hi59dliXbPr0IH5/4RfLdMTAuInB3wdvRDW/n6CLtIqx6DSR0TUmaCBU36ipjWul6AgGSCUR7ckokzvwzDoxrjTzzwkvIy8sbwamDCIbCuGbVpaicUKau7962C4839CDW3AJ98z+pe8ZwBpEYw3ez6/c5w3tCj6HIPh0VBQvGXCMj5JFTW+wJZnqx/D1bd+ExEom3HCORHwkLKpcc7mT3H1+SyNCEGD/yMjOOnWfDfcJXqTTMNpjOvlIpakAs/v2tb+LRoz3QjwmRH6rn0kKetXMqvvv+ftjt1rR3hiMai2PmWVNx/sJ5pychRl5iJnY4eJbjYYJrwlmJvL9vTd3IgGgt5BLZ70lQWPtNWtaZXZKnkUqIW576WerGyBglIWZYV6xmK+QxlxSpZwZEZcPC+VoCWixGS4TUNR8kj4RVtgl811xUOKKA4uCGbCgG9crESSfE3N0QjD4aS23Brw724pn6ARzyJJBntTKSRbBikgP3LCjB5VOFtPSSw7uj4LQnRONJuoXYgSIkGlxBFD91APe914kedwSVjDp6KAC7FsfbbT5c8epxzN1+VN5SkIUvIkMOl5Exgl65PTJ0sTumLkEZax5Gf3UtkOE9Xh+8zfvU9cFuH859rg7V+XasnlGMtfPLMKnQivVvt+HdTh+LTk0pGGRsSMTjiNyxkFdyj+Jn/nnuPO7rJ6i+DOjRAMzz1sJ68YYxF/soa2QQodYGtDe0oK2xOS3tDc3wtTSlWgDnbj7E3ZsZ21adhadWTccl0woxqzQPv/yragS9AW60wohzm5oXC8EUi2DBf0oFkDJMIoaEqwOJfm7oMkTvb4QeYKIdB0aIWkMd/PN//1c4HUxYmV7l4xCVE/zDrkZuRTXctbgSK2YMVquhaAJ37WmgoiFwl0vo3N6yG8qhY1G81dyLlTMmQLeXwnrV49Asw8p5RkStfF7qwkAOSxNj5hEjuY0GbcM7sNns8P9gGSzmZNtFT+3HFy4/YiEfTDSXRqsnJxdVYZN4QsfXZlZi900XDVEt01aZOPmpNQxCotX9R7R7PlLSNvA+vKG2tGH8YeYRdxBm2sMgsbm2E4e7udUNDMARCcLh88LBHaI6inBt2YN+vHuoWbVPBwweQtF+jvdeaqy96A80JtuMgRGJJGNJEjvr1uHNI7dSbsNrdTehybUzbbrjbuYIKhF0edDY61f3nn7vKKL9/XAyodmCXLBBEuW5RYQEbAE/n9Fbvf2qfRrss9t3gGPIeLfh9foaHO56PvVwdIxARGLJoJPlgwwYXiXRGbnCQLnTCtArZrOOWRv2QLvjFXx0tBP5nJrg4gbXkTkUgp1iCQVh4lHjfZ1HM6dLLsgYaiyOm6lHEpkTcRAjrBFJiAm1RuRxrlrIeE0N+L0dzPBmtZBNsShM8QjsURJgdLLwXItzfXCNMO6KVWRUhOMJXDR3Cn53/7ekNzW7BLnGEpx0QgzEo3BFInBlfM8SpXUuzrSkyIm0drpQYkkw5jP5cS8iR0uEwnMLiz7IPV7HeD/OciXB6wSPFpJ7u82LH//2Y46Q7GuksQTyna0/Ela6GTCeCbI80hH2oY8LVD66nVc8cUhjgTFgIBDCNx7ZhTc/b4d1SjmiDK8azWWnIeziiVhY1VkJegS8p+txekU8Iv3pDBIxmJeep/qB34+N1y3DzSsWqL6zxkz9+czTo04WFVWQpFBLQnTK8ojbY0Z9mxXegQJ1bSguB+P85if2IH/dJrzZycU8YyKi/gimFjC49nk5pTiNonFaXUeMG/YY97pS6YMcWI6RUwKuXi/u/dblCDS1s6CMIb+iFLe8+hmK796ENz5vUuNkjit/OnwRHO+y4ESXxsjG/MJoapK5TAjxtEeO9gZwwQt1cDOayh4hzAEQ0fHgysn4569UqRce2P4hNrxUC0wohr3QibAnCKc5gR23XYLLF07Dxj31+O7Du2BmaeLgfZU7KCZOowTFT+vHOdc/3/yPOHdmterz1o278cy7dTBXl8POSjfgGsDMAgv7vAJ/Ob2KSiaw4uVG1Hf5UWGDml4d3f24fE4pdt2wTPWRJtLcF8DZj+7HX0wpwfziPByn29tDcfTR0lGSuWamEzt/80fEnPmwlxYgHOD6CQTx7E3L8J1L5w52Rsu5fUH87eNvYceeL7iPpVU4peSo2U1Yv2YpHvve1UPaC0LcIl/7xBt47VAr7JMnMAKaEOjqxeo5VThQeS6qODWXFFvp0RgODgTwcV8/w/0AJhZa0Hnv1YNEyh76A2x5dkwrcqAyz4pGEuigtcOyWM0WhCj2nlZGU8535osfr1mIB9YsUUpIJ5kwlBO09gyQWAjV5QUoK8pP3R36jpwZv8UcYxJd/cTrONDp5XQrQqRsGqZOqMBsemIqDdFD4x0YYL4iEY3G0UnmyeuX4vZL5kHr84X08rt/j8LJJSi02zivY/AGwyTBxUjLaCaGVZsNIVc/bplbhGdu/aoaVFQYxiELmaSGE84Fo/0HR1px7a/egGf+xchjvVXGHKUzivb4PRggERuDiZXrJBqO4JxyBw4+8DfQ9jb36Rf+9B2gkEUh57GsTI3zMlnc8Y/ZjBi3qtcvnYZfr5XSe3xKnQoMQtqjn6PYrnPqBTgbWLMFfanfWJibaOiIRENGwsDT62GqKqDf6AH57cLEGG1n1nWyrHCwhLCzPjLzKOHRyZcEZ5qEID0G11dM8g69YSGBfOplpZhIzMQUYQqGMNGWDLymGRMYZk0666Ew8llOiDhIysFyIp+kilhKoNeNmgumqBcMiNW+rIz1voFV0wvgp7I69bFJSSPbBp5beLTwGGTxuXb5HNVWLfZXPzmGa+7/HYrLuR/g7k2VEzK92MAbimHxOVX48OHr05aSwU64/4Aj3b+GxSRfV8aHaCKARdW3qw9u9Q1NuPXuf0GxfGRIwevz46EfrsfFyxYnrxk9i+7fzW1ABIVcH/JjqkU8wTUSYuDxcwbFdmxQbTXuN3RRbOPuw/juT1/nvtbC9SFJjBHLH8by88/CB48kt7yZRL7o3IK9LffDZh7fZ39BOObG1+dswvTSlXh/36dUeCXgTH6VVAi4se3lLbhhzVVqLBmnvseLuRteIys3LIkwrJwlQZ8P5YywxzbdhXxu+FRbISJ9yEuSfB7dUYvDx3pRVmDHDV+dg8WzJBkOjVDStsOzD019O2Ee4ZesXIjRI/MmrkOZczYaW07gRz95DEWFg2HZ5w/gnttrsGTRfKWciLGp2/LBn/BRXStsrLq+tmAarlp6jrqfNq5BRCAKDodhmf9NKOVSY6q/GdcGDAIGsojce/ADbGw5gii941n9HXW/+XjbkN/5zhSijFAzpk1RSVIPMunR+lKJanklcHFKTX59i1q3/m/cMjaRB+v2qz17mPmkOfU5SNMYBOwVcqKuzxhCHVQwrIhEnp2HeHcdTJMWIa+mNr0fka3WMe7ZM4nIuUn+DGcnMD4UJCFlK0V+fhKR8zMhMg6hzMWKQuw2fEeaqZehuzhAhV96RT2QhZX0SOOQD3RxhmSTdCwX/JPsQD06rZBIaRnhX0eGf0URHQwIEUVXCAxf0FQ1dSZVStI6SSapF1nDnG4ZiYSgyMoKJAPKCylR1+IRdZaCeGQbPeJgpyHZR4xkenn/NHlFdBnNw/JcKmS7ZuFWNzS+71oRRqsACYxKQnCaSAhGG0YgzyUmBVlxiG65kOWRV9qasNfVBRvXxP896PBxH/JvCy9OXQ8ii8ifK7Km1p8r/p8QAf4HOqN8APz4Mc0AAAAASUVORK5CYII=); */
  background-image: url(data:image/png;base64,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);
  background-repeat: no-repeat;
  background-size: 5rem 5rem;
  background-position: 50% 50%;
}

.label {
  width: 90px;
}
.labeled {
  margin-bottom: 2px;
}
.ui.vertical.menu {
  width: 25rem;
}
.lines-container {
  /* display: flex;
      flex-direction: column;
      flex:1 1 auto;
      background: red;*/
  margin-top: 0px !important;
  margin-left: 1px !important;
  margin-bottom: 0px !important;
  overflow-y: scroll;
  margin-top: 0px;

  display: flex !important;
  flex: 1 1 auto;

  align-items: stretch;
  flex-direction: column;
}
.side-menu {
  margin-bottom: 0px !important;
}
.ui.tag.label,
.ui.tag.labels .label {
  float: left;
  width: auto;
}

#app div.report {
  display: none;
}

@media only screen and (max-width: 600px) {
  .btn-container {
    min-width: 90%;
    margin-top: 1rem;
  }
  .ui.labeled.icon.button,
  .ui.labeled.icon.buttons .button {
    width: 100%;
    text-align: left;
  }
}

@media only screen {
  #app div.report {
    display: none !important;
  }
}

@media only print {
  #app {
    /* background: red; */
    height: auto;
  }
  #app div {
    display: none;
  }
  #app div.report div {
    display: block !important;
    font-weight: bold;
  }
  #app div.report {
    display: block;
    position: relative;
    float: left;
    clear: both;
    margin-top: 0px;
    margin-left: 0px;
    height: 297mm;
    width: 210mm;
    box-sizing: border-box;
    /* border: 1px dotted red;
            background: lightblue; */
  }
}
</style>
