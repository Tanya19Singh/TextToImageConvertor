import React, { useState } from 'react';
import { ImageIcon, Loader2, AlertCircle } from 'lucide-react';

function App() {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    setImage(null);

    const maxRetries = 5;
    const retryDelay = 3000; // 3 seconds

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(
          "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY}`,
            },
            body: JSON.stringify({
              inputs: `${prompt}, professional photography, photorealistic, 8k uhd, high detail, masterpiece, realistic lighting, natural colors`,
              parameters: {
                negative_prompt: "cartoon, anime, illustration, painting, drawing, artificial, rendered, low quality, blurry, grainy",
                num_inference_steps: 75,
                guidance_scale: 9,
                width: 1024,
                height: 1024,
              }
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error?.includes('loading')) {
            if (attempt < maxRetries - 1) {
              await wait(retryDelay);
              continue;
            }
          }
          throw new Error(errorData.error || 'Failed to generate image');
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setImage(imageUrl);
        break;
      } catch (err) {
        if (attempt === maxRetries - 1) {
          setError(err instanceof Error ? err.message : 'Failed to generate image');
        } else {
          await wait(retryDelay);
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <ImageIcon className="w-8 h-8" />
          <h1 className="text-3xl font-bold">AI Image Generator</h1>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
          <div className="mb-6">
            <label htmlFor="prompt" className="block text-sm font-medium mb-2">
              Enter your prompt
            </label>
            <div className="flex gap-3">
              <input
                id="prompt"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="A serene mountain landscape at sunset..."
              />
              <button
                onClick={generateImage}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Generate'
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-900/50 border border-red-500 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-500">{error}</p>
            </div>
          )}

          <div className="relative min-h-[200px] bg-gray-700 rounded-lg overflow-hidden">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : image ? (
              <img
                src={image}
                alt="Generated"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                Generated image will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;