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
            iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
            iframe.title = 'YouTube video';
            iframe.allow =
              'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.allowFullscreen = true;
            iframe.className = 'absolute top-0 left-0 w-full h-full border-none rounded-xl';

            iframe.onerror = () => {
              while (container.firstChild) container.removeChild(container.firstChild);
              const wrapper = document.createElement('div');
              wrapper.className = 'absolute inset-0 flex items-center justify-center text-center bg-gray-900 text-white p-4';
              const inner = document.createElement('div');
              const p = document.createElement('p');
              p.className = 'text-gray-300';
              p.textContent = 'Video ni na voljo';
              const a = document.createElement('a');
              a.href = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
              a.target = '_blank';
              a.rel = 'noopener noreferrer';
              a.className = 'underline text-cyan-400 mt-2 inline-block hover:text-cyan-300';
              a.textContent = 'Poglej na YouTube';
              inner.appendChild(p);
              inner.appendChild(a);
              wrapper.appendChild(inner);
              container.appendChild(wrapper);
            };

            while (container.firstChild) container.removeChild(container.firstChild);
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
    <div className="group">
      <div
        className="video-container relative w-full pt-[56.25%] overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-xl shadow-lg ring-1 ring-gray-300 dark:ring-white/10 transition-all duration-300 group-hover:ring-indigo-500/50 dark:group-hover:ring-purple-500/50 group-hover:shadow-indigo-500/20 dark:group-hover:shadow-purple-500/20"
        data-id={videoId}
      >
        <img
          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
          alt={`Video: ${videoDescr}`}
          loading="lazy"
          className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">
        {videoDescr}
      </p>
    </div>
  );
};

export default VideoComponent;
