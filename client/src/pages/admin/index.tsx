import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ImagePlus, Trash2, GripVertical, LogOut, UploadCloud, Save } from "lucide-react";
import { useContent, useRefetchContent } from "@/lib/content-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const MAX_GALLERY_IMAGES = 5;

export default function Admin() {
  const { content } = useContent();
  const refetchContent = useRefetchContent();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [pendingImageSlotKey, setPendingImageSlotKey] = useState<string | null>(null);
  const [showImageConfirm, setShowImageConfirm] = useState(false);

  const [pendingGalleryFile, setPendingGalleryFile] = useState<File | null>(null);
  const [pendingGalleryPreview, setPendingGalleryPreview] = useState<string | null>(null);
  const [showGalleryConfirm, setShowGalleryConfirm] = useState(false);
  const [showGalleryReplaceDialog, setShowGalleryReplaceDialog] = useState(false);
  const [replaceTargetId, setReplaceTargetId] = useState<number | null>(null);

  const [localTexts, setLocalTexts] = useState<Record<string, string>>({});
  const [savedTexts, setSavedTexts] = useState<Record<string, string>>({});
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const [localGalleryAlts, setLocalGalleryAlts] = useState<Record<number, string>>({});
  const [savedGalleryAlts, setSavedGalleryAlts] = useState<Record<number, string>>({});
  const [showGallerySaveConfirm, setShowGallerySaveConfirm] = useState(false);

  const [localSlotAlts, setLocalSlotAlts] = useState<Record<string, string>>({});
  const [savedSlotAlts, setSavedSlotAlts] = useState<Record<string, string>>({});
  const [showSlotSaveConfirm, setShowSlotSaveConfirm] = useState(false);

  useEffect(() => {
    const texts = {
      "hero.badge": content.hero.badge,
      "hero.titleMain": content.hero.titleMain,
      "hero.titleSub": content.hero.titleSub,
      "hero.description": content.hero.description,
      "trust.testimonialsTitle": content.trust.testimonialsTitle,
      "services.title": content.services.title,
      "services.description": content.services.description,
      "benefits.title": content.benefits.title,
      "benefits.description": content.benefits.description,
      "gallery.title": content.gallery.title,
      "contact.title": content.contact.title,
      "contact.subtitle": content.contact.subtitle,
    };
    setLocalTexts(texts);
    setSavedTexts(texts);
  }, [content]);

  useEffect(() => {
    const alts: Record<number, string> = {};
    for (const img of content.gallery.images) {
      alts[img.id] = img.alt;
    }
    setLocalGalleryAlts(alts);
    setSavedGalleryAlts(alts);
  }, [content.gallery.images]);

  useEffect(() => {
    const alts: Record<string, string> = {};
    for (const [key, slot] of Object.entries(content.images)) {
      alts[key] = slot.alt;
    }
    setLocalSlotAlts(alts);
    setSavedSlotAlts(alts);
  }, [content.images]);

  const hasTextChanges = Object.keys(localTexts).some(
    key => localTexts[key] !== savedTexts[key]
  );

  const hasGalleryAltChanges = Object.keys(localGalleryAlts).some(
    key => localGalleryAlts[Number(key)] !== savedGalleryAlts[Number(key)]
  );

  const hasSlotAltChanges = Object.keys(localSlotAlts).some(
    key => localSlotAlts[key] !== savedSlotAlts[key]
  );

  const textMutation = useMutation({
    mutationFn: async (entries: Record<string, string>) => {
      await apiRequest("PUT", "/api/content", entries);
    },
    onSuccess: () => {
      setSavedTexts({ ...localTexts });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({ title: "השינויים נשמרו בהצלחה" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה", description: "שמירת השינויים נכשלה." });
    },
  });

  const handleUpdateText = useCallback((key: string, value: string) => {
    setLocalTexts(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveTexts = () => { setShowSaveConfirm(true); };
  const confirmSaveTexts = () => {
    setShowSaveConfirm(false);
    const changedEntries: Record<string, string> = {};
    for (const key of Object.keys(localTexts)) {
      if (localTexts[key] !== savedTexts[key]) {
        changedEntries[key] = localTexts[key];
      }
    }
    if (Object.keys(changedEntries).length > 0) {
      textMutation.mutate(changedEntries);
    }
  };

  const galleryAltSaveMutation = useMutation({
    mutationFn: async (entries: { id: number; alt: string }[]) => {
      for (const entry of entries) {
        await apiRequest("PUT", `/api/gallery/${entry.id}`, { alt: entry.alt });
      }
    },
    onSuccess: () => {
      setSavedGalleryAlts({ ...localGalleryAlts });
      refetchContent();
      toast({ title: "תיאורי הגלריה נשמרו בהצלחה" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה", description: "שמירת התיאורים נכשלה." });
    },
  });

  const handleSaveGalleryAlts = () => { setShowGallerySaveConfirm(true); };
  const confirmSaveGalleryAlts = () => {
    setShowGallerySaveConfirm(false);
    const changed: { id: number; alt: string }[] = [];
    for (const key of Object.keys(localGalleryAlts)) {
      const id = Number(key);
      if (localGalleryAlts[id] !== savedGalleryAlts[id]) {
        changed.push({ id, alt: localGalleryAlts[id] });
      }
    }
    if (changed.length > 0) {
      galleryAltSaveMutation.mutate(changed);
    }
  };

  const slotAltSaveMutation = useMutation({
    mutationFn: async (entries: { slotKey: string; alt: string }[]) => {
      for (const entry of entries) {
        await apiRequest("PUT", `/api/image-slots/${entry.slotKey}`, { alt: entry.alt });
      }
    },
    onSuccess: () => {
      setSavedSlotAlts({ ...localSlotAlts });
      refetchContent();
      toast({ title: "תיאורי התמונות נשמרו בהצלחה" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה", description: "שמירת התיאורים נכשלה." });
    },
  });

  const handleSaveSlotAlts = () => { setShowSlotSaveConfirm(true); };
  const confirmSaveSlotAlts = () => {
    setShowSlotSaveConfirm(false);
    const changed: { slotKey: string; alt: string }[] = [];
    for (const key of Object.keys(localSlotAlts)) {
      if (localSlotAlts[key] !== savedSlotAlts[key]) {
        changed.push({ slotKey: key, alt: localSlotAlts[key] });
      }
    }
    if (changed.length > 0) {
      slotAltSaveMutation.mutate(changed);
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (pw: string) => {
      await apiRequest("POST", "/api/admin/login", { password: pw });
    },
    onSuccess: () => {
      setIsLoggedIn(true);
      setPassword("");
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה", description: "סיסמה שגויה." });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(password);
  };

  const imageSlotUploadMutation = useMutation({
    mutationFn: async ({ slotKey, file }: { slotKey: string; file: File }) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`/api/image-slots/${slotKey}/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      refetchContent();
      toast({ title: "התמונה הוחלפה בהצלחה", description: "השינוי יעודכן באתר מיד." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה", description: "העלאת התמונה נכשלה." });
    },
  });

  const triggerUpload = (slotKey: string) => {
    setActiveSlot(slotKey);
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeSlot) {
      setPendingImageFile(file);
      setPendingImageSlotKey(activeSlot);
      setPendingImagePreview(URL.createObjectURL(file));
      setShowImageConfirm(true);
    }
    if (e.target) e.target.value = "";
  };

  const confirmImageUpload = () => {
    if (pendingImageFile && pendingImageSlotKey) {
      imageSlotUploadMutation.mutate({ slotKey: pendingImageSlotKey, file: pendingImageFile });
    }
    cleanupImageConfirm();
  };

  const cleanupImageConfirm = () => {
    setShowImageConfirm(false);
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingImageFile(null);
    setPendingImagePreview(null);
    setPendingImageSlotKey(null);
  };

  const galleryUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/gallery/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      refetchContent();
      toast({ title: "התמונה נוספה לגלריה בהצלחה" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה", description: "העלאת התמונה נכשלה." });
    },
  });

  const galleryReplaceMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`/api/gallery/${id}/replace`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Replace failed");
      return res.json();
    },
    onSuccess: () => {
      refetchContent();
      toast({ title: "התמונה הוחלפה בהצלחה" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה", description: "החלפת התמונה נכשלה." });
    },
  });

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingGalleryFile(file);
      setPendingGalleryPreview(URL.createObjectURL(file));
      if (content.gallery.images.length >= MAX_GALLERY_IMAGES) {
        setShowGalleryReplaceDialog(true);
      } else {
        setShowGalleryConfirm(true);
      }
    }
    if (e.target) e.target.value = "";
  };

  const confirmGalleryUpload = () => {
    if (pendingGalleryFile) {
      galleryUploadMutation.mutate(pendingGalleryFile);
    }
    cleanupGalleryConfirm();
  };

  const confirmGalleryReplace = () => {
    if (pendingGalleryFile && replaceTargetId !== null) {
      galleryReplaceMutation.mutate({ id: replaceTargetId, file: pendingGalleryFile });
    }
    cleanupGalleryConfirm();
  };

  const cleanupGalleryConfirm = () => {
    setShowGalleryConfirm(false);
    setShowGalleryReplaceDialog(false);
    setReplaceTargetId(null);
    if (pendingGalleryPreview) URL.revokeObjectURL(pendingGalleryPreview);
    setPendingGalleryFile(null);
    setPendingGalleryPreview(null);
  };

  const galleryDeleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/gallery/${id}`);
    },
    onSuccess: () => {
      refetchContent();
      toast({ title: "התמונה נמחקה בהצלחה" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      await apiRequest("POST", "/api/admin/change-password", { currentPassword, newPassword });
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "הסיסמה שונתה בהצלחה" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error.message.includes("401") ? "הסיסמה הנוכחית אינה נכונה." : "שינוי הסיסמה נכשל.",
      });
    },
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "שגיאה", description: "הסיסמאות החדשות אינן תואמות." });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "שגיאה", description: "הסיסמה החדשה צריכה להכיל לפחות 6 תווים." });
      return;
    }
    passwordMutation.mutate({ currentPassword, newPassword });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans" dir="rtl">
        <Card className="w-full max-w-sm border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center font-heading">כניסת מנהל</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                className="bg-white"
                data-testid="input-admin-password"
              />
              <Button type="submit" className="w-full" data-testid="btn-admin-login" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "מתחבר..." : "היכנס"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans" dir="rtl">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
      <input type="file" ref={galleryFileInputRef} onChange={handleGalleryUpload} accept="image/*" className="hidden" />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-heading">לוח בקרה</h1>
          <Button variant="outline" onClick={() => setIsLoggedIn(false)} data-testid="btn-admin-logout" className="gap-2">
            <LogOut size={16} />
            התנתק
          </Button>
        </div>

        <Tabs defaultValue="texts" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-white shadow-sm border border-border/50">
            <TabsTrigger value="texts" className="h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">תוכן</TabsTrigger>
            <TabsTrigger value="images" className="h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">תמונות ראשיות</TabsTrigger>
            <TabsTrigger value="gallery" className="h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">גלריה</TabsTrigger>
            <TabsTrigger value="settings" className="h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">הגדרות</TabsTrigger>
          </TabsList>

          {/* === TEXTS TAB === */}
          <TabsContent value="texts" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>עריכת טקסטים - עמוד הבית</CardTitle>
                    <CardDescription>ערכי את הטקסטים ולחצי על "שמור שינויים" כשסיימת.</CardDescription>
                  </div>
                  <Button onClick={handleSaveTexts} disabled={!hasTextChanges || textMutation.isPending} className="gap-2 shrink-0" data-testid="btn-save-texts">
                    <Save size={16} />
                    {textMutation.isPending ? "שומר..." : "שמור שינויים"}
                  </Button>
                </div>
                {hasTextChanges && (
                  <div className="mt-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    יש שינויים שלא נשמרו - לחצי על "שמור שינויים" לשמירה.
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 border-b pb-6">
                  <h3 className="font-bold text-lg text-primary">אזור ראשי (Hero)</h3>
                  <div className="space-y-2">
                    <Label>תגית עליונה</Label>
                    <Input value={localTexts["hero.badge"] ?? ""} onChange={(e) => handleUpdateText('hero.badge', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>כותרת ראשית</Label>
                    <Input value={localTexts["hero.titleMain"] ?? ""} onChange={(e) => handleUpdateText('hero.titleMain', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>תת כותרת</Label>
                    <Input value={localTexts["hero.titleSub"] ?? ""} onChange={(e) => handleUpdateText('hero.titleSub', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>תיאור</Label>
                    <Textarea value={localTexts["hero.description"] ?? ""} onChange={(e) => handleUpdateText('hero.description', e.target.value)} className="h-24 resize-none" />
                  </div>
                </div>
                <div className="space-y-4 border-b pb-6">
                  <h3 className="font-bold text-lg text-primary">הוכחה חברתית</h3>
                  <div className="space-y-2">
                    <Label>כותרת המלצות</Label>
                    <Input value={localTexts["trust.testimonialsTitle"] ?? ""} onChange={(e) => handleUpdateText('trust.testimonialsTitle', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-4 border-b pb-6">
                  <h3 className="font-bold text-lg text-primary">שירותים</h3>
                  <div className="space-y-2">
                    <Label>כותרת ראשית</Label>
                    <Input value={localTexts["services.title"] ?? ""} onChange={(e) => handleUpdateText('services.title', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>כותרת משנית</Label>
                    <Input value={localTexts["services.description"] ?? ""} onChange={(e) => handleUpdateText('services.description', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-4 border-b pb-6">
                  <h3 className="font-bold text-lg text-primary">למה אנחנו</h3>
                  <div className="space-y-2">
                    <Label>כותרת ראשית</Label>
                    <Input value={localTexts["benefits.title"] ?? ""} onChange={(e) => handleUpdateText('benefits.title', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>כותרת משנית</Label>
                    <Textarea value={localTexts["benefits.description"] ?? ""} onChange={(e) => handleUpdateText('benefits.description', e.target.value)} className="h-20 resize-none" />
                  </div>
                </div>
                <div className="space-y-4 border-b pb-6">
                  <h3 className="font-bold text-lg text-primary">גלריה</h3>
                  <div className="space-y-2">
                    <Label>כותרת ראשית לגלריה</Label>
                    <Input value={localTexts["gallery.title"] ?? ""} onChange={(e) => handleUpdateText('gallery.title', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-primary">יצירת קשר</h3>
                  <div className="space-y-2">
                    <Label>כותרת</Label>
                    <Input value={localTexts["contact.title"] ?? ""} onChange={(e) => handleUpdateText('contact.title', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>תת כותרת</Label>
                    <Input value={localTexts["contact.subtitle"] ?? ""} onChange={(e) => handleUpdateText('contact.subtitle', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === IMAGE SLOTS TAB === */}
          <TabsContent value="images" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>ניהול תמונות ראשיות</CardTitle>
                    <CardDescription>החלפת התמונות הראשיות באתר. ערכי תיאורים ולחצי "שמור שינויים".</CardDescription>
                  </div>
                  <Button onClick={handleSaveSlotAlts} disabled={!hasSlotAltChanges || slotAltSaveMutation.isPending} className="gap-2 shrink-0" data-testid="btn-save-slots">
                    <Save size={16} />
                    {slotAltSaveMutation.isPending ? "שומר..." : "שמור שינויים"}
                  </Button>
                </div>
                {hasSlotAltChanges && (
                  <div className="mt-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    יש שינויים בתיאורים שלא נשמרו - לחצי על "שמור שינויים" לשמירה.
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(content.images).map(([key, slot]) => (
                  <Card key={key} className="p-4 flex flex-col md:flex-row items-start md:items-center gap-6 bg-background border-border/50">
                    <div className="relative group w-32 h-32 rounded-lg overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
                      <img src={slot.url} alt={slot.alt} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="secondary" onClick={() => triggerUpload(key)}>החלף</Button>
                      </div>
                    </div>
                    <div className="flex-grow space-y-4 w-full">
                      <div>
                        <h4 className="font-bold text-lg">{key}</h4>
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md inline-block mt-1">
                          יחס אידאלי: {slot.aspectRatioLabel}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">טקסט חלופי (Alt)</Label>
                        <Input
                          value={localSlotAlts[key] ?? slot.alt}
                          onChange={(e) => setLocalSlotAlts(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder="תיאור התמונה לנגישות"
                          className="bg-white"
                        />
                      </div>
                    </div>
                    <div className="w-full md:w-auto mt-2 md:mt-0 flex md:block">
                      <Button className="w-full md:w-auto gap-2" onClick={() => triggerUpload(key)}>
                        <UploadCloud size={16} />
                        העלה חדש
                      </Button>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === GALLERY TAB === */}
          <TabsContent value="gallery" className="mt-6 space-y-6">
            <Card className="border-dashed bg-white/50">
              <CardContent className="pt-6 flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ImagePlus size={48} className="mb-4 opacity-50" />
                {content.gallery.images.length >= MAX_GALLERY_IMAGES ? (
                  <>
                    <p>הגלריה מלאה ({MAX_GALLERY_IMAGES} תמונות מקסימום)</p>
                    <p className="text-sm mt-1">העלאת תמונה חדשה תדרוש בחירת תמונה להחלפה</p>
                  </>
                ) : (
                  <p>לחצי להוספת תמונה לגלריה ({content.gallery.images.length}/{MAX_GALLERY_IMAGES})</p>
                )}
                <Button
                  className="mt-4"
                  variant="secondary"
                  onClick={() => galleryFileInputRef.current?.click()}
                  disabled={galleryUploadMutation.isPending || galleryReplaceMutation.isPending}
                >
                  {galleryUploadMutation.isPending || galleryReplaceMutation.isPending ? "מעלה..." : "בחר תמונה"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold font-heading">תמונות קיימות בגלריה ({content.gallery.images.length}/{MAX_GALLERY_IMAGES})</h2>
                  <Button onClick={handleSaveGalleryAlts} disabled={!hasGalleryAltChanges || galleryAltSaveMutation.isPending} className="gap-2 shrink-0" data-testid="btn-save-gallery">
                    <Save size={16} />
                    {galleryAltSaveMutation.isPending ? "שומר..." : "שמור שינויים"}
                  </Button>
                </div>
                {hasGalleryAltChanges && (
                  <div className="mt-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    יש שינויים בתיאורים שלא נשמרו - לחצי על "שמור שינויים" לשמירה.
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {content.gallery.images.map((img) => (
                  <Card key={img.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white">
                    <div className="cursor-grab text-muted-foreground hover:text-foreground hidden sm:block">
                      <GripVertical />
                    </div>
                    <img src={img.url} alt={img.alt} className="w-20 h-20 object-cover rounded-md" />
                    <div className="flex-grow w-full sm:w-auto">
                      <Label className="text-xs mb-1 block text-muted-foreground">טקסט חלופי (Alt)</Label>
                      <Input
                        value={localGalleryAlts[img.id] ?? img.alt}
                        onChange={(e) => setLocalGalleryAlts(prev => ({ ...prev, [img.id]: e.target.value }))}
                        placeholder="טקסט חלופי (Alt)"
                        className="w-full bg-transparent"
                      />
                    </div>
                    <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive self-end sm:self-auto" size="icon" onClick={() => galleryDeleteMutation.mutate(img.id)} data-testid={`btn-delete-img-${img.id}`}>
                      <Trash2 size={18} />
                    </Button>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === SETTINGS TAB === */}
          <TabsContent value="settings" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>שינוי סיסמת מנהל</CardTitle>
                <CardDescription>מומלץ לבחור סיסמה חזקה שקל לזכור.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                  <div className="space-y-2">
                    <Label>סיסמה נוכחית</Label>
                    <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>סיסמה חדשה</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>אימות סיסמה חדשה</Label>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} dir="ltr" />
                  </div>
                  <Button type="submit" className="w-full" disabled={!currentPassword || !newPassword || !confirmPassword || passwordMutation.isPending}>
                    {passwordMutation.isPending ? "שומר..." : "שמור סיסמה"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Save text confirmation */}
      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>שמירת שינויים</AlertDialogTitle>
            <AlertDialogDescription>האם את בטוחה שאת רוצה לשמור את השינויים?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:flex-row-reverse">
            <AlertDialogAction onClick={confirmSaveTexts} data-testid="btn-confirm-save">כן, שמור</AlertDialogAction>
            <AlertDialogCancel data-testid="btn-cancel-save">לא, בטל</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save gallery alts confirmation */}
      <AlertDialog open={showGallerySaveConfirm} onOpenChange={setShowGallerySaveConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>שמירת שינויים</AlertDialogTitle>
            <AlertDialogDescription>האם את בטוחה שאת רוצה לשמור את השינויים בתיאורי הגלריה?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:flex-row-reverse">
            <AlertDialogAction onClick={confirmSaveGalleryAlts} data-testid="btn-confirm-gallery-save">כן, שמור</AlertDialogAction>
            <AlertDialogCancel data-testid="btn-cancel-gallery-save">לא, בטל</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save slot alts confirmation */}
      <AlertDialog open={showSlotSaveConfirm} onOpenChange={setShowSlotSaveConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>שמירת שינויים</AlertDialogTitle>
            <AlertDialogDescription>האם את בטוחה שאת רוצה לשמור את השינויים בתיאורי התמונות?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:flex-row-reverse">
            <AlertDialogAction onClick={confirmSaveSlotAlts} data-testid="btn-confirm-slot-save">כן, שמור</AlertDialogAction>
            <AlertDialogCancel data-testid="btn-cancel-slot-save">לא, בטל</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image slot replace confirmation */}
      <AlertDialog open={showImageConfirm} onOpenChange={(open) => { if (!open) cleanupImageConfirm(); }}>
        <AlertDialogContent dir="rtl" className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>החלפת תמונה</AlertDialogTitle>
            <AlertDialogDescription>האם ברצונך להחליף את התמונה הנוכחית בתמונה החדשה?</AlertDialogDescription>
          </AlertDialogHeader>
          {pendingImagePreview && (
            <div className="flex justify-center my-4">
              <div className="w-48 h-48 rounded-lg overflow-hidden border border-border shadow-sm">
                <img src={pendingImagePreview} alt="תצוגה מקדימה" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
          <AlertDialogFooter className="flex gap-2 sm:flex-row-reverse">
            <AlertDialogAction onClick={confirmImageUpload} data-testid="btn-confirm-image">כן, החלף</AlertDialogAction>
            <AlertDialogCancel onClick={cleanupImageConfirm} data-testid="btn-cancel-image">לא, בטל</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Gallery add confirmation (under limit) */}
      <AlertDialog open={showGalleryConfirm} onOpenChange={(open) => { if (!open) cleanupGalleryConfirm(); }}>
        <AlertDialogContent dir="rtl" className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>הוספת תמונה לגלריה</AlertDialogTitle>
            <AlertDialogDescription>האם ברצונך להוסיף את התמונה הזו לגלריה?</AlertDialogDescription>
          </AlertDialogHeader>
          {pendingGalleryPreview && (
            <div className="flex justify-center my-4">
              <div className="w-48 h-48 rounded-lg overflow-hidden border border-border shadow-sm">
                <img src={pendingGalleryPreview} alt="תצוגה מקדימה" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
          <AlertDialogFooter className="flex gap-2 sm:flex-row-reverse">
            <AlertDialogAction onClick={confirmGalleryUpload} data-testid="btn-confirm-gallery">כן, הוסף</AlertDialogAction>
            <AlertDialogCancel onClick={cleanupGalleryConfirm} data-testid="btn-cancel-gallery">לא, בטל</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Gallery replace picker (at limit) */}
      <AlertDialog open={showGalleryReplaceDialog} onOpenChange={(open) => { if (!open) cleanupGalleryConfirm(); }}>
        <AlertDialogContent dir="rtl" className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>הגלריה מלאה - בחרי תמונה להחלפה</AlertDialogTitle>
            <AlertDialogDescription>
              יש כבר {MAX_GALLERY_IMAGES} תמונות בגלריה. בחרי איזו תמונה להחליף בתמונה החדשה:
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingGalleryPreview && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2 text-muted-foreground">התמונה החדשה:</p>
              <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-primary shadow-sm mx-auto">
                <img src={pendingGalleryPreview} alt="תמונה חדשה" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 my-2">
            {content.gallery.images.map((img) => (
              <button
                key={img.id}
                onClick={() => setReplaceTargetId(img.id)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-square ${
                  replaceTargetId === img.id
                    ? "border-primary ring-2 ring-primary/30 scale-105"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                {replaceTargetId === img.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="bg-primary text-white text-xs px-2 py-1 rounded-md">נבחר</div>
                  </div>
                )}
              </button>
            ))}
          </div>
          <AlertDialogFooter className="flex gap-2 sm:flex-row-reverse">
            <AlertDialogAction onClick={confirmGalleryReplace} disabled={replaceTargetId === null} data-testid="btn-confirm-replace">
              כן, החלף
            </AlertDialogAction>
            <AlertDialogCancel onClick={cleanupGalleryConfirm} data-testid="btn-cancel-replace">לא, בטל</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
