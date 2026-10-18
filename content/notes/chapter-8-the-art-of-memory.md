---
title: 'The Art of Memory Forensics Chapter-08'
date: 2026-10-17 00:00:00
category: 'The Art of Memory Forensics'
tags: [The art of memory forensics]
cover: /images/notes/chapter-8-the-art-of-memory/0.png
description: 'Explores Windows malware detection in process memory, covering PEB artifacts, suspicious DLLs, code injection, process hollowing and Volatility techniques for identifying hidden malware activity.'
toc: true
---

## Hunting Malware in Process Memory

This chapter focuses on detecting malware hidden in process memory through DLL unlinking and four different code injection techniques. It also covers extracting Portable Executable (PE) files, including processes, DLLs, and kernel modules, from memory for analysis, even when the original samples are packed or compressed.

## Process Environment Block (PEB)

The `_PEB` is a user-mode structure associated with each Windows process and referenced by its `_EPROCESS` structure. It stores important information about the process during execution.

| Field             | Description                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| BeingDebugged     | Indicates whether the process is being debugged.                                                                  |
| ImageBaseAddress  | The virtual address where the main executable is loaded.                                                          |
| Ldr               | Points to information about loaded modules (EXE and DLLs).                                                        |
| ProcessParameters | Points to process details such as the executable path, command line, environment variables, and standard handles. |
| ProcessHeap       | Points to the process's primary heap.                                                                             |
| NumberOfHeaps     | The number of heaps in the process.                                                                               |
| ProcessHeaps      | An array of pointers to the process's heaps.                                                                      |

**Note:** The PEB resides in user-mode memory, so malware can modify its contents. Investigators should cross-check its information against kernel-maintained structures such as VADs and page tables.

### Process Heaps

A **Process Heap** is a region of a process's virtual memory used for dynamic memory allocation during execution. It may contain runtime data such as information received over the network, text typed into applications like Notepad, decrypted data, and other application buffers. Heap data is not necessarily unsaved data; even the contents of files saved on disk may be copied into the heap when an application processes them.

The book demonstrates this using two Notepad processes: one opened a large log file, while the other contained text entered by the user. The investigation focused on recovering the text from the second process. Using `vadinfo` and `vadtree`, the researchers identified more than 50 VAD regions covering over 25 MB of memory. They then used the **`heaps` plugin** to identify six process heaps, reducing the search space to approximately 1.3 MB and excluding unrelated memory regions such as DLLs and mapped files. By examining suspicious heap chunks, they successfully recovered the text stored in Notepad's memory.

**Note:** The `heaps` command used in the book is not available in my current Volatility 2.6.1 installation. An alternative is to visualize the process's VAD tree using: `vadtree -p <PID> --output=dot --output-file=vadtree.dot` In Volatility 2's VAD visualization, heap-related regions are highlighted in **red**, helping identify potential heap regions for further examination.

![image](/images/notes/chapter-8-the-art-of-memory/1.png)

```bash
Current context: process notepad.exe, pid=3988, ppid=416 DTB=0x140ab4e0
To get help, type 'hh()'
>>> db(0xac7b0)
0x000ac7b0 3700 0e00 e523 1000 4c00 6900 7300 7400 7....#..L.i.s.t.
0x000ac7c0 2000 6f00 6600 2000 7400 6100 7200 6700 ..o.f...t.a.r.g.
0x000ac7d0 6500 7400 7300 3a00 0d00 0a00 0d00 0a00 e.t.s.:.........
0x000ac7e0 4a00 6900 6d00 2000 4a00 6100 6d00 6500 J.i.m...J.a.m.e.
0x000ac7f0 7300 0d00 0a00 4200 6f00 6200 6200 7900 s.....B.o.b.b.y.
0x000ac800 2000 4b00 6e00 6900 6700 6800 7400 2000 ..K.n.i.g.h.t...
0x000ac810 0d00 0a00 5000 6500 7400 6500 7200 2000 ....P.e.t.e.r...
0x000ac820 5300 6900 6c00 7600 6500 7200 0d00 0a00 S.i.l.v.e.r.....

```

### Environment Variables

Environment variables store configuration information used by a process during execution, such as `PATH`, `PATHEXT`, temporary directories, usernames, and system paths. They are stored as NULL-terminated strings in an environment block referenced by `_PEB.ProcessParameters.Environment`.

Environment variables are classified into four types:

- **System Variables:** Stored in `HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment`. They are system-wide and persistent.
- **User Variables:** Stored in `HKCU\Environment`. They are user-specific and persistent.
- **Volatile Variables:** Stored in `HKCU\Volatile Environment`. They are temporary registry variables that are not persisted to disk.
- **Dynamic Variables:** Created or modified within a process using APIs such as `SetEnvironmentVariable`. They are not automatically saved to the registry.

When a process creates a child process, the child typically inherits a copy of its parent's environment variables. However, the parent can provide a custom environment block using the `lpEnvironment` parameter of `CreateProcess`.

From a forensic perspective, environment variables can reveal suspicious behavior:

- **PATH Hijacking:** Malware modifies the `PATH` variable to prioritize malicious directories, potentially causing applications to execute malicious files instead of legitimate ones.
- **PATHEXT Hijacking:** Malware modifies the `PATHEXT` variable to prioritize unusual executable extensions during command resolution.
- **Malware Presence Marking:** Some malware families use environment variables instead of mutexes to mark infected processes and prevent repeated injection.

**Coreflood Example:** Coreflood used dynamically generated environment variable names as infection markers. Before continuing execution, its DLL checked whether its marker already existed. If it existed, the DLL unloaded to avoid repeated infection.

Using Volatility's `envars` plugin, investigators examined four processes: `explorer.exe`, `IEXPLORE.EXE`, `notepad.exe`, and `firefox.exe`. Although all four contained suspicious environment variables, only `explorer.exe` and `IEXPLORE.EXE` were identified as infected in the example. The other processes had inherited the marker from their parent, `explorer.exe`. The infected `IEXPLORE.EXE` contained both the inherited marker and its own unique marker.

This demonstrates that **finding a suspicious environment variable does not necessarily mean the process is infected**. Investigators must consider environment inheritance and parent-child relationships before drawing conclusions.

The `envars` plugin enumerates process environment variables from memory, while its `--silent` option filters known variables to help identify unusual entries.

```bash
$ python vol.py -f coreflood.img --profile=WinXPSP3x86 envars
**************************************************
Pid 1144 explorer.exe (PPid 644) Block at 0x10000
USERNAME=Administrator
USERPROFILE=C:\Documents and Settings\Administrator
VFTPXXPYVTAMF=EWONSYG
windir=C:\WINDOWS
[SNIP]
**************************************************
Pid 512 IEXPLORE.EXE (PPid 1144) Block at 0x10000
ProgramFiles=C:\Program Files
QBYXKDAGXM=EWONSYG
SESSIONNAME=Console
USERDOMAIN=JAN-DF663B3DBF1
USERNAME=Administrator
USERPROFILE=C:\Documents and Settings\Administrator
VFTPXXPYVTAMF=EWONSYG
[SNIP]
**************************************************
Pid 560 notepad.exe (PPid 1144) Block at 0x10000
USERNAME=Administrator
USERPROFILE=C:\Documents and Settings\Administrator
VFTPXXPYVTAMF=EWONSYG
[SNIP]
**************************************************
Pid 220 firefox.exe (PPid 1144) Block at 0x10000
USERNAME=Administrator
USERPROFILE=C:\Documents and Settings\Administrator
VFTPXXPYVTAMF=EWONSYG
[SNIP]

```

From the `envars` output, we can see an unusual environment variable appearing in four different processes. As explained in the book, Coreflood uses environment variables as markers to indicate infected processes.However, not all four processes are infected. `firefox.exe` and `notepad.exe` simply inherited the marker from their parent process, `explorer.exe`, which explains why they have the same variable name.Based on Coreflood's behavior, if these processes had also been infected, we would expect each of them to have an additional, uniquely generated marker.

#### Coreflood Behavior

![image](/images/notes/chapter-8-the-art-of-memory/2.png)

### Standard Handles

A process has three standard handles: `StandardInput` (STDIN), which determines where input comes from; `StandardOutput` (STDOUT), which determines where output is sent; and `StandardError` (STDERR), which determines where error messages are sent. Analyzing these handles can help investigators understand suspicious process behavior.

The book demonstrates a backdoor that receives commands through a network socket and redirects its output and error messages back through the same socket.

```bash
$ python vol.py -f memory.dmp --profile=Win7SP1x64 volshell
Volatility Foundation Volatility Framework 2.4
Current context: process System, pid=4, ppid=0 DTB=0x187000
To get help, type 'hh()'
>>> for proc in win32.tasks.pslist(self.addrspace):
... if str(proc.ImageFileName) != "cmd.exe":
... continue
... if proc.Peb:
... print proc.UniqueProcessId,\
... hex(proc.Peb.ProcessParameters.StandardInput),\
... hex(proc.Peb.ProcessParameters.StandardOutput),\
... hex(proc.Peb.ProcessParameters.StandardError)
...
572 0x3L 0x7L 0xbL
3436 0x3L 0x7L 0xbL
564 0x3L 0x7L 0xbL
2160 0x68L 0x68L 0x68L

```

During the investigation, four `cmd.exe` processes were found running. Three had normal-looking standard handle values, while one had the same unusual handle value (`0x68`) for STDIN, STDOUT, and STDERR.Using the `handles` plugin, investigators discovered that handle `0x68` referenced `\Device\Afd\Endpoint`, a kernel-managed object associated with a network socket.

```bash

$ python vol.py -f memory.dmp --profile=Win7SP1x64 handles -p 2160 -t File
Volatility Foundation Volatility Framework 2.4
Offset(V) Pid Handle Type Details
------------------ ------ --------- -------- -------
0xfffffa80015c4070 2160 0xc File
\Device\HarddiskVolume1\Users\Elliot\Desktop
0xfffffa8002842130 2160 0x54 File \Device\Afd\Endpoint
0xfffffa80014f3af0 2160 0x68 File \Device\Afd\Endpoint

```

They then used `pstree` to identify the parent process and `netscan` to confirm that the parent had a listening socket and an established connection with a remote endpoint.This demonstrates how analyzing standard handles and correlating them with kernel objects, process relationships, and network connections can help detect backdoor activity hidden behind a legitimate process such as `cmd.exe`.

## Dynamic Link Libraries (DLLs)

DLLs contain code and resources that can be shared between processes. They are also commonly used by malware because they execute within a host process and can access its memory, threads, and handles.

DLLs can be loaded through:

- **Static Linking:** DLLs specified in the executable's import table are loaded during process initialization.
- **Dependencies:** Loading one DLL may require loading additional DLLs.
- **Runtime Dynamic Linking:** A process explicitly loads a DLL using APIs such as `LoadLibrary` or `LdrLoadDll`, without requiring it to appear in the executable's IAT (Import Address Table).
- **DLL Injection:** A DLL is introduced into a target process to execute code within its address space.

From a forensic perspective, we should investigate unusual DLL names or paths, unexpected functionality, and inconsistencies between module lists. For example, networking DLLs such as `ws2_32.dll`, `WININET.dll`, and `DNSAPI.dll` are legitimate, but their unexpected presence in a process like `notepad.exe` may indicate suspicious activity.

### Detecting Hidden DLLs

Windows maintains three doubly linked lists of loaded modules through `_PEB_LDR_DATA`: `InLoadOrderModuleList`, `InMemoryOrderModuleList`, and `InInitializationOrderModuleList`. Each module is represented by an `_LDR_DATA_TABLE_ENTRY`.Malware can hide a DLL through **DLL Unlinking**, removing its metadata entry from one or all three lists while leaving the DLL mapped in process memory. It may also modify `FullDllName` and `BaseDllName` to display fake module paths.

![image](/images/notes/chapter-8-the-art-of-memory/3.png)

Volatility provides several approaches for investigating these techniques:

- **`dlllist`:** Enumerates DLLs through the PEB's load order list. It may miss DLLs hidden through unlinking.
- **`ldrmodules`:** Cross-references the three PEB loader lists against kernel-maintained VAD information to identify potentially hidden DLLs.

```bash
$ python vol.py -f memory.dmp --profile=Win7SP1x64 ldrmodules -p 616
Volatility Foundation Volatility Framework 2.4
Process Base InLoad InInit InMem MappedPath
------------ ------------------ ------ ------ ----- ----------
svchost.exe 0x0000000074340000 True True True \Windows\[snip]\sfc.dll
svchost.exe 0x00000000779a0000 True True True \Windows\[snip]\ntdll.dll
svchost.exe 0x000007feff570000 False False False \Windows\[snip]\lpkz2.dll
svchost.exe 0x0000000077780000 True True True \Windows\[snip]\kernel32.dll
svchost.exe 0x000007fefd990000 True True True \Windows\[snip]\msasn1.dll
svchost.exe 0x000007fefbbe0000 True True True \Windows\[snip]\wtsapi32.dll
svchost.exe 0x000007fefdac0000 True True True \Windows\[snip]\KernelBase.dll
svchost.exe 0x000007fefcc00000 True True True \Windows\[snip]\gpapi.dll
svchost.exe 0x000007fefb800000 True True True \Windows\[snip]\ntmarta.dll
svchost.exe 0x000007fefcc20000 True True True \Windows\[snip]\userenv.dll
svchost.exe 0x000007fefbd60000 True True True \Windows\[snip]\xmllite.dll
svchost.exe 0x000007feff460000 True True True \Windows\[snip]\oleaut32.dll
svchost.exe 0x000007fefde70000 True True True \Windows\[snip]\urlmon.dll
svchost.exe 0x000007fef9290000 True True True \Windows\[snip]\wscapi.dll

```

The `ldrmodules` plugin displays `InLoad`, `InInit`, and `InMem` values. A DLL present in a VAD but showing `False False False` may indicate that it was unlinked from all three lists.

**Key Concept:** Since the PEB resides in user-mode memory, malware can manipulate its DLL metadata. Cross-referencing PEB loader lists with VADs helps investigators detect hidden modules and identify inconsistencies that require further analysis.

## PE Files in Memory

Volatility can extract and reconstruct **Portable Executable (PE)** files from memory, including executables `.exe`, DLLs `.dll`, and kernel drivers `.sys`. However, a PE file dumped from memory may differ from its original version on disk because of changes made during loading and execution.

The main reasons for these differences are:

- **IAT Patching:** The Windows Loader updates the Import Address Table (IAT) with the actual memory addresses of imported functions.
- **Inaccessible Sections:** Some PE sections or pages may not be present in RAM when the memory dump is captured.
- **Modified Global Variables:** Runtime changes to global variables may appear in the dumped file.
- **Self-Modifying Code:** Applications, especially packed malware, may decrypt, decompress, or modify their instructions during execution.
- **PE Slack Space:** PE sections are aligned to memory page boundaries (typically 4096 bytes), which can create unused space between sections. This space may sometimes contain valuable forensic artifacts.

### PE Extraction

Volatility provides three main plugins for extracting PE files:

- **`procdump`:** Extracts a process executable from memory. It supports extraction by PID or physical `_EPROCESS` offset, including processes hidden from the active process list.
- **`dlldump`:** Extracts DLLs using their names or base addresses. The `--base` option is particularly useful for hidden or unlinked DLLs.
- **`moddump`:** Extracts kernel modules and drivers from memory.

The `--memory` option preserves slack space between PE sections, producing a file that more closely resembles its memory layout.

These plugins depend on valid PE headers and section information. If malware modifies the headers, or required pages are unavailable, extraction may fail. In such cases, `vaddump` can extract the containing VAD region without relying on PE headers, while `dumpfiles` can recover available file-backed data, which may resemble the original disk file rather than its modified runtime image.

### Packing and Unpacking Malware

Malware often uses **packers** to compress, encrypt, or obfuscate its original code and strings. A packed executable typically contains an **unpacking stub**, which executes first and restores the original code in memory before transferring execution to it.This makes memory analysis particularly useful because the unpacked code may become accessible during execution, even when static analysis of the original disk file reveals very little.

![image](/images/notes/chapter-8-the-art-of-memory/4.png)

**Note:** Modern unpacking tools can unpack certain malware samples without requiring analysts to manually execute the EXE. Some tools use static unpacking techniques, while others rely on emulation or controlled execution. Therefore, directly running the malware is not always necessary, although successful unpacking depends on the packer used.

## Code Injection

Code injection allows malware to execute code within the address space of another process, potentially using its memory, handles, and security context. The book describes four main injection techniques:

1. **Remote DLL Injection:** Malware forces a target process to load a DLL from disk using APIs such as `LoadLibrary` or `LdrLoadDll`. Since the Windows Loader handles the DLL normally, it may appear in the PEB loader lists and `dlllist`. Detection requires analyzing suspicious DLL paths, process context, or evidence of DLL unlinking using `ldrmodules`.

2. **Remote Code Injection:** Malware writes executable code directly into another process's memory and causes it to execute. The injected code may be raw shellcode or a PE image. This often creates private executable memory regions, sometimes with `PAGE_EXECUTE_READWRITE` (RWX) protection, which can be identified using `malfind`.

3. **Reflective DLL Injection:** Malware transfers a DLL directly into a target process's memory, where it initializes itself without relying on the traditional Windows Loader. As a result, the DLL does not need to exist on disk and may not appear in the PEB loader lists. `malfind` can help detect suspicious private executable regions containing the DLL.

4. **Process Hollowing:** Malware creates a legitimate process in a suspended state, removes or unmaps its original executable image, and replaces it with malicious code. The PEB may still contain the legitimate executable's name and path, while the actual memory mapping has changed. Investigators can detect this by comparing PEB information with VADs using `vadinfo` and `ldrmodules`.

![image](/images/notes/chapter-8-the-art-of-memory/5.png)

### Detecting Injected Code

The `malfind` plugin searches for suspicious memory regions, particularly private executable memory that may contain PE headers or CPU instructions.

examples:

- **Stuxnet:** Injected a PE image into `services.exe`, where `malfind` identified an RWX memory region beginning with the `MZ` signature.

```bash
$ python vol.py –f stuxnet.mem --profile=WinXPSP3x86 malfind
Volatility Foundation Volatility Framework 2.4
Process: services.exe Pid: 668 Address: 0x13f0000
Vad Tag: Vad Protection: PAGE_EXECUTE_READWRITE
Flags: Protection: 6
0x013f0000 4d 5a 90 00 03 00 00 00 04 00 00 00 ff ff 00 00 MZ..............
0x013f0010 b8 00 00 00 00 00 00 00 40 00 00 00 00 00 00 00 ........@.......
0x013f0020 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ................
0x013f0030 00 00 00 00 00 00 00 00 00 00 00 00 08 01 00 00 ................
0x13f0000 4d DEC EBP
0x13f0001 5a POP EDX
0x13f0002 90 NOP
0x13f0003 0003 ADD [EBX], AL
0x13f0005 0000 ADD [EAX], AL
0x13f0007 000400 ADD [EAX+EAX], AL
```

- **Carberp:** Injected raw shellcode into `svchost.exe`. No `MZ` signature was present, but the disassembly revealed meaningful instructions and control-flow transfers.

```bash
$ python vol.py –f carberp.mem --profile=WinXPSP3x86 malfind
Volatility Foundation Volatility Framework 2.4
[snip]
Process: svchost.exe Pid: 992 Address: 0x9d0000
Vad Tag: VadS Protection: PAGE_EXECUTE_READWRITE
Flags: CommitCharge: 1, MemCommit: 1, PrivateMemory: 1, Protection: 6
0x009d0000 b8 35 00 00 00 e9 8b d1 f3 7b 68 6c 02 00 00 e9 .5.......{hl....
0x009d0010 94 63 f4 7b 8b ff 55 8b ec e9 6c 11 e4 7b 8b ff .c.{..U...l..{..
0x009d0020 55 8b ec e9 99 2e 84 76 8b ff 55 8b ec e9 74 60 U......v..U...t`
0x009d0030 7f 76 8b ff 55 8b ec e9 8a e9 7f 76 8b ff 55 8b .v..U......v..U.
0x9d0000 b835000000 MOV EAX, 0x35
0x9d0005 e98bd1f37b JMP 0x7c90d195
0x9d000a 686c020000 PUSH DWORD 0x26c
0x9d000f e99463f47b JMP 0x7c9163a8
0x9d0014 8bff MOV EDI, EDI
0x9d0016 55 PUSH EBP
```

However, **not every private executable or RWX region is malicious**. Legitimate processes may allocate executable memory, producing false positives. Therefore, `malfind` results require additional analysis of the instructions, memory layout, and process context.

### Detecting Process Hollowing

The main idea is to identify inconsistencies between the process metadata stored in the PEB and the actual executable image mapped in memory.During process hollowing, malware replaces the original executable image while the PEB may still report the legitimate process name, path, and image base.

To detect this, investigators can:

- **`vadinfo`:** Examine the VAD containing the process's `ImageBase` and check whether it has the expected file-backed image mapping, protection flags, and file association.
- **`ldrmodules`:** Cross-reference PEB loader lists with VAD mappings to identify discrepancies, such as an executable still listed in the PEB but missing its original mapped file (`MappedPath=<no name>`).

### Postprocessing Injected Code

After identifying suspicious injected memory regions, you can extract them for static analysis using tools such as `IDA`.

The extracted code may require additional processing:

- **ImageBase Adjustment:** Correct the PE's image base to match its actual location in memory.
- **Import Reconstruction:** Use `impscan` to identify imported API functions and assist with analyzing the extracted code.
- **Fragmented Code Reconstruction:** Injected code may be distributed across multiple VAD regions rather than stored in one contiguous memory block. In such cases, investigators need to analyze and correlate the fragments to understand the complete functionality.

### At the end of this chapter, we learned how to analyze process memory to identify suspicious DLLs, detect code injection and process hollowing, and extract packed or hidden malware using Volatility plugins such as malfind, ldrmodules, procdump, and dlldump.If you notice any issues or incorrect concepts, please feel free to contact me. Thank you.
