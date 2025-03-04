# Aeris Wallet

![Aeris Wallet](https://img.shields.io/badge/Aeris-Wallet-4364F9?style=for-the-badge&logo=ethereum&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Optimism](https://img.shields.io/badge/Optimism-Superchain-FF0420?style=flat&logo=optimism&logoColor=white)](https://www.optimism.io/)

> Effortless login, seamless wallet management, and reliable transactions across the most popular blockchains—combining simplicity with interoperability.

<!-- ![Aeris Wallet Demo](https://via.placeholder.com/800x400?text=Aeris+Wallet+Demo) -->

## 🌟 Features

- **Web2-like Authentication**: Sign in with Google for instant Web3 wallet creation
- **Unified Asset View**: See all your tokens across multiple blockchains in one dashboard
- **One-click Transactions**: Send and receive assets with minimal friction
- **QR Code Integration**: Easily share wallet addresses and request payments
- **AI Assistant**: Manage your assets through natural language with our AI agent
- **Privacy Mode**: Hide your balances with a single tap
- **Chain Abstraction**: Seamless cross-chain operations without technical complexity

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/ottodevs/ethdenver-wallet.git aeris-wallet
cd aeris-wallet

# Install dependencies
pnpm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys
```

### Development

```bash
# Start the development server
pnpm dev

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production Build

```bash
# Build for production
pnpm build

# Start the production server
pnpm start
```

## 🏗️ Architecture

Aeris Wallet is built with a modern tech stack:

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Authentication**: NextAuth.js with Google provider
- **Blockchain Integration**: Okto SDK, Wagmi
- **Chain Abstraction**: Superchain technology
- **AI Capabilities**: AI SDK with OpenAI integration

### Key Components

- **Session Key Delegation**: Secure and convenient transaction approvals
- **Multi-chain Support**: Ethereum, Optimism, Base, Arbitrum, and more
- **Responsive Design**: Optimized for both mobile and desktop experiences

## 🔧 Technologies

<table>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nextjs/nextjs-original.svg" width="40" height="40"/><br />Next.js</td>
    <td align="center"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" width="40" height="40"/><br />React</td>
    <td align="center"><img src="https://tailwindcss.com/_next/static/media/tailwindcss-mark.d52e9897.svg" width="40" height="40"/><br />Tailwind</td>
    <td align="center"><img src="https://www.vectorlogo.zone/logos/ethereum/ethereum-icon.svg" width="40" height="40"/><br />Ethereum</td>
    <td align="center"><img src="https://assets.devfolio.co/company/e2a86d4473c649169f3d865a20b23715/assets/favicon.png" width="40" height="40"/><br />Optimism</td>
  </tr>
</table>

- [Okto SDK](https://okto.xyz) - Wallet management and session key delegation
- [Superchain](https://www.optimism.io/superchain) - Chain abstraction and cross-chain operations
- [Wagmi](https://wagmi.sh/) - React hooks for Ethereum
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [AI SDK](https://ai.vercel.ai/) - Conversational AI integration

## 🧩 Problem & Solution

### The Problem

Managing multiple crypto wallets is often complicated, requiring users to:
- Juggle different UIs
- Manually track assets across chains
- Navigate complex blockchain processes
- Remember seed phrases and private keys

This leads to confusion, errors, and a poor user experience.

### Our Solution

Aeris makes managing crypto assets easy by providing:
- A single, intuitive interface for all tokens
- Seamless onboarding with Web2-like login
- One-click functionality for cross-chain transactions
- Simplified blockchain interactions through abstraction

## 🔄 User Flow

1. **Authentication**: Users log in with Google credentials
2. **Wallet Creation**: A Web3 wallet is instantly created/accessed
3. **Dashboard**: Users see all their assets across blockchains
4. **Transactions**: Send, receive, or swap assets with minimal steps
5. **AI Assistance**: Ask the AI agent to help with transactions

## 🛠️ Development

This project was built during a hackathon, leveraging:

- Okto SDK for session key delegation
- Superchain for chain abstraction
- Next.js App Router for modern React patterns
- Tailwind CSS for responsive design
- AI SDK for natural language interactions

## 🔮 Future Roadmap

- [ ] Enhanced security features
- [ ] Additional blockchain integrations
- [ ] Advanced portfolio analytics
- [ ] DeFi protocol integrations
- [ ] Mobile app development
- [ ] Hardware wallet support

## 👥 Team

- **Jonathan Cruz** - Frontend Developer
- **Otto G** - Blockchain Engineer

## 🔗 Links

- [Live Demo](https://createyourwallet.vercel.app) (Best experienced on mobile)
- [GitHub Repository](https://github.com/yourusername/aeris-wallet)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with ❤️ during the ETHDenver Hackathon</sub>
</p>
