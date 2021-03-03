<template>
  <div class="main columns is-multiline is-mobile is-tablet is-desktop mb-0">
    <div class="column sidebar has-background-light">
      <aside class="pl-4 pt-4">
        <p class="menu-label">描画データ</p>
        <b-field label="表示地点">
          <b-select v-model="station" placeholder="地点を選択" expanded>
            <option
              v-for="option in options"
              :key="option.id"
              :value="option.number"
            >
              {{ option.name }}
            </option>
          </b-select>
        </b-field>
        <b-field label="観測日時">
          <b-datetimepicker
            v-model="basetime"
            rounded
            placeholder="日時を選択"
            icon="calendar-today"
            locale="ja-JP"
            :timepicker="{ incrementMinutes: 60, incrementHours: 12 }"
            horizontal-time-picker
          ></b-datetimepicker>
        </b-field>
        <p v-if="dataerror" class="has-text-danger has-text-weight-bold">
          データ取得エラー
        </p>

        <p class="menu-label">表示範囲</p>
        <div class="control">
          <b-field label="気温">
            <b-slider
              v-model="trange"
              size="is-small"
              type="is-info"
              :min="-120"
              :max="50"
              :step="10"
              :disabled="isfitrange"
            ></b-slider>
          </b-field>
          <b-field label="温位">
            <b-slider
              v-model="thetarange"
              size="is-small"
              type="is-info"
              :min="200"
              :max="450"
              :step="10"
              :disabled="isfitrange"
            ></b-slider>
          </b-field>
          <b-field label="風速">
            <b-slider
              v-model="rrange"
              size="is-small"
              type="is-info"
              :min="0"
              :max="150"
              :step="10"
              :disabled="isfitrange"
            ></b-slider>
          </b-field>
          <div class="field">
            <b-checkbox v-model="isfitrange" size="is-small" @input="fitRange">
              データに合わせる
            </b-checkbox>
          </div>
          <b-field label="気圧">
            <b-slider
              v-model="prange"
              size="is-small"
              type="is-info"
              :min="50"
              :max="1050"
              :step="50"
            ></b-slider>
          </b-field>

          <div class="field">
            <b-checkbox v-model="isgrid" size="is-small">
              グリッド{{ isgrid ? 'あり ' : 'なし' }}
            </b-checkbox>
          </div>
          <a
            class="button"
            href="https://github.com/tmiyachi/vue-emagram"
            target="_blank"
          >
            <span class="icon">
              <i class="mdi mdi-github"></i>
            </span>
            <span>GitHub</span>
          </a>
        </div>
      </aside>
    </div>
    <div class="column pt-4">
      <div class="tile is-ancestor">
        <div class="tile is-parent">
          <div class="tile is-child">
            <Emagram
              :width="560"
              :height="630"
              :title="title"
              :prange="prange"
              :trange="trange"
              :isgrid="isgrid"
              :soundings="soundings"
            />
          </div>
        </div>
        <div class="tile is-parent is-vertical">
          <div class="tile is-child mb-0">
            <Hodograph
              :width="320"
              :height="250"
              title=""
              :prange="prange"
              :rrange="rrange"
              :isgrid="isgrid"
              :soundings="soundings"
            />
          </div>
          <div class="tile is-child">
            <Emagram
              :height="350"
              :width="320"
              title=""
              :prange="prange"
              :trange="thetarange"
              :isgrid="isgrid"
              :soundings="soundings"
              :xaxis="'theta'"
              :istooltip="false"
              :isbarb="false"
            ></Emagram>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Vue from 'vue';
  import { Field, Select, Datetimepicker, Slider, Checkbox } from 'buefy';
  import * as d3 from 'd3';
  import { calcThetaEs } from '@/lib/thermodynamics.js';
  import Emagram from '@/components/Emagram.vue';
  import Hodograph from '@/components/Hodograph.vue';

  import 'buefy/dist/buefy.css';

  Vue.use(Field);
  Vue.use(Select);
  Vue.use(Datetimepicker);
  Vue.use(Slider);
  Vue.use(Checkbox);

  export default {
    components: {
      Emagram,
      Hodograph,
    },
    data() {
      return {
        // データオプション
        station: 47646,
        basetime: new Date('2020-08-27T12:00'),
        // エラー制御
        dataerror: false,
        // 描画オプション
        isfitrange: false,
        trange: [-80, 40],
        prange: [100, 1050],
        thetarange: [280, 400],
        rrange: [0, 100],
        isgrid: true,
        // 地点選択リスト
        options: [
          { name: '館野', number: 47646 },
          { name: '松江', number: 47741 },
          { name: '潮岬', number: 47778 },
          { name: '鹿児島', number: 47827 },
          { name: '石垣島', number: 47918 },
          { name: '父島', number: 47971 },
        ],
        // 描画データ
        title: '',
        soundings: [],
      };
    },
    watch: {
      station: {
        handler: function () {
          this.getSoundings();
        },
        immediate: true,
      },
      basetime: function () {
        this.getSoundings();
      },
    },
    methods: {
      getSoundings() {
        const source = `data/obs_${d3.timeFormat('%Y%m%d%H')(this.basetime)}_${
          this.station
        }.json`;
        d3.json(source)
          .then((res) => {
            this.dataerror = false;
            const name = this.options.find((d) => d.number == res.station).name;
            this.title = `${name} ${d3.timeFormat('%Y/%m/%d %H')(
              new Date(res.year, res.month - 1, res.day, res.hour)
            )}UTC`;
            this.soundings = res.data.map((d) => {
              d['thtes'] = d.temp == null ? null : calcThetaEs(d.pres, d.temp);
              return d;
            });
            if (this.isfitrange) this.fitRange();
          })
          .catch((e) => {
            this.dataerror = true;
            this.title = '';
            this.soundings = [];
            console.log(e);
          });
      },
      changeChecked(checked) {
        if (checked) this.fitRange();
      },
      fitRange() {
        const soundings = this.soundings.filter(
          (d) => (d.pres >= this.prange[0]) & (d.pres <= this.prange[1])
        );
        const tmin = d3.min(soundings, (d) => d3.min([d.temp, d.dewt]));
        const tmax = d3.max(soundings, (d) => d3.max([d.temp, d.dewt]));

        const thetamin = d3.min(soundings, (d) =>
          d3.min([d.thta, d.thte, d.thtes])
        );
        const thetamax = d3.max(soundings, (d) =>
          d3.max([d.thta, d.thte, d.thtes])
        );

        const rmax = d3.max(soundings, (d) => d.sknt);

        if (tmin) {
          this.trange = [Math.floor(tmin / 5) * 5, Math.ceil(tmax / 5) * 5 + 5];
        }
        if (thetamin) {
          this.thetarange = [
            Math.floor(thetamin / 10) * 10,
            Math.ceil(thetamax / 10) * 10,
          ];
        }
        if (rmax) {
          this.rrange = [0, Math.ceil(rmax / 5) * 5];
        }
      },
    },
  };
</script>

<style>
  .main {
    max-width: 1216px;
  }
  .sidebar {
    min-width: 240px;
    max-width: 240px;
    height: 100vh;
  }
</style>
