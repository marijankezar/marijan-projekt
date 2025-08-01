// MovieList.tsx
'use client';

import React, { useState } from 'react';
import VideoComponent from '../components/videoComponent';
import { videoDataMap, videoGroups } from 'app/data/videoData';

const MovieList: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<number>(1);

  const videoIds = videoDataMap[selectedGroup] || [];
  const videoDescriptions = videoIds.map((_, i) => `Video št. ${i + 1}`);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-center mb-4">👪 Družina Kežar</h2>

      {/* Auswahlfeld */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 px-4 py-4">
        <label className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
          🎵 izberi vido kategorijo:
        </label>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(Number(e.target.value))}
          className="w-full sm:w-80 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl px-5 py-3 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        >
          {videoGroups.map((group) => (
            <option key={group.value} value={group.value}>
              {group.label}
            </option>
          ))}
        </select>
      </div>

      {/* Videos anzeigen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videoIds.map((id, index) => (
          <VideoComponent key={id} videoId={id} videoDescr={videoDescriptions[index]} />
        ))}
      </div>
    </div>
  );
};

export default MovieList;
