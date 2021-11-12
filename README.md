# vue-emagram

Vue.js と d3.js でエマグラムとホドグラフを描く

### demo

<https://tmiyachi.github.io/vue-emagram/>

### build & test

```
npm install
npm run build
```

Getting sounding data from [University of Wyoming](http://weather.uwyo.edu/upperair/sounding.html) and create JSON formatted file.

```
cd work
pipenv install
python getDataFromUWYO.py
```

copy these files to dist/data directory and launch local web server.

```
cp work/obs_yyyymmddhh_xxxxx.json dist/data
npm run start
```
