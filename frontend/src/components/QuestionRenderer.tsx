import React from 'react';
import { Question } from '@/types/question';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  className?: string;
  error?: string;
}

export function QuestionRenderer({ 
  question, 
  value, 
  onChange, 
  className,
  error 
}: QuestionRendererProps) {
  
  const renderInput = () => {
    switch (question.type) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'SSN':
      case 'EIN':
      case 'ADDRESS':
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${question.text.toLowerCase()}`}
            className={cn(error && "border-destructive focus-visible:ring-destructive")}
          />
        );
        
      case 'NUMBER':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            className={cn(error && "border-destructive focus-visible:ring-destructive")}
          />
        );
        
      case 'CURRENCY':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(Number(e.target.value))}
              className={cn("pl-7", error && "border-destructive focus-visible:ring-destructive")}
            />
          </div>
        );
        
      case 'SELECT':
        return (
          <Select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(error && "border-destructive focus-visible:ring-destructive")}
          >
            <option value="" disabled>Select an option</option>
            {question.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        );
        
      case 'BOOLEAN':
        return (
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => onChange(true)}
              className={cn(
                "flex-1 px-4 py-3 rounded-lg border transition-all",
                value === true 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-background hover:bg-muted"
              )}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onChange(false)}
              className={cn(
                "flex-1 px-4 py-3 rounded-lg border transition-all",
                value === false 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-background hover:bg-muted"
              )}
            >
              No
            </button>
          </div>
        );

      case 'MULTI_SELECT':
        const currentValues = (Array.isArray(value) ? value : []) as string[];
        return (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {question.options?.map((opt) => {
              const isSelected = currentValues.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const newValue = isSelected
                      ? currentValues.filter(v => v !== opt.value)
                      : [...currentValues, opt.value];
                    onChange(newValue);
                  }}
                  className={cn(
                    "flex px-4 py-3 rounded-lg border text-left transition-all",
                    isSelected
                      ? "bg-primary/10 border-primary text-primary" 
                      : "bg-background hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "mr-3 h-5 w-5 rounded border border-primary flex items-center justify-center",
                    isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                  )}>
                    {isSelected && <span className="text-white text-xs">✓</span>}
                  </div>
                  {opt.label}
                </button>
              );
            })}
          </div>
        );
        
      default:
        return <div className="text-red-500">Unsupported question type: {question.type}</div>;
    }
  };

  return (
    <Card className={cn("w-full max-w-2xl mx-auto border-t-4 border-t-primary glass", className)}>
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          {question.text}
        </CardTitle>
        {question.helpText && (
          <CardDescription className="text-base text-gray-500">
            {question.helpText}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {renderInput()}
        {question.complianceNotes && (
          <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded flex items-center gap-2">
            <span className="text-blue-500">ⓘ</span> {question.complianceNotes}
          </p>
        )}
        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
