import { ReactNode } from "react";
import { Label } from "@/components/retroui/Label";

interface FormFieldProps {
    label: string;
    htmlFor: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
}

export function FormField({
    label,
    htmlFor,
    error,
    required = false,
    children,
}: FormFieldProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={htmlFor}>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {children}
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
