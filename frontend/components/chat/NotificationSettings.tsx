"use client";

import React from "react";
import { useNotificationStore } from "@/lib/stores/notification-store";
import { Switch } from "@/components/retroui/Switch";
import { Label } from "@/components/retroui/Label";
import { Button } from "@/components/retroui/Button";

export const NotificationSettings: React.FC = () => {
    const { soundEnabled, setSoundEnabled, playMessageSound } = useNotificationStore();

    const handleTestSound = () => {
        playMessageSound();
    };

    return (
        <div className="p-4 space-y-4 border-2 border-border bg-background">
            <h3 className="text-lg font-bold">Notification Settings</h3>

            <div className="flex items-center justify-between space-x-4">
                <div className="flex-1">
                    <Label htmlFor="sound-toggle" className="text-sm font-semibold">
                        Enable Notification Sounds
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                        Play sounds for messages, friend requests, and group invites
                    </p>
                </div>
                <Switch
                    id="sound-toggle"
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                />
            </div>

            {soundEnabled && (
                <div className="pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTestSound}
                        className="w-full"
                    >
                        Test Notification Sound
                    </Button>
                </div>
            )}
        </div>
    );
};
