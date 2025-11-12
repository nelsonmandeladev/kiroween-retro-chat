"use client";

import { Button } from "@/components/retroui/Button";

// Classic MSN Messenger emoticons
export const EMOTICONS = [
    { text: ":)", emoji: "😊", label: "Happy" },
    { text: ":(", emoji: "😞", label: "Sad" },
    { text: ":D", emoji: "😃", label: "Big smile" },
    { text: ";)", emoji: "😉", label: "Wink" },
    { text: ":P", emoji: "😛", label: "Tongue out" },
    { text: ":O", emoji: "😮", label: "Surprised" },
    { text: ":|", emoji: "😐", label: "Neutral" },
    { text: ":/", emoji: "😕", label: "Confused" },
    { text: ":*", emoji: "😘", label: "Kiss" },
    { text: "<3", emoji: "❤️", label: "Heart" },
    { text: "(y)", emoji: "👍", label: "Thumbs up" },
    { text: "(n)", emoji: "👎", label: "Thumbs down" },
    { text: "8)", emoji: "😎", label: "Cool" },
    { text: ":'(", emoji: "😢", label: "Crying" },
    { text: ":@", emoji: "😠", label: "Angry" },
    { text: "(angel)", emoji: "😇", label: "Angel" },
    { text: "(devil)", emoji: "😈", label: "Devil" },
    { text: "(rofl)", emoji: "🤣", label: "Rolling on floor laughing" },
];

interface EmoticonPickerProps {
    onSelect: (emoticon: string) => void;
    onClose?: () => void;
}

export function EmoticonPicker({ onSelect, onClose }: EmoticonPickerProps) {
    return (
        <div className="absolute bottom-full right-0 mb-2 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 rounded-lg z-50">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm">Emoticons</h3>
                {onClose && (
                    <Button
                        onClick={onClose}
                        variant="link"
                        size="sm"
                        className="text-gray-600"
                    >
                        ✕
                    </Button>
                )}
            </div>
            <div className="grid grid-cols-6 gap-2 max-w-xs">
                {EMOTICONS.map((emoticon) => (
                    <button
                        key={emoticon.text}
                        onClick={() => {
                            onSelect(emoticon.text);
                            onClose?.();
                        }}
                        className="text-2xl hover:bg-gray-100 p-2 rounded transition-colors"
                        title={`${emoticon.label} (${emoticon.text})`}
                        type="button"
                    >
                        {emoticon.emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Helper function to convert text emoticons to emoji in messages
export function convertEmoticonsToEmoji(text: string): string {
    let result = text;

    // Sort emoticons by length (longest first) to avoid partial matches
    const sortedEmoticons = [...EMOTICONS].sort((a, b) => b.text.length - a.text.length);

    for (const emoticon of sortedEmoticons) {
        // Use split and join to replace all occurrences (avoids regex escaping issues)
        result = result.split(emoticon.text).join(emoticon.emoji);
    }

    return result;
}
