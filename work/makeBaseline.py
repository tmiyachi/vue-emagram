"""
エマグラムの乾燥断熱線, 湿潤断熱線,等飽和混合比線のデータ作成.
"""
import json

import numpy as np
from metpy.calc import dry_lapse, moist_lapse, dewpoint, vapor_pressure
from metpy.units import units

basep = 1000.
bottomp = 1050.
topp = 50.

pressure = np.arange(1050, 90, -5) * units.hPa
theta = np.arange(230, 440, 10) * units.K
mixingratio = np.asarray([0.0004, 0.001, 0.002, 0.004, 0.007, 0.01,
                          0.016, 0.024, 0.032])

# dry adiabatic line
dryline = []
for tt in theta:
    result = dry_lapse(pressure, tt, ref_pressure=basep * units.hPa).to('degC')
    dryline.append([[round(t.magnitude, 2), int(p.magnitude)] for p, t in zip(pressure, result)])

# moist adiabatic line
moistline = []
for tt in theta:
    result = moist_lapse(pressure, tt, ref_pressure=basep * units.hPa).to('degC')
    moistline.append([[round(t.magnitude, 2), int(p.magnitude)] for p, t in zip(pressure, result)])

# constant mixing ratio line
mixingratioline = []
pres = pressure[pressure >= 600 * units.hPa]
for w in mixingratio:
    td = dewpoint(vapor_pressure(pres, w)).to('degC')
    mixingratioline.append([[round(t.magnitude, 2), int(p.magnitude)] for p, t in zip(pres, td)])


with open('baseline.json', 'w') as f:
    json.dump({
        'dryline': dryline,
        'moistline': moistline,
        'mixingratioline': mixingratioline
    }, f)
