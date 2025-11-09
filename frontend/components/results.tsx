interface ResultsData {
  confidence: number;
  is_ai_generated: boolean;
  n_frames: number;
  message: string;
  reasoning?: string;
}

interface ResultScreenProps {
  results: ResultsData;
  onReset?: () => void;
}

export default function ResultScreen({ results, onReset }: ResultScreenProps) {
  const { confidence, is_ai_generated, n_frames, message, reasoning } = results;

  return (
    <div className="p-8 max-w-2xl mx-auto text-center bg-white/90 backdrop-blur-sm rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold mb-6" style={{ color: 'black' }}>
        {is_ai_generated ? "🤖 AI-Generated Detected!" : "✅ Likely Real Video"}
      </h2>
      
      <div className="mb-6">
        <div className="text-6xl font-bold mb-2" style={{ color: is_ai_generated ? '#ef4444' : '#22c55e' }}>
          {is_ai_generated ? confidence : 100 - confidence}%
        </div>
        <p className="text-lg text-gray-700 mb-4">
          {is_ai_generated 
            ? "Confidence that this video is AI-generated" 
            : "Confidence that this video is real"}
        </p>
      </div>

      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <p className="text-gray-800">{message}</p>
      </div>

      {reasoning && (
        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Why this result?</h3>
          <p className="text-blue-800 text-sm leading-relaxed">{reasoning}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
        <span>📊 Analyzed {n_frames} frames</span>
      </div>

      <div className="mt-8">
        <button
          onClick={() => onReset ? onReset() : window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Analyze Another Video
        </button>
      </div>
    </div>
  );
}