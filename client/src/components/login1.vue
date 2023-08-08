<template>
  <div class="main main-body">
    <div class="ui middle aligned center aligned grid" style="width:450px">
      <div class="column">
        <h2 class="ui center aligned icon header">
          <i class="circular icon logo"></i>
          Tarqeem LIS
          <br />
          <br />
          <span style="font-family:'NotoArabic', 'Roboto';">{{
            labTitle
          }}</span>
        </h2>

        <form class="ui large form">
          <div class="ui stacked segment">
            <div
              class="ui floating dropdown labeled search icon button teal"
              style="width: 100%;margin-bottom: 1rem;font-family:'NotoArabic', 'Roboto';"
            >
              <i class="world icon"></i>
              <span class="text">{{ branch }}</span>
              <div class="menu">
                <div
                  class="item"
                  v-for="(branch, index) in branches"
                  :key="index"
                >
                  {{ branch.branch }}
                </div>
              </div>
            </div>

            <div class="field">
              <div class="ui left icon input">
                <i class="user icon" style="color: teal"></i>
                <input
                  type="text"
                  name="username"
                  v-model="username"
                  @keyup="hndlKeyUp($event)"
                  placeholder="Username"
                  autofocus
                />
              </div>
            </div>
            <div class="field">
              <div class="ui left icon input">
                <i class="lock icon" style="color: teal"></i>
                <input
                  type="password"
                  name="password"
                  v-model="password"
                  @keyup="hndlKeyUp($event)"
                  placeholder="Password"
                />
              </div>
            </div>
            <!-- <div class="ui fluid large teal submit button">Login</div> -->

            <div class="ui fluid large submit button teal" @click="login">
              Login
            </div>
          </div>

          <div class="ui error message"></div>
        </form>

        <div class="ui message" v-if="0">
          New to us? <a href="#">Sign Up</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import axios from "@/axios";
// import { mapGetters, mapActions } from "vuex";

export default {
  name: "Login",

  props: {
    msg: String,
  },
  data() {
    return {
      username: "",
      password: "",
      labTitle: "",
      branch: "",
      branchid: 0,
    };
  },
  created() {},
  methods: {
    // ...mapActions(['setBranches']),

    hndlKeyUp(event) {
      if (
        event.key == "Enter" &&
        this.password.trim().length &&
        this.username.trim().length
      )
        this.login();
    },

    login() {
      // let url = process.env.VUE_APP_API_URL;
      // if ( process.env.NODE_ENV == 'development' ) url = process.env.VUE_APP_API_URL;
      // let _url = `${url}home/api/auth/login`;
      // localStorage['branchId'] = this.branchid;
      // axios.post(_url, {
      //     username: this.username,
      //     password: this.password,
      //     branchId: this.branchid,
      // })
      // .then ( res => res.data )
      // .then ( data => {
      //     console.log(data)
      //     if ( data.result == 'success' ) {
      //         localStorage['auth_token'] = data.token;
      //         localStorage['sessionToken'] = data.sessionToken;
      //         localStorage['token'] = data.sessionId;
      //         this.$router.push('/');
      //         let decoded =window.jwt_decode(data.sessionToken);
      //         console.log(decoded);
      //     }
      // });
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
@media only screen and (max-width: 600px) {
  .ui.middle.aligned.center {
    width: 100% !important;
  }
  .ui.segment {
    border-color: rgba(0, 150, 136, 0.44) !important;
  }
}
</style>
