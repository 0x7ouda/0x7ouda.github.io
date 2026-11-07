---
title: 'PMA Part-01'
date: 2026-11-2 00:00:00
category: 'Practical Malware Analysis'
tags: [PMA]
cover: /images/notes/PMA-01/0.webp
description: 'Chapters 0–4 of *Practical Malware Analysis (PMA)*. Along the way, we covered the basics of static and dynamic analysis, as well as some fundamental assembly instructions.'
toc: true
---

## Chapter 1

### Malware Analysis Techniques

#### Basic Static Analysis

Basic static analysis is the simplest method of malware analysis. It involves examining an executable file without running it or inspecting its assembly instructions. It can provide basic information about the executable, reveal clues about its functionality, and sometimes help create simple network signatures.

#### Advanced Static Analysis

Advanced static analysis involves loading an executable into a disassembler and examining its assembly instructions to understand the program's logic and functionality without executing it. Unlike basic static analysis, this technique requires knowledge of assembly language.

#### Basic Dynamic Analysis

Basic dynamic analysis involves running malware in a safe, isolated environment and observing its behavior. It can help analysts understand the malware's functionality, develop detection signatures, and determine how to remove an infection from a compromised system.

#### Advanced Dynamic Analysis

Advanced dynamic analysis involves running malware inside a debugger in a safe, isolated environment to examine its execution step by step. Unlike basic dynamic analysis, it allows analysts to inspect internal program behavior and understand functionality that may not be visible through basic dynamic analysis.

### General Rules for Malware Analysis

- **Don't Get Too Caught Up in the Details:** Most malware programs are large and complex, so focus on their key features and try to get a general overview before diving into complex details.

- **Use Different Tools and Techniques:** There is no single technique that works for every situation. If one tool or technique doesn't work, try another approach or analyze the malware from a different angle.

- **Malware Analysis Is a Cat-and-Mouse Game:** Malware analysts and malware developers are constantly competing. As analysts develop new analysis techniques, malware developers create new anti-analysis techniques to make malware harder to analyze.

### BASIC STATIC TECHNIQUES

#### Antivirus Scanning

The first technique is scanning a malware sample with multiple antivirus engines to determine whether it is malicious.

However, antivirus scanning is not always reliable because antivirus engines rely mainly on known **malware signatures and heuristic analysis**. Malware developers can modify their code to change its signature and evade detection.

One of the most useful tools is **VirusTotal**, which allows us to upload a file and scan it using multiple antivirus engines. We can also search for a file using its hash to view previous scan results if the file already exists in the VirusTotal database.

**Note:** If no antivirus engine detects the file, it does not necessarily mean the file is safe.

#### Finding Strings

**Finding Strings**

Strings are sequences of characters found inside an executable file. They can provide a quick overview of the program's functionality by revealing information such as **URLs**, **IP addresses**, and names of **functions** used by the program.

However, not all extracted strings are valid. Some may actually be assembly instructions, memory addresses, or other binary data that are incorrectly interpreted as characters.

Strings are commonly stored in two formats:

- **ASCII:** Uses one byte per character, with a NULL terminator `0x00` at the end of a null-terminated string.
- **Unicode (UTF-16LE):** Uses two bytes for each basic English character, typically with a NULL byte after each character and two NULL bytes `0x0000` as the string terminator.

```bash
C:>strings bp6.ex_
VP3
VW3
t$@
D$4
99.124.22.1
e-@
GetLayout
GDI32.DLL
SetLayout
M}C
Mail system DLL is invalid.!Send Mail failed to send message.
```

### Packed and Obfuscated Malware

Malware developers use **packing and obfuscation techniques** to make malware harder to detect and analyze.

Packing involves compressing or encrypting the original executable and adding a small wrapper program called an **Unpacking Stub**. When the packed executable runs, the stub executes first, unpacks the original code into memory, and then transfers execution to it.

![image](/images/notes/PMA-01/1.webp)

While the executable is packed, most of its original strings, imports, and other information are hidden from static analysis tools.

One of the tools used to detect packed executables is **PEiD**, which uses signatures to identify the packer or compiler used and sometimes its version.

![image](/images/notes/PMA-01/2.webp)

### Portable Executable File Format

The Portable Executable (PE) format is a file format used by Windows for executable files (EXE), dynamic-link libraries (DLLs), and related object code formats.

PE files contain headers that provide important information needed by Windows to load the program, **such as memory requirements, imported functions, application type, and code information.**

As a malware analyst, examining the PE headers can help you understand some of the executable's functionality without running it. However, this information does not necessarily reveal exactly what the program does.

#### Dependency Walker

![image](/images/notes/PMA-01/3.webp)

Dependency Walker is a tool used to examine the DLLs that an executable depends on and the functions it imports from them.

It allows us to identify imported functions by name or by ordinal. If a function is imported by ordinal, we can examine the DLL's exported functions to try to identify its name.

This information can help malware analysts understand some of the executable's functionality without running it.

#### Common Windows DLLs

| DLL                          | Description                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| **Kernel32.dll**             | Provides core Windows functions for managing memory, files, processes, and hardware.    |
| **Advapi32.dll**             | Provides access to advanced Windows features, such as the Registry and Service Manager. |
| **User32.dll**               | Provides user interface functions, such as windows, buttons, and user input handling.   |
| **Gdi32.dll**                | Provides functions for displaying and manipulating graphics.                            |
| **Ntdll.dll**                | Provides low-level Windows functions and an interface to the Windows kernel.            |
| **WSock32.dll / Ws2_32.dll** | Provide networking functions for network communication.                                 |
| **Wininet.dll**              | Provides high-level networking functions for protocols such as HTTP and FTP.            |

#### Exported Functions

Just as an EXE can import functions from DLLs, it can also export functions that other programs can use.

Exported functions are common in DLLs but relatively rare in EXE files. If an executable contains exported functions, they may provide useful information about its functionality.

We can also use **Dependency Walker** to examine the exported functions of an EXE or DLL.

### Static Analysis in Practice

The book provides an example of a potential keylogger and shows a partial list of functions imported from different DLLs.

![image](/images/notes/PMA-01/4.webp)

Malware can import many functions, so we should focus on the important ones to identify clues about its potential behavior.

For example:

- **Process Operations:** Functions like `OpenProcess` and `GetCurrentProcess` indicate operations related to processes.
- **Memory Management:** Functions like `GetProcessHeap` indicate memory-related operations.
- **File Operations:** Functions like `CreateFileW`, `ReadFile`, and `WriteFile` indicate file operations.
- **Registry Operations:** Functions from `Advapi32.dll`, such as `RegOpenKeyExW` and `RegSetValueExW`, indicate interactions with the Windows Registry.
- **Keyboard Monitoring:** Functions like `SetWindowsHookExW` may indicate keyboard monitoring or keylogging capabilities.

By examining important imported functions, we can make educated guesses about the malware's functionality without executing it.

### The PE File Headers and Sections

The PE headers contain more than just import information. They also include a section table that describes the different sections of the executable.

#### Common PE Sections

| Section  | Description                                                                             |
| -------- | --------------------------------------------------------------------------------------- |
| `.text`  | Contains the executable instructions that the CPU executes.                             |
| `.rdata` | Contains read-only data and may include import and export information.                  |
| `.data`  | Contains initialized global and static data, typically writable.                        |
| `.rsrc`  | Contains resources such as icons, images, menus, and strings.                           |
| `.idata` | Contains import information about DLLs and imported functions.                          |
| `.edata` | Contains export information about functions or symbols made available to other modules. |

Section names may vary depending on the compiler or linker. For example, one compiler may use `.text` for executable code, while another may use `.code`.

Windows does not rely on section names to determine their memory permissions. Instead, the Windows loader uses information from the PE headers and section table, especially the section characteristics, such as Read, Write, and Execute permissions.

#### PEview

`PEview` is a tool that allows us to browse the PE headers and examine useful information about an executable, such as its **compilation timestamp, architecture, subsystem, sections, and their sizes and characteristics**.

![image](/images/notes/PMA-01/5.webp)

It also allows us to compare the Virtual Size of a section (its size in memory) with its Size of Raw Data (its size on disk).

A large difference between these values may indicate that the executable is packed, although this is not always the case.

#### Resource Hacker

![image](/images/notes/PMA-01/6.webp)

Resource Hacker is a tool used to explore the `.rsrc` section of a PE file and examine its resources, such as:

- **Icons:** Images and icons associated with the executable.
- **Menus:** Menus used by the program, which may provide clues about its functionality.
- **Dialogs:** Dialog windows that can help identify the program's purpose.
- **String Table:** Strings stored in the resource section.
- **Version Info:** Information such as the program's version, company name, and copyright.

**Note:** Malware may store embedded executables or drivers inside the `.rsrc` section and extract them during execution.Resource Hacker allows analysts to extract these embedded files for further analysis.

There are many other tools available for PE file analysis, such as PEBrowse and PE Explorer. You are not limited to the tools mentioned above.

## Chapter 3

### Basic Dynamic Analysis

Basic dynamic analysis is usually the next step after basic static analysis. It involves running malware in a safe, isolated environment to observe its actual behavior.

Unlike static analysis, which reveals potential functionality, dynamic analysis allows us to observe what the malware actually does during execution. The presence of code does not necessarily mean that it will be executed.

Malware may have different behaviors depending on specific inputs or execution conditions. Therefore, dynamic analysis may not reveal all of its functionality.

### Sandbox

A sandbox is an isolated environment used to execute malware, observe its behavior, and generate an analysis report.Different sandboxes may offer different features, but they generally follow the same principle of executing suspicious files in a controlled environment and monitoring their behavior.

Some free online malware sandboxes include:

- **ANY.RUN**
- **Hatching Triage**
- **Joe Sandbox Cloud Basic**

However, sandbox reports may not reveal all malware behaviors because some actions depend on specific execution conditions.

We can also create our own isolated virtual machine for dynamic malware analysis using tools such as **FLARE-VM**, which provides a collection of malware analysis and reverse engineering tools for Windows virtual machines.

### Running Malware

Running malware is an important part of dynamic analysis. PE files can be either EXEs or DLLs, and each is executed differently.

- **EXE:** Can be executed directly by double-clicking the file or running it from the command line.
- **DLL:** Cannot be executed directly like an EXE. We can use `rundll32.exe` to load the DLL into a process and call one of its exported functions, either by its name or ordinal number.

#### Using rundll32.exe

```bash
# By function name
rundll32.exe sample.dll,ExportName`

# By ordinal

rundll32.exe sample.dll,#5
```

### procmon

Procmon is a tool used to monitor system activity in real time, including Registry, file system, network, and process/thread activity.

Since the system generates a huge number of events, Procmon provides filters to help us focus on the events we are interested in.

We can filter events based on different properties, such as:

- **Process Name:** Show events related to a specific process.
- **PID:** Filter events by Process ID.
- **Operation:** Show specific operations, such as `CreateFile` or `RegSetValue`.
- **Path:** Filter events related to a specific file or Registry path.
- **Result:** Show the results of operations, such as `SUCCESS` or `ACCESS DENIED`.

This makes it easier to identify the changes and activities performed by malware during execution.

### Process Explorer

Process Explorer is like Task Manager, but with more advanced features that make it useful for malware analysis.It allows us to view running processes in a tree structure, showing the relationships between parent and child processes.

We can also examine more details about each process, such as:

- **Threads:** View the threads running inside a process.
- **DLLs:** See which DLLs are loaded by a process.
- **Handles:** View the resources a process is using, such as files, registry keys, and mutexes.
- **Verify:** Check the executable's digital signature to verify its publisher and integrity.
- **Strings:** View and compare strings found in the executable on disk and in memory.

Process Explorer also allows us to launch **Dependency Walker** on an executable or DLL, if the integration is available.

**Note:** A valid digital signature does not necessarily mean that a file is safe.

### regshot

Regshot is a registry comparison tool that allows us to take two snapshots of the Windows Registry, one before running the malware and another after execution.

It compares the two snapshots and generates a report showing the changes, such as added or deleted registry keys and modified values.This helps us identify registry changes that may have been made by the malware.

### Faking a Network

Malware often communicates with a Command and Control (C2) server. We can simulate network services to observe its network behavior without connecting to the real Internet.

Two useful tools for this are:

- **FakeNet-NG:** Intercepts and redirects malware network traffic while simulating services such as DNS, HTTP, and HTTPS. This helps us identify network indicators and understand how the malware communicates.

- **Wireshark:** Captures and analyzes network packets, allowing us to inspect DNS requests, connections, and other network traffic generated by the malware.

## Disassembly Crash Course

### The x86 Architecture

The x86 architecture follows the Von Neumann architecture, which consists of three main components:

- **CPU:** Responsible for executing instructions.
- **RAM:** Stores the program's code and data.
- **I/O System:** Handles communication with external devices.

The CPU itself contains several components:

- **ALU (Arithmetic Logic Unit):** Performs arithmetic and logical operations.
- **Control Unit:** Controls instruction execution and uses the Instruction Pointer (EIP) to locate the next instruction in memory.
- **Registers:** Small, fast storage locations inside the CPU used to hold data and addresses during execution.

![image](/images/notes/PMA-01/7.webp)

### Main Memory

When a program runs, its memory can be divided into four main regions:

- **Data:** Stores global and static variables, including values initialized when the program is loaded.

- **Code:** Contains the instructions that the CPU executes.

- **Heap:** Used for dynamic memory allocation during execution. The program can allocate memory when needed and free it when it's no longer required.

- **Stack:** Used to store local variables, function parameters, and return addresses. It also helps manage function calls and program flow.

### Instructions, Opcodes, and Endianness

**Instruction:** A complete operation executed by the CPU. In x86 assembly, an instruction consists of a mnemonic and zero or more operands, such as `mov ecx, 0x44`.

**Opcode:** The part of a machine instruction that tells the CPU which operation to perform. For example, `B9` is the opcode for moving an immediate value into the ECX register. A disassembler translates machine code into readable assembly instructions.

**Endianness:** The order in which bytes of a multi-byte value are stored in memory. There are two types:

- **Big-Endian:** Stores the most significant byte at the lowest memory address.
- **Little-Endian:** Stores the least significant byte at the lowest memory address. The x86 architecture uses this format.

For example, the value `0x12345678` is stored as:

- Big-Endian: `12 34 56 78`
- Little-Endian: `78 56 34 12`

### Operands

Operands specify the data or locations used by an instruction. There are three types:

- **Immediate Operand:** A fixed value written directly in the instruction, such as `0x33`.
- **Register Operand:** Refers to a CPU register, such as `EAX` or `ECX`.
- **Memory Operand:** Refers to a memory location containing the data, usually written inside brackets, such as `[EAX]`.

### Registers

Registers are small, fast storage locations inside the CPU, used to temporarily store data and addresses during instruction execution. They allow the CPU to access frequently needed values quickly without having to access RAM every time.

In the 32-bit x86 architecture, general-purpose registers are 32 bits in size, but some can also be accessed through their 16-bit or 8-bit portions.

#### General Registers

General registers are used by the CPU to temporarily store data or memory addresses during execution.

Although they can be used for different purposes, some registers have common uses based on instruction requirements and compiler conventions.

##### Common x86 Registers

| Register | Common Usage                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------- |
| **EAX**  | Accumulator register, commonly used for arithmetic operations and function return values.       |
| **EBX**  | Base register, often used for general-purpose data storage and addressing.                      |
| **ECX**  | Counter register, commonly used in loops and shift operations.                                  |
| **EDX**  | Data register, used with EAX in multiplication and division operations.                         |
| **ESI**  | Source Index, commonly used as a source pointer in string and memory operations.                |
| **EDI**  | Destination Index, commonly used as a destination pointer in string and memory operations.      |
| **EBP**  | Base Pointer, commonly used to access local variables and function parameters in a stack frame. |

**Note:** These are common uses, not strict rules. Some instructions require specific registers, while others can use different registers.

#### EFLAGS Register

The EFLAGS register is a 32-bit (4-byte) status register that contains multiple flags Each flag can be either set (1) or cleared (0). These flags indicate the results of certain operations or help control CPU behavior.

##### Important Flags

| Flag   | Name       | Description                                                                                                   |
| ------ | ---------- | ------------------------------------------------------------------------------------------------------------- |
| **ZF** | Zero Flag  | Set to 1 when the result of an operation is zero.                                                             |
| **CF** | Carry Flag | Set to 1 when an unsigned arithmetic operation produces a carry or borrow.                                    |
| **SF** | Sign Flag  | Set to 1 when the most significant bit of the result is 1, indicating a negative result in signed arithmetic. |
| **TF** | Trap Flag  | Enables single-step debugging by causing a debug exception after an instruction executes.                     |

#### EIP (Instruction Pointer)

EIP is a 32-bit register that holds the memory address of the next instruction to be executed by the CPU.

### Simple Instructions

### mov

The `mov` instruction is one of the simplest and most commonly used instructions in x86 assembly. It copies data between registers and memory or loads an immediate value.

**Syntax:** `mov destination, source`

| Instruction            | Description                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `mov eax, ebx`         | Copies the value of EBX into EAX.                                                        |
| `mov eax, 0x42`        | Stores the value 0x42 in EAX.                                                            |
| `mov eax, [0x4037C4]`  | Copies 4 bytes from memory address 0x4037C4 into EAX.                                    |
| `mov eax, [ebx]`       | Copies 4 bytes from the memory address stored in EBX into EAX.                           |
| `mov eax, [ebx+esi*4]` | Calculates the memory address EBX + ESI*4 and copies 4 bytes from that address into EAX. |

### lea

The `lea` (Load Effective Address) instruction calculates a memory address and stores the result in a register without accessing the memory contents.

**Syntax:** `lea destination, source`

| Instruction          | Description                                        |
| -------------------- | -------------------------------------------------- |
| `lea eax, [ebx+8]`   | Calculates EBX + 8 and stores the address in EAX.  |
| `lea ebx, [eax*4+4]` | Calculates EAX*4 + 4 and stores the result in EBX. |

### Arithmetic and Logical Instructions

x86 assembly provides instructions for arithmetic, logical operations, bit shifting, and rotation.

###3 Arithmetic Instructions

| Instruction | Description                             |
| ----------- | --------------------------------------- |
| `ADD`       | Adds a value to the destination.        |
| `SUB`       | Subtracts a value from the destination. |
| `INC`       | Increases a value by 1.                 |
| `DEC`       | Decreases a value by 1.                 |
| `MUL`       | Unsigned multiplication.                |
| `IMUL`      | Signed multiplication.                  |
| `DIV`       | Unsigned division.                      |
| `IDIV`      | Signed division.                        |

**Important Notes:**

- `ADD` and `SUB` update flags such as ZF and CF.
- `INC` and `DEC` do not modify CF.
- For 32-bit `MUL`, EAX is multiplied by the operand, and the 64-bit result is stored in `EDX:EAX`.
- For 32-bit `DIV`, `EDX:EAX` is divided by the operand. The quotient is stored in EAX, and the remainder is stored in EDX.

### Logical Instructions

| Instruction | Description                                    |
| ----------- | ---------------------------------------------- |
| `AND`       | Sets a bit to 1 only if both bits are 1.       |
| `OR`        | Sets a bit to 1 if at least one bit is 1.      |
| `XOR`       | Sets a bit to 1 if the two bits are different. |

**Note:** `xor eax, eax` is commonly used to set EAX to zero because it requires fewer bytes than `mov eax, 0`.

### Shift and Rotate Instructions

| Instruction | Description                                                                  |
| ----------- | ---------------------------------------------------------------------------- |
| `SHL`       | Shifts bits to the left, filling empty positions with zeros.                 |
| `SHR`       | Shifts bits to the right, filling empty positions with zeros.                |
| `ROL`       | Rotates bits to the left, moving bits that leave one end back to the other.  |
| `ROR`       | Rotates bits to the right, moving bits that leave one end back to the other. |

**Important Notes:**

- Shifting left by `n` bits is equivalent to multiplying by `2^n`, ignoring overflow.
- Shifting right by one bit divides an unsigned value by 2, discarding the remainder.
- The last bit shifted out is stored in CF.
- Unlike shifting, rotation does not discard bits.

### NOP Instruction

`NOP` (No Operation) does nothing and simply moves execution to the next instruction.

- Its opcode is `0x90`.
- It is sometimes used as padding or in NOP sleds during exploitation.

#### Notes

- Repeated use of `XOR`, `AND`, `OR`, `SHL`, `SHR`, `ROL`, or `ROR` may indicate encryption or compression routines.
- These instructions alone do not prove that encryption or compression is being used.
- Avoid analyzing every instruction in a complex routine unless necessary.

### The Stack

The stack is a memory region used to store local variables, function arguments, and return addresses during function calls.

It follows the **LIFO (Last In, First Out)** principle, meaning the last value pushed onto the stack is the first one popped off.

The stack grows toward **lower memory addresses**.

![image](/images/notes/PMA-01/8.webp)

### Stack Registers

| Register                | Description                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **ESP (Stack Pointer)** | Points to the top of the stack. It decreases when values are pushed and increases when they are popped.                   |
| **EBP (Base Pointer)**  | Usually acts as a fixed reference point for accessing local variables, arguments, and return addresses within a function. |

### Stack Instructions

| Instruction      | Description                                                 |
| ---------------- | ----------------------------------------------------------- |
| `PUSH`           | Adds a value to the stack.                                  |
| `POP`            | Removes a value from the stack.                             |
| `CALL`           | Calls a function and saves the return address on the stack. |
| `RET`            | Returns to the caller using the saved return address.       |
| `ENTER`          | Sets up a stack frame.                                      |
| `LEAVE`          | Restores the previous stack frame.                          |
| `PUSHA / PUSHAD` | Save multiple registers on the stack (16-bit / 32-bit).     |
| `POPA / POPAD`   | Restore multiple registers from the stack.                  |

### Function Calls

Functions are blocks of code that perform specific tasks. When a function is called, execution moves to that function and returns to the caller when it finishes.

The way functions manage arguments and the stack depends on the **Calling Convention**. One of the most common conventions in 32-bit x86 is **cdecl**.

### How Function Calls Work (cdecl)

1. The caller pushes the function arguments onto the stack.
2. The `CALL` instruction saves the return address and transfers execution to the function.
3. The function sets up its stack frame and allocates space for local variables.
4. The function executes its code.
5. Before returning, the stack frame is restored.
6. The `RET` instruction restores the return address into EIP.
7. The caller cleans up the arguments from the stack.

### Function Prologue and Epilogue

- **Prologue:** Usually appears at the beginning of a function. It saves the previous EBP, sets up a new stack frame, and allocates space for local variables.

```asm
push ebp
mov ebp, esp
sub esp, 0x10
```

- **Epilogue:** Usually appears at the end of a function. It restores the stack and the previous EBP before returning to the caller. The `LEAVE` instruction can be used for this.

```asm
mov esp, ebp
pop ebp
ret
```

### Stack Frame Layout

Each function call typically uses its own **Stack Frame** to manage the data needed during execution.

A typical stack frame contains:

- **Local Variables:** Temporary data used by the function.
- **Saved EBP:** The base pointer from the calling function.
- **Return Address:** The address where execution continues after the function returns.
- **Arguments:** Values passed to the function.

In a typical EBP-based stack frame, local variables are accessed using negative offsets from EBP `mov eax, [ebp-4]`, while arguments are accessed using positive offsets `mov eax, [ebp+4]`.

ESP changes as the stack is used, while EBP usually stays fixed during the function.

### Saving Registers

The `PUSHA` and `PUSHAD` instructions save multiple registers on the stack, while `POPA` and `POPAD` restore them, These instructions are sometimes found in shellcode or manually written assembly to preserve register values during execution.

### Conditionals

Conditionals are used to compare values and help the program make decisions based on the results.

Two common instructions are `TEST` and `CMP`.

- **TEST:** Works like a bitwise AND operation but doesn't modify the operands. It only updates the flags and is commonly used to check whether a value is zero.

```asm
mov eax, 0
test eax, eax
```

The result of the AND operation is zero, so `ZF = 1`. EAX remains unchanged.

- **CMP:** Works like SUB by subtracting the source from the destination, but without storing the result. It updates flags such as ZF and CF.

```asm
mov eax, 3
cmp eax, 5
```

CMP internally calculates `3 - 5` without changing EAX.

- `ZF = 0` because the result is not zero.
- `CF = 1` because 3 is less than 5 in an unsigned comparison.

### Branching

Branching is used to change the program's execution flow using jump instructions.

There are two main types:

- **Unconditional Jump:** `JMP` transfers execution to another address without checking any condition.
- **Conditional Jumps (Jcc):** Transfer execution based on certain conditions, usually determined by flags set by previous instructions like `CMP` or `TEST`.

### Common Jump Instructions

| Instruction | Description                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| `JMP`       | Always transfers execution to the target address, without checking any condition.                           |
| `JZ`        | Jumps when the previous operation produced a zero result (ZF = 1).                                          |
| `JNZ`       | Jumps when the previous operation produced a non-zero result (ZF = 0).                                      |
| `JE`        | Usually used after CMP. Jumps when the two compared values are equal (ZF = 1).                              |
| `JNE`       | Usually used after CMP. Jumps when the two compared values are different (ZF = 0).                          |
| `JG`        | Jumps when the destination is greater than the source in a signed comparison (ZF = 0 and SF = OF).          |
| `JGE`       | Jumps when the destination is greater than or equal to the source in a signed comparison (SF = OF).         |
| `JA`        | Jumps when the destination is above the source in an unsigned comparison (CF = 0 and ZF = 0).               |
| `JAE`       | Jumps when the destination is above or equal to the source in an unsigned comparison (CF = 0).              |
| `JL`        | Jumps when the destination is less than the source in a signed comparison (SF != OF).                       |
| `JLE`       | Jumps when the destination is less than or equal to the source in a signed comparison (ZF = 1 or SF != OF). |
| `JB`        | Jumps when the destination is below the source in an unsigned comparison (CF = 1).                          |
| `JBE`       | Jumps when the destination is below or equal to the source in an unsigned comparison (CF = 1 or ZF = 1).    |
| `JO`        | Jumps when the previous operation caused signed overflow (OF = 1).                                          |
| `JS`        | Jumps when the Sign Flag is set (SF = 1), meaning the result has its sign bit set.                          |
| `JECXZ`     | Jumps when ECX contains zero. It checks the register directly, not the flags.                               |

Conditional jumps help us understand how a program makes decisions and chooses which code to execute.

### rep

`rep` is an instruction prefix used to repeat certain operations on data buffers instead of writing the same instruction multiple times.

It is commonly used with instructions like `MOVSB`, `CMPSB`, `SCASB`, and `STOSB` to copy, compare, search, or fill memory.

### Registers Used

| Register | Description                                                                          |
| -------- | ------------------------------------------------------------------------------------ |
| `ESI`    | Holds the source memory address when reading or comparing data.                      |
| `EDI`    | Holds the destination memory address used for writing, comparing, or searching.      |
| `ECX`    | Holds the number of times the instruction should repeat.                             |
| `AL`     | Holds the byte used when searching or filling memory. It is the lower 8 bits of EAX. |

### REP Prefixes

| Prefix          | Description                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| `REP`           | Repeats an instruction until ECX reaches zero. Commonly used to copy or fill memory.                         |
| `REPE / REPZ`   | Keeps comparing bytes as long as they match (ZF = 1). Stops when a difference is found or ECX reaches zero.  |
| `REPNE / REPNZ` | Keeps comparing bytes as long as they don't match (ZF = 0). Stops when a match is found or ECX reaches zero. |

#### Examples

**1. REP MOVSB — Copying Data**

```asm
mov ecx, 5
rep movsb
```

Copies 5 bytes from the source buffer at ESI to the destination buffer at EDI.

**2. REPE CMPSB — Comparing Data**

```asm
mov ecx, 5
repe cmpsb
```

Compares up to 5 bytes from two buffers, stopping when a difference is found or ECX reaches zero.

**3. REPNE SCASB — Searching for a Byte**

```asm
mov ecx, 5
repne scasb
```

Searches up to 5 bytes in the buffer at EDI for the value stored in AL. It stops when the value is found or ECX reaches zero.

**4. REP STOSB — Filling Memory**

```asm
mov al, 0
mov ecx, 5
rep stosb
```

Fills 5 bytes of memory at EDI with zero.

### C Main Method and Offsets

In C, the `main` function receives two parameters:

- **argc:** The number of command-line arguments, including the program name.
- **argv:** A pointer to an array of strings containing those arguments.

When C code is compiled into assembly, the program uses **memory addresses and offsets** to access variables and arguments.

#### C Code

```c
int main(int argc, char* argv[])
{
    if (argc != 3) {
        return 0;
    }

    if (strncmp(argv[1], "-r", 2) == 0) {
        DeleteFileA(argv[2]);
    }

    return 0;
}
```

The program checks whether three command-line arguments were provided. It then compares the first two characters of `argv[1]` with `"-r"`. If they match, it passes `argv[2]` to `DeleteFileA`.

### Assembly Code

```asm
004113CE cmp [ebp+argc], 3
004113D2 jz short loc_4113D8
004113D4 xor eax, eax
004113D6 jmp short loc_411414
004113D8 mov esi, esp
004113DA push 2                 ; MaxCount
004113DC push offset Str2       ; "-r"
004113E1 mov eax, [ebp+argv]
004113E4 mov ecx, [eax+4]
004113E7 push ecx               ; Str1
004113E8 call strncmp
004113F8 test eax, eax
004113FA jnz short loc_411412
004113FC mov esi, esp
004113FE mov eax, [ebp+argv]
00411401 mov ecx, [eax+8]
00411404 push ecx               ; lpFileName
00411405 call DeleteFileA
```

#### Understanding the Assembly

- `[ebp+argc]` accesses `argc` directly from memory.
- `CMP` and `JZ` check whether `argc` equals 3.
- `[eax+4]` accesses `argv[1]`, which is passed to `strncmp`.
- `TEST` and `JNZ` check whether the string comparison returned zero.
- `[eax+8]` accesses `argv[2]`, which is passed to `DeleteFileA`.

## At the end

We've now finished Chapters 0–4 of _Practical Malware Analysis (PMA)_. Along the way, we covered the basics of static and dynamic analysis, as well as some fundamental assembly instructions.

### If you notice any mistakes or incorrect concepts, feel free to contact me Thank you!.
