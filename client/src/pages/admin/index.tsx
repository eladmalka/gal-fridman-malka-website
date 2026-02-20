import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePlus, Trash2, GripVertical, LogOut } from "lucide-react";
import img1 from "@/assets/images/gallery-1.jpg";
import img2 from "@/assets/images/gallery-2.jpg";

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  
  const [images, setImages] = useState([
    { id: 1, url: img1, alt: "קליניקה" },
    { id: 2, url: img2, alt: "אווירה" },
  ]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") { // Mock password check
      setIsLoggedIn(true);
    } else {
      alert("סיסמה שגויה (רמז: admin123)");
    }
  };

  const deleteImage = (id: number) => {
    setImages(images.filter(img => img.id !== id));
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
    <div className="min-h-screen bg-background p-8 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-heading">ניהול גלריה</h1>
          <Button variant="outline" onClick={() => setIsLoggedIn(false)} data-testid="btn-admin-logout" className="gap-2">
            <LogOut size={16} />
            התנתק
          </Button>
        </div>
        
        <Card className="mb-8 border-dashed bg-white/50">
          <CardContent className="pt-6 flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ImagePlus size={48} className="mb-4 opacity-50" />
            <p>גרור לכאן תמונות או לחץ להעלאה</p>
            <p className="text-sm mt-2 opacity-70">(ממשק דמו - ללא שמירה בשרת)</p>
            <Button className="mt-4" variant="secondary">בחר תמונה</Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4 font-heading">תמונות קיימות ({images.length})</h2>
          {images.map((img) => (
            <Card key={img.id} className="p-4 flex items-center gap-4 bg-white">
              <div className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical />
              </div>
              <img src={img.url} alt={img.alt} className="w-20 h-20 object-cover rounded-md" />
              <div className="flex-grow">
                <Input defaultValue={img.alt} placeholder="טקסט חלופי (Alt)" className="max-w-md bg-transparent" />
              </div>
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" size="icon" onClick={() => deleteImage(img.id)} data-testid={`btn-delete-img-${img.id}`}>
                <Trash2 size={18} />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}