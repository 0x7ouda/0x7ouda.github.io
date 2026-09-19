---
title: 'AoTR 4: A Drone in the Snow'
date: 2026-01-10 00:00:00
category: HackTheBox
tags: [HackTheBox, Drone_Forensics]
cover: /images/write-up/AOTR-4-A-Drone-in-the-Snow/0.jpg
description: "A recovered disk blew the case open. The files inside weren't theory, they were a checklist. Hours later, an unmarked matte-black drone was found half-buried in snow in Budapest,"
toc: true
---

## Scenario

Advent of The Relics 4 - A Drone in the Snow
Read the campaign introduction and supporting information [here](https://github.com/hackthebox/advent-of-the-relics)

A recovered disk blew the case open. The files inside weren't theory, they were a checklist. Hours later, an unmarked matte-black drone was found half-buried in snow in Budapest, matching the recovered plans too closely to ignore. The drone is now in your lab and you've been given its mission plan and flight telemetry. Reconstruct the route, pinpoint key behavior, and prove what happened before impact, you're running out of time before the real heist begins.

The scenario portrayed in this challenge is entirely fictional and created solely for educational and entertainment purposes. Any resemblance to actual persons, living or dead, organizations, or real events is purely coincidental and unintentional. All characters, scenarios, and data presented are products of imagination.

## Tools

- [qGroundControl](https://github.com/mavlink/qgroundcontrol/releases)
- [mavlogdump.py](https://github.com/ArduPilot/pymavlink/blob/master/tools/mavlogdump.py)

## lab files:

- AOTR_Winter_Blackout.plan
  This file contains the drone’s settings and flight path, and which command are executed during the flight
- log.bin
  This file contains the events that actually occurred during the drone’s flight.

## Task 1

#### How many total mission items are defined in the flight plan, including Home, Takeoff, and Land commands?

open file `.plan` in `qGroundControl`

![Image](/images/write-up/AOTR-4-A-Drone-in-the-Snow/1.png)
![Image](/images/write-up/AOTR-4-A-Drone-in-the-Snow/2.png)
![Image](/images/write-up/AOTR-4-A-Drone-in-the-Snow/3.png)

### ✅ Answer: 49

## Task 2

#### How many spline waypoints are in the mission?

### ✅ Answer: 46

## Task 3

#### Which landmark/building does the drone fly around during the planned route?

![Image](/images/write-up/AOTR-4-A-Drone-in-the-Snow/4.png)

### ✅ Answer: Citadella

## Task 4

#### At which mission item did the drone have a planned hold/loiter?

![Image](/images/write-up/AOTR-4-A-Drone-in-the-Snow/5.png)

### ✅ Answer: 18

## Task 5

#### How long was the planned hold time at that mission item (seconds)?

### ✅ Answer: 30

## Task 6

#### Which bridge is the drone planned to pass by while crossing the Danube in order to reach the other part of the city? (English name)

![Image](/images/write-up/AOTR-4-A-Drone-in-the-Snow/6.png)

### ✅ Answer: Elisabeth Bridge

## Task 7

#### What is the total flight time from takeoff to crash?

Now we will move on to the second file to review the flight events.

```bash
$ python3 mavlogdump.py log.bin --show-types
VER
XKQ
FMTU
BARO
XKF2
MODE
XKF4
RCIN
FILE
XKF3
PSCN
PSCE
VIBE
MAVC
RFND
XKTV
XKF5
MAG
RCO2
PSCD
ERR
SIM
SRTL
EV
CTUN
PM
XKV1
TERR
XKY1
XKV2
BAT
RATE
IMU
ARM
SIM2
XKY0
ESC
CTRL
PARM
CMD
ATT
MAV
XKF1
UNIT
ORGN
MSG
AHR2
DSF
GPA
RCI2
MOTB
POS
FMT
XKT
PL
MULT
RCOU
XKFS
GPS
DU32

```

```bash
$ python3 mavlogdump.py --type MSG log.bin

2026-01-05 22:16:07.13: MSG {TimeUS : 23319002, Message : Frame: QUAD/X}
2026-01-05 22:16:07.13: MSG {TimeUS : 23319002, Message : GPS 1: detected as u-blox at 230400 baud}
2026-01-05 22:16:13.25: MSG {TimeUS : 29434055, Message : Mode change to GUIDED failed: requires position}
2026-01-05 22:16:24.17: MSG {TimeUS : 40358850, Message : Mode change to GUIDED failed: requires position}
2026-01-05 22:16:25.22: MSG {TimeUS : 41408430, Message : EKF3 IMU1 is using GPS}
2026-01-05 22:16:25.23: MSG {TimeUS : 41418426, Message : EKF3 IMU0 is using GPS}
2026-01-05 22:16:32.70: MSG {TimeUS : 48893768, Message : Mission: 1 Takeoff}
2026-01-05 22:16:35.22: MSG {TimeUS : 51408595, Message : EKF3 IMU0 MAG0 in-flight yaw alignment complete}
2026-01-05 22:16:35.22: MSG {TimeUS : 51411094, Message : EKF3 IMU1 MAG0 in-flight yaw alignment complete}
2026-01-05 22:26:59.84: MSG {TimeUS : 676026148, Message : Disarming motors}
2026-01-05 22:26:59.84: MSG {TimeUS : 676028647, Message : Mission: 1 Takeoff}
2026-01-05 22:27:11.62: MSG {TimeUS : 687813098, Message : SIM Hit ground at 12.93254 m/s}
2026-01-05 22:28:44.40: MSG {TimeUS : 780593471, Message : ArduCopter V4.4.4 (865cffa5)}
2026-01-05 22:28:44.43: MSG {TimeUS : 780614296, Message : 9f407028b696}
2026-01-05 22:28:44.43: MSG {TimeUS : 780614296, Message : Frame: QUAD/X}

```

start time: 48893768
hit time: 687813098

flight time = hit time - start time / 1000000

### ✅ Answer: 00:10:38.919

## Task 8

#### What is the exact log timestamp of the crash event (TimeUS)?

### ✅ Answer: 687813098

## Task 9

#### What are the coordinates where the drone crashed (lat, lon)?

```bash
$ python3 mavlogdump.py  log.bin | grep -B30 687813098 | grep Lat
2026-01-05 22:27:11.59: GPS {TimeUS : 687783943, I : 0, Status : 6, GMS : 160049600, GWk : 2400, NSats : 10, HDop : 1.21, Lat : 47.4903055, Lng : 19.0460476, Alt : 121.76, Spd : 3.207000255584717, GCrs : 294.954833984375, VZ : 12.932000160217285, Yaw : 0.0, U : 1}

```

### ✅ Answer: 47.4903055, 19.0460476

## Task 10

#### What was the ground impact speed reported at the moment of crash (m/s)?

```bash
2026-01-05 22:27:11.62: MSG {TimeUS : 687813098, Message : SIM Hit ground at 12.93254 m/s}

```

### ✅ Answer: 12.93254

## Task 11

#### What was the maximum GPS altitude reached during the flight (meters)?

```bash
$ python3 mavlogdump.py --type GPS log.bin | cut -d',' -f10| sort |tail -1
 Alt : 377.07

```

### ✅ Answer: 377.07

## Task 12

#### What was the fastest GPS ground speed recorded (m/s)?

```bash
$ python3 mavlogdump.py --type GPS log.bin | cut -d':' -f15| sort -n |tail -1
 10.24000072479248, GCrs


```

### ✅ Answer: 10.24

## Task 13

#### What are the coordinates where the drone took off from (lat, lon), and therefore a good location for the police raid to catch the gang member?

```bash

 $ python3 mavlogdump.py --type GPS log.bin | sed -nE 's/.*Lat : ([0-9.-]+), Lng : ([0-9.-]+).*/\1, \2/p' | head -1
47.4819399, 19.01916

```

### ✅ Answer: 47.4819399, 19.0191600

## Thanks For Reading
