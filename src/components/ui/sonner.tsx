import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "!bg-green-500 !text-white !border-green-600 [&_[data-description]]:!text-white/90 [&_[data-title]]:!text-white [&>svg]:!text-white",
          error: "!bg-red-500 !text-white !border-red-600 [&_[data-description]]:!text-white/90 [&_[data-title]]:!text-white [&>svg]:!text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };