// MovieList.tsx
'use client';

import React, { useState } from 'react';
import VideoComponent from '../components/videoComponent';
import { videoDataMap, videoGroups } from 'app/data/videoData';
import CustomDropdown from './CustomDropdown';

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
    🎵 izberi video kategorijo:
  </label>

  <CustomDropdown
    options={videoGroups}
    selectedValue={selectedGroup}
    onChange={(value) => setSelectedGroup(value)}
  />
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
