"""
観測データファイル作成プログラム.

ワイオミング大学のページから高層観測データを取得してJSON形式に加工する.
"""
import json
from pathlib import Path
import requests
from bs4 import BeautifulSoup


def convert(row, i):
    try:
        return float(row[7 * (i - 1):7 * i])
    except ValueError:
        return None


def getData(station, year, month, day, hour):
    parameters = {
        'year': year,
        'month': month,
        'day': day,
        'hour': hour,
        'station': station,
    }

    uri = 'http://weather.uwyo.edu/cgi-bin/sounding?TYPE=TEXT%3ALIST&YEAR={year:04d}&MONTH={month:02d}&FROM={day:02d}{hour:02d}&TO={day:02d}{hour:02d}&STNM={station}'
    r = requests.get(uri.format(**parameters))
    bs = BeautifulSoup(r.text, 'html.parser')
    rows = bs.find('pre').text.strip()

    data = [{
        'pres': convert(row, 1),
        'hght': convert(row, 2),
        'temp': convert(row, 3),
        'dewt': convert(row, 4),
        'relh': convert(row, 5),
        'mixr': convert(row, 6),
        'drct': convert(row, 7),
        'sknt': convert(row, 8),
        'thta': convert(row, 9),
        'thte': convert(row, 10),
        'thtw': convert(row, 11),
    } for row in rows.split('\n')[4:]]

    DATA_DIR = Path(__file__).resolve().parent / 'data'
    if not DATA_DIR.is_dir():
        DATA_DIR.mkdir()

    with open(DATA_DIR / 'obs_{year:04d}{month:02d}{day:02d}{hour:02d}_{station}.json'.format(**parameters), 'w') as f:
        json.dump({
            'station': parameters['station'],
            'year': parameters['year'],
            'month': parameters['month'],
            'day': parameters['day'],
            'hour': parameters['hour'],
            'data': data
        }, f)


if __name__ == '__main__':
    year, month, day, hour = 2020, 8, 27, 12
    for station in [47971, 47918, 47827, 47778, 47741, 47646]:
        try:
            getData(station, year, month, day, hour)
        except AttributeError:
            print("データの取得に失敗しました．{}".format(station))
