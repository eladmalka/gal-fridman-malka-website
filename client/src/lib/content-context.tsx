import { createContext, useContext, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import img1 from "@/assets/images/gallery-1.jpg";
import img2 from "@/assets/images/gallery-2.jpg";
import img3 from "@/assets/images/hero.jpg";

export type ImageSlot = {
  url: string;
  alt: string;
  aspectRatioLabel: string;
};

export type ContentState = {
  hero: {
    badge: string;
    titleMain: string;
    titleSub: string;
    description: string;
  };
  trust: {
    testimonialsTitle: string;
  };
  services: {
    title: string;
    description: string;
  };
  benefits: {
    title: string;
    description: string;
  };
  gallery: {
    title: string;
    images: { id: number; url: string; alt: string }[];
  };
  contact: {
    title: string;
    subtitle: string;
  };
  images: {
    [key: string]: ImageSlot;
  };
};

const defaultContent: ContentState = {
  hero: {
    badge: "אימון זוגי & נומרולוגיה",
    titleMain: "גל פרידמן מלכה",
    titleSub: "נומרולוגית ומאמנת זוגית",
    description: "שילוב ייחודי של אבחון נומרולוגי עמוק עם כלים פרקטיים מעולם האימון הזוגי, ליצירת תקשורת טובה יותר, הבנה וחיבור אמיתי.",
  },
  trust: {
    testimonialsTitle: "מה מספרים עלינו",
  },
  services: {
    title: "איך נוכל לעבוד יחד?",
    description: "תהליכים מדויקים המשלבים עומק רוחני ופרקטיקה יומיומית",
  },
  benefits: {
    title: "למה נומרולוגיה ואימון זוגי עובדים כל כך טוב ביחד?",
    description: "כשמשלבים אבחון מדויק עם כלים מעשיים, התהליך הופך להיות ברור, קצר ואפקטיבי הרבה יותר.",
  },
  gallery: {
    title: "הקליניקה והאווירה",
    images: [
      { id: 1, url: img1, alt: "קליניקה" },
      { id: 2, url: img2, alt: "אווירה" },
      { id: 3, url: img3, alt: "זוגיות" }
    ],
  },
  contact: {
    title: "בואי נתחיל",
    subtitle: "השאירי פרטים לשיחת היכרות קצרה ללא עלות",
  },
  images: {
    HERO_BACKGROUND: { url: img3, alt: "רקע קליניקה נומרולוגיה", aspectRatioLabel: "16:9 (מומלץ 1920x1080)" },
    BENEFITS_IMAGE: { url: img1, alt: "קליניקה ואווירה", aspectRatioLabel: "3:4 אופקי (מומלץ 800x1000)" }
  }
};

const defaultImageSlots: Record<string, { url: string; alt: string; aspectRatioLabel: string }> = {
  HERO_BACKGROUND: { url: img3, alt: "רקע קליניקה נומרולוגיה", aspectRatioLabel: "16:9 (מומלץ 1920x1080)" },
  BENEFITS_IMAGE: { url: img1, alt: "קליניקה ואווירה", aspectRatioLabel: "3:4 אופקי (מומלץ 800x1000)" }
};

const defaultGalleryImages = [
  { id: 1, url: img1, alt: "קליניקה" },
  { id: 2, url: img2, alt: "אווירה" },
  { id: 3, url: img3, alt: "זוגיות" }
];

function buildContentState(
  textMap: Record<string, string> | undefined,
  imageSlots: Array<{ id: number; slotKey: string; filePath: string | null; alt: string; aspectRatioLabel: string }> | undefined,
  galleryImages: Array<{ id: number; filePath: string; alt: string; sortOrder: number }> | undefined
): ContentState {
  const t = (key: string, fallback: string) => textMap?.[key] ?? fallback;

  const images: Record<string, ImageSlot> = { ...defaultImageSlots };
  if (imageSlots) {
    for (const slot of imageSlots) {
      images[slot.slotKey] = {
        url: slot.filePath || defaultImageSlots[slot.slotKey]?.url || img3,
        alt: slot.alt || defaultImageSlots[slot.slotKey]?.alt || "",
        aspectRatioLabel: slot.aspectRatioLabel || defaultImageSlots[slot.slotKey]?.aspectRatioLabel || "",
      };
    }
  }

  const gallery = galleryImages && galleryImages.length > 0
    ? galleryImages.map(g => ({ id: g.id, url: g.filePath, alt: g.alt }))
    : defaultGalleryImages;

  return {
    hero: {
      badge: t("hero.badge", defaultContent.hero.badge),
      titleMain: t("hero.titleMain", defaultContent.hero.titleMain),
      titleSub: t("hero.titleSub", defaultContent.hero.titleSub),
      description: t("hero.description", defaultContent.hero.description),
    },
    trust: {
      testimonialsTitle: t("trust.testimonialsTitle", defaultContent.trust.testimonialsTitle),
    },
    services: {
      title: t("services.title", defaultContent.services.title),
      description: t("services.description", defaultContent.services.description),
    },
    benefits: {
      title: t("benefits.title", defaultContent.benefits.title),
      description: t("benefits.description", defaultContent.benefits.description),
    },
    gallery: {
      title: t("gallery.title", defaultContent.gallery.title),
      images: gallery,
    },
    contact: {
      title: t("contact.title", defaultContent.contact.title),
      subtitle: t("contact.subtitle", defaultContent.contact.subtitle),
    },
    images,
  };
}

type ContentContextType = {
  content: ContentState;
  loading: boolean;
  refetchContent: () => void;
};

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export function ContentProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    fetch("/api/admin/init", { method: "POST" }).catch(() => {});
  }, []);

  const { data: textMap, isLoading: textLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/content"],
  });

  const { data: imageSlots, isLoading: slotsLoading } = useQuery<Array<{ id: number; slotKey: string; filePath: string | null; alt: string; aspectRatioLabel: string }>>({
    queryKey: ["/api/image-slots"],
  });

  const { data: galleryImages, isLoading: galleryLoading } = useQuery<Array<{ id: number; filePath: string; alt: string; sortOrder: number }>>({
    queryKey: ["/api/gallery"],
  });

  const loading = textLoading || slotsLoading || galleryLoading;
  const content = buildContentState(textMap, imageSlots, galleryImages);

  const refetchContent = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    queryClient.invalidateQueries({ queryKey: ["/api/image-slots"] });
    queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
  };

  return (
    <ContentContext.Provider value={{ content, loading, refetchContent }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error("useContent must be used within a ContentProvider");
  }
  return context;
}

export function useRefetchContent() {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error("useRefetchContent must be used within a ContentProvider");
  }
  return context.refetchContent;
}
