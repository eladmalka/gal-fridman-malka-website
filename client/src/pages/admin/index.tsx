import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ImagePlus, Trash2, GripVertical, LogOut, Check } from "lucide-react";
import { useContent } from "@/lib/content-context";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { content, setContent, adminPassword, setAdminPassword } = useContent();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === adminPassword) {
      setIsLoggedIn(true);
    } else {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "סיסמה שגויה.",
      });
    }
  };

  const handleUpdateText = (section: keyof typeof content, field: string, value: string) => {
    setContent({
      ...content,
      [section]: {
        ...content[section],
        [field]: value
      }
    });
  };

  const deleteImage = (id: number) => {
    setContent({
      ...content,
      gallery: {
        ...content.gallery,
        images: content.gallery.images.filter(img => img.id !== id)
      }
    });
  };

  const handleUpdateImageAlt = (id: number, alt: string) => {
    setContent({
      ...content,
      gallery: {
        ...content.gallery,
        images: content.gallery.images.map(img => 
          img.id === id ? { ...img, alt } : img
        )
      }
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "הסיסמאות אינן תואמות.",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "הסיסמה צריכה להכיל לפחות 6 תווים.",
      });
      return;
    }
    setAdminPassword(newPassword);
    setNewPassword("");
    setConfirmPassword("");
    toast({
      title: "הסיסמה שונתה בהצלחה",
    });
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
              <Button type="submit" className="w-full" data-testid="btn-admin-login">היכנס</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-heading">לוח בקרה</h1>
          <Button variant="outline" onClick={() => setIsLoggedIn(false)} data-testid="btn-admin-logout" className="gap-2">
            <LogOut size={16} />
            התנתק
          </Button>
        </div>
        
        <Tabs defaultValue="texts" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-white shadow-sm border border-border/50">
            <TabsTrigger value="texts" className="h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">ניהול תוכן</TabsTrigger>
            <TabsTrigger value="gallery" className="h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">הגלריה</TabsTrigger>
            <TabsTrigger value="settings" className="h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">הגדרות</TabsTrigger>
          </TabsList>
          
          <TabsContent value="texts" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>עריכת טקסטים - עמוד הבית</CardTitle>
                <CardDescription>השינויים יישמרו וישתקפו באתר מיד.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 border-b pb-6">
                  <h3 className="font-bold text-lg text-primary">אזור ראשי (Hero)</h3>
                  <div className="space-y-2">
                    <Label>תגית עליונה</Label>
                    <Input value={content.hero.badge} onChange={(e) => handleUpdateText('hero', 'badge', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>כותרת ראשית</Label>
                    <Input value={content.hero.titleMain} onChange={(e) => handleUpdateText('hero', 'titleMain', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>תת כותרת</Label>
                    <Input value={content.hero.titleSub} onChange={(e) => handleUpdateText('hero', 'titleSub', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>תיאור</Label>
                    <Textarea value={content.hero.description} onChange={(e) => handleUpdateText('hero', 'description', e.target.value)} className="h-24 resize-none" />
                  </div>
                </div>

                <div className="space-y-4 border-b pb-6">
                  <h3 className="font-bold text-lg text-primary">הוכחה חברתית</h3>
                  <div className="space-y-2">
                    <Label>כותרת המלצות</Label>
                    <Input value={content.trust.testimonialsTitle} onChange={(e) => handleUpdateText('trust', 'testimonialsTitle', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-4 border-b pb-6">
                  <h3 className="font-bold text-lg text-primary">שירותים</h3>
                  <div className="space-y-2">
                    <Label>כותרת ראשית</Label>
                    <Input value={content.services.title} onChange={(e) => handleUpdateText('services', 'title', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>כותרת משנית</Label>
                    <Input value={content.services.description} onChange={(e) => handleUpdateText('services', 'description', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-4 border-b pb-6">
                  <h3 className="font-bold text-lg text-primary">למה אנחנו</h3>
                  <div className="space-y-2">
                    <Label>כותרת ראשית</Label>
                    <Input value={content.benefits.title} onChange={(e) => handleUpdateText('benefits', 'title', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>כותרת משנית</Label>
                    <Textarea value={content.benefits.description} onChange={(e) => handleUpdateText('benefits', 'description', e.target.value)} className="h-20 resize-none"/>
                  </div>
                </div>
                
                <div className="space-y-4 border-b pb-6">
                  <h3 className="font-bold text-lg text-primary">גלריה</h3>
                  <div className="space-y-2">
                    <Label>כותרת ראשה לגלריה</Label>
                    <Input value={content.gallery.title} onChange={(e) => handleUpdateText('gallery', 'title', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-primary">יצירת קשר</h3>
                  <div className="space-y-2">
                    <Label>כותרת</Label>
                    <Input value={content.contact.title} onChange={(e) => handleUpdateText('contact', 'title', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>תת כותרת</Label>
                    <Input value={content.contact.subtitle} onChange={(e) => handleUpdateText('contact', 'subtitle', e.target.value)} />
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="gallery" className="mt-6 space-y-6">
            <Card className="border-dashed bg-white/50">
              <CardContent className="pt-6 flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ImagePlus size={48} className="mb-4 opacity-50" />
                <p>גרור לכאן תמונות או לחץ להעלאה</p>
                <p className="text-sm mt-2 opacity-70">(ממשק דמו - ללא העלאה אמיתית לשרת)</p>
                <Button className="mt-4" variant="secondary">בחר תמונה</Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4 font-heading">תמונות קיימות ({content.gallery.images.length})</h2>
              {content.gallery.images.map((img) => (
                <Card key={img.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white">
                  <div className="cursor-grab text-muted-foreground hover:text-foreground hidden sm:block">
                    <GripVertical />
                  </div>
                  <img src={img.url} alt={img.alt} className="w-20 h-20 object-cover rounded-md" />
                  <div className="flex-grow w-full sm:w-auto">
                    <Label className="text-xs mb-1 block text-muted-foreground">טקסט חלופי (Alt)</Label>
                    <Input 
                      value={img.alt} 
                      onChange={(e) => handleUpdateImageAlt(img.id, e.target.value)}
                      placeholder="טקסט חלופי (Alt)" 
                      className="w-full bg-transparent" 
                    />
                  </div>
                  <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive self-end sm:self-auto" size="icon" onClick={() => deleteImage(img.id)} data-testid={`btn-delete-img-${img.id}`}>
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
                  <Button type="submit" className="w-full" disabled={!newPassword || !confirmPassword}>
                    שמור סיסמה
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}