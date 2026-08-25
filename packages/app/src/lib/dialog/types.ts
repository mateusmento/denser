export type PromptOptions = {
  title: string;
  description?: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type PromptRequest = {
  kind: "prompt";
  options: PromptOptions;
  resolve: (value: string | null) => void;
};

type ConfirmRequest = {
  kind: "confirm";
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

export type DialogRequest = PromptRequest | ConfirmRequest;
