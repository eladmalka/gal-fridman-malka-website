import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ImagePlus, Trash2, GripVertical, LogOut, Check, UploadCloud, Save } from "lucide-react";
import { useContent, useRefetchContent } from "@/lib/content-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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

  const [localTexts, setLocalTexts] = useState<Record<string, string>>({});
  const [savedTexts, setSavedTexts] = useState<Record<string, string>>({});
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

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

  const hasTextChanges = Object.keys(localTexts).some(
    key => localTexts[key] !== savedTexts[key]
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

  const handleSaveTexts = () => {
    setShowSaveConfirm(true);
  };

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

  const loginMutation = useMutation({
    mutationFn: async (pw: string) => {
      await apiRequest("POST", "/api/admin/login", { password: pw });
    },
    onSuccess: () => {
      setIsLoggedIn(true);
      setPassword("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "סיסמה שגויה.",
      });
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
      toast({
        title: "התמונה הוחלפה בהצלחה",
        description: "השינוי יעודכן באתר מיד.",
      });
    },
    onError: () => {
      toast({ variant: "destructive", title: "שגיאה", description: "העלאת התמונה נכשלה." });
    },
  });

  const imageSlotAltMutation = useMutation({
    mutationFn: async ({ slotKey, alt }: { slotKey: string; alt: string }) => {
      await apiRequest("PUT", `/api/image-slots/${slotKey}`, { alt });
    },
    onSuccess: () => {
      refetchContent();
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

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingGalleryFile(file);
      setPendingGalleryPreview(URL.createObjectURL(file));
      setShowGalleryConfirm(true);
    }
    if (e.target) e.target.value = "";
  };

  const confirmGalleryUpload = () => {
    if (pendingGalleryFile) {
      galleryUploadMutation.mutate(pendingGalleryFile);
    }
    cleanupGalleryConfirm();
  };

  const cleanupGalleryConfirm = () => {
    setShowGalleryConfirm(false);
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

  const galleryAltMutation = useMutation({
    mutationFn: async ({ id, alt }: { id: number; alt: string }) => {
      await apiRequest("PUT", `/api/gallery/${id}`, { alt });
    },
    onSuccess: () => {
      refetchContent();
    },
  });

  const galleryAltDebounceRef = useRef<Record<number, NodeJS.Timeout>>({});

  const handleUpdateGalleryImageAlt = (id: number, alt: string) => {
    if (galleryAltDebounceRef.current[id]) {
      clearTimeout(galleryAltDebounceRef.current[id]);
    }
    galleryAltDebounceRef.current[id] = setTimeout(() => {
      galleryAltMutation.mutate({ id, alt });
    }, 800);
  };

  const imageSlotAltDebounceRef = useRef<Record<string, NodeJS.Timeout>>({});

  const handleUpdateImageSlotAlt = (key: string, alt: string) => {
    if (imageSlotAltDebounceRef.current[key]) {
      clearTimeout(imageSlotAltDebounceRef.current[key]);
    }
    imageSlotAltDebounceRef.current[key] = setTimeout(() => {
      imageSlotAltMutation.mutate({ slotKey: key, alt });
    }, 800);
  };

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
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "הסיסמאות החדשות אינן תואמות.",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "הסיסמה החדשה צריכה להכיל לפחות 6 תווים.",
      });
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
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={galleryFileInputRef} 
        onChange={handleGalleryUpload} 
        accept="image/*" 
        className="hidden" 
      />
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
          
          <TabsContent value="texts" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>עריכת טקסטים - עמוד הבית</CardTitle>
                    <CardDescription>ערכי את הטקסטים ולחצי על "שמור שינויים" כשסיימת.</CardDescription>
                  </div>
                  <Button 
                    onClick={handleSaveTexts} 
                    disabled={!hasTextChanges || textMutation.isPending}
                    className="gap-2 shrink-0"
                    data-testid="btn-save-texts"
                  >
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
                    <Textarea value={localTexts["benefits.description"] ?? ""} onChange={(e) => handleUpdateText('benefits.description', e.target.value)} className="h-20 resize-none"/>
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
          
          <TabsContent value="images" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ניהול חריצי תמונות (Image Slots)</CardTitle>
                <CardDescription>החלפת התמונות הראשיות באתר (אזור Hero ואזורים נוספים).</CardDescription>
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
                          defaultValue={slot.alt} 
                          onChange={(e) => handleUpdateImageSlotAlt(key, e.target.value)}
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

          <TabsContent value="gallery" className="mt-6 space-y-6">
            <Card className="border-dashed bg-white/50">
              <CardContent className="pt-6 flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ImagePlus size={48} className="mb-4 opacity-50" />
                <p>גרור לכאן תמונות או לחץ להעלאה</p>
                <Button 
                  className="mt-4" 
                  variant="secondary" 
                  onClick={() => galleryFileInputRef.current?.click()}
                  disabled={galleryUploadMutation.isPending}
                >
                  {galleryUploadMutation.isPending ? "מעלה..." : "בחר תמונה"}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4 font-heading">תמונות קיימות בגלריה ({content.gallery.images.length})</h2>
              {content.gallery.images.map((img) => (
                <Card key={img.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white">
                  <div className="cursor-grab text-muted-foreground hover:text-foreground hidden sm:block">
                    <GripVertical />
                  </div>
                  <img src={img.url} alt={img.alt} className="w-20 h-20 object-cover rounded-md" />
                  <div className="flex-grow w-full sm:w-auto">
                    <Label className="text-xs mb-1 block text-muted-foreground">טקסט חלופי (Alt)</Label>
                    <Input 
                      defaultValue={img.alt} 
                      onChange={(e) => handleUpdateGalleryImageAlt(img.id, e.target.value)}
                      placeholder="טקסט חלופי (Alt)" 
                      className="w-full bg-transparent" 
                    />
                  </div>
                  <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive self-end sm:self-auto" size="icon" onClick={() => galleryDeleteMutation.mutate(img.id)} data-testid={`btn-delete-img-${img.id}`}>
                    <Trash2 size={18} />
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
          
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
                    <Input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>סיסמה חדשה</Label>
                    <Input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>אימות סיסמה חדשה</Label>
                    <Input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      dir="ltr"
                    />
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

      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>שמירת שינויים</AlertDialogTitle>
            <AlertDialogDescription>
              האם את בטוחה שאת רוצה לשמור את השינויים?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:flex-row-reverse">
            <AlertDialogAction onClick={confirmSaveTexts} data-testid="btn-confirm-save">
              כן, שמור
            </AlertDialogAction>
            <AlertDialogCancel data-testid="btn-cancel-save">
              לא, בטל
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showImageConfirm} onOpenChange={(open) => { if (!open) cleanupImageConfirm(); }}>
        <AlertDialogContent dir="rtl" className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>החלפת תמונה</AlertDialogTitle>
            <AlertDialogDescription>
              האם ברצונך להחליף את התמונה הנוכחית בתמונה החדשה?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingImagePreview && (
            <div className="flex justify-center my-4">
              <div className="w-48 h-48 rounded-lg overflow-hidden border border-border shadow-sm">
                <img src={pendingImagePreview} alt="תצוגה מקדימה" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
          <AlertDialogFooter className="flex gap-2 sm:flex-row-reverse">
            <AlertDialogAction onClick={confirmImageUpload} data-testid="btn-confirm-image">
              כן, החלף
            </AlertDialogAction>
            <AlertDialogCancel onClick={cleanupImageConfirm} data-testid="btn-cancel-image">
              לא, בטל
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showGalleryConfirm} onOpenChange={(open) => { if (!open) cleanupGalleryConfirm(); }}>
        <AlertDialogContent dir="rtl" className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>הוספת תמונה לגלריה</AlertDialogTitle>
            <AlertDialogDescription>
              האם ברצונך להוסיף את התמונה הזו לגלריה?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingGalleryPreview && (
            <div className="flex justify-center my-4">
              <div className="w-48 h-48 rounded-lg overflow-hidden border border-border shadow-sm">
                <img src={pendingGalleryPreview} alt="תצוגה מקדימה" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
          <AlertDialogFooter className="flex gap-2 sm:flex-row-reverse">
            <AlertDialogAction onClick={confirmGalleryUpload} data-testid="btn-confirm-gallery">
              כן, הוסף
            </AlertDialogAction>
            <AlertDialogCancel onClick={cleanupGalleryConfirm} data-testid="btn-cancel-gallery">
              לא, בטל
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
