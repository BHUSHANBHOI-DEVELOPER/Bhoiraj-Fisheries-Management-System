export type ExportMember = {
  membership_number: string; full_name: string; phone: string; email: string;
  village: string; status: string; join_date: string;
};

const rows = (members: ExportMember[]) => members.map((m) => ({
  "Membership No.": m.membership_number, Name: m.full_name, Mobile: m.phone,
  Email: m.email, Village: m.village, Status: m.status, "Join Date": m.join_date,
}));

export async function exportMembersExcel(members: ExportMember[]) {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.json_to_sheet(rows(members));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Members");
  XLSX.writeFile(book, "bhoiraj-members.xlsx");
}

export async function exportMembersPdf(members: ExportMember[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  doc.setFontSize(15); doc.text("Bhoiraj Matsya Sanstha — Member Register", 14, 16);
  doc.setFontSize(9);
  members.forEach((m, i) => doc.text(`${i + 1}. ${m.membership_number} | ${m.full_name} | ${m.phone} | ${m.village}`, 14, 26 + i * 7));
  doc.save("bhoiraj-members.pdf");
}

export async function exportMembersDoc(members: ExportMember[]) {
  const { Document, Packer, Paragraph, Table, TableCell, TableRow } = await import("docx");
  const table = new Table({ rows: [
    new TableRow({ children: ["Membership No.", "Name", "Mobile", "Village", "Status"].map((v) => new TableCell({ children: [new Paragraph(v)] })) }),
    ...members.map((m) => new TableRow({ children: [m.membership_number, m.full_name, m.phone, m.village, m.status].map((v) => new TableCell({ children: [new Paragraph(v)] })) })),
  ] });
  const doc = new Document({ sections: [{ children: [new Paragraph("Bhoiraj Matsya Sanstha — Member Register"), table] }] });
  const blob = await Packer.toBlob(doc);
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "bhoiraj-members.docx"; a.click(); URL.revokeObjectURL(a.href);
}