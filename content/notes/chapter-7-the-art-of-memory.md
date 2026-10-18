---
title: 'The Art of Memory Forensics Chapter-07'
date: 2026-10-14 00:00:00
category: 'The Art of Memory Forensics'
tags: [The art of memory forensics]
cover: /images/notes/chapter-7-the-art-of-memory/0.webp
description: 'explores Windows process memory internals, including virtual address spaces, page tables, VADs, heaps, YARA scanning, and recovery of runtime artifacts such as passwords and encryption keys.'
toc: true
---

## Process Memory Internals

Unlike the previous chapter, which focused mainly on process-related kernel structures and metadata such as `_EPROCESS`, tokens, and handles, this chapter focuses on the process’s own virtual address space and memory regions. Process memory can contain valuable forensic evidence because it stores the actual data being used or processed by the application, such as data received from the network, user input, mapped files, shared libraries, passwords, e-mails, documents, chat logs, and other application-specific data.

### Address Space Layout Details

Each process has its own virtual address space, which makes it appear as if it is running separately in memory. From the process’s point of view, it can address memory starting from 0 up to `MmHighestUserAddress`, even though the underlying physical memory is shared and managed by the operating system.

![image](/images/notes/chapter-7-the-art-of-memory/1.webp)

**Note:** These memory regions are not always located in the same positions shown in the diagram. Their addresses can vary between processes and executions, especially because of ASLR (Address Space Layout Randomization), which randomizes the locations of memory regions.

### Memory Allocation APIs

Windows provides several APIs for allocating process memory, and although they differ in behavior, they ultimately rely on `NtAllocateVirtualMemory`. Heap-based APIs such as `malloc`, `new`, `HeapAlloc`, `GlobalAlloc`, and `LocalAlloc` obtain memory from process heaps, while `VirtualAlloc` and `VirtualAllocEx` allocate virtual memory regions directly. `VirtualAlloc` allows control over memory permissions such as read, write, execute, no-access, and guard, while heap memory is generally readable and writable unless created with executable support.

`VirtualAllocEx` can allocate memory inside another process by using a handle to the target process, which makes it especially relevant to code-injection analysis.`VirtualAlloc` and `VirtualAllocEx` can also reserve virtual address ranges before committing them, allowing applications to save address space without immediately using physical memory. Memory regions created this way can later be inspected with `VirtualQueryEx`, which has also been used by malware to enumerate process memory before scanning it for sensitive data.

![image](/images/notes/chapter-7-the-art-of-memory/2.webp)

## Enumerating Process Memory

### Process Page Tables

Process page tables describe the virtual memory pages that are accessible within a process’s address space and map those virtual addresses to their corresponding physical locations in RAM. These pages do not need to be contiguous in physical memory, even if their virtual addresses are contiguous. You can use the memmap plugin to enumerate these accessible pages and view their virtual-to-physical mappings, while the memdump plugin can extract the available memory-resident pages accessible to the process into a single `.dmp` file.

```bash
$ python vol.py -f memory.dmp --profile=Win7SP0x64 memmap -p 864
Volatility Foundation Volatility Framework 2.4
winlogon.exe pid: 864
Virtual                 Physical             Size           DumpFileOffset
------------------ ------------------ ------------------ ------------------
0x0000000000010000 0x0000000151162000       0x1000              0x0
0x0000000000020000 0x0000000158de3000       0x1000              0x1000
0x0000000000021000 0x0000000158c64000       0x1000              0x2000
0x0000000000022000 0x0000000158d65000       0x1000              0x3000
0x0000000000023000 0x0000000158de6000       0x1000              0x4000
0x0000000000024000 0x0000000158d67000       0x1000              0x5000
0x000000007efe3000 0x000000015200c000       0x1000              0x29f000
0x000000007efe4000 0x000000015208d000       0x1000              0x2a0000
0x000000007ffe0000 0x00000000001e6000       0x1000              0x2a1000
0x00000000ff4c0000 0x000000015170a000       0x1000              0x2a2000
0x00000000ff4c1000 0x0000000151b77000       0x1000              0x2a3000
0xfffff80000bab000 0x0000000000bab000       0x1000              0xae4000
0xfffff80000bac000 0x0000000000bac000       0x1000              0xae5000
0xfffff80002800000 0x0000000002800000       0x200000            0xae6000
0xfffff80002a00000 0x0000000002a00000       0x200000            0xce6000
0xfffff80002c00000 0x0000000002c00000       0x200000            0xee6000
0xfffff80002e00000 0x0000000002e00000       0x200000            0x10e6000
0xfffff80003c7a000 0x0000000003c7a000       0x1000              0x12e6000
```

**Note:** After dumping a process with memdump, if you want to locate bytes that originally corresponded to a specific virtual address, use the corresponding value in the DumpFileOffset column from memmap. That offset tells you where the same page is stored inside the generated process dump file.

### Virtual Address Descriptors

Virtual Address Descriptors (VADs) are Windows structures that describe contiguous regions of a process’s virtual address space at a higher level than page tables. Each VAD node represents one memory range and can contain information such as the starting and ending addresses, whether the region is reserved or committed, its initial protection, whether it is private memory, and information about mapped files or DLLs. VADs are organized as a self-balancing binary tree referenced by `_EPROCESS.VadRoot`, where lower-address ranges are placed on the left and higher-address ranges on the right. Unlike page tables, which mainly provide virtual-to-physical mappings and authoritative page-level permissions, VADs provide context about what a memory region represents.

#### Volatility VAD Plugins

| Plugin  | Function                                                                                                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| vadinfo | Displays detailed information about each VAD, including the **start and end addresses**, **protection**, **flags**, and the full path of mapped files or DLLs.                                    |
| vadtree | Displays the VAD nodes as a **tree**, showing the parent/child relationships. It can also generate **color-coded graphs** of the process memory layout.                                           |
| vaddump | Dumps the memory range described by each VAD into a **separate file**. If some pages are swapped out, it fills their locations with **zeros** to preserve the original offsets within the region. |

**Note:** If you use vadtree with the `--output=dot` option, Volatility can generate a `.dot` graph that visualizes the VAD tree and color-codes memory regions according to their contents. In the book’s example, process heaps are red, thread stacks are green, mapped files are yellow, and DLLs are gray, which makes it easier to identify different types of regions in the process address space.

## Scanning Memory with Yara Rule

YARA is a pattern-matching tool that can be used to search for specific signatures in memory dumps, files, packet captures, and other data sources. However, when analyzing process memory, the important advantage comes from Volatility’s `yarascan` plugin rather than YARA itself.

`yarascan` scans the process’s virtual address space, not just the raw physical layout of the memory dump. This matters because pages that are contiguous in virtual memory may be stored in different locations in physical memory. Therefore, a pattern that spans two adjacent virtual pages might be split across non-contiguous physical pages and could be missed when scanning the raw physical dump directly.

Volatility resolves the process’s virtual memory mappings first, scans the reconstructed virtual address space, and reports the process or kernel module that owns each match.

### Usage

```bash
 python vol.py -f memory.dmp --profile=Win7SP1x64 yarascan
 --yara-rules="&Email" --wide -p 3560,3660,3808
Volatility Foundation Volatility Framework 2.4
Rule: r1
Owner: Process chrome.exe Pid 3660
0x03172652 2600 4500 6d00 6100 6900 6c00 3d00 6800 &.E.m.a.i.l.=.h.
0x03172662 6100 6300 6b00 3400 6c00 6900 6600 6500 a.c.k.4.l.i.f.e.
0x03172672 3200 2600 5000 6100 7300 7300 7700 6400 2.&.P.a.s.s.w.d.
0x03172682 3d00 6400 6100 7400 6500 7200 3700 2d00 =.d.a.t.e.r.7.-.
Rule: r1
Owner: Process chrome.exe Pid 3660
0x0260b078 2600 4500 6d00 6100 6900 6c00 3d00 6800 &.E.m.a.i.l.=.h.
0x0260b088 6100 6300 6b00 3400 6c00 6900 6600 6500 a.c.k.4.l.i.f.e.
0x0260b098 3200 3000 3000 2600 5000 6100 7300 7300 2.0.0.&.P.a.s.s.
0x0260b0a8 7700 6400 3d00 6400 6100 7400 6500 7200 w.d.=.d.a.t.e.r

```

## Zeus Encryption Keys in Memory

The book provides an example using the Zeus banking Trojan, to show how analysts recovered its `RC4` encryption key from process memory. First, they reverse-engineered the Zeus executable and identified recognizable instruction patterns inside functions related to configuration decryption and `RC4` key usage.

![image](/images/notes/chapter-7-the-art-of-memory/3.webp)

They then converted those instruction sequences into YARA signatures and used wildcards such as `??` for bytes that could vary between samples, such as addresses, offsets, stack locations, or call targets. One of the rules had the following form:

```yara
rule z3
{
    strings:
        $a = {
            68 02 01 00 00
            8D 84 24 ?? ?? ?? ??
            50
            8D 44 24 ??
            50
            E8 ?? ?? ?? ??
            B8 E6 01 00 00
            50
            68 ?? ?? ?? ??
        }

    condition:
        $a
}

```

After creating these signatures, the analysts developed the `zeusscan2` Volatility plugin. The YARA rule was used to locate the relevant Zeus code in memory, while the plugin performed the post-processing: it parsed values from the matched instructions, followed the corresponding pointers or offsets to locate the RC4 key and encrypted configuration data, and then used the recovered key to decrypt the configuration. So the YARA rule handled detection, while the plugin handled extraction, interpretation, and decryption.

```bash
$ python vol.py --plugins=contrib/plugins/malware -f zeus2x4.vmem zeusscan2
--------------------------------------------------
Process: wuauclt.exe
Pid: 940
Address: 0xD80000
URL: http://193.43.134.14/eu2.bin
Identifier: JASONRESACC69_7875768F16073AAF
Mutant key: 0x17703072
XOR key: 0x2006B8FE
Registry: HKEY_CURRENT_USER\SOFTWARE\Microsoft\Izozo
Value 1: Kealtuuxd
Value 2: Yrdii
Value 3: Kebooqu
Executable: Obyt\ihah.exe
Data file: Ebupzu\uzugl.dat

Config RC4 Key:
0x00000000 4a ba 2c 63 eb 7c fc 45 c4 f3 b6 2d 31 29 21 2e J.,c.|.E...-1)!.
0x00000010 53 0f 3f ef 9a 2a f8 82 96 6b e1 a2 3b 5f 34 fd S.?..*...k..;_4.
0x00000020 a6 02 cc 39 0b 16 40 33 1f a1 dc af 93 9b 5b 94 ...9..@3......[.
0x00000030 68 62 84 46 ca 64 8d 43 13 d4 d9 72 00 5c 2b bc hb.F.d.C...r..+.
0x00000040 f6 d7 88 91 24 9f bd 1e 7a 07 c5 6e 1a 4e 90 92 ....$...z..n.N..
0x00000050 c1 42 0c 75 47 3a 9e 1d c2 ec 0d ed b8 71 b4 ab .B.uG:.......q..
0x00000060 e6 5d e3 14 48 b9 e9 e8 b2 10 ee f4 e2 2f a4 09 .]..H......../..

Credential RC4 Key:
0x00000000 6f e4 94 f2 f1 5e 5c c1 8c e8 66 c5 13 2a 23 39 o....^....f..*#9
0x00000010 84 36 6a 83 b2 55 6c 11 5a f3 b6 20 07 6d ba de .6j..Ul.Z.. .m..
0x00000020 52 8e 34 bf 8a 05 0f 64 35 29 cb 5f ff 00 87 fc R.4....d5)._....
0x00000030 b5 5b 67 b8 eb 1a 0e 1f 32 ae 54 3a 88 ed c3 51 .[g.....2.T:...Q
0x00000040 40 14 3e 53 dc 7c a7 0b 79 26 e5 45 99 7d 1c d0 @.>S.|..y&.E.}..
0x00000050 90 8f 80 95 71 58 41 5d f9 af 9e a1 6e ef 25 4e ....qXA]....n.%N
0x00000060 48 2d b1 bd 33 ab d3 b7 4d 10 7e 44 65 7b cd 2f H-..3...M.~De{./
```

### At the end of this chapter, we learned how process virtual memory is organized and analyzed using page tables, VADs, and mapped regions. We also covered how plugins such as `memmap`, `memdump`, `vadinfo`, `vaddump`, and `yarascan` can be used to enumerate, extract, and search process memory, and how runtime artifacts such as passwords, and encryption keys can be recovered from memory. If you notice any issues or incorrect concepts, please feel free to contact me. Thank you.
