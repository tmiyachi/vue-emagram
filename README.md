# vue-emagram

Vue.js と d3.js でエマグラムとホドグラフを描く

### demo

### build & test

```
npm install
npm run build
```

Getting Sounding Data from [University of Wyoming](http://weather.uwyo.edu/upperair/sounding.html) and create JSON formatted sounding data file.

```
cd work
pipenv install
python getDataFromUWYO.py
```

copy sounding data file to dist/data directory and launch local web server.

```
cp work/obs_yyyymmddhh_xxxxx.json dist/
cd dist
http-server -p 8080
```
