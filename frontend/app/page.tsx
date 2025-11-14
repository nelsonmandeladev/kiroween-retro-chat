"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { AnimatedGhostIcon } from "@/components/ui/AnimatedGhostIcon";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session) {
      router.push("/chat");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#5b9bd5]">
        <div className="msn-window w-80">
          <div className="msn-window-header">
            <span className="font-bold">RetroChat</span>
          </div>
          <div className="msn-window-body text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0066cc] mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#5b9bd5] via-[#4d94ff] to-[#0066cc] py-12 px-4">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto">
        {/* Main Window */}
        <div className="msn-window max-w-4xl mx-auto mb-8 animate-[fadeIn_0.5s_ease-in]">
          <div className="msn-window-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white rounded-full"></div>
              <span className="font-bold text-lg">RetroChat - Welcome!</span>
            </div>
            <div className="flex gap-1">
              <div className="w-5 h-5 bg-white/20 hover:bg-white/30 cursor-pointer flex items-center justify-center text-xs">_</div>
              <div className="w-5 h-5 bg-white/20 hover:bg-white/30 cursor-pointer flex items-center justify-center text-xs">□</div>
              <div className="w-5 h-5 bg-red-500 hover:bg-red-600 cursor-pointer flex items-center justify-center text-xs">×</div>
            </div>
          </div>
          <div className="msn-window-body p-8">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold mb-3 text-[#0066cc]" style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}>
                RetroChat
              </h1>
              <p className="text-xl text-gray-700 mb-2">
                Remember the good old days? 🎮
              </p>
              <p className="text-base text-gray-600">
                Experience the nostalgia of MSN Messenger with modern features
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center mb-8">
              <Link href="/register" className="msn-button-primary text-lg px-8 py-3 font-bold">
                Sign Up Free
              </Link>
              <Link href="/login" className="msn-button text-lg px-8 py-3 font-bold">
                Log In
              </Link>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <div className="msn-panel text-center">
                <div className="text-4xl mb-2">💬</div>
                <h3 className="font-bold text-[#0066cc] mb-2">Real-Time Chat</h3>
                <p className="text-sm text-gray-600">
                  Instant messaging with friends, just like the old days
                </p>
              </div>
              <div className="msn-panel text-center">
                <AnimatedGhostIcon width={40} height={48} />
                <h3 className="font-bold text-[#0066cc] mb-2">Kirhost</h3>
                <p className="text-sm text-gray-600">
                  Chat with an AI companion powered by modern technology
                </p>
              </div>
              <div className="msn-panel text-center">
                <div className="text-4xl mb-2">👥</div>
                <h3 className="font-bold text-[#0066cc] mb-2">Group Chats</h3>
                <p className="text-sm text-gray-600">
                  Create groups and chat with multiple friends at once
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
          {/* Status & Presence */}
          <div className="msn-window animate-[fadeIn_0.6s_ease-in]">
            <div className="msn-window-header">
              <span className="font-bold">✨ Features</span>
            </div>
            <div className="msn-window-body">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="msn-status-online"></div>
                  <div>
                    <p className="font-bold text-sm">Online Status</p>
                    <p className="text-xs text-gray-600">Show when you&apos;re available</p>
                  </div>
                </div>
                <div className="msn-divider"></div>
                <div className="flex items-center gap-3">
                  <div className="msn-status-away"></div>
                  <div>
                    <p className="font-bold text-sm">Away Mode</p>
                    <p className="text-xs text-gray-600">Auto-status when idle</p>
                  </div>
                </div>
                <div className="msn-divider"></div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📝</span>
                  <div>
                    <p className="font-bold text-sm">Custom Messages</p>
                    <p className="text-xs text-gray-600">Set your personal status</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Retro Experience */}
          <div className="msn-window animate-[fadeIn_0.7s_ease-in]">
            <div className="msn-window-header">
              <span className="font-bold">🎨 Retro Design</span>
            </div>
            <div className="msn-window-body">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎵</span>
                  <div>
                    <p className="font-bold text-sm">Nostalgic Sounds</p>
                    <p className="text-xs text-gray-600">Classic notification tones</p>
                  </div>
                </div>
                <div className="msn-divider"></div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎭</span>
                  <div>
                    <p className="font-bold text-sm">Emoticons</p>
                    <p className="text-xs text-gray-600">Express yourself with emojis</p>
                  </div>
                </div>
                <div className="msn-divider"></div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="font-bold text-sm">Modern Speed</p>
                    <p className="text-xs text-gray-600">Retro look, modern performance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Chat Window */}
        <div className="msn-window max-w-2xl mx-auto animate-[fadeIn_0.8s_ease-in]">
          <div className="msn-window-header flex items-center gap-2">
            <div className="msn-status-online"></div>
            <span className="font-bold">Demo Chat - See it in action!</span>
          </div>
          <div className="msn-window-body bg-white">
            <div className="space-y-3 p-4 bg-[#f5f5f5] min-h-[200px]">
              <div className="flex gap-2">
                <div className="msn-message-received max-w-[70%]">
                  <p className="font-bold text-xs text-[#0066cc] mb-1">Friend</p>
                  <p>Hey! Remember MSN Messenger? 😊</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="msn-message-sent max-w-[70%]">
                  <p className="font-bold text-xs text-[#0066cc] mb-1">You</p>
                  <p>Of course! Those were the days! 🎮</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="msn-message-ai max-w-[70%]">
                  <div className="font-bold text-xs text-purple-600 mb-1 flex items-center gap-2.5">
                    <AnimatedGhostIcon /> Kirhost
                  </div>
                  <p>I can help you relive those memories with modern AI!</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="msn-typing">
                  <span className="font-bold text-[#0066cc]">Friend</span> is typing
                  <span className="typing-dots ml-1">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            </div>
            <div className="border-t-2 border-border p-3 bg-white">
              <div className="msn-input w-full py-2 px-3 text-gray-400">
                Type your message here...
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-8 animate-[fadeIn_0.9s_ease-in]">
          <div className="msn-panel inline-block">
            <p className="text-lg font-bold text-[#0066cc] mb-3">
              Ready to relive the nostalgia?
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/register" className="msn-button-primary px-6 py-2 font-bold">
                Get Started
              </Link>
              <Link href="/login" className="msn-button px-6 py-2 font-bold">
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/80 text-sm">
          <p>© 2024 RetroChat - Bringing back the golden age of instant messaging</p>
        </div>
      </div>
    </div>
  );
}
