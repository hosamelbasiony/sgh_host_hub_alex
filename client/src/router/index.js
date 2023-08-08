import Vue from "vue";
import VueRouter from "vue-router";
import LandingPage from "../components/LandingPage.vue";
import Home from "../components/Home.vue";
import Login from "../components/Login.vue";
import Logo from "../components/Logo.vue";
// import Barcode from "../components/Barcode.vue";
import Receipt from "../components/Receipt.vue";
import Devices from "../components/Devices.vue";
import HostCodes from "../components/HostCodes.vue";

import ShiftsSetup from "../components/ShiftsSetup.vue";
import RunSetup from "../components/RunSetup.vue";

import TestSchedules from "../components/TestSchedules.vue";

const originalPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
};

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "home",
    component: Home,
    children: [
      {
        path: "",
        name: "LandingPage",
        component: LandingPage,
        children: [
          {
            path: "",
            name: "logo",
            component: Logo
          },
          {
            path: "print",
            name: "print",
            component: Receipt
          },
          {
            path: "devices",
            name: "devices",
            component: Devices
          },
          {
            path: "device/codes/:deviceId",
            name: "hostCodes",
            component: HostCodes
          },
          {
            path: "shift-setup",
            name: "shiftsSetup",
            component: ShiftsSetup
          },
          {
            path: "run-setup",
            name: "runSetup",
            component: RunSetup
          },
          {
            path: "schedules",
            name: "testSchedules",
            component: TestSchedules
          },
        ]
      },
    ]
  },
  {
    path: "/login",
    name: "login",
    component: Login,
  },
  // {
  //   path: "/about",
  //   name: "about",
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () =>
  //     import(/* webpackChunkName: "about" */ "../views/About.vue")
  // }
];

const router = new VueRouter({
  // mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
