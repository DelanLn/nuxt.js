import Vue from 'vue'
import { hasFetch } from '../utils'

const isSsrHydration = (vm) => vm.$vnode && vm.$vnode.elm && vm.$vnode.elm.dataset && vm.$vnode.elm.dataset.ssrKey

export default {
  beforeCreate() {
    if (hasFetch(this)) {
      const waitOnFetch = typeof this.$options.waitOnFetch === 'undefined' ? true : this.$options.waitOnFetch

      this._waitOnFetch = [true, 'client'].includes(waitOnFetch)
      Vue.util.defineReactive(this, '$isFetching', false)
    }
  },
  created () {
    if (hasFetch(this) && isSsrHydration(this)) {
      // Hydrate component
      this._hydrated = true
      this.$isLoading = false

      this._ssrKey = +this.$vnode.elm.dataset.ssrKey
      const asyncData = this.$nuxt.state.data[this._ssrKey]

      for (const key in asyncData) {
        this[key] = asyncData[key]
      }
    }
  },
  beforeMount() {
    if (!this._hydrated && hasFetch(this)) {
      this.$fetch()
    }
  },
  methods: {
    async '$fetch'() {
      this._waitOnFetch && this.$nuxt.nbFetching++
      this.$isFetching = true
      try {
        await this.$options.fetch.call(this, this.$nuxt.$options.context)
      } catch (err) {
        this.$nuxt.error(err)
      }
      this.$isFetching = false
      if (this._waitOnFetch) {
        this.$nextTick(() => this.$nuxt.nbFetching--)
      }
    }
  }
}
