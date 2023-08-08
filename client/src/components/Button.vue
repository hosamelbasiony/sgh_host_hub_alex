<template>
  <v-card
    outlined
    light
    elevation="2"
    class="home-card"
    :disabled="disabled"
    @click="loadView()"
    :style="'background:' + background"
  >
    <v-list-item href="" class="theme--light primary--text" tabindex="0">
      <v-avatar size="40px" :color="color" :class="'mr-4 lighten-2'">
        <v-icon dark>{{ icon }}</v-icon>
      </v-avatar>
      <div class="v-list-item__content">
        <div class="v-list-item__title" style="font-weight: bold;">
          <span>{{ title }}</span>
        </div>
        <div class="v-list-item__subtitle">
          <span>{{ subtitle }}</span>
        </div>
      </div>

      <div class="v-list-item__action">
        <i
          aria-hidden="true"
          class="v-icon notranslate mdi mdi-arrow-right theme--light"
        ></i>
      </div>
    </v-list-item>
  </v-card>
</template>

<script>
export default {
  props: ["to", "disabled", "icon", "title", "subtitle", "color", "background"],

  methods: {
    loadView() {
      this.$router.push(`/${this.to}`);
    },
  },
};
</script>

<style>
.home-card {
  /* margin: .25rem!important;
        height: 4rem!important;
        width: 24.5rem!important; */

  margin: 0.25rem !important;
  height: 4.75rem !important;
  /* width: 37rem!important; */
  width: calc(33.33% - 0.5rem) !important;
  zoom: 1.25;
  /* background: #0e40ff26!important;
        background: #0e40ff0d!important; */
}
@media only screen and (max-width: 1150px) {
  .home-card {
    width: calc(49.5% - 0.5rem) !important;
  }
}
@media only screen and (max-width: 605px) {
  .home-card {
    width: auto !important;
    margin: auto !important;
    margin-top: 0.5rem !important;
    zoom: 1.1;
    height: 4.25rem !important;
    flex: 1;
  }
}
</style>
