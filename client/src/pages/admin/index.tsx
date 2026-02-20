import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ImagePlus, Trash2, GripVertical, LogOut, UploadCloud, Save, Bell, BellRing, User, Phone, Mail, Target, Heart, Eye, X } from "lucide-react";
import { useContent, useRefetchContent } from "@/lib/content-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Lead } from "@shared/schema";

const MAX_GALLERY_IMAGES = 5;
const POLL_INTERVAL = 15000;

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523, now);
    osc1.frequency.setValueAtTime(659, now + 0.15);
    osc1.frequency.setValueAtTime(784, now + 0.3);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(523 * 2, now);
    osc2.frequency.setValueAtTime(659 * 2, now + 0.15);
    osc2.frequency.setValueAtTime(784 * 2, now + 0.3);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
    setTimeout(() => ctx.close(), 1000);
  } catch {}
}

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

  const [showNewLeadPopup, setShowNewLeadPopup] = useState(false);
  const [newLeadPopupData, setNewLeadPopupData] = useState<Lead | null>(null);
  const lastKnownCountRef = useRef<number | null>(null);

  const { data: leadsData, refetch: refetchLeads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    queryFn: async () => {
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isLoggedIn,
    refetchInterval: POLL_INTERVAL,
  });

  const { data: unseenData } = useQuery<{ count: number }>({
    queryKey: ["/api/leads/unseen-count"],
    queryFn: async () => {
      const res = await fetch("/api/leads/unseen-count");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isLoggedIn,
    refetchInterval: POLL_INTERVAL,
  });

  const unseenCount = unseenData?.count ?? 0;

  useEffect(() => {
    if (lastKnownCountRef.current === null) {
      lastKnownCountRef.current = unseenCount;
      return;
    }
    if (unseenCount > lastKnownCountRef.current && leadsData && leadsData.length > 0) {
      const newest = leadsData.find(l => !l.seen);
      if (newest) {
        setNewLeadPopupData(newest);
        setShowNewLeadPopup(true);
        playNotificationSound();
      }
    }
    lastKnownCountRef.current = unseenCount;
  }, [unseenCount, leadsData]);

  const markSeenMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await apiRequest("POST", "/api/leads/mark-seen", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/unseen-count"] });
    },
  });

  const handleMarkAllSeen = () => {
    if (leadsData) {
      const unseenIds = leadsData.filter(l => !l.seen).map(l => l.id);
      if (unseenIds.length > 0) {
        markSeenMutation.mutate(unseenIds);
      }
    }
  };

  const [showTrash, setShowTrash] = useState(false);
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);
  const [trashTargetId, setTrashTargetId] = useState<number | null>(null);
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState(false);
  const [permanentDeleteTargetId, setPermanentDeleteTargetId] = useState<number | null>(null);

  const { data: trashedLeads, refetch: refetchTrash } = useQuery<Lead[]>({
    queryKey: ["/api/leads/trash"],
    queryFn: async () => {
      const res = await fetch("/api/leads/trash");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isLoggedIn && showTrash,
  });

  const trashMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/leads/${id}/trash`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/unseen-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/trash"] });
      toast({ title: "הפנייה הועברה לפח" });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/leads/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/unseen-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/trash"] });
      toast({ title: "הפנייה שוחזרה בהצלחה" });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads/trash"] });
      toast({ title: "הפנייה נמחקה לצמיתות" });
    },
  });

  const handleTrashLead = (id: number) => {
    setTrashTargetId(id);
    setShowTrashConfirm(true);
  };

  const confirmTrashLead = () => {
    if (trashTargetId !== null) {
      trashMutation.mutate(trashTargetId);
    }
    setShowTrashConfirm(false);
    setTrashTargetId(null);
  };

  const handlePermanentDelete = (id: number) => {
    setPermanentDeleteTargetId(id);
    setShowPermanentDeleteConfirm(true);
  };

  const confirmPermanentDelete = () => {
    if (permanentDeleteTargetId !== null) {
      permanentDeleteMutation.mutate(permanentDeleteTargetId);
    }
    setShowPermanentDeleteConfirm(false);
    setPermanentDeleteTargetId(null);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getDaysUntilDeletion = (deletedAt: string | Date | null) => {
    if (!deletedAt) return 30;
    const deleted = new Date(deletedAt).getTime();
    const now = Date.now();
    const daysElapsed = Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - daysElapsed);
  };

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

        <Tabs defaultValue="leads" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-5 h-14 bg-white shadow-sm border border-border/50">
            <TabsTrigger value="leads" className="h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary relative" data-testid="tab-leads">
              פניות
              {unseenCount > 0 && (
                <Badge className="absolute -top-1 -left-1 h-5 min-w-5 flex items-center justify-center text-[10px] bg-red-500 text-white rounded-full px-1 animate-pulse">
                  {unseenCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="texts" className="h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">תוכן</TabsTrigger>
            <TabsTrigger value="images" className="h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">תמונות</TabsTrigger>
            <TabsTrigger value="gallery" className="h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">גלריה</TabsTrigger>
            <TabsTrigger value="settings" className="h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">הגדרות</TabsTrigger>
          </TabsList>

          {/* === LEADS TAB === */}
          <TabsContent value="leads" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell size={20} />
                      פניות מהאתר
                    </CardTitle>
                    <CardDescription>כל הפניות שהגיעו מטופס יצירת הקשר באתר.</CardDescription>
                  </div>
                  {unseenCount > 0 && (
                    <Button variant="outline" size="sm" onClick={handleMarkAllSeen} disabled={markSeenMutation.isPending} className="gap-2" data-testid="btn-mark-all-seen">
                      <Eye size={14} />
                      סמן הכל כנקרא ({unseenCount})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!leadsData || leadsData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail size={48} className="mx-auto mb-4 opacity-30" />
                    <p>אין פניות עדיין</p>
                    <p className="text-sm mt-1">פניות חדשות מטופס האתר יופיעו כאן</p>
                  </div>
                ) : (
                  leadsData.map((lead) => (
                    <Card key={lead.id} className={`p-5 transition-all ${!lead.seen ? "border-primary/40 bg-primary/5 shadow-md" : "bg-white border-border/50"}`} data-testid={`card-lead-${lead.id}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-grow space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-bold text-lg">{lead.name}</h3>
                            {!lead.seen && (
                              <Badge className="bg-primary text-white text-[10px] px-2 py-0.5">חדש</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(lead.createdAt)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone size={14} className="shrink-0" />
                              <a href={`tel:${lead.phone}`} className="hover:text-primary transition-colors" dir="ltr">{lead.phone}</a>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail size={14} className="shrink-0" />
                              <a href={`mailto:${lead.email}`} className="hover:text-primary transition-colors">{lead.email}</a>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Heart size={14} className="shrink-0" />
                              <span>{lead.status}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Target size={14} className="shrink-0" />
                              <span>{lead.goals}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          {!lead.seen && (
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => markSeenMutation.mutate([lead.id])} title="סמן כנקרא" data-testid={`btn-mark-seen-${lead.id}`}>
                              <Eye size={18} />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleTrashLead(lead.id)} title="העבר לפח" data-testid={`btn-trash-lead-${lead.id}`}>
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Trash Section */}
            <Card className="border-dashed">
              <CardHeader className="cursor-pointer" onClick={() => setShowTrash(!showTrash)}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-muted-foreground text-base">
                    <Trash2 size={18} />
                    פח אשפה
                    {trashedLeads && trashedLeads.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{trashedLeads.length}</Badge>
                    )}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {showTrash ? "הסתר" : "הצג"} | פניות נמחקות אוטומטית לאחר 30 יום
                  </span>
                </div>
              </CardHeader>
              {showTrash && (
                <CardContent className="space-y-4">
                  {!trashedLeads || trashedLeads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trash2 size={36} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm">הפח ריק</p>
                    </div>
                  ) : (
                    trashedLeads.map((lead) => (
                      <Card key={lead.id} className="p-4 bg-muted/30 border-border/30" data-testid={`card-trashed-${lead.id}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-grow space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-medium">{lead.name}</h3>
                              <span className="text-xs text-muted-foreground">{formatDate(lead.createdAt)}</span>
                              <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                                יימחק בעוד {getDaysUntilDeletion(lead.deletedAt)} ימים
                              </Badge>
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>{lead.phone}</span>
                              <span>{lead.email}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 gap-1" onClick={() => restoreMutation.mutate(lead.id)} data-testid={`btn-restore-${lead.id}`}>
                              <UploadCloud size={14} />
                              שחזר
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 gap-1" onClick={() => handlePermanentDelete(lead.id)} data-testid={`btn-perm-delete-${lead.id}`}>
                              <X size={14} />
                              מחק לצמיתות
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </CardContent>
              )}
            </Card>
          </TabsContent>

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

      {/* Trash lead confirmation */}
      <AlertDialog open={showTrashConfirm} onOpenChange={setShowTrashConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>העברה לפח אשפה</AlertDialogTitle>
            <AlertDialogDescription>האם את בטוחה שאת רוצה להעביר את הפנייה הזו לפח? ניתן לשחזר אותה תוך 30 יום.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:flex-row-reverse">
            <AlertDialogAction onClick={confirmTrashLead} className="bg-destructive hover:bg-destructive/90" data-testid="btn-confirm-trash">כן, העבר לפח</AlertDialogAction>
            <AlertDialogCancel data-testid="btn-cancel-trash">לא, בטל</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent delete confirmation */}
      <AlertDialog open={showPermanentDeleteConfirm} onOpenChange={setShowPermanentDeleteConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקה לצמיתות</AlertDialogTitle>
            <AlertDialogDescription>פעולה זו בלתי הפיכה! הפנייה תימחק לצמיתות ולא ניתן יהיה לשחזר אותה.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:flex-row-reverse">
            <AlertDialogAction onClick={confirmPermanentDelete} className="bg-destructive hover:bg-destructive/90" data-testid="btn-confirm-perm-delete">כן, מחק לצמיתות</AlertDialogAction>
            <AlertDialogCancel data-testid="btn-cancel-perm-delete">לא, בטל</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Lead Notification Popup */}
      {showNewLeadPopup && newLeadPopupData && (
        <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-4 duration-500" dir="rtl" data-testid="popup-new-lead">
          <Card className="w-80 border-primary/30 shadow-xl bg-white overflow-hidden">
            <div className="bg-primary/10 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold">
                <BellRing size={18} className="animate-bounce" />
                פנייה חדשה!
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNewLeadPopup(false)} data-testid="btn-close-popup">
                <X size={14} />
              </Button>
            </div>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User size={14} className="text-muted-foreground shrink-0" />
                <span className="font-medium">{newLeadPopupData.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={14} className="shrink-0" />
                <span dir="ltr">{newLeadPopupData.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={14} className="shrink-0" />
                <span>{newLeadPopupData.email}</span>
              </div>
              <div className="pt-2 flex gap-2">
                <Button size="sm" className="flex-1 gap-1" onClick={() => { setShowNewLeadPopup(false); markSeenMutation.mutate([newLeadPopupData.id]); }} data-testid="btn-popup-seen">
                  <Eye size={14} />
                  סמן כנקרא
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowNewLeadPopup(false)} data-testid="btn-popup-dismiss">
                  סגור
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
