---
title: 'The Art of Memory Forensics Chapter-11'
date: 2026-10-20 00:00:00
category: 'The Art of Memory Forensics'
tags: [The art of memory forensics]
cover: /images/notes/chapter-8-the-art-of-memory/cover_11.webp
description: 'Explores Windows network forensics using Volatility, covering TCP/IP structures, network connections, hidden activity, DNS cache, browser history and packet recovery'
toc: true
---

## Networking

Many malware families use network communication for various purposes, such as Command and Control (C2), lateral movement, and other malicious activities. These activities can leave valuable forensic artifacts in memory, including IP addresses, port numbers, connection states, and associated processes. In some cases, packet-related data may also be recovered, helping investigators reconstruct suspicious network activity.

### Netwrok Analysis Objectives

- **Identify Rogue Listeners:** Detect suspicious listening sockets that may allow unauthorized incoming connections.
- **Reveal Suspicious Remote Connections:** Identify malware C2 communications, Tor usage, IRC/XMPP traffic, and connections to malicious IP addresses.
- **Detect Promiscuous Network Interfaces:** Identify interfaces potentially used for packet sniffing or Man-in-the-Middle (MITM) attacks.
- **Detect Hidden Ports:** Uncover network activity hide by rootkits through API hooking by comparing live system results with memory artifacts.
- **Reconstruct Browser History:** Recover visited URLs, timestamps, HTTP headers, and response sizes from memory, even when browser history is deleted from disk.

### Attributing Network Connections to Code

**Objective:** If you identify a suspicious network connection, you need to trace it back to the responsible code and analyze its behavior to determine whether the activity is malicious.

There are two possible scenarios:

1. **Malicious Process:** If the process itself is malicious, dump its executable using `procdump`, examine the Import Address Table (IAT), and follow cross-references to networking APIs such as `socket`, `connect`, and `send`.
2. **Legitimate Process:** If the process appears legitimate, it may have been compromised through code injection. Use `malfind` to identify suspicious memory regions and analyze the injected code.

### Investigation Steps

**1. Search for Network Indicators**

- Use `yarascan` to search the process memory for suspicious URLs, IP addresses, or domain names.
- If no URL is known, use an IP address identified during network enumeration.
- If the IP exists as a readable string (ASCII or UTF-16), search for it directly.
- If the IP is stored as a 32-bit integer rather than a readable string, convert it using Python:

```python
import socket
import struct

ip = struct.unpack(">I", socket.inet_aton("12.34.56.78"))[0]

print(ip)
```

- When searching for the binary representation, ensure the bytes are arranged according to how the IP is stored in memory.

**2. Identify the Memory Region**

```bash
$ python vol.py -f memory.raw yarascan --profile=WinXPSP3x86
 -p 3060 -W -Y "XX.XXX.5.140"
Volatility Foundation Volatility Framework 2.4
Rule: r1
Owner: Process ab.exe Pid 3060
0x5500e9ae XX 00 XX 00 2e 00 XX 00 XX 00 XX 00 2e 00 35 00 X.X...X.X.X...5.
0x5500e9be 2e 00 31 00 34 00 30 00 3a 00 38 00 30 00 38 00 ..1.4.0.:.8.0.8.
0x5500e9ce 30 00 2f 00 7a 00 62 00 2f 00 76 00 5f 00 30 00 0./.z.b./.v._.0.
Networking 319
0x5500e9de 31 00 5f 00 61 00 2f 00 69 00 6e 00 2f 00 00 00 1._.a./.i.n./...

```

- After finding the suspicious string, record its virtual memory address.
- Use `dlllist` to identify loaded modules and compare their base addresses and sizes with the string's address.

```bash
$ python vol.py -f memory.raw yarascan --profile=WinXPSP3x86
 -p 3060 dlllist
Volatility Foundation Volatility Framework 2.4
************************************************************************
ab.exe pid: 3060
Command line : "C:\WINDOWS\system32\ab.exe"
Service Pack 2
Base Size LoadCount Path
---------- ---------- ---------- ----
0x00400000 0x21000 0xffff C:\WINDOWS\system32\ab.exe
0x7c900000 0xb0000 0xffff C:\WINDOWS\system32\ntdll.dll
0x7c800000 0xf4000 0xffff C:\WINDOWS\system32\kernel32.dll
0x77d40000 0x90000 0xffff C:\WINDOWS\system32\USER32.dll
0x77f10000 0x46000 0xffff C:\WINDOWS\system32\GDI32.dll
0x77c10000 0x58000 0xffff C:\WINDOWS\system32\msvcrt.dll
0x55000000 0x33000 0x1 C:\WINDOWS\system32\ab.dll
0x77dd0000 0x9b000 0x14 C:\WINDOWS\system32\advapi32.dll
0x77e70000 0x91000 0xb C:\WINDOWS\system32\RPCRT4.dll
0x71ab0000 0x17000 0x1 C:\WINDOWS\system32\WS2_32.dll
0x71aa0000 0x8000 0x1 C:\WINDOWS\system32\WS2HELP.dll
0x77f60000 0x76000 0x3 C:\WINDOWS\system32\SHLWAPI.dll
0x7c9c0000 0x814000 0x1 C:\WINDOWS\system32\SHELL32.dll
0x5d090000 0x97000 0x1 C:\WINDOWS\system32\comctl32.dll
0x77b40000 0x22000 0x1 C:\WINDOWS\system32\Apphelp.dll
0x77c00000 0x8000 0x1 C:\WINDOWS\system32\VERSION.dll
```

- If the address falls within a loaded DLL, extract that DLL using `dlldump` and analyze its code.
- Examine the DLL's imports and cross-references to determine which functions use the suspicious network indicator.

**3. Trace References Outside Loaded Modules**

```bash
$ python vol.py -f jack.mem --profile=Win7SP0x86 yarascan
 -p 3030 --wide -Y "http"
Volatility Foundation Volatility Framework 2.4

Rule: r1
Owner: Process jack.exe Pid 3030
0x75d82438 68 00 74 00 74 00 70 00 3a 00 2f 00 2f 00 XX 00 h.t.t.p.:././.X.
0x75d82448 XX 00 XX 00 2e 00 31 00 33 00 34 00 2e 00 31 00 X.X...1.3.4...1.
0x75d82458 37 00 36 00 2e 00 31 00 32 00 36 00 2f 00 65 00 7.6...1.2.6./.e.
0x75d82468 78 00 69 00 73 00 74 00 73 00 2f 00 50 00 61 00 x.i.s.t.s./.P.a.

Rule: r1
Owner: Process jack.exe Pid 3030
0x76c02552 68 00 74 00 74 00 70 00 20 00 65 00 72 00 72 00 h.t.t.p...e.r.r.
0x76c02562 6f 00 72 00 73 00 00 00 90 90 55 00 72 00 6c 00 o.r.s.....U.r.l.
0x76c02572 45 00 6e 00 63 00 6f 00 64 00 69 00 6e 00 67 00 E.n.c.o.d.i.n.g.
0x76c02582 00 00 45 00 6e 00 61 00 62 00 6c 00 65 00 64 00 ..E.n.a.b.l.e.d.
[snip]
```

- If the string is located within the process address space but outside any loaded executable module, it may be stored in the heap or another allocated memory region.
- Convert the string's virtual address into the appropriate little-endian byte representation.
- Use `yarascan` to search for pointers or code references to that address.

```bash
$ python vol.py -f jack.mem --profile=Win7SP0x86 yarascan
 -p 3030 -Y "{38 24 d8 75}"
Volatility Foundation Volatility Framework 2.4
Rule: r1
Owner: Process jack.exe Pid 3030
0x75d47500 38 24 d8 75 ff b5 64 ff ff ff e8 da 37 00 00 85 8$.u..d.....7...
0x75d47510 c0 75 27 8b 03 53 ff b5 68 ff ff ff 89 85 60 ff .u'..S..h.....`.
0x75d47520 ff ff 68 38 24 d8 75 e8 31 c7 fe ff 89 85 6c ff ..h8$.u.1.....l.
0x75d47530 ff ff 85 c0 0f 8c 4a e2 01 00 6a 00 57 ff d6 83 ......J...j.W...

```

- Use `volshell` and `dis()` to disassemble the surrounding instructions.

```bash
$ python vol.py -f jack.mem --profile=Win7SP0x86 volshell -p 3030
Volatility Foundation Volatility Framework 2.4
Current context: process jack.exe, pid=3030, ppid=2340 DTB=0x1f441380
Welcome to volshell!
To get help, type 'hh()'
>>> dis(0x75d474f0)
0x75d474f0 39058422d875 CMP [0x75d82284], EAX
0x75d474f6 7542 JNZ 0x75d4753a
0x75d474f8 a900100000 TEST EAX, 0x1000
0x75d474fd 753b JNZ 0x75d4753a
0x75d474ff 683824d875 PUSH DWORD 0x75d82438
0x75d47504 ffb564ffffff PUSH DWORD [EBP-0x9c]
0x75d4750a e8da370000 CALL 0x75d4ace9
0x75d4750f 85c0 TEST EAX, EAX
```

- Follow the references and function calls to identify how the suspicious URL or IP address is being used.

**4. Analyze the Responsible Code**

- Reverse engineer the identified functions to understand their behavior.
- Determine whether the code is responsible for the suspicious network activity.
- Evaluate the code's behavior and other forensic evidence before concluding whether the connection is malicious.

## Hidden Connections

**User-Mode API Hooking:** Rootkits can hide listening ports and active connections by hooking APIs used by tools such as netstat.exe and TCPView.exe, including DeviceIoControl, ZwDeviceIoControlFile, GetTcpTable, and GetExtendedTcpTable. The AFX rootkit uses this technique. These hooks can be detected using Volatility's `apihooks` plugin.

**Kernel-Mode IRP Hooking:** Rootkits can install kernel drivers that hook the `IRP_MJ_DEVICE_CONTROL` function of \Device\Tcp, which is owned by tcpip.sys, to filter requests using `IOCTL_TCP_QUERY_INFORMATION_EX`. The **TCPIRPHook** rootkit demonstrates this technique. Detection is possible using Volatility's `driverirp` plugin or by examining network objects with `sockets`, `connections`, or `netscan`.

**NDIS Driver:** Rootkits can use an NDIS driver to communicate at a lower level than Winsock2, bypassing the creation of normal socket and connection objects. Consequently, traditional network-scanning plugins may not detect these connections. Detection requires examining loaded or hidden drivers, scanning for hidden kernel threads, or carving IP packets and Ethernet frames directly from

### NDIS Driver Detection

If malware uses a custom **NDIS driver** to bypass the normal **Winsock2 networking APIs**, it may avoid creating traditional socket and connection artifacts. However, before transmitting data over the network, it must construct **IP packets and Ethernet frames in memory**. Therefore, investigators may still recover traces of network traffic by scanning the memory dump using tools such as the **ethscan** plugin. If ethscan is unavailable, alternative tools such as `Bulk_Extractor`, `NAFT`, and `CapLoader` may help extract network artifacts from raw memory data for further analysis.

## netscan && netstat Plugin

In Windows XP and Windows Server 2003, Volatility 2 provided several plugins for examining network activity, including `sockets`, `connections`, `sockscan`, and `connscan`. For Windows Vista and later versions, `netscan` was introduced to recover network objects from memory.

In Volatility 3, two main plugins are available for network analysis: `NetScan` and `NetStat`. Although both can identify network connections, they use different detection techniques.

**NetScan** uses **Pool Scanning** to search memory for network-related Pool Tags, such as `TcpE`, `TcpL`, and `UdpA`, allowing it to identify TCP endpoints, TCP listeners, and UDP endpoints, including potentially residual objects from terminated connections.

**NetStat**, on the other hand, traverses the internal networking data structures maintained by `tcpip.sys`. As illustrated in the following diagram, it accesses the global variable `tcpip!PartitionTable`, follows the partition structures and their dynamic hash tables, and retrieves the linked `_TCP_ENDPOINT` objects. It also examines TCP and UDP port pools to identify listening sockets and UDP endpoints.

## iehistory Plugin

The `iehistory` plugin is designed to recover and parse Internet Explorer history and cache records (`index.dat`) from process memory. These artifacts can be found not only in `iexplore.exe`, but also in other processes, including malware, that use the **WinINet API** to perform web requests. The plugin can extract recorded URLs, timestamps, and other related information.

**Example: iexplore.exe**

```bash
$ python vol.py -f win7_x64.dmp --profile=Win7SP0x64 iehistory -p 2580,3004
Volatility Foundation Volatility Framework 2.4
**************************************************
Process: 2580 iexplore.exe
Cache type "URL " at 0x275000
Record length: 0x100
Location: Cookie:admin@go.com/
Last modified: 2011-04-24 03:53:15
Last accessed: 2011-04-24 03:53:15
File Offset: 0x100, Data Offset: 0x80, Data Length: 0x0
File: admin@go[1].txt
[snip]
**************************************************
Process: 2580 iexplore.exe
Cache type "URL " at 0x266500
Record length: 0x180
Location: https://ieonline.microsoft.com/ie/known_providers_download_v1.xml
Last modified: 2011-03-15 18:30:43
Last accessed: 2011-04-24 03:48:02
File Offset: 0x180, Data Offset: 0xac, Data Length: 0xd0
File: known_providers_download_v1[1].xml
Data: HTTP/1.1 200 OK
Content-Length: 49751
Content-Type: text/xml
```

**Example: WinINet API**

```bash
$ python vol.py -f exemplar17_1.vmem --profile=WinXPSP3x86 iehistory
Volatility Foundation Volatility Framework 2.4
**************************************************
Process: 1928 explorer.exe
Cache type "URL " at 0xf25100
Record length: 0x100
Location: Visited: foo@http://192.168.30.129/malware/40024.exe
Last modified: 2009-01-08 01:52:09
Last accessed: 2009-01-08 01:52:09
File Offset: 0x100, Data Offset: 0x0, Data Length: 0xa0
**************************************************
Process: 1928 explorer.exe
Cache type "URL " at 0xf25300
Record length: 0x180
Location: Visited: foo@http://www.abcjmp.com/jump1/?affiliate=mu1&subid=[snip]
Last modified: 2009-01-08 01:52:44
Last accessed: 2009-01-08 01:52:44
File Offset: 0x180, Data Offset: 0x0, Data Length: 0x108
**************************************************
Process: 1192 15103.exe
Cache type "URL " at 0xf56180
Record length: 0x180
Location: http://fhg-softportal.com/promo.exe
Last modified: 2009-03-23 16:14:17
Last accessed: 2009-01-08 01:52:15
File Offset: 0x180, Data Offset: 0x8c, Data Length: 0x9c
File: promo[1].exe
Data: HTTP/1.1 200 OK
ETag: "8554be-6200-49c7b559"
Content-Length: 25088
Content-Type: application/x-msdownload
```

### URL Brute-Force Scanning

Instead of relying on the `iehistory` plugin, which specifically parses Internet Explorer history records stored in the `index.dat` format, we can use **Regular Expressions (Regex)** with `yarascan` to search memory for URLs and domain names.

This technique is useful for finding URLs in other browsers, such as Chrome and Edge, as well as URLs embedded in web pages, JavaScript code, emails, or other memory-resident data, even if those URLs were never visited.

Another useful application is **DNS Cache Recovery**. On the Windows versions discussed in the book, DNS cache entries are stored in the heap memory of the `svchost.exe` process hosting the DNS Client service. We can search this process's memory using Regex patterns to recover potential cached hostnames, even without a dedicated DNS cache plugin.

## At The End of This Chapter

When a forensic investigation begins with an alert from an IPS, IDS, or firewall, acquiring a memory dump is essential for investigating the suspicious network activity. Memory analysis allows investigators to correlate network connections with the processes or drivers responsible for them and determine whether their behavior is malicious.

Even if a connection belongs to a legitimate process, memory analysis can help identify suspicious activity, such as code injection, and potentially trace the connection back to the specific code responsible for initiating or receiving network traffic.

### If you notice any issues or incorrect concepts, please feel free to contact me. Thank you.
