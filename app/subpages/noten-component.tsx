'use client';

import React, { useState } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import { notenCategories, notenDataMap, MEDIA_BASE_URL } from 'app/data/notenData';
import CustomDropdown from './CustomDropdown';

const NotenList: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<number>(0);

  const noten = notenDataMap[selectedCategory] || [];
  const selectedLabel = notenCategories.find(g => g.value === selectedCategory)?.label || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gesangsnoten
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {noten.length} {noten.length === 1 ? 'Dokument' : 'Dokumente'} v kategoriji
        </p>
      </div>

      {/* Dropdown Auswahl */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
        <label className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300">
          Izberi kategorijo:
        </label>
        <CustomDropdown
          options={notenCategories}
          selectedValue={selectedCategory}
          onChange={(value) => setSelectedCategory(value)}
        />
      </div>

      {/* Aktuelle Kategorie */}
      {selectedCategory > 0 && (
        <div className="text-center">
          <span className="inline-block px-4 py-2 bg-amber-100 dark:bg-amber-900/50 rounded-full text-amber-700 dark:text-amber-300 text-sm font-medium">
            {selectedLabel}
          </span>
        </div>
      )}

      {/* Noten Grid */}
      {noten.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {noten.map((item, index) => {
            const pdfUrl = `${MEDIA_BASE_URL}/${encodeURIComponent(item.filename)}`;
            const thumbUrl = item.thumbnail
              ? `${MEDIA_BASE_URL}/${encodeURIComponent(item.thumbnail)}`
              : null;

            return (
              <div
                key={index}
                className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Thumbnail oder Platzhalter */}
                <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={item.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2">
                    {item.label}
                  </h3>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Odpri
                    </a>
                    <a
                      href={pdfUrl}
                      download
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Prenesi
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Izberi kategorijo za prikaz not</p>
        </div>
      )}
    </div>
  );
};

export default NotenList;
