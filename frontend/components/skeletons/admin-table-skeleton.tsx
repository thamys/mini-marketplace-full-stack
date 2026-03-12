import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AdminTableSkeletonProps {
  columns: string[];
  rows?: number;
}

export function AdminTableSkeleton({ columns, rows = 5 }: AdminTableSkeletonProps) {
  return (
    <div className="rounded-xl border bg-card shadow-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {columns.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              {columns.map((col) => (
                <TableCell key={col}>
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
