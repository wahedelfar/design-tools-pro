
import React, { useCallback, useState, useEffect } from 'react';
import { PlanStudioProject, ImageFile, PlanIdea } from '../types';
import { resizeImage } from '../utils';
import { generateCampaignPlan, generateImage, analyzeProductForCampaign } from '../services/geminiService';
import ImageWorkspace from './ImageWorkspace';

const MagicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const TARGET_MARKETS = [
    'مصر', 'المملكة العربية السعودية', 'الإمارات العربية المتحدة', 'الخليج العربي', 'عالمي / دولي', 'أوروبا', 'أمريكا الشمالية'
];

const DIALECTS = [
    'العربية (لهجة مصرية دارجة)', 'العربية (لهجة مصرية ساخرة)', 'العربية (لهجة خليجية)', 'العربية الفصحى (احترافية)', 'لهجة شامية', 'الإنجليزية (احترافية)', 'الإنجليزية (شبابية/Slang)'
];

const LOGO_IMAGE_URL = "https://i.ibb.co/MDrpHPzS/Artboard-1.png";

const PlanStudio: React.FC<{
    project: PlanStudioProject;
    setProject: React.Dispatch<React.SetStateAction<PlanStudioProject>>;
}> = ({ project, setProject }) => {

    const onCreatePlan = async () => {
        if (!project.prompt.trim()) {
            setProject(s => ({ ...s, error: 'يرجى وصف هدفك أو رؤيتك للحملة.' }));
            return;
        }
        setProject(s => ({ ...s, isGeneratingPlan: true, error: null }));
        try {
            const plan = await generateCampaignPlan(project.productImages, project.prompt, project.targetMarket, project.dialect);
            setProject(s => ({ ...s, ideas: plan, isGeneratingPlan: false }));
        } catch (err) {
            setProject(s => ({ ...s, isGeneratingPlan: false, error: "فشل إنشاء الخطة الإعلانية" }));
        }
    };

    return (
        <main className="w-full flex flex-col gap-8 pt-4 pb-12 animate-in fade-in duration-700 text-right">
            <div className="glass-card rounded-[2.5rem] p-8 shadow-2xl">
                <h2 className="text-3xl font-black text-white tracking-tighter flex items-center mb-6">
                    <MagicIcon /> مخطط الحملات الإعلانية الاستراتيجي
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">صورة المنتج (اختياري)</label>
                        <ImageWorkspace id="plan-product-up" images={project.productImages} isUploading={project.isUploading} onImagesUpload={() => {}} onImageRemove={() => {}} />
                    </div>

                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="flex flex-col gap-2 bg-white/5 p-6 rounded-3xl border border-white/5">
                            <label className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-widest">هدف الحملة ورؤية العلامة التجارية</label>
                            <textarea
                                value={project.prompt}
                                onChange={(e) => setProject(s => ({ ...s, prompt: e.target.value }))}
                                placeholder="مثال: إطلاق عطر فاخر للنساء لفترة محدودة، التركيز على الأناقة والغموض."
                                className="w-full bg-transparent border-none p-0 text-lg font-medium focus:ring-0 placeholder:text-white/20 min-h-[100px]"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">السوق المستهدف</label>
                                <select 
                                    value={project.targetMarket}
                                    onChange={(e) => setProject(s => ({ ...s, targetMarket: e.target.value }))}
                                    className="bg-transparent border-none p-0 text-sm font-bold text-white focus:ring-0"
                                >
                                    {TARGET_MARKETS.map(m => <option key={m} value={m} className="bg-gray-900">{m}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">لهجة المحتوى</label>
                                <select 
                                    value={project.dialect}
                                    onChange={(e) => setProject(s => ({ ...s, dialect: e.target.value }))}
                                    className="bg-transparent border-none p-0 text-sm font-bold text-white focus:ring-0"
                                >
                                    {DIALECTS.map(d => <option key={d} value={d} className="bg-gray-900">{d}</option>)}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={onCreatePlan}
                            disabled={project.isGeneratingPlan}
                            className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white font-black py-5 rounded-2xl shadow-xl shadow-[var(--color-accent)]/20 transition-all text-lg uppercase"
                        >
                            {project.isGeneratingPlan ? 'جاري بناء الاستراتيجية...' : 'ابتكر 9 منشورات مخصصة'}
                        </button>
                    </div>
                </div>
            </div>
            {/* Ideas result logic... */}
        </main>
    );
};

export default PlanStudio;
