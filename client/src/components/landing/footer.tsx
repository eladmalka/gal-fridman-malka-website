export function Footer() {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container px-4 text-center">
        <h3 className="text-2xl font-bold mb-6 text-primary font-heading">גל פרידמן מלכה</h3>
        <div className="flex justify-center gap-6 mb-8 text-white/80">
          <a href="mailto:contact@example.com" className="hover:text-primary transition-colors">אימייל</a>
          <a href="tel:0523491792" className="hover:text-primary transition-colors" dir="ltr">052-3491792</a>
          <a href="https://wa.me/972523491792" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">וואטסאפ</a>
        </div>
        <div className="text-white/40 text-sm font-light">
          <p className="mb-2">מדיניות פרטיות: האתר אינו אוסף מידע למעט מה שנמסר בטופס לצורך יצירת קשר בלבד.</p>
          <p>© {new Date().getFullYear()} כל הזכויות שמורות לגל פרידמן מלכה.</p>
        </div>
      </div>
    </footer>
  );
}