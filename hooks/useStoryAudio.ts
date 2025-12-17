import { useEffect, useRef } from 'react';

interface AudioConfig {
    bgmVolume: number;
    sfxVolume: number;
    voiceVolume: number;
}

export const useStoryAudio = (
    bgmUrl: string | undefined, 
    voiceUrl: string | undefined,
    config: AudioConfig
) => {
    const bgmRef = useRef<HTMLAudioElement | null>(null);
    const voiceRef = useRef<HTMLAudioElement | null>(null);
    const currentBgmUrlRef = useRef<string>("");

    // Initialize
    useEffect(() => {
        bgmRef.current = new Audio();
        bgmRef.current.loop = true;
        voiceRef.current = new Audio();

        return () => {
            bgmRef.current?.pause();
            voiceRef.current?.pause();
        };
    }, []);

    // Handle BGM
    useEffect(() => {
        const audio = bgmRef.current;
        if (!audio) return;

        audio.volume = config.bgmVolume;

        if (bgmUrl) {
            if (currentBgmUrlRef.current !== bgmUrl) {
                audio.src = bgmUrl;
                currentBgmUrlRef.current = bgmUrl;
                audio.play().catch(() => {});
            } else if (audio.paused) {
                audio.play().catch(() => {});
            }
        } else {
            audio.pause();
            currentBgmUrlRef.current = "";
        }
    }, [bgmUrl, config.bgmVolume]);

    // Handle Voice
    useEffect(() => {
        const audio = voiceRef.current;
        if (!audio) return;
        
        // Reset previous voice
        audio.pause();
        audio.currentTime = 0;

        if (voiceUrl) {
            audio.src = voiceUrl;
            audio.volume = config.voiceVolume;
            audio.play().catch(() => {});
        }
    }, [voiceUrl, config.voiceVolume]);

    const playSfx = (url: string) => {
        if (!url) return;
        const sfx = new Audio(url);
        sfx.volume = config.sfxVolume;
        sfx.play().catch(() => {});
    };

    return { playSfx };
};