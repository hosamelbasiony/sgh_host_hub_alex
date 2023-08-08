<template>
  <div id="app">
    <v-app>
      <v-content>
        <v-container fluid pa-0>
          <div class="background-shapes-wrapper">
            <div class="background-shapes-container">
              <div class="background-shape circle-one"></div>
              <div class="background-shape circle-two"></div>
              <div class="background-shape square-one"></div>
              <div class="background-shape square-two"></div>
              <div class="background-shape square-three"></div>
              <div class="background-shape triangle-one"></div>
              <div class="background-shape triangle-two"></div>
              <div class="background-shape triangle-three"></div>
              <div class="background-shape rectangle-one"></div>
              <div class="background-shape rectangle-two"></div>
            </div>
          </div>
          <v-layout row wrap>
            <v-flex
              xs12
              sm4
              id="sign-in-text-wrapper"
              v-bind:class="{ switch: isSwitch }"
            >
              <v-layout column align-center justify-center fill-height pa-3>
                <div class="login-wrapper text-xs-center mb-3 pa-5">
                  <!-- <div class="display-1 font-weight-black mb-3" v-if="isSwitch">Hello Friend</div> -->
                  <div class="display-1 font-weight-black mb-3 text-xl-center">
                    Saudi-German Hospital / Egypt
                  </div>
                  <span class="subheading">Tarqeem LIS</span>
                  <!-- <span class="subheading" v-if="isSwitch">Enter your personal details and start journey with us</span>
                <span class="subheading" v-else>To keep connected with us, please login with your personal info</span> -->
                </div>
                <!-- <v-btn round outline large dark ripple v-if="isSwitch" id="sign-up" @click="isSwitch = !isSwitch">Sign up</v-btn>
              <v-btn round outline large dark ripple v-else id="sign-in" @click="isSwitch = !isSwitch">Sign in</v-btn> -->
              </v-layout>
            </v-flex>
            <v-flex
              xs12
              sm8
              id="sign-up-form-wrapper"
              class="active"
              v-bind:class="{ switch: isSwitch }"
            >
              <v-layout column align-center justify-center pa-3 mt-5>
                <v-flex xs12 mb-3 mt-5>
                  <div class="login-wrapper text-xs-center">
                    <div class="display-1 font-weight-black">
                      <v-img
                        src="/img/icons/logointro.png"
                        max-height="250"
                        max-width="250"
                      ></v-img>
                      <!-- <span class="subheading" >Saudi-German Hospital / Egypt</span> -->
                    </div>
                  </div>
                </v-flex>
                <!-- <v-flex xs12 mb-3>
                <v-btn outline fab small color="blue-grey lighten-4">
                  <v-icon color="grey darken-4">mdi-facebook</v-icon>
                </v-btn>
                <v-btn outline fab small color="blue-grey lighten-4">
                  <v-icon color="grey darken-4">mdi-google-plus</v-icon>
                </v-btn>
                <v-btn outline fab small color="blue-grey lighten-4">
                  <v-icon color="grey darken-4">mdi-linkedin</v-icon>
                </v-btn>
              </v-flex> -->

                <v-flex xs12 class="form-wrapper">
                  <v-text-field
                    filled=""
                    full-width
                    single-line
                    autofocus
                    background-color="#f4f8f7"
                    v-model="username"
                    placeholder="username"
                    color="grey darken-2"
                    prepend-inner-icon="mdi-account-outline"
                    mb-0
                  ></v-text-field>
                  <!-- <v-text-field box full-width single-line label="Email" background-color="#f4f8f7" color="grey darken-2" prepend-inner-icon="mdi-email-outline"></v-text-field> -->
                  <v-text-field
                    v-model="password"
                    :append-icon="
                      show1 ? 'mdi-eye-outline' : 'mdi-eye-off-outline'
                    "
                    :type="show1 ? 'text' : 'password'"
                    filled
                    full-width
                    single-line
                    placeholder="Password"
                    background-color="#f4f8f7"
                    color="grey darken-2"
                    prepend-inner-icon="mdi-lock-outline"
                    @click:append="show1 = !show1"
                  ></v-text-field>
                </v-flex>
                <v-btn
                  rounded
                  large
                  dark
                  ripple
                  color="blue"
                  id="sign-up"
                  @click="login()"
                  >Sign IN</v-btn
                >
                <br />
                <br />
                <br />
                <v-flex xs12 mb-2>
                  <span class="grey--text text--lighten-1"
                    >copyright © 2019 Tarqeem LIS</span
                  >
                </v-flex>
              </v-layout>
            </v-flex>
          </v-layout>
        </v-container>
      </v-content>
    </v-app>
  </div>
</template>
<script>
import axios from "axios";
import { mapActions } from "vuex";

export default {
  data() {
    return {
      isSwitch: false,
      show1: false,
      password: "",
      username: "",
    };
  },

  methods: {
    ...mapActions(["setBusy", "setAuth"]),

    async login() {
      this.setBusy(1);

      try {
        const ret = await axios.post(
          `${process.env.VUE_APP_API_URL}auth/authenticate`,
          {
            username: this.username,
            password: this.password,
            branchId: this.branchid,
          }
        );

        this.setBusy(0);

        if (ret.data.success) {
          console.log(ret.data);
          localStorage["auth_token"] = ret.data.token;
          this.setAuth(ret.data);
          this.$router.push(`/`);
        }
      } catch (ex) {
        this.setBusy(0);
      }
    },

    login0() {
      // let url = `${baseURL}auth`;
      // axios.post(url, {
      //     username: this.username,
      //     password: this.password,
      // })
      // .then ( res => res.data )
      // .then ( data => {
      //     console.log(data)
      //     if ( data.success ) {
      //         localStorage['token'] = data.token;
      //         this.$router.push('/');
      //     }
      // });
    },
  },
};
</script>
<style scoped>
.container {
  min-height: 530px;
  height: 100vh;
  width: 100vw;
  background-image: linear-gradient(253deg, #1248de 0, #5c69bf 100%);
  color: white;
}

.form-wrapper {
  min-width: 50%;
}

.layout.wrap {
  height: 100vh;
}

.active {
  background: #fff;
  color: #2d2c83;
}

#sign-in,
.switch #sign-up {
  width: 60%;
}

#sign-up,
.switch #sign-in {
  min-width: 25%;
  width: auto;
}

.form-wrapper .v-input__control > .v-input__slot {
  background: rgba(244, 248, 247, 1);
}

.form-wrapper .v-text-field.v-text-field--enclosed .v-text-field__details {
  margin-bottom: 0px;
  height: 0px;
}

#sign-in-text-wrapper {
  background-image: linear-gradient(253deg, #1248de 0, #5c69bf 100%);
  position: absolute;
  animation: 0.5s linear slide-back-left;
  left: 0;
  right: auto;
  height: 100vh;
  width: 33%;
}

#sign-up-form-wrapper {
  position: absolute;
  animation: 0.5s linear slide-back-right;
  right: 0;
  left: auto;
  height: 100vh;
  width: 67%;
}

#sign-in-text-wrapper.switch {
  background-image: linear-gradient(253deg, #40a9aa 0, #40aba6 100%);
  right: 0;
  left: auto;
  animation: 0.5s linear slide-right;
}

#sign-up-form-wrapper.switch {
  left: 0;
  animation: 0.5s linear slide-left;
}

@keyframes slide-left {
  0% {
    left: 33%;
    opacity: 0;
  }
  50% {
    left: 25%;
    opacity: 0;
  }
  100% {
    left: 0;
    opacity: 1;
  }
}

@keyframes slide-right {
  0% {
    right: 100%;
    width: 33%;
    z-index: 1;
  }
  20% {
    right: 75%;
    width: 60%;
    max-width: 60%;
    z-index: 1;
  }
  100% {
    right: 0;
    width: 33%;
    max-width: 35%;
    z-index: 1;
  }
}

@keyframes slide-back-left {
  0% {
    left: 67%;
    width: 33%;
    z-index: 1;
  }
  20% {
    left: 50%;
    width: 60%;
    max-width: 60%;
    z-index: 1;
  }
  100% {
    left: 0;
    width: 33%;
    z-index: 1;
  }
}

@keyframes slide-back-right {
  0% {
    left: 0;
    opacity: 0;
  }
  50% {
    left: 25%;
    opacity: 0;
  }
  100% {
    left: 33%;
    opacity: 1;
  }
}
.background-shapes-wrapper {
  position: absolute;
  width: 100vw;
  height: 100%;
  top: 0;
  overflow: hidden;
}

.background-shapes-container {
  width: 100%;
  height: 100%;
  position: relative;
}
.background-shape {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.1);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  z-index: 10;
}

.square-one {
  width: 30px;
  height: 30px;
  top: 15%;
  left: 20%;
  -webkit-transform: rotate(-65deg);
  transform: rotate(-65deg);
}

.square-two {
  width: 25px;
  height: 25px;
  top: 55%;
  right: 1%;
  -webkit-transform: rotate(-65deg);
  transform: rotate(-65deg);
}
.square-three {
  width: 50px;
  height: 50px;
  top: 30%;
  left: 45%;
  -webkit-transform: rotate(-65deg);
  transform: rotate(-65deg);
}

.circle-one {
  width: 250px;
  height: 250px;
  border-radius: 100%;
  bottom: -125px;
  left: -125px;
}

.circle-two {
  width: 30px;
  height: 30px;
  bottom: 20%;
  right: 25%;
  border-radius: 100%;
}

.triangle-one {
  width: 0;
  height: 0;
  border-top: 69px solid transparent;
  border-bottom: 48px solid transparent;
  border-left: 90px solid rgba(255, 255, 255, 0.08);
  top: 45%;
  left: 30%;
  background-color: transparent;
  -webkit-transform: rotate(-100deg);
  transform: rotate(-100deg);
}
.triangle-two {
  width: 0;
  height: 0;
  border-top: 200px solid transparent;
  border-bottom: 130px solid transparent;
  border-left: 180px solid rgba(255, 255, 255, 0.1);
  top: -150px;
  right: -80px;
  background-color: transparent;
  -webkit-transform: rotate(-80deg);
  transform: rotate(-80deg);
}

.triangle-three {
  width: 0;
  height: 0;
  border-top: 68px solid transparent;
  border-bottom: 49px solid transparent;
  border-left: 90px solid rgba(255, 255, 255, 0.08);
  right: 10%;
  bottom: 1%;
  background-color: transparent;
  transform: rotate(-170deg);
}

.rectangle-one {
  width: 25px;
  height: 50px;
  top: 80%;
  left: 25%;
  -webkit-transform: rotate(-55deg);
  transform: rotate(-55deg);
}
.rectangle-two {
  width: 15px;
  height: 30px;
  top: 42%;
  right: 23%;
  -webkit-transform: rotate(-55deg);
  transform: rotate(-55deg);
}
</style>
