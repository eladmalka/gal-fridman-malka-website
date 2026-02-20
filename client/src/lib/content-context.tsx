import { createContext, useContext, useState, ReactNode } from "react";
import img1 from "@/assets/images/gallery-1.jpg";
import img2 from "@/assets/images/gallery-2.jpg";
import img3 from "@/assets/images/hero.jpg";

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
  }
};

type ContentContextType = {
  content: ContentState;
  setContent: (content: ContentState) => void;
  adminPassword: string;
  setAdminPassword: (password: string) => void;
};

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ContentState>(defaultContent);
  const [adminPassword, setAdminPassword] = useState("admin123");

  return (
    <ContentContext.Provider value={{ content, setContent, adminPassword, setAdminPassword }}>
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