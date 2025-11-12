"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/retroui/Dialog";
import { Button } from "@/components/retroui/Button";
import { Loader } from "@/components/retroui/Loader";
import { groupsService } from "@/lib/api/groups.service";
import { useGroupStore } from "@/lib/stores/group-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AIStyleProfile } from "@/lib/api/types";
import { toast } from "sonner";

interface GroupAIProfileProps {
    groupId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GroupAIProfile({ groupId, open, onOpenChange }: GroupAIProfileProps) {
    const { user } = useAuthStore();
    const { getGroupById, isUserAdmin, updateGroup } = useGroupStore();
    const [profile, setProfile] = useState<AIStyleProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [toggling, setToggling] = useState(false);

    const group = getGroupById(groupId);
    const isAdmin = user ? isUserAdmin(groupId, user.id) : false;

    useEffect(() => {
        if (open) {
            loadProfile();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, groupId]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const data = await groupsService.getAIProfile(groupId);
            setProfile(data);
        } catch (error) {
            console.error("Failed to load Group AI profile:", error);
            toast.error("Failed to load Group AI profile");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        setResetting(true);
        try {
            await groupsService.resetAIStyle(groupId);
            toast.success("Group AI style has been reset");
            setShowResetConfirm(false);
            await loadProfile();
        } catch (error) {
            console.error("Failed to reset Group AI:", error);
            toast.error("Failed to reset Group AI");
        } finally {
            setResetting(false);
        }
    };

    const handleToggleAI = async () => {
        if (!group) return;

        setToggling(true);
        try {
            const newEnabled = !group.aiEnabled;
            await groupsService.toggleAI(groupId, newEnabled);
            updateGroup(groupId, { aiEnabled: newEnabled });
            toast.success(`Group AI ${newEnabled ? "enabled" : "disabled"}`);
        } catch (error) {
            console.error("Failed to toggle Group AI:", error);
            toast.error("Failed to toggle Group AI");
        } finally {
            setToggling(false);
        }
    };

    const getTopEmojis = () => {
        if (!profile?.emojiUsage) return [];
        return Object.entries(profile.emojiUsage)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);
    };

    const getMemberContributions = () => {
        if (!profile?.memberContributions) return [];
        return Object.entries(profile.memberContributions)
            .sort(([, a], [, b]) => (b as number) - (a as number));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Content className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <Dialog.Header>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="text-2xl">🤖</span>
                            Group AI Profile
                        </h2>
                        <Dialog.Description className="text-sm">
                            View and manage the Group AI&apos;s learned style
                        </Dialog.Description>
                    </div>
                </Dialog.Header>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader />
                    </div>
                ) : profile ? (
                    <div className="space-y-6">
                        {/* Learning Progress */}
                        <div className="p-4 bg-purple-50 border-4 border-purple-200 rounded-lg">
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <span>📊</span>
                                Learning Progress
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold">Messages Analyzed:</span>
                                    <span className="text-lg font-bold text-purple-600">
                                        {profile.messageCount}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4 border-2 border-black">
                                    <div
                                        className="bg-purple-500 h-full rounded-full transition-all duration-300"
                                        style={{
                                            width: `${Math.min((profile.messageCount / 20) * 100, 100)}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-gray-600">
                                    {profile.messageCount >= 20
                                        ? "✓ Group AI is fully trained and ready!"
                                        : `${20 - profile.messageCount} more messages needed for full training`}
                                </p>
                            </div>
                        </div>

                        {/* Common Phrases */}
                        {profile.commonPhrases && profile.commonPhrases.length > 0 && (
                            <div className="p-4 bg-blue-50 border-4 border-blue-200 rounded-lg">
                                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                    <span>💬</span>
                                    Common Phrases
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.commonPhrases.map((phrase, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-white border-2 border-blue-300 rounded-full text-sm"
                                        >
                                            &quot;{phrase}&quot;
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Emoji Usage */}
                        {getTopEmojis().length > 0 && (
                            <div className="p-4 bg-yellow-50 border-4 border-yellow-200 rounded-lg">
                                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                    <span>😊</span>
                                    Emoji Usage
                                </h3>
                                <div className="grid grid-cols-5 gap-3">
                                    {getTopEmojis().map(([emoji, count], index) => (
                                        <div
                                            key={index}
                                            className="flex flex-col items-center p-2 bg-white border-2 border-yellow-300 rounded-lg"
                                        >
                                            <span className="text-3xl mb-1">{emoji}</span>
                                            <span className="text-xs font-semibold text-gray-600">
                                                {count}x
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tone Indicators */}
                        <div className="p-4 bg-green-50 border-4 border-green-200 rounded-lg">
                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                <span>🎭</span>
                                Group Tone
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-semibold">Casual</span>
                                        <span className="text-sm font-bold text-green-600">
                                            {profile.toneIndicators.casual}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 border-2 border-black">
                                        <div
                                            className="bg-green-500 h-full rounded-full"
                                            style={{ width: `${profile.toneIndicators.casual}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-semibold">Formal</span>
                                        <span className="text-sm font-bold text-blue-600">
                                            {profile.toneIndicators.formal}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 border-2 border-black">
                                        <div
                                            className="bg-blue-500 h-full rounded-full"
                                            style={{ width: `${profile.toneIndicators.formal}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-semibold">Enthusiastic</span>
                                        <span className="text-sm font-bold text-orange-600">
                                            {profile.toneIndicators.enthusiastic}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 border-2 border-black">
                                        <div
                                            className="bg-orange-500 h-full rounded-full"
                                            style={{ width: `${profile.toneIndicators.enthusiastic}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Message Length */}
                        <div className="p-4 bg-pink-50 border-4 border-pink-200 rounded-lg">
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <span>📏</span>
                                Average Message Length
                            </h3>
                            <p className="text-2xl font-bold text-pink-600">
                                {profile.averageMessageLength} characters
                            </p>
                        </div>

                        {/* Member Contributions */}
                        {getMemberContributions().length > 0 && (
                            <div className="p-4 bg-indigo-50 border-4 border-indigo-200 rounded-lg">
                                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                    <span>👥</span>
                                    Member Contributions
                                </h3>
                                <div className="space-y-2">
                                    {getMemberContributions().map(([userId, count], index) => (
                                        <div key={userId} className="flex items-center gap-3">
                                            <span className="text-sm font-semibold w-8 text-gray-600">
                                                #{index + 1}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-medium truncate">
                                                        User {userId.substring(0, 8)}...
                                                    </span>
                                                    <span className="text-sm font-bold text-indigo-600">
                                                        {count as number} messages
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2 border border-black">
                                                    <div
                                                        className="bg-indigo-500 h-full rounded-full"
                                                        style={{
                                                            width: `${((count as number) / profile.messageCount) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Last Updated */}
                        <div className="text-center text-sm text-gray-500">
                            Last updated: {new Date(profile.lastUpdated).toLocaleString()}
                        </div>

                        {/* Admin Actions */}
                        {isAdmin && (
                            <div className="flex flex-col gap-3 pt-4 border-t-4 border-gray-200">
                                <div className="flex items-center justify-between p-3 bg-gray-50 border-2 border-gray-300 rounded-lg">
                                    <div>
                                        <p className="font-semibold">Group AI Status</p>
                                        <p className="text-xs text-gray-600">
                                            {group?.aiEnabled ? "AI is enabled" : "AI is disabled"}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleToggleAI}
                                        disabled={toggling}
                                        variant={group?.aiEnabled ? "secondary" : "default"}
                                    >
                                        {toggling ? (
                                            <Loader size="sm" />
                                        ) : group?.aiEnabled ? (
                                            "Disable AI"
                                        ) : (
                                            "Enable AI"
                                        )}
                                    </Button>
                                </div>

                                {!showResetConfirm ? (
                                    <Button
                                        onClick={() => setShowResetConfirm(true)}
                                        variant="secondary"
                                        className="w-full"
                                    >
                                        Reset Group AI Style
                                    </Button>
                                ) : (
                                    <div className="p-4 bg-red-50 border-4 border-red-300 rounded-lg space-y-3">
                                        <p className="text-sm font-semibold text-red-900">
                                            ⚠️ Are you sure you want to reset the Group AI?
                                        </p>
                                        <p className="text-xs text-red-700">
                                            This will clear all learned style data and the AI will need to
                                            learn from scratch. This action cannot be undone.
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleReset}
                                                disabled={resetting}
                                                variant="secondary"
                                                className="flex-1"
                                            >
                                                {resetting ? <Loader size="sm" /> : "Yes, Reset AI"}
                                            </Button>
                                            <Button
                                                onClick={() => setShowResetConfirm(false)}
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <p>No profile data available</p>
                    </div>
                )}

                <Dialog.Footer>
                    <Button onClick={() => onOpenChange(false)} variant="outline">
                        Close
                    </Button>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog>
    );
}
