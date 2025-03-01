"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNftService } from "@/services/nft-service";
import { motion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function NFTGallery({ animated = true }: { animated?: boolean }) {
  const { nfts, transferNFT, isLoading, error } = useNftService();
  const [selectedNft/*, setSelectedNft*/] = useState<string | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [transferStatus, setTransferStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  const handleTransfer = async () => {
    if (!selectedNft || !recipient) return;
    
    const nft = nfts.find(n => n.id === selectedNft);
    if (!nft) return;
    
    setTransferStatus("loading");
    setErrorMessage("");
    
    try {
      await transferNFT(nft, recipient);
      setTransferStatus("success");
    } catch (error) {
      console.error("NFT transfer failed:", error);
      setTransferStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Transfer failed");
    }
  };

  // const handleNftClick = (nftId: string) => {
  //   setSelectedNft(nftId);
  //   setTransferModalOpen(true);
  //   setTransferStatus("idle");
  //   setRecipient("");
  //   setErrorMessage("");
  // };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <p className="text-sm text-muted-foreground">Loading NFTs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!nfts || nfts.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[300px]">
        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No NFTs found</p>
      </div>
    );
  }

  const GalleryComponent = animated ? motion.div : "div";
  const NFTComponent = animated ? motion.div : "div";

  return (
    <>
      <GalleryComponent
        className="grid grid-cols-2 gap-3"
        variants={animated ? container : undefined}
        initial={animated ? "hidden" : undefined}
        animate={animated ? "show" : undefined}
      >
        {nfts.map((nft) => (
          <NFTComponent
            key={nft.id}
            className="rounded-lg overflow-hidden border border-border"
            variants={animated ? item : undefined}
          >
            <div className="relative aspect-square">
              <Image
                src={nft.image}
                alt={nft.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-2">
              <div className="font-medium truncate">{nft.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {nft.collection}
              </div>
            </div>
          </NFTComponent>
        ))}
      </GalleryComponent>

      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer NFT</DialogTitle>
          </DialogHeader>
          
          {transferStatus === "idle" && (
            <div className="space-y-4">
              {selectedNft && (
                <div className="flex items-center space-x-3">
                  <div className="h-16 w-16 rounded-lg overflow-hidden">
                    <Image
                      src={nfts.find(n => n.id === selectedNft)?.image || ""}
                      alt="NFT"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{nfts.find(n => n.id === selectedNft)?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {nfts.find(n => n.id === selectedNft)?.collection}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setTransferModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleTransfer} disabled={!recipient}>
                  Transfer
                </Button>
              </div>
            </div>
          )}
          
          {transferStatus === "loading" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-center">Processing transfer...</p>
            </div>
          )}
          
          {transferStatus === "success" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-center font-medium">NFT Transfer Successful!</p>
              <Button onClick={() => setTransferModalOpen(false)}>Close</Button>
            </div>
          )}
          
          {transferStatus === "error" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xl font-bold">!</span>
              </div>
              <p className="text-center font-medium">Transfer Failed</p>
              <p className="text-center text-sm text-muted-foreground">
                {errorMessage || "There was an error transferring your NFT."}
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setTransferModalOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => setTransferStatus("idle")}>Try Again</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 