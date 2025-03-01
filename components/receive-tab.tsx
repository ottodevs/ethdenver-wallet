"use client";

import { useOktoAccount } from "@/hooks/use-okto-account";
import { useTokenList } from "@/hooks/use-token-list";
import { ChevronDown, Copy, Share2 } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function ReceiveTab() {
  const { selectedAccount } = useOktoAccount();
  const {
    chains,
    selectedChain,
    setSelectedChain,
    selectedToken,
    setSelectedToken,
    selectedTokenData,
    availableTokens,
    amount,
    setAmount,
  } = useTokenList();

  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [addressCopied, setAddressCopied] = useState(false);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);

  const walletAddress = selectedAccount?.address || "";
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-7)}`
    : "";

  // Set default chain (Optimism) if none selected
  useEffect(() => {
    if (!selectedChain && chains && chains.length > 0) {
      // Find Optimism chain
      const optimismChain = chains.find(
        (chain) => chain.name.toLowerCase() === "optimism"
      );

      if (optimismChain) {
        setSelectedChain(optimismChain.id);
      } else if (chains.length > 0) {
        // Fallback to first chain if Optimism not available
        setSelectedChain(chains[0].id);
      }
    }
  }, [chains, selectedChain, setSelectedChain]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".network-dropdown") &&
        !target.closest(".network-selector")
      ) {
        setShowNetworkDropdown(false);
      }
      if (
        !target.closest(".token-dropdown") &&
        !target.closest(".token-selector")
      ) {
        setShowTokenDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Generate QR code data URL when wallet address or parameters change
  useEffect(() => {
    if (!walletAddress) return;

    let qrData = walletAddress;

    if (selectedTokenData) {
      // Get decimals directly from the selected token data
      const decimals = selectedTokenData.decimals || 18;

      // Different format based on token type
      if (selectedTokenData.contractAddress) {
        // For ERC20 tokens
        const chainData = chains.find((c) => c.id === selectedChain);
        const chainId = chainData?.id || "1"; // Default to Ethereum mainnet

        // Calculate amount in token's smallest units based on its decimals
        let amountInSmallestUnits = "0";
        if (amount) {
          // Convert to token's smallest units using the correct decimals
          const multiplier = Math.pow(10, decimals);
          const amountValue = parseFloat(amount) * multiplier;
          amountInSmallestUnits = amountValue.toLocaleString("fullwide", {
            useGrouping: false,
          });
        }

        // Build the URI for ERC20 token transfer
        qrData = `ethereum:${selectedTokenData.contractAddress}@${chainId}/transfer?address=${walletAddress}&uint256=${amountInSmallestUnits}`;
      } else {
        // For native currency (ETH, MATIC, etc.)
        const chainData = chains.find((c) => c.id === selectedChain);
        const chainId = chainData?.id || "1"; // Default to Ethereum mainnet

        // Format: ethereum:<address>@<chainId>?value=<amountInWei>
        qrData = `ethereum:${walletAddress}@${chainId}`;

        if (amount) {
          // Convert to smallest units (wei for ETH, etc.)
          const multiplier = Math.pow(10, decimals);
          const valueInSmallestUnits = parseFloat(amount) * multiplier;
          qrData += `?value=${valueInSmallestUnits.toLocaleString("fullwide", {
            useGrouping: false,
          })}`;
        }
      }
    }

    console.log("Generated QR data:", qrData); // For debugging

    // Generate QR code with error correction level Q (25%)
    QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "Q",
      margin: 1,
      width: 250,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => {
        setQrCodeDataUrl(url);
      })
      .catch((err) => {
        console.error("Error generating QR code:", err);
      });
  }, [
    walletAddress,
    amount,
    selectedToken,
    selectedChain,
    chains,
    selectedTokenData,
  ]);

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!walletAddress) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Crypto Wallet Address",
          text: `My wallet address is: ${walletAddress}`,
          url: `ethereum:${walletAddress}`,
        });
      } else {
        // Fallback for browsers that don't support the Web Share API
        handleCopyAddress();
        alert(
          "Sharing not supported by your browser. Address copied to clipboard instead."
        );
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Get current network name from selected chain
  const getSelectedNetwork = () => {
    if (!selectedChain) return "Select Network";
    const chain = chains.find((c) => c.id === selectedChain);
    return chain ? chain.name : "Select Network";
  };

  // Get display text for selected token
  const getSelectedTokenDisplay = () => {
    if (!selectedToken && !selectedTokenData) {
      return selectedChain ? "Select Token" : "Select Network First";
    }
    return selectedTokenData ? `${selectedTokenData.symbol}` : "Select Token";
  };

  return (
    <div className="space-y-3 font-outfit">
      {/* Network Selector */}
      <div className="relative">
        <div
          className="flex justify-between items-center pb-4 border-b border-[#373747] cursor-pointer network-selector"
          onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
        >
          <span className="text-[#9493ac]">Network:</span>
          <div className="flex items-center gap-2 text-white">
            <span>{getSelectedNetwork()}</span>
            <ChevronDown className="h-4 w-4 ml-1" />
          </div>
        </div>

        {/* Network Dropdown */}
        {showNetworkDropdown && (
          <div className="absolute z-50 mt-1 w-full bg-[#1B1A27] border border-[#373747] rounded-lg shadow-lg max-h-[300px] overflow-y-auto network-dropdown">
            {chains.map((chain) => (
              <div
                key={chain.id}
                className="px-4 py-3 hover:bg-[#252531] cursor-pointer text-white flex items-center justify-between"
                onClick={() => {
                  setSelectedChain(chain.id);
                  setShowNetworkDropdown(false);
                }}
              >
                <span>{chain.name}</span>
                {selectedChain === chain.id && (
                  <div className="h-2.5 w-2.5 bg-white rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Area */}
      <div className="flex flex-col items-center rounded-2xl border border-[#373747] p-3 pt-6 pb-6 bg-[#1B1A27]/50">
        <h2 className="text-xl text-white mb-4">Aeris Wallet</h2>
        <div className="p-4 bg-white rounded-lg mb-4">
          {qrCodeDataUrl ? (
            <Image
              src={qrCodeDataUrl}
              alt="Wallet QR Code"
              width={250}
              height={250}
            />
          ) : (
            <div className="w-[250px] h-[250px] bg-gray-200 flex items-center justify-center">
              <p className="text-sm text-gray-500">Generating QR code...</p>
            </div>
          )}
        </div>

        {/* Address with Copy Button */}
        <div className="flex items-center justify-center space-x-2">
          <div className="text-white">{shortAddress}</div>
          <button onClick={handleCopy} className="text-white">
            {copied ? (
              <span className="text-green-400 text-xs">✓</span>
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Amount Input and Token Selection */}
      <div className="w-full h-20 relative bg-gradient-to-b from-[#252531] to-[#181826] rounded-2xl border border-[#373747] backdrop-blur-[20px]">
        <div className="w-full h-12 px-4 pt-4 flex justify-between items-start">
          <div className="relative">
            <div className="text-[#9493ac] text-sm font-normal font-outfit leading-tight">
              Select Amount
            </div>
            <div
              className="flex items-center gap-1 mt-1 cursor-pointer token-selector"
              onClick={() => setShowTokenDropdown(!showTokenDropdown)}
            >
              <div className="text-white text-base font-normal font-outfit leading-tight">
                {getSelectedTokenDisplay()}
              </div>
              <ChevronDown className="h-3 w-3 text-white" />
            </div>

            {/* Token Dropdown */}
            {showTokenDropdown && (
              <div className="absolute z-50 bottom-full mb-2 w-[220px] bg-[#1B1A27] border border-[#373747] rounded-lg shadow-lg max-h-[300px] overflow-y-auto token-dropdown">
                {selectedChain ? (
                  availableTokens.length > 0 ? (
                    availableTokens.map((token) => (
                      <div
                        key={token.id}
                        className="px-4 py-3 hover:bg-[#252531] cursor-pointer text-white flex items-center justify-between"
                        onClick={() => {
                          setSelectedToken(token.id);
                          setShowTokenDropdown(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {token.logoURI ? (
                            <Image
                              src={token.logoURI}
                              alt={token.symbol}
                              className="h-5 w-5 rounded-full"
                              width={20}
                              height={20}
                              unoptimized={true}
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-gray-700 flex items-center justify-center">
                              <span className="text-[10px] text-white">
                                {token.symbol.substring(0, 1)}
                              </span>
                            </div>
                          )}
                          <span>{token.symbol}</span>
                        </div>
                        {selectedToken === token.id && (
                          <div className="h-2.5 w-2.5 bg-white rounded-full"></div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-[#9493ac]">
                      No tokens available for this network
                    </div>
                  )
                ) : (
                  <div className="px-4 py-3 text-[#9493ac]">
                    Please select a network first
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="absolute right-[17px] top-[17px] w-[110px] p-2.5 rounded-2xl border border-[#373a46] flex justify-center items-center">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-center text-white text-xl font-medium font-outfit bg-transparent w-full outline-none"
          />
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex justify-center space-x-8 mt-12">
        <button
          className="p-4 rounded-full bg-[#181826] border border-[#373747] text-white hover:bg-[#21212f] transition-colors"
          onClick={handleCopyAddress}
          aria-label="Copy address"
        >
          <div className="relative">
            <Copy className="h-5 w-5" />
            {addressCopied && (
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                Copied!
              </span>
            )}
          </div>
        </button>
        <button
          className="p-4 rounded-full bg-[#181826] border border-[#373747] text-white hover:bg-[#21212f] transition-colors"
          onClick={handleShare}
          aria-label="Share address"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
