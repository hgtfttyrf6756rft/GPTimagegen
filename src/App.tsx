/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Download, Loader2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceFile(file);
      const url = URL.createObjectURL(file);
      setReferencePreview(url);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovering(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setReferenceFile(file);
      const url = URL.createObjectURL(file);
      setReferencePreview(url);
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReferenceFile(null);
    if (referencePreview) {
      URL.revokeObjectURL(referencePreview);
    }
    setReferencePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateImage = async () => {
    if (!prompt.trim() && !referenceFile) {
      setError('Please provide a prompt or a reference image.');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const formData = new FormData();
      if (prompt.trim()) {
        formData.append('prompt', prompt);
      }
      if (referenceFile) {
        formData.append('image', referenceFile);
      }

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.imageUrl) {
        throw new Error('No image was returned.');
      }
      
      setGeneratedImage(result.imageUrl);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating the image.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-zinc-200 rounded-full text-sm font-medium shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-zinc-700">OpenAI Image Generation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900">
            Create exactly what you imagine.
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl">
            Describe an image or upload a reference file to edit an existing image. 
            Powered by the latest OpenAI image generation model.
          </p>
        </header>

        {/* Main Grid */}
        <div className="grid md:grid-cols-[400px_1fr] xl:grid-cols-[450px_1fr] gap-8 xl:gap-12 items-start">
          
          {/* Controls Column */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200 space-y-8">
            
            {/* Text Prompt */}
            <div className="space-y-3">
              <label htmlFor="prompt" className="block text-sm font-medium text-zinc-800">
                Instruction / Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A gorgeous image of a river made of white owl feathers, snaking its way through a serene winter landscape..."
                className="w-full h-32 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-700"
              />
            </div>

            {/* Reference Image */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-zinc-800">
                  Reference Image
                </label>
                <span className="text-xs text-zinc-400 font-medium tracking-wide uppercase">Optional</span>
              </div>
              
              <div 
                onClick={() => !referencePreview && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
                onDragLeave={() => setIsHovering(false)}
                onDrop={onDrop}
                className={cn(
                  "relative group overflow-hidden rounded-2xl border-2 border-dashed transition-all cursor-pointer",
                  isHovering ? "border-blue-400 bg-blue-50/50" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80",
                  referencePreview ? "border-transparent bg-transparent border-0" : "h-40 flex flex-col items-center justify-center p-6"
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />

                {referencePreview ? (
                  <div className="relative rounded-2xl overflow-hidden shadow-sm group">
                    <img 
                      src={referencePreview} 
                      alt="Reference" 
                      className="w-full h-auto max-h-[250px] object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <button 
                        onClick={handleClearFile}
                        className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-sm transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-zinc-100 mx-auto group-hover:scale-110 transition-transform duration-300">
                      <ImageIcon className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-700">Click or drag image here</p>
                      <p className="text-xs text-zinc-500 mt-1">PNG, JPG or WebP</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex gap-3 items-start border border-red-100">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                    <p className="text-sm">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generate Button */}
            <button
              onClick={generateImage}
              disabled={isGenerating || (!prompt.trim() && !referenceFile)}
              className="w-full py-4 px-6 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded-2xl font-medium tracking-wide transition-colors flex items-center justify-center gap-2 group shadow-sm disabled:shadow-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  Generate Image
                </>
              )}
            </button>
            
          </div>

          {/* Output Area */}
          <div className="relative bg-zinc-200/50 rounded-3xl min-h-[400px] xl:min-h-[500px] flex items-center justify-center overflow-hidden border border-zinc-200 shadow-sm">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-100"
                >
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-zinc-200 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="w-16 h-16 border-4 border-transparent border-b-blue-300 rounded-full animate-spin absolute inset-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  </div>
                  <p className="mt-6 text-zinc-500 font-medium tracking-wide animate-pulse">
                    Crafting your image...
                  </p>
                </motion.div>
              ) : generatedImage ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full h-full flex flex-col group p-2"
                >
                  <img 
                    src={generatedImage} 
                    alt="Generated by AI" 
                    className="w-full h-auto max-h-[800px] object-contain rounded-2xl shadow-sm"
                  />
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                    <a
                      href={generatedImage}
                      download="gemini-generated.png"
                      className="flex items-center gap-2 bg-white/95 hover:bg-white text-zinc-900 px-5 py-3 rounded-full shadow-lg backdrop-blur-md font-medium transition-all hover:scale-105 active:scale-95 border border-zinc-200/50"
                    >
                      <Download className="w-4 h-4" />
                      Save Image
                    </a>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center text-zinc-400 p-8 text-center"
                >
                  <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-medium text-zinc-500">No image generated yet</p>
                  <p className="text-sm mt-2 max-w-xs text-zinc-400">
                    Enter a prompt or upload an image and click generate to see the magic happen.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
        </div>
      </div>
    </div>
  );
}

