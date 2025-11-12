'use client';

import { useEffect, useState } from 'react';

export function AnimatedGhostIcon({
    width = 20,
    height = 24,
    className = '',
    variant = 'single'
}: {
    width?: number;
    height?: number;
    className?: string;
    variant?: 'single' | 'group';
}) {
    const [isBlinking, setIsBlinking] = useState(false);
    const [eyeDirection, setEyeDirection] = useState<'center' | 'left' | 'right'>('center');

    useEffect(() => {
        // Blinking animation
        const scheduleNextBlink = () => {
            const delay = Math.random() * 3000 + 2000;
            return setTimeout(() => {
                setIsBlinking(true);
                setTimeout(() => {
                    setIsBlinking(false);
                }, 150);
            }, delay);
        };

        let blinkTimeoutId = scheduleNextBlink();
        const blinkInterval = setInterval(() => {
            clearTimeout(blinkTimeoutId);
            blinkTimeoutId = scheduleNextBlink();
        }, 5500);

        // Eye direction animation
        const scheduleNextLook = () => {
            const delay = Math.random() * 2000 + 1500;
            return setTimeout(() => {
                const directions: Array<'center' | 'left' | 'right'> = ['center', 'left', 'right'];
                const currentIndex = directions.indexOf(eyeDirection);
                const availableDirections = directions.filter((_, i) => i !== currentIndex);
                const newDirection = availableDirections[Math.floor(Math.random() * availableDirections.length)];
                setEyeDirection(newDirection);
            }, delay);
        };

        let lookTimeoutId = scheduleNextLook();
        const lookInterval = setInterval(() => {
            clearTimeout(lookTimeoutId);
            lookTimeoutId = scheduleNextLook();
        }, 4000);

        return () => {
            clearTimeout(blinkTimeoutId);
            clearInterval(blinkInterval);
            clearTimeout(lookTimeoutId);
            clearInterval(lookInterval);
        };
    }, [eyeDirection]);

    // Calculate eye position offset based on direction
    const getEyeTransform = () => {
        const offset = eyeDirection === 'left' ? -0.8 : eyeDirection === 'right' ? 0.8 : 0;
        const scaleY = isBlinking ? 0.1 : 1;
        return `translateX(${offset}px) scaleY(${scaleY})`;
    };

    if (variant === 'group') {
        return (
            <div
                className={className}
                style={{
                    display: 'inline-block',
                    position: 'relative',
                    width: width * 1.8,
                    height: height,
                }}
            >
                <style jsx>{`
                    @keyframes ghostFloat1 {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-6px); }
                    }
                    @keyframes ghostFloat2 {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-8px); }
                    }
                    @keyframes ghostFloat3 {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-7px); }
                    }
                `}</style>

                {/* Back ghost (left) */}
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '10%',
                    opacity: 0.7,
                    animation: 'ghostFloat1 3.2s ease-in-out infinite',
                    transform: 'scale(0.85)'
                }}>
                    <SingleGhost width={width} height={height} eyeDirection={eyeDirection} isBlinking={isBlinking} getEyeTransform={getEyeTransform} />
                </div>

                {/* Back ghost (right) */}
                <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '10%',
                    opacity: 0.7,
                    animation: 'ghostFloat3 2.9s ease-in-out infinite',
                    transform: 'scale(0.85)'
                }}>
                    <SingleGhost width={width} height={height} eyeDirection={eyeDirection} isBlinking={isBlinking} getEyeTransform={getEyeTransform} />
                </div>

                {/* Front ghost (center) */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    transform: 'translateX(-50%)',
                    animation: 'ghostFloat2 3s ease-in-out infinite',
                    zIndex: 1
                }}>
                    <SingleGhost width={width} height={height} eyeDirection={eyeDirection} isBlinking={isBlinking} getEyeTransform={getEyeTransform} />
                </div>
            </div>
        );
    }

    return (
        <div
            className={className}
            style={{
                display: 'inline-block',
                animation: 'ghostFloat 3s ease-in-out infinite'
            }}
        >
            <style jsx>{`
                @keyframes ghostFloat {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-8px);
                    }
                }
            `}</style>
            <SingleGhost width={width} height={height} eyeDirection={eyeDirection} isBlinking={isBlinking} getEyeTransform={getEyeTransform} />
        </div>
    );
}

function SingleGhost({
    width,
    height,
    eyeDirection,
    isBlinking,
    getEyeTransform
}: {
    width: number;
    height: number;
    eyeDirection: 'center' | 'left' | 'right';
    isBlinking: boolean;
    getEyeTransform: () => string;
}) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox="0 0 20 24"
            fill="none"
        >
            {/* Ghost body */}
            <path
                d="M3.80081 18.5661C1.32306 24.0572 6.59904 25.434 10.4904 22.2205C11.6339 25.8242 15.926 23.1361 17.4652 20.3445C20.8578 14.1915 19.4877 7.91459 19.1361 6.61988C16.7244 -2.20972 4.67055 -2.21852 2.59581 6.6649C2.11136 8.21946 2.10284 9.98752 1.82846 11.8233C1.69011 12.749 1.59258 13.3398 1.23436 14.3135C1.02841 14.8733 0.745043 15.3704 0.299833 16.2082C-0.391594 17.5095 -0.0998802 20.021 3.46397 18.7186V18.7195L3.80081 18.5661Z"
                fill="white"
            />

            {/* Left eye */}
            <path
                d="M10.9614 10.4413C9.97202 10.4413 9.82422 9.25893 9.82422 8.55407C9.82422 7.91791 9.93824 7.4124 10.1542 7.09197C10.3441 6.81003 10.6158 6.66699 10.9614 6.66699C11.3071 6.66699 11.6036 6.81228 11.8128 7.09892C12.0511 7.42554 12.177 7.92861 12.177 8.55407C12.177 9.73591 11.7226 10.4413 10.9616 10.4413H10.9614Z"
                fill="black"
                style={{
                    transformOrigin: '11px 8.5px',
                    transform: getEyeTransform(),
                    transition: 'transform 0.3s ease-in-out'
                }}
            />

            {/* Right eye */}
            <path
                d="M15.0318 10.4413C14.0423 10.4413 13.8945 9.25893 13.8945 8.55407C13.8945 7.91791 14.0086 7.4124 14.2245 7.09197C14.4144 6.81003 14.6861 6.66699 15.0318 6.66699C15.3774 6.66699 15.6739 6.81228 15.8831 7.09892C16.1214 7.42554 16.2474 7.92861 16.2474 8.55407C16.2474 9.73591 15.793 10.4413 15.0319 10.4413H15.0318Z"
                fill="black"
                style={{
                    transformOrigin: '15px 8.5px',
                    transform: getEyeTransform(),
                    transition: 'transform 0.3s ease-in-out'
                }}
            />
        </svg>
    );
}
