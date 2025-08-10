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

interface DeleteHoldingConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  holding: any;
  loading?: boolean;
}

export function DeleteHoldingConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  holding,
  loading = false,
}: DeleteHoldingConfirmDialogProps) {
  if (!holding) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>🗑️ Delete Holding</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to delete this holding? This action cannot
              be undone.
            </p>

            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <div>
                  <strong>Ticker:</strong> {holding.ticker}
                </div>
                <div>
                  <strong>Type:</strong> {holding.investment_type}
                </div>
                {holding.total_invested !== undefined && (
                  <div>
                    <strong>Total Invested:</strong> £
                    {Math.abs(holding.total_invested).toFixed(2)}
                  </div>
                )}
                {holding.transaction_count > 0 && (
                  <div>
                    <strong>Transactions:</strong> {holding.transaction_count}{" "}
                    linked
                  </div>
                )}
              </div>
            </div>

            {holding.transaction_count > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ <strong>Note:</strong> This holding has{" "}
                  {holding.transaction_count} linked transaction(s). Deleting
                  the holding will keep the transactions but remove their
                  investment association.
                </p>
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
            className="bg-destructive hover:bg-destructive/90 focus:ring-destructive"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              "Delete Holding"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
