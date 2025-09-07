# 🌐 Decentralized Humanitarian Needs Assessment Platform

Welcome to a revolutionary Web3 solution for humanitarian aid! This project enables multiple organizations (like NGOs, governments, and relief agencies) to securely share anonymized data on community needs—such as food shortages, medical requirements, or housing demands—without compromising privacy. Using the Stacks blockchain and Clarity smart contracts, it aggregates this data in a decentralized manner to provide real-time insights for better resource targeting, reducing duplication and improving aid efficiency in crisis situations.

## ✨ Features

🔒 Anonymized data submission with zero-knowledge proofs for privacy  
📊 Automated aggregation of needs data across regions and categories  
🌍 Real-time querying of aggregated insights for targeted aid deployment  
🏆 Incentive tokens for organizations contributing high-quality data  
🗳️ Governance voting for platform updates and data standards  
📝 Immutable audit trails for transparency and accountability  
🚫 Access controls to prevent unauthorized data views  
✅ Verification of data authenticity without revealing sources  

## 🛠 How It Works

This platform addresses the real-world problem of siloed data in humanitarian sectors, where organizations often operate independently, leading to inefficient aid distribution. By leveraging blockchain, it allows secure, trustless collaboration while ensuring data privacy through anonymization and aggregation.

The system involves 8 smart contracts written in Clarity, each handling a specific aspect of the data lifecycle:

1. **OrganizationRegistry.clar**: Registers participating organizations with verified identities (e.g., via STX addresses) and manages roles like "contributor" or "querier."
2. **DataSubmission.clar**: Allows registered organizations to submit anonymized data hashes (e.g., aggregated stats on needs like "100 households need water in region X") with metadata.
3. **Anonymizer.clar**: Processes submitted data to enforce anonymization rules, using hashing or simple aggregation primitives to strip identifiable info.
4. **Aggregator.clar**: Computes aggregated metrics (e.g., total needs per category/region) from multiple submissions, storing results in a tamper-proof manner.
5. **QueryEngine.clar**: Enables authorized users to query aggregated data views, with filters for regions or time periods, without exposing raw inputs.
6. **Governance.clar**: Handles DAO-style voting for proposals, such as updating data schemas or adding new categories, using token-weighted votes.
7. **IncentiveToken.clar**: Mints and distributes custom SIP-10 fungible tokens as rewards for valid data contributions, based on community validation.
8. **AuditLog.clar**: Records all interactions (submissions, queries, votes) immutably for compliance and dispute resolution.

**For Data Contributors (Organizations)**  
- Register your organization via the OrganizationRegistry contract.  
- Anonymize your local data (e.g., using off-chain tools) and submit hashes/details to DataSubmission.  
- The Anonymizer and Aggregator contracts process and merge your input with others.  
- Earn incentive tokens automatically upon validation!

**For Aid Planners (Queriers)**  
- Register and get approved access via OrganizationRegistry.  
- Use QueryEngine to fetch aggregated insights, like "Aggregate food needs in Region Y: 5000 units."  
- Participate in governance votes to refine the platform.

**For Auditors/Regulators**  
- Call AuditLog to review transaction histories.  
- Verify data integrity using built-in checks in Aggregator and VerifyOwnership-like functions.

That's it! Deploy aid more effectively while maintaining trust and privacy. Get started by deploying these Clarity contracts on the Stacks testnet and integrating with a simple frontend for submissions and queries.