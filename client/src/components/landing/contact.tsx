import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, { message: "שם חייב להכיל לפחות 2 תווים" }),
  phone: z.string().min(9, { message: "מספר טלפון לא תקין" }),
  email: z.string().email({ message: "כתובת אימייל לא תקינה" }),
  status: z.string({ required_error: "נא לבחור סטטוס זוגי" }),
  goals: z.string().min(5, { message: "נא לפרט מה תרצו לשפר" }),
  agree: z.boolean().refine(val => val === true, {
    message: "חובה לאשר יצירת קשר",
  }),
});

export function Contact() {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      goals: "",
      agree: false,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Mock submission:", values);
    toast({
      title: "הפנייה נשלחה בהצלחה!",
      description: "אחזור אלייך בהקדם האפשרי.",
    });
    form.reset();
  }

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="container px-4 max-w-2xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black mb-4">בואי נתחיל</h2>
          <p className="text-xl text-muted-foreground font-light">
            השאירי פרטים לשיחת היכרות קצרה ללא עלות
          </p>
        </div>

        <div className="bg-background rounded-3xl p-8 shadow-xl shadow-primary/5 border border-border/50">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>שם מלא</FormLabel>
                      <FormControl>
                        <Input placeholder="שם מלא" {...field} className="h-12 bg-white" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>טלפון</FormLabel>
                      <FormControl>
                        <Input placeholder="05x-xxxxxxx" {...field} className="h-12 bg-white text-right" dir="ltr" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>אימייל</FormLabel>
                    <FormControl>
                      <Input placeholder="your@email.com" {...field} className="h-12 bg-white text-right" dir="ltr" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סטטוס זוגי</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-white" data-testid="select-status">
                          <SelectValue placeholder="בחרי סטטוס" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="married">נשואים</SelectItem>
                        <SelectItem value="relationship">בזוגיות</SelectItem>
                        <SelectItem value="single">רווקה</SelectItem>
                        <SelectItem value="other">אחר</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מה תרצי לשפר?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="כמה מילים על מה שהביא אותך לכאן..." 
                        className="resize-none h-32 bg-white" 
                        {...field} 
                        data-testid="textarea-goals"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agree"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0 rounded-md p-4 bg-white/50 border border-border/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-agree"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        אני מאשרת יצירת קשר ושליחת הודעות
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-14 text-lg rounded-full shadow-md hover:shadow-lg transition-shadow" data-testid="btn-submit-form">
                שלחי פנייה
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}