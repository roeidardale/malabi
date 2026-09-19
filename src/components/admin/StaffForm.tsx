import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";

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
      <div>
        <Label htmlFor="name">שם</Label>
        <Input id="name" name="name" required />
      </div>

      <div>
        <Label htmlFor="email">אימייל</Label>
        <Input id="email" name="email" type="email" autoComplete="off" required />
      </div>

      <div>
        <Label htmlFor="password">סיסמה</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <div>
        <Label htmlFor="role">תפקיד</Label>
        <Select id="role" name="role" defaultValue="DRIVER">
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <Button type="submit" variant="primary" className="mt-2 self-start">
        יצירת חשבון
      </Button>
    </form>
  );
}
