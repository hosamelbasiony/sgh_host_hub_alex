<template>
  <!-- <v-flex xs12 class="d-flex flex-grow-1 pa-0 cover" 
        style="padding: 0!important;
                margin: 0!important;">

    </v-flex> -->

  <div class="row0">
    <!-- <div class="col-md-4"> -->

    <v-card :color="'rgba(2, 29, 53, 0.79)'" dark style="flex:1 1 100%">
      <!-- <div class="d-flex flex-no-wrap justify-space-between"> -->
      <div class="d-flex flex-no-wrap justify-flex-start">
        <v-avatar class="ma-3" size="125" tile>
          <v-img
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYYAAAGQCAYAAACqD8djAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAEbrSURBVHhe7Z0JvF1Vfe//Z7pTRjKRhBCGQBgChkERhApGBFtwqAoORahaKrZWBF/7+qGtgD7tp9Li09dXfFVRcKhAK6LFihRKZJTKEAWZIQlhCCFkvLm5957h/X//tdY+e52cm9ybO+QMv2/yv2vYaw9n773+v/1fe+9zMtl931ARQgghxJP1KSGEEGJQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERQGAghhERksvu+oeLzhLQl+b27ZdLxcyQ/p0s6DpgkFSmLVMpS6h2QgWe3qPVK3/0bfWtCWh8KA2lbppy6r0x75/7SceDkRAxE00qlpNmSlJFWilYubemXvl9ukK3/+oqU1g26BRDSolAYSNvRfeQsmfPpoyWnkYLA+ds/JwwmCmqoL5dVFNSQliEQ5UGbtu2n62XbjRulsg1CQkjrQWEgbcWs85dqlLBIHbyKAMTAIoRqGoTBCcKgEwcTBVdGJIFy6ZXtsvX/rJfS80VbLiGtBG8+k7Zh9oXHyZR3HKwOXgMCvRwyK2c0VfN15bLKRamcWEUbu7wKAlIMMWk+s1dGJn1mmuQW5PzSCWkdKAykLZh94Rtl8rIDnAhIRsomBhCFqkiUSxAFNYiBmgkBxEGFwMQBdUVfD3Xp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RBp8Xiw3XMlhfQ8/+qQ5TiwrXDmOF1gvopxabD/r+scaLBf7G0KI/QoLQyEjYTzOj6GoPTcBjme4UMBFRm2UiOMIUUE9HDMc/1CgPdZRe95g/nqiPRKwf7EcnL/Y7xSH8YHCMAbgBIXVAgcVnBGGH+rdKMNVGoYHdgcsG84WHTVc/aLj4aoMHSbUAQx91DrGeg40TVhWrROo58ACWEftlTmcyXg4uHoEsazdRtvP4yBKiKowfJce0tjZ/hmK8Tg/wHDOTYBjjXMJ24D26XMHFx4AnxFX7RAVREZDgXkxFBXmC+zOfkmTXh7WcZFGMjsTKLL7UBjGgJXPO+eMF7TQqXCyopzuYOhQuHJGSB06K/Jwlpi2M/BkCZ6wgZPAfGkwr61HHUsgOEdECAG0g1igPmzfcIYocKX4w69/yRwG5gvDJkN1cqwb0QvaoT3WiRu/WA7Wh/rxBM4OQx+4EY/9lT4WqB9rIDZBiLEurLP2M+7s+AVGc37sjOGcmwHcc8GNbNSnhQ73JMLxxHyILH6Umhf7HNMxDc4bZYgHhhDDZ8b6cR6MhtrP4S5+7vBTyVjCr8QYA/AVA//83Rtl+rTJ9hjhu08/xa7APvTJv446WHDe73/HaTYWft1PbrWbi2lws/bxZ1ZFX1uAOiwP86Hj3bL8Xj9F7CszDl20f7ScJ55ZqX8ztvwA5sfXUnz8nPcm68aLdOl1pceVA6i75Y77rCPiayewbHyul4f4WgWs4/of3ypvPOZIa4/5EfbjqveWO+6VQw/af8grYOyrXz74SPL1GbVlULt/6rXBZ8BNSwyJ4Fgsv+8BE4X0saj3WfHVHfhc6a8hGU7dj70QY10A68K0sPyhjl/tNuzq/Ki3LaDeZwkM99wEWO7f/uUnTcTT5x/m33/feXbu4Fz70lXXRMcQN9tP0YsBTPvlQ4/Y58V0bOvpJ58gxx99pB0DLDdQ/9juvA77o6ur0/bP2085wURhqCFNMjr4uCohbQ7ECg7YDSOdYvcDSHvDoSRC2hwM0eBdBAz74LFeQhgxEEIIiWDEQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJILCQAghJIXI/wd3aLV1w/KSyAAAAABJRU5ErkJggg=="
            alt=""
            style="opacity: 0.75!important;"
          ></v-img>
        </v-avatar>

        <div v-if="'auth.user'">
          <v-card-title
            class="headline"
            style="font-family: Kufi, Roboto!important;"
            v-text="'Saudi-German Hospital / Egypt'"
          ></v-card-title>

          <v-card-subtitle v-text="'Tarqeem LIS'"></v-card-subtitle>
          <v-card-subtitle
            v-text="auth.user.fullName"
            style="
                            font-family:NotoArabic, Roboto;
                            font-size: 1.25rem;"
            v-if="'auth.user'"
          ></v-card-subtitle>

          <span
            style="font-family:Kufi,Roboto;font-size:1px;height:0;width:0;position: absolute;"
            >ا</span
          >
        </div>
      </div>
    </v-card>

    <template v-if="'auth.ready'">
      <!-- <Button :to="'dashboard'" :background="'rgba(0, 128, 128, 0.57)'"  :icon="'mdi-view-dashboard'" :color="'green'" :title="'Dashboard'" :subtitle="'A brief look at the lab workflow'" /> -->

      <Button
        :to="'print'"
        :background="'rgba(71, 98, 137, 0.52)'"
        :icon="'mdi-account-edit'"
        :color="'purple'"
        :title="'Reception'"
        :subtitle="'Search, Edit patient data'"
      />

      <!-- <Button :to="'sampling'" :background="'rgba(168, 0, 179, 0.36)'" :icon="'mdi-flask'" :color="'purple'" :title="'Sampling'" :subtitle="'Search, Edit patient data'" /> -->
      <!-- <Button :to="'sampling'" :background="'rgba(179, 124, 0, 0.36)'" :icon="'mdi-flask'" :color="'purple'" :title="'Sampling'" :subtitle="'Sample status and tracking module'" /> -->

      <!-- <Button :to="'results/edit'" :background="'rgba(15, 116, 255, 0.36)'" :icon="'mdi-file-chart'" :color="'blue'" :title="'Results'" :subtitle="'Search, Edit patient results'" /> -->

      <Button
        :to="'shift-setup'"
        :background="'rgba(13, 115, 0, 0.32)'"
        :icon="'mdi-clock'"
        :color="'teal'"
        :title="'Shift Setup'"
        :subtitle="'Setup for various lab settings and parameters'"
      />

      <Button
        :to="'run-setup'"
        :background="'rgba(105, 39, 0, 0.28)'"
        :icon="'mdi-camera-timer'"
        :color="'brown'"
        :title="'Run Setup'"
        :subtitle="'Setup for various lab settings and parameters'"
      />

      <!-- <Button :to="'price-plans'" :background="'rgba(105, 39, 0, 0.28)'"  :icon="'mdi-folder-move'" :color="'brown'"  :title="'Price plans'" :subtitle="'Search, Edit price plans'" /> -->

      <Button
        :to="'schedules'"
        :background="'rgba(175, 104, 0, 0.48)'"
        :icon="'mdi-spotlight'"
        :color="'orange'"
        :title="'Scheduling'"
        :subtitle="'Periodic claims for contracts and lab to lab'"
      />

      <!-- <Button :to="'financial'" :background="'rgba(152, 137, 3, 0.35)'"  :icon="'mdi-playlist-check'" :color="'cyan'" :title="'Financial'" :subtitle="'A brief look at the lab workflow'" /> -->

      <!-- <Button :to="'finances'" :background="'rgba(94, 0, 142, 0.32)'" :disabled="false" :icon="'mdi-view-dashboard'" :color="'purple'" :title="'Finances'" :subtitle="'Total financial transactions'" /> -->

      <!-- <Button :to="'devices'" :background="'rgba(202, 0, 0, 0.46)'" :icon="'mdi-format-list-checks'" :color="'red'"  :title="'Devices'" :subtitle="'Device and host codes setup'" /> -->

      <!-- <Button :to="'lists'" :background="'rgba(17, 125, 120, 0.43)'" :icon="'mdi-clipboard-account'" :color="'teal'"  :title="'Patient Lists'" :subtitle="'Search, list clients with various demographic or financial criteria'" /> -->

      <Button
        :to="'devices'"
        :background="'rgba(94, 0, 142, 0.32)'"
        :icon="'mdi-format-list-bulleted-type'"
        :color="'purple'"
        :title="'Devices'"
        :subtitle="'Device and host codes setup'"
      />

      <Button
        :to="'users-setup'"
        :background="'rgba(218, 4, 43, 0.32)'"
        :icon="'mdi-account-circle'"
        :color="'red'"
        :title="'User Management'"
        :disabled="true"
        :subtitle="'Edit users and privileges'"
      />
    </template>

    <!-- </div> -->
  </div>
</template>

<script>
import Button from "./Button";
import { mapGetters, mapActions } from "vuex";

export default {
  computed: {
    ...mapGetters(["userData", "auth", "currentBranch"]),

    privs() {
      try {
        let registrationEnabled = true;
        let resultsEnabled = true;

        let privs = this.auth.user.userBranchPrivDetails.filter(
          (x) => x.branchId == this.currentBranch
        );
        let reg = privs.find((x) => x.priv == "registrationEnabled");
        if (reg) if (reg.enabled == 1) registrationEnabled = true;

        let results = privs.find((x) => x.priv == "resultsEnabled");
        if (results) if (results.enabled == 1) resultsEnabled = true;

        return {
          registrationEnabled,
          resultsEnabled,
        };
      } catch (ex) {
        return {
          registrationEnabled: false,
          resultsEnabled: false,
        };
      }
    },
  },

  components: {
    Button,
  },

  // data() {
  //     return {
  //         // registrationEnabled: false,
  //         // resultsEnabled: false
  //     }
  // },

  created() {
    // try {
    // } catch(ex) {
    //     console.log({});
    // }
  },

  methods: {
    ...mapActions(["setBusy", "setAuth"]),
  },
};
</script>

<style>
.cover {
  /* background-image: url("/img/logo0.png"); */
  background-image: url("/img/logo3.PNG");
  background-size: 100% 100%;
  padding: 0 !important;
  margin: 0 !important;

  background-size: 350px 250px;
  background-color: #ffffff;
  /* background-size: 700px 500px;
        background-color: #0c1e34; */

  padding: 0 !important;
  margin: 0 !important;
  background-position: center;
}

.row0 {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  /* margin: 10rem!important; */
  width: 75rem !important;
  margin-top: 2.5rem;
  margin-top: 0.5rem;
  margin-left: calc(50% - 37.5rem);
  align-content: flex-start;
}

@media only screen and (max-width: 1200px) {
  .row0 {
    width: 70rem !important;
    margin-left: calc(50% - 34.5rem);
  }
}
@media only screen and (max-width: 1150px) {
  .row0 {
    width: calc(100% - 1rem) !important;
    margin-left: 0.5rem !important;
  }
}
@media only screen and (max-width: 600px) {
  .cover {
    background-size: 325px 275px;
  }
  .row0 {
    margin: 0.5rem !important;
    padding-bottom: 0.5rem !important;
  }
  .col-md-4 {
    height: 0;
    margin: 0;
  }
}
</style>
