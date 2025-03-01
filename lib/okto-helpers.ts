// Helper functions to interact with the Okto SDK

import { OktoClient } from "@okto_web3/react-sdk";

/**
 * Get portfolio data from Okto
 */
export async function getPortfolio(oktoClient: OktoClient) {
  // According to the docs, the method is portfolio()
  return await oktoClient.portfolio();
}

/**
 * Get portfolio activity (transactions) from Okto
 */
export async function getPortfolioActivity(oktoClient: OktoClient) {
  // According to the docs, the method is portfolioActivity()
  return await oktoClient.portfolioActivity();
}

/**
 * Get NFTs from Okto
 */
export async function getPortfolioNFT(oktoClient: OktoClient) {
  // According to the docs, the method is portfolioNFT()
  return await oktoClient.portfolioNFT();
}

/**
 * Get supported chains from Okto
 */
export async function getChains(oktoClient: OktoClient) {
  // According to the docs, the method is chains()
  return await oktoClient.chains();
} 