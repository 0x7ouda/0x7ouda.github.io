---
title: 'The Art of Memory Forensics Chapter-02'
date: 2026-09-29 00:00:00
category: 'The Art of Memory Forensics'
tags: [The art of memory forensics]
cover: /images/notes/chapter-2-the-art-of-memory/0.png
description: 'Brief notes summarizing Chapter 2 of The Art of Memory Forensics, focusing on different data structures, how they are organized and stored in memory, and how they are interpreted during memory analysis.'
toc: true
---

## Data Structures

Data structures define how program and operating system data is organized in memory. Understanding their layout is essential in memory forensics because it helps analysts correctly interpret raw memory, choose appropriate analysis techniques, recognize malicious modifications, understand the limitations of forensic methods, and infer previous operations performed on the data. This chapter reviews the common data structure concepts used throughout the rest of the book.

The book focuses on basic C data types because C is widely used in systems programming and provides direct control over memory. A pointer stores a virtual memory address and can reference any type of data. To access the data referenced by a pointer, the address must be dereferenced and translated from virtual to physical memory. Therefore, the ability to perform virtual address translation is essential for analyzing many data structures in physical memory.

![image](/images/notes/chapter-2-the-art-of-memory/1.png)

## Array

An array is a fixed-size collection of elements of the same data type stored contiguously in memory. The address of an element can be calculated using `Address(I) = Base Address + (Index × Element Size)`, which allows efficient random access.

Arrays are frequently encountered in memory forensics, including arrays of pointers, `file descriptor tables`, and driver dispatch tables such as Windows `MajorFunction`. Recognizing array patterns in raw memory can help analysts enumerate elements and understand how unknown memory regions are organized.

## Bitmaps

A bitmap is an array of bits used to represent a set of objects efficiently. Each bit indicates whether a corresponding object is active, allocated, or belongs to a particular set. In memory forensics, bitmaps can help identify states such as allocated memory, priorities, or in-use network ports.

**For example,** Windows can use a bitmap to track allocated network ports. If the first byte is 0x4E, which is 01001110 in binary, the set bits indicate that ports 1, 2, 3, and 6 are currently in use.

## Records

A record is a structured group related fields that may have different data types. In C, structures are stored in contiguous memory, and each field is accessed using a fixed offset from the structure’s base address. Correct interpretation requires knowing the structure layout, field sizes, and compiler-added padding.
Example:

```c
struct Connection {
    short id;
    short port;
    unsigned long addr;
    char hostname[32];
};
```

For this structure, the fields are stored at fixed offsets:

```text
Offset 0  → id
Offset 2  → port
Offset 4  → addr
Offset 8  → hostname
```

Volatility uses symbol information to parse known operating system structures, while structure layouts and field constraints can also help identify possible instances directly in raw memory.

## Strings

Strings are one of the most important data types encountered during memory analysis because they often contain human-readable information such as process names, filenames, URLs, commands, passwords, configuration values, and other application data.

A C-style string is essentially an array of characters stored using an encoding such as ASCII. Unlike a fixed-size array, the logical length of the string is determined by a termination character. In C-style strings, the NULL byte (`0x00`) marks the end of the string. For example, the string **Hello** may appear in memory as `48 65 6C 6C 6F 00`. The number of characters before the NULL terminator defines the string length.

Windows also commonly uses the `_UNICODE_STRING` structure. Instead of storing the characters directly inside the structure, `_UNICODE_STRING` stores metadata about the string: Length, MaximumLength, and a Buffer pointer. The Buffer field contains the virtual address of the actual string data, which is usually encoded using UTF-16. On 64-bit Windows, Length and MaximumLength are stored first, while the Buffer pointer is stored later in the structure.

To recover a `_UNICODE_STRING`, an investigator must read the structure, obtain the Buffer virtual address, translate that address if necessary, read the number of bytes specified by Length, and decode the resulting data as UTF-16. This makes virtual-to-physical address translation important when analyzing strings referenced by pointers.
String extraction can also be affected by paging.

A string may cross a page boundary, and if one of the required pages is not resident in physical memory when the memory image is acquired, the string may appear incomplete. Similarly, `_UNICODE_STRING` metadata and the actual buffer contents may exist in different memory locations, so finding one does not always guarantee that the other is available.
In memory forensics, strings are useful not only because of their contents, but also because of their context. Nearby strings and surrounding memory can help identify unknown regions. For example, finding URLs near references to temporary Internet files may indicate remnants of browser-related data.

## Linked List

A linked list is a dynamic data structure in which elements are connected using pointers instead of being stored contiguously in memory. Unlike an array, linked-list elements may be scattered across different virtual memory locations, so they are accessed sequentially by following the stored pointers.

A **singly** linked list contains a pointer to the next element, a **doubly** linked list contains pointers to both the previous and next elements, and a **circular** linked list connects the last element back to the beginning.

Windows frequently uses embedded **doubly** linked lists. A structure such as `_LIST_ENTRY64` contains two pointers: `Flink`, which points to the next list entry, and `Blink`, which points to the previous one.
Because `_LIST_ENTRY64` may be embedded inside a larger structure such as `_EPROCESS`, the address of the containing structure can be calculated by subtracting the offset of the embedded list entry from the address stored in the link.This is especially important in memory forensics because malware may hide an object by modifying only a few list pointers.

**For example**, a process list may originally contain `Process A ↔ Process B ↔ Malware X ↔ Process C`. If the malware modifies the links so that Process B points directly to Process C, the malicious process may disappear from normal list traversal even though its `_EPROCESS` structure still remains in physical memory. Virtual memory analysis may therefore miss the unlinked process, while physical memory scanning can still recover the hidden or deleted structure.

## Hash Table

A hash table stores data as key-value pairs and uses a hash function to convert a key into an index within an array. A common implementation used in operating systems is a chained-overflow hash table, where each array entry points to a linked list containing elements associated with that index.

This structure provides efficient searching because the hash function narrows the search to a small subset of elements.

**For example**, if 64,000 elements are distributed across 16,000 array indexes, an ideal distribution would require searching only about four elements in the selected bucket instead of traversing all 64,000 elements.

Linux uses a process ID hash table to associate process IDs with process structures. Memory-forensics tools can use this hash table to locate active processes efficiently by hashing a PID, selecting the corresponding bucket, and traversing the linked list associated with that entry.

## Tree

A tree is a dynamic hierarchical data structure made of nodes connected by links. Each node stores a key and may point to one or more child nodes. In a binary tree, each node can have at most two children: a left child and a right child. The top node is called the root, nodes with no children are called leaves, and a node together with all of its descendants forms a subtree.

Tree traversal is the process of visiting nodes in a defined order. The main traversal methods are preorder, inorder, and postorder. In an ordered binary tree, inorder traversal visits the left subtree, then the current node, then the right subtree, which produces the stored elements in sorted order.

In memory, tree nodes are usually dynamically allocated and may be scattered across different virtual memory locations. The links between nodes are implemented as pointers, so virtual memory analysis can follow these pointers to reconstruct the relationships between nodes. Physical memory scanning may find individual nodes, but it may not reveal their ordering or parent-child relationships.

Windows uses tree structures when fast lookup is important. A major example is the Virtual Address Descriptor (VAD) tree, which organizes the virtual memory ranges used by a process. Lower address ranges are stored in the left subtree and higher ranges in the right subtree. By traversing the VAD tree, especially using inorder traversal, memory-forensics tools can recover an ordered view of a process’s virtual address space.

### At the end of this chapter, we learned about different data structures, how they are organized and stored in memory, and how they can be interpreted during analysis. This knowledge becomes especially useful when you need to inspect raw memory manually, investigate suspicious or malicious behavior, or understand how forensic plugins work internally to locate and interpret operating system structures, If you notice any issues in the explanation or any incorrect concepts, please feel free to contact me. Thank you.
