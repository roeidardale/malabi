import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Select } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "OWNER", label: "בעלים / מנהל כללי" },
  { value: "DELIVERY_MANAGER", label: "מנהל משלוחים" },
  { value: "DRIVER", label: "נהג" },
];

export function StaffForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <FormField id="name" label="שם">
        <Input name="name" required />
      </FormField>

      <FormField id="email" label="אימייל">
        <Input name="email" type="email" autoComplete="off" required />
      </FormField>

      <FormField id="password" label="סיסמה" hint="לפחות 8 תווים">
        <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
      </FormField>

      <FormField id="role" label="תפקיד">
        <Select name="role" defaultValue="DRIVER">
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </FormField>

      <SubmitButton pendingLabel="יוצר..." className="mt-2 self-start">
        יצירת חשבון
      </SubmitButton>
    </form>
  );
}
