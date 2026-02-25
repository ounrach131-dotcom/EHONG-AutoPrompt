import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { Zap, FileVideo, FileImage, Copy, Check, RefreshCw } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [fileData, setFileData] = useState<{ url: string, type: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generate = async (data: { url: string, type: string }) => {
    setIsGenerating(true);
    setPrompt(null);
    try {
      const res = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{
          parts: [
            { inlineData: { data: data.url.split(',')[1], mimeType: data.type } },
            { text: "Pro video prompt. Start 'Give me'/'Create a video'. Paragraph only." }
          ]
        }],
        config: {
          systemInstruction: "You are an elite AI Video Architect. Create professional cinematic prompts with camera dynamics and motion.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          maxOutputTokens: 150
        }
      });
      setPrompt(res.text || "");
    } catch (e) { console.error(e); }
    finally { setIsGenerating(false); }
  };

  const process = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = { url: reader.result as string, type: file.type };
      setFileData(data);
      generate(data);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = e.clipboardData?.items[0]?.getAsFile();
      if (f && (f.type.startsWith('image/') || f.type.startsWith('video/'))) process(f);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-lg space-y-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/5">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">AutoPrompt</h1>
              <p className="text-[10px] font-semibold text-black/30 uppercase tracking-widest mt-1">Instant Synthesis</p>
            </div>
          </div>
          {fileData && (
            <button 
              onClick={() => { setFileData(null); setPrompt(null); }} 
              className="text-[10px] font-bold text-black/40 hover:text-black uppercase tracking-widest transition-colors"
            >
              Reset
            </button>
          )}
        </header>

        <main className="space-y-8">
          {!fileData ? (
            <div 
              onClick={() => fileInputRef.current?.click()} 
              className="group relative aspect-video rounded-[32px] bg-white border border-black/[0.03] card-shadow flex flex-col items-center justify-center cursor-pointer hover:scale-[1.01] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/[0.01] rounded-[32px]" />
              <div className="flex gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-black/[0.02] flex items-center justify-center group-hover:bg-black/[0.04] transition-colors">
                  <FileImage className="w-6 h-6 text-black/20 group-hover:text-black/40 transition-colors" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-black/[0.02] flex items-center justify-center group-hover:bg-black/[0.04] transition-colors">
                  <FileVideo className="w-6 h-6 text-black/20 group-hover:text-black/40 transition-colors" />
                </div>
              </div>
              <p className="text-xs font-bold text-black/30 uppercase tracking-[0.2em] group-hover:text-black/60 transition-colors">Give me a file</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files?.[0] && process(e.target.files[0])} 
                accept="image/*,video/*" 
                className="hidden" 
              />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="relative aspect-video rounded-[32px] overflow-hidden bg-white card-shadow border border-black/[0.03]">
                {fileData.type.startsWith('video') ? (
                  <video src={fileData.url} className="w-full h-full object-cover" autoPlay muted loop />
                ) : (
                  <img src={fileData.url} className="w-full h-full object-cover" />
                )}
                {isGenerating && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-6 h-6 text-black animate-spin" />
                      <div className="text-[10px] font-black tracking-[0.3em] text-black uppercase">Synthesizing</div>
                    </div>
                  </div>
                )}
              </div>

              {prompt && (
                <div className="p-8 bg-white rounded-[32px] card-shadow border border-black/[0.03] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <p className="text-[15px] leading-relaxed text-black/70 font-medium">{prompt}</p>
                  <div className="h-px bg-black/[0.05] w-full" />
                  <button 
                    onClick={() => { navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 2000); }} 
                    className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 hover:text-black transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied to clipboard" : "Copy Master Prompt"}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        <footer className="text-center">
          <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.3em]">Paste anywhere to begin</p>
        </footer>
      </div>
    </div>
  );
}
