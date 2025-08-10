import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { TransactionUploadModal } from "./TransactionUploadModal";

interface TransactionUploadButtonProps {
  onTransactionsUploaded?: () => void;
  className?: string;
}

export function TransactionUploadButton({
  onTransactionsUploaded,
  className,
}: TransactionUploadButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTransactionsUploaded = () => {
    setIsModalOpen(false);
    onTransactionsUploaded?.();
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className={className}
        size="sm"
      >
        <Upload className="h-4 w-4 mr-2" />
        Upload Transactions
      </Button>

      <TransactionUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionsUploaded={handleTransactionsUploaded}
      />
    </>
  );
}
