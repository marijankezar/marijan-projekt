'use client';

import React, { useEffect } from 'react';

interface VideoComponentProps {
  videoId: string;
  videoDescr: string;
}

const VideoComponent: React.FC<VideoComponentProps> = ({ videoId, videoDescr }) => {
  useEffect(() => {
    const container = document.querySelector(`.video-container[data-id="${videoId}"]`);
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${videoId}`;
            iframe.title = 'YouTube video';
            iframe.allow =
              'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.allowFullscreen = true;
            iframe.className = 'absolute top-0 left-0 w-full h-full border-none rounded-lg';

            // Fallback, wenn das Video nicht geladen werden kann
            iframe.onerror = () => {
              container.innerHTML = `
                <div class="absolute inset-0 flex items-center justify-center text-center bg-black text-white p-4">
                  <div>
                    <p>🚫 Dieses Video kann nicht eingebettet werden.</p>
                    <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer" class="underline text-blue-400 mt-2 inline-block">
                      ➤ Auf YouTube ansehen
                    </a>
                  </div>
                </div>
              `;
            };

            container.innerHTML = '';
            container.appendChild(iframe);
            observer.unobserve(container);
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [videoId]);

  return (
    <div className="space-y-2 text-center">
      <h2 className="text-xl font-medium text-gray-800">{videoDescr}</h2>
      <div
        className="video-container relative w-full pt-[56.25%] overflow-hidden bg-gray-900 rounded-lg shadow-md"
        data-id={videoId}
      >
        <img
          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
          alt={`Vorschau für Video ID: ${videoId}`}
          loading="lazy"
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default VideoComponent;
