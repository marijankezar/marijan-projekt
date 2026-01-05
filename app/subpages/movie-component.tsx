'use client';

import React, { useState } from 'react';
import VideoComponent from '../components/videoComponent';
import { videoDataMap, videoGroups } from 'app/data/videoData';
import CustomDropdown from './CustomDropdown';

const MovieList: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<number>(1);

  const videoIds = videoDataMap[selectedGroup] || [];
  const selectedLabel = videoGroups.find(g => g.value === selectedGroup)?.label || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Video Arhiv
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {videoIds.length} {videoIds.length === 1 ? 'video' : 'videov'} v kategoriji
        </p>
      </div>

      {/* Dropdown Auswahl */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
        <label className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300">
          Izberi kategorijo:
        </label>
        <CustomDropdown
          options={videoGroups}
          selectedValue={selectedGroup}
          onChange={(value) => setSelectedGroup(value)}
        />
      </div>

      {/* Aktuelle Kategorie Anzeige */}
      {selectedGroup > 1 && (
        <div className="text-center">
          <span className="inline-block px-4 py-2 bg-indigo-100 dark:bg-purple-900/50 rounded-full text-indigo-700 dark:text-purple-300 text-sm font-medium">
            {selectedLabel}
          </span>
        </div>
      )}

      {/* Videos Grid */}
      {videoIds.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoIds.map((id, index) => (
            <VideoComponent
              key={id}
              videoId={id}
              videoDescr={`Video ${index + 1}`}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p>Ni videov v tej kategoriji</p>
        </div>
      )}
    </div>
  );
};

export default MovieList;
