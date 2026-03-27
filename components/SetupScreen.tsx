import React from 'react';
import { ProficiencyLevel, TOPICS } from '../types';

interface SetupScreenProps {
  onStart: (level: ProficiencyLevel, topic: string, count: number) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const [selectedLevel, setSelectedLevel] = React.useState<ProficiencyLevel | null>(null);
  const [selectedTopic, setSelectedTopic] = React.useState<string | null>(null);
  const [exerciseCount, setExerciseCount] = React.useState<number>(3);

  const handleStart = () => {
    if (selectedLevel && selectedTopic) {
      onStart(selectedLevel, selectedTopic, exerciseCount);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-indigo-700 mb-2 tracking-tight">LinguaListen</h1>
        <p className="text-slate-600 text-lg">Master English listening with AI-powered personalized exercises.</p>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
          <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">1</span>
          Select Proficiency Level
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.values(ProficiencyLevel).map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left font-medium
                ${selectedLevel === level 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md transform scale-105' 
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-slate-50'
                }`}
            >
              {level}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
          <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">2</span>
          Choose a Topic
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`px-3 py-3 rounded-lg text-sm font-semibold transition-colors
                ${selectedTopic === topic
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
           <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">3</span>
           Number of Exercises
        </h2>
        <div className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-slate-200 w-full md:w-1/2">
          <input
            type="range"
            min="1"
            max="10"
            value={exerciseCount}
            onChange={(e) => setExerciseCount(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <span className="text-2xl font-bold text-indigo-600 w-12 text-center">{exerciseCount}</span>
        </div>
      </section>

      <div className="sticky bottom-4 z-10">
        <button
          onClick={handleStart}
          disabled={!selectedLevel || !selectedTopic}
          className={`w-full py-4 rounded-2xl text-lg font-bold shadow-xl transition-all
            ${!selectedLevel || !selectedTopic
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-2xl hover:-translate-y-1'
            }`}
        >
          Start Homework
        </button>
      </div>
    </div>
  );
};

export default SetupScreen;
