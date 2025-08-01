'use client';

import { useState } from 'react';
import MovieList from './movie-component';

export default function MyMainContent() {

  // Zustand für das Alter
  const [age, setAge] = useState<number | undefined>(43); // Initialwert: 30
  const name = "Du hast eine Bewertung von";

  // Handler für Änderungen im Eingabefeld
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Setze Alter nur, wenn der Wert eine Zahl ist oder leer (für undefined)
    setAge(value ? parseInt(value) : undefined);
  };



  return (
    <div className="mx-auto my-8 w-full max-w-2xl">
      {/* Horizontale Trennlinie */}
      <div className="relative">
        <div className="living-line border-t-4 border-gray-600">
          <div className="scan-light"></div>
        </div>
      </div>

      <div>
        <br></br>
      </div>


      


      {/* <div>
        <iframe width="560" height="315" src="https://www.youtube.com/embed/v6f_UEf5y0c?si=saUuRtLaPXv9FvDG" 
        title="YouTube video player" frameBorder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
      </div> */}

    



      <div className="animate-gradient flex h-64 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-red-600 shadow-lg md:h-80 lg:h-96">
        <h1 className="animate-pulse-slow px-4 text-center font-['Caveat'] text-2xl text-white md:text-4xl lg:text-5xl">
        
          <p>Hvala Matej </p>
          <p>za </p>
          <p>videomaterial</p>
          <p>- . - . -</p>
          <p>Page in bearbeitung </p>
        </h1>
      </div>

      <div>
        <br></br>
      </div>


      {/* Horizontale Trennlinie */}
      <div className="relative">
        <div className="living-line border-t-4 border-gray-600">
          <div className="scan-light"></div>
        </div>
      </div>


      {/* Übergabe der Variablen an die test-Funktion */}
      <MovieList />

      {/* Horizontale Trennlinie */}
      <div className="relative">
        <div className="living-line border-t-4 border-gray-600">
          <div className="scan-light"></div>
        </div>
      </div>




      
      {/* Eingabefeld für eine Zahl */}
      <div className="my-4 text-center">
        <label htmlFor="ageInput" className="mr-2 text-lg">
          Bewertung eingeben:
        </label>
        <input
          id="ageInput"
          type="number"
          value={age !== undefined ? age : ''}
          onChange={handleAgeChange}
          className="rounded border border-gray-300 p-2 text-center"
          placeholder="Alter"
        />
      </div>

      {/* Übergabe der Variablen an die test-Funktion */}
      <div>
        {test({ name, age })}
      </div>
    
      
    </div>
  );
}




// Funktion mit Typ für den Parameter
interface TestProps {
  name: string;
  age?: number;
}

function test({ name, age }: TestProps) {
  return (
    <div className="text-center">
      {name} {age ? `: ${age}Danke du gast Punkte abgegeben` : ""}
    </div>
  );
}





