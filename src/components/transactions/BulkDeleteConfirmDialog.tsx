import React from "react";
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
import { Badge } from "@/components/ui/badge";

interface BulkDeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedTransactions: any[];
  loading?: boolean;
}

export function BulkDeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedTransactions,
  loading = false,
}: BulkDeleteConfirmDialogProps) {
  // Show first 3 transaction descriptions as examples
  const sampleTransactions = selectedTransactions.slice(0, 3);
  const remainingCount = selectedTransactions.length - 3;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            Delete Multiple Transactions
            <Badge variant="destructive">{selectedTransactions.length}</Badge>
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {selectedTransactions.length}{" "}
            selected transaction{selectedTransactions.length !== 1 ? "s" : ""}?
            This action cannot be undone.
            {selectedTransactions.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Transactions to be deleted:
                </div>
                <div className="space-y-1">
                  {sampleTransactions.map((transaction, index) => (
                    <div
                      key={transaction.id}
                      className="text-xs text-gray-600 flex items-center gap-2"
                    >
                      <span className="font-mono text-gray-400">
                        {new Date(transaction.date).toLocaleDateString()}
                      </span>
                      <span className="truncate max-w-48">
                        {transaction.description || "No description"}
                      </span>
                      <span className="font-mono text-red-600">
                        £{Math.abs(transaction.amount_gbp || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {remainingCount > 0 && (
                    <div className="text-xs text-gray-500 italic">
                      ... and {remainingCount} more transaction
                      {remainingCount !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                Delete {selectedTransactions.length} Transaction
                {selectedTransactions.length !== 1 ? "s" : ""}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
