import { ChangeEvent } from "react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X as XIcon, Plus as PlusIcon } from "lucide-react";

export type LineItem = {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
};

interface LineItemsTableProps {
  items: LineItem[];
  onItemsChange: (items: LineItem[]) => void;
  readOnly?: boolean;
  errors?: Record<string, string>;
}

export default function LineItemsTable({ 
  items, 
  onItemsChange, 
  readOnly = false,
  errors = {}
}: LineItemsTableProps) {
  // Handle input change
  const handleInputChange = (
    index: number,
    field: keyof LineItem,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const newItems = [...items];
    
    if (field === 'description') {
      newItems[index][field] = e.target.value;
    } else {
      const value = parseFloat(e.target.value) || 0;
      newItems[index][field] = value;
      
      // Recalculate amount
      if (field === 'quantity' || field === 'rate') {
        newItems[index].amount = 
          parseFloat((newItems[index].quantity * newItems[index].rate).toFixed(2));
      }
    }
    
    onItemsChange(newItems);
  };

  // Add a new line item
  const addLineItem = () => {
    onItemsChange([
      ...items,
      { description: '', quantity: 1, rate: 0, amount: 0 }
    ]);
  };

  // Remove a line item
  const removeLineItem = (index: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      onItemsChange(newItems);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Description</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Amount</TableHead>
              {!readOnly && <TableHead className="w-[80px]"><span className="sr-only">Actions</span></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  {readOnly ? (
                    item.description
                  ) : (
                    <Input
                      value={item.description}
                      onChange={(e) => handleInputChange(index, 'description', e)}
                      placeholder="Description"
                      className={errors[`lineItems.${index}.description`] ? "border-red-500" : ""}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    item.quantity
                  ) : (
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleInputChange(index, 'quantity', e)}
                      placeholder="Qty"
                      className={`max-w-[100px] ${errors[`lineItems.${index}.quantity`] ? "border-red-500" : ""}`}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    `$${formatCurrency(item.rate)}`
                  ) : (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => handleInputChange(index, 'rate', e)}
                      placeholder="0.00"
                      className={`max-w-[100px] ${errors[`lineItems.${index}.rate`] ? "border-red-500" : ""}`}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    `$${formatCurrency(item.amount)}`
                  ) : (
                    <Input
                      value={`$${formatCurrency(item.amount)}`}
                      readOnly
                      className="bg-gray-100 max-w-[120px]"
                    />
                  )}
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      disabled={items.length <= 1}
                      className="h-8 w-8 text-gray-500 hover:text-red-600"
                    >
                      <XIcon className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {!readOnly && (
        <div className="mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLineItem}
            className="text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Line Item
          </Button>
        </div>
      )}
    </div>
  );
}
