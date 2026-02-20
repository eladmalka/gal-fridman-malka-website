import img from "@/assets/images/gallery-1.jpg";

export function Benefits() {
  return (
    <section className="py-24 bg-white">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">למה נומרולוגיה ואימון זוגי עובדים כל כך טוב ביחד?</h2>
          <p className="text-xl text-muted-foreground font-light leading-relaxed">
            כשמשלבים אבחון מדויק עם כלים מעשיים, התהליך הופך להיות ברור, קצר ואפקטיבי הרבה יותר.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div className="space-y-8 pr-0 md:pr-8">
            <div className="flex gap-4">
              <div className="text-4xl text-primary font-black opacity-30">01</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">זיהוי מהיר של שורש הבעיה</h3>
                <p className="text-muted-foreground leading-relaxed font-light">במקום שבועות של שיחות בניסיון להבין "מה לא עובד", המפה הנומרולוגית משקפת באופן צלול את דפוסי התקשורת והטריגרים של כל אחד מכם.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="text-4xl text-primary font-black opacity-30">02</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">הפיכת תובנות להסכמות</h3>
                <p className="text-muted-foreground leading-relaxed font-light">להבין זה חשוב, אבל זה לא מספיק. כאן נכנס האימון הזוגי שלוקח את ההבנות מהמפה והופך אותן לגבולות בריאים, שגרה מיטיבה והסכמות מעשיות ליומיום.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="text-4xl text-primary font-black opacity-30">03</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">צמיחה אישית מתוך הקשר</h3>
                <p className="text-muted-foreground leading-relaxed font-light">התהליך מאפשר לכל אחד להיות הגרסה הטובה ביותר של עצמו, ולהבין איך המסע האישי שלו תורם או מאתגר את המערכת הזוגית כולה.</p>
              </div>
            </div>
          </div>
          
          <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-primary/10 z-10 mix-blend-multiply"></div>
            <img src={img} alt="חדר טיפולים" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}