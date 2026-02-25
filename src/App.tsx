import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { 
  Zap,
  FileVideo,
  FileImage,
  Copy,
  Check
} from 'lucide-react';

export default function App() {
  const [fileData, setFileData] = useState<{ url: string, type: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generatePrompt = async (data: { url: string, type: string }) => {
    setIsGenerating(true);
    setPrompt(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const base64Data = data.url.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: data.type } },
            { text: "Act as an elite AI Video Architect. Analyze this content and create a professional cinematic video prompt. The prompt MUST start with either 'Give me' or 'Create a video'. Describe initial composition, specific camera dynamics (e.g. orbital tracking, slow push-in), lighting evolution, and fluid temporal motion. Output ONLY the final prompt paragraph." },
          ],
        },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      setPrompt(response.text || "");
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const data = { url: reader.result as string, type: file.type };
      setFileData(data);
      generatePrompt(data);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.items[0]?.getAsFile();
      if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
        processFile(file);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const copyToClipboard = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans p-4 md:p-8 max-w-xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 fill-black" />
          <h1 className="text-lg font-bold">AutoPrompt</h1>
        </div>
        {fileData && (
          <button onClick={() => { setFileData(null); setPrompt(null); }} className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-tighter">
            Reset
          </button>
        )}
      </header>

      <main className="space-y-6">
        {!fileData ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video rounded-xl border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <div className="flex gap-3 mb-2">
              <FileImage className="w-6 h-6 text-gray-300" />
              <FileVideo className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Give me a file to create a video</p>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" className="hidden" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
              {fileData.type.startsWith('video') ? (
                <video src={fileData.url} className="w-full h-full object-cover" autoPlay muted loop />
              ) : (
                <img src={fileData.url} className="w-full h-full object-cover" />
              )}
              {isGenerating && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="text-[10px] font-black tracking-[0.2em] animate-pulse">GENERATING...</div>
                </div>
              )}
            </div>

            {prompt && (
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm leading-relaxed mb-4">{prompt}</p>
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

