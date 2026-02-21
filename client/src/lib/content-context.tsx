import { createContext, useContext, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import img1 from "@/assets/images/gallery-1.jpg";
import img2 from "@/assets/images/gallery-2.jpg";
import img3 from "@/assets/images/hero.jpg";

export type ImageSlot = {
  url: string;
  alt: string;
  aspectRatioLabel: string;
  positionX: number;
  positionY: number;
};

export type ContentState = {
  hero: {
    badge: string;
    titleMain: string;
    titleSub: string;
    description: string;
  };
  about: {
    title: string;
    content: string;
  };
  trust: {
    testimonialsTitle: string;
  };
  services: {
    title: string;
    description: string;
    cards: {
      title: string;
      description: string;
      bullets: string[];
    }[];
  };
  benefits: {
    title: string;
    description: string;
    items: {
      title: string;
      description: string;
    }[];
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
  about: {
    title: "אז מי אני?",
    content: `גל פרידמן מלכה בת 27
נשואה לאלעד גרה בעמק יזרעאל 
אני נומרולוגית ומאמנת זוגית בשיטת זוגיות מעשית של הדר זוהר.

למה בחרתי להיות מאמנת זוגיות ונומרולוגית?
נושא הזוגיות ואהבה זה הדבר שהלב שלי הכי המשך אליו מאז שאני ילדה קטנה.
מאז שאני קטנה אני זוכרת את עצמי משלימה בין ההורים שלי.
כל החברות שלי תמיד היו מתייעצות איתי לגבי מערכות היחסים שלהן כי תמיד הצלחתי להסתכל על שני הצדדים ולא רק להצדיק את החברה שלי וכמה שהיא מושלמת והבן זוג שלה טועה, אלא הצלחתי לגרום להן לראות איפה גם הן צריכות להשתפר.
כשטיילתי בדרום אמריקה מצאתי את עצמי הרבה פעמים משלימה בין זוגות שרבו או שהיו ביניהם קצרים בתקשורת.
מגיל 23 התחלתי לשאול את עצמי שאלות ולהטיל ספק בדברים שאני יודעת ומכירה.
נרשמתי לתואר שלא באמת רציתי ללמוד, הייתי שם נטו כי הלכתי אחרי מוסכמות החברה,
כשהכרתי את הנומרולוגיה והמפה הנומרולוגית שלי, כשהתחברתי לדרך של הנשמה שלי הבנתי יותר לעומק
שלא סתם אהבה זה חלק בלתי נפרד מחיי.
אהבה זה השיעור הכי גדול שלי, והייעוד שלי כאן ביקום.
בילדותי חוויתי חוסר ביטחון עצמי, חוסר אהבה עצמית, חוסר קבלה עצמית
עד אלעד בעלי לא הייתה לי מערכת יחסים רצינית לאורך זמן,
הרגשתי שהחוסר ביטחון שלי רק הולך וגדל.
גם במערכת יחסים עם אלעד עברתי המון עליות וירידות הן ברמה האישית והן ברמה הזוגית.
 והבנתי לעומק,
לא סתם חווינו את הקשיים והאתגרים האלו.
אני חוויתי אותם בכדי לצבור ידע שאוכל להעביר הלא. 
מעבר לידע שרכשתי מהלימודים ומהדרי המהממת
רכשתי ידע וכלים בזכות האירועים שעברתי ועברנו ביחד בזוגיות שלנו ובכך לעזור גם לרווקים שמחפשים זוגיות ונתקלים בקשיים, וגם לזוגות שחווים קשיים במערכת הזוגית שלהם. 

והיום אני מקבלת לאימונים אישיים וזוגיים
גם יחידים שמתמודדים עם הרצון להיות בזוגיות 
וגם עם זוגות שחווים קשיים ורוצים לקדם את מערכת היחסים שלהם למקבלת מקדמת ומרימה.
באנו לפה ללמוד, להתפתח ולאהוב ללא תנאי ♥️
מוזמנים אליי להתחבר לאהבה ללא תנאי שקיימת בתוכם 
בואו נדליק בכם את האור לחיים מאושרים ורגועים יותר ♥️`,
  },
  trust: {
    testimonialsTitle: "מה מספרים עליי",
  },
  services: {
    title: "איך נוכל לעבוד ביחד?",
    description: "תהליכים מדויקים המשלבים עומק רוחני ופרקטיקה יומיומית",
    cards: [
      {
        title: "מפה נומרולוגית אישית",
        description: "מפגש היכרות עמוק דרך תאריך הלידה והשם.",
        bullets: ["זיהוי דפוסי התנהגות עמוקים", "הבנת חוזקות ואתגרים אישיים", "בהירות לגבי ייעוד ודרך"],
      },
      {
        title: "אימון זוגי ממוקד",
        description: "ליווי תהליכי שבועי ליצירת תקשורת בונה.",
        bullets: ["הקניית כלי הקשבה פעילה", "בניית הסכמות וגבולות בריאים", "החזרת האינטימיות והקרבה"],
      },
      {
        title: "השילוב הייחודי",
        description: "מספרים שמגלים דפוסים + אימון שמייצר שינוי.",
        bullets: ["קיצור תהליכים בזכות אבחון מהיר", "הבנת הדינמיקה בין המפות של שניכם", "תוכנית עבודה מעשית ומשותפת"],
      },
    ],
  },
  benefits: {
    title: "למה נומרולוגיה ואימון זוגי עובדים כל כך טוב ביחד?",
    description: "כשמשלבים אבחון מדויק עם כלים מעשיים, התהליך הופך להיות ברור, קצר ואפקטיבי הרבה יותר.",
    items: [
      { title: "זיהוי מהיר של שורש הבעיה", description: "במקום שבועות של שיחות בניסיון להבין \"מה לא עובד\", המפה הנומרולוגית משקפת באופן צלול את דפוסי התקשורת והטריגרים של כל אחד מכם." },
      { title: "הפיכת תובנות להסכמות", description: "להבין זה חשוב, אבל זה לא מספיק. כאן נכנס האימון הזוגי שלוקח את ההבנות מהמפה והופך אותן לגבולות בריאים, שגרה מיטיבה והסכמות מעשיות ליומיום." },
      { title: "צמיחה אישית מתוך הקשר", description: "התהליך מאפשר לכל אחד להיות הגרסה הטובה ביותר של עצמו, ולהבין איך המסע האישי שלו תורם או מאתגר את המערכת הזוגית כולה." },
    ],
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
    HERO_BACKGROUND: { url: img3, alt: "רקע קליניקה נומרולוגיה", aspectRatioLabel: "16:9 (מומלץ 1920x1080)", positionX: 50, positionY: 50 },
    BENEFITS_IMAGE: { url: img1, alt: "קליניקה ואווירה", aspectRatioLabel: "3:4 אופקי (מומלץ 800x1000)", positionX: 50, positionY: 50 },
    ABOUT_IMAGE: { url: "/uploads/about_profile.jpg", alt: "גל פרידמן מלכה", aspectRatioLabel: "1:1 עגול (מומלץ 400x400)", positionX: 50, positionY: 25 }
  }
};

const defaultImageSlots: Record<string, ImageSlot> = {
  HERO_BACKGROUND: { url: img3, alt: "רקע קליניקה נומרולוגיה", aspectRatioLabel: "16:9 (מומלץ 1920x1080)", positionX: 50, positionY: 50 },
  BENEFITS_IMAGE: { url: img1, alt: "קליניקה ואווירה", aspectRatioLabel: "3:4 אופקי (מומלץ 800x1000)", positionX: 50, positionY: 50 },
  ABOUT_IMAGE: { url: "/uploads/about_profile.jpg", alt: "גל פרידמן מלכה", aspectRatioLabel: "1:1 עגול (מומלץ 400x400)", positionX: 50, positionY: 25 }
};

const defaultGalleryImages = [
  { id: 1, url: img1, alt: "קליניקה" },
  { id: 2, url: img2, alt: "אווירה" },
  { id: 3, url: img3, alt: "זוגיות" }
];

function buildContentState(
  textMap: Record<string, string> | undefined,
  imageSlots: Array<{ id: number; slotKey: string; filePath: string | null; alt: string; aspectRatioLabel: string; positionX: number; positionY: number }> | undefined,
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
        positionX: slot.positionX ?? defaultImageSlots[slot.slotKey]?.positionX ?? 50,
        positionY: slot.positionY ?? defaultImageSlots[slot.slotKey]?.positionY ?? 50,
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
    about: {
      title: t("about.title", defaultContent.about.title),
      content: t("about.content", defaultContent.about.content),
    },
    trust: {
      testimonialsTitle: t("trust.testimonialsTitle", defaultContent.trust.testimonialsTitle),
    },
    services: {
      title: t("services.title", defaultContent.services.title),
      description: t("services.description", defaultContent.services.description),
      cards: defaultContent.services.cards.map((card, i) => ({
        title: t(`services.card${i}.title`, card.title),
        description: t(`services.card${i}.description`, card.description),
        bullets: card.bullets.map((b, j) => t(`services.card${i}.bullet${j}`, b)),
      })),
    },
    benefits: {
      title: t("benefits.title", defaultContent.benefits.title),
      description: t("benefits.description", defaultContent.benefits.description),
      items: defaultContent.benefits.items.map((item, i) => ({
        title: t(`benefits.item${i}.title`, item.title),
        description: t(`benefits.item${i}.description`, item.description),
      })),
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
