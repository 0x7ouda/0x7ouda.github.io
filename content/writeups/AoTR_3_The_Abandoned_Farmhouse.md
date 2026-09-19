---
title: 'AoTR 3 The Abandoned Farmhouse'
date: 2026-01-03 00:00:00
category: HackTheBox
tags: [HackTheBox, encrypted_disk]
cover: /images/write-up/AoTR_3_The_Abandoned_Farmhouse/0.png
toc: true
description: ' The coordinates led police and investigator into winter, to a place far enough from everything that no one would notice if something went wrong.'
---

## Sherlock Scenario

Read the campaign introduction and supporting information at [Github](https://github.com/hackthebox/advent-of-the-relics)

The coordinates led police and investigator into winter, to a place far enough from everything that no one would notice if something went wrong. At the end of a frozen road stood a farmhouse that looked dead long before they arrived, dark, silent, and empty in the way abandoned places usually are. Whatever had been done there was already over, but it had not been finished cleanly, and the only thing left behind was a single disk pulled from the wreckage. Now it is all that remains of whatever was meant to happen next.

The scenario portrayed in this challenge is entirely fictional and created solely for educational and entertainment purposes. Any resemblance to actual persons, living or dead, organizations, or real events is purely coincidental and unintentional. All characters, scenarios, and data presented are products of imagination.

## Task 1

##### What is the case number of the evidence file?

![Image](/images/write-up/AoTR_3_The_Abandoned_Farmhouse/1.png)

## Task 2

##### Which version of LUKS disk encryption is used?

![Image](/images/write-up/AoTR_3_The_Abandoned_Farmhouse/2.png)

##### Export this partition and rename it as encrypted_partition

```bash
cryptsetup luksDump encrypted_partition

```

```bash
LUKS header information
Version:       	2
Epoch:         	3
Metadata area: 	16384 [bytes]
Keyslots area: 	16744448 [bytes]
UUID:          	a37cca13-686b-40e5-8540-c83eee7f94b2
Label:         	(no label)
Subsystem:     	(no subsystem)
Flags:       	(no flags)

Data segments:
  0: crypt
	offset: 16777216 [bytes]
	length: (whole device)
	cipher: aes-xts-plain64
	sector: 512 [bytes]

Keyslots:
  0: luks2
	Key:        512 bits
	Priority:   normal
	Cipher:     aes-xts-plain64
	Cipher key: 512 bits
	PBKDF:      argon2id
	Time cost:  4
	Memory:     601084
	Threads:    1
	Salt:       7e b0 5b 42 c6 1b 31 40 28 a1 5a cf 0b 66 a6 e9
	            57 d3 35 8b af de 4c b3 71 74 73 b2 28 58 27 aa
	AF stripes: 4000
	AF hash:    sha256
	Area offset:32768 [bytes]
	Area length:258048 [bytes]
	Digest ID:  0
Tokens:
Digests:
  0: pbkdf2
	Hash:       sha256
	Iterations: 75589
	Salt:       75 9c 71 fb 7a e9 fd d0 48 5c 6a 73 08 95 27 5b
	            34 bd 24 92 f8 0c 76 1b d5 5b b7 65 e5 e9 01 2a
	Digest:     61 28 2c 40 03 2a 43 16 1b b2 36 53 a1 aa ae 92
	            6b 26 c8 2c e9 66 11 d4 74 1c 42 71 39 c5 c8 3b

```

## ✅ Answer: LUKS2

## Task 3

##### What is the AES master key, expressed in hexadecimal?

In the disk image provided in this challenge, you can find a swap partition. This partition is used as virtual memory by the OS when the RAM is fully utilized or when the system enters hibernation mode. I believe this partition can be useful, especially since, as we all know, the encryption process occurs in memory.

Extract the partition for analysis.

##### Now we will use `bulk_extractor` to extract data from the swap partition.

```bash
bulk_extractor swap_partition -o path/to/output

```

![Image](/images/write-up/AoTR_3_The_Abandoned_Farmhouse/3.png)

```bash
# BANNER FILE NOT PROVIDED (-b option)
# BULK_EXTRACTOR-Version: 2.1.1
# Feature-Recorder: aes_keys
# Filename: swap_partition
# Feature-File-Version: 1.1
741395876	bd 86 fd c1 b2 9a 69 4a 52 5f af 51 5a 66 08 5d 04 8e f2 d7 cb 80 e6 c6 08 aa 3c 87 be bb f4 16	AES256
874714562	0c 03 c1 f4 37 69 a1 4f 81 32 2e 5e 74 31 c1 2e 76 da a2 ba 3f 71 89 e9 eb 1c bf 9d 1a 1e 27 52	AES256
1209041602	86 bc f2 e8 6b 4e 0b ff 31 b8 71 8f 63 06 e2 26 05 7b f1 35 92 af e8 b6 f5 ab af ab 6b 2f 89 80	AES256
1209042068	7e cc 7f 33 4d a6 d8 9a c0 99 9e 34 5f bf 97 8d 0f e5 13 b1 69 22 b2 70 ad 9f 9e 32 49 41 30 cb	AES256
1209078466	86 bc f2 e8 6b 4e 0b ff 31 b8 71 8f 63 06 e2 26 05 7b f1 35 92 af e8 b6 f5 ab af ab 6b 2f 89 80	AES256
1209078932	7e cc 7f 33 4d a6 d8 9a c0 99 9e 34 5f bf 97 8d 0f e5 13 b1 69 22 b2 70 ad 9f 9e 32 49 41 30 cb	AES256
1209107138	86 bc f2 e8 6b 4e 0b ff 31 b8 71 8f 63 06 e2 26 05 7b f1 35 92 af e8 b6 f5 ab af ab 6b 2f 89 80	AES256
1209107604	7e cc 7f 33 4d a6 d8 9a c0 99 9e 34 5f bf 97 8d 0f e5 13 b1 69 22 b2 70 ad 9f 9e 32 49 41 30 cb	AES256
1747519247	00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f 10 11 12 13 14 15 16 17 18 19 1a 1b 1c 1d 1e 1f	AES256
2081334015	43 9e 34 52 27 0d 90 22 d7 44 27 50 bb b0 29 68 27 03 39 ca 27 b6 9e 6f 99 71 5c 0d 75 00 2d 95	AES256
2485105004	43 9e 34 52 27 0d 90 22 d7 44 27 50 bb b0 29 68 27 03 39 ca 27 b6 9e 6f 99 71 5c 0d 75 00 2d 95	AES256
2550885735	57 93 e5 06 dd 43 75 23 e2 ed 3c 45 7a 4e f6 74	AES128
2550993516	00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f 10 11 12 13 14 15 16 17 18 19 1a 1b 1c 1d 1e 1f	AES256
2551257209	b2 cf 88 e0 8a b5 1f cc c3 7c 29 73 aa 96 2c b0	AES128
2617907755	00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f 10 11 12 13 14 15 16 17 18 19 1a 1b 1c 1d 1e 1f	AES256
2618207167	00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f 10 11 12 13 14 15 16 17 18 19 1a 1b 1c 1d 1e 1f	AES256
3021716678	a1 23 f8 9a 8f 24 b3 06 9a b9 d7 2b 1e 25 89 86 db 3a 73 0e e5 59 08 d9 94 8b 99 6b cf e3 b0 f0	AES256
3087332960	00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f 10 11 12 13 14 15 16 17 18 19 1a 1b 1c 1d 1e 1f	AES256
3087341478	ea 38 8e 35 03 47 51 7b a4 ca 35 bd 94 3d 8f dc 92 80 26 10 33 9b 9c 81 c1 d2 5a 79 ad 67 e5 14	AES256
3156180548	00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f 10 11 12 13 14 15 16 17 18 19 1a 1b 1c 1d 1e 1f	AES256

```

##### Now we have a file that contains all the AES keys extracted from the swap partition, with different types such as AES-128 and AES-256. However, if you look at the previous task, you will find that the key length is 512. So it is likely that the key is composed of two parts from this file.

After extensive research and using AI, I found that some of the keys in the file are dummy or test keys because their pattern looks unusual. Therefore, we will exclude the keys that start with:
`00 01 02 03 04 05 06 07 08 09` AND We will also exclude the AES-128 keys And remove the duplicate keys.

##### The remaining keys we have it now

```bash

741395876	bd 86 fd c1 b2 9a 69 4a 52 5f af 51 5a 66 08 5d 04 8e f2 d7 cb 80 e6 c6 08 aa 3c 87 be bb f4 16	AES256
874714562	0c 03 c1 f4 37 69 a1 4f 81 32 2e 5e 74 31 c1 2e 76 da a2 ba 3f 71 89 e9 eb 1c bf 9d 1a 1e 27 52	AES256
1209041602	86 bc f2 e8 6b 4e 0b ff 31 b8 71 8f 63 06 e2 26 05 7b f1 35 92 af e8 b6 f5 ab af ab 6b 2f 89 80	AES256
1209042068	7e cc 7f 33 4d a6 d8 9a c0 99 9e 34 5f bf 97 8d 0f e5 13 b1 69 22 b2 70 ad 9f 9e 32 49 41 30 cb	AES256


```

##### I merged the keys together because the required length is 512, until I found the correct key.

```bash
1209041602	86bcf2e86b4e0bff31b8718f6306e226057bf13592afe8b6f5abafab6b2f8980	AES256
1209042068	7ecc7f334da6d89ac0999e345fbf978d0fe513b16922b270ad9f9e32494130cb	AES256

```

## ✅ Answer: `7ecc7f334da6d89ac0999e345fbf978d0fe513b16922b270ad9f9e32494130cb86bcf2e86b4e0bff31b8718f6306e226057bf13592afe8b6f5abafab6b2f8980`

## Task 4

##### What is the IP address of the last machine which connected to SMB share?

Now that we have found the correct key, let’s go ahead and decrypt this partition.

```bash
echo "7ecc7f334da6d89ac0999e345fbf978d0fe513b16922b270ad9f9e32494130cb86bcf2e86b4e0bff31b8718f6306e226057bf13592afe8b6f5abafab6b2f8980" | xxd -r -ps > my_key

```

```bash

sudo cryptsetup luksOpen encrypted_partition dec_partition --master-key-file key_file

```

```bash

$ sudo pvscan

  PV /dev/mapper/dec_partition   VG roadrush-vg     lvm2 [<2.67 GiB / 0    free]
  Total: 1 [<2.67 GiB] / in use: 1 [<2.67 GiB] / in no VG: 0 [0   ]

```

```bash
$ sudo vgscan
  Found volume group "roadrush-vg" using metadata type lvm2

```

```bash
$ sudo lvscan
  ACTIVE   Original '/dev/roadrush-vg/root' [<2.17 GiB] inherit
  ACTIVE   Snapshot '/dev/roadrush-vg/20251221' [512.00 MiB] inherit

```

```bash
$ sudo lvdisplay
  --- Logical volume ---
  LV Path                /dev/roadrush-vg/root
  LV Name                root
  VG Name                roadrush-vg
  LV UUID                kkLdo9-GDqZ-hqan-kis7-qwjf-sMCV-083B46
  LV Write Access        read/write
  LV Creation host, time roadrush, 2025-12-31 01:31:27 +0200
  LV snapshot status     source of
                         20251221 [active]
  LV Status              available
  # open                 0
  LV Size                <2.17 GiB
  Current LE             555
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     256
  Block device           252:2

  --- Logical volume ---
  LV Path                /dev/roadrush-vg/20251221
  LV Name                20251221
  VG Name                roadrush-vg
  LV UUID                r73Ji4-F7XC-UNoh-9qJd-hUB1-Gsry-hlOejf
  LV Write Access        read/write
  LV Creation host, time debian, 2025-12-31 04:12:09 +0200
  LV snapshot status     active destination for root
  LV Status              available
  # open                 0
  LV Size                <2.17 GiB
  Current LE             555
  COW-table size         512.00 MiB
  COW-table LE           128
  Allocated to snapshot  0.14%
  Snapshot chunk size    4.00 KiB
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     256
  Block device           252:4

```

```bash

$ sudo vgchange -ay roadrush-vg
  2 logical volume(s) in volume group "roadrush-vg" now active
```

```bash
$ sudo fsck -y /dev/roadrush-vg/root

```

```bash
sudo mkdir -p /mnt/root
sudo mkdir -p /mnt/snapshot
```

```bash
sudo mount /dev/roadrush-vg/root /mnt/root
sudo mount /dev/roadrush-vg/20251221 /mnt/snapshot

```

```bash
ls -lh /mnt/root/var/log/samba/
total 12K
drwx------ 4 root root 4.0K Dec 31 02:13 cores
-rw-r--r-- 1 root root    0 Dec 31 02:18 log.10.129.234.0
-rw-r--r-- 1 root root  396 Dec 31 02:14 log.nmbd
-rw-r--r-- 1 root root  168 Dec 31 02:13 log.smbd
-rw-r--r-- 1 root root    0 Dec 31 02:18 log.win-6rrfs6bh6ra

```

## ✅ Answer: 10.129.234.0

## Task 5

##### What is the name of the SMB share which was being used to share documents?

```bash

sudo strings /dev/roadrush-vg/root | grep -B 5 -A 5 "/home/driver_bud/share"
# Please note that you also need to set appropriate Unix permissions
# to the drivers directory for these users to have write rights in it
;   write list = root, @lpadmin
[GOSPODSKI]
   comment = Users profiles
   path = /home/driver_bud/share
   guest ok = yes
   browseable = yes
   create mask = 0600
   directory mask = 0700
LPKSHHRH

```

## ✅ Answer: GOSPODSK

## Task 6

##### What is the total estimated monetary value of the artifacts targeted for theft?

```bash

$ sudo ls -la /mnt/snapshot/home/driver_bud/share
total 624
drwxr-xr-x 2 houda  houda    4096 Dec 31 04:09 .
drwx------ 3 splunk splunk   4096 Dec 31 02:16 ..
-rw-r--r-- 1 houda  houda  154431 Dec 31 04:09 Emergency_Protocols_CLASSIFIED.pdf
-rw-r--r-- 1 houda  houda  156618 Dec 31 04:09 Logistics_Manual_CLASSIFIED.pdf
-rw-r--r-- 1 houda  houda  156774 Dec 31 04:09 Operation_Winter_Blackout_CLASSIFIED.pdf
-rw-r--r-- 1 houda  houda  153802 Dec 31 04:09 Technical_Specifications_CLASSIFIED.pdf


```

open file `Operation_Winter_Blackout_CLASSIFIED.pdf`

![Image](/images/write-up/AoTR_3_The_Abandoned_Farmhouse/4.png)

## ✅ Answer: 5960000

## Task 7

##### What is the exact model of the drone that was modified for the operation?

open file `Operation_Winter_Blackout_CLASSIFIED.pdf`

![Image](/images/write-up/AoTR_3_The_Abandoned_Farmhouse/5.png)

## ✅ Answer: DJI Matrice 300

## Task 8 && 9

##### 8 What codeword is designated to initiate the attack?

##### 9 At what exact time is the attack scheduled to be executed?

open file `Emergency_Protocols_CLASSIFIED.pdf`

![Image](/images/write-up/AoTR_3_The_Abandoned_Farmhouse/6.png)

## ✅ Answer 8 : FORST

## ✅ Answer 9 : 23:59:50

## Task 10

##### In which city will the crew be positioned during the execution of the attack?

open file `Operation_Winter_Blackout_CLASSIFIED.pdf`

![Image](/images/write-up/AoTR_3_The_Abandoned_Farmhouse/7.png)

## ✅ Answer: Budapest

![Image](/images/write-up/AoTR_3_The_Abandoned_Farmhouse/8.png)

# Thanks For Reading
