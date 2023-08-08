
const state = {
    auth: {
        user: { fullName: '' },
        ready: false
    },
    schedulingData: {
        tests: [],
        runs: [],
        shifts: []
    },
    params: {
        tests: [],
        parameters: []
    },
    url: "",
    busy: false,
    drawer: null,
    receipt: {},
    printMode: '',
};

const getters = {
    params: state => state.params,
    schedulingData: state => state.schedulingData,
    url: state => state.url,
    busy: state => state.busy,
    drawer: state => state.drawer,
    receipt: state => state.receipt,
    printMode: state => state.printMode, 
    auth: state => state.auth, 
};

const actions = {    
    setParams: async ({ commit }, params) => commit('setParams', params),
    setSchedulingData: async ({ commit }, schedulingData) => commit('setSchedulingData', schedulingData),
    setUrl: async ({ commit }, url) => commit('setUrl', url),
    setBusy: async ({ commit }, busy) => commit('setBusy', busy),
    
    setReceipt: async ({ commit }, receipt) => commit('setReceipt', receipt),
    
    setAuth: async ({ commit }, auth) => commit('setAuth', auth),
};

const mutations = {
    
    setAuth: (state, auth) => state.auth = auth,
    setParams: (state, params) => state.params = params,
    setSchedulingData: (state, schedulingData) => state.schedulingData = schedulingData,
    setUrl: (state, url) => state.url = url,
    setBusy: (state, busy) => state.busy = busy,
    
    setReceipt: (state, receipt) => {
        state.receipt = receipt;
    },

};

export default {
    state, 
    getters, 
    actions, 
    mutations
}