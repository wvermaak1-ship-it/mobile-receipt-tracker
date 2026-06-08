import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { formatOMR, roundOMR } from "@/lib/format-omr";
import type { LedgerExportRow } from "./ledger-data";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 8, fontWeight: "bold" },
  subtitle: { fontSize: 10, marginBottom: 16, color: "#64748b" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingVertical: 4 },
  header: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#0d9488", paddingBottom: 6, marginBottom: 4, fontWeight: "bold" },
  col1: { width: "10%" },
  col2: { width: "28%" },
  col3: { width: "16%" },
  col4: { width: "18%", textAlign: "right" },
  col5: { width: "18%", textAlign: "right" },
  col6: { width: "10%" },
  footer: { marginTop: 16, fontWeight: "bold", fontSize: 11 },
});

function LedgerDocument({ rows }: { rows: LedgerExportRow[] }) {
  let running = 0;
  const grandTotal = roundOMR(rows.reduce((s, r) => s + Number(r.amount), 0));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Master Ledger — Trip Expenses</Text>
        <Text style={styles.subtitle}>Exported {new Date().toLocaleString()} · Currency: OMR</Text>
        <View style={styles.header}>
          <Text style={styles.col1}>Serial</Text>
          <Text style={styles.col2}>Employee</Text>
          <Text style={styles.col3}>Date</Text>
          <Text style={styles.col4}>Amount</Text>
          <Text style={styles.col5}>Running</Text>
          <Text style={styles.col6}>Rcpt</Text>
        </View>
        {rows.map((row) => {
          running = roundOMR(running + Number(row.amount));
          return (
            <View key={row.id} style={styles.row}>
              <Text style={styles.col1}>{row.serial_number}</Text>
              <Text style={styles.col2}>{row.employee_name}</Text>
              <Text style={styles.col3}>{row.purchase_date}</Text>
              <Text style={styles.col4}>{formatOMR(row.amount)}</Text>
              <Text style={styles.col5}>{formatOMR(running)}</Text>
              <Text style={styles.col6}>{row.receipt_path ? "Y" : "N"}</Text>
            </View>
          );
        })}
        <Text style={styles.footer}>Total (OMR): {formatOMR(grandTotal)}</Text>
      </Page>
    </Document>
  );
}

export async function buildLedgerPdf(rows: LedgerExportRow[]): Promise<Buffer> {
  const blob = await pdf(<LedgerDocument rows={rows} />).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
