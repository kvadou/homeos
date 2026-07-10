import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ItemData {
  name: string;
  category: string;
  room?: { name: string } | null;
  brand?: string | null;
  model?: string | null;
  purchaseDate?: Date | string | null;
  purchasePrice?: number | null;
  warrantyExpiry?: Date | string | null;
  condition?: string | null;
}

interface HomeData {
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}

interface ReportOptions {
  includeWarranties: boolean;
  includePrices: boolean;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatAddress(home: HomeData): string {
  const parts = [home.address, home.city, home.state, home.zipCode].filter(
    Boolean
  );
  return parts.join(", ") || "No address";
}

export function generateInsuranceReport(
  home: HomeData,
  items: ItemData[],
  options: ReportOptions
): Uint8Array {
  const doc = new jsPDF();
  const navy = "#0A2E4D";
  const teal = "#00B4A0";
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(navy);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor("#FFFFFF");
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("HomeOS Insurance Report", 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(home.name, 14, 30);
  doc.text(formatAddress(home), 14, 36);

  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFontSize(9);
  doc.text(`Generated: ${generatedDate}`, pageWidth - 14, 30, {
    align: "right",
  });

  // Teal accent line
  doc.setFillColor(teal);
  doc.rect(0, 40, pageWidth, 2, "F");

  // Build table columns
  const columns: string[] = [
    "Item Name",
    "Category",
    "Room",
    "Brand / Model",
    "Purchase Date",
  ];
  if (options.includePrices) columns.push("Purchase Price");
  if (options.includeWarranties) columns.push("Warranty Expiry");
  columns.push("Condition");

  // Build table rows
  const rows = items.map((item) => {
    const row: string[] = [
      item.name,
      item.category,
      item.room?.name ?? "Unassigned",
      [item.brand, item.model].filter(Boolean).join(" / ") || "N/A",
      formatDate(item.purchaseDate),
    ];
    if (options.includePrices) row.push(formatCurrency(item.purchasePrice));
    if (options.includeWarranties) row.push(formatDate(item.warrantyExpiry));
    row.push(item.condition ?? "N/A");
    return row;
  });

  autoTable(doc, {
    startY: 48,
    head: [columns],
    body: rows,
    theme: "striped",
    headStyles: {
      fillColor: navy,
      textColor: "#FFFFFF",
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: "#333333",
    },
    alternateRowStyles: {
      fillColor: "#F5F8FA",
    },
    styles: {
      cellPadding: 3,
      overflow: "linebreak",
    },
    margin: { left: 14, right: 14 },
  });

  // Summary section
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY ?? 200;
  const summaryY = finalY + 12;

  doc.setFillColor("#F0F4F8");
  doc.roundedRect(14, summaryY, pageWidth - 28, 30, 3, 3, "F");

  doc.setTextColor(navy);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 20, summaryY + 10);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Items: ${items.length}`, 20, summaryY + 18);

  if (options.includePrices) {
    const totalValue = items.reduce(
      (sum, item) => sum + (item.purchasePrice ?? 0),
      0
    );
    doc.text(
      `Total Estimated Value: ${formatCurrency(totalValue)}`,
      20,
      summaryY + 24
    );
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor("#999999");
    doc.text(
      `HomeOS Insurance Report - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  const arrayBuffer = doc.output("arraybuffer");
  return new Uint8Array(arrayBuffer);
}
