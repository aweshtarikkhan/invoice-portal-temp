import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Lock } from "lucide-react";

interface LimitReachedAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  title: string;
  description: string;
}

export function LimitReachedAlert({ isOpen, onClose, onUpgrade, title, description }: LimitReachedAlertProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto bg-amber-100 p-3 rounded-full mb-2">
            <Lock className="w-6 h-6 text-amber-600" />
          </div>
          <AlertDialogTitle className="text-center text-xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center flex-col sm:flex-row gap-2 mt-4">
          <AlertDialogCancel onClick={onClose} className="mt-0">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onUpgrade} className="bg-primary text-primary-foreground">
            Upgrade Plan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
