import { useState, useEffect } from 'react';

export const useTypewriter = (text: string, speed: number = 20, startDelay: number = 0) => {
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let currentIndex = 0;

        const startTyping = () => {
            setIsTyping(true);
            const typeChar = () => {
                if (currentIndex < text.length) {
                    setDisplayText(text.slice(0, currentIndex + 1));
                    currentIndex++;
                    // Randomize speed slightly for realism
                    const randomSpeed = speed + (Math.random() * 20 - 10);
                    timeoutId = setTimeout(typeChar, randomSpeed);
                } else {
                    setIsTyping(false);
                    setIsComplete(true);
                }
            };
            typeChar();
        };

        const delayTimeout = setTimeout(startTyping, startDelay);

        return () => {
            clearTimeout(delayTimeout);
            clearTimeout(timeoutId);
        };
    }, [text, speed, startDelay]);

    return { displayText, isTyping, isComplete };
};
