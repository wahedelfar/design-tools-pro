
import { LightingStyle, CameraPerspective, AspectRatio, ControllerSlider } from './types';

export interface StylePreset {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

export const ADVERTISING_STYLES: StylePreset[] = [
  { 
    id: 'luxury', 
    label: 'فاخر وسينمائي', 
    icon: '💎', 
    prompt: 'Luxury high-end advertising photography, cinematic lighting, deep shadows, elegant atmosphere, sharp details, 8k resolution, premium textures.' 
  },
  { 
    id: 'minimalist', 
    label: 'بسيط وعصري', 
    icon: '⚪', 
    prompt: 'Clean minimalist studio product photography, soft even lighting, solid pastel background, sharp focus, high clarity, modern aesthetic.' 
  },
  { 
    id: 'nature', 
    label: 'طبيعي وعضوي', 
    icon: '🌿', 
    prompt: 'Product in a natural outdoor setting, soft morning sunlight, bokeh forest background, organic textures, dew drops, fresh atmosphere.' 
  },
  { 
    id: 'neon', 
    label: 'نيون وسايبربانك', 
    icon: '🌈', 
    prompt: 'Vibrant neon lighting, cyberpunk aesthetic, dark rainy street reflections, high contrast, blue and magenta tones, dynamic energy.' 
  },
  { 
    id: 'vintage', 
    label: 'كلاسيكي عتيق', 
    icon: '🎞️', 
    prompt: 'Vintage film photography style, warm sepia tones, light grain, soft focus, retro advertising aesthetic from the 70s, nostalgic mood.' 
  },
  { 
    id: 'splash', 
    label: 'حركة وسوائل', 
    icon: '💦', 
    prompt: 'Dynamic action shot, water splashes and droplets frozen in time, high-speed photography, studio lighting, refreshing and clean look.' 
  },
  { 
    id: 'floating', 
    label: 'سريالي طائر', 
    icon: '☁️', 
    prompt: 'Surreal levitation photography, product floating in mid-air, soft dreamlike lighting, abstract geometric background, peaceful atmosphere.' 
  }
];

export const LIGHTING_STYLES: { value: LightingStyle; label: string }[] = [
  { value: 'Natural Light', label: 'إضاءة طبيعية' },
  { value: 'Studio Light', label: 'إضاءة استوديو' },
  { value: 'Golden Hour', label: 'الساعة الذهبية' },
  { value: 'Blue Hour', label: 'الساعة الزرقاء' },
  { value: 'Cinematic', label: 'سينمائي' },
  { value: 'Dramatic', label: 'درامي' },
];

export const CAMERA_PERSPECTIVES: { value: CameraPerspective; label: string }[] = [
  { value: 'Front View', label: 'رؤية أمامية' },
  { value: 'Top View', label: 'رؤية من الأعلى' },
  { value: 'Side View', label: 'رؤية جانبية' },
  { value: '45° Angle', label: 'زاوية 45 درجة' },
  { value: 'Close-up', label: 'لقطة قريبة' },
  { value: 'Macro Shot', label: 'تصوير ماكرو' },
];

export const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '16:9', label: 'عرضي (16:9)' },
  { value: '9:16', label: 'طولي (9:16)' },
  { value: '4:3', label: 'كلاسيكي (4:3)' },
  { value: '3:4', label: 'طولي كلاسيكي (3:4)' },
  { value: '1:1', label: 'مربع (1:1)' },
];

export const MAX_SHOT_SELECTION = 6;

export const SHOT_TYPES: { category: string; types: string[] }[] = [
  {
    category: 'زوايا التصوير',
    types: [
        'لقطة قريبة جداً', 'لقطة متوسطة', 'لقطة كاملة', 'زاوية عالية',
        'زاوية منخفضة', 'زاوية هولندية', 'من الأعلى للأسفل', 'تصوير ماكرو دقيق',
        'مستوى العين', 'من منظور الدودة', 'لقطة تفاصيل الملمس', 'أمامي متماثل',
        'زاوية 3/4 ديناميكية', 'لقطة البطل (Hero Shot)'
    ]
  },
  {
    category: 'المنتج في الاستخدام',
    types: [
        'نمط حياة: موديل يتفاعل مع المنتج',
        'لقطة حركة ديناميكية (سكب/رش)',
        'لقطة قريبة لاستخدام المنتج',
        'المنتج في بيئته الطبيعية (مطبخ، صالة رياضية)',
        'المنتج كجزء من روتين يومي',
        'بيد الموديل، يظهر الاستخدام',
        'على مكتب إبداعي',
        'في سياق سفر (حقيبة ظهر)',
        'كجزء من لقطة مسطحة (Flat Lay)',
        'أثناء نشاط رياضي',
        'في بيئة منزلية مريحة',
        'تجربة فتح الصندوق (Unboxing)',
        'على طاولة مقهى',
        'محمول باليد (لقطة قريبة)',
    ]
  },
  {
    category: 'البيئة والنمط',
    types: [
        'على سطح مطبخ حديث', 'على شاطئ رملي', 'على طاولة خشبية ريفية', 'في غابة خضراء خصبة',
        'على حافة نافذة (ضوء الصباح)', 'في الطبيعة (مع قطرات الندى)', 'لقطة رشات ماء',
        'استوديو بسيط (خلفية متدرجة)', 'على سطح رخامي', 'طائر في الهواء (سريالي)', 'وسط مدينة صاخبة (بوكيه)',
        'على سرير من الزهور', 'مع أشكال هندسية وظلال', 'نمط سايبربانك (نيون)', 'خلفية مخملية فاخرة',
        'مغمور في الماء', 'خلفية خرسانية صناعية', 'لقطة التغليف'
    ]
  }
];

export const VOICES: { value: string; label: string; description: string; gender: 'Male' | 'Female' }[] = [
  { value: 'Kore', label: 'كوري', description: 'احترافي وواضح', gender: 'Female' },
  { value: 'Puck', label: 'باك', description: 'حيوي وشبابي', gender: 'Male' },
  { value: 'Charon', label: 'شارون', description: 'عميق وواثق', gender: 'Male' },
  { value: 'Fenrir', label: 'فنرير', description: 'دافئ وسردي', gender: 'Male' },
  { value: 'Zephyr', label: 'زفير', description: 'هادئ ومريح', gender: 'Male' },
  { value: 'Despina', label: 'ديسبينا', description: 'نقي وعذب', gender: 'Female' },
  { value: 'Orus', label: 'أوروس', description: 'واضح وإعلاني', gender: 'Male' },
  { value: 'Leda', label: 'ليدا', description: 'أنيق وراقٍ', gender: 'Female' },
  { value: 'Gacrux', label: 'جاكروكس', description: 'قوي وجريء', gender: 'Male' },
  { value: 'Umbriel', label: 'أومبريل', description: 'طبيعي وواقعي', gender: 'Female' },
];

export const CONTROLLER_SLIDERS: ControllerSlider[] = [
    { id: 'smile', label: 'ابتسامة', value: 0, min: -1, max: 1, step: 0.1, category: 'Face' },
    { id: 'frown', label: 'عبوس', value: 0, min: 0, max: 1, step: 0.1, category: 'Face' },
    { id: 'mouth_open', label: 'فتح الفم', value: 0, min: 0, max: 1, step: 0.1, category: 'Face' },
    { id: 'wink_left', label: 'غمزة يسار', value: 0, min: 0, max: 1, step: 0.1, category: 'Face' },
    { id: 'wink_right', label: 'غمزة يمين', value: 0, min: 0, max: 1, step: 0.1, category: 'Face' },
    { id: 'eyebrow_raise', label: 'رفع الحواجب', value: 0, min: -1, max: 1, step: 0.1, category: 'Face' },
    { id: 'squint', label: 'تضييق العين', value: 0, min: 0, max: 1, step: 0.1, category: 'Face' },
    { id: 'eye_direction', label: 'اتجاه العين', value: 0, min: -1, max: 1, step: 0.1, category: 'Face' },
    { id: 'age', label: 'العمر', value: 0, min: -1, max: 1, step: 0.1, category: 'Face' },
    { id: 'head_pitch', label: 'إمالة الرأس (أعلى/أسفل)', value: 0, min: -1, max: 1, step: 0.1, category: 'Head' },
    { id: 'head_yaw', label: 'التفاف الرأس (يمين/يسار)', value: 0, min: -1, max: 1, step: 0.1, category: 'Head' },
    { id: 'head_roll', label: 'ميلان الرأس', value: 0, min: -1, max: 1, step: 0.1, category: 'Head' },
    { id: 'body_turn', label: 'التفاف الجسم', value: 0, min: -1, max: 1, step: 0.1, category: 'Body' },
    { id: 'shoulder_shrug', label: 'هز الأكتاف', value: 0, min: 0, max: 1, step: 0.1, category: 'Body' },
    { id: 'skin_smooth', label: 'تنعيم البشرة', value: 0, min: 0, max: 1, step: 0.1, category: 'Retouch' },
    { id: 'brightness', label: 'السطوع', value: 0, min: -1, max: 1, step: 0.1, category: 'Retouch' },
    { id: 'contrast', label: 'التباين', value: 0, min: -1, max: 1, step: 0.1, category: 'Retouch' },
    { id: 'sharpness', label: 'الحدة', value: 0, min: 0, max: 1, step: 0.1, category: 'Retouch' },
];
