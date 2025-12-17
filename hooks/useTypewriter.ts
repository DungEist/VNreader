import { useState, useEffect, useRef, useCallback } from 'react';

// Helper: Count visible characters inside HTML tags
const getHtmlVisibleLength = (html: string): number => {
    let count = 0;
    let inTag = false;
    for (let i = 0; i < html.length; i++) {
        if (html[i] === '<') inTag = true;
        else if (html[i] === '>') inTag = false;
        else if (!inTag) count++;
    }
    return count;
};

// Helper: Get substring of HTML based on visible char count
const getHtmlSubstring = (html: string, charCount: number): string => {
    let visibleCount = 0;
    let result = "";
    let inTag = false;
    for(let i = 0; i < html.length; i++) {
        const char = html[i];
        if (char === '<') inTag = true;
        result += char;
        if (!inTag) visibleCount++;
        if (char === '>') inTag = false;
        if (visibleCount >= charCount && !inTag) break;
    }
    return result;
};

export const useTypewriter = (fullText: string, speed: number, onComplete?: () => void) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const intervalRef = useRef<any>(null);

    // Convert newlines to breaks purely for display logic
    const formattedText = fullText ? fullText.replace(/\n/g, '<br/>') : '';

    useEffect(() => {
        // Reset
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayedText('');
        setIsTyping(true);

        if (speed === 0) {
            setDisplayedText(formattedText);
            setIsTyping(false);
            if (onComplete) onComplete();
            return;
        }

        const totalChars = getHtmlVisibleLength(formattedText);
        let charIndex = 0;

        intervalRef.current = setInterval(() => {
            charIndex++;
            if (charIndex <= totalChars) {
                setDisplayedText(getHtmlSubstring(formattedText, charIndex));
            } else {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setIsTyping(false);
                if (onComplete) onComplete();
            }
        }, speed);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [formattedText, speed]);

    const forceComplete = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayedText(formattedText);
        setIsTyping(false);
        if (onComplete) onComplete();
    }, [formattedText, onComplete]);

    return { displayedText, isTyping, forceComplete };
};