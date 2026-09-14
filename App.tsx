
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AppView, 
  CreatorStudioProject, 
  PhotoshootDirectorProject, 
  PromptStudioProject,
  VoiceOverStudioProject,
  BrandingStudioProject,
  ControllerStudioProject,
  CampaignStudioProject,
  PlanStudioProject,
  EditStudioProject
} from './types';
import CreatorStudio from './components/CreatorStudio';
import PhotoshootDirector from './components/PhotoshootDirector';
import PromptStudio from './components/PromptStudio';
import VoiceOverStudio from './components/VoiceOverStudio';
import BrandingStudio from './components/BrandingStudio';
import ControllerStudio from './components/ControllerStudio';
import CampaignStudio from './components/CampaignStudio';
import VideoStudio from './components/VideoStudio';
import PlanStudio from './components/PlanStudio';
import EditStudio from './components/EditStudio';
import TabBar from './components/TabBar';
import { LIGHTING_STYLES, CAMERA_PERSPECTIVES, VOICES, CONTROLLER_SLIDERS } from './constants';

const LOGO_IMAGE_URL = "https://i.ibb.co/MDrpHPzS/Artboard-1.png";

const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const Typewriter = () => {
    const words = ["تصميمك", "تصويرك", "تعليقك الصوتي", "تعديلك الاحترافي"];
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(150);

    useEffect(() => {
        const handleType = () => {
            const fullWord = words[currentWordIndex % words.length];

            setCurrentText(prev => {
                if (isDeleting) {
                    return fullWord.substring(0, prev.length - 1);
                } else {
                    return fullWord.substring(0, prev.length + 1);
                }
            });

            if (isDeleting) {
                setTypingSpeed(75);
            } else {
                setTypingSpeed(150);
            }

            if (!isDeleting && currentText === fullWord) {
                setTypingSpeed(2000);
                setIsDeleting(true);
            } else if (isDeleting && currentText === "") {
                setIsDeleting(false);
                setCurrentWordIndex(prev => prev + 1);
                setTypingSpeed(500);
            }
        };

        const timer = setTimeout(handleType, typingSpeed);
        return () => clearTimeout(timer);
    }, [currentText, isDeleting, currentWordIndex, words, typingSpeed]);

    return (
        <span className="text-[var(--color-accent)] inline-flex items-center">
            {currentText}
            <span className="animate-pulse mr-1 text-[var(--color-accent)] font-light">|</span>
        </span>
    );
};

const InteractiveLogo = () => {
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const ref = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
  
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 400;
  
        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          const moveX = -(dx / dist) * 120 * force;
          const moveY = -(dy / dist) * 120 * force;
          setOffset({ x: moveX, y: moveY });
        } else {
          setOffset({ x: 0, y: 0 });
        }
      };
  
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);
  
    return (
      <div
        ref={ref}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: 'transform 0.1s ease-out',
        }}
        className="relative z-0"
      >
          <div className="animate-float">
              <a href="https://linktr.ee/mahmoudredaph" target="_blank" rel="noopener noreferrer">
                  <img
                  src="https://i.ibb.co/4n88pYH1/jenta-branding-3d-glass-app-icon-4k-1-copy.png"
                  alt="Jenta 3D Icon"
                  className="w-64 h-64 md:w-96 md:h-96 object-contain drop-shadow-2xl opacity-90 hover:opacity-100 transition-opacity"
                  />
              </a>
          </div>
      </div>
    );
  };

const createNewCreatorProject = (projectCount: number): CreatorStudioProject => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  name: `مشروع ${projectCount + 1}`,
  productImages: [],
  styleImages: [], 
  generatedImage: null,
  history: [],
  options: {
    lightingStyle: LIGHTING_STYLES[0].value,
    cameraPerspective: CAMERA_PERSPECTIVES[0].value,
  },
  prompt: '',
  isPromptAutoGenerated: false,
  styleDescription: null,
  isAnalyzingStyle: false,
  isLoading: false,
  error: null,
  uploadingTarget: null,
  translatedPrompt: null,
  isTranslating: false,
  editPrompt: '',
  isEditing: false,
});

const createNewPhotoshootProject = (projectCount: number): PhotoshootDirectorProject => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  name: `تصوير ${projectCount + 1}`,
  productImages: [],
  selectedShotTypes: [],
  results: [],
  isGenerating: false,
  error: null,
  isUploading: false,
  customStylePrompt: '',
});

const createNewPromptStudioProject = (projectCount: number): PromptStudioProject => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  name: `وصف ${projectCount + 1}`,
  images: [],
  instructions: '',
  generatedPrompt: null,
  history: [],
  isLoading: false,
  isUploading: false,
  error: null,
});

const createNewVoiceOverStudioProject = (projectCount: number): VoiceOverStudioProject => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  name: `تعليق ${projectCount + 1}`,
  text: '',
  styleInstructions: '',
  selectedVoice: VOICES[0].value,
  generatedAudio: null,
  isLoading: false,
  error: null,
  history: [],
  isPlaying: false,
  voiceGenderFilter: 'All',
  previewLoadingVoice: null,
  previewPlayingVoice: null,
});

const createNewControllerProject = (projectCount: number): ControllerStudioProject => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: `تحكم ${projectCount + 1}`,
    sourceImages: [], 
    generatedImage: null,
    isUploading: false,
    isGenerating: false,
    error: null,
    sliders: JSON.parse(JSON.stringify(CONTROLLER_SLIDERS)),
    activeCategory: 'Face',
    history: [],
});

const createNewCampaignProject = (projectCount: number): CampaignStudioProject => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: `حملة ${projectCount + 1}`,
    productImages: [],
    isUploading: false,
    isAnalyzing: false,
    isGenerating: false,
    error: null,
    results: [],
    productAnalysis: null,
    selectedMood: 'Original',
    customPrompt: '',
    mode: 'auto',
    customIdeas: ['', '', ''],
});

const createNewPlanProject = (projectCount: number): PlanStudioProject => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: `خطة ${projectCount + 1}`,
    productImages: [],
    logos: [],
    prompt: '',
    targetMarket: 'مصر',
    dialect: 'العربية (لهجة مصرية دارجة)',
    categoryAnalysis: null,
    isAnalyzingCategory: false,
    ideas: [],
    isGeneratingPlan: false,
    isUploading: false,
    error: null,
});

const createNewEditProject = (projectCount: number): EditStudioProject => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: `تعديل ${projectCount + 1}`,
    baseImages: [], 
    localTexts: {},
    committedTexts: {},
    globalLayers: [],
    adjustments: {
        sharpness: 100,
        lut: 'Original'
    },
    isUploading: false,
    error: null,
});

function App() {
  const [view, setView] = useState<AppView>('creator_studio');
  const [theme, setTheme] = useState('dark');
  const contentRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  const [creatorProjects, setCreatorProjects] = useState<CreatorStudioProject[]>([createNewCreatorProject(0)]);
  const [activeCreatorIndex, setActiveCreatorIndex] = useState(0);

  const [photoshootProjects, setPhotoshootProjects] = useState<PhotoshootDirectorProject[]>([createNewPhotoshootProject(0)]);
  const [activePhotoshootIndex, setActivePhotoshootIndex] = useState(0);

  const [promptStudioProjects, setPromptStudioProjects] = useState<PromptStudioProject[]>([createNewPromptStudioProject(0)]);
  const [activePromptStudioIndex, setActivePromptStudioIndex] = useState(0);

  const [voiceOverProjects, setVoiceOverProjects] = useState<VoiceOverStudioProject[]>([createNewVoiceOverStudioProject(0)]);
  const [activeVoiceOverIndex, setActiveVoiceOverIndex] = useState(0);

  const [controllerProjects, setControllerProjects] = useState<ControllerStudioProject[]>([createNewControllerProject(0)]);
  const [activeControllerIndex, setActiveControllerIndex] = useState(0);

  const [campaignProjects, setCampaignProjects] = useState<CampaignStudioProject[]>([createNewCampaignProject(0)]);
  const [activeCampaignIndex, setActiveCampaignIndex] = useState(0);

  const [planProjects, setPlanProjects] = useState<PlanStudioProject[]>([createNewPlanProject(0)]);
  const [activePlanIndex, setActivePlanIndex] = useState(0);

  const [editProjects, setEditProjects] = useState<EditStudioProject[]>([createNewEditProject(0)]);
  const [activeEditIndex, setActiveEditIndex] = useState(0);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);
  
  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateCreatorProject = useCallback((action: React.SetStateAction<CreatorStudioProject>) => {
    setCreatorProjects(prev => {
        const newProjects = [...prev];
        newProjects[activeCreatorIndex] = action instanceof Function ? action(newProjects[activeCreatorIndex]) : action;
        return newProjects;
    });
  }, [activeCreatorIndex]);

  const updatePhotoshootProject = useCallback((action: React.SetStateAction<PhotoshootDirectorProject>) => {
    setPhotoshootProjects(prev => {
        const newProjects = [...prev];
        newProjects[activePhotoshootIndex] = action instanceof Function ? action(newProjects[activePhotoshootIndex]) : action;
        return newProjects;
    });
  }, [activePhotoshootIndex]);

  const updatePromptStudioProject = useCallback((action: React.SetStateAction<PromptStudioProject>) => {
    setPromptStudioProjects(prev => {
        const newProjects = [...prev];
        newProjects[activePromptStudioIndex] = action instanceof Function ? action(newProjects[activePromptStudioIndex]) : action;
        return newProjects;
    });
  }, [activePromptStudioIndex]);

  const updateVoiceOverProject = useCallback((action: React.SetStateAction<VoiceOverStudioProject>) => {
    setVoiceOverProjects(prev => {
        const newProjects = [...prev];
        newProjects[activeVoiceOverIndex] = action instanceof Function ? action(newProjects[activeVoiceOverIndex]) : action;
        return newProjects;
    });
  }, [activeVoiceOverIndex]);

  const updateControllerProject = useCallback((action: React.SetStateAction<ControllerStudioProject>) => {
    setControllerProjects(prev => {
        const newProjects = [...prev];
        newProjects[activeControllerIndex] = action instanceof Function ? action(newProjects[activeControllerIndex]) : action;
        return newProjects;
    });
  }, [activeControllerIndex]);

  const updateCampaignProject = useCallback((action: React.SetStateAction<CampaignStudioProject>) => {
    setCampaignProjects(prev => {
        const newProjects = [...prev];
        newProjects[activeCampaignIndex] = action instanceof Function ? action(newProjects[activeCampaignIndex]) : action;
        return newProjects;
    });
  }, [activeCampaignIndex]);

  const updatePlanProject = useCallback((action: React.SetStateAction<PlanStudioProject>) => {
    setPlanProjects(prev => {
        const newProjects = [...prev];
        newProjects[activePlanIndex] = action instanceof Function ? action(newProjects[activePlanIndex]) : action;
        return newProjects;
    });
  }, [activePlanIndex]);

  const updateEditProject = useCallback((action: React.SetStateAction<EditStudioProject>) => {
    setEditProjects(prev => {
        const newProjects = [...prev];
        newProjects[activeEditIndex] = action instanceof Function ? action(newProjects[activeEditIndex]) : action;
        return newProjects;
    });
  }, [activeEditIndex]);

  const NavItem = ({ label, targetView, isMobile }: { label: string, targetView: AppView, isMobile?: boolean }) => (
      <button 
        onClick={() => { setView(targetView); scrollToContent(); }}
        className={`${isMobile ? 'flex-shrink-0 px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} font-bold transition-colors border-b-2 ${view === targetView ? 'text-[var(--color-accent)] border-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-base)]'}`}
      >
          {label}
      </button>
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center relative font-tajawal bg-[var(--color-background-base)]">
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-[rgba(var(--color-background-base-rgb),0.8)] border-b border-[rgba(var(--color-text-base-rgb),0.1)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                <img src={LOGO_IMAGE_URL} alt="Jenta Logo" className="h-10 w-auto flex-shrink-0"/>
                <span className="text-lg sm:text-xl font-black text-[var(--color-accent)] tracking-tight whitespace-nowrap">جينتا للتصميم</span>
            </div>
            <div className="hidden lg:flex items-center gap-1 overflow-x-auto">
                <NavItem label="الابتكار" targetView="creator_studio" />
                <NavItem label="جلسة تصوير" targetView="photoshoot_director" />
                <NavItem label="تعديل (PRO)" targetView="edit_studio" />
                <NavItem label="خطة تسويقية" targetView="plan_studio" />
                <NavItem label="حملات" targetView="campaign_studio" />
                <NavItem label="تحكم" targetView="controller_studio" />
                <NavItem label="فيديو" targetView="video_studio" />
                <NavItem label="استوديو الوصف" targetView="prompt_studio" />
                <NavItem label="تعليق صوتي" targetView="voice_over_studio" />
            </div>
        </div>
      </nav>

      <section className="w-full max-w-7xl mx-auto px-4 pt-12 pb-12 flex flex-col justify-center min-h-[60vh] relative">
           <div className="max-w-4xl relative z-10 text-right">
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[1.1] text-[var(--color-text-base)]">
                 أسهل وأسرع<br/>
                 طريقة لـ<br/>
                 <Typewriter />
              </h1>
              <div className="mt-8 pr-4 border-r-4 border-[var(--color-accent)]">
                  <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-xl leading-relaxed">
                    حول خيالك إلى صور وتصاميم احترافية في ثوانٍ باستخدام قوة الذكاء الاصطناعي.
                  </p>
              </div>
              <div className="mt-10 flex flex-wrap gap-4">
                 <button 
                    onClick={scrollToContent}
                    className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white font-black py-4 px-10 rounded-full text-lg transition-transform transform hover:scale-105 flex items-center shadow-lg shadow-[var(--color-accent)]/20"
                 >
                    ابدأ الإبداع الآن <ArrowLeftIcon />
                 </button>
              </div>
           </div>
           <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 pl-12 pointer-events-none">
                <InteractiveLogo />
           </div>
      </section>
      
      {/* Mobile Nav */}
      <div className="lg:hidden sticky top-16 z-40 w-full bg-[rgba(var(--color-background-base-rgb),0.95)] backdrop-blur-sm border-b border-[rgba(var(--color-text-base-rgb),0.1)] flex items-center justify-center gap-1 px-2 py-2">
            <div ref={mobileNavRef} className="flex items-center gap-1 overflow-x-auto suggestions-scrollbar scroll-smooth flex-1">
                <NavItem label="الابتكار" targetView="creator_studio" isMobile />
                <NavItem label="تصوير" targetView="photoshoot_director" isMobile />
                <NavItem label="تعديل" targetView="edit_studio" isMobile />
                <NavItem label="خطة" targetView="plan_studio" isMobile />
                <NavItem label="حملات" targetView="campaign_studio" isMobile />
                <NavItem label="تحكم" targetView="controller_studio" isMobile />
                <NavItem label="فيديو" targetView="video_studio" isMobile />
                <NavItem label="وصف" targetView="prompt_studio" isMobile />
                <NavItem label="صوت" targetView="voice_over_studio" isMobile />
            </div>
      </div>

      <div ref={contentRef} className="w-full max-w-7xl flex-grow pt-8 pb-20 px-4 z-10">
        {view === 'creator_studio' && <CreatorStudio project={creatorProjects[activeCreatorIndex]} setProject={updateCreatorProject} />}
        {view === 'photoshoot_director' && <PhotoshootDirector project={photoshootProjects[activePhotoshootIndex]} setProject={updatePhotoshootProject} />}
        {view === 'prompt_studio' && <PromptStudio project={promptStudioProjects[activePromptStudioIndex]} setProject={updatePromptStudioProject} />}
        {view === 'voice_over_studio' && <VoiceOverStudio project={voiceOverProjects[activeVoiceOverIndex]} setProject={updateVoiceOverProject} />}
        {view === 'controller_studio' && <ControllerStudio project={controllerProjects[activeControllerIndex]} setProject={updateControllerProject} />}
        {view === 'campaign_studio' && <CampaignStudio project={campaignProjects[activeCampaignIndex]} setProject={updateCampaignProject} />}
        {view === 'plan_studio' && <PlanStudio project={planProjects[activePlanIndex]} setProject={updatePlanProject} />}
        {view === 'edit_studio' && <EditStudio project={editProjects[activeEditIndex]} setProject={updateEditProject} />}
        {view === 'video_studio' && <VideoStudio />}

        <footer className="w-full border-t border-[rgba(var(--color-text-base-rgb),0.1)] mt-20 py-12">
            <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-8 text-center">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-sm font-bold text-[var(--color-text-medium)] uppercase tracking-widest">ابقَ على اطلاع</p>
                        <a href="https://www.linkedin.com/in/mahmoudredaph/" target="_blank" className="bg-[#0077B5] text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition-transform hover:scale-105">لمتابعة كل جديد تابع لينكد إن</a>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-sm font-bold text-[var(--color-text-medium)] uppercase tracking-widest">تواصل تجاري</p>
                        <a href="https://wa.me/201110100881" target="_blank" className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl transition-transform hover:scale-105">اضغط هنا للتواصل واتساب</a>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-sm font-bold text-[var(--color-text-medium)] uppercase tracking-widest">ادعم المشروع</p>
                        <a href="https://g.page/r/CTEuuDX8bY3zEBM/review" target="_blank" className="bg-white/5 border border-white/10 text-white/80 px-6 py-3 rounded-2xl font-bold transition-transform hover:scale-105">قيم الأداة على جوجل</a>
                    </div>
                </div>
                <div className="pt-6 border-t border-white/5 w-full">
                    <p className="text-sm opacity-60">تواصل معي بشكل مباشر إذا واجهت أي مشكلة أو شاركني اهتمامك للاستمرار ❤️</p>
                    <p className="text-xs text-[var(--color-accent)] font-bold mt-4 tracking-[0.2em]">شكراً لدعمك وتواجدك - Mahmoud Reda</p>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
