<template>
  <svg :width="width" :height="height">
    <text :x="width / 2" :y="0" text-anchor="middle" dy="1.2em">
      {{ title }}
    </text>
    <g
      :transform="`translate(${margin.left + axisWidth / 2},${
        margin.top + axisHeight / 2
      })`"
    >
      <g class="aaxis">
        <g v-for="a in aaxis" :key="a.id">
          <line
            v-show="isgrid"
            x2="0"
            :y2="outerRadius"
            :transform="`rotate(${a.angle})`"
          />
          <text
            x="0"
            y="0"
            dy="0.2em"
            text-anchor="middle"
            :transform="`translate(${a.translate})`"
          >
            {{ a.label }}
          </text>
        </g>
      </g>
      <g class="raxis">
        <circle r="1" />
        <g v-for="r in raxis" :key="r.id">
          <circle :r="r.radius" />
          <text
            x="0"
            y="0"
            text-anchor="end"
            dx="-0.2em"
            dy="0.2em"
            :transform="`translate(${r.translate})`"
          >
            {{ r.label }}
          </text>
        </g>
      </g>
      <g class="sounding">
        <path v-for="line in lines" :key="line.id" :d="d(line.d)" />
      </g>
    </g>
  </svg>
</template>

<script>
  import * as d3 from 'd3';

  export default {
    props: {
      width: { type: Number, default: 560 },
      height: { type: Number, default: 600 },
      prange: { type: Array, default: () => [100, 1050] },
      rrange: { type: Array, default: () => [0, 100] },
      isgrid: { type: Boolean, default: false },
      soundings: {
        type: Array,
        default: () => [],
      },
      title: { type: String, default: '' },
    },
    data: () => ({
      margin: { top: 40, bottom: 10, left: 5, right: 5 },
    }),
    computed: {
      aaxis() {
        const scale = this.scale;
        const axisLabels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return d3.range(0, 360, 45).map((a, i) => ({
          angle: a,
          label: axisLabels[i],
          translate: d3.pointRadial(scale.a(a), this.outerRadius + 10),
        }));
      },
      raxis() {
        const scale = this.scale;
        const ticks = this.isgrid
          ? scale.r.ticks(5).slice(1)
          : [scale.r.ticks(5).pop()];
        return ticks.map((r) => ({
          radius: scale.r(r),
          label: r,
          translate: d3.pointRadial(scale.a(0), scale.r(r)),
        }));
      },
      axisWidth() {
        return this.width - this.margin.left - this.margin.right;
      },
      axisHeight() {
        return this.height - this.margin.top - this.margin.bottom;
      },
      innerRadius() {
        return 0;
      },
      outerRadius() {
        return Math.min(this.axisWidth, this.axisHeight) / 2 - 5;
      },
      scale() {
        // スケール (x, y) = (radius, angle)
        const rScale = d3
          .scaleLinear()
          .domain(this.rrange)
          .range([this.innerRadius, this.outerRadius]);
        const aScale = d3
          .scaleLinear()
          .domain([0, 360])
          .range([0, 2 * Math.PI]);
        return { r: rScale, a: aScale };
      },
      lines() {
        // 風向ベクトルをsvg上の角度に変換
        return [
          {
            d: this.soundings
              .filter(
                (d) =>
                  (d.pres >= this.prange[0]) &
                  (d.pres <= this.prange[1]) &
                  (d.sknt != null) &
                  (d.drct != null)
              )
              .map((d) => [d.sknt, d.drct + 180]),
          },
        ];
      },
    },
    methods: {
      /**
       * (K,hPa)のデータ配列からpathの座標を作成する
       */
      d(data) {
        const scale = this.scale;
        const line = d3
          .line()
          .x((d) => scale.r(d[0]) * Math.sin(scale.a(d[1])))
          .y((d) => -scale.r(d[0]) * Math.cos(scale.a(d[1])))
          .defined((d) => d[0] != null);
        return line(data);
      },
    },
  };
</script>

<style lang="scss" scoped>
  g.aaxis {
    line {
      fill: none;
      stroke: black;
      stroke-dasharray: 4.4;
      stroke-width: 0.5px;
    }
    text {
      font-size: 0.8em;
    }
  }
  g.raxis {
    circle {
      fill: none;
      stroke: black;
      stroke-dasharray: 4.4;
      stroke-width: 0.25px;
    }
    g:last-child circle {
      stroke-dasharray: 0;
    }
    text {
      font-size: 0.8em;
    }
  }
  .sounding {
    path {
      fill: none;
      stroke: blue;
      stroke-width: 1px;
    }
  }
</style>
