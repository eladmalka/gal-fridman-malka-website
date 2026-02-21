import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useContent } from "@/lib/content-context";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(2, { message: "שם חייב להכיל לפחות 2 תווים" }),
  phone: z.string().regex(/^\d{10}$/, { message: "מספר טלפון חייב להכיל 10 ספרות" }),
  email: z.string().min(1, { message: "אימייל הוא שדה חובה" }).email({ message: "כתובת אימייל לא תקינה" }),
  status: z.string({ required_error: "נא לבחור סטטוס זוגי" }).min(1, { message: "נא לבחור סטטוס זוגי" }),
  goals: z.string().min(5, { message: "נא לפרט מה תרצו לשפר (לפחות 5 תווים)" }),
  contactMethod: z.enum(["phone", "whatsapp"], { required_error: "נא לבחור אופן יצירת קשר" }),
  agree: z.boolean().refine(val => val === true, {
    message: "חובה לאשר יצירת קשר",
  }),
});

export function Contact() {
  const { toast } = useToast();
  const { content } = useContent();
  const [showSuccess, setShowSuccess] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      status: "",
      goals: "",
      contactMethod: undefined as unknown as "phone" | "whatsapp",
      agree: false,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { agree, ...data } = values;
      await apiRequest("POST", "/api/leads", data);
    },
    onSuccess: () => {
      setShowSuccess(true);
      form.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "שליחת הפנייה נכשלה. נסי שוב מאוחר יותר.",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitMutation.mutate(values);
  }

  return (
    <section id="contact" className="py-24 bg-white flex justify-center">
      <div className="container px-4 max-w-2xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black mb-4">{content.contact.title}</h2>
          <p className="text-xl text-muted-foreground font-light text-center">
            {content.contact.subtitle}
          </p>
        </div>

        <div className="bg-background rounded-3xl p-8 shadow-xl shadow-primary/5 border border-border/50 mx-auto">
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
                        <Input placeholder="שם מלא" {...field} className="h-12 bg-white text-right" data-testid="input-name" />
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
                        <SelectTrigger className="h-12 bg-white" data-testid="select-status" dir="rtl">
                          <SelectValue placeholder="בחרי סטטוס" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent dir="rtl">
                        <SelectItem value="married">נשואה</SelectItem>
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
                        className="resize-none h-32 bg-white text-right" 
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
                name="contactMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>איך תרצי שאצור איתך קשר?</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-6 pt-2" dir="rtl">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="phone" id="contact-phone" data-testid="radio-phone" />
                          <Label htmlFor="contact-phone" className="cursor-pointer">שיחת טלפון</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="whatsapp" id="contact-whatsapp" data-testid="radio-whatsapp" />
                          <Label htmlFor="contact-whatsapp" className="cursor-pointer">הודעת וואטסאפ</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agree"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md p-4 bg-white/50 border border-border/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-agree"
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        אני מאשרת יצירת קשר ושליחת הודעות
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-14 text-lg rounded-full shadow-md hover:shadow-lg transition-shadow" 
                data-testid="btn-submit-form"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? "שולח..." : "שלחי פנייה"}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent dir="rtl" className="max-w-md text-center">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-center">איזה כיף!</AlertDialogTitle>
            <AlertDialogDescription className="text-base mt-2 text-center">
              הפניה נשלחה בהצלחה
              <br />
              אחזור אליך בהקדם :-)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center sm:justify-center">
            <AlertDialogAction onClick={() => setShowSuccess(false)} data-testid="btn-close-success">סגור</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
