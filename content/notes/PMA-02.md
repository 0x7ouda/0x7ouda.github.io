---
title: 'PMA Part-02'
date: 2026-11-19 00:00:00
category: 'Practical Malware Analysis'
tags: [PMA]
cover: /images/notes/PMA-02/0.webp
description: 'Chapters 8–10 of Practical Malware Analysis (PMA), covering debugging fundamentals, techniques, and hands-on malware analysis using debuggers.'
toc: true
---

## Debugging

A debugger is a software tool that allows you to see what actually happens during program execution. It also lets you inspect memory addresses and the data stored at those addresses, as well as CPU registers.

You can also modify variables or data in memory to observe how the program behaves differently.

### Kernel vs. User-Mode Debugging

As we already know, Windows has two modes: User Mode and Kernel Mode. There are some differences between them when it comes to debugging.

- **User-Mode Debugging:** Both the debugger and the process being debugged can run on the same host. Setting a breakpoint pauses the target's execution without stopping the entire system.
- **Kernel-Mode Debugging:** You typically need two separate machines: one running the debugger and the other running the code being debugged. You can also use WinDbg for local kernel debugging on the same machine, but it has more limited capabilities compared to debugging with two separate systems.

### Using a Debugger

- **Single Step:** Executes instructions one by one, in execution order.
- **Step Into:** Allows you to enter a function call and execute its instructions step by step.
- **Step Over:** Executes the entire function without stepping through its instructions.
- **Step Out:** If you've stepped into a function and want to leave it without manually stepping through the remaining instructions, it continues execution until the function returns to the caller.

### Breakpoints

Breakpoints allow us to pause program execution at a specific point. They are useful when we want to inspect the data stored in certain registers or examine data in memory that may not be visible in the disassembler.

For example, if a program contains encrypted data and we want to understand how it gets decrypted, we can use breakpoints to observe the decryption process.

#### Software Breakpoints

Software breakpoints work by replacing a byte in memory, not in the original EXE file, with `0xCC`, which represents the `INT 3` instruction. This causes the processor to generate a breakpoint exception, allowing the debugger to take control and inspect the program's data.

You can set a large number of software breakpoints, but one problem is that some malware uses self-modifying code, which may overwrite the `0xCC` byte and remove the breakpoint.

#### Hardware Breakpoints

Hardware breakpoints use CPU features and dedicated debug registers to set breakpoints without modifying the original instruction bytes However, their number is limited to **four hardware breakpoint slots** on x86.

#### Conditional Breakpoints

Conditional breakpoints pause execution only when a specific condition is met. If the condition is false, the debugger automatically continues execution without stopping.

### Getting Started with x64dbg

The book uses OllyDbg, but we'll apply the same concepts using x64dbg because it's more popular nowadays and more modern, There are two ways to start debugging:

- **Load an Executable:** Open an EXE file through `File → Open`.
- **Attach to a Process:** Attach the debugger to an already running process through `File → Attach`.

### x64dbg Interface

**Note:** If the EXE is 32-bit, use `x32dbg`. If it's 64-bit, use `x64dbg`.

The x64dbg interface has four main windows:

![image](/images/notes/PMA-02/1.webp)

- **Disassembly Window:** Located at the top left, it displays the assembly instructions of the program.
- **Registers Window:** Located at the top right, it displays the CPU registers and their current values.
- **Stack Window:** Located directly below the Registers Window, it displays the stack contents.
- **Memory Dump Window:** Located below the Disassembly Window, it displays the data stored in memory.

We can also modify values directly from these windows using their editing options. For example, we can modify register values, edit stack data, or patch instructions. In the Memory Dump Window, we can right-click and select `Binary → Edit` to modify memory bytes.

### Memory Map View

![image](/images/notes/PMA-02/2.webp)

The Memory Map View allows you to see all the virtual memory regions associated with the process, including different PE sections, their addresses and sizes, and loaded DLLsو However, you might notice that the memory addresses are different from the ones you see when opening the same EXE in IDA.

This is because IDA may display the **Preferred Base Address**. Every EXE or DLL has a preferred base address, which is usually assigned during the linking process However, the EXE or DLL might be loaded at a different address, either because the preferred address is unavailable or due to ASLR.

This brings us to an important concept called **Rebasing**, which means changing the base address of an EXE or DLL to a different address. When the Windows loader does this, it also applies the necessary relocations.

### Threads

The Threads View allows you to see all the threads running in the process. You can also switch between threads or terminate a specific thread.

### x64dbg Hotkeys

| Function            | Hotkey      | Description                                                         |
| ------------------- | ----------- | ------------------------------------------------------------------- |
| Run                 | `F9`        | Continues program execution.                                        |
| Pause               | `F12`       | Pauses program execution.                                           |
| Run to Selection    | `F4`        | Runs until the selected instruction is reached.                     |
| Execute till Return | `Ctrl + F9` | Executes until the current function reaches a return instruction.   |
| Run to User Code    | `Alt + F9`  | Runs until execution reaches user code.                             |
| Step Into           | `F7`        | Executes one instruction, entering function calls.                  |
| Step Over           | `F8`        | Executes a function call without stepping through its instructions. |

### Breakpoints in x64dbg

We've already covered the different types of breakpoints, but now we'll see how to set them in x64dbg.

- **Software Breakpoint:** Select an instruction and press `F2`.
- **Conditional Breakpoint:** Select an instruction and press `Shift + F2` to set a breakpoint with a specific condition.
- **Hardware Breakpoint:** Right-click an instruction, select `Breakpoint`, then choose `Hardware`.
- **Software, Hardware, and Conditional Breakpoints:** You can also access these options by right-clicking an instruction in the Disassembly Window and selecting the appropriate breakpoint option.
- **Memory Breakpoint:** Go to the `Memory Map` window, select the memory region you want to monitor, right-click, and choose `Breakpoint → Memory`. Then select the access type: `Read`, `Write`, or `Execute`.

### Loading DLLs

As we already know, DLLs cannot run on their own; they need a loader To load a DLL in x64dbg, the debugger uses a dummy executable called `loaddll.exe` to load the DLL.

Alternatively, you can create your own EXE that loads the DLL and calls its exported functions, since x64dbg doesn't have the built-in `Call DLL Export` feature available in OllyDbg.

### Tracing

Tracing allows you to understand how you reached a certain point in the code or where a specific value came from by recording the instructions that were executed.

However, you need to enable trace recording first. Then, from the `Debug` menu, select `Trace Into` or `Trace Over`, depending on what you want to trace, and set the condition that will stop the tracing.

### Exception Handling

When an exception occurs, the processor generates an exception, and the OS gives the debugger the first chance to handle it.

You can control whether to pass the exception to the program using the options in the `Debug` menu:

- **Pass Exceptions:** Passes the exception to the program, allowing its exception handlers to handle it.
- **Swallow Exception:** Prevents the exception from being passed to the program.

Sometimes, you may need to pass the exception to the program because it might use exceptions to change its execution flow or behavior.

### Patching

Patching allows you to modify an existing instruction to observe a different result, bypass a password check, or change the program's behavior To patch an instruction in x64dbg, select the instruction you want to modify, press `Space`, and enter the new instruction. You can also replace it with NOPs using the `Fill with NOPs` option.

Just make sure the patched instructions occupy the same number of bytes as the original instructions to avoid affecting the instructions that follow.

### Shellcode Analysis

To analyze shellcode, go to the Memory Map and look for a `PRV` region. Make sure it has enough unused space to fit your shellcode Right-click the region, select `Set Page Memory Rights`, and give it Read, Write, and Execute (RWX) permissions Then, select `Follow in Dump`, go to the empty space, and paste your shellcode.

Finally, change the `EIP` register to point to the address where you pasted your shellcode, so execution starts from your code.

## Kernel Debugging with WinDbg

WinDbg is a debugger, but it's different from x64dbg because you can use it to debug kernel drivers. It can also debug user-mode applications, but it's more useful for kernel debugging.

There are some differences between kernel code and regular user-mode code. The first one is how applications communicate with drivers. This happens through device objects, which aren't necessarily physical devices. They're a way Microsoft uses to let applications communicate with drivers, like USB drivers and others. Another way applications communicate with drivers is by sending IOCTL commands through `DeviceIoControl`.

Malware authors use kernel drivers because they have higher privileges than regular user-mode applications, which helps them do many things they normally couldn't do in user mode.

### Setting Up Kernel Debugging with WinDbg

To debug the Windows 10 kernel using WinDbg, we need a Windows 10 VM in VMware and WinDbg running on the host machine First, take a snapshot of the VM and shut it down. Then, go to VMware Settings, add a `Serial Port`, and select `Output to Named Pipe` with these settings:

- **Pipe Name:** `\\.\pipe\com_1`
- **This end:** Server
- **The other end:** Application
- **Connect at power on:** Enabled

After that, start the VM, open CMD as Administrator, and run:

```cmd
bcdedit /debug on
bcdedit /dbgsettings serial debugport:1 baudrate:115200
```

The first command enables kernel debugging, and the second one sets the connection to use `COM1` with a baud rate of `115200`.

Next, on the host machine, open WinDbg and go to `File → Start debugging → Attach to kernel → COM`

Use these settings:

- **Port:** `\\.\pipe\com_1`
- **Baud Rate:** `115200`
- **Pipe:** Enabled

Finally, restart the VM, and WinDbg should connect to the kernel. Once connected, you can pause the VM and start debugging the kernel and its drivers.

### Useful WinDbg Commands

#### Reading and Writing Memory

| Command           | Description                                                                                                           | Example / Usage                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| db address        | Displays memory as hexadecimal bytes alongside their ASCII representation. Useful for examining raw data and buffers. | `db 0xFFFF800012340000`          |
| dd address        | Displays memory as 32-bit DWORD values (4 bytes each). Useful for examining integers and 32-bit data.                 | `dd 0xFFFF800012340000`          |
| dq address        | Displays memory as 64-bit QWORD values (8 bytes each). Useful for examining 64-bit values and pointers.               | `dq 0xFFFF800012340000`          |
| da address        | Reads memory and displays it as a null-terminated ASCII string.                                                       | `da 0xFFFF800012340000`          |
| du address        | Reads memory and displays it as a null-terminated Unicode (UTF-16) string.                                            | `du 0xFFFF800012340000`          |
| eb address value  | Writes one or more bytes to a memory address.                                                                         | `eb 0x401000 90`                 |
| ed address value  | Writes a 32-bit DWORD value (4 bytes) to memory.                                                                      | `ed 0x401000 12345678`           |
| eq address value  | Writes a 64-bit QWORD value (8 bytes) to memory.                                                                      | `eq 0xFFFF800012340000 12345678` |
| ea address string | Writes an ASCII string to memory.                                                                                     | `ea 0x401000 "Hello"`            |
| eu address string | Writes a Unicode (UTF-16) string to memory.                                                                           | `eu 0x401000 "Hello"`            |

#### 2. Memory Expressions

| Expression   | Description                                                                                         | Example / Usage           |
| ------------ | --------------------------------------------------------------------------------------------------- | ------------------------- |
| dwo(address) | Reads a 32-bit DWORD value from a memory address.                                                   | `dwo(0x401000)`           |
| poi(address) | Reads a pointer-sized value from memory (4 bytes in a 32-bit target or 8 bytes in a 64-bit target). | `poi(0xFFFF800012340000)` |

#### 3. Symbols and Modules

| Command            | Description                                                                                                                          | Example / Usage           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| x module!pattern   | Searches for symbols (functions, variables, and other named symbols) matching a specified pattern in a module.                       | `x nt!*CreateProcess*`    |
| ln address         | Displays the nearest known symbols before or after a given address. Useful for identifying which function a pointer might reference. | `ln 0xFFFFF80012345678`   |
| lm                 | Lists the modules currently loaded in the target, including their address ranges.                                                    | `lm`                      |
| lm a address       | Identifies the loaded module that contains a specific memory address.                                                                | `lm a 0xFFFFF80012345678` |
| .symfix C:\Symbols | Configures the Microsoft Symbol Server and specifies a local folder for storing downloaded symbol files.                             | `.symfix C:\Symbols`      |
| .reload            | Reloads symbol information for the target modules. Useful after configuring the symbol path or loading new modules.                  | `.reload`                 |

#### 4. Viewing Kernel Structures

| Command                           | Description                                                                                                                                                         | Example / Usage                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| dt module!structure               | Displays the structure layout, including its fields and their offsets.                                                                                              | `dt nt!_DRIVER_OBJECT`                    |
| dt module!structure address       | Displays the actual field values of a structure stored at a specific memory address.                                                                                | `dt nt!_DRIVER_OBJECT 0xFFFF800012340000` |
| !drvobj driver 2                  | Displays information about a driver object, including the addresses of its dispatch routines. The `2` flag requests the dispatch routine entry points.              | `!drvobj \Driver\Example 2                |
| !devobj device_name               | Displays information about a device object, including its address and the associated driver object.                                                                 | !devobj FileWriterDevice                  |
| !devhandles device_object_address | Lists all processes that currently hold a handle to the specified device object. Useful for identifying which user-mode application is communicating with a driver. | !devhandles 826eb030                      |
| !object path                      | Displays objects in a given object namespace path. Commonly used to list all loaded drivers under \Driver.                                                          | !object \Driver                           |

#### 5. Disassembly and Breakpoints

| Command          | Description                                                                                                                                             | Example / Usage            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| u address        | Disassembles the instructions starting at the specified address. Useful for examining the code behind a suspicious function pointer.                    | `u 0xFFFFF80012345678`     |
| bp address       | Sets a software breakpoint at a specific address. Execution pauses when the target reaches that address.                                                | `bp 0xFFFFF80012345678`    |
| bu module!symbol | Sets a deferred breakpoint using a symbol name. It can be resolved when the corresponding module and symbol become available.                           | `bu nt!NtCreateFile`       |
| ba w4 address    | Sets a data breakpoint that pauses execution when the specified 4-byte memory location is written to. Useful for tracking changes to a structure field. | `ba w4 0xFFFF800012340000` |
| g                | Continues target execution after it has been paused by a breakpoint or manually stopped.                                                                | `g`                        |
