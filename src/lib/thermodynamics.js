/* Meteorological Constants */
const water_es_0c = 611.2; // Pa
const air_Rd = 287.05; // J/(K kg)
const air_Cp_d = 1004.0; //  J/(K kg)
const water_Lv_0c = 2.5e6; // J/kg
const epsilon = 0.622; // water_Mv / air_Md;
const kappa = 0.286; //air_Rd / air_Cp_d;

/**
 * 水に対する飽和水蒸気圧を計算する．
 * 計算式にはBolton(1980)の式を用いる．
 * @param {number} t [K]
 * @return {number} [Pa]
 */
const saturationVaporPressure = (t) => water_es_0c * Math.exp((17.67 * (t - 273.15)) / (t - 29.65));

/**
 * 混合比を計算する．
 * @param {number} p 気圧 [Pa]
 * @param {number} e 水蒸気圧 [Pa]
 * @return {number} [kg/kg]
 */
const mixingRatio = (p, e) => (epsilon * e) / (p - e);

/**
 * 水蒸気圧から露点温度を計算する．
 * @param {number} p 気圧 [Pa]
 * @param {number} e 水蒸気圧 [Pa]
 * @return {number} 露点温度 [K]
 */
const dewpoint_from_e = (p, e) => {
  const val = Math.log(e / water_es_0c);
  return (243.5 * val) / (17.67 - val) + 273.15;
};

/**
 * 相当温位を計算する
 * ref:https://www.data.jma.go.jp/add/suishin/jyouhou/pdf/371.pdf
 * @param {number} p [Pa] 気圧
 * @param {number} t [K] 気温
 * @param {number} td [K] 露点温度
 */
const equivalentPotentialTemperature = (p, t, td, p0 = 1e5) => {
  const t_lcl = 1 / (1 / (td - 56) + Math.log(t / td) / 800) + 56; // K
  const e = saturationVaporPressure(td);
  const w = mixingRatio(p, e);
  return (
    t *
    (p0 / (p - e)) ** kappa *
    (t / t_lcl) ** (0.28 * w) *
    Math.exp((3036 / t_lcl - 1.78) * w * (1 + 0.448 * w))
  );
};

/**
 * 飽和相当温位を計算する
 * @param {number} p 気圧 [Pa]
 * @param {number} t 気温 [K]
 */
const saturationEquivalentPontentialTemperature = (p, t, p0 = 1e5) => {
  const es = saturationVaporPressure(t);
  const w = mixingRatio(p, es);
  return t * (p0 / (p - es)) ** kappa * Math.exp((3036 / t - 1.78) * w * (1 + 0.448 * w));
};

/**
 * 相当温位を計算する
 * @param {number} p [hPa]
 * @param {number} t [degC]
 * @param {number} td [degC]
 */
export const calcThetaE = (p, t, td) => {
  return equivalentPotentialTemperature(p * 100, t + 273.15, td + 273.15);
};

/**
 * 飽和相当温位を計算する
 * @param {number} p [hPa]
 * @param {number} t [degC]
 */
export const calcThetaEs = (p, t) => {
  return saturationEquivalentPontentialTemperature(p * 100, t + 273.15);
};

/**
 * (p,t)における湿潤断熱減率dt/dpを計算する．
 * 飽和混合比の計算では氷に対する飽和は考慮しない．
 * @param {number} p 気圧[Pa]
 * @param {number} t 気温[K]
 * @return dt/dp [K]
 */
const moistLapse = (p, t) => {
  let p_pa = p * 100;
  let t_k = t + 273.15;
  const rs = mixingRatio(p_pa, saturationVaporPressure(t_k));
  return (
    (((1 / p_pa) * (air_Rd * t_k + water_Lv_0c * rs)) /
      (air_Cp_d + (water_Lv_0c ** 2 * rs * epsilon) / air_Rd / t_k ** 2)) *
    100
  );
};

/**
 * 等飽和混合比線を計算する．
 * @param {array of number} p 気圧 [hPa]
 * @param {number} w0 混合比 [kg/kg]
 * @return {array} [[p0,t0],...] の配列 [hPa, degC]
 */
export const SaturationMixingRatioLine = (p, w0) => {
  // 混合比から水蒸気圧を求めて露点温度を求める
  return p.map((pin) => [pin, dewpoint_from_e(pin * 100, (pin * 100 * w0) / (epsilon + w0))]);
};

/**
 * 乾燥断熱線を計算する．
 * @param {array of number} p 気圧 [hPa]
 * @param {number} t0 p[0]での気温 [degC]
 * @return {array} [[p0,t0],...] の配列 [hPa, degC]
 */
export const dryAdiabaticLine = (p, t0) => {
  const p0 = p[0];
  return p.map(p, (pin) => [pin, (pin / p0) ** kappa * (t0 - 273.15)]);
};

/**
 * 湿潤断熱過程を計算する．
 * 配列pの間隔が大きいと特に上層で誤差が大きくなることに留意．
 * @param {array of number} p [hPa]
 * @param {number} t0 気温 [degC]
 * @return {array} [[p0,t0],...] の配列 [hPa, degC]
 */
export const moistAdiabaticLine = (p, t0) => {
  let results = [[p[0], t0]];
  let t = t0;
  // TODO: 上層に行くほどdt/dpが大きくなるため誤差が大きくなるため単純な積分では差が大きくなる．
  for (let i = 0; i < p.length - 1; i++) {
    if (Math.log(p[i + 1]) - Math.log(p[i]) < Math.log(790) - Math.log(800)) {
      //      const n = 15;
      const n =
        Math.floor((Math.log(p[i + 1]) - Math.log(p[i])) / (Math.log(790) - Math.log(800))) + 1;
      const p_sub = linspace(p[i], p[i + 1], n);
      for (let j = 0; j < p_sub.length - 1; j++) {
        t = t + moistLapse(p_sub[j], t) * (p_sub[j + 1] - p_sub[j]);
      }
    } else {
      t = t + moistLapse(p[i], t) * (p[i + 1] - p[i]);
    }
    results.push([p[i + 1], t]);
  }
  return results;
};

/**
 * 等差配列を作成する．aとbの間をn等分する．
 * @param {number} a
 * @param {number} b
 * @param {integer} n
 * @return {array}
 */
const linspace = (a, b, n) => {
  if (typeof n === 'undefined') n = Math.max(Math.round(b - a) + 1, 1);
  if (n < 2) {
    return n === 1 ? [a] : [];
  }
  let ret = Array(n);
  n--;
  for (let i = n; i >= 0; i--) {
    ret[i] = (i * b + (n - i) * a) / n;
  }
  return ret;
};
