import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check } from 'lucide-react';

interface BulkEditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: string, value: any, additionalData?: any) => Promise<void>;
  selectedTransactions: any[];
  categories: any[];
  accounts: any[];
  trips: any[];
  familyMembers: any[];
}

type EditableProperty = 'category' | 'account' | 'trip' | 'encord_expensable';

interface FamilyMember {
  id: string;
  name: string;
  color: string;
  status: string;
}

export function BulkEditTransactionModal({
  isOpen,
  onClose,
  onSave,
  selectedTransactions,
  categories,
  accounts,
  trips,
  familyMembers
}: BulkEditTransactionModalProps) {
  const [step, setStep] = useState<'property' | 'value' | 'family_member'>(
    'property'
  );
  const [selectedProperty, setSelectedProperty] = useState<EditableProperty | ''>('');
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Find Family Transfer category
  const familyTransferCategory = categories.find(cat => cat.name === 'Family Transfer');
  const needsFamilyMember = selectedProperty === 'category' && 
                           selectedValue === familyTransferCategory?.id;

  // Reset modal state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setStep('property');
      setSelectedProperty('');
      setSelectedValue('');
      setSelectedFamilyMember('');
    }
  }, [isOpen]);

  const handlePropertySelect = (property: string) => {
    setSelectedProperty(property as EditableProperty);
    setStep('value');
  };

  const handleValueSelect = (value: string) => {
    setSelectedValue(value);
    
    // If Family Transfer category is selected, we need to ask for family member
    if (selectedProperty === 'category' && value === familyTransferCategory?.id) {
      setStep('family_member');
    } else {
      // For other properties, we can proceed directly
      handleSave(value);
    }
  };

  const handleFamilyMemberSelect = (familyMemberId: string) => {
    setSelectedFamilyMember(familyMemberId);
  };

  const handleSave = async (value?: string, familyMemberId?: string) => {
    if (!selectedProperty) return;
    
    setLoading(true);
    
    try {
      const actualValue = value || selectedValue;
      const additionalData = needsFamilyMember ? {
        family_member_id: familyMemberId || selectedFamilyMember
      } : undefined;
      
      await onSave(selectedProperty, actualValue, additionalData);
      onClose();
    } catch (error) {
      console.error('Bulk edit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'family_member') {
      setStep('value');
    } else if (step === 'value') {
      setStep('property');
    }
  };

  const getPropertyLabel = (property: EditableProperty) => {
    const labels = {
      category: 'Category',
      account: 'Account', 
      trip: 'Trip',
      encord_expensable: 'Encord Expensable'
    };
    return labels[property];
  };

  const getValueLabel = (property: EditableProperty, valueId: string) => {
    switch (property) {
      case 'category':
        if (valueId === 'none') return 'No Category';
        const category = categories.find(c => c.id === valueId);
        return category?.name || 'Unknown Category';
      case 'account':
        if (valueId === 'none') return 'No Account';
        const account = accounts.find(a => a.id === valueId);
        return account?.name || 'Unknown Account';
      case 'trip':
        if (valueId === 'none') return 'No Trip';
        const trip = trips.find(t => t.id === valueId);
        return trip?.name || 'Unknown Trip';
      case 'encord_expensable':
        return valueId === 'true' ? 'Yes' : 'No';
      default:
        return valueId;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== 'property' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goBack}
                className="h-6 w-6 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            Bulk Edit {selectedTransactions.length} Transactions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Show selected transactions count */}
          <div className="text-sm text-muted-foreground">
            You are editing {selectedTransactions.length} selected transaction{selectedTransactions.length !== 1 ? 's' : ''}.
          </div>

          {/* Step 1: Property Selection */}
          {step === 'property' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Which property would you like to edit?</Label>
                <div className="grid gap-2">
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => handlePropertySelect('category')}
                  >
                    <div className="text-left">
                      <div className="font-medium">Category</div>
                      <div className="text-sm text-muted-foreground">
                        Change the category for selected transactions
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => handlePropertySelect('account')}
                  >
                    <div className="text-left">
                      <div className="font-medium">Account</div>
                      <div className="text-sm text-muted-foreground">
                        Change the account for selected transactions
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => handlePropertySelect('trip')}
                  >
                    <div className="text-left">
                      <div className="font-medium">Trip</div>
                      <div className="text-sm text-muted-foreground">
                        Assign or remove trip from selected transactions
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => handlePropertySelect('encord_expensable')}
                  >
                    <div className="text-left">
                      <div className="font-medium">Encord Expensable</div>
                      <div className="text-sm text-muted-foreground">
                        Change Encord expensable status
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Value Selection */}
          {step === 'value' && selectedProperty && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{getPropertyLabel(selectedProperty)}</Badge>
                <span>What value would you like to set?</span>
              </div>

              <div className="space-y-2">
                <Label>Select {getPropertyLabel(selectedProperty)}</Label>
                
                {selectedProperty === 'category' && (
                  <Select value={selectedValue} onValueChange={handleValueSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {selectedProperty === 'account' && (
                  <Select value={selectedValue} onValueChange={handleValueSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Account</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {selectedProperty === 'trip' && (
                  <Select value={selectedValue} onValueChange={handleValueSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trip" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Trip</SelectItem>
                      {trips.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {selectedProperty === 'encord_expensable' && (
                  <Select value={selectedValue} onValueChange={handleValueSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes - Encord Expensable</SelectItem>
                      <SelectItem value="false">No - Not Encord Expensable</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Family Member Selection (for Family Transfer category) */}
          {step === 'family_member' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{getPropertyLabel(selectedProperty)}</Badge>
                  <span>→</span>
                  <Badge variant="outline">{getValueLabel(selectedProperty, selectedValue)}</Badge>
                </div>
                <span>Since you selected Family Transfer, which family member?</span>
              </div>

              <div className="space-y-2">
                <Label>Select Family Member</Label>
                <Select value={selectedFamilyMember} onValueChange={handleFamilyMemberSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select family member" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: member.color }}
                          />
                          {member.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedFamilyMember && (
                <Button 
                  onClick={() => handleSave(selectedValue, selectedFamilyMember)}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating Transactions...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Update {selectedTransactions.length} Transactions
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Cancel button - always show */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}