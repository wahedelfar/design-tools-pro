
import React, { useState, useCallback, useEffect } from 'react';
import { PromptStudioProject, ImageFile, PromptStudioHistoryItem } from '../types';
import { analyzeImageForPrompt, generatePromptFromText } from '../services/geminiService';
import { resizeImage } from '../utils';
import ImageWorkspace from './ImageWorkspace';

const MagicWandIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.477 2.387a2 2 0 001.414 2.333l2.387.477a2 2 0 002.333-1.414l.477-2.387a2 2 0 00-1.76-2.387zM5.572 15.428a2 2 0 011.022-.547l2.387-.477a2 2 0 011.96 1.414l.477 2.387a2 2 0 01-1.414 2.333l-2.387.477a2 2 0 01-2.333-1.414l-.477-2.387a2 2 0 011.76-2.387zM12.5 5.5a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const PromptStudio: React.FC<{
  project: PromptStudioProject;
  setProject: React.Dispatch<React.SetStateAction<PromptStudioProject>>;
}> = ({ project, setProject }) => {
    const [copied, setCopied] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("جاري تشفير البيكسلات...");

    const loadingSteps = [
        "جاري تشفير البيكسلات...",
        "تحليل زوايا الإضاءة السينمائية...",
        "استخراج أنماط الألوان المتقدمة...",
        "تفكيك هندسة المشهد...",
        "إنتاج الوصف النهائي..."
    ];

    useEffect(() => {
        if (project.isLoading) {
            let step = 0;
            const interval = setInterval(() => {
                step = (step + 1) % loadingSteps.length;
                setLoadingMessage(loadingSteps[step]);
            }, 2500);
            return () => clearInterval(interval);
        }
    }, [project.isLoading]);

    const handleFileUpload = async (files: File[]) => {
      if (!files || files.length === 0) return;
      setProject(s => ({ ...s, isUploading: true, error: null }));
      try {
          const uploaded = await Promise.all(files.map(async file => {
              const resizedFile = await resizeImage(file, 2048, 2048);
              const reader = new FileReader();
              return new Promise<ImageFile>(res => {
                  reader.onloadend = () => res({ base64: (reader.result as string).split(',')[1], mimeType: resizedFile.type, name: resizedFile.name });
                  reader.readAsDataURL(resizedFile);
              });
          }));
          setProject(s => ({ ...s, images: [...s.images, ...uploaded], isUploading: false }));
      } catch (err) {
          setProject(s => ({ ...s, error: "فشل رفع الصور", isUploading: false }));
      }
    };

    const handleGenerate = useCallback(async () => {
        if (project.images.length === 0 && !project.instructions.trim()) {
            setProject(s => ({ ...s, error: 'يرجى رفع صورة أو كتابة فكرة لتحليلها.' }));
            return;
        }
        setProject(s => ({ ...s, isLoading: true, error: null, generatedPrompt: null }));
        try {
            let prompt: string;
            if (project.images.length > 0) {
                prompt = await analyzeImageForPrompt(project.images, project.instructions);
            } else {
                prompt = await generatePromptFromText(project.instructions);
            }

            const newHistoryItem: PromptStudioHistoryItem = {
                image: project.images[0] || { base64: '', mimeType: '', name: 'text' },
                instructions: project.instructions,
                generatedPrompt: prompt,
            };
            setProject(s => ({
                ...s,
                isLoading: false,
                generatedPrompt: prompt,
                history: [newHistoryItem, ...s.history],
                instructions: '',
            }));
        } catch (err) {
            setProject(s => ({ ...s, isLoading: false, error: 'حدث خطأ أثناء التحليل الذكي.' }));
        }
    }, [project.images, project.instructions, setProject]);

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
        <main className="w-full max-w-6xl mx-auto flex flex-col gap-8 pt-4 pb-12 text-right font-tajawal">
            <div className="glass-card rounded-[2.5rem] p-8 shadow-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-white flex items-center">
                            <MagicWandIcon /> استوديو تحليل الوصف الذكي
                        </h2>
                        <p className="text-white/40 text-sm mt-2">ارفع أي صورة وسنقوم باستخراج "الشيفرة البرمجية" التي تصفها للذكاء الاصطناعي.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">الصورة المرجعية</label>
                        <div className="aspect-square relative group">
                            <div className="absolute inset-0 bg-[var(--color-accent)] opacity-5 blur-2xl rounded-full group-hover:opacity-10 transition-opacity"></div>
                            <ImageWorkspace
                                id="prompt-studio-uploader"
                                title="ارفع الصورة للتحليل"
                                images={project.images}
                                onImagesUpload={handleFileUpload}
                                onImageRemove={(idx) => setProject(s => ({...s, images: s.images.filter((_, i) => i !== idx)}))}
                                isUploading={project.isUploading}
                                onImageUpdate={(idx, img) => setProject(s => {
                                    const next = [...s.images];
                                    next[idx] = img;
                                    return {...s, images: next};
                                })}
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="flex flex-col gap-3 bg-white/5 p-6 rounded-3xl border border-white/5">
                            <label className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-widest">تعليمات إضافية (اختياري)</label>
                            <textarea
                                value={project.instructions}
                                onChange={e => setProject({...project, instructions: e.target.value})}
                                placeholder="مثال: ركز على نوع الإضاءة أو اجعل الوصف أكثر دراماتيكية..."
                                className="w-full bg-transparent border-none p-0 text-lg font-medium focus:ring-0 placeholder:text-white/10 min-h-[120px] suggestions-scrollbar"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={project.isLoading || project.isUploading || (project.images.length === 0 && !project.instructions.trim())}
                            className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white font-black py-5 rounded-2xl shadow-xl shadow-[var(--color-accent)]/20 transition-all text-xl flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {project.isLoading ? (
                                <>
                                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {loadingMessage}
                                </>
                            ) : (
                                <>ابدأ التحليل الذكي واستخرج الوصف</>
                            )}
                        </button>

                        {project.error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold text-center">{project.error}</div>}
                    </div>
                </div>
            </div>

            {project.generatedPrompt && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="glass-card p-8 rounded-[2.5rem] bg-black/40 border border-[var(--color-accent)]/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-[var(--color-accent)] opacity-10 blur-[80px]"></div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-white">الوصف الإعلاني المولد (AI Prompt)</h3>
                            <button
                                onClick={() => handleCopy(project.generatedPrompt || '')}
                                className="flex items-center text-xs px-6 py-2.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all font-bold"
                            >
                                {copied ? <CheckIcon /> : <CopyIcon />}
                                {copied ? 'تم النسخ!' : 'نسخ الوصف الاحترافي'}
                            </button>
                        </div>
                        <div className="bg-black/60 p-8 rounded-3xl border border-white/5 font-mono text-emerald-400 text-lg leading-relaxed shadow-inner">
                            {project.generatedPrompt}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">هذا الوصف مهيأ للاستخدام في Creator Studio مباشرة</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="glass-card rounded-[2.5rem] p-8 border border-white/5">
                <h3 className="text-xl font-black text-white mb-6">تاريخ التحليلات السابقة</h3>
                {project.history.length === 0 ? (
                    <div className="text-center py-12 text-white/20 font-bold uppercase tracking-widest border border-white/5 border-dashed rounded-3xl">لا توجد تحليلات سابقة بعد</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {project.history.map((item, idx) => (
                            <div key={idx} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                                {item.image.base64 && (
                                    <img src={`data:${item.image.mimeType};base64,${item.image.base64}`} className="w-24 h-24 object-cover rounded-xl border border-white/10" />
                                )}
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs text-emerald-400/70 font-mono line-clamp-3 leading-relaxed">{item.generatedPrompt}</p>
                                    <button onClick={() => handleCopy(item.generatedPrompt)} className="mt-2 text-[10px] font-black text-[var(--color-accent)] uppercase opacity-0 group-hover:opacity-100 transition-opacity">إعادة النسخ</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
};

export default PromptStudio;
