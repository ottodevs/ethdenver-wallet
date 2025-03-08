"use client";

import { Button } from "@/components/ui/button";
import { useChat } from "ai/react";
import { format } from "date-fns";
import { ArrowLeft, QrCode, Send } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AskAeris() {
  const router = useRouter();
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
  });

  // Format current date and time
  const now = new Date();
  const formattedDateTime = `${format(now, "EEEE")} ${format(now, "h:mm a")}`;

  return (
    <main
      className="flex min-h-screen flex-col"
      style={{ background: "#11101C" }}
    >
      {/* Header with time and battery icons (purely decorative) */}
      <div className="flex justify-between items-center p-2 text-white text-sm">
        <div>9:41</div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 relative">
            <div className="absolute inset-0 border border-white rounded-sm"></div>
            <div className="absolute inset-y-0 left-0 w-3/4 bg-white m-[1px]"></div>
          </div>
        </div>
      </div>

      {/* Navigation Header */}
      <div className="flex justify-between items-center p-4 font-outfit">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-medium text-white text-center">
          ASK AERIS
        </h1>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
          <QrCode className="h-5 w-5" />
        </Button>
      </div>

      {/* Date Display */}
      <div className="text-center text-sm text-gray-400 my-2">
        {formattedDateTime}
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-auto px-4 py-2">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${
                message.role === "user" ? "self-start" : "self-end"
              } max-w-[85%]`}
            >
              <div
                className={`rounded-2xl p-4 ${
                  message.role === "user"
                    ? "bg-gray-800 text-white"
                    : "bg-[#1F2B66] text-white"
                }`}
              >
                <p className="text-[15px]">{message.content}</p>
                {message.role === "assistant" &&
                  message.content.includes("/thinking") && (
                    <div className="text-xs text-gray-400 mt-1 italic">
                      /thinking
                    </div>
                  )}
              </div>
            </div>
          ))}

          {/* If no messages yet or user just entered, show sample messages */}
          {messages.length === 0 && (
            <>
              <div className="self-start max-w-[85%]">
                <div className="rounded-2xl p-4 bg-gray-800 text-white">
                  <p className="text-[15px]">
                    Can you please help me send my friend ottodevs.ens 200 USDC
                    tokens?
                  </p>
                </div>
              </div>
              <div className="text-center text-sm text-gray-400 my-2">
                {formattedDateTime}
              </div>
              <div className="self-end max-w-[85%]">
                <div className="rounded-2xl p-4 bg-[#1F2B66] text-white">
                  <p className="text-[15px]">
                    I noticed that you have 239.87 USDC tokens spread across 4
                    different networks. Let&apos;s consolidate them so we can make
                    this easy for you... /thinking
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 bg-[#1A1A28] rounded-full">
            <input
              className="w-full px-4 py-3 bg-transparent text-white outline-none placeholder-gray-500"
              placeholder="Message"
              value={input}
              onChange={handleInputChange}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            className="rounded-full h-12 w-12 bg-[#4364F9] hover:bg-blue-600 flex items-center justify-center"
          >
            <Send className="h-5 w-5 text-white" />
          </Button>
        </form>
      </div>
    </main>
  );
}
