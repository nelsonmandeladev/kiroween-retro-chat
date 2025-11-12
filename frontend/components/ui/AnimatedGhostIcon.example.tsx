/**
 * AnimatedGhostIcon Usage Examples
 * 
 * This component displays an animated ghost icon (Kirhost) with:
 * - Floating animation
 * - Blinking eyes
 * - Eyes looking left/right/center
 * 
 * Variants:
 * - 'single': One ghost (for Kirhost AI Friend)
 * - 'group': Three ghosts grouped together (for group chats)
 */

import { AnimatedGhostIcon } from './AnimatedGhostIcon';

export function Examples() {
    return (
        <div className="p-8 space-y-8">
            {/* Single Ghost - Default */}
            <div>
                <h3 className="mb-2">Single Ghost (Kirhost)</h3>
                <AnimatedGhostIcon />
            </div>

            {/* Single Ghost - Larger */}
            <div>
                <h3 className="mb-2">Larger Single Ghost</h3>
                <AnimatedGhostIcon width={40} height={48} />
            </div>

            {/* Group Ghost */}
            <div>
                <h3 className="mb-2">Group Ghost (3 ghosts)</h3>
                <AnimatedGhostIcon variant="group" />
            </div>

            {/* Group Ghost - Larger */}
            <div>
                <h3 className="mb-2">Larger Group Ghost</h3>
                <AnimatedGhostIcon variant="group" width={40} height={48} />
            </div>

            {/* With Custom Styling */}
            <div>
                <h3 className="mb-2">With Custom Classes</h3>
                <AnimatedGhostIcon className="opacity-80" />
            </div>
        </div>
    );
}
