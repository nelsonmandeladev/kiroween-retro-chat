"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/retroui/Dialog";
import { Button } from "@/components/retroui/Button";
import { Loader } from "@/components/retroui/Loader";
import { aiFriendService } from "@/lib/api/ai-friend.service";
import { AIStyleProfile } from "@/lib/api/types";

interface AIFriendProfileProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AIFriendProfile({ open, onOpenChange }: AIFriendProfileProps) {
    const [profile, setProfile] = useState<AIStyleProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            loadProfile();
        }
    }, [open]);

    const loadProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await aiFriendService.getStyleProfile();
            setProfile(data);
        } catch (err) {
            console.error("Failed to load AI Friend profile:", err);
            setError("Failed to load profile. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async () => {
        setIsResetting(true);
        setError(null);
        try {
            await aiFriendService.resetStyle();
            // Reload profile after reset
            await loadProfile();
            setShowResetConfirm(false);
        } catch (err) {
            console.error("Failed to reset AI Friend style:", err);
            setError("Failed to reset style. Please try again.");
        } finally {
            setIsResetting(false);
        }
    };

    const formatTonePercentage = (value: number) => {
        return `${Math.round(value * 100)}%`;
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <Dialog.Content className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <Dialog.Header>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <span className="text-2xl">🤖</span>
                                AI Friend Style Profile
                            </h2>
                            <Dialog.Description className="text-sm">
                                View your AI Friend&apos;s learned communication style and characteristics
                            </Dialog.Description>
                        </div>
                    </Dialog.Header>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader />
                        </div>
                    ) : error ? (
                        <div className="py-8 text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={loadProfile} variant="outline">
                                Try Again
                            </Button>
                        </div>
                    ) : profile ? (
                        <div className="space-y-6">
                            {/* Learning Status */}
                            <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-purple-900">Learning Progress</h3>
                                    <span className="text-sm text-purple-700">
                                        {profile.messageCount} messages analyzed
                                    </span>
                                </div>
                                <div className="w-full bg-purple-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-purple-600 h-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min((profile.messageCount / 50) * 100, 100)}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-purple-700 mt-2">
                                    {profile.hasMinimumData
                                        ? "✓ AI Friend has learned your style!"
                                        : `${50 - profile.messageCount} more messages needed to learn your style`}
                                </p>
                            </div>

                            {/* Common Phrases */}
                            {profile.commonPhrases && profile.commonPhrases.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <span>💬</span>
                                        Common Phrases
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.commonPhrases.slice(0, 10).map((phrase, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm border-2 border-blue-300"
                                            >
                                                &quot;{phrase}&quot;
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Emoji Usage */}
                            {profile.emojiUsage && Object.keys(profile.emojiUsage).length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <span>😊</span>
                                        Favorite Emojis
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {Object.entries(profile.emojiUsage)
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0, 8)
                                            .map(([emoji, count]) => (
                                                <div
                                                    key={emoji}
                                                    className="flex flex-col items-center p-3 bg-gray-50 border-2 border-gray-300 rounded-lg"
                                                >
                                                    <span className="text-3xl mb-1">{emoji}</span>
                                                    <span className="text-xs text-gray-600">
                                                        {count} {count === 1 ? "time" : "times"}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Tone Indicators */}
                            {profile.toneIndicators && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <span>🎭</span>
                                        Communication Tone
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-gray-700">Casual</span>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {formatTonePercentage(profile.toneIndicators.casual)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-500 h-full rounded-full transition-all"
                                                    style={{
                                                        width: formatTonePercentage(profile.toneIndicators.casual),
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-gray-700">Formal</span>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {formatTonePercentage(profile.toneIndicators.formal)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-full rounded-full transition-all"
                                                    style={{
                                                        width: formatTonePercentage(profile.toneIndicators.formal),
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-gray-700">Enthusiastic</span>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {formatTonePercentage(profile.toneIndicators.enthusiastic)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-orange-500 h-full rounded-full transition-all"
                                                    style={{
                                                        width: formatTonePercentage(
                                                            profile.toneIndicators.enthusiastic
                                                        ),
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Average Message Length */}
                            {profile.averageMessageLength && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <span>📏</span>
                                        Message Style
                                    </h3>
                                    <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                                        <p className="text-sm text-gray-700">
                                            Average message length:{" "}
                                            <span className="font-semibold text-gray-900">
                                                {Math.round(profile.averageMessageLength)} characters
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            {profile.averageMessageLength < 50
                                                ? "You prefer short, concise messages"
                                                : profile.averageMessageLength < 100
                                                    ? "You write moderate-length messages"
                                                    : "You write detailed, longer messages"}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Last Updated */}
                            <div className="text-xs text-gray-500 text-center pt-4 border-t">
                                Last updated: {new Date(profile.lastUpdated).toLocaleString()}
                            </div>

                            {/* Reset Button */}
                            <div className="flex justify-center pt-4">
                                <Button
                                    onClick={() => setShowResetConfirm(true)}
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                    Reset AI Friend Style
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500">
                            <p>No profile data available yet.</p>
                            <p className="text-sm mt-2">Start chatting with your AI Friend to build a profile!</p>
                        </div>
                    )}
                </Dialog.Content>
            </Dialog>

            {/* Reset Confirmation Dialog */}
            <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
                <Dialog.Content className="max-w-md">
                    <Dialog.Header>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-bold">Reset AI Friend Style?</h2>
                            <Dialog.Description className="text-sm">
                                This will clear all learned style characteristics and your AI Friend will start learning from
                                scratch. This action cannot be undone.
                            </Dialog.Description>
                        </div>
                    </Dialog.Header>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            onClick={() => setShowResetConfirm(false)}
                            variant="outline"
                            disabled={isResetting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReset}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isResetting}
                        >
                            {isResetting ? "Resetting..." : "Reset Style"}
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog>
        </>
    );
}
