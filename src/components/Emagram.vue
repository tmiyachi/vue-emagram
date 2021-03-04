<template>
  <svg :width="width" :height="height">
    <!-- title -->
    <text :x="width / 2" :y="margin.top" text-anchor="middle" dy="-0.5em">
      {{ title }}
    </text>
    <!-- emagram canvas -->
    <g :transform="`translate(${margin.left},${margin.top})`">
      <!-- grid -->
      <g v-if="isgrid" class="grid">
        <line
          v-for="y in scale.y.ticks()"
          :key="y.id"
          :x2="axisWidth"
          :transform="`translate(0,${scale.y(y)})`"
        />
        <line
          v-for="x in scale.x.ticks()"
          :key="x.id"
          :y2="axisHeight"
          :transform="`translate(${scale.x(x)},0)`"
        />
      </g>
      <!-- baseline -->
      <g v-if="xaxis == 'temp'" class="baseline">
        <g v-for="(bline, name) in baseline" :key="bline.id">
          <path
            v-for="line in bline"
            :key="line.id"
            :class="name"
            :d="d(line)"
            clip-path="url(#clipmask)"
          ></path>
        </g>
      </g>
      <!-- soundings data-->
      <g class="sounding">
        <path
          v-for="line in lines"
          :key="line.id"
          :stroke="line.stroke"
          :d="d(line.d)"
          clip-path="url(#clipmask)"
        ></path>
        <!-- wind -->
        <g v-if="isbarb">
          <use
            v-for="barb in barbs"
            :key="barb.id"
            class="barb"
            :xlink:href="barb.template"
            :transform="`translate(${axisWidth},${barb.y}) rotate(${barb.angle})`"
          ></use>
        </g>
      </g>
      <!-- axis -->
      <g class="axis">
        <g v-axis:x="scale" :transform="`translate(0,${axisHeight})`"></g>
        <text
          class="gridlabel"
          :x="width / 2 - margin.left"
          :y="height - margin.bottom"
          alignment-baseline="middle"
        >
          {{ xaxis == 'temp' ? 'degC' : 'K' }}
        </text>
        <g v-axis:y="scale"></g>
        <text
          class="gridlabel"
          :x="0"
          :y="0"
          alignment-baseline="middle"
          dy="1em"
          :transform="`translate(${-margin.left},${
            axisHeight / 2 + margin.top
          }) rotate(-90)`"
        >
          気圧 [hPa]
        </text>
      </g>
      <!-- tooltip -->
      <g v-if="tooltip.display" class="tooltip">
        <line
          :x2="axisWidth"
          :transform="`translate(0,${tooltip.pres.y})`"
        ></line>
        <text
          dx="0"
          dy="1em"
          text-anchor="start"
          :transform="`translate(10,${tooltip.pres.y})`"
        >
          {{ tooltip.pres.text }}
        </text>
        <g v-for="data in tooltip.data" :key="data.id">
          <text
            :dx="data.dx"
            :dy="data.dy"
            :text-anchor="data.textanchor"
            :transform="`translate(${data.x},${data.y})`"
          >
            {{ data.text }}
          </text>
          <circle
            v-if="data.text"
            r="3"
            :stroke="data.stroke"
            :transform="`translate(${data.x},${data.y})`"
          ></circle>
        </g>
      </g>
      <!-- legend -->
      <g :v-show="islegend" class="legend">
        <g v-for="l in legend" :key="l.id" :transform="`translate(${l.x},0)`">
          <line
            x2="10"
            :y1="height - margin.bottom"
            :y2="height - margin.bottom"
            :stroke="l.color"
          ></line>
          <text x="13" :y="height - margin.bottom" alignment-baseline="middle">
            {{ l.text }}
          </text>
        </g>
      </g>
      <!-- overlay to capture mouse events -->
      <rect
        class="overlay"
        :v-if="istooltip"
        :width="axisWidth"
        :height="axisHeight"
        pointer-events="all"
        @mousemove="mouseMoveAction"
        @mouseon="mouseOnAction"
        @mouseout="mouseOutAction"
      ></rect>
    </g>
    <!-- clippath for line -->
    <clipPath id="clipmask">
      <rect x="0" y="0" :width="axisWidth" :height="axisHeight"></rect>
    </clipPath>
  </svg>
</template>

<script>
  import * as d3 from 'd3';

  import baseline from '@/components/baseline.json';

  export default {
    directives: {
      axis: {
        update(el, binding) {
          const axis = binding.arg;
          const methodArg = binding.value[axis];
          if (axis == 'x') {
            d3.select(el).call(d3.axisBottom(methodArg));
          } else if (axis == 'y') {
            d3.select(el).call(
              d3.axisLeft(methodArg).tickFormat(d3.format('d'))
            );
          }
        },
      },
    },
    props: {
      width: { type: Number, default: 560 },
      height: { type: Number, default: 600 },
      prange: { type: Array, default: () => [100, 1050] },
      trange: { type: Array, default: () => [-80, 40] },
      // 描画データ
      soundings: {
        type: Array,
        default: () => [],
      },
      title: { type: String, default: '' },
      // 'temp':エマグラム 'theta':温位エマグラム
      xaxis: { type: String, default: 'temp' },

      isgrid: { type: Boolean, default: false },
      isbarb: { type: Boolean, default: true },
      istooltip: { type: Boolean, default: true },
      islegend: { type: Boolean, default: true },
    },
    data() {
      return {
        /* 余白 */
        margin: { top: 30, right: 30, bottom: 40, left: 50 },
        /* 熱力学曲線データ格納用 */
        baseline: baseline,
        /* tooltip表示データ */
        mouseOnData: null,
      };
    },
    computed: {
      axisWidth() {
        return this.width - this.margin.left - this.margin.right;
      },
      axisHeight() {
        return this.height - this.margin.top - this.margin.bottom;
      },
      scale() {
        const xScale = d3
          .scaleLinear()
          .domain(this.trange)
          .range([0, this.axisWidth]);
        const yScale = d3
          .scaleLog()
          .domain(this.prange)
          .range([0, this.axisHeight]);
        return { x: xScale, y: yScale };
      },
      lines() {
        if (this.xaxis == 'temp') {
          return [
            {
              stroke: 'red',
              d: this.soundings
                .filter((d) => d.temp != null)
                .map((d) => [d.temp, d.pres]),
            },
            {
              stroke: 'blue',
              d: this.soundings
                .filter((d) => d.dewt != null)
                .map((d) => [d.dewt, d.pres]),
            },
            {
              stroke: 'green',
              d: this.soundings
                .filter((d) => d.wett != null)
                .map((d) => [d.wett, d.pres]),
            },
          ];
        } else {
          return [
            {
              stroke: 'black',
              d: this.soundings
                .filter((d) => d.thta != null)
                .map((d) => [d.thta, d.pres]),
            },
            {
              stroke: 'blue',
              d: this.soundings
                .filter((d) => d.thte != null)
                .map((d) => [d.thte, d.pres]),
            },
            {
              stroke: 'red',
              d: this.soundings
                .filter((d) => d.thtes != null)
                .map((d) => [d.thtes, d.pres]),
            },
          ];
        }
      },
      barbs() {
        const yScale = this.scale.y;
        return this.soundings
          .filter(
            (d) =>
              (d.pres >= this.prange[0]) &
              (d.pres <= this.prange[1]) &
              (d.sknt != null) &
              (d.drct != null)
          )
          .map((d) => ({
            y: yScale(d.pres),
            template: `#barb${Math.round(d.sknt / 5) * 5}`,
            angle: d.drct + 180,
          }));
      },
      tooltip() {
        const scale = this.scale;
        if (this.mouseOnData) {
          if (this.xaxis == 'temp') {
            return {
              display: true,
              pres: {
                x: 0,
                y: scale.y(this.mouseOnData.pres),
                text:
                  this.mouseOnData.hght == null
                    ? `${this.mouseOnData.pres}hPa`
                    : `${this.mouseOnData.pres}hPa ${this.mouseOnData.hght}m`,
              },
              data: [
                {
                  stroke: 'red',
                  dx: '0.5em',
                  dy: '-0.2em',
                  textanchor: 'start',
                  x: scale.x(this.mouseOnData.temp),
                  y: scale.y(this.mouseOnData.pres),
                  text:
                    this.mouseOnData.temp == null
                      ? null
                      : `${d3.format('.1f')(this.mouseOnData.temp)}℃`,
                },
                {
                  stroke: 'blue',
                  dx: '-0.5em',
                  dy: '-0.2em',
                  textanchor: 'end',
                  x: scale.x(this.mouseOnData.dewt),
                  y: scale.y(this.mouseOnData.pres),
                  text:
                    this.mouseOnData.dewt == null
                      ? null
                      : `${d3.format('.1f')(this.mouseOnData.dewt)}℃`,
                },
              ].filter((d) => d.x != null),
            };
          } else {
            return {
              display: true,
              pres: {
                x: 0,
                y: scale.y(this.mouseOnData.pres),
                text:
                  this.mouseOnData.hght == null
                    ? `${this.mouseOnData.pres}hPa`
                    : `${this.mouseOnData.pres}hPa ${this.mouseOnData.hght}m`,
              },
              data: [
                {
                  stroke: 'black',
                  dx: '-0.5em',
                  dy: '-0.2em',
                  textanchor: 'end',
                  x: scale.x(this.mouseOnData.thta),
                  y: scale.y(this.mouseOnData.pres),
                  text:
                    this.mouseOnData.thta == null
                      ? null
                      : `${d3.format('.1f')(this.mouseOnData.thta)}K`,
                },
                {
                  stroke: 'blue',
                  dx: '0.5em',
                  dy: '1em',
                  textanchor: 'start',
                  x: scale.x(this.mouseOnData.thte),
                  y: scale.y(this.mouseOnData.pres),
                  text:
                    this.mouseOnData.thte == null
                      ? null
                      : `${d3.format('.1f')(this.mouseOnData.thte)}K`,
                },
                {
                  stroke: 'red',
                  dx: '0.5em',
                  dy: '-0.2em',
                  textanchor: 'start',
                  x: scale.x(this.mouseOnData.thtes),
                  y: scale.y(this.mouseOnData.pres),
                  text:
                    this.mouseOnData.thtes == null
                      ? null
                      : `${d3.format('.1f')(this.mouseOnData.thtes)}K`,
                },
              ].filter((d) => d.x != null),
            };
          }
        } else {
          return {
            display: false,
            pres: null,
            temp: null,
            dewt: null,
          };
        }
      },
      legend() {
        if (this.xaxis == 'temp') {
          return [
            { x: 0, text: 'T', color: 'red' },
            { x: 25, text: 'Td', color: 'blue' },
            { x: 55, text: 'Tw', color: 'green' },
          ];
        } else if (this.xaxis == 'theta') {
          return [
            { x: 0, text: 'θ', color: 'black' },
            { x: 25, text: 'θe', color: 'blue' },
            { x: 55, text: 'θes', color: 'red' },
          ];
        } else {
          return [];
        }
      },
    },
    mounted() {
      // 矢羽根のテンプレートを作成する
      this.makeBarbTemplates(this.$el);
    },
    methods: {
      /**
       * (K,hPa)のデータ配列からpathの座標を作成する
       */
      d(data) {
        const scale = this.scale;
        const line = d3
          .line()
          .x((d) => scale.x(d[0]))
          .y((d) => scale.y(d[1]))
          .defined((d) => d[0] != null);
        return line(data);
      },
      /**
       * カーソル位置に最も近いp座標のデータを求める
       */
      mouseMoveAction(event) {
        if (this.soundings.length > 0) {
          const pres = this.scale.y.invert(event.offsetY - this.margin.top);
          const bisect = d3.bisector((d, x) => x - d.pres);
          const i = bisect.left(
            this.soundings,
            pres,
            1,
            this.soundings.length - 1
          );
          const d0 = this.soundings[i];
          const d1 = this.soundings[i - 1];
          const d = pres - d0.pres > d1.pres - pres ? d1 : d0;
          this.mouseOnData = d;
        }
      },
      mouseOutAction() {
        this.mouseOnData = null;
      },
      mouseOnAction() {},
      /**
       * 矢羽根用のsvgテンプレートを作成する
       */
      makeBarbTemplates(el) {
        // TODO: templateの中にロジックで書くかコンポーネントとして切り出したい
        // refs: https://github.com/dfelix/skewt-js
        const svg = d3.select(el);
        const barbsize = 25; // 矢羽根のサイズ px
        const windSpeeds = d3.range(5, 105, 5); // テンプレートとして定義する矢羽根の風速リスト
        const barbdef = svg.append('g').append('defs');

        // 風速0-5ktは丸印
        barbdef
          .append('g')
          .attr('id', 'barb0')
          .append('circle')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', 1.5);

        windSpeeds.forEach((d) => {
          const thisbarb = barbdef.append('g').attr('id', 'barb' + d);
          const flags = Math.floor(d / 50);
          const pennants = Math.floor((d - flags * 50) / 10);
          const halfpennants = Math.floor((d - flags * 50 - pennants * 10) / 5);
          let px = barbsize;

          // 矢羽根の棒を描く
          thisbarb
            .append('line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', barbsize);
          // 旗を描く
          for (let i = 0; i < flags; i++) {
            thisbarb
              .append('polyline')
              .attr('points', '0,' + px + ' -10,' + px + ' 0,' + (px - 4))
              .attr('class', 'flag');
            px -= 7;
          }
          // 長羽根を描く
          for (let i = 0; i < pennants; i++) {
            thisbarb
              .append('line')
              .attr('x1', 0)
              .attr('x2', -10)
              .attr('y1', px)
              .attr('y2', px + 4);
            px -= 3;
          }
          // 短羽根を描く
          for (let i = 0; i < halfpennants; i++) {
            thisbarb
              .append('line')
              .attr('x1', 0)
              .attr('x2', -5)
              .attr('y1', px)
              .attr('y2', px + 2);
            px -= 3;
          }
        });
      },
    },
  };
</script>

<style lang="scss" scoped>
  .grid line {
    stroke: lightgrey;
    stroke-opacity: 0.7;
    shape-rendering: crispEdges;
  }
  .baseline {
    fill: none;
    stroke-opacity: 0.8;
    stroke-width: 0.5px;
    .dryline {
      fill: none;
      stroke: Green;
    }
    .moistline {
      stroke: Orange;
    }
    .mixingratioline {
      stroke: cyan;
    }
  }
  .sounding {
    fill: none;
    stroke-width: 1px;
  }
  .barb {
    fill: none;
    stroke: black;
    stroke-width: 1px;
  }
  text.title {
    font-size: 1.5em;
    font-weight: normal;
    fill: black;
    stroke: black;
  }
  text.gridlabel {
    font-size: 0.8em;
    text-anchor: middle;
    fill: black;
  }
  rect.overlay {
    fill: none;
  }
  .tooltip {
    circle {
      fill: none;
    }
    line {
      stroke: #263238;
    }
    text {
      font-size: 0.8em;
    }
  }
  .legend {
    line {
      fill: none;
      stroke-width: 2px;
      shape-rendering: crispEdges;
    }
    text {
      font-size: 12px;
    }
  }
</style>
