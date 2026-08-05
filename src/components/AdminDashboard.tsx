import React, { useState, useMemo } from 'react';
import { 
  PlusCircle, 
  Sparkles, 
  Image as ImageIcon, 
  Check, 
  Loader2, 
  Globe, 
  Search, 
  SlidersHorizontal,
  Wand2,
  Trash2,
  Pencil,
  PenSquare,
  BarChart3
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Article, ArticleCategory, GoogleNewsImportItem, Neighborhood, Comment } from '../types';
import { Language, UI_STRINGS } from '../i18n/translations';
import { getLocalizedField } from '../utils/i18nHelpers';
import { slugify } from '../utils/slug';
import { useAuth } from '../lib/auth-context';
import { SectionImageCard } from './SectionImageCard';
import type { ContentBlock, HeadingBlock, SectionImage } from '../types/articleBlocks';

interface AdminDashboardProps {
  language: Language;
  articles: Article[];
  comments?: Comment[];
  onAddArticle: (article: Article) => void;
  onUpdateArticle?: (article: Article) => void;
  onDeleteArticle: (id: string) => void;
  cityName?: string;
  onReorderArticles?: (articles: Article[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  language,
  articles,
  comments = [],
  onAddArticle,
  onUpdateArticle,
  onDeleteArticle,
  cityName = 'Madrid',
  onReorderArticles,
}) => {
  const strings = UI_STRINGS[language] || UI_STRINGS.es;
  const { token } = useAuth();
  const [adminTab, setAdminTab] = useState<'google-news' | 'ai-writer' | 'ai-image' | 'manual' | 'analytics'>('google-news');
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggedOverItemIndex, setDraggedOverItemIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggedOverItemIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) {
      setDraggedItemIndex(null);
      setDraggedOverItemIndex(null);
      return;
    }
    const newOrder = [...articles];
    const [draggedItem] = newOrder.splice(draggedItemIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    if (onReorderArticles) onReorderArticles(newOrder);
    setDraggedItemIndex(null);
    setDraggedOverItemIndex(null);
  };

  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  // 1. Google News Import State
  const [googleNewsQuery, setGoogleNewsQuery] = useState(`Noticias ${cityName}`);
  const [importLoading, setImportLoading] = useState(false);
  const [importedItems, setImportedItems] = useState<GoogleNewsImportItem[]>([]);
  const [rewriteLoadingState, setRewriteLoadingState] = useState<{index: number, action: 'edit' | 'publish'} | null>(null);

  // 2. AI Article Writer State
  const [aiTopic, setAiTopic] = useState('');
  const [aiCategory, setAiCategory] = useState<ArticleCategory>('Noticias Locales');
  const [aiNeighborhood, setAiNeighborhood] = useState<Neighborhood>('Centro / Moncloa');
  const [aiKeywords, setAiKeywords] = useState('noticias, eventos, ayuntamiento');
  const [aiTone, setAiTone] = useState<'Periodístico oficial' | 'Entusiasta' | 'Noticia de última hora'>('Periodístico oficial');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedResult, setAiGeneratedResult] = useState<any | null>(null);

  // 3. AI Image Generator State
  const [imagePrompt, setImagePrompt] = useState(`Fotografía de noticias de eventos locales en ${cityName}`);
  const [imageStyle, setImageStyle] = useState<'Fotografía periodística' | 'Arte digital' | 'Ilustración'>('Fotografía periodística');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [regeneratingImageId, setRegeneratingImageId] = useState<string | null>(null);

  // 4. Manual Article State
  const [manualTitle, setManualTitle] = useState('');
  const [manualExcerpt, setManualExcerpt] = useState('');
  const [manualSlug, setManualSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [manualContent, setManualContent] = useState('');
  const [manualCategory, setManualCategory] = useState<ArticleCategory>('Noticias Locales');
  const [manualNeighborhood, setManualNeighborhood] = useState<Neighborhood>('Centro / Moncloa');
  const [manualImage, setManualImage] = useState('https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=1200&q=80');
  const [manualKeywords, setManualKeywords] = useState('noticias, ciudad, eventos');
  const [manualIsUrgent, setManualIsUrgent] = useState(false);
  const [manualContentFormat, setManualContentFormat] = useState<'markdown' | 'blocks'>('markdown');
  // Client-generated id for a not-yet-published 'blocks' draft, so section
  // image jobs (which may run before the article is ever saved) correlate
  // with the article id it eventually gets on publish.
  const [manualDraftId, setManualDraftId] = useState<string | null>(null);
  const [sectionGeneratingId, setSectionGeneratingId] = useState<string | null>(null);
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});
  const [bulkGeneratingImages, setBulkGeneratingImages] = useState(false);
  const [manualMetaDescription, setManualMetaDescription] = useState('');

  // 4b. Interactive Execution-Guide Generator State (Claude + web_search)
  const [interactiveTopic, setInteractiveTopic] = useState('');
  const [showInteractivePrompt, setShowInteractivePrompt] = useState(false);
  const [generatingInteractive, setGeneratingInteractive] = useState(false);

  // 4.5 AI Article Generator (Claude) State
  const [showClaudeTopicInput, setShowClaudeTopicInput] = useState(false);
  const [claudeTopic, setClaudeTopic] = useState('');
  const [generatingArticleWithClaude, setGeneratingArticleWithClaude] = useState(false);
  const [claudeArticleError, setClaudeArticleError] = useState('');

  // 5. AI Auto-Classification State
  const [aiClassification, setAiClassification] = useState<any | null>(null);
  const [classifying, setClassifying] = useState(false);

  const handleClassifyArticle = async () => {
    if (!manualTitle.trim() && !manualContent.trim()) {
      alert('Please enter a title or content first.');
      return;
    }
    setClassifying(true);
    setAiClassification(null);
    try {
      const res = await fetch('/api/ai/classify-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: manualTitle, content: manualContent }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAiClassification(data.data);
      } else {
        alert('Could not classify article.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to classification service.');
    } finally {
      setClassifying(false);
    }
  };

  // Search & Import Google News
  const handleFetchGoogleNews = async () => {
    if (!googleNewsQuery.trim()) return;
    setImportLoading(true);
    try {
      const res = await fetch('/api/google-news/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: googleNewsQuery }),
      });
      const data = await res.json();
      if (data.success) {
        setImportedItems(data.items || []);
      } else {
        alert(data.message || 'Error fetching Google News');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to news feed');
    } finally {
      setImportLoading(false);
    }
  };

  // Rewrite Google News item with AI
  const handleRewriteAndPublishGoogleNewsItem = async (item: GoogleNewsImportItem, index: number) => {
    setRewriteLoadingState({ index, action: 'publish' });
    try {
      const res = await fetch('/api/ai/rewrite-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          snippet: item.snippet,
          neighborhood: 'Centro / Moncloa',
          category: 'Noticias Locales',
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const rewritten = data.data;
        const newsImage = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';

        const newArticle: Article = {
          id: `art-${Date.now()}`,
          title: rewritten.title || item.title,
          excerpt: rewritten.excerpt || item.snippet,
          content: rewritten.content || item.snippet,
          category: 'Noticias Locales',
          neighborhood: 'Centro / Moncloa',
          imageUrl: newsImage,
          imageAspect: '16:9',
          publishedAt: 'Ahora (Google News)',
          author: {
            name: 'AI Editorial Team',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            role: 'AI Editor',
          },
          readTimeMinutes: 3,
          isUrgent: false,
          viewsCount: 1,
          likesCount: 0,
          commentsCount: 0,
          seoKeywords: rewritten.seoKeywords || ['News', 'Google News'],
          metaDescription: rewritten.metaDescription || item.snippet,
          source: 'Google News',
        };

        onAddArticle(newArticle);
        alert(`Published: "${getLocalizedField(newArticle.title, language)}"`);
      } else {
        alert('Could not rewrite article');
      }
    } catch (err) {
      console.error(err);
      alert('Error calling AI service');
    } finally {
      setRewriteLoadingState(null);
    }
  };

  // Generate Article with AI
  const handleGenerateAIArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;
    setAiGenerating(true);
    setAiGeneratedResult(null);

    try {
      const res = await fetch('/api/ai/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          category: aiCategory,
          neighborhood: aiNeighborhood,
          keywords: aiKeywords,
          styleTone: aiTone,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAiGeneratedResult(data.data);
      } else {
        alert('Could not generate article');
      }
    } catch (err) {
      console.error(err);
      alert('Error generating article');
    } finally {
      setAiGenerating(false);
    }
  };

  // Publish AI Generated Article
  const handlePublishAIGeneratedArticle = () => {
    if (!aiGeneratedResult) return;

    const coverImg = generatedImageUrl || 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=1200&q=80';

    const newArticle: Article = {
      id: `art-${Date.now()}`,
      title: aiGeneratedResult.title,
      excerpt: aiGeneratedResult.excerpt,
      content: aiGeneratedResult.content,
      category: aiCategory,
      neighborhood: aiNeighborhood,
      imageUrl: coverImg,
      imageAspect: '16:9',
      publishedAt: 'Ahora',
      author: {
        name: 'AI Editor (Gemini)',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        role: 'AI Journalist',
      },
      readTimeMinutes: aiGeneratedResult.readTimeMinutes || 3,
      isUrgent: false,
      viewsCount: 1,
      likesCount: 0,
      commentsCount: 0,
      seoKeywords: aiGeneratedResult.seoKeywords || [],
      metaDescription: aiGeneratedResult.metaDescription || '',
      source: 'AI Generated',
    };

    onAddArticle(newArticle);
    setAiGeneratedResult(null);
    setAiTopic('');
    alert('AI article published!');
  };

  // Generate Image with AI
  const handleGenerateAIImage = async () => {
    if (!imagePrompt.trim()) return;
    setGeneratingImage(true);

    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt, style: imageStyle }),
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
      } else {
        alert('Could not generate image');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating image');
    } finally {
      setGeneratingImage(false);
    }
  };

  // Auto-regenerate image for published article
  const handleRegenerateArticleImage = async (article: Article) => {
    setRegeneratingImageId(article.id);
    try {
      const topic = getLocalizedField(article.title, 'es') || getLocalizedField(article.title, language);
      const autoPrompt = `Fotografía de noticias de alta calidad para: ${topic}. Estilo profesional, 16:9.`;
      
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: autoPrompt, style: 'واقعية صحفية' }),
      });

      const data = await res.json();
      if (data.success && data.imageUrl && onUpdateArticle) {
        onUpdateArticle({ ...article, imageUrl: data.imageUrl });
      } else {
        alert('Could not generate image');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating image');
    } finally {
      setRegeneratingImageId(null);
    }
  };

  // Rewrite Google News item with AI and load into manual editor for editing before publish
  const handleRewriteAndEditGoogleNewsItem = async (item: GoogleNewsImportItem, index: number) => {
    setRewriteLoadingState({ index, action: 'edit' });
    try {
      const res = await fetch('/api/ai/rewrite-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          snippet: item.snippet,
          neighborhood: 'Centro / Moncloa',
          category: 'Noticias Locales',
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const rewritten = data.data;
        const newsImage = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';

        setEditingArticleId(null);
        setManualTitle(rewritten.title || item.title);
        setManualExcerpt(rewritten.excerpt || item.snippet);
        setManualContent(rewritten.content || item.snippet);
        setManualCategory('general');
        setManualNeighborhood('Centro / Moncloa');
        setManualImage(newsImage);
        setManualKeywords(Array.isArray(rewritten.seoKeywords) ? rewritten.seoKeywords.join(', ') : 'أخبار, أخبار عالمية');
        setAdminTab('manual');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        alert('تمت إعادة صياغة الخبر بالذكاء الاصطناعي وتحميله في المحرر للتعديل قبل النشر!');
      } else {
        alert('Could not rewrite article');
      }
    } catch (err) {
      console.error(err);
      alert('Error calling AI service');
    } finally {
      setRewriteLoadingState(null);
    }
  };

  // Edit AI Generated Article before publishing
  const handleEditAIGeneratedArticle = () => {
    if (!aiGeneratedResult) return;

    const coverImg = generatedImageUrl || 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=1200&q=80';

    setEditingArticleId(null);
    setManualTitle(aiGeneratedResult.title || '');
    setManualExcerpt(aiGeneratedResult.excerpt || '');
    setManualContent(aiGeneratedResult.content || '');
    setManualCategory(aiCategory || 'general');
    setManualNeighborhood(aiNeighborhood || 'Centro / Moncloa');
    setManualKeywords(Array.isArray(aiGeneratedResult.seoKeywords) ? aiGeneratedResult.seoKeywords.join(', ') : aiKeywords);
    setManualImage(coverImg);
    setAdminTab('manual');
    setAiGeneratedResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert('¡Artículo generado por IA cargado en el editor manual para su edición antes de publicar!');
  };

  // Edit an existing published article
  const handleEditPublishedArticle = (art: Article) => {
    setEditingArticleId(art.id);
    setManualTitle(getLocalizedField(art.title, language));
    setManualExcerpt(getLocalizedField(art.excerpt, language));
    setManualContent(getLocalizedField(art.content, language));
    setManualCategory(art.category || 'general');
    setManualNeighborhood(art.neighborhood || 'Centro / Moncloa');
    setManualImage(art.imageUrl || '');
    setManualKeywords(Array.isArray(art.seoKeywords) ? art.seoKeywords.join(', ') : '');
    setManualSlug(art.slug || '');
    setSlugManuallyEdited(true);
    setManualIsUrgent(!!art.isUrgent);
    setManualContentFormat(art.contentFormat === 'blocks' ? 'blocks' : 'markdown');
    setManualMetaDescription(art.metaDescription || '');
    setAdminTab('manual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Maps Claude's Spanish category label to the internal <select> value
  const mapClaudeCategory = (cat: unknown): ArticleCategory => {
    const normalized = String(Array.isArray(cat) ? cat.join(' ') : (cat || '')).toLowerCase();
    if (normalized.includes('tecno')) return 'tech';
    if (normalized.includes('deport')) return 'sports';
    if (normalized.includes('pol')) return 'politics';
    if (normalized.includes('econom')) return 'economy';
    if (normalized.includes('cultur')) return 'culture';
    return 'general';
  };

  // Generate a full article from a topic using Claude (Anthropic)
  const handleGenerateArticleWithClaude = async () => {
    if (!claudeTopic.trim() || generatingArticleWithClaude) return;
    if (!token) {
      setClaudeArticleError('Sesión expirada. Vuelve a iniciar sesión.');
      return;
    }

    setGeneratingArticleWithClaude(true);
    setClaudeArticleError('');
    try {
      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ topic: claudeTopic.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setClaudeArticleError(data.message || 'No se pudo generar el artículo.');
        return;
      }

      const result = data.data || {};
      setManualTitle(result.title || '');
      setManualContent(result.content || '');
      setManualCategory(mapClaudeCategory(result.category));
      setManualKeywords(Array.isArray(result.keywords) ? result.keywords.join(', ') : (result.keywords || ''));
      setManualExcerpt(result.metaDescription || '');
      setManualSlug(slugify(result.slug || result.title || ''));
      setSlugManuallyEdited(true);
      setShowClaudeTopicInput(false);
      setClaudeTopic('');
    } catch (err) {
      console.error('Claude article generation error:', err);
      setClaudeArticleError('No se pudo conectar con el servidor.');
    } finally {
      setGeneratingArticleWithClaude(false);
    }
  };

  // Generate an interactive execution-guide article via Claude + web_search
  const handleGenerateInteractiveArticle = async () => {
    if (!interactiveTopic.trim()) return;
    setGeneratingInteractive(true);
    try {
      const res = await fetch('/api/ai/generate-interactive-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ topic: interactiveTopic }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setManualTitle(data.data.title || '');
        setManualExcerpt(data.data.excerpt || '');
        if (data.data.category) setManualCategory(data.data.category as ArticleCategory);
        setManualKeywords(Array.isArray(data.data.seoKeywords) ? data.data.seoKeywords.join(', ') : '');
        setManualMetaDescription(data.data.metaDescription || '');
        setManualContent(JSON.stringify(data.data.blocks));
        setManualContentFormat('blocks');
        setManualDraftId(`art-${Date.now()}`);
        setSectionErrors({});
        setAdminTab('manual');
        setShowInteractivePrompt(false);
        setInteractiveTopic('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(data.message || 'No se pudo generar la guía interactiva.');
      }
    } catch (err) {
      console.error(err);
      alert('Error al generar la guía interactiva.');
    } finally {
      setGeneratingInteractive(false);
    }
  };

  // ---- AI Content Studio: per-section image generation for 'blocks' articles ----

  const manualParsedBlocks = useMemo<ContentBlock[] | null>(() => {
    if (manualContentFormat !== 'blocks') return null;
    try {
      const parsed = JSON.parse(manualContent);
      return Array.isArray(parsed) ? (parsed as ContentBlock[]) : null;
    } catch {
      return null;
    }
  }, [manualContentFormat, manualContent]);

  const imageSections = useMemo(() => {
    if (!manualParsedBlocks) return [];
    return manualParsedBlocks.filter(
      (block): block is HeadingBlock => block.type === 'heading' && !!block.sectionId && !!block.image,
    );
  }, [manualParsedBlocks]);

  // Job for a not-yet-published draft correlates with manualDraftId; for an
  // article already being edited, with its real persisted id.
  const activeArticleIdForJobs = editingArticleId || manualDraftId || undefined;

  // Functional update so sequential (bulk) generations never clobber each
  // other via a stale manualContent closure — each call always reads the
  // latest committed state, regardless of how many are queued in a row.
  const updateSectionImage = (sectionId: string, image: SectionImage) => {
    setManualContent((prevContent) => {
      try {
        const blocks = JSON.parse(prevContent);
        if (!Array.isArray(blocks)) return prevContent;
        const updated = blocks.map((block: any) =>
          block?.type === 'heading' && block.sectionId === sectionId ? { ...block, image } : block,
        );
        return JSON.stringify(updated);
      } catch {
        return prevContent;
      }
    });
  };

  const generateSectionImage = async (sectionId: string, image: HeadingBlock['image'], promptOverride?: string) => {
    if (!image) return;
    setSectionGeneratingId(sectionId);
    setSectionErrors((prev) => {
      if (!(sectionId in prev)) return prev;
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: 'image_generation',
          articleId: activeArticleIdForJobs,
          targetRef: sectionId,
          input: {
            prompt: promptOverride ?? image.prompt,
            negativePrompt: image.negativePrompt,
            aspectRatio: image.aspectRatio || '16:9',
          },
        }),
      });
      const data = await res.json();
      if (!data.success || !data.job || data.job.status !== 'succeeded') {
        throw new Error(data.message || 'No se pudo generar la imagen.');
      }
      const output = data.job.output || {};
      const meta = {
        provider: output.provider,
        model: output.model,
        seed: output.seed,
        width: output.width,
        height: output.height,
        promptUsed: output.promptUsed,
        negativePromptUsed: output.negativePromptUsed,
        version: (image.history?.length || 0) + 1,
        jobId: data.job.id,
        createdAt: new Date().toISOString(),
        url: output.url,
      };
      updateSectionImage(sectionId, {
        ...image,
        status: 'ready',
        prompt: promptOverride ?? image.prompt,
        current: meta,
        history: [...(image.history || []), meta],
      });
    } catch (err: any) {
      setSectionErrors((prev) => ({ ...prev, [sectionId]: err?.message || 'Error al generar la imagen.' }));
    } finally {
      setSectionGeneratingId(null);
    }
  };

  const handleGenerateMissingImages = async () => {
    setBulkGeneratingImages(true);
    try {
      for (const heading of imageSections) {
        if (heading.image && heading.image.status !== 'ready' && heading.sectionId) {
          await generateSectionImage(heading.sectionId, heading.image);
        }
      }
    } finally {
      setBulkGeneratingImages(false);
    }
  };

  // Manual Article Submit (Create or Update)
  const handleManualArticleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualContent.trim()) return;

    if (editingArticleId) {
      const existing = articles.find((a) => a.id === editingArticleId);
      const updatedArticle: Article = {
        id: editingArticleId,
        slug: slugify(manualSlug) || slugify(manualTitle) || undefined,
        title: manualTitle,
        excerpt: manualExcerpt || manualTitle,
        content: manualContent,
        contentFormat: manualContentFormat,
        category: manualCategory,
        neighborhood: manualNeighborhood,
        imageUrl: manualImage || 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=1200&q=80',
        imageAspect: '16:9',
        publishedAt: existing ? existing.publishedAt : 'Editado',
        author: existing ? existing.author : {
          name: 'Local Editor',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          role: 'News Editor',
        },
        readTimeMinutes: existing ? existing.readTimeMinutes : 3,
        isUrgent: manualIsUrgent,
        viewsCount: existing ? existing.viewsCount : 1,
        likesCount: existing ? existing.likesCount : 0,
        commentsCount: existing ? existing.commentsCount : 0,
        seoKeywords: String(manualKeywords || '').split(',').map((k) => k.trim()).filter(Boolean),
        metaDescription: manualMetaDescription || manualExcerpt,
        source: existing ? existing.source : 'Direct',
      };

      if (onUpdateArticle) {
        onUpdateArticle(updatedArticle);
      } else {
        onAddArticle(updatedArticle);
      }

      setEditingArticleId(null);
      setManualTitle('');
      setManualExcerpt('');
      setManualSlug('');
      setSlugManuallyEdited(false);
      setManualContent('');
      setManualKeywords('');
      setManualContentFormat('markdown');
      setManualMetaDescription('');
      setManualDraftId(null);
      setSectionErrors({});
      alert('¡Artículo actualizado con éxito!');
    } else {
      const newArticle: Article = {
        id: manualDraftId || `art-${Date.now()}`,
        slug: slugify(manualSlug) || slugify(manualTitle) || undefined,
        title: manualTitle,
        excerpt: manualExcerpt || manualTitle,
        content: manualContent,
        contentFormat: manualContentFormat,
        category: manualCategory,
        neighborhood: manualNeighborhood,
        imageUrl: manualImage || 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=1200&q=80',
        imageAspect: '16:9',
        publishedAt: 'Ahora',
        author: {
          name: 'Local Editor',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          role: 'News Editor',
        },
        readTimeMinutes: 3,
        isUrgent: manualIsUrgent,
        viewsCount: 1,
        likesCount: 0,
        commentsCount: 0,
        seoKeywords: String(manualKeywords || '').split(',').map((k) => k.trim()).filter(Boolean),
        metaDescription: manualMetaDescription || manualExcerpt,
        source: 'Direct',
      };

      onAddArticle(newArticle);
      setManualTitle('');
      setManualExcerpt('');
      setManualSlug('');
      setSlugManuallyEdited(false);
      setManualContent('');
      setManualKeywords('');
      setManualContentFormat('markdown');
      setManualMetaDescription('');
      setManualDraftId(null);
      setSectionErrors({});
      alert('¡Artículo publicado con éxito!');
    }
  };

  const sentimentData = useMemo(() => {
    let positive = 0;
    let negative = 0;
    let neutral = 0;

    const positiveWords = ['excelente', 'bueno', 'genial', 'fantastico', 'gracias', 'increible', 'buen', 'me gusta', 'estupendo', 'maravilloso', 'رائع', 'ممتاز', 'جيد', 'جميل', 'مفيد', 'شكرا'];
    const negativeWords = ['malo', 'pesimo', 'horrible', 'problema', 'error', 'lamentable', 'terrible', 'basura', 'سيء', 'ضعيف', 'مزعج', 'غاضب', 'للأسف', 'مشكلة'];

    comments.forEach((comment) => {
      let isPositive = false;
      let isNegative = false;
      
      const words = comment.content.split(/\s+/);
      for (const word of words) {
        if (positiveWords.includes(word)) isPositive = true;
        if (negativeWords.includes(word)) isNegative = true;
      }

      if (isPositive && !isNegative) {
        positive++;
      } else if (isNegative && !isPositive) {
        negative++;
      } else {
        neutral++;
      }
    });

    if (comments.length === 0) {
      return [
        { name: language === 'es' ? 'Positivo' : language === 'ar' ? 'إيجابي' : 'Positive', value: 1, color: '#10b981' },
        { name: language === 'es' ? 'Neutro' : language === 'ar' ? 'محايد' : 'Neutral', value: 1, color: '#94a3b8' },
        { name: language === 'es' ? 'Negativo' : language === 'ar' ? 'سلبي' : 'Negative', value: 1, color: '#ef4444' },
      ];
    }

    return [
      { name: language === 'es' ? 'Positivo' : language === 'ar' ? 'إيجابي' : 'Positive', value: positive, color: '#10b981' },
      { name: language === 'es' ? 'Neutro' : language === 'ar' ? 'محايد' : 'Neutral', value: neutral, color: '#94a3b8' },
      { name: language === 'es' ? 'Negativo' : language === 'ar' ? 'سلبي' : 'Negative', value: negative, color: '#ef4444' },
    ];
  }, [comments]);

  return (
    <div className="my-6 space-y-6">
      {/* Control Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-black">
              <SlidersHorizontal className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{strings.adminTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Google News Import • AI Journalist • Image Studio • Manual Editor
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex-wrap">
          <button
            onClick={() => setAdminTab('google-news')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              adminTab === 'google-news'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Google News</span>
          </button>

          <button
            onClick={() => setAdminTab('ai-writer')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              adminTab === 'ai-writer'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Editor</span>
          </button>

          <button
            onClick={() => setAdminTab('ai-image')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              adminTab === 'ai-image'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>AI Image Studio</span>
          </button>

          <button
            onClick={() => setAdminTab('manual')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              adminTab === 'manual'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manual Entry</span>
          </button>

          <button
            onClick={() => setAdminTab('analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              adminTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GOOGLE NEWS */}
      {adminTab === 'google-news' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-rose-600" />
                Google News Auto-Import & AI Rewrite
              </h3>
              <p className="text-xs text-slate-500">
                Search live news feeds and auto-generate local articles using Gemini AI.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Madrid noticias, Barcelona eventos..."
              value={googleNewsQuery}
              onChange={(e) => setGoogleNewsQuery(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white"
            />
            <button
              onClick={handleFetchGoogleNews}
              disabled={importLoading}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0"
            >
              {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Fetch News</span>
            </button>
          </div>

          <div className="space-y-3">
            {importedItems.length === 0 ? (
              <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                <Globe className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-bold">Click 'Fetch News' to import latest headlines from Google News.</p>
              </div>
            ) : (
              importedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-rose-600">
                      <span>Source: {item.source}</span>
                      <span className="text-slate-400">• {item.pubDate}</span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{item.snippet}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleRewriteAndEditGoogleNewsItem(item, idx)}
                      disabled={rewriteLoadingState?.index === idx}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      title="Reescribir noticia y cargar en editor para modificar antes de publicar"
                    >
                      {rewriteLoadingState?.index === idx && rewriteLoadingState?.action === 'edit' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Pencil className="w-3.5 h-3.5" />
                      )}
                      <span>Editar antes de publicar (Edit)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRewriteAndPublishGoogleNewsItem(item, idx)}
                      disabled={rewriteLoadingState?.index === idx}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      {rewriteLoadingState?.index === idx && rewriteLoadingState?.action === 'publish' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                      )}
                      <span>Publicación directa (Direct)</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AI ARTICLE WRITER */}
      {adminTab === 'ai-writer' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-5">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI Article Generator (Gemini + Discover SEO)
            </h3>
            <p className="text-xs text-slate-500">
              Provide a news topic or event name, and Gemini AI will write a complete local news article.
            </p>
          </div>

          <form onSubmit={handleGenerateAIArticle} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                News Topic / Event Headline:
              </label>
              <input
                type="text"
                placeholder="e.g. New park opening in Salamanca district with solar benches"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">District:</label>
                <input
                  type="text"
                  value={aiNeighborhood}
                  onChange={(e) => setAiNeighborhood(e.target.value as Neighborhood)}
                  className="w-full bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category:</label>
                <input
                  type="text"
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value as ArticleCategory)}
                  className="w-full bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">SEO Keywords:</label>
                <input
                  type="text"
                  value={aiKeywords}
                  onChange={(e) => setAiKeywords(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={aiGenerating || !aiTopic.trim()}
              className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-sm py-3 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              {aiGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5 text-amber-300" />}
              <span>{aiGenerating ? 'Generating...' : 'Generate AI Article'}</span>
            </button>
          </form>

          {aiGeneratedResult && (
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 flex-wrap gap-2">
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-4 h-4" /> AI Article Generated Successfully!
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleEditAIGeneratedArticle}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-md flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar antes de publicar (Edit)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePublishAIGeneratedArticle}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Publicación directa (Publish)</span>
                  </button>
                </div>
              </div>

              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {aiGeneratedResult.title}
              </h3>
              <p className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/40">
                {aiGeneratedResult.excerpt}
              </p>

              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                {aiGeneratedResult.content}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI IMAGE */}
      {adminTab === 'ai-image' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-5">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-rose-600" />
              AI Image Studio
            </h3>
            <p className="text-xs text-slate-500">
              Generate 16:9 news photography for your local articles.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Prompt:
              </label>
              <textarea
                rows={3}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleGenerateAIImage}
                disabled={generatingImage || !imagePrompt.trim()}
                className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
              >
                {generatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                <span>Generate Image</span>
              </button>
            </div>

            {generatedImageUrl && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 max-w-xl mx-auto shadow-md">
                  <img
                    src={generatedImageUrl}
                    alt="AI Generated"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MANUAL ENTRY */}
      {adminTab === 'manual' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-5">
          {editingArticleId && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-200">
              <span className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-600" />
                Editando artículo publicado (Editing Active Article)
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingArticleId(null);
                  setManualTitle('');
                  setManualExcerpt('');
                  setManualContent('');
                  setManualKeywords('');
                  setManualContentFormat('markdown');
                  setManualMetaDescription('');
                }}
                className="text-xs text-rose-600 underline font-bold"
              >
                Cancelar edición (Cancel Edit)
              </button>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-rose-600" />
                {editingArticleId ? 'Editar artículo (Edit Article)' : 'Crear artículo manual (Manual Article Creation)'}
              </h3>
              <p className="text-xs text-slate-500">
                Write or edit your article details manually and use AI to automatically classify its category.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClassifyArticle}
              disabled={classifying || (!manualTitle && !manualContent)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {classifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>AI Auto-Classify Category</span>
            </button>
          </div>

          {aiClassification && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  AI Suggested Category: <span className="underline decoration-amber-500 underline-offset-4">{aiClassification.suggestedCategory}</span>
                </span>
                <span className="text-[11px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded-full">
                  Confidence: {aiClassification.confidenceScore}%
                </span>
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-200 italic">
                "{aiClassification.reasoning}"
              </p>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 flex-wrap">
                  {aiClassification.suggestedKeywords?.map((kw: string, i: number) => (
                    <span key={i} className="text-[10px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-semibold border border-amber-200/60 dark:border-amber-800/60">
                      #{kw}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setManualCategory(aiClassification.suggestedCategory as ArticleCategory);
                    if (aiClassification.suggestedKeywords) {
                      setManualKeywords(aiClassification.suggestedKeywords.join(', '));
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Category</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleManualArticleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Title:</label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setManualTitle(newTitle);
                  if (!slugManuallyEdited) {
                    setManualSlug(slugify(newTitle));
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Slug (URL): <span className="font-normal text-slate-400">/news/{manualSlug || '...'}</span>
              </label>
              <input
                type="text"
                value={manualSlug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setManualSlug(slugify(e.target.value));
                }}
                placeholder="se-genera-automaticamente-del-titulo"
                className="w-full bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Extracto / Meta descripción (SEO): <span className="font-normal text-slate-400">{manualExcerpt.length}/160</span>
              </label>
              <textarea
                rows={2}
                maxLength={160}
                value={manualExcerpt}
                onChange={(e) => setManualExcerpt(e.target.value)}
                placeholder="Resumen breve del artículo, usado como extracto en las tarjetas y como meta descripción para buscadores."
                className="w-full bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Content:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setClaudeArticleError('');
                      setShowClaudeTopicInput((v) => !v);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-xs disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generar artículo con IA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInteractivePrompt((v) => !v)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generar guía interactiva con IA</span>
                  </button>
                </div>
              </div>

              {showClaudeTopicInput && (
                <div className="mb-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tema del artículo:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={claudeTopic}
                      onChange={(e) => setClaudeTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleGenerateArticleWithClaude();
                        }
                      }}
                      placeholder="Ej: artículo 50 AI Act España"
                      disabled={generatingArticleWithClaude}
                      className="flex-1 bg-white dark:bg-slate-800 p-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateArticleWithClaude}
                      disabled={generatingArticleWithClaude || !claudeTopic.trim()}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs disabled:opacity-50 shrink-0"
                    >
                      {generatingArticleWithClaude ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{generatingArticleWithClaude ? 'Generando...' : 'Generar'}</span>
                    </button>
                  </div>
                  {claudeArticleError && (
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400">{claudeArticleError}</p>
                  )}
                </div>
              )}

              {showInteractivePrompt && (
                <div className="p-3 mb-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 space-y-2 animate-fade-in">
                  <label className="block text-[11px] font-bold text-rose-800 dark:text-rose-300">
                    Tema de la guía interactiva:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={interactiveTopic}
                      onChange={(e) => setInteractiveTopic(e.target.value)}
                      placeholder="ej. Cómo desplegar un proyecto en Vercel"
                      className="flex-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl text-xs border border-rose-200 dark:border-rose-800 text-slate-900 dark:text-white"
                      disabled={generatingInteractive}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateInteractiveArticle}
                      disabled={generatingInteractive || !interactiveTopic.trim()}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      {generatingInteractive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>{generatingInteractive ? 'Investigando y generando...' : 'Generar'}</span>
                    </button>
                  </div>
                </div>
              )}

              {manualContentFormat === 'blocks' && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mb-1">
                  Contenido en formato de bloques (JSON) — edítalo con cuidado o vuelve a generar.
                </p>
              )}
              <textarea
                rows={5}
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white ${manualContentFormat === 'blocks' ? 'font-mono' : ''}`}
                required
              />

              {imageSections.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Imágenes de sección ({imageSections.filter((h) => h.image?.status === 'ready').length}/{imageSections.length} listas)
                    </h4>
                    <button
                      type="button"
                      onClick={handleGenerateMissingImages}
                      disabled={bulkGeneratingImages || !!sectionGeneratingId || imageSections.every((h) => h.image?.status === 'ready')}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[11px] px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {bulkGeneratingImages ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                      <span>Generar imágenes pendientes</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {imageSections.map((heading) => (
                      <SectionImageCard
                        key={heading.sectionId}
                        heading={heading.text}
                        image={heading.image!}
                        generating={sectionGeneratingId === heading.sectionId}
                        error={sectionErrors[heading.sectionId!] || null}
                        onGenerate={(promptOverride) => generateSectionImage(heading.sectionId!, heading.image, promptOverride)}
                        onSavePrompt={(prompt) => updateSectionImage(heading.sectionId!, { ...heading.image!, prompt })}
                        onClear={() => updateSectionImage(heading.sectionId!, { ...heading.image!, status: 'prompt_ready', current: undefined })}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Categoría / Category:
                </label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value as ArticleCategory)}
                  className="w-full bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="tech">Tecnología (Technology)</option>
                  <option value="sports">Deportes (Sports)</option>
                  <option value="politics">Política (Politics)</option>
                  <option value="general">Noticias generales (General News)</option>
                  <option value="economy">Economía (Economy)</option>
                  <option value="culture">Cultura (Culture)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Palabras clave / Keywords:
                </label>
                <input
                  type="text"
                  value={manualKeywords}
                  onChange={(e) => setManualKeywords(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  placeholder="tecnología, inteligencia artificial, noticias..."
                />
              </div>
            </div>

            {/* Article Image Section */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-rose-600" />
                  URL de la imagen de portada (Article Cover Image URL):
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    if (!manualTitle) {
                      alert('Por favor escribe el título del artículo primero.');
                      return;
                    }
                    setGeneratingImage(true);
                    try {
                      const res = await fetch('/api/ai/generate-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          prompt: `News article cover image for: ${manualTitle}`,
                          style: 'Fotografía periodística',
                        }),
                      });
                      const data = await res.json();
                      if (data.success && data.imageUrl) {
                        setManualImage(data.imageUrl);
                      } else {
                        alert('No se pudo generar la imagen con IA.');
                      }
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setGeneratingImage(false);
                    }
                  }}
                  disabled={generatingImage}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-xs disabled:opacity-50"
                >
                  {generatingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  <span>Generar imagen con IA (AI Image)</span>
                </button>
              </div>

              <input
                type="url"
                value={manualImage}
                onChange={(e) => setManualImage(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full bg-white dark:bg-slate-800 p-3 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />

              {/* Presets & Live Preview */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold text-slate-500">
                  <span>Imágenes predeterminadas:</span>
                  <button
                    type="button"
                    onClick={() => setManualImage('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80')}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-rose-600"
                  >
                    Tecnología
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualImage('https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80')}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-rose-600"
                  >
                    Deportes
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualImage('https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80')}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-rose-600"
                  >
                    Política
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualImage('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80')}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-rose-600"
                  >
                    Economía
                  </button>
                </div>

                {manualImage && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold">Vista previa:</span>
                    <img
                      src={manualImage}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-16 h-10 object-cover rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm py-3.5 rounded-2xl transition-colors shadow-md flex items-center justify-center gap-2"
              >
                {editingArticleId ? (
                  <>
                    <Pencil className="w-4 h-4" />
                    <span>Actualizar artículo (Update Article)</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Publicar artículo (Publish Article)</span>
                  </>
                )}
              </button>

              {editingArticleId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingArticleId(null);
                    setManualTitle('');
                    setManualExcerpt('');
                    setManualContent('');
                    setManualKeywords('');
                  }}
                  className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs px-4 py-3.5 rounded-2xl transition-colors"
                >
                  Cancelar (Cancel)
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: ANALYTICS */}
      {adminTab === 'analytics' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-5">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Análisis de sentimientos de los lectores (Reader Sentiment Analysis)
            </h3>
            <p className="text-xs text-slate-500">
              Distribución de sentimientos de los lectores según comentarios publicados.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' 
                  }} 
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            {sentimentData.map((data, index) => (
              <div key={index} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="text-2xl font-black" style={{ color: data.color }}>{data.value}</div>
                <div className="text-[10px] font-bold text-slate-500 mt-1">{data.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Published Articles List */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
          Artículos publicados / Published Articles ({articles.length})
        </h3>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          <p className="text-[10px] text-slate-500 mb-2">Arrastra y suelta para reordenar los artículos en la página principal (Drag and drop to reorder homepage layout)</p>
          {articles.map((art, index) => {
            const title = getLocalizedField(art.title, language);
            return (
              <div
                key={art.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border ${draggedOverItemIndex === index ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/30' : 'border-slate-200 dark:border-slate-700'} flex items-center justify-between gap-3 cursor-move transition-all`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600 dark:hover:text-slate-300">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                  </div>
                  <img
                    src={art.imageUrl}
                    alt={title}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-rose-600 block">
                      {art.category}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-md">
                      {title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRegenerateArticleImage(art)}
                    disabled={regeneratingImageId === art.id}
                    className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors disabled:opacity-50"
                    title="Generate new image with AI"
                  >
                    {regeneratingImageId === art.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditPublishedArticle(art)}
                    className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-colors"
                    title="Editar artículo"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteArticle(art.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                    title="Eliminar artículo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
